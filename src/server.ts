import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/env';
import { prisma } from './lib/prisma';

// Import routes
import sessionRoutes from './routes/sessions';
import coachRoutes from './routes/coaches';
import memberRoutes from './routes/members';

export async function buildServer() {
  const server = Fastify({
    logger: {
      level: env.NODE_ENV === 'development' ? 'info' : 'warn',
      transport:
        env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  // Register plugins
  await server.register(cors, {
    origin: env.NODE_ENV === 'development' ? '*' : false,
  });

  // Health check
  server.get('/health', async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
      };
    }
  });

  // Register routes
  await server.register(sessionRoutes, { prefix: '/api/sessions' });
  await server.register(coachRoutes, { prefix: '/api/coaches' });
  await server.register(memberRoutes, { prefix: '/api/members' });

  // Error handler
  server.setErrorHandler((error, _request, reply) => {
    server.log.error(error);

    reply.status(error.statusCode || 500).send({
      error: error.name,
      message: error.message,
      statusCode: error.statusCode || 500,
    });
  });

  return server;
}
