import type { AIProviderConfig, AIToolCall, ToolDefinition, AIMessage } from '@devos/shared';
import type { AIProvider, CompletionRequest, CompletionResponse, StreamChunk } from './provider.js';
import { getLogger } from '@devos/logger';

const logger = getLogger({ module: 'ai-providers:ollama' });

export class OllamaProvider implements AIProvider {
  readonly name = 'ollama';
  
  constructor(private config: AIProviderConfig) {}

  get isConfigured(): boolean {
    return true; // Ollama is always configured if available locally
  }

  private mapMessages(messages: AIMessage[]) {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  private mapTools(tools?: ToolDefinition[]) {
    if (!tools || tools.length === 0) return undefined;
    return tools.map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters
      }
    }));
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const baseUrl = this.config.baseUrl || 'http://localhost:11434';
    
    const body = {
      model: this.config.model || 'llama3.1',
      messages: this.mapMessages(request.messages),
      tools: this.mapTools(request.tools),
      stream: false,
      options: {
        temperature: request.temperature,
      }
    };

    try {
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        await res.text();
        throw new Error(`Ollama error: ${res.statusText}`);
      }

      const data = await res.json() as Record<string, any>;
      
      let toolCalls: AIToolCall[] = [];
      if (data.message?.tool_calls) {
        toolCalls = data.message.tool_calls.map((tc: any, index: number) => ({
          id: `call_${index}`,
          name: tc.function.name,
          arguments: tc.function.arguments
        }));
      }

      return {
        content: data.message?.content || '',
        toolCalls,
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
        },
        finishReason: toolCalls.length > 0 ? 'tool_calls' : data.done_reason === 'length' ? 'length' : 'stop'
      };
    } catch (e: any) {
      logger.error('Ollama connection failed', { error: e.message });
      throw new Error(`Failed to connect to Ollama: ${e.message}`);
    }
  }

  async *stream(request: CompletionRequest): AsyncGenerator<StreamChunk> {
    const baseUrl = this.config.baseUrl || 'http://localhost:11434';
    
    const body = {
      model: this.config.model || 'llama3.1',
      messages: this.mapMessages(request.messages),
      tools: this.mapTools(request.tools),
      stream: true,
      options: {
        temperature: request.temperature,
      }
    };

    try {
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        yield { type: 'error', error: `Ollama streaming error: ${res.statusText}` };
        return;
      }

      if (!res.body) {
        yield { type: 'error', error: 'Response body is null' };
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.trim() !== '');
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              yield { type: 'text', content: data.message.content };
            }
            if (data.done) {
              yield { type: 'done' };
              return;
            }
          } catch (e) {
            logger.error('Failed to parse Ollama chunk', { line, error: e });
          }
        }
      }
    } catch (e: any) {
      yield { type: 'error', error: `Failed to connect to Ollama: ${e.message}` };
    }
  }
}
