import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { sessionService } from '../services/session.service';

const startSessionSchema = z.object({
  memberId: z.string().uuid(),
  coachPersonaId: z.string().uuid(),
});

const sendMessageSchema = z.object({
  message: z.string().min(1).max(5000),
});

const sessions: FastifyPluginAsync = async (fastify) => {
  // Start a new session
  fastify.post('/start', async (request, reply) => {
    try {
      const body = startSessionSchema.parse(request.body);
      const result = await sessionService.startSession(body.memberId, body.coachPersonaId);

      return reply.code(201).send({
        sessionId: result.sessionId,
        coachName: result.coachName,
        message: result.greeting,
      });
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

  // Send a message in a session
  fastify.post('/:id/message', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = sendMessageSchema.parse(request.body);

      const result = await sessionService.sendMessage(id, body.message);

      return reply.send(result);
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

  // End a session
  fastify.post('/:id/end', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await sessionService.endSession(id);

      return reply.send(result);
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(400).send({
          error: error.message,
        });
      }

      throw error;
    }
  });

  // Get session details
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const session = await sessionService.getSession(id);

      return reply.send(session);
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(404).send({
          error: error.message,
        });
      }

      throw error;
    }
  });

  // Get all sessions for a member
  fastify.get('/member/:memberId', async (request, reply) => {
    try {
      const { memberId } = request.params as { memberId: string };
      const sessions = await sessionService.getMemberSessions(memberId);

      return reply.send(sessions);
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(400).send({
          error: error.message,
        });
      }

      throw error;
    }
  });
};

export default sessions;
