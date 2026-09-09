import { type WSEvent, type WSEventType } from '@devos/shared';

type EventHandler<T = unknown> = (event: WSEvent<T>) => void;

export class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();

  on<T = unknown>(type: WSEventType, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    const handlerSet = this.handlers.get(type)!;
    handlerSet.add(handler as EventHandler);

    // Return unsubscribe function
    return () => {
      handlerSet.delete(handler as EventHandler);
    };
  }

  emit<T = unknown>(type: WSEventType, data: T, meta?: { taskId?: string; sessionId?: string }): void {
    const event: WSEvent<T> = {
      type,
      data,
      timestamp: new Date().toISOString(),
      taskId: meta?.taskId,
      sessionId: meta?.sessionId,
    };

    const handlers = this.handlers.get(type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (error) {
          console.error(`Event handler error for ${type}:`, error);
        }
      }
    }

    // Also emit to wildcard listeners
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        try {
          handler(event);
        } catch (error) {
          console.error('Wildcard event handler error:', error);
        }
      }
    }
  }

  onAny(handler: EventHandler): () => void {
    return this.on('*' as WSEventType, handler);
  }

  removeAll(): void {
    this.handlers.clear();
  }
}

// Singleton event bus
export const eventBus = new EventBus();
