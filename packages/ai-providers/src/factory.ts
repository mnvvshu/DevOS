import type { AIProviderConfig } from '@devos/shared';
import type { AIProvider } from './provider.js';
import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';
import { OllamaProvider } from './ollama.js';
import { GeminiProvider } from './gemini.js';
import { getLogger } from '@devos/logger';

const logger = getLogger({ module: 'ai-providers' });

export function createProvider(config: AIProviderConfig): AIProvider {
  switch (config.provider) {
    case 'openai':
      return new OpenAIProvider(config);
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'ollama':
      return new OllamaProvider(config);
    case 'gemini':
      return new GeminiProvider(config);
    default:
      throw new Error(`Unknown AI provider: ${config.provider}`);
  }
}

export function createProviderFromEnv(): AIProvider {
  const provider = (process.env['AI_PROVIDER'] || 'openai') as AIProviderConfig['provider'];
  
  const config: AIProviderConfig = {
    provider,
    model: '',
    apiKey: undefined,
    baseUrl: undefined,
  };

  switch (provider) {
    case 'openai':
      config.apiKey = process.env['OPENAI_API_KEY'];
      config.model = process.env['OPENAI_MODEL'] || 'gpt-4o';
      break;
    case 'anthropic':
      config.apiKey = process.env['ANTHROPIC_API_KEY'];
      config.model = process.env['ANTHROPIC_MODEL'] || 'claude-sonnet-4-20250514';
      break;
    case 'ollama':
      config.baseUrl = process.env['OLLAMA_BASE_URL'] || 'http://localhost:11434';
      config.model = process.env['OLLAMA_MODEL'] || 'llama3.1';
      break;
    case 'gemini':
      config.apiKey = process.env['GEMINI_API_KEY'];
      config.model = process.env['GEMINI_MODEL'] || 'gemini-flash-latest';
      config.baseUrl = process.env['GEMINI_BASE_URL'];
      break;
  }

  logger.info(`Creating AI provider: ${provider}`, { model: config.model });
  return createProvider(config);
}
