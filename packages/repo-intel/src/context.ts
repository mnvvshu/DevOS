import type { ProjectIndex, FileEntry } from './indexer.js';
import { MAX_CONTEXT_FILES, MAX_CONTEXT_TOKENS } from '@devos/shared';
import fs from 'node:fs';
import path from 'node:path';
import { getLogger } from '@devos/logger';

const logger = getLogger({ module: 'context' });

export interface ContextFile {
  path: string;
  content: string;
  relevanceScore: number;
  reason: string;
}

/** Rough token estimation: ~4 chars per token */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Score a file's relevance to a query */
function scoreFile(file: FileEntry, queryTerms: string[]): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  const filePath = file.relativePath.toLowerCase();
  const fileName = filePath.split('/').pop() || '';

  for (const term of queryTerms) {
    const lowerTerm = term.toLowerCase();
    
    // Exact filename match
    if (fileName === lowerTerm || fileName === lowerTerm + path.extname(fileName)) {
      score += 10;
      reasons.push(`filename match: ${term}`);
    }
    // Path contains term
    else if (filePath.includes(lowerTerm)) {
      score += 5;
      reasons.push(`path contains: ${term}`);
    }
  }

  // Boost important files
  const IMPORTANT_NAMES = ['index', 'main', 'app', 'server', 'config', 'routes', 'api'];
  if (IMPORTANT_NAMES.some(n => fileName.startsWith(n))) {
    score += 2;
    reasons.push('important file');
  }

  // Boost recently modified files
  const hoursSinceModified = (Date.now() - file.modifiedAt.getTime()) / (1000 * 60 * 60);
  if (hoursSinceModified < 24) {
    score += 3;
    reasons.push('recently modified');
  } else if (hoursSinceModified < 168) { // 1 week
    score += 1;
    reasons.push('modified this week');
  }

  // Penalize large files slightly
  if (file.sizeBytes > 100_000) {
    score -= 1;
  }

  // Penalize test/spec files unless query mentions testing
  const hasTestTerms = queryTerms.some(t => ['test', 'spec', 'testing', 'jest', 'vitest'].includes(t.toLowerCase()));
  if (!hasTestTerms && (fileName.includes('.test.') || fileName.includes('.spec.') || filePath.includes('__tests__'))) {
    score -= 2;
  }

  return { score, reason: reasons.join(', ') || 'no specific match' };
}

export function selectContextFiles(
  index: ProjectIndex,
  query: string,
  maxFiles = MAX_CONTEXT_FILES,
  maxTokens = MAX_CONTEXT_TOKENS,
): ContextFile[] {
  // Extract search terms from query
  const queryTerms = query
    .split(/[\s,._\-/\\]+/)
    .filter(t => t.length > 2)
    .map(t => t.toLowerCase());

  // Score all non-directory files
  const scored = index.files
    .filter(f => !f.isDirectory)
    .map(f => ({
      file: f,
      ...scoreFile(f, queryTerms),
    }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxFiles * 2); // Get extra candidates

  // Read files and check token budget
  const result: ContextFile[] = [];
  let totalTokens = 0;

  for (const { file, score, reason } of scored) {
    if (result.length >= maxFiles) break;
    if (totalTokens >= maxTokens) break;

    try {
      let content = fs.readFileSync(file.absolutePath, 'utf-8');
      const tokens = estimateTokens(content);

      // Truncate very large files
      if (totalTokens + tokens > maxTokens && content.length > 2000) {
        const remainingTokens = maxTokens - totalTokens;
        content = content.slice(0, remainingTokens * 4) + '\n... [truncated]';
      }

      result.push({
        path: file.relativePath,
        content,
        relevanceScore: score,
        reason,
      });
      totalTokens += estimateTokens(content);
    } catch {
      // Skip unreadable files
    }
  }

  logger.debug('Selected context files', {
    query: query.slice(0, 100),
    filesSelected: result.length,
    totalTokens,
  });

  return result;
}
