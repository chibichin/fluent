import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const port = 43137;
const child = spawn(process.execPath, ['server.mjs'], {
  cwd: new URL('.', import.meta.url),
  env: { ...process.env, AI_PROVIDER: 'mock', PORT: String(port), HOST: '127.0.0.1' },
  stdio: ['ignore', 'pipe', 'pipe']
});

let stderr = '';
child.stderr.on('data', chunk => { stderr += chunk.toString(); });

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) return response.json();
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Server did not start. ${stderr}`);
}

async function request(task, payload) {
  const response = await fetch(`http://127.0.0.1:${port}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, payload })
  });
  assert.equal(response.status, 200);
  return response.json();
}

try {
  const health = await waitForServer();
  assert.equal(health.connected, true);
  assert.equal(health.mode, 'test');

  const conversation = await request('conversation', {
    text: 'I think it is emotional problem because people need manage many works',
    question: 'What do you think?',
    targetExpressions: ['put off', 'overwhelmed', 'get started']
  });
  assert.equal(conversation.ok, true);
  assert.equal(conversation.feedback.kind, 'conversation');
  assert.ok(conversation.feedback.corrections.length >= 2);
  assert.ok(conversation.feedback.memoryItems.length >= 2);

  const retry = await request('retry', {
    text: 'I think it is an emotional problem because people need to manage a lot of work.',
    originalText: 'I think it is emotional problem because people need manage many works',
    originalFeedback: conversation.feedback
  });
  assert.equal(retry.feedback.kind, 'retry');
  assert.ok(retry.feedback.retryComparison.scoreAfter >= retry.feedback.retryComparison.scoreBefore);

  const sentence = await request('sentence', {
    expression: 'overwhelmed',
    sentence: 'I feel overwhelmed when I have a lot of work.'
  });
  assert.equal(sentence.feedback.kind, 'sentence');
  assert.equal(sentence.feedback.expressionUsage.expression, 'overwhelmed');

  const index = await fetch(`http://127.0.0.1:${port}/`);
  assert.equal(index.status, 200);
  const html = await index.text();
  assert.ok(html.includes('FluentLoop'));

  console.log(JSON.stringify({
    status: 'passed',
    health,
    checks: ['health', 'conversation feedback', 'retry comparison', 'sentence feedback', 'static app']
  }, null, 2));
} finally {
  child.kill('SIGTERM');
}
