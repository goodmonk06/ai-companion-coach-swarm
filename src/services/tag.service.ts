import { prisma } from '../lib/prisma';
import { eventBus, EventTypes, createEvent } from '../lib/events';
import { logger } from '../lib/logger';
import { NotFoundError, ValidationError } from '../lib/errors';
import { CreateTagRequest } from '../types';

export class TagService {
  async createTag(request: CreateTagRequest) {
    logger.info('Creating tag', { name: request.name });

    const tag = await prisma.tag.create({
      data: {
        name: request.name,
        color: request.color || '#3B82F6',
        category: request.category,
      },
    });

    await eventBus.emit(createEvent(EventTypes.TAG_CREATED, { tagId: tag.id, name: tag.name }));

    return tag;
  }

  async getAllTags(category?: string) {
    const where = category ? { category } : {};

    return prisma.tag.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async getTag(id: string) {
    const tag = await prisma.tag.findUnique({ where: { id } });

    if (!tag) {
      throw new NotFoundError('Tag', id);
    }

    return tag;
  }

  async tagSession(sessionId: string, tagId: string, memberId: string) {
    const session = await prisma.coachingSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundError('Session', sessionId);

    const tag = await this.getTag(tagId);

    const sessionTag = await prisma.sessionTag.create({
      data: {
        sessionId,
        tagId,
        memberId,
      },
      include: { tag: true },
    });

    await eventBus.emit(createEvent(EventTypes.ENTITY_TAGGED, { entityType: 'session', entityId: sessionId, tagId }));

    return sessionTag;
  }

  async tagGoal(goalId: string, tagId: string, memberId: string) {
    const goal = await prisma.coachingGoal.findUnique({ where: { id: goalId } });
    if (!goal) throw new NotFoundError('Goal', goalId);

    const tag = await this.getTag(tagId);

    const goalTag = await prisma.goalTag.create({
      data: {
        goalId,
        tagId,
        memberId,
      },
      include: { tag: true },
    });

    await eventBus.emit(createEvent(EventTypes.ENTITY_TAGGED, { entityType: 'goal', entityId: goalId, tagId }));

    return goalTag;
  }

  async tagReflection(reflectionId: string, tagId: string, memberId: string) {
    const reflection = await prisma.reflection.findUnique({ where: { id: reflectionId } });
    if (!reflection) throw new NotFoundError('Reflection', reflectionId);

    const tag = await this.getTag(tagId);

    const reflectionTag = await prisma.reflectionTag.create({
      data: {
        reflectionId,
        tagId,
        memberId,
      },
      include: { tag: true },
    });

    await eventBus.emit(createEvent(EventTypes.ENTITY_TAGGED, { entityType: 'reflection', entityId: reflectionId, tagId }));

    return reflectionTag;
  }

  async untagSession(sessionId: string, tagId: string) {
    await prisma.sessionTag.deleteMany({
      where: { sessionId, tagId },
    });

    await eventBus.emit(createEvent(EventTypes.ENTITY_UNTAGGED, { entityType: 'session', entityId: sessionId, tagId }));

    return { success: true };
  }
}

export const tagService = new TagService();
