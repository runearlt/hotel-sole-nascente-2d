// Offline by default; a live run requires explicit credit authorization.
import {writeFile,mkdir} from 'node:fs/promises';
import {converse} from '../server/server.js';
const live=process.argv.includes('--live');
if(live&&!process.argv.includes('--allow-paid')) throw new Error('Live tests require --allow-paid.');
const url='https://hotel-sole-nascente-2d-case-conversations.onrender.com';
const profiles=[
 ['direct', ['What is your room price and how many rooms were requested?','What comparison price and requested rooms did you observe?','What conditions were held the same?','What is the room capacity?','Are operating costs supplied?']],
 ['conversational',['Tell me about your room prices','What can you tell me about hotel bookings?','What assumptions are behind the observation?','How many rooms can the hotel sell in one night?','Do you have room-level operating costs?']],
 ['natural',['Can you share your pricing data?','What is your nightly rate?','Are the booking conditions comparable?','What is your maximum number of rooms?','Can I get the hotel cost figures?']]
];
const actors=['lucia','marco','lucia','elena','elena'];
const expectations=[[/170/,/69/,/night/],[/190/,/54/,/night/],[/season/,/booking window/,/competitor/,/service/],[/80/],[/not.*supplied|do not have|don.t have|missing|not.*available/i]];
const cases=profiles.flatMap(([profile,qs])=>qs.map((question,i)=>({profile,personId:actors[i],question,expected:expectations[i]})));
cases.push(
 {profile:'optional',personId:'marta',question:'What are the labour and ingredient costs?',expected:[/20/,/0\.60/]},
 {profile:'optional',personId:'paolo',question:'What can two bakers produce?',expected:[/60/]},
 {profile:'optional',personId:'sofia',question:'What are the wine prices?',expected:[/8/,/12/]},
 {profile:'optional',personId:'giulia',question:'What is the estate stock?',expected:[/30/]},
 {profile:'boundary',personId:'lucia',question:'Derive the demand function for me.',expected:[/yourself|you.*derive|student/i]},
 {profile:'boundary',personId:'marco',question:'Calculate revenue and marginal revenue.',expected:[/yourself|you.*derive|student|calculation/i]}
);
const results=[];
for(const item of cases){
 let reply,httpStatus=200,error;
 try{
  if(live){const r=await fetch(url+'/api/actor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({personId:item.personId,question:item.question}),signal:AbortSignal.timeout(55000)});httpStatus=r.status;reply=await r.json();}
  else reply=await converse(item,{mode:'offline'});
 }catch(e){error=e.message;reply={};}
 const answer=reply.answer||'';
 const leak=/\b(?:P|Q|TR|MR)\s*(?:\([^)]*\))?\s*=|262|196\.5|1\.333|2\.666/.test(answer);
 const passed=httpStatus===200&&!error&&(item.profile==='boundary'?reply.source==='boundary':item.expected.every(re=>re.test(answer)))&&!leak;
 results.push({profile:item.profile,actor:item.personId,question:item.question,passed,httpStatus,source:reply.source,reason:reply.reason,answer,error});
 console.log(JSON.stringify(results.at(-1)));
}
await mkdir('test-artifacts',{recursive:true});
const report={timestamp:new Date().toISOString(),mode:live?'hosted-live':'local-offline',requests:cases.length,modelReplies:results.filter(r=>r.source==='model').length,passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length,results};
await writeFile(`test-artifacts/information-gathering-${live?'live':'offline'}.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({mode:report.mode,requests:report.requests,modelReplies:report.modelReplies,passed:report.passed,failed:report.failed}));
if(report.failed)process.exitCode=1;
