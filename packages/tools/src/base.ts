import { z } from 'zod';
import type { PermissionLevel, ToolResult, ToolDefinition } from '@devos/shared';
import { getLogger } from '@devos/logger';

export interface ToolContext {
  projectPath: string;
  taskId: string;
  sessionId: string;
}

export abstract class BaseTool<TInput = unknown, TOutput = unknown> {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly inputSchema: z.ZodSchema<TInput>;
  abstract readonly permissionLevel: PermissionLevel;
  readonly timeoutMs: number = 30000;

  protected logger = getLogger({ module: 'tools' });

  async run(rawInput: unknown, context: ToolContext): Promise<ToolResult<TOutput>> {
    const startTime = Date.now();
    
    // Validate input
    const parseResult = this.inputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Invalid input: ${parseResult.error.message}`,
          recoverable: true,
        },
        durationMs: Date.now() - startTime,
        toolName: this.name,
      };
    }

    try {
      // Execute with timeout
      const result = await Promise.race([
        this.execute(parseResult.data, context),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Tool execution timed out')), this.timeoutMs)
        ),
      ]);

      return {
        success: true,
        data: result,
        durationMs: Date.now() - startTime,
        toolName: this.name,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isTimeout = message.includes('timed out');
      
      return {
        success: false,
        error: {
          code: isTimeout ? 'COMMAND_TIMEOUT' : 'TOOL_EXECUTION_ERROR',
          message,
          recoverable: true,
        },
        durationMs: Date.now() - startTime,
        toolName: this.name,
      };
    }
  }

  /** Get JSON Schema for AI function calling */
  getDefinition(): ToolDefinition {
    // Convert Zod schema to JSON Schema-like object for function calling
    return {
      name: this.name,
      description: this.description,
      parameters: this.getParametersSchema(),
      permissionLevel: this.permissionLevel,
    };
  }

  protected abstract execute(input: TInput, context: ToolContext): Promise<TOutput>;
  
  protected abstract getParametersSchema(): Record<string, unknown>;
}
