import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 4173);
const AI_PROVIDER = (process.env.AI_PROVIDER || (process.env.OPENAI_API_KEY ? 'openai' : 'offline')).toLowerCase();
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini';
const OPENAI_API_BASE = (process.env.OPENAI_API_BASE || 'https://api.openai.com/v1').replace(/\/$/, '');
const MAX_BODY_BYTES = 1_000_000;

const feedbackSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    kind: { type: 'string', enum: ['conversation', 'retry', 'sentence'] },
    coachResponse: { type: 'string' },
    naturalVersion: { type: 'string' },
    corrections: {
      type: 'array',
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          category: { type: 'string' },
          original: { type: 'string' },
          correction: { type: 'string' },
          explanation: { type: 'string' },
          severity: { type: 'string', enum: ['important', 'repeated', 'upgrade'] }
        },
        required: ['category', 'original', 'correction', 'explanation', 'severity']
      }
    },
    strengths: { type: 'array', maxItems: 3, items: { type: 'string' } },
    targetExpressions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          expression: { type: 'string' },
          usedCorrectly: { type: 'boolean' },
          note: { type: 'string' }
        },
        required: ['expression', 'usedCorrectly', 'note']
      }
    },
    followUpQuestion: { type: 'string' },
    memoryItems: {
      type: 'array',
      maxItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          category: { type: 'string' },
          pattern: { type: 'string' },
          explanation: { type: 'string' },
          example: { type: 'string' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'] }
        },
        required: ['category', 'pattern', 'explanation', 'example', 'priority']
      }
    },
    retryComparison: {
      type: 'object',
      additionalProperties: false,
      properties: {
        summary: { type: 'string' },
        improved: { type: 'array', maxItems: 5, items: { type: 'string' } },
        stillReview: { type: 'array', maxItems: 5, items: { type: 'string' } },
        scoreBefore: { type: 'integer', minimum: 0, maximum: 100 },
        scoreAfter: { type: 'integer', minimum: 0, maximum: 100 }
      },
      required: ['summary', 'improved', 'stillReview', 'scoreBefore', 'scoreAfter']
    },
    expressionUsage: {
      type: 'object',
      additionalProperties: false,
      properties: {
        expression: { type: 'string' },
        usedCorrectly: { type: 'boolean' },
        note: { type: 'string' }
      },
      required: ['expression', 'usedCorrectly', 'note']
    }
  },
  required: [
    'kind', 'coachResponse', 'naturalVersion', 'corrections', 'strengths',
    'targetExpressions', 'followUpQuestion', 'memoryItems', 'retryComparison', 'expressionUsage'
  ]
};

function json(res, status, body) {
  const data = Buffer.from(JSON.stringify(body));
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': data.length,
    'Cache-Control': 'no-store'
  });
  res.end(data);
}

function text(res, status, body) {
  const data = Buffer.from(body);
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': data.length,
    'Cache-Control': 'no-store'
  });
  res.end(data);
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error('Request body is too large');
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function systemPrompt(task) {
  return `You are FluentLoop, an English coach for a B1 learner moving toward B2.
Return only data matching the supplied JSON schema.
Core behavior:
- Respond to the learner's meaning first, then correct language.
- Never interrupt. Analyze one complete paragraph or sentence at a time.
- Give at most 3 corrections, prioritizing errors that affect clarity, repeated patterns, and high-value B2 upgrades.
- Preserve the learner's intended meaning in naturalVersion.
- coachResponse and naturalVersion must be in English.
- correction explanations and memory explanations should be concise Traditional Chinese, with English examples when useful.
- Do not invent pronunciation judgments because only transcript text is provided.
- Target expressions must be evaluated only if listed in the request.
- memoryItems should contain reusable patterns, not one-off typos.
- For a retry, compare the new attempt with the original and populate retryComparison.
- For sentence practice, expressionUsage must evaluate the requested expression.
Task: ${task}.`;
}

function extractOutputText(data) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text;
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if ((content.type === 'output_text' || content.type === 'text') && typeof content.text === 'string') {
        return content.text;
      }
    }
  }
  return '';
}

async function callOpenAI(task, payload) {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set');
  const response = await fetch(`${OPENAI_API_BASE}/responses`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      store: false,
      input: [
        { role: 'developer', content: systemPrompt(task) },
        { role: 'user', content: JSON.stringify(payload) }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'fluentloop_feedback',
          strict: true,
          schema: feedbackSchema
        }
      }
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || `OpenAI request failed with ${response.status}`;
    throw new Error(message);
  }
  const output = extractOutputText(data);
  if (!output) throw new Error('The AI response did not include structured output');
  return JSON.parse(output);
}

function correction(category, original, fixed, explanation, severity = 'important') {
  return { category, original, correction: fixed, explanation, severity };
}

function mockFeedback(task, payload) {
  const textValue = String(payload.text || payload.sentence || payload.retryText || '').trim();
  const lower = textValue.toLowerCase();
  const corrections = [];
  let natural = textValue || 'No transcript was provided.';
  if (/\bneed (?!to\b)/i.test(natural)) {
    corrections.push(correction('Verb pattern', 'need + verb', 'need to + verb', 'need 後面接動詞時，通常使用 need to + 原形動詞。'));
    natural = natural.replace(/\bneed ([a-z]+)/i, 'need to $1');
  }
  if (/\bmany works\b/i.test(natural)) {
    corrections.push(correction('Countability', 'many works', 'a lot of work', '一般工作量的 work 通常不可數。'));
    natural = natural.replace(/\bmany works\b/i, 'a lot of work');
  }
  if (/\bit is emotional problem\b/i.test(natural)) {
    corrections.push(correction('Article', 'emotional problem', 'an emotional problem', '單數可數名詞 problem 前需要冠詞。'));
    natural = natural.replace(/it is emotional problem/i, 'it is an emotional problem');
  }
  if (natural && !/[.!?]$/.test(natural)) natural += '.';

  const targets = (payload.targetExpressions || []).map(expression => ({
    expression,
    usedCorrectly: lower.includes(String(expression).toLowerCase()),
    note: lower.includes(String(expression).toLowerCase()) ? 'The expression appears in the response.' : 'Not used in this response.'
  }));
  const memoryItems = corrections.map(item => ({
    category: item.category,
    pattern: `${item.original} → ${item.correction}`,
    explanation: item.explanation,
    example: natural,
    priority: item.severity === 'important' ? 'high' : 'medium'
  }));

  const base = {
    kind: task === 'retry' ? 'retry' : task === 'sentence' ? 'sentence' : 'conversation',
    coachResponse: lower.includes('stress') || lower.includes('overwhelm')
      ? 'That is a clear point. Stress can make a task feel harder to begin even when the deadline is understood.'
      : 'Your main idea is understandable. Adding one concrete example would make it stronger.',
    naturalVersion: natural,
    corrections: corrections.slice(0, 3),
    strengths: textValue ? ['You completed a full idea.', 'Your intended meaning is understandable.'] : [],
    targetExpressions: targets,
    followUpQuestion: 'Can you give a specific example from your own experience?',
    memoryItems,
    retryComparison: {
      summary: task === 'retry' ? 'The retry is clearer and keeps the same main idea.' : '',
      improved: task === 'retry' ? ['You completed a second attempt.'] : [],
      stillReview: task === 'retry' ? corrections.map(item => item.category) : [],
      scoreBefore: task === 'retry' ? 62 : 0,
      scoreAfter: task === 'retry' ? Math.min(90, 72 + Math.max(0, 3 - corrections.length) * 4) : 0
    },
    expressionUsage: {
      expression: payload.expression || '',
      usedCorrectly: payload.expression ? lower.includes(String(payload.expression).toLowerCase().split(/\s+/)[0]) : false,
      note: payload.expression ? 'Checked in deterministic test mode.' : ''
    }
  };
  return base;
}

function providerStatus() {
  if (AI_PROVIDER === 'openai') {
    return {
      connected: Boolean(process.env.OPENAI_API_KEY),
      provider: 'openai',
      mode: process.env.OPENAI_API_KEY ? 'ai' : 'offline',
      model: OPENAI_MODEL,
      message: process.env.OPENAI_API_KEY ? 'OpenAI backend configured.' : 'OPENAI_API_KEY is missing.'
    };
  }
  if (AI_PROVIDER === 'mock') {
    return {
      connected: true,
      provider: 'mock',
      mode: 'test',
      model: 'deterministic-test-feedback',
      message: 'Test mode is active. This is not semantic AI.'
    };
  }
  return {
    connected: false,
    provider: 'offline',
    mode: 'offline',
    model: null,
    message: 'No AI provider is configured. The app will use local rule-based fallback.'
  };
}

async function handleApi(req, res, pathname) {
  if (pathname === '/api/health' && req.method === 'GET') {
    return json(res, 200, { ok: true, version: '1.3', ...providerStatus() });
  }

  if (pathname === '/api/feedback' && req.method === 'POST') {
    try {
      const body = await readJson(req);
      const task = ['conversation', 'retry', 'sentence'].includes(body.task) ? body.task : null;
      if (!task) return json(res, 400, { ok: false, error: 'Invalid task' });
      if (AI_PROVIDER === 'offline') return json(res, 503, { ok: false, error: 'AI backend is not configured', mode: 'offline' });
      const feedback = AI_PROVIDER === 'mock'
        ? mockFeedback(task, body.payload || {})
        : await callOpenAI(task, body.payload || {});
      return json(res, 200, {
        ok: true,
        source: AI_PROVIDER === 'mock' ? 'test' : 'ai',
        provider: AI_PROVIDER,
        model: AI_PROVIDER === 'openai' ? OPENAI_MODEL : 'deterministic-test-feedback',
        feedback
      });
    } catch (error) {
      console.error(error);
      return json(res, 500, { ok: false, error: error.message || 'AI feedback failed' });
    }
  }

  return json(res, 404, { ok: false, error: 'API route not found' });
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

async function serveStatic(req, res, pathname) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const safePath = normalize(decodeURIComponent(requested)).replace(/^([.][.][/\\])+/, '');
  const fullPath = resolve(join(ROOT, safePath));
  if (!fullPath.startsWith(resolve(ROOT))) return text(res, 403, 'Forbidden');
  try {
    const info = await stat(fullPath);
    if (!info.isFile()) return text(res, 404, 'Not found');
    res.writeHead(200, {
      'Content-Type': mimeTypes[extname(fullPath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': fullPath.endsWith('index.html') ? 'no-store' : 'public, max-age=300'
    });
    createReadStream(fullPath).pipe(res);
  } catch {
    text(res, 404, 'Not found');
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || `${HOST}:${PORT}`}`);
  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url.pathname);
  return serveStatic(req, res, url.pathname);
});

server.listen(PORT, HOST, () => {
  const status = providerStatus();
  console.log(`FluentLoop v1.3: http://${HOST}:${PORT}`);
  console.log(`AI mode: ${status.mode} | provider: ${status.provider} | model: ${status.model || 'none'}`);
});
