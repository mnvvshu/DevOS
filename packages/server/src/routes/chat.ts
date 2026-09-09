import type { FastifyInstance } from 'fastify';
import { ChatRequestSchema } from '@devos/shared';
import { generateId } from '@devos/shared';
import { createProviderFromEnv } from '@devos/ai-providers';
import { Agent } from '@devos/agent';
import { toolRegistry } from '@devos/tools';
import { PermissionEngine } from '@devos/permissions';
import { detectProject } from '@devos/repo-intel';
import { getLogger } from '@devos/logger';

const logger = getLogger({ module: 'chat-route' });
const permissionEngine = new PermissionEngine();

export async function chatRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const body = ChatRequestSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.message });
    }

    const { message, sessionId, projectPath } = body.data;
    const taskId = generateId();
    const resolvedSessionId = sessionId || generateId();

    logger.info('Chat request received', { taskId, sessionId: resolvedSessionId });

    try {
      // Detect project if path provided
      let projectInfo = null;
      if (projectPath) {
        projectInfo = await detectProject(projectPath);
      }

      // Create AI provider
      const provider = createProviderFromEnv();

      // Create agent
      const agent = new Agent({
        provider,
        toolRegistry,
        permissionEngine,
        projectInfo,
        maxIterations: 10,
        projectPath: projectPath || process.cwd(),
      });

      // Process request
      const response = await agent.processRequest(message, taskId, resolvedSessionId);

      return reply.send({
        taskId,
        sessionId: resolvedSessionId,
        response: response.content,
        toolCalls: response.toolCalls.map(tc => ({
          name: tc.name,
          input: tc.input,
          success: tc.output.success,
          durationMs: tc.output.durationMs,
        })),
        iterations: response.iterations,
        durationMs: response.durationMs,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Chat request failed', { error: errorMessage, taskId });
      return reply.status(500).send({ error: errorMessage });
    }
  });
}
