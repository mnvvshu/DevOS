import { describe, it, expect } from 'vitest';
import { generateId, ok, err, formatBytes, formatDuration, truncate, isAbsolutePath, normalizePathSeparators } from '@devos/shared';
import { ErrorCode } from '@devos/shared';

describe('Shared Utils', () => {
  describe('generateId', () => {
    it('should generate unique UUIDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^[0-9a-f-]{36}$/);
    });
  });

  describe('ok/err result types', () => {
    it('should create success result', () => {
      const result = ok('data');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('data');
      }
    });

    it('should create error result', () => {
      const result = err(ErrorCode.FILE_NOT_FOUND, 'File not found');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FILE_NOT_FOUND');
        expect(result.error.message).toBe('File not found');
        expect(result.error.recoverable).toBe(true);
      }
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
    });
  });

  describe('formatDuration', () => {
    it('should format durations correctly', () => {
      expect(formatDuration(500)).toBe('500ms');
      expect(formatDuration(1500)).toBe('1.5s');
      expect(formatDuration(90000)).toBe('1m 30s');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('short', 10)).toBe('short');
      expect(truncate('this is a long string', 10)).toBe('this is...');
    });
  });

  describe('isAbsolutePath', () => {
    it('should detect absolute paths', () => {
      expect(isAbsolutePath('C:\\Users')).toBe(true);
      expect(isAbsolutePath('/home/user')).toBe(true);
      expect(isAbsolutePath('relative/path')).toBe(false);
    });
  });

  describe('normalizePathSeparators', () => {
    it('should convert backslashes to forward slashes', () => {
      expect(normalizePathSeparators('C:\\Users\\test')).toBe('C:/Users/test');
    });
  });
});
