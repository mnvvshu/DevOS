import { toolRegistry } from './registry.js';
import { ReadFileTool } from './filesystem/read-file.js';
import { WriteFileTool } from './filesystem/write-file.js';
import { ListDirectoryTool } from './filesystem/list-directory.js';
import { SearchFilesTool } from './filesystem/search-files.js';
import { SearchCodeTool } from './code/search-code.js';
import { RunCommandTool } from './execution/run-command.js';
import { RunTestsTool } from './execution/run-tests.js';

export function registerAllTools(): void {
  toolRegistry.register(new ReadFileTool());
  toolRegistry.register(new WriteFileTool());
  toolRegistry.register(new ListDirectoryTool());
  toolRegistry.register(new SearchFilesTool());
  toolRegistry.register(new SearchCodeTool());
  toolRegistry.register(new RunCommandTool());
  toolRegistry.register(new RunTestsTool());
}
