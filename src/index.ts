import { buildServer } from './server';
import { env } from './config/env';

async function start() {
  try {
    const server = await buildServer();

    await server.listen({
      port: parseInt(env.PORT, 10),
      host: env.HOST,
    });

    console.log(`🚀 Server ready at http://${env.HOST}:${env.PORT}`);
    console.log(`📊 Health check: http://${env.HOST}:${env.PORT}/health`);
  } catch (err) {
    console.error('❌ Error starting server:', err);
    process.exit(1);
  }
}

start();
