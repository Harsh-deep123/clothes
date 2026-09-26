import { spawnSync } from 'child_process';
import net from 'net';

const HOST = '127.0.0.1';
const PORT = 27017;

function ping(timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: HOST, port: PORT }, () => {
      socket.end();
      resolve(true);
    });
    socket.setTimeout(timeoutMs);
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => resolve(false));
  });
}

async function waitForMongo(attempts = 12) {
  for (let i = 0; i < attempts; i += 1) {
    if (await ping()) return true;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

if (await ping()) {
  console.log('[mongo] already running on localhost:27017');
  process.exit(0);
}

console.log('[mongo] localhost:27017 is down; starting Windows service MongoDB…');
const started = spawnSync('net', ['start', 'MongoDB'], { encoding: 'utf8', shell: true });
const output = `${started.stdout || ''}${started.stderr || ''}`.trim();
if (output) console.log(output);

if (await waitForMongo()) {
  console.log('[mongo] service is listening on localhost:27017 (database clothes)');
  process.exit(0);
}

console.warn(
  '[mongo] could not start MongoDB automatically. Open an Administrator Command Prompt and run: net start MongoDB'
);
process.exit(0);
