import net from 'node:net';
import dns from 'node:dns/promises';

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
const strict = process.env.DB_WAIT_STRICT === 'true';
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
  try {
    const lookup = await dns.lookup(host);
    console.log(`[wait-for-db] DNS ${host} -> ${lookup.address}`);
  } catch (error) {
    console.warn(`[wait-for-db] DNS lookup failed for ${host}: ${error instanceof Error ? error.message : String(error)}`);
  }
  const ok = await tryConnect();
  if (ok) {
    console.log(`[wait-for-db] Connected to ${host}:${port}`);
    process.exit(0);
  }
  await new Promise((r) => setTimeout(r, 1000));
}

const message = `[wait-for-db] Timeout waiting for ${host}:${port}`;
if (strict) {
  console.error(`${message} (strict mode on -> exiting)`);
  process.exit(1);
}
console.warn(`${message} (strict mode off -> continuing startup)`);
process.exit(0);
