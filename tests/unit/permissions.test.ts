import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PermissionEngine } from '@devos/permissions';

describe('PermissionEngine', () => {
  let engine: PermissionEngine;

  beforeEach(() => {
    engine = new PermissionEngine();
  });

  describe('safe actions', () => {
    it('should auto-approve safe actions', async () => {
      const result = await engine.check('safe', {
        action: 'read_file',
        description: 'Read a file',
        risk: 'low',
        details: {},
      }, 'session-1', 'task-1');

      expect(result).toBe(true);
    });
  });

  describe('blocked actions', () => {
    it('should deny blocked actions', async () => {
      const result = await engine.check('blocked', {
        action: 'rm -rf /',
        description: 'Dangerous command',
        risk: 'high',
        details: {},
      }, 'session-1', 'task-1');

      expect(result).toBe(false);
    });
  });

  describe('approval workflow', () => {
    it('should request approval for requires_approval actions', async () => {
      const callback = vi.fn().mockResolvedValue('allow_once');
      engine.setApprovalCallback(callback);

      const result = await engine.check('requires_approval', {
        action: 'write_file',
        description: 'Write a file',
        risk: 'medium',
        details: { path: 'test.txt' },
      }, 'session-1', 'task-1');

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalledOnce();
    });

    it('should deny when user denies approval', async () => {
      const callback = vi.fn().mockResolvedValue('deny');
      engine.setApprovalCallback(callback);

      const result = await engine.check('requires_approval', {
        action: 'write_file',
        description: 'Write a file',
        risk: 'medium',
        details: {},
      }, 'session-1', 'task-1');

      expect(result).toBe(false);
    });

    it('should grant session-level permission on allow_session', async () => {
      const callback = vi.fn().mockResolvedValue('allow_session');
      engine.setApprovalCallback(callback);

      // First call - should trigger callback
      await engine.check('requires_approval', {
        action: 'write_file',
        description: 'Write a file',
        risk: 'medium',
        details: {},
      }, 'session-1', 'task-1');

      // Second call - should use session grant
      await engine.check('requires_approval', {
        action: 'write_file',
        description: 'Write another file',
        risk: 'medium',
        details: {},
      }, 'session-1', 'task-2');

      expect(callback).toHaveBeenCalledOnce(); // Only called once!
    });

    it('should deny when no callback is set', async () => {
      const result = await engine.check('requires_approval', {
        action: 'write_file',
        description: 'Write a file',
        risk: 'medium',
        details: {},
      }, 'session-1', 'task-1');

      expect(result).toBe(false);
    });

    it('should clear session grants', async () => {
      const callback = vi.fn().mockResolvedValue('allow_session');
      engine.setApprovalCallback(callback);

      await engine.check('requires_approval', {
        action: 'write_file',
        description: 'Write a file',
        risk: 'medium',
        details: {},
      }, 'session-1', 'task-1');

      engine.clearSessionGrants('session-1');

      // Should need approval again
      await engine.check('requires_approval', {
        action: 'write_file',
        description: 'Write a file',
        risk: 'medium',
        details: {},
      }, 'session-1', 'task-2');

      expect(callback).toHaveBeenCalledTimes(2);
    });
  });
});
