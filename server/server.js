import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareActorRequest, extractAnswer } from './actor-api.js';

const root = resolve(fileURLToPath(new URL('../public/', import.meta.url)));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const limits = new Map();
const json = (res, status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); };

export async function converse(body, { key = process.env.OPENAI_API_KEY, fetcher = fetch, model = process.env.OPENAI_MODEL || 'gpt-5-mini' } = {}) {
  const prepared = prepareActorRequest(body);
  if (prepared.immediate) return { ...prepared.immediate, source: 'boundary' };
  if (!key) return { ...prepared.fallback, source: 'fallback' };
  const response = await fetcher('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, instructions: prepared.instructions, input: prepared.input, max_output_tokens: 180, store: false }),
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`Model service returned ${response.status}`);
  try { return { answer: extractAnswer(await response.json()), factId: prepared.fallback.factId, source: 'model' }; }
  catch { return { ...prepared.fallback, source: 'fallback' }; }
}

export function createGameServer({ converseFn = converse } = {}) {
  return createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/api/actor') {
      const ip = req.socket.remoteAddress || 'unknown', now = Date.now();
      const recent = (limits.get(ip) || []).filter(time => now - time < 60_000);
      if (recent.length >= 25) return json(res, 429, { error: 'Please wait a moment before asking again.' });
      recent.push(now); limits.set(ip, recent);
      try {
        let raw = '';
        for await (const chunk of req) {
          raw += chunk;
          if (raw.length > 6000) return json(res, 413, { error: 'Question is too long.' });
        }
        return json(res, 200, await converseFn(JSON.parse(raw)));
      } catch (error) {
        return json(res, error instanceof SyntaxError || error.message.startsWith('Invalid actor') ? 400 : 503, { error: error instanceof SyntaxError || error.message.startsWith('Invalid actor') ? 'Please check your question.' : 'Conversation service unavailable. Please try again.' });
      }
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Method not allowed.' });
    try {
      const url = new URL(req.url, 'http://localhost');
      const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
      if (path !== root && !path.startsWith(root + sep)) return json(res, 404, { error: 'Not found.' });
      const info = await stat(path);
      if (!info.isFile()) return json(res, 404, { error: 'Not found.' });
      res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      if (req.method === 'HEAD') return res.end();
      res.end(await readFile(path));
    } catch { json(res, 404, { error: 'Not found.' }); }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createGameServer().listen(Number(process.env.PORT || 8174), '0.0.0.0');
}
