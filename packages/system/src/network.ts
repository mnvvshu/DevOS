import { execSync } from 'node:child_process';
import os from 'node:os';
import { getLogger } from '@devos/logger';
import type { NetworkConnection } from '@devos/shared';

const logger = getLogger({ module: 'system-network' });

export function getNetworkConnections(): NetworkConnection[] {
  if (os.platform() !== 'win32') {
    return [];
  }

  try {
    const stdout = execSync('netstat -ano', { timeout: 10000, encoding: 'utf-8' });
    const lines = stdout.trim().split('\n').slice(4);
    
    const connections: NetworkConnection[] = [];
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        const proto = parts[0] ?? '';
        const local = parts[1] ?? '';
        const foreign = parts[2] ?? '';
        const state = parts.length >= 5 ? (parts[3] ?? '') : '';

        // Parse address:port
        const localParts = local.split(':');
        const localPort = parseInt(localParts[localParts.length - 1] ?? '0', 10);
        const localAddr = localParts.slice(0, -1).join(':');

        const foreignParts = foreign.split(':');
        const remotePort = parseInt(foreignParts[foreignParts.length - 1] ?? '0', 10);
        const remoteAddr = foreignParts.slice(0, -1).join(':');
        
        connections.push({
          protocol: proto,
          localAddress: localAddr,
          localPort: isNaN(localPort) ? 0 : localPort,
          remoteAddress: remoteAddr,
          remotePort: isNaN(remotePort) ? 0 : remotePort,
          state: state || 'UNKNOWN',
        });
      }
    }
    return connections.slice(0, 100); // Limit to 100 connections
  } catch (err) {
    logger.error('Failed to get network connections', { error: String(err) });
    return [];
  }
}
