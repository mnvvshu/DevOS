import { z } from 'zod';
import { BaseTool, ToolContext } from '../base.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { execFile } from 'child_process';

const InputSchema = z.object({
  testPattern: z.string().optional().describe('Pattern to match test files'),
  framework: z.string().optional().describe('Test framework to use (jest, vitest, mocha, etc.)'),
});

type Input = z.infer<typeof InputSchema>;

interface Output {
  output: string;
  passed: number;
  failed: number;
  total: number;
  exitCode: number;
}

export class RunTestsTool extends BaseTool<Input, Output> {
  name = 'run_tests';
  description = 'Run project tests';
  inputSchema = InputSchema;
  permissionLevel = 'requires_approval' as const;

  protected async execute(input: Input, context: ToolContext): Promise<Output> {
    let framework = input.framework;
    
    if (!framework) {
      try {
        const pkgStr = await fs.readFile(path.join(context.projectPath, 'package.json'), 'utf-8');
        const pkg = JSON.parse(pkgStr);
        const deps = { ...pkg.devDependencies, ...pkg.dependencies };
        if (deps['jest']) framework = 'jest';
        else if (deps['vitest']) framework = 'vitest';
        else if (deps['mocha']) framework = 'mocha';
        else framework = 'npm';
      } catch (e) {
        framework = 'npm';
      }
    }

    let command = 'npm';
    let args = ['run', 'test'];

    if (framework === 'jest' || framework === 'vitest') {
      command = 'npx';
      args = [framework];
      if (input.testPattern) {
        args.push(input.testPattern);
      }
    }

    return new Promise((resolve) => {
      execFile(
        command,
        args,
        { cwd: context.projectPath, windowsHide: true },
        (error, stdout, stderr) => {
          const output = stdout.toString() + '\n' + stderr.toString();
          
          // Very basic parsing for pass/fail, realistically needs framework-specific reporters
          let passed = 0;
          let failed = 0;
          let total = 0;
          
          const passMatch = output.match(/(?:Tests:\s*)(?:(\d+)\s*passed)/);
          const failMatch = output.match(/(?:Tests:\s*)(?:(\d+)\s*failed)/);
          const totalMatch = output.match(/(?:Tests:\s*)(?:(\d+)\s*total)/);
          
          if (passMatch) passed = parseInt(passMatch[1] ?? '0', 10);
          if (failMatch) failed = parseInt(failMatch[1] ?? '0', 10);
          if (totalMatch) total = parseInt(totalMatch[1] ?? '0', 10);
          
          resolve({
            output,
            passed,
            failed,
            total,
            exitCode: typeof error?.code === 'number' ? error.code : 0,
          });
        }
      );
    });
  }

  protected getParametersSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        testPattern: { type: 'string' },
        framework: { type: 'string' },
      },
    };
  }
}
