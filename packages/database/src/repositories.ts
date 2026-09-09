/**
 * Repository pattern for database access.
 * Provides typed, domain-specific query methods on top of the generic Collection interface.
 */

import { generateId, nowISO } from '@devos/shared';
import {
  getDb,
  type DbSession,
  type DbTask,
  type DbTaskStep,
  type DbAuditEntry,
} from './connection.js';

// --- Session Repository ---

export class SessionRepository {
  create(projectPath: string | null): DbSession {
    const session: DbSession = {
      id: generateId(),
      projectPath,
      startedAt: nowISO(),
      endedAt: null,
    };
    return getDb().sessions.insert(session);
  }

  getById(id: string): DbSession | undefined {
    return getDb().sessions.getById(id);
  }

  getRecent(limit = 20): DbSession[] {
    return getDb()
      .sessions.getAll()
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, limit);
  }

  end(id: string): DbSession | undefined {
    return getDb().sessions.update(id, { endedAt: nowISO() });
  }
}

// --- Task Repository ---

export class TaskRepository {
  create(sessionId: string, userRequest: string): DbTask {
    const task: DbTask = {
      id: generateId(),
      sessionId,
      userRequest,
      status: 'pending',
      agentPlan: null,
      finalResponse: null,
      createdAt: nowISO(),
      completedAt: null,
    };
    return getDb().tasks.insert(task);
  }

  getById(id: string): DbTask | undefined {
    return getDb().tasks.getById(id);
  }

  getBySessionId(sessionId: string): DbTask[] {
    return getDb()
      .tasks.find((t) => t.sessionId === sessionId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  updateStatus(id: string, status: DbTask['status']): DbTask | undefined {
    const updates: Partial<DbTask> = { status };
    if (status === 'completed' || status === 'failed') {
      updates.completedAt = nowISO();
    }
    return getDb().tasks.update(id, updates);
  }

  setResponse(id: string, response: string): DbTask | undefined {
    return getDb().tasks.update(id, { finalResponse: response });
  }

  getRecent(limit = 50): DbTask[] {
    return getDb()
      .tasks.getAll()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }
}

// --- Task Step Repository ---

export class TaskStepRepository {
  create(
    taskId: string,
    stepIndex: number,
    type: DbTaskStep['type'],
    content: string,
    opts?: {
      toolName?: string;
      toolInput?: Record<string, unknown>;
      toolOutput?: unknown;
      durationMs?: number;
    },
  ): DbTaskStep {
    const step: DbTaskStep = {
      id: generateId(),
      taskId,
      stepIndex,
      type,
      content,
      toolName: opts?.toolName ?? null,
      toolInput: opts?.toolInput ? JSON.stringify(opts.toolInput) : null,
      toolOutput: opts?.toolOutput ? JSON.stringify(opts.toolOutput) : null,
      durationMs: opts?.durationMs ?? null,
      createdAt: nowISO(),
    };
    return getDb().taskSteps.insert(step);
  }

  getByTaskId(taskId: string): DbTaskStep[] {
    return getDb()
      .taskSteps.find((s) => s.taskId === taskId)
      .sort((a, b) => a.stepIndex - b.stepIndex);
  }
}

// --- Settings Repository ---

export class SettingsRepository {
  get(key: string): string | undefined {
    return getDb().settings.getById(key)?.value;
  }

  set(key: string, value: string): void {
    const existing = getDb().settings.getById(key);
    if (existing) {
      getDb().settings.update(key, { value, updatedAt: nowISO() });
    } else {
      getDb().settings.insert({ id: key, value, updatedAt: nowISO() });
    }
  }

  getAll(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const setting of getDb().settings.getAll()) {
      result[setting.id] = setting.value;
    }
    return result;
  }
}

// --- Audit Repository ---

export class AuditRepository {
  log(entry: {
    sessionId?: string;
    taskId?: string;
    action: string;
    details: Record<string, unknown>;
    risk: 'low' | 'medium' | 'high';
    decision?: string;
  }): DbAuditEntry {
    const auditEntry: DbAuditEntry = {
      id: generateId(),
      sessionId: entry.sessionId ?? null,
      taskId: entry.taskId ?? null,
      action: entry.action,
      details: JSON.stringify(entry.details),
      risk: entry.risk,
      decision: entry.decision ?? null,
      createdAt: nowISO(),
    };
    return getDb().auditLog.insert(auditEntry);
  }

  getRecent(limit = 100): DbAuditEntry[] {
    return getDb()
      .auditLog.getAll()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  getByTask(taskId: string): DbAuditEntry[] {
    return getDb().auditLog.find((e) => e.taskId === taskId);
  }
}
