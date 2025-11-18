import { prisma } from '../lib/prisma';
import { eventBus, EventTypes, createEvent } from '../lib/events';
import { logger } from '../lib/logger';
import { metrics, MetricNames } from '../lib/metrics';
import { NotFoundError } from '../lib/errors';
import { CreateTemplateRequest, SessionPrompt } from '../types';

export class TemplateService {
  async createTemplate(request: CreateTemplateRequest) {
    logger.info('Creating session template', { key: request.key });

    const prompts: SessionPrompt[] = request.prompts.map((p, index) => ({
      ...p,
      order: index,
    }));

    const template = await prisma.sessionTemplate.create({
      data: {
        coachPersonaId: request.coachPersonaId,
        key: request.key,
        title: request.title,
        description: request.description,
        category: request.category,
        promptsJson: prompts,
        estimatedDuration: request.estimatedDuration || 30,
        difficulty: request.difficulty || 'beginner',
      },
      include: {
        coachPersona: true,
      },
    });

    await eventBus.emit(createEvent(EventTypes.TEMPLATE_CREATED, { templateId: template.id }));

    return { ...template, prompts: template.promptsJson as SessionPrompt[] };
  }

  async getTemplate(id: string) {
    const template = await prisma.sessionTemplate.findUnique({
      where: { id },
      include: { coachPersona: true },
    });

    if (!template) {
      throw new NotFoundError('Template', id);
    }

    return { ...template, prompts: template.promptsJson as SessionPrompt[] };
  }

  async getAllTemplates(filters?: { category?: string; difficulty?: string }) {
    const where: any = { isPublic: true };

    if (filters?.category) where.category = filters.category;
    if (filters?.difficulty) where.difficulty = filters.difficulty;

    const templates = await prisma.sessionTemplate.findMany({
      where,
      include: { coachPersona: true },
      orderBy: { usageCount: 'desc' },
    });

    return templates.map(t => ({ ...t, prompts: t.promptsJson as SessionPrompt[] }));
  }

  async incrementUsage(id: string) {
    const template = await prisma.sessionTemplate.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });

    await eventBus.emit(createEvent(EventTypes.TEMPLATE_USED, { templateId: id }));
    metrics.incrementCounter(MetricNames.TEMPLATE_USED, 1, { templateId: id });

    return template;
  }
}

export const templateService = new TemplateService();
