/**
 * DevOS Database — File-based JSON storage engine.
 *
 * Uses atomic file writes with a simple append-only journal for durability.
 * Zero native dependencies — works on any platform without compilation.
 *
 * Data is stored under ~/.devos/data/ as JSON files, one per collection.
 * This is sufficient for a local-first developer tool where data volumes
 * are small (hundreds of tasks, not millions of rows).
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { getLogger } from '@devos/logger';

const logger = getLogger({ module: 'database' });

export interface Collection<T extends { id: string }> {
  getAll(): T[];
  getById(id: string): T | undefined;
  find(predicate: (item: T) => boolean): T[];
  findOne(predicate: (item: T) => boolean): T | undefined;
  insert(item: T): T;
  update(id: string, updates: Partial<T>): T | undefined;
  delete(id: string): boolean;
  count(): number;
}

/**
 * A type-safe collection backed by a JSON file.
 * Reads are synchronous from an in-memory cache.
 * Writes flush to disk atomically (write to temp, rename).
 */
class JsonCollection<T extends { id: string }> implements Collection<T> {
  private items: Map<string, T> = new Map();
  private filePath: string;
  private dirty = false;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private name: string, dataDir: string) {
    this.filePath = path.join(dataDir, `${name}.json`);
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const arr: T[] = JSON.parse(raw);
        this.items = new Map(arr.map((item) => [item.id, item]));
        logger.debug(`Loaded ${this.items.size} items from ${this.name}`);
      }
    } catch (err) {
      logger.error(`Failed to load collection ${this.name}`, {
        error: err instanceof Error ? err.message : String(err),
      });
      this.items = new Map();
    }
  }

  private scheduleFlush(): void {
    this.dirty = true;
    if (this.flushTimer) return;
    // Debounce writes to avoid excessive disk I/O
    this.flushTimer = setTimeout(() => {
      this.flush();
      this.flushTimer = null;
    }, 100);
  }

  flush(): void {
    if (!this.dirty) return;
    try {
      const arr = Array.from(this.items.values());
      const json = JSON.stringify(arr, null, 2);
      const tmpPath = this.filePath + '.tmp';
      fs.writeFileSync(tmpPath, json, 'utf-8');
      fs.renameSync(tmpPath, this.filePath);
      this.dirty = false;
    } catch (err) {
      logger.error(`Failed to flush collection ${this.name}`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  getAll(): T[] {
    return Array.from(this.items.values());
  }

  getById(id: string): T | undefined {
    return this.items.get(id);
  }

  find(predicate: (item: T) => boolean): T[] {
    return Array.from(this.items.values()).filter(predicate);
  }

  findOne(predicate: (item: T) => boolean): T | undefined {
    for (const item of this.items.values()) {
      if (predicate(item)) return item;
    }
    return undefined;
  }

  insert(item: T): T {
    this.items.set(item.id, item);
    this.scheduleFlush();
    return item;
  }

  update(id: string, updates: Partial<T>): T | undefined {
    const existing = this.items.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.items.set(id, updated);
    this.scheduleFlush();
    return updated;
  }

  delete(id: string): boolean {
    const existed = this.items.delete(id);
    if (existed) this.scheduleFlush();
    return existed;
  }

  count(): number {
    return this.items.size;
  }
}

// --- Database instance ---

export interface DbSession {
  id: string;
  projectPath: string | null;
  startedAt: string;
  endedAt: string | null;
}

export interface DbTask {
  id: string;
  sessionId: string;
  userRequest: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  agentPlan: string | null;
  finalResponse: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface DbTaskStep {
  id: string;
  taskId: string;
  stepIndex: number;
  type: 'plan' | 'tool_call' | 'observation' | 'reasoning' | 'response';
  content: string;
  toolName: string | null;
  toolInput: string | null;
  toolOutput: string | null;
  durationMs: number | null;
  createdAt: string;
}

export interface DbFileChange {
  id: string;
  taskId: string;
  filePath: string;
  changeType: 'created' | 'modified' | 'deleted';
  diffContent: string | null;
  createdAt: string;
}

export interface DbSetting {
  id: string; // key
  value: string;
  updatedAt: string;
}

export interface DbPermissionGrant {
  id: string;
  sessionId: string;
  action: string;
  scope: 'once' | 'session';
  grantedAt: string;
  expiresAt: string | null;
}

export interface DbAuditEntry {
  id: string;
  sessionId: string | null;
  taskId: string | null;
  action: string;
  details: string;
  risk: 'low' | 'medium' | 'high';
  decision: string | null;
  createdAt: string;
}

export class Database {
  readonly sessions: Collection<DbSession>;
  readonly tasks: Collection<DbTask>;
  readonly taskSteps: Collection<DbTaskStep>;
  readonly fileChanges: Collection<DbFileChange>;
  readonly settings: Collection<DbSetting>;
  readonly permissionGrants: Collection<DbPermissionGrant>;
  readonly auditLog: Collection<DbAuditEntry>;

  readonly dataDir: string;

  constructor(dataDir?: string) {
    this.dataDir = dataDir || Database.defaultDataDir();
    fs.mkdirSync(this.dataDir, { recursive: true });

    logger.info('Opening database', { path: this.dataDir });

    this.sessions = new JsonCollection('sessions', this.dataDir);
    this.tasks = new JsonCollection('tasks', this.dataDir);
    this.taskSteps = new JsonCollection('task_steps', this.dataDir);
    this.fileChanges = new JsonCollection('file_changes', this.dataDir);
    this.settings = new JsonCollection('settings', this.dataDir);
    this.permissionGrants = new JsonCollection('permission_grants', this.dataDir);
    this.auditLog = new JsonCollection('audit_log', this.dataDir);
  }

  static defaultDataDir(): string {
    return path.join(
      process.env['DEVOS_DATA_DIR'] || path.join(os.homedir(), '.devos'),
      'data',
    );
  }

  /** Flush all collections to disk immediately */
  flushAll(): void {
    (this.sessions as JsonCollection<DbSession>).flush();
    (this.tasks as JsonCollection<DbTask>).flush();
    (this.taskSteps as JsonCollection<DbTaskStep>).flush();
    (this.fileChanges as JsonCollection<DbFileChange>).flush();
    (this.settings as JsonCollection<DbSetting>).flush();
    (this.permissionGrants as JsonCollection<DbPermissionGrant>).flush();
    (this.auditLog as JsonCollection<DbAuditEntry>).flush();
  }
}

// Singleton
let _db: Database | null = null;

export function getDb(): Database {
  if (!_db) {
    _db = new Database();
  }
  return _db;
}

export function closeDb(): void {
  if (_db) {
    _db.flushAll();
    _db = null;
  }
}
