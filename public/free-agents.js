import { SCENARIO } from './config.js';
import { HOTEL_CASE } from './case-hotel.js';

// Instructor-editable role cards. Keep facts factual: decisions and calculations belong to students.
// Each entry has an interview milestone id, matching phrases, and a short response.
// This is a local, rule-based agent runtime; it does not send student text to an AI provider.
export const FREE_AGENTS = {
  lucia: {
    name: 'Lucia', role: 'hotel manager',
    instruction: 'State the original hotel setting, capacity and seasonality. Do not derive TR, MR, elasticity, a room rate, or profit.',
    solutionBoundary: 'I can tell you about the hotel and its guests, but the calculations and advice are yours.',
    scopePrompt: 'I look after the hotel. Would you like to hear about our rooms, our guests through the year, or the changes we are facing?',
    concepts: [
      { match: [/what (is|does).*demand mean/, /define demand/], say: 'Demand here means the number of room nights guests request at a given price.' },
      { match: [/what (is|does).*elasticity mean/, /define elasticity/], say: 'Price elasticity describes how strongly room requests change when the room price changes.' }
    ],
    facts: [
      { id: 'events', match: [/climate/, /weather/, /protest/, /demonstration/, /airbnb/, /key box/, /keybox/, /regulat/, /challenges?/, /renovat/], say: () => 'We invested in a four-star standard, so both comfort and costs matter. The case also describes extreme weather, local concerns about tourism and restrictions on private rentals. We do not yet know how strongly those will affect our guests.' },
      { id: 'bookings', match: [/bookings?/, /occupan/, /season/, /how many.*(book|guest)/, /month/, /may/, /business/, /busy/], say: () => 'Our season makes a big difference. We close in January for maintenance; the May example uses 45% occupancy across 31 days.' },
      { id: 'price', match: [/current.*(price|rate)/, /(price|rate).*(now|currently|charge)/, /room price/, /(price|rate|charge|cost).*(room|night)/, /(room|night).*(price|rate|cost)/, /what.*charge/, /how many rooms/, /currency/, /unit/, /where.*(hotel|located)/, /tell me about.*(hotel|place)/], say: () => `We have ${HOTEL_CASE.rooms} rooms here in Sirmione, on Lake Garda. The exercise quotes prices in DKK and demand in room-nights. It does not specify one current room rate.` },
      { id: 'supply', match: [/breakfast/, /bakery/, /bread supply/], say: () => 'Breakfast needs a reliable bread order. Marta at the bakery knows its production plans.' }
    ]
  },
  marco: {
    name: 'Marco', role: 'reservations lead',
    instruction: 'Explain the case guest groups and quote their estimated inverse demand curves. Never derive TR, MR or elasticity.',
    solutionBoundary: 'I can show you a group demand estimate, but you need to work out TR, MR and sensitivity.',
    scopePrompt: 'Ask me about the guest groups or a particular demand curve.',
    concepts: [
      { match: [/what (is|does).*marginal revenue mean/, /define marginal revenue/], say: 'Marginal revenue is the change in total revenue from one more room sold. You need the observations to derive it for this case.' }
    ],
    facts: [
      { id: 'income', match: [/income/, /earnings/, /disposable/], say: () => 'Table 3 estimates income elasticities of 1.5 for group A, 2.8 for B and 2.4 for C. Those describe demand responses to income, rather than our room-price response.' },
      { id: 'cross', match: [/cross price/, /offer [ab]/, /offers?/, /related.*price/], say: () => 'For Offer A, Table 3 gives 1.2, 1.5 and 2.8 for groups A, B and C. For Offer B, it gives −1.2, −3.3 and −2.4. The table leaves you to interpret what those offers might be.' },
      { id: 'other', match: [/demand/, /curve/, /function/, /equation/, /group a/, /group b/, /group c/, /table 3/], say: () => 'The estimated inverse demand curves are A: P = 2400 − 0.05Q; B: P = 2100 − 0.07Q; C: P = 1800 − 0.06Q. P is in DKK and Q is room-nights.' },
      { id: 'comparable', match: [/guest groups?/, /segments?/, /individual/, /famil/, /tour/, /who (are|is)/, /who.*stay/, /types.*guest/, /share/], say: () => 'A is individual travelers without children (about 50% of high-season stays); B is group travelers (30%); C is families with children (10%). The remaining 10% is mixed.' },
      { id: 'changes', match: [/shift demand/, /affect demand/, /festival/, /competitor/, /season/], say: () => 'Other hotels, apartments, campsites and private rentals compete for our guests. Booking timing and the season matter too; Lucia can tell you about the wider challenges described in the case.' }
    ]
  },
  elena: {
    name: 'Elena', role: 'operations manager',
    instruction: 'State original hotel capacity and missing room cost information. Never claim a profit-maximizing price.',
    solutionBoundary: 'I can describe capacity and missing costs, but I cannot choose your room rate.',
    scopePrompt: 'Ask me about room capacity or available cost information.',
    concepts: [
      { match: [/difference.*(revenue|profit)/, /what (is|does).*profit mean/], say: 'Revenue is money received. Profit also subtracts costs, and we do not have room operating costs.' }
    ],
    facts: [
      { id: 'full', match: [/capacity/, /maximum.*rooms?/, /how many rooms/, /fully booked/, /more (guests|requests|rooms)/], say: () => `The original hotel has ${HOTEL_CASE.rooms} rooms. That is a nightly limit; Table 3 demand is in room-nights over a period.` },
      { id: 'costs', match: [/costs?/, /profit/, /expenses?/, /margin/], say: () => 'Renovation and a higher service standard bring costs with them. We do not have a room-level cost function in these materials, so room revenue alone cannot tell us our profit.' }
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

export const isSolutionRequest = text => /\b(solve|solutions?|calculate|compute|derive|optimal|optimum|maximi[sz]e|best (price|rate|plan|choice|number)|which (price|rate|plan|choice|number) should|do the math|tell me what to choose|give me (the |all )?(answers?|results?)|what is the answer)\b/i.test(text);
const normalize = text => String(text).toLowerCase().replace(/[^a-z0-9€]+/g, ' ').trim();
const relevant = (fact, text) => fact.match.some(pattern => pattern.test(text));
const requestedGroups = input => {
  const selected = [...input.matchAll(/\b(?:group|about|and) ([abc])\b/g)].map(match => match[1].toUpperCase());
  return /\bgroups\b|\ball\b|\bthree\b/.test(input) || !selected.length ? HOTEL_CASE.groups : HOTEL_CASE.groups.filter(group => selected.includes(group.id));
};

export function factReply(personId, fact, question, context = {}) {
  const input = normalize(question);
  if (personId === 'marco' && fact.id === 'other') {
    const groups = requestedGroups(input);
    return `Our estimate${groups.length > 1 ? 's are' : ' is'} ${groups.map(group => `${group.id}: P = ${group.intercept} − ${Math.abs(group.slope)}Q`).join('; ')}. P is in DKK and Q is room-nights over the case period, rather than rooms on one night.`;
  }
  if (personId === 'marco' && fact.id === 'income') return `The income-elasticity estimate${requestedGroups(input).length > 1 ? 's are' : ' is'} ${requestedGroups(input).map(group => `${group.id}: ${group.income}`).join('; ')}. That concerns changes in guests’ income rather than our room price.`;
  if (personId === 'marco' && fact.id === 'cross') {
    const offers = /offer a/.test(input) && !/offer b|and b/.test(input) ? ['A'] : /offer b/.test(input) && !/offer a/.test(input) ? ['B'] : ['A', 'B'];
    return offers.map(offer => `For Offer ${offer}, our cross-price estimates are ${requestedGroups(input).map(group => `${group.id}: ${group[`cross${offer}`]}`).join('; ')}.`).join(' ');
  }
  if (personId === 'lucia' && fact.id === 'events') {
    if (/climate|weather/.test(input)) return 'The director is concerned about extreme heat, heavy rain and hail. Guests may choose a different destination or time of year, but we cannot attach a precise demand effect to that from the information here.';
    if (/airbnb|key box|keybox|regulat/.test(input)) return 'The case describes restrictions on private-rental check-in arrangements. The director expects those to make competing rentals harder to operate; we do not have an estimate of the effect on our bookings.';
    if (/protest|demonstration/.test(input)) return 'The case describes local concerns about tourism and rising housing costs. The director worries that guests who feel unwelcome may go elsewhere, while employees also face higher living costs.';
    if (/renovat/.test(input)) return 'We moved from a three-star to a four-star standard after extensive renovation. Management expected higher room prices and spending on other services, alongside higher costs.';
  }
  if (personId === 'lucia' && fact.id === 'price') {
    if (/how many rooms|capacity/.test(input) && !/unit|currency/.test(input)) return `We have ${HOTEL_CASE.rooms} rooms, including two small singles and six family rooms. Elena looks after how that capacity is used.`;
    if (/where|located/.test(input)) return 'We are in Sirmione, on the southern part of Lake Garda in northern Italy.';
  }
  return fact.say({ nextPeriodGuests: SCENARIO.breakfast.guests, ...context });
}

export function answerFreeQuestion(personId, text, context = {}) {
  const agent = FREE_AGENTS[personId];
  if (!agent) return { answer: 'I cannot help with that topic.', factId: null };
  let input = normalize(text), followupFactId = null;
  if (/^(hi|hello|hey)( there)?$/.test(input)) return { answer: `Hello! I'm ${agent.name}, the ${agent.role}. ${agent.scopePrompt}`, factId: null };
  if (/^(thanks|thank you|thank you very much)$/.test(input)) return { answer: 'You’re welcome. Let me know what else you need.', factId: null };
  if (input.length < 5 || /^(help|what|why|how|tell me|i don t know)$/.test(input)) {
    return { answer: agent.scopePrompt, factId: null };
  }
  if (isSolutionRequest(input)) {
    return { answer: agent.solutionBoundary, factId: null };
  }
  const concept = agent.concepts.find(item => relevant(item, input));
  if (concept) return { answer: concept.say, factId: null };
  if (personId === 'paolo' && /^(and|what about|how about) (one|two|three|1|2|3)\b/.test(input)) {
    const previous = context.history?.at(-1)?.question || '';
    if (agent.facts.some(fact => relevant(fact, normalize(previous)))) input += ' bakers';
  }
  if (personId === 'marco' && /^(and )?(what |how )?about [abc]$|^and [abc]$/.test(input)) {
    const previous = normalize(context.history?.at(-1)?.question || '');
    followupFactId = /income/.test(previous) ? 'income' : /offer|cross price/.test(previous) ? 'cross' : /who|guest groups/.test(previous) ? 'comparable' : 'other';
    input += ` group ${input.at(-1)}`;
  }
  const matches = agent.facts.filter(item => followupFactId ? item.id === followupFactId : relevant(item, input));
  if (personId === 'marco' && /who|which people|what.*groups.*mean/.test(input)) matches.sort((left, right) => Number(right.id === 'comparable') - Number(left.id === 'comparable'));
  const facts = matches.slice(0, /\band\b|\bboth\b/.test(input) ? 2 : 1);
  if (facts.length) {
    const credited = facts.filter(fact => !(personId === 'lucia' && fact.id === 'price' && /where|located/.test(input)));
    return { answer: facts.map(fact => factReply(personId, fact, input, context)).join(' '), factId: credited[0]?.id || null, factIds: credited.map(fact => fact.id) };
  }
  const other = Object.values(FREE_AGENTS).find(candidate => candidate !== agent && candidate.facts.some(item => relevant(item, input)));
  if (other) return { answer: `${other.name}, the ${other.role}, knows about that. Ask them directly.`, factId: null };
  return { answer: `I’m not sure about that from the information I have. ${agent.scopePrompt}`, factId: null };
}
