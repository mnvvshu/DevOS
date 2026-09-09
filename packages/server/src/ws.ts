import type { FastifyInstance } from 'fastify';
import { WEBSOCKET_PATH } from '@devos/shared';
import { eventBus } from '@devos/logger';
import { getLogger } from '@devos/logger';

const logger = getLogger({ module: 'websocket' });

export function registerWebSocket(app: FastifyInstance): void {
  const clients = new Set<unknown>();

  app.get(WEBSOCKET_PATH, { websocket: true }, (socket: any, _request: any) => {
    logger.info('WebSocket client connected');
    clients.add(socket);

    socket.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        logger.debug('WebSocket message received', { type: message.type });
        
        if (message.type === 'approval:response') {
          eventBus.emit('approval:response', message.data);
        }
      } catch {
        logger.warn('Invalid WebSocket message');
      }
    });

    socket.on('close', () => {
      logger.info('WebSocket client disconnected');
      clients.delete(socket);
    });

    socket.on('error', (err: Error) => {
      logger.error('WebSocket error', { error: err.message });
      clients.delete(socket);
    });
  });

  // Forward all events to WebSocket clients
  eventBus.onAny((event) => {
    const message = JSON.stringify(event);
    for (const client of clients) {
      const ws = client as any;
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(message);
      }
    }
  });
}
