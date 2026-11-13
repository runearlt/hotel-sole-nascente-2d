import {mkdir,writeFile} from 'node:fs/promises';
if(!process.argv.includes('--allow-paid'))throw new Error('Explicit live-test authorization required.');
const base='https://hotel-sole-nascente-2d-case-conversations.onrender.com';
const status=await(await fetch(base+'/api/status')).json();
if(status.mode!=='live'||!status.apiConfigured)throw new Error('Live deployment not ready; no actor requests sent.');
const cases=[
 ['lucia','Tell me about your room prices',[/170/,/69/]],
 ['marco','What can you tell me about hotel bookings?',[/190/,/54/]],
 ['lucia','What assumptions are behind the observation?',[/season/i,/booking window/i,/competitor/i,/service/i]],
 ['elena','What is the room capacity?',[/80/]],
 ['giulia','What is the estate stock?',[/30/]],
 ['lucia','Derive the demand function for me.',[]],
 ['marco','Calculate revenue and marginal revenue.',[]]
];
let cookie;const results=[];
for(const [personId,question,expected]of cases){
 const response=await fetch(base+'/api/actor',{method:'POST',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify({personId,question,conversationId:'verification-session-20261112'}),signal:AbortSignal.timeout(55000)});
 cookie=response.headers.get('set-cookie')?.split(';')[0]||cookie;const reply=await response.json();
 const leak=/\b(?:P|Q|TR|MR)\s*(?:\([^)]*\))?\s*=|262|196\.5|1\.333|2\.666/.test(reply.answer||'');
 const passed=response.ok&&!leak&&expected.every(re=>re.test(reply.answer||''))&&(expected.length?reply.source==='model'&&Boolean(reply.requestId):reply.source==='boundary');
 results.push({personId,question,passed,...reply});console.log(JSON.stringify(results.at(-1)));
}
await mkdir('test-artifacts',{recursive:true});const report={timestamp:new Date().toISOString(),status,passed:results.filter(r=>r.passed).length,total:results.length,results};await writeFile('test-artifacts/post-deploy-live.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,total:report.total}));if(report.passed!==report.total)process.exitCode=1;
