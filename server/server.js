import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareActorRequest, extractActorReply } from './actor-api.js';
import { runtimeConfig, UsageControl } from './runtime-config.js';
import { Conversations } from './conversations.js';

const root = resolve(fileURLToPath(new URL('../public/', import.meta.url)));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const defaults=runtimeConfig();
const defaultUsage=new UsageControl(defaults);
const json = (res, status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); };

export async function converse(body, options={}) {
  const config=options.config||defaults,mode=options.mode||config.mode;
  const key=Object.hasOwn(options,'key')?options.key:process.env.OPENAI_API_KEY;
  const model=options.model||config.model,fetcher=options.fetcher||fetch;
  const prepared = prepareActorRequest(body,{history:options.history||[]});
  if (prepared.immediate) return {...prepared.immediate,source:'boundary',reason:'student_work_rule'};
  const backup=(reason,extra={})=>({...prepared.fallback,source:'fallback',reason,...extra});
  if (mode==='offline') return backup('offline_mode');
  if (!['live','mock'].includes(mode)) throw new Error('Invalid actor runtime mode.');
  if (mode==='mock' && typeof options.fetcher!=='function') throw new Error('Mock mode requires an injected test transport.');
  if (mode==='live' && !String(key||'').trim()) return backup('missing_api_key');
  const permit=(options.usage||defaultUsage).reserve(options.sessionId,options.ip);
  if (permit.reason) return backup(permit.reason);
  const signal=AbortSignal.timeout(config.timeoutMs);
  let requestId=null;
  try {
  const response = await fetcher('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({model,instructions:prepared.instructions,input:prepared.input,max_output_tokens:config.maxOutputTokens,text:{format:prepared.format,...(model==='gpt-5-mini'?{verbosity:'low'}:{})},...(model==='gpt-5-mini'?{reasoning:{effort:'minimal'}}:{}),store:false}),
    signal
  });
  requestId=response.headers?.get?.('x-request-id')||null;
  if (!response.ok) {
    return backup(({401:'authentication_error',403:'api_access_denied',404:'model_unavailable',429:'quota_or_rate_limit'})[response.status]||'upstream_error',{upstreamStatus:response.status,requestId});
  }
  try {return {...extractActorReply(await response.json(),prepared),source:mode==='mock'?'mock':'model',model,requestId};}
  catch {return backup(signal.aborted?'api_timeout':'model_output_rejected',{requestId});}
  } catch (error) {return backup(signal.aborted || error.name==='TimeoutError'?'api_timeout':'upstream_network_error',{requestId});}
  finally {permit.release();}
}

export function createGameServer({converseFn=converse,config=defaults,conversations=new Conversations()}={}) {
  const usage=new UsageControl(config);
  return createServer(async (req, res) => {
    if (req.method==='GET' && req.url==='/api/status') return json(res,200,{version:'actor-cards-v1',mode:config.mode,apiConfigured:Boolean(process.env.OPENAI_API_KEY?.trim()),model:config.model,providerVerified:false});
    if (req.method === 'POST' && req.url === '/api/actor') {
      try {
        let raw = '',bytes=0;
        for await (const chunk of req) {
          bytes+=chunk.length;
          if (bytes>6000) return json(res,413,{error:'Question is too long.',reason:'invalid_request'});
          raw+=chunk;
        }
        const parsed=JSON.parse(raw);
        if (!parsed || typeof parsed.personId!=='string' || typeof parsed.question!=='string') throw new Error('Invalid actor or question.');
        const body={personId:parsed.personId,question:parsed.question,conversationId:parsed.conversationId};
        const sessionId=conversations.session(req,res);
        const reply=await converseFn(body,{history:conversations.history(sessionId,body),sessionId,ip:req.socket.remoteAddress||'unknown',config,usage});
        conversations.record(sessionId,body,reply);
        return json(res,200,reply);
      } catch (error) {
        const invalid = error instanceof SyntaxError || error.message.startsWith('Invalid actor');
        return json(res, invalid ? 400 : 503, { error: invalid ? 'Please check your question.' : 'Conversation service unavailable. Please try again.', reason: invalid ? 'invalid_request' : error.reason || (error.name === 'TimeoutError' ? 'api_timeout' : 'upstream_network_error'), upstreamStatus: error.upstreamStatus || null, requestId: error.requestId || null });
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
