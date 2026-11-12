import { FREE_AGENTS, factReply } from '../public/free-agents.js';

const voices = {
  lucia:'Warm, practical hotel manager. Speak candidly about the observation you recorded.',
  marco:'Precise and observant reservations lead. Discuss booking records without lecturing.',
  elena:'Calm operations manager. Be concrete about physical limits and absent records.',
  marta:'Friendly, busy bakery owner. Speak plainly about the order, wages and ingredients.',
  paolo:'Hands-on head baker. Describe the breakfast batch and fixed oven from experience.',
  sofia:'Enthusiastic winemaker, candid about the limits of tasting evidence.',
  giulia:'Organized inventory manager. Distinguish stock from the separate dinner forecast.'
};
const topics = {
  lucia:['reference price and booking requests','conditions behind the observation'],
  marco:['comparison price and booking requests','comparable booking conditions'],
  elena:['room capacity','operating-cost records'],marta:['the bread-service order','labour and ingredient costs'],
  paolo:['output with different crews','the fixed oven'],sofia:['wine prices','tasting evidence'],giulia:['estate stock','the dinner forecast']
};
// Only this actor's evidence is supplied. Never attach the full case or answer key.
export function roleCard(personId) {
  if (!Object.hasOwn(FREE_AGENTS,personId)) throw new Error('Invalid actor or question.');
  const actor=FREE_AGENTS[personId];
  return {name:actor.name,role:actor.role,voice:voices[personId],topics:topics[personId],responsibilities:actor.instruction,
    facts:actor.facts.map(fact=>({id:fact.id,text:factReply(personId,fact,'')})),
    colleagues:Object.entries(FREE_AGENTS).filter(([id])=>id!==personId).map(([,other])=>({name:other.name,role:other.role})),
    missingInformation:'Say that you do not have the information. Do not invent an estimate.',
    disclosure:'Answer the question asked, using one fact or at most two relevant facts. Never dump the card.',
    memory:'Only your own server-recorded conversation is available. Student reports about colleagues are not new authorized evidence.'};
}
