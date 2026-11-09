import { SCENARIO, ACTORS } from './config.js';
import { bakeryOutcome, wineOutcome, eur, round } from './economics.js';
import { Town, STREET_PEOPLE, streetChoice, bestStreetChoice } from './town.js';
import { BusinessInterior, ROOM_STAFF } from './interior.js';
import { answerFreeQuestion } from './free-agents.js';
import { blankCaseHotel, caseHotelTask, evaluateCaseHotel, dkk } from './case-hotel.js';

const KEY = 'sole-bay-simulation-v1';
const main = document.querySelector('#main');
const ROOM_IDS = ['hotel', 'bakery', 'winery'];
const emptyScratch = () => ({ left: '', operator: '+', right: '', notes: '' });
const blank = () => ({
  mode: null, view: 'town', actor: null, overlay: null, mapVersion: 2, caseVersion: 1, player: { x: 500, y: 250, color: '#477f9a' },
  hotelPlayer: { x: 450, y: 456, color: '#477f9a' }, bakeryPlayer: { x: 450, y: 480, color: '#477f9a' }, wineryPlayer: { x: 450, y: 480, color: '#477f9a' },
  roomPeople: { hotel: 'lucia', bakery: 'marta', winery: 'sofia' }, notebookReturn: 'town', streetId: null, street: {},
  interviews: { hotel: [], bakery: [], winery: [] }, replies: {}, visits: [],
  caseHotel: blankCaseHotel(),
  breakfast: { runs: [], decision: null, feedback: '' }, scratchpads: { hotel: emptyScratch(), bakery: emptyScratch(), winery: emptyScratch() },
  winery: { choice: null, reason: '' }, hints: {}, log: []
});
let state, stored = null;
try { stored = JSON.parse(localStorage.getItem(KEY) || 'null'); state = { ...blank(), ...stored }; } catch { state = blank(); }
if (stored && !stored.mode) state.mode = 'guided';
state.interviews ||= { hotel: [], bakery: [], winery: [] };
state.breakfast ||= blank().breakfast; state.winery ||= blank().winery;
state.caseHotel ||= blankCaseHotel();
if (stored && stored.caseVersion !== 1) {
  state.interviews.hotel = [];
  state.replies.hotel = null;
  state.caseHotel = blankCaseHotel();
  state.caseVersion = 1;
}
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
    ['price', 'How many rooms does this hotel have, and what units does the case use?', () => `The hotel has 78 rooms. Table 3 prices are in DKK, and Q is room-nights demanded by each guest group over the case period.`],
    ['bookings', 'How do occupancy and season affect the hotel?', () => 'We close in January for maintenance. Occupancy varies with season; the case illustrates May at 45% occupancy over 31 days.'],
    ['other', 'What are the demand estimates for the three guest groups?', () => 'Table 3 gives inverse demand: A: P = 2400 − 0.05Q; B: P = 2100 − 0.07Q; C: P = 1800 − 0.06Q. P is in DKK and Q in room-nights.'],
    ['comparable', 'Who are groups A, B and C?', () => 'A is individual travelers without children (about 50% of high-season stays), B is group travelers (30%), and C is families with children (10%). The remaining 10% is mixed.'],
    ['full', 'What is the hotel’s physical room capacity?', () => 'There are 78 rooms, including two small single rooms and six family rooms. A room-night is one room occupied for one night.'],
    ['costs', 'Can the case show a profit-maximizing room price?', () => 'The case does not give a room-level cost function. Revenue and price sensitivity alone cannot establish the profit-maximizing nightly rate.'],
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
async function askFree(text) {
  if (state.mode !== 'free' || !ROOM_IDS.includes(state.view)) return;
  const person = roomPerson();
  const input = String(text || '').trim().slice(0, 400);
  if (!input) return;
  const actor = state.actor, personId = state.roomPeople[actor];
  const history = state.log.filter(row => row.kind === 'question' && row.data?.mode === 'free' && row.data.speaker === person.name).slice(0, 6).reverse().map(row => ({ question: row.detail, answer: row.data.answer }));
  const fallback = () => answerFreeQuestion(personId, input, { nextPeriodGuests: nextPeriodGuests() });
  let result;
  try {
    const response = await fetch('/api/actor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ personId, question: input, history, nextPeriodGuests: nextPeriodGuests() }), signal: AbortSignal.timeout(17000) });
    if (!response.ok) throw new Error('Actor service unavailable');
    result = await response.json();
    if (typeof result.answer !== 'string' || result.answer.length > 800) throw new Error('Invalid actor response');
  } catch { result = fallback(); result.source = 'fallback'; }
  if (result.factId && !asked(actor, result.factId)) state.interviews[actor].push(result.factId);
  state.replies[actor] = { id: result.factId, answer: result.answer };
  record('question', actor, input, { answer: result.answer, speaker: person.name, mode: 'free', factId: result.factId, source: result.source });
  render();
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
  if (!state.visits.includes('hotel')) return { actor: 'hotel', label: 'Meet Lucia at the hotel', action: 'Ask about the 78-room hotel and its seasonal guests.' };
  if (!has('hotel', ['price', 'bookings'])) return { actor: 'hotel', label: 'Ask Lucia about the case', action: 'Find the hotel capacity, the case units and how occupancy varies.' };
  if (!state.breakfast.decision) return { actor: 'bakery', label: 'Arrange breakfast supply', action: 'Ask Marta about the order and costs, then Paolo about output with one, two, and three bakers.' };
  if (!state.breakfast.decision.reflection) return { actor: 'bakery', label: 'Reflect on breakfast', action: 'Compare your plan with the result and decide whether to revise it.' };
  if (!state.caseHotel.mr) return { actor: 'hotel', label: 'Find demand, TR and MR', action: 'Use the original case demand curve for group A to work out TR and MR.' };
  if (!state.caseHotel.elasticity) return { actor: 'hotel', label: 'Compare price elasticities', action: 'Calculate price elasticity for groups A, B and C at DKK 1,400.' };
  if (!state.caseHotel.interpretation) return { actor: 'hotel', label: 'Advise the hotel', action: 'Interpret income and cross-price elasticities and reflect on pricing uncertainty.' };
  if (!state.winery.choice || state.winery.needsReview) return { actor: 'winery', label: state.winery.needsReview ? 'Review the wine order' : 'Compare wine supply', action: 'Ask Sofia about wines and tasting, then Giulia about stock and the dinner forecast.' };
  if (!state.winery.reflection) return { actor: 'winery', label: 'Reflect on wine purchasing', action: 'Compare the order with your prediction and decide whether to revise it.' };
  return { actor: 'hotel', label: 'Review and refine', action: 'Revisit a decision or review the notebook before discussion.' };
}
function nextPeriodGuests() { return SCENARIO.breakfast.guests; }
function dinnerBottles() { return nextPeriodGuests() + SCENARIO.wine.outsideDiners; }
function townView() {
  const task = nextTask();
  const breakfast = state.breakfast.decision;
  const milestones = [has('hotel', ['price', 'bookings']), !!breakfast?.reflection, !!state.caseHotel.mr, !!state.caseHotel.elasticity, !!state.caseHotel.interpretation, !!state.winery.choice && !state.winery.needsReview && !!state.winery.reflection];
  const finished = milestones.filter(Boolean).length;
  return `<div class="game-heading"><div><p class="eyebrow">Day 01 · Riviera del Sole</p><h1>Hotel Sole Nascente</h1></div><span class="game-day">${finished} / ${milestones.length} steps</span></div>
    <div class="mode-status"><span>Conversation mode: <b>${state.mode === 'free' ? 'Ask your own questions' : 'Guided'}</b></span><button type="button" data-action="change-mode">Change mode</button></div>
    <section class="game-shell" aria-label="Riviera district">
      <div class="town-stage"><canvas id="town-canvas" width="1800" height="1080" tabindex="0" aria-label="Walkable Italian coastal district. Enter the hotel, bakery, or vineyard; Ana and Enzo walk the streets with optional utility questions. Arrow keys or WASD move; E interacts. People and buildings can also be clicked."></canvas><div class="mobile-map-label hotel"><b>HOTEL SOLE NASCENTE</b><span>Pricing · demand · elasticity</span></div><div class="mobile-map-label bakery"><b>MARTA’S BAKERY</b><span>Production theory</span></div><div class="mobile-map-label winery"><b>SOLE VINEYARD</b><span>Wine purchasing</span></div>${state.overlay === 'street' ? streetOverlay() : state.overlay === 'dialogue' ? dialogueOverlay() : state.overlay === 'workspace' ? workspaceOverlay() : ''}</div>
      <div class="game-status"><div class="game-objective"><span>Current objective</span><strong>${esc(task.label)}</strong></div><button class="game-go" data-visit="${task.actor}">Enter ${task.actor === 'hotel' ? 'hotel' : task.actor === 'bakery' ? 'bakery' : 'vineyard'} <span aria-hidden="true">→</span></button><div class="game-steps" role="img" aria-label="${finished} of ${milestones.length} milestones complete">${milestones.map(done => `<i class="${done ? 'done' : ''}"></i>`).join('')}</div></div>
      <div class="town-controls"><div class="touch-controls" aria-label="Movement controls"><button data-move="arrowleft" aria-label="Move left" title="Move left">◀</button><button data-move="arrowup" aria-label="Move up" title="Move up">▲</button><button data-move="arrowdown" aria-label="Move down" title="Move down">▼</button><button data-move="arrowright" aria-label="Move right" title="Move right">▶</button><button data-action="talk" aria-label="Talk nearby" title="Talk nearby">✦</button></div></div>
    </section>
    <nav class="district-links" aria-label="Places to visit">${[['hotel', 'Hotel Sole Nascente', 'Lucia, Marco, Elena · Demand, MR, elasticity'], ['bakery', 'Marta’s Bakery', 'Marta, Paolo · Production and marginal product'], ['winery', 'Sole Vineyard', 'Sofia, Giulia · Wine supply and purchasing']].map(([id, name, topic]) => `<button class="district-link" data-visit="${id}"><span class="district-symbol ${id}" aria-hidden="true"></span><span><strong>${name}</strong><small>${topic}</small></span><span aria-hidden="true">→</span></button>`).join('')}</nav>
    <nav class="street-links" aria-label="Optional street exercises"><span>Street practice · Utility maximization</span>${STREET_PEOPLE.map(person => `<button data-street="${person.id}"><b>${esc(person.name)}</b><small>${esc(person.role)} · ${state.street[person.id]?.solved ? 'Solved' : 'Quick choice'}</small><span aria-hidden="true">→</span></button>`).join('')}</nav>
    <details class="hotel-ledger"><summary>Case and extensions <span>${state.log.length} notes saved</span></summary><div class="ledger-content"><div><div class="metric-row"><span>Original hotel</span><strong>78 rooms</strong></div><div class="metric-row"><span>Hotel case</span><strong>${state.caseHotel.interpretation ? 'Advice saved' : 'In progress'}</strong></div><div class="metric-row"><span>Bakery extension</span><strong>${breakfast ? `${breakfast.served} / 60 served` : 'To arrange'}</strong></div></div><div><p>The attached hotel case uses DKK and customer-group room-nights. Bakery and winery use separate illustrative euro data; their guest counts do not come from the original case.</p></div></div></details>`;
}
function roomView(actor) {
  const staff = ROOM_STAFF[actor], guide = roomGuide(actor);
  const task = nextTask();
  const townNext = task.actor !== actor;
  const steps = actor === 'hotel'
    ? [has('hotel', ['price', 'bookings']), has('hotel', ['other', 'comparable']), !!state.caseHotel.mr, !!state.caseHotel.elasticity, !!state.caseHotel.interpretation]
    : actor === 'bakery'
      ? [has('bakery', ['order', 'cost']), has('bakery', ['one', 'two', 'three']), state.breakfast.runs.some(run => run.verified), !!state.breakfast.decision, !!state.breakfast.decision?.reflection]
      : [has('winery', ['options', 'taste']), has('winery', ['stock', 'forecast']), !!state.winery.choice && !state.winery.needsReview, !!state.winery.reflection];
  const finished = steps.filter(Boolean).length;
  const objective = guide ? `Talk to ${staff[guide].name}` : townNext ? task.label : actor === 'hotel' ? state.caseHotel.mr ? 'Compare guest-group elasticities' : 'Work out TR and MR' : 'Open the calculation workspace';
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
  const turns = state.mode === 'free' ? state.log.filter(row => row.kind === 'question' && row.data?.mode === 'free' && row.data.speaker === speaker.name).slice(0, 4) : [];
  return `<div class="scene-shade"></div><section class="scene-dialogue business-${id}" role="dialog" aria-modal="true" aria-label="Conversation with ${esc(speaker.name)}">
    <div class="scene-dialogue-head"><span>${esc(speaker.name)} · ${esc(speaker.role)}</span><button type="button" data-action="close-overlay" aria-label="Close conversation" title="Close conversation">×</button></div>
    <div class="scene-interior ${id}" aria-hidden="true"><i></i><b></b><em></em></div>
    ${turns.length ? `<div class="student-turn"><b>You asked:</b> ${esc(turns[0].detail)}</div>` : ''}<div class="scene-speech"><div class="scene-avatar ${id}" aria-hidden="true"><span></span><i></i></div><p>${esc(current?.answer || (state.mode === 'free' ? `Hi, I'm ${speaker.name}, the ${speaker.role.toLowerCase()}. What can I help you with?` : speaker.introduction))}</p></div>
    ${turns.length > 1 ? `<details class="conversation-history"><summary>Earlier in this conversation</summary>${turns.slice(1).reverse().map(row => `<p><b>You:</b> ${esc(row.detail)}<br><b>${esc(speaker.name)}:</b> ${esc(row.data.answer)}</p>`).join('')}</details>` : ''}
    ${state.mode === 'free' ? `<form class="free-question" data-form="free-question"><label for="free-question-input">Your question for ${esc(speaker.name)}</label><div><input id="free-question-input" name="question" maxlength="400" autocomplete="off" required placeholder="Type your own question…"><button type="submit">Ask</button></div><small>Ask for facts; you work out the calculation and decision. Responses use this case’s approved facts.</small></form>` : `<div class="scene-questions"><span class="scene-caption">Ask ${esc(speaker.name)}</span>${suggestions.map((key, i) => { const item = questions.find(row => row[0] === key); return `<button type="button" data-question="${key}" class="scene-question"><b>${i + 1}</b><span>${esc(item[1])}</span></button>`; }).join('')}
    ${questions.length > suggestions.length ? `<details><summary>More questions</summary><div class="scene-more">${questions.filter(row => !suggestions.includes(row[0])).map(row => `<button type="button" data-question="${row[0]}">${asked(id, row[0]) ? '✓ ' : ''}${esc(row[1])}</button>`).join('')}</div></details>` : ''}</div>`}
    <div class="scene-dialogue-foot"><button type="button" class="scene-primary" data-action="workspace">Open ${id === 'hotel' ? 'hotel case' : id === 'bakery' ? 'production' : 'purchasing'} workspace →</button><button type="button" data-view="notebook" class="scene-secondary">Notebook</button></div>
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
    return `<p><code>TR(Q) = P(Q) × Q</code><br><code>MR(Q) = dTR/dQ</code>. Use one customer group's inverse demand at a time.</p><p><code>Q = (P − a) / b</code> for <code>P(Q) = a + bQ</code>.</p><p><code>Price elasticity = (1 / b) × (P / Q)</code>. At ${dkk(1400)}, calculate Q for each group first. Compare absolute elasticities.</p><p>Table 3 Q is group room-nights over a period. The hotel's 78 rooms are a nightly capacity; do not equate these without a common time period.</p>`;
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
  const task = id === 'hotel' ? caseHotelTask(state.caseHotel, state.interviews.hotel, esc) : id === 'bakery' ? bakeryTask() : wineryTask();
  const latest = state.log.filter(entry => entry.actor === id && entry.kind === 'question').slice(0, 3);
  return `<div class="scene-shade"></div><section class="mini-workspace business-${id}" role="dialog" aria-modal="true" aria-label="${id === 'hotel' ? 'Hotel' : esc(actor.name)} calculation workspace">
    <div class="mini-head"><div><small>${esc(contact.role)} · ${id === 'hotel' ? 'Original case' : 'Game extension'}</small><strong>${id === 'hotel' ? 'Hotel case exercises' : id === 'bakery' ? 'Breakfast production' : 'Wine purchasing'}</strong></div><button type="button" data-action="close-overlay" aria-label="Close workspace" title="Close workspace">×</button></div>
    <div class="mini-columns"><aside class="mini-tools"><div class="mini-tool-links"><button type="button" class="scene-secondary" data-action="dialogue">← Talk to ${esc(contact.name)}</button><button type="button" class="scene-secondary" data-view="notebook">Notebook</button></div><details class="mini-evidence"><summary>Field notes <small>${latest.length} recent</small></summary><div>${latest.length ? latest.map(entry => `<div class="mini-note"><b>${esc(entry.detail)}</b><p>${esc(entry.data?.answer || '')}</p></div>`).join('') : '<p>No evidence yet. Talk to the owner to begin.</p>'}</div></details><div class="formula-tool"><button type="button" data-action="formula-help" aria-expanded="false" aria-controls="formula-help-${id}">Formula help <span aria-hidden="true">?</span></button><div id="formula-help-${id}" class="formula-content" hidden>${formulaHelp(id)}</div></div>${scratchpad(id)}</aside><div class="mini-task">${task}${id === 'hotel' ? `<div class="button-row"><button class="button secondary" data-action="hint">Need a hint?</button></div>${hintText('hotel')}` : ''}</div></div>
  </section>`;
}
function reflectionForm(actor, value = '') {
  const prompt = actor === 'hotel' ? 'After seeing demand, MR, room revenue, and the capacity limit, would you keep or revise your rate? Why?'
    : actor === 'bakery' ? 'After comparing the three plans, would you keep or revise your breakfast order? Why?'
    : 'After seeing the quantities and purchase cost, would you keep or revise your wine order? Why?';
  return `<form class="post-result-reflection" data-form="${actor}-reflect"><label class="field">${prompt}<textarea name="reflection" minlength="25" required placeholder="Use the result to explain your next move...">${esc(value)}</textarea></label><button class="button secondary">${value ? 'Update reflection' : 'Save reflection'}</button>${value ? '<span class="reflection-saved">Reflection saved in the notebook</span>' : ''}</form>`;
}
function bakeryTask() {
  const b = state.breakfast, ready = has('bakery', ['order', 'one', 'two', 'three', 'cost']);
  const tested = new Set(b.runs.filter(run => run.verified !== false).map(run => run.bakers));
  const nextBakers = SCENARIO.breakfast.plans.find(plan => !tested.has(plan.bakers))?.bakers ?? 1;
  let body = `<span class="stage-badge">${!ready ? '01 · Investigate production' : tested.size < 3 ? '02 · Calculate and test' : '03 · Compare and decide'}</span>`;
  if (!ready) {
    body += `<h2>Find the production facts</h2><p>Ask Marta about the hotel order and costs. Ask Paolo how many rolls one, two, and three bakers produce using the same oven.</p><div class="step-list">${[['order','Hotel order'],['one','One baker'],['two','Two bakers'],['three','Three bakers'],['cost','Labour and ingredient cost']].map(([id,label]) => `<div class="step ${asked('bakery',id)?'done':''}"><b>${asked('bakery',id)?'✓':'•'}</b><span>${label}</span></div>`).join('')}</div>`;
  } else {
    body += `<h2>${tested.size < 3 ? 'Calculate a production plan' : 'Choose a plan you can defend'}</h2><p>Use the figures you gathered to calculate extra output, order cost, and guests served. Test all three plans before choosing.</p><div class="scroll-table"><table class="observation-table"><tr><th>Bakers</th><th>Rolls from one oven</th></tr>${SCENARIO.breakfast.plans.map(plan => `<tr><td>${plan.bakers}</td><td>${plan.rolls}</td></tr>`).join('')}</table></div><p class="muted">Hotel order: ${SCENARIO.breakfast.guests} rolls · Labour: €20 per baker · Ingredients: €0.60 per roll produced</p><div class="step-list">${SCENARIO.breakfast.plans.map(plan => `<div class="step ${tested.has(plan.bakers) ? 'done' : ''}"><b>${tested.has(plan.bakers) ? '✓' : '•'}</b><span>${plan.bakers} baker${plan.bakers > 1 ? 's' : ''} ${tested.has(plan.bakers) ? 'tested' : 'to test'}</span></div>`).join('')}</div>
    <form data-form="bakery-test"><label class="field">Bakers scheduled<select name="bakers">${SCENARIO.breakfast.plans.map(p => `<option value="${p.bakers}" ${nextBakers === p.bakers ? 'selected' : ''}>${p.bakers} baker${p.bakers > 1 ? 's' : ''}</option>`).join('')}</select></label><div class="field-grid"><label class="field">Extra rolls from this baker<input name="predictedExtra" type="number" min="0" step="any" required placeholder="Difference from prior plan"></label><label class="field">Predicted order cost (€)<input name="predictedCost" type="number" min="0" step="any" required placeholder="Labour + ingredients"></label><label class="field">Predicted guests served<input name="prediction" type="number" min="0" max="60" step="any" required placeholder="At most 60"></label></div><button class="button">Test this production plan</button></form>`;
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
  const elasticityPart = actor === 'hotel' && !!state.caseHotel.mr;
  const level = state.hints[elasticityPart ? 'hotelElasticity' : actor] || 0;
  if (!level) return '';
  const hints = elasticityPart ? ['Use each group’s own inverse-demand curve.', 'At DKK 1,400, find Q for each group before calculating elasticity.', 'A smaller absolute elasticity means a smaller percentage demand response.']
    : actor === 'hotel' ? ['For group A, multiply P(Q) by Q to find TR(Q).', 'Differentiate TR(Q) term by term for MR(Q).', 'The Q coefficient in MR is twice the Q² coefficient in TR.']
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
  <section class="panel full"><h2>Current results</h2><div class="field-grid"><div><div class="metric-row"><span>Hotel TR and MR</span><strong>${state.caseHotel.mr ? 'Completed' : 'To explore'}</strong></div><div class="metric-row"><span>Hotel elasticity</span><strong>${state.caseHotel.elasticity ? 'Three groups compared' : 'To explore'}</strong></div><div class="metric-row"><span>Hotel advice</span><strong>${state.caseHotel.interpretation ? 'Saved' : 'To write'}</strong></div></div><div><div class="metric-row"><span>Bakery extension</span><strong>${state.breakfast.decision ? `${state.breakfast.decision.bakers} bakers` : 'Not decided'}</strong></div><div class="metric-row"><span>Wine extension</span><strong>${state.winery.choice ? (state.winery.choice === 'house' ? 'House' : 'Mixed') : 'Not decided'}</strong></div></div></div><p class="muted" style="font-size:12px">The attached hotel case uses DKK. Bakery and winery are separate illustrative euro exercises. Export your notebook before clearing browser storage.</p></section></div>`;
}
function render() {
  if (town) { town.destroy(); town = null; }
  if (interior) { interior.destroy(); interior = null; }
  document.querySelectorAll('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === state.view));
  document.querySelector('#notebook-count').textContent = state.log.length;
  main.innerHTML = !state.mode ? modeView() : state.view === 'town' ? townView() : ROOM_IDS.includes(state.view) ? roomView(state.view) : notebookView();
  if (!state.mode) return;
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
      const selector = state.overlay === 'dialogue' ? state.mode === 'free' ? '#free-question-input' : '.scene-question' : state.overlay === 'street' ? '.street-options button' : '.mini-task input, .mini-task select, .mini-task textarea, .mini-tool-links button';
      main.querySelector(selector)?.focus({ preventScroll: true });
    });
  }
}
function modeView() {
  return `<section class="mode-picker" aria-labelledby="mode-title"><p class="eyebrow">Hotel Sole Nascente · Start here</p><h1 id="mode-title">Choose how to talk with the people in town</h1><p>Both modes use the same hotel, bakery, winery, notebook and calculations.</p><div class="mode-cards"><button type="button" data-mode="guided"><strong>Guided</strong><span>Choose prepared questions when you talk to someone.</span></button><button type="button" data-mode="free"><strong>Ask your own questions</strong><span>Write your questions. People share facts; you make the calculations and decisions.</span></button></div><small>You can change modes later. Your progress stays on this device.</small></section>`;
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
  if (form.dataset.form.startsWith('case-hotel-')) {
    const result = evaluateCaseHotel(form.dataset.form, values, state.caseHotel);
    if (!result) return;
    state.caseHotel.feedback = result.feedback;
    record('case_work', 'hotel', result.feedback, { form: form.dataset.form, values });
    render(); return;
  }
  const reflectionActor = form.dataset.form.match(/^(bakery|winery)-reflect$/)?.[1];
  if (reflectionActor) {
    const reflection = String(values.reflection || '').trim();
    if (reflection.length < 25) return feedback(reflectionActor, 'Use the result to explain what you would keep or revise.');
    const decision = reflectionActor === 'bakery' ? state.breakfast.decision : state.winery;
    if (!decision) return;
    decision.reflection = reflection;
    record('reflection', reflectionActor, reflection);
    return feedback(reflectionActor, 'Saved: your post-result reflection is in the notebook.');
  }
  switch (form.dataset.form) {
    case 'bakery-test': {
      const bakers = Number(values.bakers), prediction = Number(values.prediction);
      const plan = SCENARIO.breakfast.plans.find(p => p.bakers === bakers);
      if (!plan) return;
      const previousRolls = SCENARIO.breakfast.plans.find(p => p.bakers === bakers - 1)?.rolls ?? 0;
      const extraOutput = plan.rolls - previousRolls;
      const predictions = { extraOutput: Number(values.predictedExtra), orderCost: Number(values.predictedCost), served: prediction };
      if (Object.values(predictions).some(value => !Number.isFinite(value))) return feedback('bakery', 'Enter a valid number for each calculation.');
      const outcome = bakeryOutcome(plan);
      const errors = [['extra output', predictions.extraOutput, extraOutput], ['order cost', predictions.orderCost, outcome.orderCost], ['guests served', predictions.served, outcome.served]].filter(([, predicted, actual]) => Math.abs(predicted - actual) > .1).map(([label]) => label);
      const result = { ...outcome, extraOutput, predictions, prediction, verified: errors.length === 0, at: new Date().toISOString() };
      state.breakfast.runs.push(result);
      record('prediction_test', 'bakery', `${bakers} bakers: predicted ${fmt(predictions.extraOutput)} extra rolls, ${eur(predictions.orderCost)} cost, ${fmt(prediction)} served; model ${result.rolls} rolls, ${extraOutput} extra, ${eur(result.orderCost)} cost, ${result.served} served.`, result);
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
  if (e.target.dataset.form === 'free-question') { const question = new FormData(e.target).get('question'); e.target.querySelector('button[type="submit"]').disabled = true; askFree(question); return; }
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
  const mode = e.target.closest('[data-mode]'); if (mode) { state.mode = mode.dataset.mode; record('mode', 'game', `Selected ${state.mode} mode`); render(); return; }
  const view = e.target.closest('[data-view]'); if (view) { go(view.dataset.view); return; }
  const place = e.target.closest('[data-visit]'); if (place) { visit(place.dataset.visit); return; }
  const street = e.target.closest('[data-street]'); if (street) { openStreet(street.dataset.street); return; }
  const streetChoiceButton = e.target.closest('[data-street-choice]'); if (streetChoiceButton) { chooseStreet(streetChoiceButton.dataset.streetChoice); return; }
  const person = e.target.closest('[data-person]'); if (person) { talkRoomPerson(person.dataset.person); return; }
  const questionButton = e.target.closest('[data-question]'); if (questionButton) { question(state.actor, questionButton.dataset.question); return; }
  const color = e.target.closest('[data-color]'); if (color) { state.player.color = color.dataset.color; save(); render(); return; }
  const action = e.target.closest('[data-action]'); if (!action) return;
  if (action.dataset.action === 'change-mode') { state.mode = null; save(); render(); return; }
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
    const actor = state.actor, elasticityPart = actor === 'hotel' && !!state.caseHotel.mr;
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
  if (state.mode !== 'guided' || state.overlay !== 'dialogue' || !['1', '2', '3'].includes(e.key)) return;
  const choice = suggestedQuestions(state.actor)[Number(e.key) - 1];
  if (choice) question(state.actor, choice);
});
document.querySelector('#restart').addEventListener('click', () => { if (!confirm('Restart this simulation? This clears all saved interviews, tests, and decisions on this device.')) return; localStorage.removeItem(KEY); state = blank(); render(); toast('New simulation started'); });
render();
