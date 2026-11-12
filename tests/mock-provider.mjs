import { answerFreeQuestion, FREE_AGENTS, isBroadQuestion } from '../public/free-agents.js';

export const providerResponse=(answer,factIds=[],kind=factIds.length?'facts':'unknown')=>({ok:true,status:200,headers:new Headers({'x-request-id':'mock_request_not_live'}),json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({answer,factIds,kind})}]}]})});

// A deterministic test double for the transport and evidence protocol, not a language model.
export async function mockProvider(url,options) {
  const request=JSON.parse(options.body);
  const card=JSON.parse(request.instructions.split('\n').find(line=>line.startsWith('Your permitted role card: ')).slice('Your permitted role card: '.length));
  const personId=Object.keys(FREE_AGENTS).find(id=>FREE_AGENTS[id].name===card.name);
  const input=JSON.parse(request.input);
  const fallback=answerFreeQuestion(personId,input.studentQuestion,{history:input.previousTurns});
  const seen=new Set();
  const factIds=(fallback.factIds||[]).filter(id=>{const text=card.facts.find(f=>f.id===id)?.text;if (!text || seen.has(text)) return false;seen.add(text);return true;}).slice(0,2);
  const kind=factIds.length?'facts':isBroadQuestion(input.studentQuestion)?'scope':/Ask .*directly|knows about that|Ask (?:Lucia|Marco|Elena|Marta|Paolo|Sofia|Giulia)/i.test(fallback.answer)?'redirect':'unknown';
  return providerResponse(fallback.answer,factIds,kind);
}
