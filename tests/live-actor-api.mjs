// Explicit live smoke test: three questions may use the deployment's paid API.
// No key is needed here: credentials stay on the game server.
if (!process.argv.includes('--allow-paid')) {
  console.error('Live model calls are disabled. Once credits are available, rerun with --allow-paid and the Node service URL.');
  process.exit(2);
}
const url = new URL(process.argv.slice(2).find(arg=>!arg.startsWith('--')) || 'https://hotel-sole-nascente-2d-case-conversations.onrender.com/');
if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Provide the game HTTP(S) URL.');
const statusResponse=await fetch(new URL('/api/status',url),{signal:AbortSignal.timeout(55000)});
const status=await statusResponse.json().catch(()=>null);
if (!statusResponse.ok || status?.version!=='actor-cards-v1' || status.mode!=='live' || !status.apiConfigured) {
  console.error('Latest Node release, ACTOR_API_MODE=live and a server-side key are required. No actor questions were sent.');
  process.exit(1);
}
const cases = [
  ['lucia', 'What is your reference room price and how many rooms were requested?'],
  ['marco', 'What comparison price and requested rooms did you observe?'],
  ['elena', 'What is the room capacity?']
];
let failures = 0;
for (const [personId, question] of cases) {
  try {
    const response = await fetch(new URL('/api/actor', url), {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({personId, question, history:[]}), signal:AbortSignal.timeout(55000)});
    const reply = await response.json().catch(() => null);
    if (!reply) throw new Error(`Endpoint returned HTTP ${response.status} without actor JSON; check that this is the Node web-service URL.`);
    if (!response.ok) {
      failures++;
      console.log(JSON.stringify({actor:personId,passed:false,httpStatus:response.status,reason:reply.reason || 'endpoint_error',upstreamStatus:reply.upstreamStatus || null,requestId:reply.requestId || null}));
      continue;
    }
    const expected=personId==='lucia'?[170,69]:personId==='marco'?[190,54]:[80];
    const prohibited=personId==='lucia'?[190,54,262]:personId==='marco'?[170,69,262]:[262];
    const quantity=n=>new RegExp(`\\b${n}\\b`).test(reply.answer||'');
    const passed = reply.source==='model' && Boolean(reply.requestId) && Boolean(reply.model) && expected.every(quantity) && !prohibited.some(quantity);
    if (!passed) failures++;
    console.log(JSON.stringify({actor:personId, passed, source:reply.source, reason:reply.reason || (passed ? null : 'not_reported_by_deployed_version'), model:reply.model || null, requestId:reply.requestId || null, answer:reply.answer}));
  } catch (error) { failures++; console.log(JSON.stringify({actor:personId, passed:false, error:error.message})); }
}
console.log(`${cases.length-failures}/${cases.length} model replies passed source, request ID and case checks.`);
if (failures) process.exitCode = 1;
