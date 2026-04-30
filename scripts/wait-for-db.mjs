import net from 'node:net';

const url = process.env.DATABASE_URL;
if (!url) process.exit(0);

let host = 'db';
let port = 5432;
try {
  const parsed = new URL(url);
  host = parsed.hostname;
  port = Number(parsed.port || 5432);
} catch {
  // ignore
}

const timeoutMs = Number(process.env.DB_WAIT_TIMEOUT_MS || 60000);
const start = Date.now();

function tryConnect() {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(3000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

while (Date.now() - start < timeoutMs) {
  const ok = await tryConnect();
  if (ok) {
    console.log(`[wait-for-db] Connected to ${host}:${port}`);
    process.exit(0);
  }
  await new Promise((r) => setTimeout(r, 1000));
}

console.error(`[wait-for-db] Timeout waiting for ${host}:${port}`);
process.exit(1);
