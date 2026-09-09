import type { FastifyInstance } from 'fastify';

export async function historyRoutes(app: FastifyInstance) {
  app.get('/sessions', async (_request) => {
    // TODO: Query database for recent sessions
    return { sessions: [] };
  });

  app.get('/tasks/:taskId', async (_request) => {
    // TODO: Query database for task details + steps
    return { task: null };
  });

  app.get('/sessions/:sessionId/tasks', async (_request) => {
    // TODO: Query database
    return { tasks: [] };
  });
}
