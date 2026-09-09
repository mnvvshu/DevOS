import { describe, it, expect } from 'vitest';
import { validatePath } from '@devos/permissions';

describe('Path Traversal Prevention', () => {
  const projectPath = process.platform === 'win32'
    ? 'C:\\Users\\dev\\project'
    : '/home/dev/project';

  const traversalAttempts = [
    '../../../etc/passwd',
    '..\\..\\..\\Windows\\System32\\config\\SAM',
    'src/../../../etc/shadow',
    'src/..%2f..%2f..%2fetc%2fpasswd',
    '....//....//....//etc/passwd',
    'src\\..\\..\\..\\Windows\\System32',
  ];

  for (const attempt of traversalAttempts) {
    it(`should block traversal: ${attempt}`, () => {
      const result = validatePath(attempt, projectPath);
      expect(result.allowed).toBe(false);
    });
  }

  it('should allow valid relative paths', () => {
    expect(validatePath('src/index.ts', projectPath).allowed).toBe(true);
    expect(validatePath('package.json', projectPath).allowed).toBe(true);
    expect(validatePath('src/components/App.tsx', projectPath).allowed).toBe(true);
  });

  const sensitiveFiles = [
    '.env',
    '.env.local',
    'id_rsa',
    'id_ed25519',
    '.npmrc',
  ];

  for (const file of sensitiveFiles) {
    it(`should block access to sensitive file: ${file}`, () => {
      const result = validatePath(file, projectPath);
      expect(result.allowed).toBe(false);
    });
  }
});
