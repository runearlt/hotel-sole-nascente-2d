import { SCENARIO } from './config.js';
import { hotelAtPrice } from './economics.js';

// Instructor-editable role cards. Keep facts factual: decisions and calculations belong to students.
// Each entry has an interview milestone id, matching phrases, and a short response.
// This is a local, rule-based agent runtime; it does not send student text to an AI provider.
const roomsAt = price => Math.round(hotelAtPrice(price).requested);
export const FREE_AGENTS = {
  lucia: {
    name: 'Lucia', role: 'hotel manager',
    instruction: 'State current hotel facts. Do not derive demand, MR, elasticity, a room rate, or profit.',
    solutionBoundary: 'I can share room-rate and booking facts, but you must work out the rate and explain your choice.',
    scopePrompt: 'Ask me about the current room rate or bookings.',
    concepts: [
      { match: [/what (is|does).*demand mean/, /define demand/], say: 'Demand here means the number of room nights guests request at a given price.' },
      { match: [/what (is|does).*elasticity mean/, /define elasticity/], say: 'Price elasticity describes how strongly room requests change when the room price changes.' }
    ],
    facts: [
      { id: 'bookings', match: [/bookings?/, /requests?/, /rooms?.*(sell|sold|demand|occupied)/, /(sell|sold).*(rooms?|night)/, /demand.*(170|current)/, /how many.*(book|guest|room)/, /occupan/], say: () => `At €${SCENARIO.hotel.referencePrice}, guests request ${roomsAt(SCENARIO.hotel.referencePrice)} rooms. We have ${SCENARIO.hotel.rooms} rooms.` },
      { id: 'price', match: [/current.*(price|rate)/, /(price|rate).*(now|currently|charge)/, /room price/, /(price|rate|charge|cost).*(room|night)/, /(room|night).*(price|rate|cost)/, /what.*charge/], say: () => `Our current room rate is €${SCENARIO.hotel.referencePrice} per night.` },
      { id: 'supply', match: [/breakfast/, /bakery/, /bread supply/], say: () => 'Breakfast needs a reliable bread order. Marta at the bakery knows its production plans.' }
    ]
  },
  marco: {
    name: 'Marco', role: 'reservations lead',
    instruction: 'Give the second observation and comparability conditions. Never derive the demand equation.',
    solutionBoundary: 'I can give you the comparison observation, but the demand calculation is yours.',
    scopePrompt: 'Ask me about the other observation or the conditions behind it.',
    concepts: [
      { match: [/what (is|does).*marginal revenue mean/, /define marginal revenue/], say: 'Marginal revenue is the change in total revenue from one more room sold. You need the observations to derive it for this case.' }
    ],
    facts: [
      { id: 'other', match: [/other price/, /different price/, /second (price|rate|observation)/, /compar(e|ison).*(price|rate|book)/, /previous.*(price|rate|book)/, /another.*(price|rate|book)/, /190/], say: () => `At €${SCENARIO.hotel.comparisonPrice}, guests requested ${roomsAt(SCENARIO.hotel.comparisonPrice)} rooms.` },
      { id: 'comparable', match: [/comparab/, /same (season|conditions|period)/, /what (changed|stayed)/, /conditions?/, /observations?/, /fair comparison/], say: () => `Yes. ${SCENARIO.hotel.conditions}` },
      { id: 'changes', match: [/shift demand/, /affect demand/, /festival/, /competitor/, /season/], say: () => 'Season, festivals, competitor prices, and booking timing can affect demand.' }
    ]
  },
  elena: {
    name: 'Elena', role: 'operations manager',
    instruction: 'State capacity and missing cost information. Never claim a profit-maximizing price.',
    solutionBoundary: 'I can describe capacity and missing costs, but I cannot choose your room rate.',
    scopePrompt: 'Ask me about room capacity or available cost information.',
    concepts: [
      { match: [/difference.*(revenue|profit)/, /what (is|does).*profit mean/], say: 'Revenue is money received. Profit also subtracts costs, and we do not have room operating costs.' }
    ],
    facts: [
      { id: 'full', match: [/capacity/, /maximum.*rooms?/, /how many rooms/, /fully booked/, /more (guests|requests|rooms)/], say: () => `We can sell at most ${SCENARIO.hotel.rooms} rooms per night.` },
      { id: 'costs', match: [/costs?/, /profit/, /expenses?/, /margin/], say: () => 'Room operating costs have not been supplied. Room revenue alone cannot establish profit.' }
    ]
  },
  marta: {
    name: 'Marta', role: 'bakery owner',
    instruction: 'State the hotel order and unit costs. Leave staffing, output comparisons, and contribution to the student.',
    solutionBoundary: 'I can give you the order and costs; you decide how many bakers to hire.',
    scopePrompt: 'Ask me about the hotel order or bakery costs.',
    concepts: [],
    facts: [
      { id: 'order', match: [/order/, /hotel.*(need|guest|roll|breakfast)/, /rolls?.*(hotel|need)/, /how many.*(guest|breakfast)/, /breakfast.*(need|revenue)/], say: () => `The hotel expects ${SCENARIO.breakfast.guests} breakfast guests. Each needs one roll. It receives €${SCENARIO.breakfast.revenuePerBreakfast} per breakfast served.` },
      { id: 'cost', match: [/cost/, /wage/, /labou?r/, /ingredient/, /pay.*baker/], say: () => 'Labour is €20 per baker. Ingredients are €0.60 per roll produced.' }
    ]
  },
  paolo: {
    name: 'Paolo', role: 'head baker',
    instruction: 'State output observations and the fixed oven. Never calculate marginal product or choose a crew.',
    solutionBoundary: 'I can report output for each crew, but you must compare their marginal products.',
    scopePrompt: 'Ask me about output with a crew size or our oven.',
    concepts: [
      { match: [/what (is|does).*marginal product mean/, /define marginal product/], say: 'Marginal product is the extra output from adding one worker while the oven stays fixed.' }
    ],
    facts: [
      { id: 'one', match: [/one baker/, /1 baker/, /first baker/, /single baker/], say: () => 'One baker makes 40 rolls in a shift.' },
      { id: 'two', match: [/two bakers/, /2 bakers/, /second baker/], say: () => 'Two bakers together make 60 rolls in a shift.' },
      { id: 'three', match: [/three bakers/, /3 bakers/, /third baker/], say: () => 'Three bakers together make 65 rolls in a shift.' },
      { id: 'oven', match: [/oven/, /machine/, /fixed input/, /bottleneck/], say: () => 'We have one oven. Its size does not change when we hire more bakers.' }
    ]
  },
  sofia: {
    name: 'Sofia', role: 'winemaker',
    instruction: 'State wine options and tasting evidence. Never recommend an order or infer hotel profit from taste.',
    solutionBoundary: 'I can describe wines and tasting evidence; the purchase decision is yours.',
    scopePrompt: 'Ask me about wine prices, tasting, or investment evidence.',
    concepts: [],
    facts: [
      { id: 'options', match: [/wine.*(option|choice|price|cost|buy)/, /(option|choice|price|cost).*(wine|bottle)/, /house wine/, /estate reserve/], say: () => 'House wine costs €8 a bottle; estate reserve costs €12 a bottle.' },
      { id: 'taste', match: [/tast/, /score/, /prefer/, /quality/, /panel/], say: () => 'A small panel scored house wine 7/10 and estate reserve 9/10. That does not measure hotel profit.' },
      { id: 'investment', match: [/invest/, /build.*winery/, /own.*winery/, /npv/], say: () => 'An investment assessment would need upfront cost, future cash flows, a discount rate, and risk.' }
    ]
  },
  giulia: {
    name: 'Giulia', role: 'inventory manager',
    instruction: 'State stock and forecast assumptions. Leave bottle quantities and purchase totals to the student.',
    solutionBoundary: 'I can tell you what is in stock and the forecast assumptions; you calculate the order.',
    scopePrompt: 'Ask me about stock or the dinner forecast.',
    concepts: [
      { match: [/what (is|does).*forecast mean/, /define forecast/], say: 'A forecast is an estimate for the next period, not a guaranteed sale.' }
    ],
    facts: [
      { id: 'stock', match: [/stock/, /available/, /limit/, /supply/, /how many.*(reserve|estate|bottle)/], say: () => 'We have at most 60 estate reserve bottles this period. House wine can cover the rest.' },
      { id: 'forecast', match: [/forecast/, /dinner/, /how many.*(guest|need)/, /room.*(sold|guest)/], say: context => `Plan for ${context.nextPeriodGuests} room guests and ${SCENARIO.wine.outsideDiners} outside diners. Assume one bottle per dinner.` }
    ]
  }
};

const solutionRequest = /\b(solve|solution|answer|calculate|compute|derive|formula|equation|optimal|optimum|maximize|best (price|rate|plan|choice|number)|which (price|rate|plan|choice|number) should|do the math|tell me what to choose|give me the result)\b/i;
const normalize = text => String(text).toLowerCase().replace(/[^a-z0-9€]+/g, ' ').trim();
const relevant = (fact, text) => fact.match.some(pattern => pattern.test(text));

export function answerFreeQuestion(personId, text, context = {}) {
  const agent = FREE_AGENTS[personId];
  if (!agent) return { answer: 'I cannot help with that topic.', factId: null };
  const input = normalize(text);
  if (input.length < 5 || /^(hi|hello|hey|help|what|why|how|tell me|i don t know)[ ?.]*$/.test(input)) {
    return { answer: agent.scopePrompt, factId: null };
  }
  if (solutionRequest.test(input)) {
    return { answer: agent.solutionBoundary, factId: null };
  }
  const concept = agent.concepts.find(item => relevant(item, input));
  if (concept) return { answer: concept.say, factId: null };
  const fact = agent.facts.find(item => relevant(item, input));
  if (fact) return { answer: fact.say(context), factId: fact.id };
  const other = Object.values(FREE_AGENTS).find(candidate => candidate !== agent && candidate.facts.some(item => relevant(item, input)));
  if (other) return { answer: `${other.name}, the ${other.role}, knows about that. Ask them directly.`, factId: null };
  return { answer: `I do not have a case fact for that. ${agent.scopePrompt}`, factId: null };
}
