import { randomUUID } from 'node:crypto';
import { DevOSError, ErrorCode, type Result } from './types.js';

export function generateId(): string {
  return randomUUID();
}

export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

export function err<T = never>(code: ErrorCode, message: string, recoverable = true, details?: Record<string, unknown>): Result<T> {
  return {
    success: false,
    error: { code, message, recoverable, details },
  };
}

export function createError(code: ErrorCode, message: string, recoverable = true, details?: Record<string, unknown>): DevOSError {
  return { code, message, recoverable, details };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function isAbsolutePath(p: string): boolean {
  return /^(?:[a-zA-Z]:\\|\/|\\\\)/.test(p);
}

export function normalizePathSeparators(p: string): string {
  return p.replace(/\\/g, '/');
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function nowISO(): string {
  return new Date().toISOString();
}
