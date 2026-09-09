import { z } from 'zod';
import { BaseTool, ToolContext } from '../base.js';
import * as fs from 'fs/promises';
import * as path from 'path';

const InputSchema = z.object({
  path: z.string().describe('Path to the file to read, relative to project path or absolute'),
  startLine: z.number().optional().describe('1-indexed start line'),
  endLine: z.number().optional().describe('1-indexed end line'),
});

type Input = z.infer<typeof InputSchema>;

interface Output {
  content: string;
  path: string;
  lines: number;
  size: number;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export class ReadFileTool extends BaseTool<Input, Output> {
  name = 'read_file';
  description = 'Read a file and return its content';
  inputSchema = InputSchema;
  permissionLevel = 'safe' as const;

  protected async execute(input: Input, context: ToolContext): Promise<Output> {
    const resolvedPath = path.resolve(context.projectPath, input.path);
    const normalizedProject = path.resolve(context.projectPath);

    if (!resolvedPath.startsWith(normalizedProject)) {
      throw new Error('Path traversal detected: path escapes project directory');
    }

    const stats = await fs.stat(resolvedPath);
    if (stats.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed limit of ${MAX_FILE_SIZE} bytes`);
    }

    const rawContent = await fs.readFile(resolvedPath, 'utf-8');
    const lines = rawContent.split('\n');

    let contentToReturn = lines;
    if (input.startLine !== undefined || input.endLine !== undefined) {
      const start = Math.max(1, input.startLine ?? 1) - 1;
      const end = Math.min(lines.length, input.endLine ?? lines.length);
      contentToReturn = lines.slice(start, end);
    }

    return {
      content: contentToReturn.join('\n'),
      path: resolvedPath,
      lines: lines.length,
      size: stats.size,
    };
  }

  protected getParametersSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        path: { type: 'string' },
        startLine: { type: 'number' },
        endLine: { type: 'number' },
      },
      required: ['path'],
    };
  }
}
