import { z } from 'zod';
import { BaseTool, ToolContext } from '../base.js';
import * as fs from 'fs/promises';
import * as path from 'path';

const InputSchema = z.object({
  path: z.string().describe('Directory path to list'),
  recursive: z.boolean().optional().describe('Whether to list recursively'),
  maxDepth: z.number().optional().describe('Maximum depth for recursive listing'),
});

type Input = z.infer<typeof InputSchema>;

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileNode[];
}

export class ListDirectoryTool extends BaseTool<Input, FileNode> {
  name = 'list_directory';
  description = 'List directory contents';
  inputSchema = InputSchema;
  permissionLevel = 'safe' as const;

  protected async execute(input: Input, context: ToolContext): Promise<FileNode> {
    const resolvedPath = path.resolve(context.projectPath, input.path);
    const normalizedProject = path.resolve(context.projectPath);

    if (!resolvedPath.startsWith(normalizedProject)) {
      throw new Error('Path traversal detected: path escapes project directory');
    }

    const ignored = ['node_modules', '.git', 'dist'];

    const traverse = async (dirPath: string, currentDepth: number): Promise<FileNode> => {
      const stats = await fs.stat(dirPath);
      
      const node: FileNode = {
        name: path.basename(dirPath),
        path: dirPath,
        type: stats.isDirectory() ? 'directory' : 'file',
      };

      if (!stats.isDirectory()) {
        node.size = stats.size;
        return node;
      }

      if (input.recursive && (input.maxDepth === undefined || currentDepth < input.maxDepth)) {
        const dirents = await fs.readdir(dirPath, { withFileTypes: true });
        node.children = [];
        for (const dirent of dirents) {
          if (ignored.includes(dirent.name)) continue;
          
          const childPath = path.join(dirPath, dirent.name);
          try {
            node.children.push(await traverse(childPath, currentDepth + 1));
          } catch (e) {
            // Ignore unreadable files
          }
        }
      }

      return node;
    };

    return traverse(resolvedPath, 0);
  }

  protected getParametersSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        path: { type: 'string' },
        recursive: { type: 'boolean' },
        maxDepth: { type: 'number' },
      },
      required: ['path'],
    };
  }
}
