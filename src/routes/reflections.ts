import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { reflectionService } from '../services/reflection.service';
import { formatErrorResponse } from '../lib/errors';

const createReflectionSchema = z.object({
  memberId: z.string().uuid(),
  title: z.string().optional(),
  content: z.string().min(1),
  mood: z.string().optional(),
  isPrivate: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

const updateReflectionSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  mood: z.string().optional(),
  isPrivate: z.boolean().optional(),
});

const reflections: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', async (request, reply) => {
    try {
      const body = createReflectionSchema.parse(request.body);
      const reflection = await reflectionService.createReflection(body);
      return reply.code(201).send(reflection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }
      const formatted = formatErrorResponse(error as Error);
      return reply.code(formatted.statusCode).send(formatted);
    }
  });

  fastify.get('/member/:memberId', async (request, reply) => {
    try {
      const { memberId } = request.params as { memberId: string };
      const { limit, offset } = request.query as { limit?: string; offset?: string };
      const reflections = await reflectionService.getMemberReflections(
        memberId,
        limit ? parseInt(limit) : 50,
        offset ? parseInt(offset) : 0,
      );
      return reply.send(reflections);
    } catch (error) {
      const formatted = formatErrorResponse(error as Error);
      return reply.code(formatted.statusCode).send(formatted);
    }
  });

  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const reflection = await reflectionService.getReflection(id);
      return reply.send(reflection);
    } catch (error) {
      const formatted = formatErrorResponse(error as Error);
      return reply.code(formatted.statusCode).send(formatted);
    }
  });

  fastify.patch('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = updateReflectionSchema.parse(request.body);
      const reflection = await reflectionService.updateReflection(id, body);
      return reply.send(reflection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }
      const formatted = formatErrorResponse(error as Error);
      return reply.code(formatted.statusCode).send(formatted);
    }
  });

  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await reflectionService.deleteReflection(id);
      return reply.send(result);
    } catch (error) {
      const formatted = formatErrorResponse(error as Error);
      return reply.code(formatted.statusCode).send(formatted);
    }
  });
};

export default reflections;
