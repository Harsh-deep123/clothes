import type { IncomingMessage, ServerResponse } from 'http';
import { mongoStatus } from './mongo';

export function isMongoHealthApi(urlPath: string) {
  return urlPath === '/api/health/mongo';
}

export async function handleMongoHealth(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const method = (req.method || 'GET').toUpperCase();
  res.setHeader('Content-Type', 'application/json');
  if (method !== 'GET') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }
  const status = await mongoStatus();
  res.statusCode = status.connected ? 200 : 503;
  res.end(JSON.stringify(status));
}
