import { SCENARIO, ACTORS } from './config.js';
import { hotelAtPrice, revenueBestHotel, bakeryOutcome, wineOutcome, eur, round } from './economics.js';
import { Town, STREET_PEOPLE, streetChoice, bestStreetChoice } from './town.js';
import { BusinessInterior, ROOM_STAFF } from './interior.js';

const KEY = 'sole-bay-simulation-v1';
const main = document.querySelector('#main');
const ROOM_IDS = ['hotel', 'bakery', 'winery'];
const emptyScratch = () => ({ left: '', operator: '+', right: '', notes: '' });
const blank = () => ({
  view: 'town', actor: null, overlay: null, mapVersion: 2, player: { x: 500, y: 250, color: '#477f9a' },
  hotelPlayer: { x: 450, y: 456, color: '#477f9a' }, bakeryPlayer: { x: 450, y: 480, color: '#477f9a' }, wineryPlayer: { x: 450, y: 480, color: '#477f9a' },
  roomPeople: { hotel: 'lucia', bakery: 'marta', winery: 'sofia' }, notebookReturn: 'town', streetId: null, street: {},
  interviews: { hotel: [], bakery: [], winery: [] }, replies: {}, visits: [],
  hotel: { proposals: [], model: null, mr: null, tests: [], revision: null, decision: null, elasticity: null, feedback: '' },
  breakfast: { runs: [], decision: null, feedback: '' }, scratchpads: { hotel: emptyScratch(), bakery: emptyScratch(), winery: emptyScratch() },
  winery: { choice: null, reason: '' }, hints: {}, log: []
});
let state, stored = null;
try { stored = JSON.parse(localStorage.getItem(KEY) || 'null'); state = { ...blank(), ...stored }; } catch { state = blank(); }
state.interviews ||= { hotel: [], bakery: [], winery: [] };
state.hotel ||= blank().hotel; state.breakfast ||= blank().breakfast; state.winery ||= blank().winery;
state.hints ||= {}; state.log ||= []; state.player ||= blank().player;
state.hotelPlayer ||= blank().hotelPlayer;
state.bakeryPlayer ||= blank().bakeryPlayer; state.wineryPlayer ||= blank().wineryPlayer;
state.roomPeople = { ...blank().roomPeople, ...state.roomPeople };
if (stored?.hotelPerson) state.roomPeople.hotel = stored.hotelPerson;
state.street ||= {};
if (stored && stored.mapVersion !== 2) {
  state.player = { ...state.player, x: 500, y: 250 };
  state.mapVersion = 2;
}
state.scratchpads ||= {};
for (const actor of ['hotel', 'bakery', 'winery']) state.scratchpads[actor] = { ...emptyScratch(), ...state.scratchpads[actor] };
let town = null, interior = null, toastTimer = null, lastMoveSave = 0;
const roomPerson = (actor = state.actor) => ROOM_STAFF[actor]?.[state.roomPeople[actor]];
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const fmt = n => Number.isFinite(n) ? round(n, 2).toString() : '—';
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* Storage can be unavailable in private mode. */ } }
function record(kind, actor, detail, data = null) {
  state.log.unshift({ kind, actor, detail, data, at: new Date().toISOString() });
  state.log = state.log.slice(0, 250);
  save();
}
function toast(message) {
  const el = document.querySelector('#toast'); el.textContent = message; el.classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 2600);
}
const asked = (actor, id) => state.interviews[actor]?.includes(id);
const has = (actor, ids) => ids.every(id => asked(actor, id));
const Q = {
  hotel: [
    ['price', 'What price do you currently charge per room?', () => `Our reference room price is ${eur(SCENARIO.hotel.referencePrice)} per night.`],
    ['bookings', 'How many rooms do you sell at that price?', () => { const s = hotelAtPrice(SCENARIO.hotel.referencePrice); return `At ${eur(s.price)}, guests request ${fmt(s.requested)} rooms. We sell ${fmt(s.sold)} because demand is below our ${SCENARIO.hotel.rooms}-room capacity.`; }],
    ['other', 'What happened when you charged a different price?', () => { const s = hotelAtPrice(SCENARIO.hotel.comparisonPrice); return `At ${eur(s.price)}, the model predicts ${fmt(s.requested)} requested rooms, and all ${fmt(s.sold)} could be sold.`; }],
    ['comparable', 'Were the two dates comparable?', () => `For this demonstration, yes. ${SCENARIO.hotel.conditions} These are model-generated teaching observations, not measured business records.`],
    ['full', 'What happens if requests exceed the rooms available?', () => `We can sell at most ${SCENARIO.hotel.rooms} rooms. Requested rooms and rooms actually sold are different when capacity binds.`],
    ['costs', 'Can we calculate the hotel’s profit from this?', () => `${SCENARIO.hotel.costStatus} Room revenue alone cannot identify the profit-maximizing price.`],
    ['changes', 'What else might change demand?', () => 'A festival, competitor pricing, the season, or booking timing could shift demand. We keep those conditions fixed for this classroom investigation.'],
    ['supply', 'Does breakfast supply affect the hotel?', () => 'Yes. If the bakery cannot serve every breakfast guest, service quality suffers. The hotel’s breakfast revenue and bread order cost are separate from room revenue.']
  ],
  bakery: [
    ['order', 'What does the hotel need from your bakery?', () => `${SCENARIO.breakfast.guests} guests need one roll each. The hotel earns ${eur(SCENARIO.breakfast.revenuePerBreakfast)} per breakfast served in this simplified breakfast contract.`],
    ['one', 'What can one baker produce?', () => 'One baker makes 40 rolls in a shift with our single oven.'],
    ['two', 'What changes with a second baker?', () => 'Two bakers make 60 rolls with the same oven. Compare that with one baker’s output before deciding whether the extra labour helps.'],
    ['three', 'Would a third baker help?', () => 'Three bakers make 65 rolls. The oven is still the same size, and leftover rolls cannot be sold in this case.'],
    ['cost', 'How are production costs calculated?', () => 'Labour costs €20 per baker. Ingredients cost €0.60 per roll produced. Work out each plan’s total cost before placing the order.'],
    ['oven', 'Does the oven change when you hire more bakers?', () => 'No. We still have just one oven, and I sometimes see bakers waiting for it. Compare the extra rolls from each added baker.']
  ],
  winery: [
    ['options', 'Which wines could the hotel buy?', () => `The hotel forecasts ${dinnerBottles()} dinners. House wine costs €8 per bottle. Estate reserve costs €12 per bottle; house wine can cover any remaining dinners.`],
    ['stock', 'Can the estate supply every dinner?', () => 'No. Our estate reserve is limited to 60 bottles this period. The house wine can cover the rest.'],
    ['forecast', 'How many bottles should the hotel plan for?', () => `Plan for ${nextPeriodGuests()} sold rooms plus ${SCENARIO.wine.outsideDiners} outside diners: ${dinnerBottles()} bottles if each dinner needs one bottle. This changes if the room-rate decision changes.`],
    ['taste', 'What did the tasting tell you?', () => 'In a small tasting panel, the house wine scored 7/10 and the estate reserve 9/10. That is a preference signal, not a measured increase in hotel profit or satisfaction.'],
    ['investment', 'Should the hotel build its own winery?', () => 'That is a later investment question. We would need an initial cost, expected future cash flows, a discount rate, and risk before calculating NPV. Buying wine now does not answer it.']
  ]
};
function recommended(actor) {
  const order = actor === 'hotel' ? ['price', 'bookings', 'other', 'comparable', 'full', 'costs', 'changes', 'supply']
    : actor === 'bakery' ? ['order', 'one', 'two', 'three', 'cost', 'oven']
    : ['options', 'stock', 'forecast', 'taste', 'investment'];
  return order.find(id => !asked(actor, id)) || order[0];
}
function question(actor, id) {
  const item = Q[actor].find(row => row[0] === id); if (!item) return;
  const answer = item[2]();
  if (!asked(actor, id)) state.interviews[actor].push(id);
  state.replies[actor] = { id, answer };
  record('question', actor, item[1], { answer, speaker: ROOM_IDS.includes(state.view) ? roomPerson()?.name : ACTORS[actor].name }); render();
}
function visit(actor) {
  if (!ACTORS[actor]) return;
  if (town) { town.destroy(); town = null; }
  if (interior) { interior.destroy(); interior = null; }
  state.actor = actor;
  state.view = actor; state.overlay = null; state[`${actor}Player`].color = state.player.color;
  if (!state.visits.includes(actor)) { state.visits.push(actor); record('visit', actor, `Entered ${actor === 'hotel' ? 'Hotel Sole Nascente' : actor === 'bakery' ? 'Marta’s Bakery' : 'Sole Vineyard'}`); }
  save(); render(); window.scrollTo(0, 0);
}
function go(view) {
  if (town) { town.destroy(); town = null; }
  if (interior) { interior.destroy(); interior = null; }
  if (view === 'notebook') state.notebookReturn = ROOM_IDS.includes(state.view) ? state.view : 'town';
  if (ROOM_IDS.includes(view)) state.actor = view;
  state.view = view; state.overlay = null; save(); render(); window.scrollTo(0, 0);
}
function closeOverlay() {
  state.overlay = null;
  save(); render();
  document.querySelector('#town-canvas, #room-canvas')?.focus();
}
function openWorkspace() { state.overlay = 'workspace'; save(); render(); }
function openDialogue() { state.overlay = 'dialogue'; save(); render(); }
function talkRoomPerson(id) {
  const actor = state.view;
  if (!ROOM_STAFF[actor]?.[id]) return;
  state.actor = actor; state.roomPeople[actor] = id; state.overlay = 'dialogue';
  state.replies[actor] = null;
  save(); render();
}
function roomGuide(actor) {
  if (actor === 'bakery') {
    if (!has('bakery', ['order', 'cost'])) return 'marta';
    if (!has('bakery', ['one', 'two', 'three'])) return 'paolo';
    return null;
  }
  if (actor === 'winery') {
    if (!has('winery', ['options', 'taste'])) return 'sofia';
    if (!has('winery', ['stock', 'forecast'])) return 'giulia';
    return null;
  }
  if (!has('hotel', ['price', 'bookings'])) return 'lucia';
  if (nextTask().actor !== 'hotel') return null;
  if (!has('hotel', ['other', 'comparable'])) return 'marco';
  if (!has('hotel', ['full', 'costs'])) return 'elena';
  return null;
}
function nextTask() {
  if (!state.visits.includes('hotel')) return { actor: 'hotel', label: 'Meet Lucia at the hotel', action: 'Ask about the current room price. Then follow the breakfast supply chain.' };
  if (!has('hotel', ['price', 'bookings'])) return { actor: 'hotel', label: 'Ask Lucia about bookings', action: 'Find the current room price and the number of rooms guests request.' };
  if (!state.breakfast.decision) return { actor: 'bakery', label: 'Arrange breakfast supply', action: 'Ask Marta about the order and costs, then Paolo about output with one, two, and three bakers.' };
  if (!state.breakfast.decision.reflection) return { actor: 'bakery', label: 'Reflect on breakfast', action: 'Compare your plan with the result and decide whether to revise it.' };
  if (!state.hotel.decision) return { actor: 'hotel', label: 'Find demand and MR', action: 'Combine Lucia’s current figures with Marco’s comparison to find demand and marginal revenue.' };
  if (!state.hotel.decision.reflection) return { actor: 'hotel', label: 'Reflect on room pricing', action: 'Explain what the tested rate did and whether you would revise it.' };
  if (!state.hotel.elasticity?.reflection) return { actor: 'hotel', label: 'Explore hotel elasticity', action: 'Calculate elasticity at Lucia’s €170 rate and explain what it means for room revenue.' };
  if (!state.winery.choice || state.winery.needsReview) return { actor: 'winery', label: state.winery.needsReview ? 'Review the wine order' : 'Compare wine supply', action: 'Ask Sofia about wines and tasting, then Giulia about stock and the dinner forecast.' };
  if (!state.winery.reflection) return { actor: 'winery', label: 'Reflect on wine purchasing', action: 'Compare the order with your prediction and decide whether to revise it.' };
  return { actor: 'hotel', label: 'Review and refine', action: 'Revisit a decision or review the notebook before discussion.' };
}
function nextPeriodGuests() {
  return Math.ceil(state.hotel.decision?.sold ?? hotelAtPrice(SCENARIO.hotel.referencePrice).sold);
}
function dinnerBottles() { return nextPeriodGuests() + SCENARIO.wine.outsideDiners; }
function townView() {
  const task = nextTask();
  const breakfast = state.breakfast.decision;
  const hotel = state.hotel.decision;
  const nextBreakfastGap = hotel && breakfast ? Math.max(0, nextPeriodGuests() - breakfast.rolls) : null;
  const milestones = [has('hotel', ['price', 'bookings']), !!breakfast?.reflection, !!hotel?.reflection, !!state.hotel.elasticity?.reflection, !!state.winery.choice && !state.winery.needsReview && !!state.winery.reflection];
  const finished = milestones.filter(Boolean).length;
  return `<div class="game-heading"><div><p class="eyebrow">Day 01 · Riviera del Sole</p><h1>Hotel Sole Nascente</h1></div><span class="game-day">${finished} / ${milestones.length} steps</span></div>
    <section class="game-shell" aria-label="Riviera district">
      <div class="town-stage"><canvas id="town-canvas" width="1800" height="1080" tabindex="0" aria-label="Walkable Italian coastal district. Enter the hotel, bakery, or vineyard; Ana and Enzo walk the streets with optional utility questions. Arrow keys or WASD move; E interacts. People and buildings can also be clicked."></canvas><div class="mobile-map-label hotel"><b>HOTEL SOLE NASCENTE</b><span>Pricing · demand · elasticity</span></div><div class="mobile-map-label bakery"><b>MARTA’S BAKERY</b><span>Production theory</span></div><div class="mobile-map-label winery"><b>SOLE VINEYARD</b><span>Wine purchasing</span></div>${state.overlay === 'street' ? streetOverlay() : state.overlay === 'dialogue' ? dialogueOverlay() : state.overlay === 'workspace' ? workspaceOverlay() : ''}</div>
      <div class="game-status"><div class="game-objective"><span>Current objective</span><strong>${esc(task.label)}</strong></div><button class="game-go" data-visit="${task.actor}">Enter ${task.actor === 'hotel' ? 'hotel' : task.actor === 'bakery' ? 'bakery' : 'vineyard'} <span aria-hidden="true">→</span></button><div class="game-steps" role="img" aria-label="${finished} of ${milestones.length} milestones complete">${milestones.map(done => `<i class="${done ? 'done' : ''}"></i>`).join('')}</div></div>
      <div class="town-controls"><div class="touch-controls" aria-label="Movement controls"><button data-move="arrowleft" aria-label="Move left" title="Move left">◀</button><button data-move="arrowup" aria-label="Move up" title="Move up">▲</button><button data-move="arrowdown" aria-label="Move down" title="Move down">▼</button><button data-move="arrowright" aria-label="Move right" title="Move right">▶</button><button data-action="talk" aria-label="Talk nearby" title="Talk nearby">✦</button></div></div>
    </section>
    <nav class="district-links" aria-label="Places to visit">${[['hotel', 'Hotel Sole Nascente', 'Lucia, Marco, Elena · Demand, MR, elasticity'], ['bakery', 'Marta’s Bakery', 'Marta, Paolo · Production and marginal product'], ['winery', 'Sole Vineyard', 'Sofia, Giulia · Wine supply and purchasing']].map(([id, name, topic]) => `<button class="district-link" data-visit="${id}"><span class="district-symbol ${id}" aria-hidden="true"></span><span><strong>${name}</strong><small>${topic}</small></span><span aria-hidden="true">→</span></button>`).join('')}</nav>
    <nav class="street-links" aria-label="Optional street exercises"><span>Street practice · Utility maximization</span>${STREET_PEOPLE.map(person => `<button data-street="${person.id}"><b>${esc(person.name)}</b><small>${esc(person.role)} · ${state.street[person.id]?.solved ? 'Solved' : 'Quick choice'}</small><span aria-hidden="true">→</span></button>`).join('')}</nav>
    <details class="hotel-ledger"><summary>Hotel figures <span>${state.log.length} notes saved</span></summary><div class="ledger-content"><div><div class="metric-row"><span>Rooms sold</span><strong>${hotel ? fmt(hotel.sold) + ' / 80' : 'To decide'}</strong></div><div class="metric-row"><span>Room revenue</span><strong>${hotel ? eur(hotel.revenue) : '—'}</strong></div><div class="metric-row"><span>Breakfasts served</span><strong>${breakfast ? `${breakfast.served} / 60` : 'To arrange'}</strong></div><div class="metric-row"><span>Guest service</span><strong>${breakfast ? `${Math.round(breakfast.serviceRate * 100)}% served` : '—'}</strong></div>${nextBreakfastGap !== null ? `<div class="metric-row"><span>Next-period bread gap</span><strong>${nextBreakfastGap} rolls</strong></div>` : ''}</div><div><p>Hotel profit is not shown because room operating costs are unknown. Next-period breakfast assumes one guest per sold room; 20 additional diners are assumed for wine planning.</p><div class="swatches">${[['#477f9a','Blue'],['#bc6554','Coral'],['#75945c','Green'],['#9b779a','Violet']].map(([color,name]) => `<button class="swatch ${state.player.color === color ? 'selected' : ''}" style="--swatch:${color}" data-color="${color}" aria-label="${name} outfit" title="${name} outfit"></button>`).join('')}</div></div></div></details>`;
}
function roomView(actor) {
  const staff = ROOM_STAFF[actor], guide = roomGuide(actor);
  const task = nextTask();
  const townNext = task.actor !== actor;
  const steps = actor === 'hotel'
    ? [has('hotel', ['price', 'bookings']), has('hotel', ['other', 'comparable']), has('hotel', ['full', 'costs']), !!state.hotel.decision?.reflection, !!state.hotel.elasticity?.reflection]
    : actor === 'bakery'
      ? [has('bakery', ['order', 'cost']), has('bakery', ['one', 'two', 'three']), state.breakfast.runs.some(run => run.verified), !!state.breakfast.decision, !!state.breakfast.decision?.reflection]
      : [has('winery', ['options', 'taste']), has('winery', ['stock', 'forecast']), !!state.winery.choice && !state.winery.needsReview, !!state.winery.reflection];
  const finished = steps.filter(Boolean).length;
  const objective = guide ? `Talk to ${staff[guide].name}` : townNext ? task.label : actor === 'hotel' ? state.hotel.decision?.reflection ? 'Explore elasticity' : 'Work out demand and MR' : 'Open the calculation workspace';
  const place = actor === 'hotel' ? 'Hotel Sole Nascente · Ground floor' : actor === 'bakery' ? 'Marta’s Bakery · Kitchen' : 'Sole Vineyard · Tasting room';
  const title = actor === 'hotel' ? 'Inside the hotel' : actor === 'bakery' ? 'Inside the bakery' : 'Inside the vineyard';
  return `<div class="game-heading"><div><p class="eyebrow">${place}</p><h1>${title}</h1></div><span class="game-day">${finished} / ${steps.length} room steps</span></div>
    <section class="game-shell business-shell" aria-label="${esc(title)}">
      <div class="town-stage room-stage ${actor}-room"><canvas id="room-canvas" width="1800" height="1080" tabindex="0" aria-label="Walkable ${actor} interior with ${Object.values(staff).map(p => p.name).join(' and ')}, a calculation workspace, and a town exit. Move with arrow keys or WASD; E interacts. People and places can be clicked."></canvas>${state.overlay === 'dialogue' ? dialogueOverlay() : state.overlay === 'workspace' ? workspaceOverlay() : ''}</div>
      <div class="game-status"><div class="game-objective"><span>Current objective</span><strong>${esc(objective)}</strong></div>${guide ? `<button class="game-go" data-person="${guide}">Talk to ${esc(staff[guide].name)} <span aria-hidden="true">→</span></button>` : townNext ? `<button class="game-go" data-view="town">Return to town <span aria-hidden="true">→</span></button>` : `<button class="game-go" data-action="workspace">Open workspace <span aria-hidden="true">→</span></button>`}<div class="game-steps" role="img" aria-label="${finished} of ${steps.length} room steps complete">${steps.map(done => `<i class="${done ? 'done' : ''}"></i>`).join('')}</div></div>
      <div class="town-controls"><span>Walk to a person or click them to talk. The desk opens your calculations.</span><div class="touch-controls" aria-label="Movement controls"><button data-move="arrowleft" aria-label="Move left" title="Move left">◀</button><button data-move="arrowup" aria-label="Move up" title="Move up">▲</button><button data-move="arrowdown" aria-label="Move down" title="Move down">▼</button><button data-move="arrowright" aria-label="Move right" title="Move right">▶</button><button data-action="talk" aria-label="Interact nearby" title="Interact nearby">✦</button></div></div>
    </section>
    <nav class="interior-actions" aria-label="${esc(title)} locations">${Object.entries(staff).map(([id, person]) => `<button data-person="${id}"><strong>${esc(person.name)}</strong><small>${esc(person.role)}</small></button>`).join('')}<button data-action="workspace"><strong>Workspace</strong><small>${actor === 'hotel' ? 'Demand, MR and elasticity' : actor === 'bakery' ? 'Output and marginal product' : 'Quantities and purchasing'}</small></button><button data-view="town"><strong>Town</strong><small>Leave this room</small></button></nav>`;
}
function suggestedQuestions(actor) {
  const options = ROOM_IDS.includes(state.view) ? roomPerson(actor).questions : Q[actor].map(row => row[0]);
  const next = options.find(key => !asked(actor, key)) || options[0];
  return [next, ...options.filter(key => key !== next && !asked(actor, key)).slice(0, 2)];
}
function dialogueOverlay() {
  const id = state.actor, actor = ACTORS[id], current = state.replies[id];
  const speaker = ROOM_IDS.includes(state.view) ? roomPerson(id) : actor;
  const questions = ROOM_IDS.includes(state.view) ? Q[id].filter(row => speaker.questions.includes(row[0])) : Q[id];
  const suggestions = suggestedQuestions(id);
  return `<div class="scene-shade"></div><section class="scene-dialogue business-${id}" role="dialog" aria-modal="true" aria-label="Conversation with ${esc(speaker.name)}">
    <div class="scene-dialogue-head"><span>${esc(speaker.name)} · ${esc(speaker.role)}</span><button type="button" data-action="close-overlay" aria-label="Close conversation" title="Close conversation">×</button></div>
    <div class="scene-interior ${id}" aria-hidden="true"><i></i><b></b><em></em></div>
    <div class="scene-speech"><div class="scene-avatar ${id}" aria-hidden="true"><span></span><i></i></div><p>${esc(current?.answer || speaker.introduction)}</p></div>
    <div class="scene-questions"><span class="scene-caption">Ask ${esc(speaker.name)}</span>${suggestions.map((key, i) => { const item = questions.find(row => row[0] === key); return `<button type="button" data-question="${key}" class="scene-question"><b>${i + 1}</b><span>${esc(item[1])}</span></button>`; }).join('')}
    ${questions.length > suggestions.length ? `<details><summary>More questions</summary><div class="scene-more">${questions.filter(row => !suggestions.includes(row[0])).map(row => `<button type="button" data-question="${row[0]}">${asked(id, row[0]) ? '✓ ' : ''}${esc(row[1])}</button>`).join('')}</div></details>` : ''}</div>
    <div class="scene-dialogue-foot"><button type="button" class="scene-primary" data-action="workspace">Open ${id === 'hotel' ? state.hotel.decision?.reflection ? 'elasticity' : 'pricing' : id === 'bakery' ? 'production' : 'purchasing'} workspace →</button><button type="button" data-view="notebook" class="scene-secondary">Notebook</button></div>
  </section>`;
}
function openStreet(id) {
  if (!STREET_PEOPLE.some(person => person.id === id)) return;
  state.streetId = id; state.overlay = 'street'; save(); render();
}
function chooseStreet(id) {
  const person = STREET_PEOPLE.find(item => item.id === state.streetId);
  const option = person?.options.find(item => item.id === id);
  if (!option) return;
  const previous = state.street[person.id] || { attempts: 0, solved: false };
  const result = streetChoice(person, option.amounts);
  const best = bestStreetChoice(person);
  const correct = result.affordable && result.utility === best.utility;
  state.street[person.id] = { choice: id, attempts: previous.attempts + 1, solved: previous.solved || correct };
  record('utility_choice', 'street', `${person.name}: chose ${option.amounts.join(' and ')} items; €${result.cost} spent; ${result.utility} utility points${correct ? ' (highest affordable total)' : ''}.`, { person: person.name, choice: option.amounts, result, correct });
  render();
}
function streetOverlay() {
  const person = STREET_PEOPLE.find(item => item.id === state.streetId);
  if (!person) return '';
  const answer = state.street[person.id];
  const chosen = person.options.find(option => option.id === answer?.choice);
  const outcome = chosen ? streetChoice(person, chosen.amounts) : null;
  const best = bestStreetChoice(person);
  const correct = outcome?.affordable && outcome.utility === best.utility;
  return `<div class="scene-shade"></div><section class="street-dialogue" role="dialog" aria-modal="true" aria-label="Utility choice with ${esc(person.name)}">
    <header><div><small>${esc(person.role)} · Street encounter</small><strong>${esc(person.name)} needs your advice</strong></div><button type="button" data-action="close-overlay" aria-label="Close street exercise" title="Close">×</button></header>
    <div class="street-body"><p>${esc(person.question)}</p><div class="street-goods">${person.goods.map(good => `<div><b>${esc(good.name)}</b><span>€${good.price} each</span><small>Extra utility from each: ${good.marginalUtility.join(', ')}</small></div>`).join('')}</div><small class="street-context">Illustrative utility points for this classroom exercise.</small>
    <span class="scene-caption">Choose a bundle</span><div class="street-options">${person.options.map(option => { const result = streetChoice(person, option.amounts); return `<button type="button" data-street-choice="${option.id}" ${answer?.choice === option.id ? 'aria-current="true"' : ''}><strong>${option.amounts.map((amount, i) => `${amount} ${person.goods[i].name}`).join(' + ')}</strong><small>Cost €${result.cost} · ${result.affordable ? 'within budget' : 'over budget'}</small></button>`; }).join('')}</div>
    ${outcome ? `<div class="street-result ${correct ? 'correct' : ''}" role="status"><b>${correct ? 'Best affordable choice' : 'Look again'}</b><p>Your bundle costs €${outcome.cost} and gives ${outcome.utility} utility points. ${correct ? `No affordable combination gives more than ${best.utility} points. Add the marginal utility of each item to see why.` : 'Add the extra utility from each item, then compare the affordable bundles.'}</p></div>` : ''}</div>
  </section>`;
}
function scratchResult(actor) {
  const { left, operator, right } = state.scratchpads[actor];
  if (left === '' || right === '') return { valid: false, text: 'Enter two numbers to calculate.' };
  const a = Number(left), b = Number(right);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return { valid: false, text: 'Use valid numbers.' };
  if (operator === '/' && b === 0) return { valid: false, text: 'Cannot divide by zero.' };
  const value = { '+': a + b, '-': a - b, '×': a * b, '/': a / b }[operator];
  return Number.isFinite(value) ? { valid: true, value, text: `${fmt(a)} ${operator} ${fmt(b)} = ${fmt(value)}` } : { valid: false, text: 'Check the numbers.' };
}
function formulaHelp(actor) {
  if (actor === 'hotel') {
    const accepted = state.hotel.model;
    return `<p><code>P(Q) = a + bQ</code><br><b>P</b> is room price, <b>Q</b> is rooms requested, <b>a</b> is the intercept, and <b>b</b> is the slope.</p>
      <p><code>b = (P₂ − P₁) / (Q₂ − Q₁)</code><br>Then use either observation to find <code>a = P − bQ</code>.</p>
      <p><code>TR(Q) = aQ + bQ²</code>, so for uncapped demand <code>MR(Q) = a + 2bQ</code>. MR is not hotel profit; costs are unknown.</p>
      ${accepted ? `<p><b>Your accepted demand model:</b> <code>P(Q) = ${fmt(accepted.intercept)} ${accepted.slope < 0 ? '−' : '+'} ${fmt(Math.abs(accepted.slope))}Q</code>.</p>
      <p><code>Qd(P) = (P − a) / b</code><br><code>Rooms sold = min(Qd, 80)</code><br><code>Room revenue = P × rooms sold</code>.</p>` : '<p>Use Lucia’s current figures and Marco’s comparable observation to propose the case coefficients. This help gives the method, not the solved answer.</p>'}
      ${state.hotel.decision?.reflection ? '<p><b>Part 2:</b> <code>Elasticity = (1 / b) × P / Qd</code>. Use requested rooms. A negative result means requests fall when price rises; the absolute value tells you the approximate percent change in requests for a 1% price change.</p>' : ''}`;
  }
  if (actor === 'bakery') return `<p><code>Extra output = new rolls − previous rolls</code><br>Compare the extra rolls from each additional baker.</p><p><code>Order cost = (€20 × bakers) + (€0.60 × rolls produced)</code>.</p><p><code>Guests served = min(rolls, 60)</code><br><code>Contract contribution = (€3 × guests served) − order cost</code>.</p><p>Contribution from this contract is not total hotel profit.</p>`;
  return `<p><code>Purchase cost = (estate bottles × €12) + (house bottles × €8)</code>.</p><p>Cover the forecast dinners, but remember that estate supply is limited to 60 bottles. A tasting score does not measure willingness to pay or profit.</p>`;
}
function scratchpad(actor) {
  const s = state.scratchpads[actor];
  return `<details class="scratchpad"><summary>Scratchpad <small>optional</small></summary><div class="scratch-body"><div class="scratch-calc"><input type="number" step="any" inputmode="decimal" data-scratch-field="left" aria-label="First number" placeholder="Number" value="${esc(s.left)}"><select data-scratch-field="operator" aria-label="Operation">${['+', '-', '×', '/'].map(op => `<option value="${op}" ${s.operator === op ? 'selected' : ''}>${op}</option>`).join('')}</select><input type="number" step="any" inputmode="decimal" data-scratch-field="right" aria-label="Second number" placeholder="Number" value="${esc(s.right)}"></div><output class="scratch-result" aria-live="polite">${esc(scratchResult(actor).text)}</output><button type="button" class="scratch-add" data-action="scratch-add">Add result to notes</button><label for="scratch-notes-${actor}">Working notes</label><textarea id="scratch-notes-${actor}" data-scratch-field="notes" rows="4" maxlength="2000" placeholder="Keep your calculations here...">${esc(s.notes)}</textarea><small>Saved on this device, separate from your answer.</small></div></details>`;
}
function workspaceOverlay() {
  const id = state.actor, actor = ACTORS[id];
  const contact = ROOM_IDS.includes(state.view) ? roomPerson(id) : actor;
  const task = id === 'hotel' ? hotelTask() : id === 'bakery' ? bakeryTask() : wineryTask();
  const latest = state.log.filter(entry => entry.actor === id && entry.kind === 'question').slice(0, 3);
  return `<div class="scene-shade"></div><section class="mini-workspace business-${id}" role="dialog" aria-modal="true" aria-label="${id === 'hotel' ? 'Hotel' : esc(actor.name)} calculation workspace">
    <div class="mini-head"><div><small>${esc(contact.role)} · ${SCENARIO.label}</small><strong>${id === 'hotel' ? 'Hotel exercises' : id === 'bakery' ? 'Breakfast production' : 'Wine purchasing'}</strong></div><button type="button" data-action="close-overlay" aria-label="Close workspace" title="Close workspace">×</button></div>
    <div class="mini-columns"><aside class="mini-tools"><div class="mini-tool-links"><button type="button" class="scene-secondary" data-action="dialogue">← Talk to ${esc(contact.name)}</button><button type="button" class="scene-secondary" data-view="notebook">Notebook</button></div><details class="mini-evidence"><summary>Field notes <small>${latest.length} recent</small></summary><div>${latest.length ? latest.map(entry => `<div class="mini-note"><b>${esc(entry.detail)}</b><p>${esc(entry.data?.answer || '')}</p></div>`).join('') : '<p>No evidence yet. Talk to the owner to begin.</p>'}</div></details><div class="formula-tool"><button type="button" data-action="formula-help" aria-expanded="false" aria-controls="formula-help-${id}">Formula help <span aria-hidden="true">?</span></button><div id="formula-help-${id}" class="formula-content" hidden>${formulaHelp(id)}</div></div>${scratchpad(id)}</aside><div class="mini-task">${task}</div></div>
  </section>`;
}
function actorView() {
  const id = state.actor, actor = ACTORS[id];
  const current = state.replies[id];
  const suggestions = suggestedQuestions(id);
  const shirt = { hotel: '#b85e56', bakery: '#ce854c', winery: '#805d84' }[id];
  return `<div class="actor-header"><div><button class="breadcrumb" data-view="town">← Back to town</button><p class="eyebrow" style="margin-top:12px">${esc(actor.role)} · ${SCENARIO.label}</p><h1>${esc(actor.name)} at ${id === 'hotel' ? 'Hotel Sole Nascente' : id === 'bakery' ? 'Marta’s Bakery' : 'Sole Vineyard'}</h1><p>${esc(actor.objective)}</p></div><button class="button secondary" data-view="notebook">Open notebook</button></div>
    <div class="actor-columns"><section class="panel actor-left"><div class="portrait-band ${id}"><div class="portrait" style="--shirt:${shirt}"><span class="eyes"></span></div><div><div class="portrait-name">${esc(actor.name)}</div><div class="portrait-role">${esc(actor.role)}</div></div></div><div class="interview-body"><div class="speech"><span class="speaker">${esc(actor.name)} says</span>${esc(current?.answer || actor.introduction)}</div>
    <h3>${current ? 'A useful next question' : 'Start here'}</h3><div class="question-list">${suggestions.map((key, i) => { const item = Q[id].find(row => row[0] === key); return `<button class="question ${i === 0 ? 'primary' : ''}" data-question="${key}"><span class="qicon">?</span><span>${esc(item[1])}</span></button>`; }).join('')}</div>
    <details><summary>Other questions I can ask</summary><div class="question-list">${Q[id].filter(row => !suggestions.includes(row[0])).map(row => `<button class="question ${asked(id, row[0]) ? 'asked' : ''}" data-question="${row[0]}"><span class="qicon">${asked(id, row[0]) ? '✓' : '?'}</span><span>${esc(row[1])}</span></button>`).join('')}</div></details>
    <hr class="section-rule"><p class="muted" style="font-size:12px">${esc(actor.personality)}. Answers are based on instructor-authored facts and a deterministic model. Questions and answers are saved in your notebook.</p></div></section>
    <section class="panel actor-right"><div class="panel-heading"><strong>Your current task</strong><small>${id === 'hotel' ? 'Room demand' : id === 'bakery' ? 'Breakfast supply' : 'Wine supply'}</small></div><div class="task-body">${id === 'hotel' ? hotelTask() : id === 'bakery' ? bakeryTask() : wineryTask()}</div></section></div>`;
}
function hotelChart() {
  const points = [120, 140, 160, 180, 200, 220].map(p => {
    const s = hotelAtPrice(p); return `${32 + s.requested * 3.4},${164 - (p - 120) * 1.25}`;
  }).join(' ');
  return `<svg class="chart" viewBox="0 0 460 190" role="img" aria-label="Inverse hotel demand line. Capacity is 80 rooms; the two known observations are 69 rooms at 170 euro and 54 rooms at 190 euro."><line x1="32" y1="164" x2="432" y2="164" stroke="#879f99"/><line x1="32" y1="14" x2="32" y2="164" stroke="#879f99"/><line x1="304" y1="14" x2="304" y2="164" stroke="#d88c4c" stroke-dasharray="4 4"/><polyline points="${points}" fill="none" stroke="#307d72" stroke-width="3"/><circle cx="267" cy="102" r="5" fill="#af5d49"/><circle cx="216" cy="77" r="5" fill="#af5d49"/><text x="267" y="94" font-size="10" text-anchor="middle">A</text><text x="216" y="68" font-size="10" text-anchor="middle">B</text><text x="7" y="22" font-size="10">€ P</text><text x="374" y="180" font-size="10">rooms Q</text><text x="288" y="25" font-size="10" fill="#a65e31">capacity 80</text></svg>`;
}
function hotelPricePreview(value) {
  if (String(value).trim() === '' || !Number.isFinite(Number(value))) return 'Choose a room price, then predict the result.';
  const price = Number(value);
  if (price < 110 || price > 220) return 'Use a price between €110 and €220.';
  return `${eur(price)} selected. Predict room requests and room revenue before checking.`;
}
function reflectionForm(actor, value = '') {
  const prompt = actor === 'hotel' ? 'After seeing demand, MR, room revenue, and the capacity limit, would you keep or revise your rate? Why?'
    : actor === 'bakery' ? 'After comparing the three plans, would you keep or revise your breakfast order? Why?'
    : 'After seeing the quantities and purchase cost, would you keep or revise your wine order? Why?';
  return `<form class="post-result-reflection" data-form="${actor}-reflect"><label class="field">${prompt}<textarea name="reflection" minlength="25" required placeholder="Use the result to explain your next move...">${esc(value)}</textarea></label><button class="button secondary">${value ? 'Update reflection' : 'Save reflection'}</button>${value ? '<span class="reflection-saved">Reflection saved in the notebook</span>' : ''}</form>`;
}
function hotelPriceForm(h) {
  const draftPrice = h.decision?.price ?? SCENARIO.hotel.referencePrice;
  return `<form data-form="hotel-decide"><div class="price-control"><label for="room-price-slider">Room price <output data-selected-price>${eur(draftPrice)}</output></label><input id="room-price-slider" data-price-slider type="range" min="110" max="220" step="1" value="${round(draftPrice)}" aria-label="Room price slider"><div class="price-scale"><span>Less · €110</span><span>More · €220</span></div></div><label class="field">Precise room price (€)<input name="price" data-price-input type="number" min="110" max="220" step="0.01" required value="${round(draftPrice, 2)}"></label><output class="price-preview" data-hotel-preview aria-live="polite">${esc(hotelPricePreview(draftPrice))}</output><div class="field-grid"><label class="field">Predicted rooms requested<input name="predictedRequested" type="number" min="0" step="any" required placeholder="Use Qd(P)"></label><label class="field">Predicted room revenue (€)<input name="predictedRevenue" type="number" min="0" step="any" required placeholder="Price × min(requests, ${SCENARIO.hotel.rooms})"></label></div><label class="field">Can this rate be called profit-maximizing with the information available?<select name="profitClaim" required><option value="">Choose an answer</option><option value="no">No, hotel operating costs are unknown</option><option value="yes">Yes, the highest room revenue means highest profit</option><option value="unsure">I am not sure yet</option></select></label><label class="field">Why this price?<textarea name="reason" required placeholder="Consider demand, capacity, room revenue, and missing costs...">${esc(h.decision?.reason || '')}</textarea></label><button class="button">${h.decision ? 'Test revised room rate' : 'Test room rate'}</button></form>`;
}
function hotelDecisionResult(h) {
  const d = h.decision;
  const marginalRevenue = d.marginalRevenue ?? SCENARIO.hotel.demand.intercept + 2 * SCENARIO.hotel.demand.slope * d.requested;
  return `<div class="notice" data-hotel-result><b>Your tested rate:</b> ${eur(d.price)} · ${fmt(d.requested)} rooms requested · ${fmt(d.sold)} sold · ${eur(d.revenue)} room revenue · ${eur(marginalRevenue)} uncapped MR at requested Q. ${esc(d.message)} ${d.capped ? 'Capacity limits sales; uncapped MR is not the marginal revenue of capped sales. ' : ''}Assuming one breakfast guest per sold room, the next period needs ${nextPeriodGuests()} rolls; the current bakery plan makes ${state.breakfast.decision?.rolls ?? 'an undecided number of'} rolls.</div>`;
}
function hotelElasticityTask(h) {
  const example = hotelAtPrice(SCENARIO.hotel.referencePrice);
  const change = Math.abs(example.elasticity);
  const revenueDirection = example.capped || change < .99 ? 'rise' : change > 1.01 ? 'fall' : 'steady';
  let body = `<h2>How sensitive are hotel guests?</h2><p>Use Lucia’s familiar rate so you can focus on what elasticity means. At ${eur(example.price)}, guests request ${fmt(example.requested)} rooms; the hotel can sell at most ${SCENARIO.hotel.rooms}.</p><div class="notice"><code>Elasticity = (1 / demand slope) × (price / rooms requested)</code><br>Your demand slope is ${fmt(SCENARIO.hotel.demand.slope)}, so <code>1 / slope = ${fmt(1 / SCENARIO.hotel.demand.slope)}</code>.</div>`;
  if (!h.elasticity) {
    body += `<form data-form="hotel-elasticity"><label class="field">Price elasticity of requested rooms at ${eur(example.price)}<input name="value" type="number" step="any" required placeholder="Include the minus sign"></label><label class="field">If Lucia raises the room rate slightly, guests will request...<select name="direction" required><option value="">Choose an answer</option><option value="fewer">Fewer rooms</option><option value="more">More rooms</option><option value="same">About the same number</option></select></label><label class="field">Near this rate, a small price rise would make room revenue...<select name="revenueDirection" required><option value="">Choose an answer</option><option value="rise">Rise</option><option value="fall">Fall</option><option value="steady">Stay about the same</option><option value="profit">Prove that profit rises</option></select></label><button class="button">Check elasticity and meaning</button></form>`;
  } else {
    body += `<div class="notice" data-elasticity-result><b>Elasticity at ${eur(example.price)}:</b> ${fmt(example.elasticity)}. A 1% higher room rate means approximately ${fmt(change)}% fewer room requests near this rate. ${example.capped ? 'Capacity currently limits sales, so the response of room revenue needs a separate capacity check.' : `Because demand is ${change > 1.01 ? 'elastic' : change < .99 ? 'inelastic' : 'near unit elastic'} and capacity does not bind here, room revenue would ${revenueDirection} after a small price rise.`} This does not establish hotel profit.</div><form data-form="hotel-elasticity-reflect"><label class="field">What would you tell Lucia about a small price increase, and what can this result not tell her about profit?<textarea name="reflection" minlength="20" required placeholder="Use the result in your advice...">${esc(h.elasticity.reflection || '')}</textarea></label><button class="button secondary">${h.elasticity.reflection ? 'Update advice' : 'Save advice to Lucia'}</button></form>`;
  }
  return body;
}
function hotelTask() {
  const h = state.hotel, enough = has('hotel', ['price', 'bookings', 'other', 'comparable']);
  const partOneDone = !!h.decision?.reflection;
  let body = `<div class="hotel-part-track" aria-label="Hotel exercises"><span class="${partOneDone ? 'done' : 'active'}">1 · Demand, MR and room rate</span><span class="${h.elasticity?.reflection ? 'done' : partOneDone ? 'active' : ''}">2 · Elasticity</span></div><span class="stage-badge">${!enough ? 'Gather evidence' : !h.model ? 'Find demand' : !h.mr && !h.decision ? 'Find marginal revenue' : !h.decision ? 'Set a room rate' : !partOneDone ? 'Review your rate' : 'Interpret elasticity'}</span>`;
  if (!enough) {
    body += `<h2>Find the demand clues</h2><p>What price and requested-room pairs can you defend? Ask Lucia for the current price and bookings; ask Marco about another price and whether the dates are comparable.</p><div class="step-list">${[['price','Current price'],['bookings','Bookings at that price'],['other','Second price and bookings'],['comparable','Comparable conditions']].map(([id,label]) => `<div class="step ${asked('hotel',id)?'done':''}"><b>${asked('hotel',id)?'✓':'•'}</b><span>${label}</span></div>`).join('')}</div>`;
    if (asked('hotel','bookings') || asked('hotel','other')) body += `<div class="scroll-table"><table class="observation-table"><tr><th>Example</th><th>Price</th><th>Requested</th><th>Sold</th></tr>${asked('hotel','bookings') ? '<tr><td>A</td><td>€170</td><td>69</td><td>69</td></tr>' : ''}${asked('hotel','other') ? '<tr><td>B</td><td>€190</td><td>54</td><td>54</td></tr>' : ''}</table></div>`;
  } else if (!h.model) {
    body += `<h2>Propose inverse demand</h2><p>With the two uncensored examples, propose <b>P(Q) = a + bQ</b>. You have not been shown Lucia’s equation. Decide what slope and intercept fit the evidence.</p><div class="notice">A: (Q = 69, P = €170) &nbsp; B: (Q = 54, P = €190)<br>Same classroom conditions; neither example reaches 80 rooms.</div>
    <form data-form="hotel-model"><div class="field-grid"><label class="field">Intercept a<input name="intercept" type="number" step="any" required placeholder="€"></label><label class="field">Slope b<input name="slope" type="number" step="any" required placeholder="€/room"></label></div><button class="button">Check proposed function</button></form>`;
  } else if (!h.mr && !h.decision) {
    body += `<h2>Turn demand into marginal revenue</h2><p>You found <b>P(Q) = ${fmt(h.model.intercept)} ${h.model.slope < 0 ? '−' : '+'} ${fmt(Math.abs(h.model.slope))}Q</b>. For uncapped demand, multiply price by Q to get total revenue, then double the Q coefficient to find MR.</p><div class="notice"><code>TR(Q) = aQ + bQ²</code><br><code>MR(Q) = a + 2bQ</code><br>Here a = ${fmt(h.model.intercept)} and b = ${fmt(h.model.slope)}.</div><form data-form="hotel-mr"><label class="field">What is the Q coefficient in MR(Q) = ${fmt(h.model.intercept)} + cQ?<input name="slope" type="number" step="any" required placeholder="Calculate c = 2 × b"></label><button class="button">Check marginal revenue</button></form>`;
  } else if (!h.decision) {
    body += `<h2>Choose a room rate</h2><p>Set a price, predict room requests and room revenue, then see the result. The hotel has ${SCENARIO.hotel.rooms} rooms; revenue is not profit.</p><details class="prior-tests"><summary>Review the demand chart${h.tests.length ? ' and earlier tests' : ''}</summary>${hotelChart()}${hotelTests()}</details>${hotelPriceForm(h)}`;
  } else {
    body += partOneDone
      ? `<details class="prior-tests"><summary>Part 1 result · ${eur(h.decision.price)} room rate</summary>${hotelDecisionResult(h)}</details>${hotelElasticityTask(h)}<details class="prior-tests" data-hotel-edit><summary>Change your room rate</summary>${hotelPriceForm(h)}</details>`
      : `<h2>Review your room rate</h2>${hotelDecisionResult(h)}${reflectionForm('hotel', h.decision.reflection)}<details class="prior-tests" data-hotel-edit><summary>Change your room rate</summary>${hotelPriceForm(h)}</details>`;
  }
  if (h.feedback && !(partOneDone && h.feedback === 'Saved: your post-result reflection is in the notebook.')) body += `<p class="feedback ${h.feedback.startsWith('Good') || h.feedback.startsWith('Saved') ? 'good' : ''}" role="status">${esc(h.feedback)}</p>`;
  body += `<div class="button-row"><button class="button secondary" data-action="hint">Need a hint?</button></div>${hintText('hotel')}`;
  if (h.mr || h.decision) body += `<details><summary>Show the mathematical model</summary><p>From two uncensored points, P(Q) = 262 − (4/3)Q. For uncapped demand, TR(Q) = 262Q − (4/3)Q² and MR(Q) = 262 − (8/3)Q. Room sales still stop at ${SCENARIO.hotel.rooms}.</p></details>`;
  return body;
}
function hotelTests() {
  if (!state.hotel.tests.length) return '';
  return `<div class="scroll-table"><table class="data-table"><tr><th>Price</th><th>Your demand</th><th>Model demand</th><th>Sold</th><th>Room revenue</th></tr>${state.hotel.tests.map(t => `<tr><td>${eur(t.price)}</td><td>${fmt(t.prediction)}</td><td>${fmt(t.requested)}</td><td>${fmt(t.sold)}</td><td>${eur(t.revenue)}</td></tr>`).join('')}</table></div>`;
}
function bakeryTask() {
  const b = state.breakfast, ready = has('bakery', ['order', 'one', 'two', 'three', 'cost']);
  const tested = new Set(b.runs.filter(run => run.verified !== false).map(run => run.bakers));
  const nextBakers = SCENARIO.breakfast.plans.find(plan => !tested.has(plan.bakers))?.bakers ?? 1;
  let body = `<span class="stage-badge">${!ready ? '01 · Investigate production' : tested.size < 3 ? '02 · Calculate and test' : '03 · Compare and decide'}</span>`;
  if (!ready) {
    body += `<h2>Find the production facts</h2><p>Ask Marta about the hotel order and costs. Ask Paolo how many rolls one, two, and three bakers produce using the same oven.</p><div class="step-list">${[['order','Hotel order'],['one','One baker'],['two','Two bakers'],['three','Three bakers'],['cost','Labour and ingredient cost']].map(([id,label]) => `<div class="step ${asked('bakery',id)?'done':''}"><b>${asked('bakery',id)?'✓':'•'}</b><span>${label}</span></div>`).join('')}</div>`;
  } else {
    body += `<h2>${tested.size < 3 ? 'Calculate a production plan' : 'Choose a plan you can defend'}</h2><p>Use Marta’s costs and Paolo’s output figures to calculate extra output, order cost, and guests served. Test all three plans before choosing.</p><div class="step-list">${SCENARIO.breakfast.plans.map(plan => `<div class="step ${tested.has(plan.bakers) ? 'done' : ''}"><b>${tested.has(plan.bakers) ? '✓' : '•'}</b><span>${plan.bakers} baker${plan.bakers > 1 ? 's' : ''} ${tested.has(plan.bakers) ? 'tested' : 'to test'}</span></div>`).join('')}</div>
    <form data-form="bakery-test"><label class="field">Bakers scheduled<select name="bakers">${SCENARIO.breakfast.plans.map(p => `<option value="${p.bakers}" ${nextBakers === p.bakers ? 'selected' : ''}>${p.bakers} baker${p.bakers > 1 ? 's' : ''}</option>`).join('')}</select></label><div class="field-grid"><label class="field">Predicted rolls produced<input name="predictedRolls" type="number" min="0" step="any" required placeholder="From Marta’s answer"></label><label class="field">Extra rolls from this baker<input name="predictedExtra" type="number" min="0" step="any" required placeholder="Difference from prior plan"></label><label class="field">Predicted order cost (€)<input name="predictedCost" type="number" min="0" step="any" required placeholder="Labour + ingredients"></label><label class="field">Predicted guests served<input name="prediction" type="number" min="0" max="60" step="any" required placeholder="At most 60"></label></div><button class="button">Test this production plan</button></form>`;
    if (b.runs.length) body += `<details class="prior-tests"><summary>Review tested plans (${tested.size}/3 verified)</summary><div class="scroll-table"><table class="data-table"><tr><th>Bakers</th><th>Your extra</th><th>Actual extra</th><th>Served</th><th>Order cost</th><th>Status</th></tr>${b.runs.map(r => `<tr><td>${r.bakers}</td><td>${fmt(r.predictions?.extraOutput)}</td><td>${r.extraOutput ?? r.rolls - (SCENARIO.breakfast.plans[r.bakers - 2]?.rolls ?? 0)}</td><td>${r.served}</td><td>${eur(r.orderCost)}</td><td>${r.verified === false ? 'Re-test' : 'Checked'}</td></tr>`).join('')}</table></div></details>`;
    if (tested.size === 3) body += `<hr class="section-rule"><h3>Final breakfast order</h3><p>Which plan best balances service with cost? You can still test another option first.</p><form data-form="bakery-decide"><label class="field">Choose number of bakers<select name="bakers">${SCENARIO.breakfast.plans.map(p => `<option value="${p.bakers}" ${b.decision?.bakers === p.bakers ? 'selected' : ''}>${p.bakers} baker${p.bakers > 1 ? 's' : ''}</option>`).join('')}</select></label><label class="field">Explain your decision<textarea name="reason" required placeholder="Compare extra output, guests served, costs, and the fixed oven...">${esc(b.decision?.reason || '')}</textarea></label><button class="button">${b.decision ? 'Update order' : 'Commit breakfast order'}</button></form>`;
    if (b.decision) body += `<div class="notice"><b>Current order:</b> ${b.decision.bakers} bakers serve ${b.decision.served}/60 guests. Contribution from this breakfast contract is ${eur(b.decision.contribution)}, not total hotel profit.</div>${reflectionForm('bakery', b.decision.reflection)}`;
  }
  if (b.feedback) body += `<p class="feedback ${b.feedback.startsWith('Good') || b.feedback.startsWith('Saved') ? 'good' : ''}" role="status">${esc(b.feedback)}</p>`;
  body += `<div class="button-row"><button class="button secondary" data-action="hint">Need a hint?</button></div>${hintText('bakery')}`;
  return body;
}
function wineryTask() {
  const ready = has('winery', ['options', 'stock', 'forecast', 'taste']);
  let body = `<span class="stage-badge">${ready ? '02 · Compare purchase options' : '01 · Interview the winery team'}</span>`;
  if (!ready) body += `<h2>What can the winery supply?</h2><p>Ask Sofia about the wines and tasting results. Ask Giulia about available stock and the hotel’s dinner forecast.</p><div class="step-list">${[['options','Purchase options'],['stock','Estate supply limit'],['forecast','Dinner forecast'],['taste','Tasting evidence']].map(([id,label]) => `<div class="step ${asked('winery',id)?'done':''}"><b>${asked('winery',id)?'✓':'•'}</b><span>${label}</span></div>`).join('')}</div>`;
  else {
    const bottles = dinnerBottles();
    body += `<h2>Choose wine for ${bottles} dinners</h2><p>Assume one bottle per sold room plus ${SCENARIO.wine.outsideDiners} outside dinner bookings. House wine is €8 per bottle; estate reserve is €12 and limited to 60 bottles. Calculate quantities and cost before ordering.</p><form data-form="winery-decide"><div class="choice-cards">${SCENARIO.wine.options.map(opt => `<label class="choice-card"><input type="radio" name="choice" value="${opt.id}" ${state.winery.choice === opt.id ? 'checked' : ''} required><span><b>${opt.id === 'mixed' ? 'Estate reserve plus house wine' : 'House wine only'}</b><small>${esc(opt.tasting)}</small></span></label>`).join('')}</div><div class="field-grid"><label class="field">Estate bottles<input name="predictedEstate" type="number" min="0" max="60" step="1" required placeholder="0–60"></label><label class="field">House bottles<input name="predictedHouse" type="number" min="0" step="1" required placeholder="Cover the rest"></label><label class="field">Predicted purchase cost (€)<input name="predictedCost" type="number" min="0" step="any" required placeholder="Work out total"></label></div><label class="field">Why this option?<textarea name="reason" required placeholder="Discuss cost, availability, and what is still uncertain...">${esc(state.winery.reason)}</textarea></label><button class="button">${state.winery.choice ? 'Test revised order' : 'Test and save wine order'}</button></form>`;
    if (state.winery.choice) body += `<div class="notice ${state.winery.needsReview ? 'warning' : ''}" data-wine-result><b>Your last tested order:</b> ${state.winery.estate} estate + ${state.winery.house} house bottles · ${eur(state.winery.cost)} purchase cost. ${state.winery.needsReview ? 'The room forecast changed. Calculate the new quantities and test this order again.' : 'We have not estimated its effect on hotel profit or guest satisfaction.'}</div>${state.winery.needsReview ? '' : reflectionForm('winery', state.winery.reflection)}`;
  }
  if (state.winery.feedback) body += `<p class="feedback ${state.winery.feedback.startsWith('Saved') ? 'good' : ''}" role="status">${esc(state.winery.feedback)}</p>`;
  body += `<div class="button-row"><button class="button secondary" data-action="hint">Need a hint?</button></div>${hintText('winery')}<details><summary>Later: own-winery investment</summary><p>A make-or-buy investment requires initial outlay, future cash flows, opportunity cost, a discount rate, and risk. This first district covers the purchase decision only.</p></details>`;
  return body;
}
function hintText(actor) {
  const elasticityPart = actor === 'hotel' && !!state.hotel.decision?.reflection;
  const level = state.hints[elasticityPart ? 'hotelElasticity' : actor] || 0;
  if (!level) return '';
  const hints = elasticityPart ? ['Use requested rooms in the elasticity formula, not a room-sales cap.', 'From P(Q) = a + bQ, the change in Q for a €1 price change is 1 / b.', 'A negative result means requests fall as price rises. Compare |elasticity| with 1 to reason about room revenue.']
    : actor === 'hotel' ? ['Two different price–quantity pairs under the same conditions can identify a straight line.', 'Compute the slope as ΔP/ΔQ. MR has twice this Q coefficient.', 'Room revenue uses rooms sold, which can be less than rooms requested when capacity binds.']
    : actor === 'bakery' ? ['Compare extra output from each additional baker.', 'A third baker adds five rolls, but the hotel has only 60 guests.', 'Compare the contribution for each plan: breakfast revenue minus the bread order cost.']
    : ['The estate can provide only 60 bottles.', `Calculate the total purchase cost for each ${dinnerBottles()}-bottle plan.`, 'A tasting score is not a measured willingness to pay.'];
  return `<div class="hint-box">Hint ${Math.min(level, 3)}: ${esc(hints[Math.min(level, 3) - 1])}</div>`;
}
function notebookView() {
  const interviews = state.log.filter(e => e.kind === 'question');
  const work = state.log.filter(e => e.kind !== 'question' && e.kind !== 'visit');
  const returnPlace = ROOM_IDS.includes(state.notebookReturn) ? state.notebookReturn : 'town';
  return `<div class="screen-head"><div><p class="eyebrow">Saved on this device</p><h1>Field notebook</h1></div><div class="button-row"><button class="button secondary" data-view="${returnPlace}">← ${returnPlace[0].toUpperCase() + returnPlace.slice(1)}</button><button class="button" data-action="export">Export JSON ↓</button></div></div>
  <div class="notebook-grid"><section class="panel"><h2>Evidence and interviews</h2>${interviews.length ? interviews.map(e => `<div class="entry"><strong>${esc(e.data?.speaker || ACTORS[e.actor]?.name || e.actor)} · ${esc(e.detail)}</strong><p>${esc(e.data?.answer || '')}</p><small>${new Date(e.at).toLocaleString()}</small></div>`).join('') : '<p class="empty">No questions asked yet. Visit a business to begin.</p>'}</section>
  <section class="panel"><h2>Models, tests, and decisions</h2>${work.length ? work.map(e => `<div class="entry"><strong>${esc(e.kind.replaceAll('_',' '))} · ${esc(ACTORS[e.actor]?.name || e.actor)}</strong><p>${esc(e.detail)}</p><small>${new Date(e.at).toLocaleString()}</small></div>`).join('') : '<p class="empty">Your proposals, tests, revisions, hints, and decisions will appear here.</p>'}</section>
  <section class="panel full"><h2>Current results</h2><div class="field-grid"><div><div class="metric-row"><span>Breakfast order</span><strong>${state.breakfast.decision ? `${state.breakfast.decision.bakers} bakers · ${state.breakfast.decision.served} served` : 'Not decided'}</strong></div><div class="metric-row"><span>Hotel room rate</span><strong>${state.hotel.decision ? eur(state.hotel.decision.price) : 'Not decided'}</strong></div></div><div><div class="metric-row"><span>Hotel elasticity</span><strong>${state.hotel.elasticity?.reflection ? `${fmt(state.hotel.elasticity.value)} · interpreted` : 'To explore'}</strong></div><div class="metric-row"><span>Wine purchase</span><strong>${state.winery.choice ? `${state.winery.choice === 'house' ? 'House' : 'Mixed'}${state.winery.needsReview ? ' · review needed' : ''}` : 'Not decided'}</strong></div></div></div><p class="muted" style="font-size:12px">These are local, simulated classroom records. Export before clearing browser storage. Do not treat demonstration data as observed hotel results.</p></section></div>`;
}
function render() {
  if (town) { town.destroy(); town = null; }
  if (interior) { interior.destroy(); interior = null; }
  document.querySelectorAll('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === state.view));
  document.querySelector('#notebook-count').textContent = state.log.length;
  main.innerHTML = state.view === 'town' ? townView() : ROOM_IDS.includes(state.view) ? roomView(state.view) : notebookView();
  if (state.view === 'town') {
    town = new Town(document.querySelector('#town-canvas'), state.player, visit, (_, force) => {
      const now = Date.now(); if (force || now - lastMoveSave > 800) { lastMoveSave = now; save(); }
    }, label => toast(`${label} opens in a later district. Try the hotel, bakery, or vineyard.`), openStreet);
    town.paused = !!state.overlay;
  } else if (ROOM_IDS.includes(state.view)) {
    const actor = state.view;
    interior = new BusinessInterior(document.querySelector('#room-canvas'), state[`${actor}Player`], actor, talkRoomPerson, () => { state.actor = actor; openWorkspace(); }, () => go('town'), force => {
      const now = Date.now(); if (force || now - lastMoveSave > 800) { lastMoveSave = now; save(); }
    }, roomGuide(actor));
    interior.paused = !!state.overlay;
  }
  if (state.view === 'town' || ROOM_IDS.includes(state.view)) {
    bindTouch();
    if (state.overlay) requestAnimationFrame(() => {
      const selector = state.overlay === 'dialogue' ? '.scene-question' : state.overlay === 'street' ? '.street-options button' : '.mini-task input, .mini-task select, .mini-task textarea, .mini-tool-links button';
      main.querySelector(selector)?.focus({ preventScroll: true });
    });
  }
}
function bindTouch() {
  document.querySelectorAll('[data-move]').forEach(button => {
    const key = button.dataset.move;
    button.addEventListener('pointerdown', e => { e.preventDefault(); button.setPointerCapture(e.pointerId); (interior || town)?.setControl(key, true); });
    for (const type of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(type, e => { e.preventDefault(); (interior || town)?.setControl(key, false); });
  });
}
function feedback(actor, message) { state[actor === 'bakery' ? 'breakfast' : actor].feedback = message; save(); render(); }
function handleForm(form) {
  const values = Object.fromEntries(new FormData(form));
  const reflectionActor = form.dataset.form.match(/^(hotel|bakery|winery)-reflect$/)?.[1];
  if (reflectionActor) {
    const reflection = String(values.reflection || '').trim();
    if (reflection.length < 25) return feedback(reflectionActor, 'Use the result to explain what you would keep or revise.');
    const decision = reflectionActor === 'bakery' ? state.breakfast.decision : reflectionActor === 'hotel' ? state.hotel.decision : state.winery;
    if (!decision) return;
    decision.reflection = reflection;
    record('reflection', reflectionActor, reflection);
    return feedback(reflectionActor, 'Saved: your post-result reflection is in the notebook.');
  }
  if (form.dataset.form === 'hotel-elasticity-reflect') {
    const reflection = String(values.reflection || '').trim();
    if (reflection.length < 20) return feedback('hotel', 'Tell Lucia what the elasticity result means and what it cannot prove about profit.');
    if (!state.hotel.elasticity) return;
    state.hotel.elasticity.reflection = reflection;
    record('reflection', 'hotel', reflection, { exercise: 'elasticity' });
    return feedback('hotel', 'Saved: your elasticity advice is in the notebook.');
  }
  switch (form.dataset.form) {
    case 'hotel-model': {
      const intercept = Number(values.intercept), slope = Number(values.slope);
      const correct = SCENARIO.hotel.demand;
      state.hotel.proposals.push({ intercept, slope, at: new Date().toISOString() });
      record('model_proposal', 'hotel', `P(Q) = ${fmt(intercept)} + (${fmt(slope)})Q`, { intercept, slope });
      if (slope >= 0) return feedback('hotel', 'A higher price was associated with fewer requested rooms. Recheck the sign of the slope.');
      if (Math.abs(slope - correct.slope) > .08) return feedback('hotel', 'Check the slope: divide the change in price by the change in requested rooms.');
      if (Math.abs(intercept - correct.intercept) > 2) return feedback('hotel', 'Your slope is close. Substitute either observation to check the intercept.');
      state.hotel.model = { intercept, slope }; record('milestone', 'hotel', 'Demand function proposed from two comparable, uncensored observations');
      return feedback('hotel', 'Good: the two examples fit P(Q) = 262 − (4/3)Q. Next, find marginal revenue.');
    }
    case 'hotel-mr': {
      const slope = Number(values.slope);
      const expected = 2 * SCENARIO.hotel.demand.slope;
      record('mr_proposal', 'hotel', `MR Q coefficient: ${fmt(slope)}`, { slope });
      if (!Number.isFinite(slope) || Math.abs(slope - expected) > .08) return feedback('hotel', 'MR has the same intercept as demand, but its Q coefficient is twice the demand slope. Keep the negative sign.');
      state.hotel.mr = { intercept: SCENARIO.hotel.demand.intercept, slope, at: new Date().toISOString() };
      record('milestone', 'hotel', `Marginal revenue function checked: MR(Q) = ${fmt(state.hotel.mr.intercept)} + (${fmt(slope)})Q`, state.hotel.mr);
      return feedback('hotel', `Good: your marginal revenue function is ready. Now use demand and the ${SCENARIO.hotel.rooms}-room capacity to set a rate.`);
    }
    case 'hotel-test': {
      const price = Number(values.price), prediction = Number(values.prediction), outcome = hotelAtPrice(price);
      const result = { ...outcome, prediction, at: new Date().toISOString() };
      state.hotel.tests.push(result);
      record('prediction_test', 'hotel', `${eur(price)}: predicted ${fmt(prediction)} requested; model ${fmt(outcome.requested)} requested; ${fmt(outcome.sold)} sold.`, result);
      const error = Math.abs(prediction - outcome.requested);
      const msg = outcome.capped ? `Good test: the model requests ${fmt(outcome.requested)} rooms, but sales stop at 80. ${error < 1 ? 'Your demand prediction was close.' : prediction === 80 ? 'You predicted sales rather than requested demand.' : 'Compare your predicted demand with the model result.'}`
        : `Good test: model demand and rooms sold are both ${fmt(outcome.requested)}. ${error < 1 ? 'Your prediction was close.' : 'Compare your prediction with the model and check the sign of the slope.'}`;
      return feedback('hotel', msg);
    }
    case 'hotel-revise': {
      const intercept = Number(values.intercept), slope = Number(values.slope), reason = String(values.reason).trim();
      record('model_revision_attempt', 'hotel', reason, { intercept, slope });
      if (reason.length < 20) return feedback('hotel', 'Explain what the capacity-limited test taught you in a little more detail.');
      if (Math.abs(intercept - 262) > 2 || Math.abs(slope + 4/3) > .08) return feedback('hotel', 'Check your revised coefficients against the two comparable observations.');
      state.hotel.revision = { intercept, slope, reason, at: new Date().toISOString() };
      record('model_revision', 'hotel', reason, state.hotel.revision);
      return feedback('hotel', 'Saved: the model remains consistent with the original observations; capped sales need separate interpretation.');
    }
    case 'hotel-decide': {
      const price = Number(values.price), reason = String(values.reason).trim();
      if (!Number.isFinite(price) || price < 110 || price > 220) return feedback('hotel', 'Choose a room price between €110 and €220.');
      if (values.profitClaim !== 'no') return feedback('hotel', values.profitClaim === 'yes'
        ? 'Room revenue is not hotel profit. Ask Elena about costs, then reconsider this claim.'
        : 'We cannot identify a profit-maximizing rate without hotel operating costs.');
      if (reason.length < 20) return feedback('hotel', 'Briefly explain demand, capacity, and why room revenue is not profit.');
      const result = hotelAtPrice(price), best = revenueBestHotel();
      const predictions = {
        requested: Number(values.predictedRequested), revenue: Number(values.predictedRevenue)
      };
      if (Object.values(predictions).some(value => !Number.isFinite(value))) return feedback('hotel', 'Enter a valid number for each prediction.');
      const marginalRevenue = SCENARIO.hotel.demand.intercept + 2 * SCENARIO.hotel.demand.slope * result.requested;
      const gap = best.revenue - result.revenue;
      const message = gap < 15 ? 'This is near the feasible room-revenue maximum. Profit remains unknown without costs.'
        : `It earns about ${eur(gap)} less room revenue than the feasible revenue-best rate. Other objectives or costs could still matter.`;
      const differences = [
        ['requested rooms', predictions.requested, result.requested, 1],
        ['room revenue', predictions.revenue, result.revenue, 15]
      ].filter(([, predicted, actual, tolerance]) => Math.abs(predicted - actual) > tolerance).map(([label]) => label);
      state.hotel.decision = { ...result, marginalRevenue, predictions, reason, message, at: new Date().toISOString() };
      record('decision', 'hotel', `${eur(price)} per room; predicted ${fmt(predictions.requested)} requested and ${eur(predictions.revenue)} revenue; model ${fmt(result.sold)} sold and ${eur(result.revenue)} room revenue. ${reason}`, state.hotel.decision);
      if (state.winery.choice) {
        const revised = wineOutcome(state.winery.choice, SCENARIO.wine, dinnerBottles());
        if (revised.bottles !== state.winery.bottles) {
          state.winery = { ...state.winery, ...revised, needsReview: true, reflection: '', feedback: '' };
          record('linked_forecast_revision', 'winery', `Room forecast changed the wine requirement to ${revised.bottles} bottles. Recalculate the order.`, revised);
        }
      }
      return feedback('hotel', `Saved: ${differences.length ? `Recheck your ${differences.join(', ')} against the revealed result. ` : 'Your predictions were close. '}${message}`);
    }
    case 'hotel-elasticity': {
      const example = hotelAtPrice(SCENARIO.hotel.referencePrice);
      const value = Number(values.value);
      const expectedRevenue = example.capped || Math.abs(example.elasticity) < .99 ? 'rise' : Math.abs(example.elasticity) > 1.01 ? 'fall' : 'steady';
      record('elasticity_attempt', 'hotel', `At ${eur(example.price)}: predicted ${fmt(value)}; requests ${values.direction}; room revenue ${values.revenueDirection}.`, { value, direction: values.direction, revenueDirection: values.revenueDirection });
      if (!Number.isFinite(value) || Math.abs(value - example.elasticity) > .12) return feedback('hotel', `Use (1 / demand slope) × (price / requested rooms). At ${eur(example.price)}, divide by ${fmt(example.requested)} requested rooms and keep the negative sign.`);
      if (values.direction !== 'fewer') return feedback('hotel', 'A negative elasticity means a higher price leads to fewer room requests.');
      if (values.revenueDirection !== expectedRevenue) return feedback('hotel', example.capped
        ? 'Capacity still limits sales at this rate. For a small increase, consider whether the hotel can keep selling all rooms.'
        : `At this rate, |elasticity| is ${Math.abs(example.elasticity) > 1 ? 'above' : 'below'} 1. Compare the percentage fall in requests with the percentage rise in price. Room revenue is not profit.`);
      state.hotel.elasticity = { price: example.price, requested: example.requested, value: example.elasticity, submitted: value, direction: values.direction, revenueDirection: values.revenueDirection, reflection: '', at: new Date().toISOString() };
      record('elasticity_interpretation', 'hotel', `At ${eur(example.price)}, elasticity ${fmt(example.elasticity)}: requests fall and room revenue would ${expectedRevenue} after a small price rise.`, state.hotel.elasticity);
      return feedback('hotel', 'Good: you calculated elasticity and interpreted its effect on room requests and revenue. Now give Lucia your advice.');
    }
    case 'bakery-test': {
      const bakers = Number(values.bakers), prediction = Number(values.prediction);
      const plan = SCENARIO.breakfast.plans.find(p => p.bakers === bakers);
      if (!plan) return;
      const previousRolls = SCENARIO.breakfast.plans.find(p => p.bakers === bakers - 1)?.rolls ?? 0;
      const extraOutput = plan.rolls - previousRolls;
      const predictions = { rolls: Number(values.predictedRolls), extraOutput: Number(values.predictedExtra), orderCost: Number(values.predictedCost), served: prediction };
      if (Object.values(predictions).some(value => !Number.isFinite(value))) return feedback('bakery', 'Enter a valid number for each calculation.');
      const outcome = bakeryOutcome(plan);
      const errors = [['rolls produced', predictions.rolls, outcome.rolls], ['extra output', predictions.extraOutput, extraOutput], ['order cost', predictions.orderCost, outcome.orderCost], ['guests served', predictions.served, outcome.served]].filter(([, predicted, actual]) => Math.abs(predicted - actual) > .1).map(([label]) => label);
      const result = { ...outcome, extraOutput, predictions, prediction, verified: errors.length === 0, at: new Date().toISOString() };
      state.breakfast.runs.push(result);
      record('prediction_test', 'bakery', `${bakers} bakers: predicted ${fmt(predictions.rolls)} rolls, ${fmt(predictions.extraOutput)} extra, ${eur(predictions.orderCost)} cost, ${fmt(prediction)} served; model ${result.rolls} rolls, ${extraOutput} extra, ${eur(result.orderCost)} cost, ${result.served} served.`, result);
      return feedback('bakery', `${errors.length ? 'Check' : 'Good test'}: ${bakers} baker${bakers > 1 ? 's' : ''} produce ${result.rolls} rolls; the added baker contributes ${extraOutput}. Cost is ${eur(result.orderCost)} and ${result.served} guests are served. ${errors.length ? `Recheck your ${errors.join(', ')} and re-test this plan before deciding.` : 'Your calculations were close.'}`);
    }
    case 'bakery-decide': {
      const bakers = Number(values.bakers), reason = String(values.reason).trim();
      if (reason.length < 25) return feedback('bakery', 'Explain why the extra output is or is not worth its extra cost.');
      const result = bakeryOutcome(SCENARIO.breakfast.plans.find(p => p.bakers === bakers));
      state.breakfast.decision = { ...result, reason, at: new Date().toISOString() };
      record('decision', 'bakery', `${bakers} bakers; ${result.served} guests served; ${eur(result.contribution)} contribution. ${reason}`, state.breakfast.decision);
      const best = Math.max(...SCENARIO.breakfast.plans.map(p => bakeryOutcome(p).contribution));
      return feedback('bakery', `Saved: your plan serves ${result.served}/60 guests. ${result.contribution === best ? 'It has the highest contribution of these three plans.' : `A different plan reaches ${eur(best)} contribution; compare marginal benefit and cost.`}`);
    }
    case 'winery-decide': {
      const choice = values.choice, reason = String(values.reason).trim();
      if (!['house','mixed'].includes(choice)) { toast('Choose one wine plan.'); return; }
      if (reason.length < 25) { toast('Explain cost, availability, and remaining uncertainty.'); return; }
      const outcome = wineOutcome(choice, SCENARIO.wine, dinnerBottles());
      const predictions = { estate: Number(values.predictedEstate), house: Number(values.predictedHouse), cost: Number(values.predictedCost) };
      if (Object.values(predictions).some(value => !Number.isFinite(value))) { toast('Enter valid quantities and purchase cost.'); return; }
      const errors = [['estate bottles', predictions.estate, outcome.estate], ['house bottles', predictions.house, outcome.house], ['purchase cost', predictions.cost, outcome.cost]].filter(([, predicted, actual]) => Math.abs(predicted - actual) > .1).map(([label]) => label);
      if (errors.length) {
        record('purchase_check', 'winery', `${choice} plan: predicted ${predictions.estate} estate + ${predictions.house} house at ${eur(predictions.cost)}; required ${outcome.estate} estate + ${outcome.house} house at ${eur(outcome.cost)}.`, { predictions, outcome });
        return feedback('winery', `Check your ${errors.join(', ')}. This plan needs ${outcome.estate} estate and ${outcome.house} house bottles at ${eur(outcome.cost)}. Recalculate before saving the order.`);
      }
      state.winery = { choice, reason, ...outcome, predictions, needsReview: false, feedback: 'Saved. Your purchase calculations were close.', at: new Date().toISOString() };
      record('decision', 'winery', `${choice} plan; predicted ${eur(predictions.cost)}, purchase cost ${eur(outcome.cost)}. ${reason}`, state.winery);
      toast(`Wine order checked · ${eur(outcome.cost)} purchase cost`); render(); return;
    }
  }
}
main.addEventListener('submit', e => {
  if (!e.target.matches('[data-form]')) return;
  e.preventDefault();
  const name = e.target.dataset.form;
  const draft = [...e.target.elements].filter(input => input.name).map(input => ({ name: input.name, value: input.value, checked: input.checked, type: input.type }));
  handleForm(e.target);
  const replacement = main.querySelector(`[data-form="${name}"]`);
  const message = state.actor === 'bakery' ? state.breakfast.feedback : state[state.actor]?.feedback;
  if (replacement?.closest('details') && message && !/^(Good|Saved)/.test(message)) replacement.closest('details').open = true;
  if (replacement && message && !/^(Good|Saved)/.test(message)) for (const field of draft) {
    const input = replacement.elements.namedItem(field.name);
    if (!input) continue;
    if (input instanceof RadioNodeList) {
      if (field.type === 'radio') for (const option of input) if (option.value === field.value) option.checked = field.checked;
      continue;
    }
    input.value = field.value;
    if (field.type === 'checkbox' || field.type === 'radio') input.checked = field.checked;
  }
});
function updateScratch(event) {
  const field = event.target.closest('[data-scratch-field]');
  if (!field || !state.actor) return;
  state.scratchpads[state.actor][field.dataset.scratchField] = field.value;
  save();
  const output = main.querySelector('.scratch-result');
  if (output) output.textContent = scratchResult(state.actor).text;
}
main.addEventListener('input', e => {
  updateScratch(e);
  if (e.target.matches('[data-price-slider], [data-price-input]')) {
    const slider = main.querySelector('[data-price-slider]');
    const input = main.querySelector('[data-price-input]');
    const value = e.target.value;
    if (e.target === slider) input.value = value;
    else if (value !== '' && Number.isFinite(Number(value))) slider.value = String(Math.round(Number(value)));
    main.querySelector('[data-selected-price]').textContent = value !== '' && Number.isFinite(Number(value)) ? eur(Number(value)) : '—';
    main.querySelector('[data-hotel-preview]').textContent = hotelPricePreview(value);
  }
});
main.addEventListener('change', updateScratch);
main.addEventListener('click', e => {
  const view = e.target.closest('[data-view]'); if (view) { go(view.dataset.view); return; }
  const place = e.target.closest('[data-visit]'); if (place) { visit(place.dataset.visit); return; }
  const street = e.target.closest('[data-street]'); if (street) { openStreet(street.dataset.street); return; }
  const streetChoiceButton = e.target.closest('[data-street-choice]'); if (streetChoiceButton) { chooseStreet(streetChoiceButton.dataset.streetChoice); return; }
  const person = e.target.closest('[data-person]'); if (person) { talkRoomPerson(person.dataset.person); return; }
  const questionButton = e.target.closest('[data-question]'); if (questionButton) { question(state.actor, questionButton.dataset.question); return; }
  const color = e.target.closest('[data-color]'); if (color) { state.player.color = color.dataset.color; save(); render(); return; }
  const action = e.target.closest('[data-action]'); if (!action) return;
  if (action.dataset.action === 'close-overlay') { closeOverlay(); return; }
  if (action.dataset.action === 'workspace') { openWorkspace(); return; }
  if (action.dataset.action === 'dialogue') { openDialogue(); return; }
  if (action.dataset.action === 'formula-help') {
    const panel = document.getElementById(action.getAttribute('aria-controls'));
    panel.hidden = !panel.hidden;
    action.setAttribute('aria-expanded', String(!panel.hidden));
    return;
  }
  if (action.dataset.action === 'scratch-add') {
    const result = scratchResult(state.actor);
    if (!result.valid) { toast(result.text); return; }
    const pad = state.scratchpads[state.actor];
    pad.notes = [pad.notes.trim(), result.text].filter(Boolean).join('\n').slice(0, 2000);
    main.querySelector('[data-scratch-field="notes"]').value = pad.notes;
    save(); return;
  }
  if (action.dataset.action === 'talk') { (interior || town)?.interact(); return; }
  if (action.dataset.action === 'hint') {
    const actor = state.actor, elasticityPart = actor === 'hotel' && !!state.hotel.decision?.reflection;
    const key = elasticityPart ? 'hotelElasticity' : actor;
    state.hints[key] = Math.min(3, (state.hints[key] || 0) + 1);
    record('hint', actor, `Used ${elasticityPart ? 'elasticity ' : ''}hint ${state.hints[key]}`); render(); return;
  }
  if (action.dataset.action === 'export') {
    const blob = new Blob([JSON.stringify({ scenario: SCENARIO.label, exportedAt: new Date().toISOString(), state }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = 'sole-bay-notebook.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
});
document.querySelector('.tabs').addEventListener('click', e => { const button = e.target.closest('[data-view]'); if (button) go(button.dataset.view); });
window.addEventListener('keydown', e => {
  if (!['town', ...ROOM_IDS].includes(state.view) || !state.overlay || (e.target instanceof Element && e.target.closest('input, textarea, select'))) return;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
  if (e.key === 'Escape') { closeOverlay(); return; }
  if (state.overlay !== 'dialogue' || !['1', '2', '3'].includes(e.key)) return;
  const choice = suggestedQuestions(state.actor)[Number(e.key) - 1];
  if (choice) question(state.actor, choice);
});
document.querySelector('#restart').addEventListener('click', () => { if (!confirm('Restart this simulation? This clears all saved interviews, tests, and decisions on this device.')) return; localStorage.removeItem(KEY); state = blank(); render(); toast('New simulation started'); });
render();
