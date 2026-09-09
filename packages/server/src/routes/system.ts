import type { FastifyInstance } from 'fastify';
import { getCpuUsage, getMemoryUsage, getDiskUsage, getProcesses, getNetworkConnections, getSystemInfo } from '@devos/system';

export async function systemRoutes(app: FastifyInstance) {
  app.get('/info', async () => getSystemInfo());
  app.get('/cpu', async () => getCpuUsage(500));
  app.get('/memory', async () => getMemoryUsage());
  app.get('/disk', async () => getDiskUsage());
  app.get('/processes', async (request) => {
    const { limit } = request.query as { limit?: string };
    return getProcesses(limit ? parseInt(limit, 10) : 50);
  });
  app.get('/network', async () => getNetworkConnections());
  
  // All-in-one dashboard endpoint
  app.get('/dashboard', async () => {
    const [cpu, memory, disk, info] = await Promise.all([
      getCpuUsage(500),
      getMemoryUsage(),
      getDiskUsage(),
      Promise.resolve(getSystemInfo()),
    ]);
    return { cpu, memory, disk, info };
  });
}
