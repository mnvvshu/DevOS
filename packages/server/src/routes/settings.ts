import type { FastifyInstance } from 'fastify';
import { SettingsSchema } from '@devos/shared';
import { readFile } from 'node:fs/promises';
import { resolve, isAbsolute } from 'node:path';

export async function settingsRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    // Return current settings (redact API keys)
    return {
      aiProvider: process.env['AI_PROVIDER'] || 'openai',
      theme: 'system',
      commandTimeout: parseInt(process.env['COMMAND_TIMEOUT'] || '30000', 10),
      hasOpenAIKey: !!process.env['OPENAI_API_KEY'],
      hasAnthropicKey: !!process.env['ANTHROPIC_API_KEY'],
      hasGeminiKey: !!process.env['GEMINI_API_KEY'],
    };
  });

  // Switch AI provider at runtime
  app.post('/provider', async (request, reply) => {
    const { provider } = request.body as { provider: string };
    const validProviders = ['openai', 'anthropic', 'gemini', 'ollama'];
    if (!validProviders.includes(provider)) {
      return reply.status(400).send({ error: `Invalid provider: ${provider}` });
    }
    process.env['AI_PROVIDER'] = provider;
    return { success: true, provider };
  });

  app.put('/', async (request, reply) => {
    const body = SettingsSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.message });
    }
    // TODO: Save settings to database
    return { success: true };
  });

  // Read file content
  app.post('/file-content', async (request, reply) => {
    const { projectPath, filePath } = request.body as { projectPath: string; filePath: string };
    if (!projectPath || !filePath) {
      return reply.status(400).send({ error: 'projectPath and filePath are required' });
    }

    try {
      const fullPath = isAbsolute(filePath) ? filePath : resolve(projectPath, filePath);
      const content = await readFile(fullPath, 'utf-8');
      return { content, path: fullPath };
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return reply.status(404).send({ error: 'File not found' });
      }
      if (err.code === 'EISDIR') {
        return reply.status(400).send({ error: 'Path is a directory' });
      }
      return reply.status(500).send({ error: 'Failed to read file' });
    }
  });
}
