import { z } from 'zod';
import { BaseTool, ToolContext } from '../base.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';

const InputSchema = z.object({
  path: z.string().describe('Path to the file to write, relative to project path or absolute'),
  content: z.string().describe('Content to write'),
  createDirectories: z.boolean().optional().describe('Whether to create missing directories'),
});

type Input = z.infer<typeof InputSchema>;

interface Output {
  path: string;
  bytesWritten: number;
  created: boolean;
}

export class WriteFileTool extends BaseTool<Input, Output> {
  name = 'write_file';
  description = 'Write content to a file';
  inputSchema = InputSchema;
  permissionLevel = 'requires_approval' as const;

  protected async execute(input: Input, context: ToolContext): Promise<Output> {
    const resolvedPath = path.resolve(context.projectPath, input.path);
    const normalizedProject = path.resolve(context.projectPath);

    if (!resolvedPath.startsWith(normalizedProject)) {
      throw new Error('Path traversal detected: path escapes project directory');
    }

    const created = !existsSync(resolvedPath);

    if (input.createDirectories) {
      await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
    }

    if (!created) {
      const backupPath = `${resolvedPath}.backup`;
      await fs.copyFile(resolvedPath, backupPath);
      this.logger.info(`Created backup at ${backupPath}`);
    }

    await fs.writeFile(resolvedPath, input.content, 'utf-8');

    return {
      path: resolvedPath,
      bytesWritten: Buffer.byteLength(input.content, 'utf-8'),
      created,
    };
  }

  protected getParametersSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string' },
        createDirectories: { type: 'boolean' },
      },
      required: ['path', 'content'],
    };
  }
}
