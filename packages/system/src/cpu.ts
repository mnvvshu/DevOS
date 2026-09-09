import os from 'node:os';
import type { CpuUsage } from '@devos/shared';

interface CpuTimes {
  idle: number;
  total: number;
}

function getCpuTimes(): CpuTimes[] {
  return os.cpus().map((cpu) => {
    const times = cpu.times;
    const total = times.user + times.nice + times.sys + times.idle + times.irq;
    return { idle: times.idle, total };
  });
}

export async function getCpuUsage(intervalMs = 1000): Promise<CpuUsage> {
  const cpus = os.cpus();
  const start = getCpuTimes();
  
  await new Promise((resolve) => setTimeout(resolve, intervalMs));
  
  const end = getCpuTimes();
  
  const perCore = start.map((s, i) => {
    const e = end[i]!;
    const idleDiff = e.idle - s.idle;
    const totalDiff = e.total - s.total;
    return totalDiff === 0 ? 0 : Math.round((1 - idleDiff / totalDiff) * 100);
  });

  const avgUsage = perCore.length > 0 
    ? Math.round(perCore.reduce((a, b) => a + b, 0) / perCore.length)
    : 0;

  return {
    model: cpus[0]?.model || 'Unknown',
    cores: cpus.length,
    usagePercent: avgUsage,
    perCore,
  };
}
