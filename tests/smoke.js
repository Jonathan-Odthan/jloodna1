const assert = require('assert');
const { spawn } = require('child_process');

const port = 3100 + Math.floor(Math.random() * 1000);
const server = spawn(process.execPath, ['backend/server.js'], {
  env: { ...process.env, PORT: String(port) },
  stdio: 'ignore',
});

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function request(path) {
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      return await fetch(`http://127.0.0.1:${port}${path}`);
    } catch (_) {
      await wait(100);
    }
  }
  throw new Error('Server did not start');
}

(async () => {
  try {
    const health = await request('/api/health');
    assert.strictEqual(health.status, 200);
    const healthBody = await health.json();
    assert.strictEqual(healthBody.status, 'OK');

    const missing = await request('/route-that-does-not-exist');
    assert.strictEqual(missing.status, 404);

    console.log('Smoke tests passed');
  } finally {
    server.kill();
  }
})().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
