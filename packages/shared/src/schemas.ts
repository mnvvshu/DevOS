import { z } from 'zod';

export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(10000),
  sessionId: z.string().uuid().optional(),
  projectPath: z.string().optional(),
});

export const ApprovalResponseSchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum(['allow_once', 'allow_session', 'deny']),
});

export const SettingsSchema = z.object({
  aiProvider: z.enum(['openai', 'anthropic', 'ollama']).default('openai'),
  openaiApiKey: z.string().optional(),
  openaiModel: z.string().default('gpt-4o'),
  anthropicApiKey: z.string().optional(),
  anthropicModel: z.string().default('claude-sonnet-4-20250514'),
  ollamaBaseUrl: z.string().url().default('http://localhost:11434'),
  ollamaModel: z.string().default('llama3.1'),
  commandTimeout: z.number().int().min(5000).max(300000).default(30000),
  maxFileSize: z.number().int().min(1024).max(104857600).default(10485760),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ApprovalResponse = z.infer<typeof ApprovalResponseSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
