import { FastifyPluginAsync } from 'fastify';
import { analyticsService } from '../services/analytics.service';
import { formatErrorResponse } from '../lib/errors';

const analytics: FastifyPluginAsync = async (fastify) => {
  fastify.get('/member/:memberId', async (request, reply) => {
    try {
      const { memberId } = request.params as { memberId: string };
      const analytics = await analyticsService.getMemberAnalytics(memberId);
      return reply.send(analytics);
    } catch (error) {
      const formatted = formatErrorResponse(error as Error);
      return reply.code(formatted.statusCode).send(formatted);
    }
  });
};

export default analytics;
