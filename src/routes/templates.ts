import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { templateService } from '../services/template.service';
import { formatErrorResponse } from '../lib/errors';

const createTemplateSchema = z.object({
  coachPersonaId: z.string().uuid().optional(),
  key: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  category: z.string(),
  prompts: z.array(z.object({
    text: z.string(),
    type: z.enum(['question', 'reflection', 'action']),
  })),
  estimatedDuration: z.number().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});

const templates: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', async (request, reply) => {
    try {
      const body = createTemplateSchema.parse(request.body);
      const template = await templateService.createTemplate(body);
      return reply.code(201).send(template);
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
      const { category, difficulty } = request.query as { category?: string; difficulty?: string };
      const templates = await templateService.getAllTemplates({ category, difficulty });
      return reply.send(templates);
    } catch (error) {
      const formatted = formatErrorResponse(error as Error);
      return reply.code(formatted.statusCode).send(formatted);
    }
  });

  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const template = await templateService.getTemplate(id);
      return reply.send(template);
    } catch (error) {
      const formatted = formatErrorResponse(error as Error);
      return reply.code(formatted.statusCode).send(formatted);
    }
  });
};

export default templates;
