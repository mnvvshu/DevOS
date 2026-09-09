import { execSync } from 'node:child_process';
import os from 'node:os';
import { getLogger } from '@devos/logger';
import type { ProcessInfo } from '@devos/shared';

const logger = getLogger({ module: 'system-processes' });

export function getProcesses(limit = 50): ProcessInfo[] {
  if (os.platform() !== 'win32') {
    return [];
  }

  try {
    const stdout = execSync('tasklist /FO CSV /NH', { timeout: 10000, encoding: 'utf-8' });
    const lines = stdout.trim().split('\n');
    
    let processes: ProcessInfo[] = [];
    for (const line of lines) {
      const match = line.match(/"([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]+)"/);
      if (match) {
        const name = match[1] ?? '';
        const pid = parseInt(match[2] ?? '', 10);
        const memStr = (match[5] ?? '').replace(/[^\d]/g, '');
        const memKb = parseInt(memStr, 10);
        const memoryBytes = isNaN(memKb) ? 0 : memKb * 1024;

        processes.push({
          pid,
          name: name || '',
          command: name || '',
          memoryBytes,
          cpuPercent: 0
        });
      }
    }
    
    processes.sort((a, b) => b.memoryBytes - a.memoryBytes);
    return processes.slice(0, limit);
  } catch (err) {
    logger.error('Failed to get processes', { error: String(err) });
    return [];
  }
}
