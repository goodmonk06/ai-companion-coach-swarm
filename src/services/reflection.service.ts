import { prisma } from '../lib/prisma';
import { eventBus, createReflectionCreatedEvent, EventTypes, createEvent } from '../lib/events';
import { logger } from '../lib/logger';
import { metrics, MetricNames } from '../lib/metrics';
import { NotFoundError } from '../lib/errors';
import { CreateReflectionRequest, UpdateReflectionRequest, SearchReflectionsRequest } from '../types';

export class ReflectionService {
  async createReflection(request: CreateReflectionRequest) {
    logger.info('Creating reflection', { memberId: request.memberId });

    const reflection = await prisma.reflection.create({
      data: {
        memberId: request.memberId,
        title: request.title,
        content: request.content,
        mood: request.mood,
        isPrivate: request.isPrivate || false,
      },
      include: {
        member: true,
        tags: { include: { tag: true } },
      },
    });

    // Add tags if provided
    if (request.tags && request.tags.length > 0) {
      for (const tagName of request.tags) {
        const tag = await prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });

        await prisma.reflectionTag.create({
          data: {
            reflectionId: reflection.id,
            tagId: tag.id,
            memberId: request.memberId,
          },
        });
      }
    }

    await eventBus.emit(createReflectionCreatedEvent(reflection.id, request.memberId));
    metrics.incrementCounter(MetricNames.REFLECTION_CREATED, 1);

    return reflection;
  }

  async getReflection(id: string) {
    const reflection = await prisma.reflection.findUnique({
      where: { id },
      include: {
        member: true,
        tags: { include: { tag: true } },
      },
    });

    if (!reflection) {
      throw new NotFoundError('Reflection', id);
    }

    return reflection;
  }

  async getMemberReflections(memberId: string, limit: number = 50, offset: number = 0) {
    return prisma.reflection.findMany({
      where: { memberId },
      include: { tags: { include: { tag: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async searchReflections(request: SearchReflectionsRequest) {
    const where: any = { memberId: request.memberId };

    if (request.mood) where.mood = request.mood;
    if (request.startDate) where.createdAt = { gte: new Date(request.startDate) };
    if (request.endDate) where.createdAt = { ...where.createdAt, lte: new Date(request.endDate) };

    // Simple text search in content
    if (request.query) {
      where.content = { contains: request.query, mode: 'insensitive' };
    }

    return prisma.reflection.findMany({
      where,
      include: { tags: { include: { tag: true } } },
      orderBy: { createdAt: 'desc' },
      take: request.limit || 50,
      skip: request.offset || 0,
    });
  }

  async updateReflection(id: string, request: UpdateReflectionRequest) {
    const reflection = await prisma.reflection.update({
      where: { id },
      data: request,
      include: { tags: { include: { tag: true } } },
    });

    await eventBus.emit(createEvent(EventTypes.REFLECTION_UPDATED, { reflectionId: id }));

    return reflection;
  }

  async deleteReflection(id: string) {
    await this.getReflection(id);

    await prisma.reflection.delete({ where: { id } });

    await eventBus.emit(createEvent(EventTypes.REFLECTION_DELETED, { reflectionId: id }));

    return { success: true };
  }
}

export const reflectionService = new ReflectionService();
