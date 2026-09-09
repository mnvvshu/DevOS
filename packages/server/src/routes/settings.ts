import type { FastifyInstance } from 'fastify';
import { SettingsSchema } from '@devos/shared';

export async function settingsRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    // Return current settings (redact API keys)
    return {
      aiProvider: process.env['AI_PROVIDER'] || 'openai',
      theme: 'system',
      commandTimeout: parseInt(process.env['COMMAND_TIMEOUT'] || '30000', 10),
      hasOpenAIKey: !!process.env['OPENAI_API_KEY'],
      hasAnthropicKey: !!process.env['ANTHROPIC_API_KEY'],
    };
  });

  app.put('/', async (request, reply) => {
    const body = SettingsSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.message });
    }
    // TODO: Save settings to database
    return { success: true };
  });
}
