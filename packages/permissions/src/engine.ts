import type { PermissionLevel, ApprovalRequest, ApprovalDecision } from '@devos/shared';
import { generateId, nowISO } from '@devos/shared';
import { getLogger } from '@devos/logger';

export interface PermissionCheck {
  action: string;
  description: string;
  risk: 'low' | 'medium' | 'high';
  details: Record<string, unknown>;
}

export type ApprovalCallback = (request: ApprovalRequest) => Promise<ApprovalDecision>;

export class PermissionEngine {
  private sessionGrants = new Map<string, Set<string>>();
  private approvalCallback: ApprovalCallback | null = null;
  private logger = getLogger({ module: 'permissions' });

  setApprovalCallback(callback: ApprovalCallback): void {
    this.approvalCallback = callback;
  }

  async check(level: PermissionLevel, check: PermissionCheck, sessionId: string, taskId: string): Promise<boolean> {
    // SAFE actions are always allowed
    if (level === 'safe') {
      this.logger.debug('Auto-approved safe action', { action: check.action });
      return true;
    }

    // BLOCKED actions are always denied
    if (level === 'blocked') {
      this.logger.warn('Blocked dangerous action', { action: check.action });
      return false;
    }

    // Check session grants
    const sessionGrantSet = this.sessionGrants.get(sessionId);
    if (sessionGrantSet?.has(check.action)) {
      this.logger.info('Action approved via session grant', { action: check.action });
      return true;
    }

    // Request approval from user
    if (!this.approvalCallback) {
      this.logger.warn('No approval callback set, denying action', { action: check.action });
      return false;
    }

    const request: ApprovalRequest = {
      id: generateId(),
      taskId,
      action: check.action,
      description: check.description,
      risk: check.risk,
      details: check.details,
      createdAt: nowISO(),
    };

    const decision = await this.approvalCallback(request);

    if (decision === 'allow_session') {
      if (!this.sessionGrants.has(sessionId)) {
        this.sessionGrants.set(sessionId, new Set());
      }
      this.sessionGrants.get(sessionId)!.add(check.action);
    }

    return decision !== 'deny';
  }

  clearSessionGrants(sessionId: string): void {
    this.sessionGrants.delete(sessionId);
  }
}
