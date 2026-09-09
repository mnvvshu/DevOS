import { z } from 'zod';
import { BaseTool, ToolContext } from '../base.js';
import * as path from 'path';
import { execFile } from 'child_process';

const InputSchema = z.object({
  command: z.string().describe('Command to run'),
  args: z.array(z.string()).optional().describe('Command arguments'),
  cwd: z.string().optional().describe('Current working directory'),
  timeout: z.number().optional().describe('Timeout in milliseconds'),
});

type Input = z.infer<typeof InputSchema>;

interface Output {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
}

export class RunCommandTool extends BaseTool<Input, Output> {
  name = 'run_command';
  description = 'Execute a shell command securely via execFile';
  inputSchema = InputSchema;
  permissionLevel = 'requires_approval' as const;

  protected async execute(input: Input, context: ToolContext): Promise<Output> {
    const cwd = input.cwd ? path.resolve(context.projectPath, input.cwd) : context.projectPath;
    const normalizedProject = path.resolve(context.projectPath);

    if (!cwd.startsWith(normalizedProject)) {
      throw new Error('Path traversal detected: cwd escapes project directory');
    }

    const timeout = input.timeout ?? 30000;
    
    return new Promise((resolve) => {
      let timedOut = false;
      void execFile(
        input.command,
        input.args ?? [],
        { cwd, timeout, windowsHide: true },
        (error, stdout, stderr) => {
          if (error) {
            if (error.killed && error.signal === 'SIGTERM') {
              timedOut = true;
            }
            resolve({
              stdout: stdout.toString(),
              stderr: stderr.toString(),
              exitCode: typeof error.code === 'number' ? error.code : 1,
              timedOut,
            });
            return;
          }
          
          resolve({
            stdout: stdout.toString(),
            stderr: stderr.toString(),
            exitCode: 0,
            timedOut,
          });
        }
      );
    });
  }

  protected getParametersSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        command: { type: 'string' },
        args: { type: 'array', items: { type: 'string' } },
        cwd: { type: 'string' },
        timeout: { type: 'number' },
      },
      required: ['command'],
    };
  }
}
