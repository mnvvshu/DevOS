import type { AIProviderConfig, AIToolCall, ToolDefinition, AIMessage } from '@devos/shared';
import type { AIProvider, CompletionRequest, CompletionResponse, StreamChunk } from './provider.js';
import { getLogger } from '@devos/logger';

const logger = getLogger({ module: 'ai-providers:anthropic' });

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';
  
  constructor(private config: AIProviderConfig) {}

  get isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  private mapMessages(messages: AIMessage[]) {
    return messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : msg.role === 'assistant' ? 'assistant' : 'user', // Basic mapping
      content: msg.content
    }));
  }

  private mapTools(tools?: ToolDefinition[]) {
    if (!tools || tools.length === 0) return undefined;
    return tools.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters
    }));
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    if (!this.isConfigured) throw new Error('Anthropic provider not configured (missing API key)');
    
    // Simplistic extraction of system prompt, Anthropic separates system from messages
    let systemPrompt = '';
    const nonSystem = request.messages.filter(m => {
      if (m.role === 'system') {
        systemPrompt += m.content + '\n';
        return false;
      }
      return true;
    });

    const body: any = {
      model: this.config.model,
      messages: this.mapMessages(nonSystem),
      max_tokens: request.maxTokens || 4096,
      stream: false
    };
    
    if (systemPrompt) body.system = systemPrompt;
    if (request.tools?.length) body.tools = this.mapTools(request.tools);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error('Anthropic API Error', { status: res.status, err });
      throw new Error(`Anthropic error: ${res.statusText}`);
    }

    const data = await res.json() as Record<string, any>;
    
    let content = '';
    let toolCalls: AIToolCall[] = [];
    
    for (const block of data.content || []) {
      if (block.type === 'text') {
        content += block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          arguments: block.input
        });
      }
    }

    return {
      content,
      toolCalls,
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
      },
      finishReason: data.stop_reason === 'tool_use' ? 'tool_calls' : data.stop_reason === 'max_tokens' ? 'length' : 'stop'
    };
  }

  async *stream(request: CompletionRequest): AsyncGenerator<StreamChunk> {
    if (!this.isConfigured) {
      yield { type: 'error', error: 'Anthropic provider not configured' };
      return;
    }

    let systemPrompt = '';
    const nonSystem = request.messages.filter(m => {
      if (m.role === 'system') {
        systemPrompt += m.content + '\n';
        return false;
      }
      return true;
    });

    const body: any = {
      model: this.config.model,
      messages: this.mapMessages(nonSystem),
      max_tokens: request.maxTokens || 4096,
      stream: true
    };
    
    if (systemPrompt) body.system = systemPrompt;
    if (request.tools?.length) body.tools = this.mapTools(request.tools);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      yield { type: 'error', error: `Anthropic streaming error: ${res.statusText}` };
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

          if (chunk.startsWith('event: ')) {
            const lines = chunk.split('\n');
            const eventType = (lines[0] ?? '').slice(7).trim();
            const dataLine = lines.find(l => l.startsWith('data: '));
            if (!dataLine) continue;
            
            const dataStr = dataLine.slice(6);
            try {
              const data = JSON.parse(dataStr);
              
              if (eventType === 'content_block_delta' && data.delta?.type === 'text_delta') {
                yield { type: 'text', content: data.delta.text };
              } else if (eventType === 'message_stop') {
                yield { type: 'done' };
                return;
              }
              // Basic streaming implementation for tool calls could be added here
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
