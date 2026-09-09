import type { AIMessage, ToolResult, ProjectInfo } from '@devos/shared';

import type { AIProvider } from '@devos/ai-providers';
import type { ToolRegistry } from '@devos/tools';
import type { PermissionEngine } from '@devos/permissions';
import { getLogger } from '@devos/logger';
import { eventBus } from '@devos/logger';
import { buildSystemPrompt } from './prompts.js';

const logger = getLogger({ module: 'agent' });

export interface AgentConfig {
  provider: AIProvider;
  toolRegistry: ToolRegistry;
  permissionEngine: PermissionEngine;
  projectInfo: ProjectInfo | null;
  maxIterations: number;
  projectPath: string;
}

export interface AgentResponse {
  content: string;
  toolCalls: Array<{
    name: string;
    input: Record<string, unknown>;
    output: ToolResult;
  }>;
  iterations: number;
  durationMs: number;
}

export class Agent {
  private config: AgentConfig;
  private conversationHistory: AIMessage[] = [];

  constructor(config: AgentConfig) {
    this.config = config;
  }

  async processRequest(userMessage: string, taskId: string, sessionId: string): Promise<AgentResponse> {
    const startTime = Date.now();
    const toolCalls: AgentResponse['toolCalls'] = [];
    
    // Build system prompt
    const toolDefinitions = this.config.toolRegistry.getDefinitions();
    const systemPrompt = buildSystemPrompt(this.config.projectInfo, toolDefinitions);

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    // Emit event
    eventBus.emit('task:created', { taskId, userMessage }, { taskId, sessionId });

    let iterations = 0;
    const maxIterations = this.config.maxIterations || 10;

    while (iterations < maxIterations) {
      iterations++;

      // Build messages for API call
      const messages: AIMessage[] = [
        { role: 'system', content: systemPrompt },
        ...this.conversationHistory,
      ];

      // Call AI provider
      eventBus.emit('agent:thinking', { iteration: iterations }, { taskId, sessionId });

      let response;
      try {
        response = await this.config.provider.complete({
          messages,
          tools: toolDefinitions,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('AI provider error', { error: errorMessage, iteration: iterations });
        eventBus.emit('agent:error', { error: errorMessage }, { taskId, sessionId });
        
        return {
          content: `I encountered an error communicating with the AI provider: ${errorMessage}`,
          toolCalls,
          iterations,
          durationMs: Date.now() - startTime,
        };
      }

      // If no tool calls, this is the final response
      if (response.toolCalls.length === 0) {
        this.conversationHistory.push({
          role: 'assistant',
          content: response.content,
        });

        eventBus.emit('agent:response', { content: response.content }, { taskId, sessionId });
        eventBus.emit('agent:complete', { iterations }, { taskId, sessionId });

        return {
          content: response.content,
          toolCalls,
          iterations,
          durationMs: Date.now() - startTime,
        };
      }

      // Process tool calls
      this.conversationHistory.push({
        role: 'assistant',
        content: response.content || '',
        toolCalls: response.toolCalls,
      });

      for (const toolCall of response.toolCalls) {
        const tool = this.config.toolRegistry.get(toolCall.name);
        
        if (!tool) {
          const errorResult: ToolResult = {
            success: false,
            error: {
              code: 'TOOL_EXECUTION_ERROR',
              message: `Unknown tool: ${toolCall.name}`,
              recoverable: true,
            },
            durationMs: 0,
            toolName: toolCall.name,
          };
          
          this.conversationHistory.push({
            role: 'tool',
            content: JSON.stringify(errorResult),
            toolCallId: toolCall.id,
          });
          continue;
        }

        // Emit tool call event
        eventBus.emit('agent:tool_call', {
          toolName: toolCall.name,
          input: toolCall.arguments,
          permissionLevel: tool.permissionLevel,
        }, { taskId, sessionId });

        // Check permissions
        const permitted = await this.config.permissionEngine.check(
          tool.permissionLevel,
          {
            action: toolCall.name,
            description: `Execute tool: ${toolCall.name}`,
            risk: tool.permissionLevel === 'requires_approval' ? 'medium' : 'low',
            details: toolCall.arguments,
          },
          sessionId,
          taskId,
        );

        if (!permitted) {
          const deniedResult: ToolResult = {
            success: false,
            error: {
              code: 'PERMISSION_DENIED',
              message: `User denied permission for: ${toolCall.name}`,
              recoverable: true,
            },
            durationMs: 0,
            toolName: toolCall.name,
          };
          
          this.conversationHistory.push({
            role: 'tool',
            content: JSON.stringify(deniedResult),
            toolCallId: toolCall.id,
          });

          toolCalls.push({
            name: toolCall.name,
            input: toolCall.arguments,
            output: deniedResult,
          });
          continue;
        }

        // Execute tool
        logger.info('Executing tool', { tool: toolCall.name, taskId });
        const toolContext = {
          projectPath: this.config.projectPath,
          taskId,
          sessionId,
        };

        const result = await tool.run(toolCall.arguments, toolContext);

        // Emit result event
        eventBus.emit('agent:tool_result', {
          toolName: toolCall.name,
          success: result.success,
          durationMs: result.durationMs,
        }, { taskId, sessionId });

        // Add to history
        this.conversationHistory.push({
          role: 'tool',
          content: JSON.stringify(result),
          toolCallId: toolCall.id,
        });

        toolCalls.push({
          name: toolCall.name,
          input: toolCall.arguments,
          output: result,
        });
      }
    }

    // Max iterations reached
    logger.warn('Agent reached max iterations', { maxIterations, taskId });
    eventBus.emit('agent:complete', { iterations, maxIterationsReached: true }, { taskId, sessionId });

    return {
      content: 'I reached the maximum number of steps for this task. Here is what I found so far based on the tools I used.',
      toolCalls,
      iterations,
      durationMs: Date.now() - startTime,
    };
  }

  /** Reset conversation history for a new task */
  resetHistory(): void {
    this.conversationHistory = [];
  }

  /** Get current conversation length */
  getHistoryLength(): number {
    return this.conversationHistory.length;
  }
}
