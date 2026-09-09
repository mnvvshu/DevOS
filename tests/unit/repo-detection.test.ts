import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectProject } from '@devos/repo-intel';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('Repository Detection', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devos-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should detect a Node.js project', async () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      name: 'test-project',
      dependencies: { react: '^18.0.0', express: '^4.0.0' },
      devDependencies: { vitest: '^1.0.0', vite: '^5.0.0' },
    }));
    fs.writeFileSync(path.join(tmpDir, 'tsconfig.json'), '{}');
    fs.writeFileSync(path.join(tmpDir, 'pnpm-lock.yaml'), '');
    fs.mkdirSync(path.join(tmpDir, 'src'));
    fs.writeFileSync(path.join(tmpDir, 'src', 'index.ts'), 'export {}');

    const info = await detectProject(tmpDir);

    expect(info.languages).toContain('TypeScript');
    expect(info.frameworks).toContain('React');
    expect(info.frameworks).toContain('Express');
    expect(info.packageManager).toBe('pnpm');
    expect(info.testFramework).toBe('Vitest');
    expect(info.buildSystem).toBe('Vite');
  });

  it('should detect Docker setup', async () => {
    fs.writeFileSync(path.join(tmpDir, 'Dockerfile'), 'FROM node:20');
    fs.writeFileSync(path.join(tmpDir, 'docker-compose.yml'), 'version: 3');

    const info = await detectProject(tmpDir);
    expect(info.hasDocker).toBe(true);
  });

  it('should detect CI setup', async () => {
    fs.mkdirSync(path.join(tmpDir, '.github', 'workflows'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, '.github', 'workflows', 'ci.yml'), 'name: CI');

    const info = await detectProject(tmpDir);
    expect(info.hasCI).toBe(true);
  });

  it('should handle empty directories', async () => {
    const info = await detectProject(tmpDir);
    expect(info.languages).toEqual([]);
    expect(info.frameworks).toEqual([]);
  });
});
