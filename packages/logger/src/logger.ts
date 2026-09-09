

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  taskId?: string;
  sessionId?: string;
  tool?: string;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class Logger {
  private minLevel: LogLevel;
  private defaultContext: Record<string, unknown>;

  constructor(minLevel: LogLevel = 'info', defaultContext: Record<string, unknown> = {}) {
    this.minLevel = minLevel;
    this.defaultContext = defaultContext;
  }

  child(context: Record<string, unknown>): Logger {
    const child = new Logger(this.minLevel, { ...this.defaultContext, ...context });
    return child;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.minLevel]) return;
    
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { ...this.defaultContext, ...context },
    };

    // Structured JSON output
    const output = JSON.stringify(entry);
    
    if (level === 'error') {
      console.error(output);
    } else if (level === 'warn') {
      console.warn(output);
    } else {
      console.log(output);
    }
  }
}

// Singleton default logger
let defaultLogger = new Logger(
  (process.env['LOG_LEVEL'] as LogLevel) || 'info'
);

export function getLogger(context?: Record<string, unknown>): Logger {
  return context ? defaultLogger.child(context) : defaultLogger;
}

export function setLogLevel(level: LogLevel): void {
  defaultLogger = new Logger(level);
}
