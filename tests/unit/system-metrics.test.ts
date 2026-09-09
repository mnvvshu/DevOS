import { describe, it, expect } from 'vitest';
import { getMemoryUsage, getSystemInfo } from '@devos/system';

describe('System Metrics', () => {
  describe('getMemoryUsage', () => {
    it('should return valid memory info', () => {
      const mem = getMemoryUsage();
      expect(mem.totalBytes).toBeGreaterThan(0);
      expect(mem.freeBytes).toBeGreaterThan(0);
      expect(mem.usedBytes).toBeGreaterThan(0);
      expect(mem.usagePercent).toBeGreaterThanOrEqual(0);
      expect(mem.usagePercent).toBeLessThanOrEqual(100);
      expect(mem.totalBytes).toBe(mem.usedBytes + mem.freeBytes);
    });
  });

  describe('getSystemInfo', () => {
    it('should return system information', () => {
      const info = getSystemInfo();
      expect(info.platform).toBeTruthy();
      expect(info.arch).toBeTruthy();
      expect(info.hostname).toBeTruthy();
      expect(info.uptime).toBeGreaterThan(0);
      expect(info.nodeVersion).toMatch(/^v\d+/);
    });
  });
});
