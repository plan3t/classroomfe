import { spawn } from 'node:child_process';

function run(cmd, args) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { stdio: 'inherit', env: process.env });
    p.on('close', (code) => resolve(code ?? 1));
  });
}

const waitCode = await run('node', ['scripts/wait-for-db.mjs']);
if (waitCode !== 0) process.exit(waitCode);

let code = await run('npx', ['prisma', 'migrate', 'deploy']);
if (code !== 0) {
  console.warn('[startup] prisma migrate deploy failed, trying prisma db push...');
  code = await run('npx', ['prisma', 'db', 'push']);
}
if (code !== 0) {
  console.error('[startup] Prisma schema sync failed. Exiting.');
  process.exit(code);
}

process.exit(await run('node', ['server.js']));
