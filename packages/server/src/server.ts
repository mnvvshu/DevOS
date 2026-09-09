import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { registerRoutes } from './routes/index.js';
import { registerWebSocket } from './ws.js';

export async function createServer() {
  const app = Fastify({
    logger: false, // We use our own logger
  });

  // CORS for frontend
  await app.register(cors, {
    origin: ['http://localhost:5173', 'http://localhost:3712'],
    credentials: true,
  });

  // WebSocket support
  await app.register(websocket);

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Register API routes
  registerRoutes(app);

  // Register WebSocket handler
  registerWebSocket(app);

  return app;
}
