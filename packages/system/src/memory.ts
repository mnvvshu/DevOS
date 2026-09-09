import os from 'node:os';
import type { MemoryUsage } from '@devos/shared';

export function getMemoryUsage(): MemoryUsage {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  return {
    totalBytes: total,
    usedBytes: used,
    freeBytes: free,
    usagePercent: Math.round((used / total) * 100),
  };
}
