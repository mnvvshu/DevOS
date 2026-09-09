import fs from 'node:fs';
import path from 'node:path';
import { getLogger } from '@devos/logger';

const logger = getLogger({ module: 'repo-intel' });

export interface FileEntry {
  relativePath: string;
  absolutePath: string;
  extension: string;
  sizeBytes: number;
  modifiedAt: Date;
  isDirectory: boolean;
}

export interface ProjectIndex {
  rootPath: string;
  files: FileEntry[];
  totalFiles: number;
  totalSize: number;
  indexedAt: Date;
}

const DEFAULT_IGNORE = new Set([
  'node_modules', '.git', 'dist', 'build', 'out', '.next', '__pycache__',
  'target', 'vendor', '.turbo', '.cache', 'coverage', '.nyc_output',
  '.svelte-kit', '.nuxt', '.output', '.vercel', '.netlify',
]);

const MAX_FILES = 10000;
const MAX_DEPTH = 15;

export async function indexProject(rootPath: string): Promise<ProjectIndex> {
  const files: FileEntry[] = [];
  let totalSize = 0;

  logger.info('Indexing project', { path: rootPath });
  const startTime = Date.now();

  function walk(dirPath: string, depth: number): void {
    if (depth > MAX_DEPTH || files.length >= MAX_FILES) return;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (files.length >= MAX_FILES) break;
      
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(rootPath, fullPath).replace(/\\/g, '/');

      if (entry.name.startsWith('.') && entry.name !== '.env.example') continue;
      if (DEFAULT_IGNORE.has(entry.name)) continue;

      if (entry.isDirectory()) {
        files.push({
          relativePath: relativePath + '/',
          absolutePath: fullPath,
          extension: '',
          sizeBytes: 0,
          modifiedAt: new Date(),
          isDirectory: true,
        });
        walk(fullPath, depth + 1);
      } else if (entry.isFile()) {
        try {
          const stat = fs.statSync(fullPath);
          files.push({
            relativePath,
            absolutePath: fullPath,
            extension: path.extname(entry.name),
            sizeBytes: stat.size,
            modifiedAt: stat.mtime,
            isDirectory: false,
          });
          totalSize += stat.size;
        } catch {
          // Skip files we can't stat
        }
      }
    }
  }

  walk(rootPath, 0);

  const durationMs = Date.now() - startTime;
  logger.info('Project indexed', { 
    files: files.length, 
    totalSize, 
    durationMs,
  });

  return {
    rootPath,
    files,
    totalFiles: files.filter(f => !f.isDirectory).length,
    totalSize,
    indexedAt: new Date(),
  };
}
