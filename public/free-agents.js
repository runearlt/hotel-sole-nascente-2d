import { SCENARIO } from './config.js';
import { HOTEL_DEMO } from './hotel-demo.js';
import { checkStudentDemand } from './demand-check.js';

// Instructor-editable role cards. Keep facts factual: decisions and calculations belong to students.
// Each entry has an interview milestone id, matching phrases, and a short response.
// This is a local, rule-based agent runtime; it does not send student text to an AI provider.
export const FREE_AGENTS = {
  lucia: {
    name: 'Lucia', role: 'hotel manager',
    instruction: 'You know only your own price–quantity observation and the stated conditions. Share that complete point when asked specifically; never reveal another actor’s point or a demand function. Broad questions get an introduction and two topics, not numbers.',
    solutionBoundary: 'My observation is €170 per room for one night, with 69 rooms requested. You need to derive the demand function yourself; Marco has the other observation.',
    scopePrompt: 'Ask me about our reference room price, bookings or the conditions behind those figures.',
    concepts: [
      { match: [/what (is|does).*demand mean/, /define demand/], say: 'Demand means the rooms guests request at a given nightly price. Actual sales are also limited by our capacity.' },
      { match: [/what (is|does).*elasticity mean/, /define elasticity/], say: 'Price elasticity describes the percentage response in room requests to a percentage price change, holding other conditions fixed.' }
    ],
    facts: [
      { id: 'price', match: [/\bprice\b/, /\brate\b/, /data point/, /observation/, /reference.*price/, /current.*(price|rate)/, /room.*(price|rate|cost)/, /(price|rate|charge|cost).*room/, /what.*charge/, /currency/, /unit/, /170/], say: () => 'At €170 per room for one night, we recorded 69 rooms requested. Marco can tell you about a separate observation.' },
      { id: 'bookings', match: [/booking/, /occupan/, /request/, /how many.*room/, /reference.*observation/, /business/, /busy/], say: () => 'At €170 per room for one night, we recorded 69 rooms requested. Marco can tell you about a separate observation.' },
      { id: 'events', match: [/climate/, /weather/, /season/, /competitor/, /change/, /challenges?/], say: () => 'The demonstration holds season, booking window, competitor prices and service conditions fixed. Changes in those could affect demand, but no numerical effect has been supplied.' },
      { id: 'supply', match: [/breakfast/, /bakery/, /bread/], say: () => 'Marta handles the optional breakfast exercise. Its guest counts and euro figures are separate assumptions, independent of this room-pricing demonstration.' }
    ]
  },
  marco: {
    name: 'Marco', role: 'reservations lead',
    instruction: 'You know only your own comparison point and comparable conditions. Never reveal Lucia’s point or a demand function. Students derive the function themselves.',
    solutionBoundary: 'My observation is €190 per room for one night, with 54 rooms requested. You need to derive the demand function yourself; Lucia has the other observation.',
    scopePrompt: 'I look after reservations. You can ask me about our comparison price and bookings, or the conditions behind that observation.',
    concepts: [
      { match: [/what (is|does).*marginal revenue mean/, /define marginal revenue/], say: 'Marginal revenue means the change in total revenue from an additional room sold. You need to derive the function yourself.' }
    ],
    facts: [
      { id: 'other', match: [/comparison/, /different price/, /other price/, /190/, /observation/, /price/, /booking/, /request/, /occupan/], say: () => 'At €190 per room for one night, we recorded 54 rooms requested. Lucia has a separate observation for you.' },
      { id: 'comparable', match: [/comparable/, /conditions?/, /same/, /booking window/, /season/], say: () => HOTEL_DEMO.conditions },
      { id: 'income', match: [/income/, /earnings/], say: () => 'I do not have income-elasticity estimates for this hotel.' },
      { id: 'cross', match: [/cross price/, /offer [ab]/, /offers?/], say: () => 'I do not have cross-price elasticities or numerical data for Offers A and B.' }
    ]
  },
  elena: {
    name: 'Elena', role: 'operations manager',
    instruction: 'Share the 80-room nightly capacity, its sales constraint and missing costs. Never calculate capped sales, revenue, profit or an optimum.',
    solutionBoundary: 'I can explain the capacity limit and what cost data are missing; the sales calculations and decisions are yours.',
    scopePrompt: 'Ask me about room capacity or the operating-cost information we have.',
    concepts: [
      { match: [/difference.*(revenue|profit)/, /what (is|does).*profit mean/], say: 'Revenue is money received from sales. Profit also subtracts operating costs, which are missing from this demonstration.' }
    ],
    facts: [
      { id: 'full', match: [/capacity/, /maximum.*rooms?/, /how many rooms/, /fully booked/, /sales? limit/, /more.*requests/], say: () => 'We have 80 rooms available for one night. Requested rooms can exceed that, but actual room sales cannot.' },
      { id: 'costs', match: [/costs?/, /profit/, /expenses?/, /margin/], say: () => HOTEL_DEMO.costStatus }
    ]
  },
  marta: {
    name: 'Marta', role: 'bakery owner',
    instruction: 'State the hotel order and unit costs. Leave staffing, output comparisons, and contribution to the student.',
    solutionBoundary: 'I can give you the order and costs; you decide how many bakers to hire.',
    scopePrompt: 'Ask me about the hotel order or bakery costs.',
    concepts: [],
    facts: [
      { id: 'order', match: [/order/, /hotel.*(need|guest|roll|breakfast)/, /rolls?.*(hotel|need)/, /how many.*(guest|breakfast)/, /breakfast.*(need|revenue)/], say: () => `The order is one roll for each of ${SCENARIO.breakfast.guests} breakfast guests. Our bread-service contract pays €${SCENARIO.breakfast.revenuePerBreakfast} per guest served; that is not the price of a full hotel breakfast.` },
      { id: 'cost', match: [/cost/, /wage/, /labou?r/, /ingredient/, /pay.*baker/], say: () => 'We schedule a one-hour breakfast batch. Labour is €20 per baker for that hour, and ingredients are €0.60 per roll produced.' },
      { id: 'surplus', match: [/leftover/, /surplus/, /resell/, /resale/, /waste/], say: () => 'Surplus rolls have €0 resale value for this bread-service contract.' }
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
      { id: 'one', match: [/one baker/, /1 baker/, /first baker/, /single baker/], say: () => 'One baker makes 40 rolls in our one-hour breakfast batch.' },
      { id: 'two', match: [/two bakers/, /2 bakers/, /second baker/], say: () => 'Two bakers together make 60 rolls in our one-hour breakfast batch.' },
      { id: 'three', match: [/three bakers/, /3 bakers/, /third baker/], say: () => 'Three bakers together make 65 rolls in our one-hour breakfast batch.' },
      { id: 'oven', match: [/oven/, /machine/, /fixed input/, /bottleneck/], say: () => 'We have one oven. Its size does not change when we hire more bakers.' }
    ]
  },
  sofia: {
    name: 'Sofia', role: 'winemaker',
    instruction: 'State wine options and tasting evidence. Never recommend an order or infer hotel profit from taste.',
    solutionBoundary: 'I can describe wines and tasting evidence; the purchase decision is yours.',
    scopePrompt: 'Ask me about wine options or the tasting evidence.',
    concepts: [],
    facts: [
      { id: 'options', match: [/wine.*(option|choice|price|cost|buy)/, /(option|choice|price|cost).*(wine|bottle)/, /house wine/, /estate reserve/, /mixed plan/], say: () => 'House wine costs €8 a bottle; estate reserve costs €12 a bottle. The mixed plan uses available estate stock first, then house wine for the remaining order.' },
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
      { id: 'stock', match: [/stock/, /available/, /limit/, /supply/, /how many.*(reserve|estate|bottle)/], say: () => `We have at most ${SCENARIO.wine.estateLimit} estate reserve bottles this period. House wine can cover the rest.` },
      { id: 'forecast', match: [/forecast/, /dinner/, /how many.*(guest|need)/, /room.*(sold|guest)/], say: context => `Our separate dinner forecast is ${context.nextPeriodGuests} resident diners and ${SCENARIO.wine.outsideDiners} outside diners. For this illustrative order, assume one 750 ml bottle shared by two adult diners choosing wine.` }
    ]
  }
};

export function isSolutionRequest(text) {
  const input = String(text).toLowerCase().replace(/[’‘]/g, "'")
    .replace(/\b(?:do not|don't|dont|never|without)\s+(?:please\s+)?(?:solve|solving|calculate|calculating|compute|computing|derive|deriving|differentiate|differentiating|rearrange|rearranging|invert|inverting)\b/g, '')
    .replace(/\b(?:i|we|students)\s+(?:need|want|have)\s+to\s+(?:calculate|compute|derive|solve)\b[^;?.]*[;?.]/g, '');
  if (/\b(solve|solutions?|calculate|compute|derive|differentiate|rearrange|invert|evaluate|optimal|optimum|maximi[sz](?:e|ing)|best (price|rate|plan|choice|number)|which (price|rate|plan|choice|number) should|do the math|tell me what to choose|give me (the |all )?(answers?|results?)|what is the answer)\b/.test(input)) return true;
  if (/\b(?:what is|what are|give me|tell me)\b.*\b(?:tr|mr|total revenue|marginal revenue)\b/.test(input) && !/mean|concept|define|definition|given|provided|supplied/.test(input)) return true;
  if (/\b(?:least|most)\s+(?:price[- ]?)?sensitive\b/.test(input)) return true;
  if (/\b(?:quantity|room[- ]nights? demanded|rooms demanded)\b.*\b(?:at|when|if)\b/.test(input)) return true;
  return /\b(?:what is|what are|tell me|give me)\b.*\b(?:price|point)\s+elasticit(?:y|ies)\b/.test(input) && !/cross[- ]price|income|\b(?:mean|concept|definition|define|given|provided|supplied)\b/.test(input);
}
const normalize = text => String(text).toLowerCase().replace(/[^a-z0-9€]+/g, ' ').trim();
const relevant = (fact, text) => fact.match.some(pattern => pattern.test(text));
export const isBroadQuestion = text => {
  const input=normalize(text);
  return input.length<5 || /^(help|what|why|how|tell me|tell me more|i don t know)$/.test(input) || /^(what can you tell me|tell me about|what do you know about)/.test(input);
};

export function factReply(personId, fact, question, context = {}) {
  const input = normalize(question);
  return fact.say({ ...context, nextPeriodGuests: SCENARIO.breakfast.guests });
}

export function answerFreeQuestion(personId, text, context = {}) {
  const agent = FREE_AGENTS[personId];
  if (!agent) return { answer: 'I cannot help with that topic.', factId: null };
  let input = normalize(text), followupFactId = null;
  const result = (answer, facts = []) => ({ answer, factId: facts[0] || null, factIds: facts });
  const pointIds = personId === 'lucia' ? ['price', 'bookings'] : ['other'];
  const point = ['lucia', 'marco'].includes(personId);
  const submitted = checkStudentDemand(text);
  if (submitted !== null) return { ...result(submitted ? 'Yes, your demand function matches the two observations. What would need to stay the same for it to describe bookings on another night?' : 'That function does not match both observations. Check your work against the figures you collected.'), immediate: true };
  if (/^(hi|hello|hey)( there)?$/.test(input)) return { answer: `Hello! I'm ${agent.name}, the ${agent.role}. ${agent.scopePrompt}`, factId: null };
  if (/^(thanks|thank you|thank you very much)$/.test(input)) return { answer: 'You’re welcome. Let me know what else you need.', factId: null };
  if (isBroadQuestion(text)) {
    return { answer: agent.scopePrompt, factId: null };
  }
  const suppliedObservation = !/calculate|compute|derive|solve|evaluate/i.test(text) && /\b(?:170|190)\b/.test(input) && /rooms?|booking|observation|request/.test(input);
  if ((isSolutionRequest(text) && !suppliedObservation) || /demand (function|equation|curve)|inverse demand|\b(slope|intercept)\b/.test(input)) {
    if (/check|correct|right|verify/.test(input) && /revenue|elasticity|\bmr\b|\btr\b/.test(input)) return { ...result('Please check that calculation in the student workspace.'), immediate: true };
    return { ...result(agent.solutionBoundary, point ? pointIds : []), immediate: true };
  }
  if (point && /\bboth\b|\btwo (points|observations)\b/.test(input)) return result(agent.solutionBoundary, pointIds);
  if (point && ((personId === 'lucia' && /\b190\b/.test(input)) || (personId === 'marco' && /\b170\b/.test(input)))) return result(`Ask ${personId === 'lucia' ? 'Marco' : 'Lucia'} for that observation. I can share my own price and bookings.`);
  if (/check|correct|verify|is .*right/.test(input) && /revenue|elasticity|\bmr\b|\btr\b/.test(input)) return { ...result('Please check that calculation in the student workspace.'), immediate: true };
  const concept = agent.concepts.find(item => relevant(item, input));
  if (concept) return result('I can share the case information I have. Please use the student workspace for mathematical help.');
  if (personId !== 'elena' && /operating costs?|cost function|room level costs?/.test(input)) return { answer: 'Elena, our operations manager, knows what cost information is available. Ask her about that.', factId: null };
  if (personId === 'paolo' && /^(and|what about|how about) (one|two|three|1|2|3)\b/.test(input)) {
    if (context.history?.some(turn => agent.facts.some(fact => relevant(fact, normalize(turn.question))))) input += ' bakers';
  }
  if (/^(and|what about|how about) (the )?(price|bookings|number|conditions)\b/.test(input) && !context.history?.length) return result(agent.scopePrompt);
  const matches = agent.facts.filter(item => followupFactId ? item.id === followupFactId : relevant(item, input));
  if (personId === 'marco') matches.sort((a, b) => Number(a.id === 'other') - Number(b.id === 'other'));
  if (personId === 'lucia' && /booking|request|occupan|how many/.test(input)) matches.sort((left, right) => Number(right.id === 'bookings') - Number(left.id === 'bookings'));
  const facts = matches.slice(0, /\band\b|\bboth\b/.test(input) ? 2 : 1);
  if (facts.length) {
    const credited = personId === 'lucia' && facts.some(fact => ['price', 'bookings'].includes(fact.id)) ? ['price', 'bookings', ...facts.filter(fact => !['price', 'bookings'].includes(fact.id)).map(fact => fact.id)] : facts.map(fact => fact.id);
    return result([...new Set(facts.map(fact => factReply(personId, fact, input, context)))].join(' '), credited);
  }
  const other = Object.values(FREE_AGENTS).find(candidate => candidate !== agent && candidate.facts.some(item => relevant(item, input)));
  if (other) return { answer: `${other.name}, the ${other.role}, knows about that. Ask them directly.`, factId: null };
  return { answer: `I’m not sure about that from the information I have. ${agent.scopePrompt}`, factId: null };
}
