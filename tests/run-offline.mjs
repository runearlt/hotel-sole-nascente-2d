import './no-paid-calls.mjs';
import {spawn} from 'node:child_process';
import {mkdir,writeFile,readdir} from 'node:fs/promises';
import {createGameServer,converse} from '../server/server.js';
import {runtimeConfig} from '../server/runtime-config.js';
import {mockProvider} from './mock-provider.mjs';

await mkdir('test-artifacts',{recursive:true});
const stats={mockProviderCalls:0,realProviderCalls:0,sources:{},fallbackReasons:{}};
const config={...runtimeConfig(),callsPerDay:10000,callsPerSessionMinute:1000,callsPerIpMinute:10000};
const server=createGameServer({config,converseFn:async(body,options)=>{
  const reply=await converse(body,{...options,mode:'mock',key:'',fetcher:(...args)=>{stats.mockProviderCalls++;return mockProvider(...args);}});
  stats.sources[reply.source]=(stats.sources[reply.source]||0)+1;
  if (reply.source==='fallback') stats.fallbackReasons[reply.reason]=(stats.fallbackReasons[reply.reason]||0)+1;
  return reply;
}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}/`;
const results=[];
async function run(name,args) {
  console.log(`Running ${name} with external network disabled`);
  const child=spawn(process.execPath,args,{env:{...process.env,GAME_URL:url,ACTOR_API_MODE:'offline',OPENAI_API_KEY:'',STUDENTS:'100',EXPECT_MOCK_TRANSPORT:'1'},stdio:['ignore','pipe','pipe']});
  let log='';child.stdout.on('data',chunk=>{log+=chunk;});child.stderr.on('data',chunk=>{log+=chunk;});
  const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);});
  await writeFile(`test-artifacts/${name}.log`,log);
  results.push({name,exitCode:code});
  console.log(`${name}: ${code===0?'passed':'FAILED'}`);
  if (code!==0) {console.error(log);throw new Error(`${name} failed`);}
}
let failure;
try {
  const files=(await readdir('tests')).filter(name=>name.endsWith('.test.mjs')).map(name=>'tests/'+name);
  await run('unit-and-http',['--import','./tests/no-paid-calls.mjs','--test',...files]);
  await run('student-journeys',['--import','./tests/no-paid-calls.mjs','tests/student-journey.mjs']);
  await run('100-student-simulation',['--import','./tests/no-paid-calls.mjs','tests/simulate-students.mjs']);
  if (!stats.sources.mock || stats.sources.model || stats.sources.fallback) throw new Error('Unexpected transport source or fallback in mocked journeys.');
} catch(error) {failure=error;}
finally {await new Promise(resolve=>server.close(resolve));}
const report={timestamp:new Date().toISOString(),mode:'offline-mocked-provider',paidCalls:0,liveProviderVerified:false,results,stats,passed:!failure};
await writeFile('test-artifacts/offline-verification.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if (failure) {console.error(failure.message);process.exitCode=1;}
