import os from 'node:os';
import type { SystemInfo } from '@devos/shared';

export function getSystemInfo(): SystemInfo {
  return {
    platform: `${os.type()} ${os.release()}`,
    arch: os.arch(),
    hostname: os.hostname(),
    uptime: os.uptime(),
    nodeVersion: process.version,
  };
}
