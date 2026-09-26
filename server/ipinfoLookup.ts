import type { IncomingMessage, ServerResponse } from 'http';

function clientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(',')[0].trim();
  }
  return (req.socket.remoteAddress || '').replace(/^::ffff:/, '');
}

function isPrivateIp(ip: string): boolean {
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') return true;
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('169.254.')) return true;
  const parts = ip.split('.').map(Number);
  if (parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  return false;
}

export async function handleIpinfoRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const token = process.env.IPINFO_TOKEN?.trim();
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  if (!token) {
    res.statusCode = 503;
    res.end(JSON.stringify({ error: 'IPINFO_TOKEN is not configured' }));
    return;
  }

  const ip = clientIp(req);
  const lookup = isPrivateIp(ip) ? 'me' : ip;
  const url = `https://api.ipinfo.io/lite/${encodeURIComponent(lookup)}?token=${encodeURIComponent(token)}`;

  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    const body = await response.text();
    res.statusCode = response.ok ? 200 : 502;
    res.end(body);
  } catch {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: 'Location lookup failed' }));
  }
}
