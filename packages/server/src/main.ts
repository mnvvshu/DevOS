import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Load .env from monorepo root (three levels up from packages/server/src/)
dotenv.config({ path: resolve(__dirname, '..', '..', '..', '.env') });

import { createServer } from './server.js';
import { getDb } from '@devos/database';
import { registerAllTools } from '@devos/tools';
import { getLogger } from '@devos/logger';
import { DEFAULT_PORT, DEFAULT_HOST } from '@devos/shared';

const logger = getLogger({ module: 'main' });

async function main() {
  logger.info('Starting DevOS server...');

  // Initialize database
  getDb();
  logger.info('Database initialized');

  // Register all tools
  registerAllTools();
  logger.info('Tools registered');

  // Create and start server
  const port = parseInt(process.env['DEVOS_PORT'] || String(DEFAULT_PORT), 10);
  const host = process.env['DEVOS_HOST'] || DEFAULT_HOST;

  const server = await createServer();
  
  await server.listen({ port, host });
  logger.info(`DevOS server listening on http://${host}:${port}`);

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Failed to start DevOS server:', err);
  process.exit(1);
});
