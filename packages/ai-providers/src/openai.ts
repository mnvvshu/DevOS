import type { AIProviderConfig, AIToolCall, ToolDefinition, AIMessage } from '@devos/shared';
import type { AIProvider, CompletionRequest, CompletionResponse, StreamChunk } from './provider.js';
import { getLogger } from '@devos/logger';

const logger = getLogger({ module: 'ai-providers:openai' });

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  
  constructor(private config: AIProviderConfig) {}

  get isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  private mapMessages(messages: AIMessage[]) {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      tool_calls: msg.toolCalls?.map(tc => ({
        id: tc.id,
        type: 'function',
        function: { name: tc.name, arguments: JSON.stringify(tc.arguments) }
      })),
      tool_call_id: msg.toolCallId,
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
    if (!this.isConfigured) throw new Error('OpenAI provider not configured (missing API key)');
    
    const body = {
      model: this.config.model,
      messages: this.mapMessages(request.messages),
      tools: this.mapTools(request.tools),
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: false
    };

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error('OpenAI API Error', { status: res.status, err });
      throw new Error(`OpenAI error: ${res.statusText}`);
    }

    const data = await res.json() as Record<string, any>;
    const choice = data.choices[0];
    
    let toolCalls: AIToolCall[] = [];
    if (choice.message.tool_calls) {
      toolCalls = choice.message.tool_calls.map((tc: any) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments)
      }));
    }

    return {
      content: choice.message.content || '',
      toolCalls,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      },
      finishReason: choice.finish_reason === 'tool_calls' ? 'tool_calls' : choice.finish_reason === 'length' ? 'length' : 'stop'
    };
  }

  async *stream(request: CompletionRequest): AsyncGenerator<StreamChunk> {
    if (!this.isConfigured) {
      yield { type: 'error', error: 'OpenAI provider not configured' };
      return;
    }

    const body = {
      model: this.config.model,
      messages: this.mapMessages(request.messages),
      tools: this.mapTools(request.tools),
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: true
    };

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      yield { type: 'error', error: `OpenAI streaming error: ${res.statusText}` };
      return;
    }

    if (!res.body) {
      yield { type: 'error', error: 'Response body is null' };
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
          const chunk = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          boundary = buffer.indexOf('\n\n');

          if (chunk.startsWith('data: ')) {
            const dataStr = chunk.slice(6);
            if (dataStr === '[DONE]') {
              yield { type: 'done' };
              return;
            }
            try {
              const data = JSON.parse(dataStr);
              const delta = data.choices?.[0]?.delta;
              if (!delta) continue;
              
              if (delta.content) {
                yield { type: 'text', content: delta.content };
              }
              if (delta.tool_calls) {
                // Simplified tool call streaming yield
                for (const tc of delta.tool_calls) {
                  if (tc.function?.name) {
                    yield { type: 'tool_call', toolCall: { id: tc.id, name: tc.function.name, arguments: tc.function.arguments } };
                  }
                }
              }
            } catch (e) {
              logger.error('Failed to parse stream chunk', { chunk, error: e });
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
