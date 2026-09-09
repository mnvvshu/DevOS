import { execSync } from 'node:child_process';
import os from 'node:os';
import { getLogger } from '@devos/logger';
import type { DiskUsage } from '@devos/shared';

const logger = getLogger({ module: 'system-disk' });

export function getDiskUsage(): DiskUsage[] {
  if (os.platform() !== 'win32') {
    return [];
  }

  try {
    const stdout = execSync('wmic logicaldisk get caption,freespace,size', { timeout: 10000, encoding: 'utf-8' });
    const lines = stdout.trim().split('\n').slice(1);
    
    const disks: DiskUsage[] = [];
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        const caption = parts[0];
        const free = parseInt(parts[1] || '', 10);
        const total = parseInt(parts[2] || '', 10);
        if (!isNaN(free) && !isNaN(total) && total > 0) {
          const used = total - free;
          disks.push({
            filesystem: 'NTFS',
            mountpoint: caption || '',
            totalBytes: total,
            usedBytes: used,
            freeBytes: free,
            usagePercent: Math.round((used / total) * 100)
          });
        }
      }
    }
    return disks;
  } catch (err) {
    logger.error('Failed to get disk usage', { error: String(err) });
    return [];
  }
}
