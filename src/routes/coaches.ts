import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { coachService } from '../services/coach.service';

const assignCoachSchema = z.object({
  memberId: z.string().uuid(),
  coachPersonaId: z.string().uuid(),
});

const coaches: FastifyPluginAsync = async (fastify) => {
  // Get all coach personas
  fastify.get('/', async (_request, reply) => {
    try {
      const coaches = await coachService.getAllCoaches();
      return reply.send(coaches);
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(500).send({
          error: error.message,
        });
      }
      throw error;
    }
  });

  // Get a specific coach persona
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const coach = await coachService.getCoach(id);
      return reply.send(coach);
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(404).send({
          error: error.message,
        });
      }
      throw error;
    }
  });

  // Get coaches assigned to a member
  fastify.get('/member/:memberId', async (request, reply) => {
    try {
      const { memberId } = request.params as { memberId: string };
      const coaches = await coachService.getMemberCoaches(memberId);
      return reply.send(coaches);
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(400).send({
          error: error.message,
        });
      }
      throw error;
    }
  });

  // Assign a coach to a member
  fastify.post('/assign', async (request, reply) => {
    try {
      const body = assignCoachSchema.parse(request.body);
      const assignment = await coachService.assignCoachToMember(
        body.memberId,
        body.coachPersonaId,
      );
      return reply.code(201).send(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      if (error instanceof Error) {
        return reply.code(400).send({
          error: error.message,
        });
      }

      throw error;
    }
  });

  // Unassign a coach from a member
  fastify.delete('/assign', async (request, reply) => {
    try {
      const body = assignCoachSchema.parse(request.body);
      const result = await coachService.unassignCoachFromMember(
        body.memberId,
        body.coachPersonaId,
      );
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      if (error instanceof Error) {
        return reply.code(404).send({
          error: error.message,
        });
      }

      throw error;
    }
  });
};

export default coaches;
