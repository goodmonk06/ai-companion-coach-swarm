import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { tagService } from '../services/tag.service';
import { formatErrorResponse } from '../lib/errors';

const createTagSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  category: z.string().optional(),
});

const tagEntitySchema = z.object({
  entityId: z.string().uuid(),
  tagId: z.string().uuid(),
  memberId: z.string().uuid(),
  entityType: z.enum(['session', 'goal', 'reflection']),
});

const tags: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', async (request, reply) => {
    try {
      const body = createTagSchema.parse(request.body);
      const tag = await tagService.createTag(body);
      return reply.code(201).send(tag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }
      const formatted = formatErrorResponse(error as Error);
      return reply.code(formatted.statusCode).send(formatted);
    }
  });

  fastify.get('/', async (request, reply) => {
    try {
      const { category } = request.query as { category?: string };
      const tags = await tagService.getAllTags(category);
      return reply.send(tags);
    } catch (error) {
      const formatted = formatErrorResponse(error as Error);
      return reply.code(formatted.statusCode).send(formatted);
    }
  });

  fastify.post('/tag-entity', async (request, reply) => {
    try {
      const body = tagEntitySchema.parse(request.body);
      let result;
      
      if (body.entityType === 'session') {
        result = await tagService.tagSession(body.entityId, body.tagId, body.memberId);
      } else if (body.entityType === 'goal') {
        result = await tagService.tagGoal(body.entityId, body.tagId, body.memberId);
      } else {
        result = await tagService.tagReflection(body.entityId, body.tagId, body.memberId);
      }
      
      return reply.code(201).send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }
      const formatted = formatErrorResponse(error as Error);
      return reply.code(formatted.statusCode).send(formatted);
    }
  });
};

export default tags;
