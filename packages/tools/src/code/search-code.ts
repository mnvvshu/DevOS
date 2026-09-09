import { z } from 'zod';
import { BaseTool, ToolContext } from '../base.js';
import * as path from 'path';
import fg from 'fast-glob';
import readline from 'readline';
import { createReadStream } from 'fs';

const InputSchema = z.object({
  query: z.string().describe('Text or regex query to search for'),
  path: z.string().optional().describe('Directory path to search within'),
  filePattern: z.string().optional().describe('Glob pattern to filter files'),
  maxResults: z.number().optional().describe('Maximum number of results per file'),
  isRegex: z.boolean().optional().describe('Whether the query is a regex pattern'),
});

type Input = z.infer<typeof InputSchema>;

interface Match {
  file: string;
  line: number;
  content: string;
  context: string[];
}

interface Output {
  matches: Match[];
}

export class SearchCodeTool extends BaseTool<Input, Output> {
  name = 'search_code';
  description = 'Search code content using regex/text';
  inputSchema = InputSchema;
  permissionLevel = 'safe' as const;

  protected async execute(input: Input, context: ToolContext): Promise<Output> {
    const searchPath = input.path ? path.resolve(context.projectPath, input.path) : context.projectPath;
    const normalizedProject = path.resolve(context.projectPath);

    if (!searchPath.startsWith(normalizedProject)) {
      throw new Error('Path traversal detected: path escapes project directory');
    }

    const maxResults = input.maxResults ?? 50;
    const normalizedSearchPath = searchPath.replace(/\\/g, '/');
    const globPattern = input.filePattern 
      ? `${normalizedSearchPath}/**/${input.filePattern}`.replace(/\\/g, '/')
      : `${normalizedSearchPath}/**`.replace(/\\/g, '/');

    const files = await fg(globPattern, {
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
      absolute: true,
      onlyFiles: true,
    });

    const matches: Match[] = [];
    let regex: RegExp;
    
    if (input.isRegex) {
      regex = new RegExp(input.query, 'g');
    } else {
      // Escape for literal search, though indexOf might be faster for literal
      const escapedQuery = input.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      regex = new RegExp(escapedQuery, 'g');
    }

    for (const file of files) {
      if (matches.length >= maxResults) break;
      
      const fileStream = createReadStream(file);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      let lineNumber = 1;
      const history: string[] = [];
      const localMatches: { line: number, content: string, pre: string[] }[] = [];

      for await (const line of rl) {
        if (regex.test(line)) {
          localMatches.push({
            line: lineNumber,
            content: line,
            pre: [...history.slice(-2)]
          });
        }
        
        history.push(line);
        if (history.length > 5) history.shift();
        
        lineNumber++;
      }
      
      // We don't have post context easily with just a readline without more complex buffering,
      // simplifying here for brevity, keeping only 'pre' context. 
      for (const lm of localMatches) {
        if (matches.length >= maxResults) break;
        matches.push({
          file,
          line: lm.line,
          content: lm.content,
          context: lm.pre
        });
      }
    }

    return { matches };
  }

  protected getParametersSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        query: { type: 'string' },
        path: { type: 'string' },
        filePattern: { type: 'string' },
        maxResults: { type: 'number' },
        isRegex: { type: 'boolean' },
      },
      required: ['query'],
    };
  }
}
