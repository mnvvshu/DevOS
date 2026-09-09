import type { AIMessage, AIToolCall, ToolDefinition } from '@devos/shared';

export interface StreamChunk {
  type: 'text' | 'tool_call' | 'error' | 'done';
  content?: string;
  toolCall?: AIToolCall;
  error?: string;
}

export interface CompletionRequest {
  messages: AIMessage[];
  tools?: ToolDefinition[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface CompletionResponse {
  content: string;
  toolCalls: AIToolCall[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
}

export interface AIProvider {
  readonly name: string;
  readonly isConfigured: boolean;

  complete(request: CompletionRequest): Promise<CompletionResponse>;
  stream(request: CompletionRequest): AsyncGenerator<StreamChunk>;
}
