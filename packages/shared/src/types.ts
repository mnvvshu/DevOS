// Result type for all operations
export type Result<T, E = DevOSError> = { success: true; data: T } | { success: false; error: E };

// Standard error structure  
export interface DevOSError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  recoverable: boolean;
}

// Error codes enum
export enum ErrorCode {
  COMMAND_TIMEOUT = 'COMMAND_TIMEOUT',
  COMMAND_DENIED = 'COMMAND_DENIED',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  PATH_TRAVERSAL = 'PATH_TRAVERSAL',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  PROVIDER_NOT_CONFIGURED = 'PROVIDER_NOT_CONFIGURED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TOOL_EXECUTION_ERROR = 'TOOL_EXECUTION_ERROR',
  GIT_ERROR = 'GIT_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Tool-related types
export type PermissionLevel = 'safe' | 'requires_approval' | 'blocked';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
  permissionLevel: PermissionLevel;
}

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: DevOSError;
  durationMs: number;
  toolName: string;
}

// Session & Task types
export interface Session {
  id: string;
  startedAt: Date;
  projectPath: string | null;
}

export interface Task {
  id: string;
  sessionId: string;
  userRequest: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  completedAt: Date | null;
}

export interface TaskStep {
  id: string;
  taskId: string;
  type: 'plan' | 'tool_call' | 'observation' | 'reasoning' | 'response';
  content: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: unknown;
  createdAt: Date;
  durationMs?: number;
}

// AI Provider types
export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  toolCalls?: AIToolCall[];
}

export interface AIToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface AIProviderConfig {
  provider: 'openai' | 'anthropic' | 'ollama';
  apiKey?: string;
  model: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

// Project/Repo types
export interface ProjectInfo {
  path: string;
  name: string;
  languages: string[];
  frameworks: string[];
  packageManager: string | null;
  buildSystem: string | null;
  testFramework: string | null;
  hasDocker: boolean;
  hasCI: boolean;
  entryPoints: string[];
  importantFiles: string[];
}

// System diagnostic types
export interface SystemInfo {
  platform: string;
  arch: string;
  hostname: string;
  uptime: number;
  nodeVersion: string;
}

export interface CpuUsage {
  model: string;
  cores: number;
  usagePercent: number;
  perCore: number[];
}

export interface MemoryUsage {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  usagePercent: number;
}

export interface DiskUsage {
  filesystem: string;
  mountpoint: string;
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  usagePercent: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpuPercent: number;
  memoryBytes: number;
  command: string;
}

export interface NetworkConnection {
  protocol: string;
  localAddress: string;
  localPort: number;
  remoteAddress: string;
  remotePort: number;
  state: string;
}

// WebSocket event types
export type WSEventType = 
  | 'agent:thinking'
  | 'agent:tool_call'
  | 'agent:tool_result'
  | 'agent:response'
  | 'agent:error'
  | 'agent:complete'
  | 'task:created'
  | 'task:updated'
  | 'approval:request'
  | 'approval:response'
  | 'terminal:output'
  | 'system:metrics';

export interface WSEvent<T = unknown> {
  type: WSEventType;
  taskId?: string;
  sessionId?: string;
  timestamp: string;
  data: T;
}

// Approval types
export interface ApprovalRequest {
  id: string;
  taskId: string;
  action: string;
  description: string;
  risk: 'low' | 'medium' | 'high';
  details: Record<string, unknown>;
  createdAt: string;
}

export type ApprovalDecision = 'allow_once' | 'allow_session' | 'deny';
