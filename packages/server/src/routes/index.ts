import type { FastifyInstance } from 'fastify';
import { API_PREFIX } from '@devos/shared';
import { chatRoutes } from './chat.js';
import { projectRoutes } from './project.js';
import { systemRoutes } from './system.js';
import { historyRoutes } from './history.js';
import { settingsRoutes } from './settings.js';

export function registerRoutes(app: FastifyInstance): void {
  app.register(chatRoutes, { prefix: `${API_PREFIX}/chat` });
  app.register(projectRoutes, { prefix: `${API_PREFIX}/project` });
  app.register(systemRoutes, { prefix: `${API_PREFIX}/system` });
  app.register(historyRoutes, { prefix: `${API_PREFIX}/history` });
  app.register(settingsRoutes, { prefix: `${API_PREFIX}/settings` });
}
