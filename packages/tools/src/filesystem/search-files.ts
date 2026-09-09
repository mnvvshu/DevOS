import { z } from 'zod';
import { BaseTool, ToolContext } from '../base.js';
import * as path from 'path';
import fg from 'fast-glob';

const InputSchema = z.object({
  pattern: z.string().describe('Glob pattern to search for'),
  path: z.string().optional().describe('Path to search within'),
  maxResults: z.number().optional().describe('Maximum number of results to return'),
});

type Input = z.infer<typeof InputSchema>;

interface Output {
  files: string[];
}

export class SearchFilesTool extends BaseTool<Input, Output> {
  name = 'search_files';
  description = 'Search for files by name pattern';
  inputSchema = InputSchema;
  permissionLevel = 'safe' as const;

  protected async execute(input: Input, context: ToolContext): Promise<Output> {
    const searchPath = input.path ? path.resolve(context.projectPath, input.path) : context.projectPath;
    const normalizedProject = path.resolve(context.projectPath);

    if (!searchPath.startsWith(normalizedProject)) {
      throw new Error('Path traversal detected: path escapes project directory');
    }

    const maxResults = input.maxResults ?? 100;
    
    // fast-glob expects forward slashes
    const normalizedSearchPath = searchPath.replace(/\\/g, '/');
    const globPattern = `${normalizedSearchPath}/**/${input.pattern}`.replace(/\\/g, '/');

    const files = await fg(globPattern, {
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
      absolute: true,
    });

    return {
      files: files.slice(0, maxResults),
    };
  }

  protected getParametersSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        pattern: { type: 'string' },
        path: { type: 'string' },
        maxResults: { type: 'number' },
      },
      required: ['pattern'],
    };
  }
}
