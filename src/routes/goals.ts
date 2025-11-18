import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { goalService } from '../services/goal.service';
import { formatErrorResponse } from '../lib/errors';

const createGoalSchema = z.object({
  memberId: z.string().uuid(),
  coachPersonaId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  targetDate: z.string().datetime().optional(),
  milestones: z.array(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    targetDate: z.string().datetime().optional(),
  })).optional(),
});

const updateGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'PAUSED', 'ABANDONED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  targetDate: z.string().datetime().optional(),
  progress: z.number().min(0).max(100).optional(),
});

const updateProgressSchema = z.object({
  progress: z.number().min(0).max(100),
  note: z.string().optional(),
});

const addMilestoneSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  targetDate: z.string().datetime().optional(),
});

const goals: FastifyPluginAsync = async (fastify) => {
  // Create a new goal
  fastify.post('/', async (request, reply) => {
    try {
      const body = createGoalSchema.parse(request.body);
      const goal = await goalService.createGoal(body);
      return reply.code(201).send(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }
      const formatted = formatErrorResponse(error as Error);
      return reply.code(formatted.statusCode).send(formatted);
    }
  });

  // Get all goals for a member
  fastify.get('/member/:memberId', async (request, reply) => {
    try {
      const { memberId } = request.params as { memberId: string };
      const { status, priority, coachPersonaId } = request.query as {
        status?: string;
        priority?: string;
        coachPersonaId?: string;
      };

      const goals = await goalService.getMemberGoals(memberId, {
        status: status as any,
        priority,
        coachPersonaId,
      });

      return reply.send(goals);
    } catch (error) {
      const formatted = formatErrorResponse(error as Error);
      return reply.code(formatted.statusCode).send(formatted);
    }
  });

  // Get a specific goal
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const goal = await goalService.getGoal(id);
      return reply.send(goal);
    } catch (error) {
      const formatted = formatErrorResponse(error as Error);
      return reply.code(formatted.statusCode).send(formatted);
    }
  });

  // Update a goal
  fastify.patch('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = updateGoalSchema.parse(request.body);
      const goal = await goalService.updateGoal(id, body);
      return reply.send(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }
      const formatted = formatErrorResponse(error as Error);
      return reply.code(formatted.statusCode).send(formatted);
    }
  });

  // Update goal progress
  fastify.post('/:id/progress', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = updateProgressSchema.parse(request.body);
      const goal = await goalService.updateProgress(id, body);
      return reply.send(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }
      const formatted = formatErrorResponse(error as Error);
      return reply.code(formatted.statusCode).send(formatted);
    }
  });

  // Add a milestone
  fastify.post('/:id/milestones', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = addMilestoneSchema.parse(request.body);
      const goal = await goalService.addMilestone(id, body);
      return reply.send(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }
      const formatted = formatErrorResponse(error as Error);
      return reply.code(formatted.statusCode).send(formatted);
    }
  });

  // Complete a milestone
  fastify.post('/:id/milestones/:milestoneId/complete', async (request, reply) => {
    try {
      const { id, milestoneId } = request.params as { id: string; milestoneId: string };
      const goal = await goalService.completeMilestone(id, milestoneId);
      return reply.send(goal);
    } catch (error) {
      const formatted = formatErrorResponse(error as Error);
      return reply.code(formatted.statusCode).send(formatted);
    }
  });

  // Get goal insights
  fastify.get('/:id/insights', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const insights = await goalService.getGoalInsights(id);
      return reply.send(insights);
    } catch (error) {
      const formatted = formatErrorResponse(error as Error);
      return reply.code(formatted.statusCode).send(formatted);
    }
  });

  // Delete a goal
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await goalService.deleteGoal(id);
      return reply.send(result);
    } catch (error) {
      const formatted = formatErrorResponse(error as Error);
      return reply.code(formatted.statusCode).send(formatted);
    }
  });
};

export default goals;
