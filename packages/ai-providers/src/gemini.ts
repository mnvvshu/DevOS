import type { AIProviderConfig, AIToolCall, ToolDefinition, AIMessage } from '@devos/shared';
import type { AIProvider, CompletionRequest, CompletionResponse, StreamChunk } from './provider.js';
import { getLogger } from '@devos/logger';

const logger = getLogger({ module: 'ai-providers:gemini' });

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Fetch with automatic retry on 503 (Service Unavailable) and 429 (Rate Limited).
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, options);
    
    if (res.ok || (res.status !== 503 && res.status !== 429)) {
      return res;
    }

    if (attempt < retries) {
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt); // Exponential backoff: 1s, 2s, 4s
      logger.warn(`Gemini returned ${res.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`, { status: res.status });
      await new Promise(resolve => setTimeout(resolve, delay));
    } else {
      return res; // Return the failed response on final attempt
    }
  }
  
  // Shouldn't reach here, but satisfy TypeScript
  return fetch(url, options);
}

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  
  constructor(private config: AIProviderConfig) {}

  get isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  private get baseUrl(): string {
    return this.config.baseUrl || GEMINI_BASE_URL;
  }

  private get model(): string {
    return this.config.model || 'gemini-flash-latest';
  }

  /**
   * Map messages from the common format to Gemini's native format.
   * Gemini uses "contents" with "parts", and separates system instructions.
   */
  private mapMessages(messages: AIMessage[]): { contents: any[]; systemInstruction?: any } {
    let systemInstruction: any = undefined;
    const contents: any[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        // Gemini handles system prompts via systemInstruction
        systemInstruction = {
          parts: [{ text: msg.content }]
        };
      } else if (msg.role === 'tool') {
        // Tool result message — Gemini expects role 'user' with functionResponse parts
        contents.push({
          role: 'user',
          parts: [{
            functionResponse: {
              name: msg.toolCallId || 'unknown',
              response: { result: msg.content }
            }
          }]
        });
      } else {
        const role = msg.role === 'assistant' ? 'model' : 'user';
        const parts: any[] = [];

        if (msg.content) {
          parts.push({ text: msg.content });
        }

        // Handle tool calls from assistant — include thought_signature if present
        if (msg.toolCalls && msg.toolCalls.length > 0) {
          for (const tc of msg.toolCalls) {
            const functionCallPart: any = {
              functionCall: {
                name: tc.name,
                args: tc.arguments
              }
            };
            // Preserve thoughtSignature for Gemini 3+ models
            if (tc.metadata?.thoughtSignature) {
              functionCallPart.thoughtSignature = tc.metadata.thoughtSignature;
            }
            parts.push(functionCallPart);
          }
        }

        if (parts.length > 0) {
          contents.push({ role, parts });
        }
      }
    }

    return { contents, systemInstruction };
  }

  private mapTools(tools?: ToolDefinition[]): any[] | undefined {
    if (!tools || tools.length === 0) return undefined;
    return [{
      functionDeclarations: tools.map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters
      }))
    }];
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    if (!this.isConfigured) throw new Error('Gemini provider not configured (missing API key)');
    
    const { contents, systemInstruction } = this.mapMessages(request.messages);

    const body: any = {
      contents,
      generationConfig: {
        temperature: request.temperature,
        maxOutputTokens: request.maxTokens,
      }
    };

    if (systemInstruction) {
      body.systemInstruction = systemInstruction;
    }

    const mappedTools = this.mapTools(request.tools);
    if (mappedTools) {
      body.tools = mappedTools;
    }

    const url = `${this.baseUrl}/models/${this.model}:generateContent`;

    const res = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': this.config.apiKey || ''
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error('Gemini API Error', { status: res.status, err });
      throw new Error(`Gemini error: ${res.statusText}`);
    }

    const data = await res.json() as Record<string, any>;

    // Parse Gemini response
    let content = '';
    let toolCalls: AIToolCall[] = [];
    let finishReason: CompletionResponse['finishReason'] = 'stop';

    const candidate = data.candidates?.[0];
    if (candidate) {
      for (const part of candidate.content?.parts || []) {
        if (part.text) {
          content += part.text;
        }
        if (part.functionCall) {
          toolCalls.push({
            id: part.functionCall.id || `call_${Math.random().toString(36).slice(2, 11)}`,
            name: part.functionCall.name,
            arguments: part.functionCall.args || {},
            // Preserve thoughtSignature for subsequent turns
            metadata: part.thoughtSignature ? { thoughtSignature: part.thoughtSignature } : undefined,
          });
        }
      }

      if (candidate.finishReason === 'STOP') {
        finishReason = toolCalls.length > 0 ? 'tool_calls' : 'stop';
      } else if (candidate.finishReason === 'MAX_TOKENS') {
        finishReason = 'length';
      }
    }

    return {
      content,
      toolCalls,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0
      },
      finishReason
    };
  }

  async *stream(request: CompletionRequest): AsyncGenerator<StreamChunk> {
    if (!this.isConfigured) {
      yield { type: 'error', error: 'Gemini provider not configured' };
      return;
    }

    const { contents, systemInstruction } = this.mapMessages(request.messages);

    const body: any = {
      contents,
      generationConfig: {
        temperature: request.temperature,
        maxOutputTokens: request.maxTokens,
      }
    };

    if (systemInstruction) {
      body.systemInstruction = systemInstruction;
    }

    const mappedTools = this.mapTools(request.tools);
    if (mappedTools) {
      body.tools = mappedTools;
    }

    const url = `${this.baseUrl}/models/${this.model}:streamGenerateContent?alt=sse`;

    const res = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': this.config.apiKey || ''
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      yield { type: 'error', error: `Gemini streaming error: ${res.statusText}` };
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
            try {
              const data = JSON.parse(dataStr);
              const candidate = data.candidates?.[0];
              if (!candidate) continue;

              for (const part of candidate.content?.parts || []) {
                if (part.text) {
                  yield { type: 'text', content: part.text };
                }
                if (part.functionCall) {
                  yield {
                    type: 'tool_call',
                    toolCall: {
                      id: `call_${Math.random().toString(36).slice(2, 11)}`,
                      name: part.functionCall.name,
                      arguments: part.functionCall.args || {}
                    }
                  };
                }
              }

              if (candidate.finishReason === 'STOP') {
                yield { type: 'done' };
                return;
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
