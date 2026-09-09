import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ok, err, ErrorCode, type Result } from '@devos/shared';
import { getLogger } from '@devos/logger';

const execFileAsync = promisify(execFile);
const logger = getLogger({ module: 'git-ops' });

export interface GitStatusFile {
  status: string; // 'M', 'A', 'D', '?', etc.
  path: string;
}

export interface GitLogEntry {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
}

export interface GitBranch {
  name: string;
  current: boolean;
}

export class GitOps {
  constructor(private repoPath: string) {}

  private async exec(args: string[]): Promise<Result<string>> {
    try {
      const { stdout } = await execFileAsync('git', args, {
        cwd: this.repoPath,
        timeout: 10000,
        maxBuffer: 10 * 1024 * 1024,
      });
      return ok(stdout);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Git command failed', { args, error: message });
      return err(ErrorCode.GIT_ERROR, message, true);
    }
  }

  async isRepo(): Promise<boolean> {
    const result = await this.exec(['rev-parse', '--is-inside-work-tree']);
    if (result.success && result.data.trim() === 'true') {
      return true;
    }
    return false;
  }

  async status(): Promise<Result<GitStatusFile[]>> {
    const result = await this.exec(['status', '--porcelain']);
    if (!result.success) return result;
    
    const lines = result.data.split('\n').filter((l: string) => l.length > 0);
    const statusFiles = lines.map((line: string) => {
      const status = line.substring(0, 2).trim();
      const path = line.substring(3).trim();
      return { status, path };
    });
    
    return ok(statusFiles);
  }

  async diff(file?: string): Promise<Result<string>> {
    const args = ['diff'];
    if (file) {
      args.push('--', file);
    }
    return this.exec(args);
  }

  async diffStaged(file?: string): Promise<Result<string>> {
    const args = ['diff', '--staged'];
    if (file) {
      args.push('--', file);
    }
    return this.exec(args);
  }

  async log(count = 20): Promise<Result<GitLogEntry[]>> {
    const format = '%H|%h|%an|%aI|%s';
    const result = await this.exec(['log', `-n`, String(count), `--format=${format}`]);
    if (!result.success) return result;

    const lines = result.data.split('\n').filter((l: string) => l.trim().length > 0);
    const entries = lines.map((line: string) => {
      const parts = line.split('|');
      return {
        hash: parts[0] || '',
        shortHash: parts[1] || '',
        author: parts[2] || '',
        date: parts[3] || '',
        message: parts.slice(4).join('|')
      };
    });
    
    return ok(entries);
  }

  async branches(): Promise<Result<GitBranch[]>> {
    const result = await this.exec(['branch', '--format=%(HEAD)%(refname:short)']);
    if (!result.success) return result;

    const lines = result.data.split('\n').filter((l: string) => l.trim().length > 0);
    const branches = lines.map((line: string) => {
      const current = line.startsWith('*');
      const name = current ? line.substring(1).trim() : line.trim();
      return { name, current };
    });
    
    return ok(branches);
  }

  async currentBranch(): Promise<Result<string>> {
    const result = await this.exec(['branch', '--show-current']);
    if (!result.success) return result;
    return ok(result.data.trim());
  }

  async show(ref: string, file: string): Promise<Result<string>> {
    return this.exec(['show', `${ref}:${file}`]);
  }
}
