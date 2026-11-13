import { HOTEL_DEMO } from './hotel-demo.js';
import { hotelAtPrice, eur } from './economics.js';
import { closeNumber } from './input-checks.js';

export const HOTEL_CASE = HOTEL_DEMO;
export const caseQuantity = (price = HOTEL_DEMO.referencePrice) => hotelAtPrice(price).requested;
export const caseElasticity = (price = HOTEL_DEMO.referencePrice) => hotelAtPrice(price).elasticity;
const close = closeNumber;
const stages = [['demand', 'Derive demand'], ['mr', 'TR and MR'], ['elasticity', 'Price elasticity'], ['interpretation', 'Test a room rate']];

export function blankCaseHotel() { return { demand: null, mr: null, elasticity: null, interpretation: null, feedback: '' }; }
export const caseHotelComplete = progress => !!(progress.demand && progress.mr && progress.elasticity && progress.interpretation);
export const caseHotelStage = progress => progress.editing || stages.find(([key]) => !progress[key])?.[0] || 'complete';

export function caseHotelTask(progress, interviewed, esc) {
  const stage = caseHotelStage(progress);
  let body = `<div class="hotel-part-track">${stages.map(([key, label]) => `<span class="${progress[key] ? 'done' : key === stage ? 'active' : ''}">${label}</span>`).join('')}</div><p class="muted">Main hotel case · Prices are in EUR per room-night. Q is rooms requested for one night; sales cannot exceed 80. Bakery and wine are separate optional exercises.</p>`;
  const evidence = [['price', 'Lucia: reference price'], ['bookings', 'Lucia: reference bookings'], ['other', 'Marco: comparison observation'], ['comparable', 'Marco: comparable conditions'], ['full', 'Elena: capacity'], ['costs', 'Elena: missing cost information']];
  if (!evidence.every(([id]) => interviewed.includes(id))) return body + `<h2>Gather the hotel information</h2><p>Interview Lucia, Marco and Elena before calculating. Ask for numerical observations and assumptions, rather than worked results.</p><div class="step-list">${evidence.map(([id, label]) => `<div class="step ${interviewed.includes(id) ? 'done' : ''}"><b>${interviewed.includes(id) ? '✓' : '•'}</b><span>${label}</span></div>`).join('')}</div>`;
  body += `<div class="button-row" aria-label="Review saved hotel work">${stages.filter(([key]) => progress[key]).map(([key, label]) => `<button type="button" class="button secondary" data-case-step="${key}">Review ${label}</button>`).join('')}${progress.editing ? '<button type="button" class="button secondary" data-action="finish-review">Back to current step</button>' : ''}</div>`;
  const feedback = progress.feedback ? `<p class="notice" role="status">${esc(progress.feedback)}</p>` : '';
  if (stage === 'demand') return body + `<h2>Derive the demand function</h2><p>Use the two observations you collected from Lucia and Marco. Assume a linear relationship under the stated comparable conditions. Write inverse demand as <code>P(Q) = a + bQ</code>, with P in EUR per room-night and Q in rooms requested for one night. Calculate a and b yourself; enter decimals to four places where needed.</p><form data-form="case-hotel-demand"><div class="field-grid"><label class="field">Intercept a<input name="intercept" type="number" step="any" required></label><label class="field">Slope b<input name="slope" type="number" step="any" required></label></div><button class="button">Check my demand function</button></form>${feedback}`;
  if (stage === 'mr' && progress.demand) return body + `<h2>Build TR and MR</h2><p>Your checked inverse-demand function: <code>P(Q) = ${esc(progress.demand.intercept)} + (${esc(progress.demand.slope)})Q</code>.</p><p>Use <code>TR(Q) = aQ + dQ²</code> and <code>MR(Q) = a + cQ</code>, where a is your checked intercept. These describe uncapped demand revenue, not profit. Calculate the coefficients yourself; enter decimals to four places.</p><form data-form="case-hotel-mr"><div class="field-grid"><label class="field">Coefficient d in TR<input name="tr" type="number" step="any" required></label><label class="field">Coefficient c in MR<input name="mr" type="number" step="any" required></label></div><button class="button">Check my functions</button></form>${feedback}`;
  if (stage === 'elasticity') return body + `<h2>Compare price sensitivity</h2><p>Calculate point price elasticity of requested rooms at €170 using the inverse-demand estimate. Report a signed value to two decimal places. Distinguish the inverse slope dP/dQ from dQ/dP.</p><form data-form="case-hotel-elasticity"><label class="field">Price elasticity at €170<input name="value" type="number" step="any" required></label><label class="field">Explain the percentage relationship, its implications for a small price change, and your assumptions.<textarea name="explanation" minlength="60" required></textarea></label><p class="muted">The number is checked automatically; your explanation is saved for instructor review.</p><button class="button">Check elasticity</button></form>${feedback}`;
  if (stage === 'interpretation') return body + `<h2>Test a room rate</h2><p>Choose a price from €110 to €220. Predict requested rooms, rooms sold and room revenue. Requests can be fractional in this continuous classroom model; sales are capped at 80. Keep other demand conditions fixed.</p><form data-form="case-hotel-advice"><label class="field">Chosen price (€)<input name="price" type="number" min="110" max="220" step="0.01" required></label><div class="field-grid"><label class="field">Predicted rooms requested<input name="predictedRequested" type="number" min="0" step="any" required></label><label class="field">Predicted rooms sold<input name="predictedSold" type="number" min="0" max="80" step="any" required></label><label class="field">Predicted room revenue (€)<input name="predictedRevenue" type="number" min="0" step="any" required></label></div><label class="field">Does maximum room revenue establish maximum profit?<select name="profitClaim" required><option value="">Choose</option><option value="no">No, operating costs are missing</option><option value="yes">Yes</option></select></label><label class="field">Defend your choice using demand, capacity and uncertainty. What would you keep or revise?<textarea name="reflection" minlength="80" required></textarea></label><button class="button">Test and save my rate</button></form>${feedback}`;
  const decision = progress.interpretation;
  return body + `<h2>Hotel case completed</h2><p>You derived TR/MR, calculated price elasticity and tested a room rate. Written reasoning awaits instructor review.</p><div class="notice">Your rate: ${eur(decision.price)} · ${decision.requested.toFixed(2)} rooms requested · ${decision.sold.toFixed(2)} sold · ${eur(decision.revenue)} room revenue.</div><p>${esc(decision.reflection)}</p><p class="muted">Uncapped MR is not the marginal revenue of capped sales. Operating costs are unknown, so these results do not establish maximum profit. Export your notebook and try optional extensions if you wish.</p>`;
}

export function evaluateCaseHotel(formName, values, progress) {
  if (formName === 'case-hotel-demand') {
    if (!close(values.intercept, HOTEL_DEMO.demand.intercept, 0.0001) || !close(values.slope, HOTEL_DEMO.demand.slope, 0.0001)) return { feedback: 'Your function does not match both observations. Recheck your slope, intercept and choice of axes.' };
    progress.demand = { intercept: Number(values.intercept), slope: Number(values.slope) };
    return { accepted: true, feedback: 'Your demand function matches both observations. What conditions need to stay the same for it to remain useful?' };
  }
  if (formName === 'case-hotel-mr') {
    if (!progress.demand) return { feedback: 'Collect both observations and correctly derive demand first.' };
    if (!close(values.tr, HOTEL_DEMO.demand.slope, 0.0001)) return { feedback: 'Multiply each term of P(Q) by Q. Keep the inverse-demand slope and its sign in the Q² term.' };
    if (!close(values.mr, 2 * HOTEL_DEMO.demand.slope, 0.0001)) return { feedback: 'Differentiate TR term by term. Remember the power rule for the Q² term.' };
    progress.mr = { tr: Number(values.tr), mr: Number(values.mr) };
    return { accepted: true, feedback: 'Good: your TR and MR coefficients agree with your checked demand function.' };
  }
  if (formName === 'case-hotel-elasticity') {
    if (!progress.mr) return { feedback: 'Complete the demand and revenue step first.' };
    if (!close(values.value, caseElasticity())) return { feedback: 'Use dQ/dP, not dP/dQ, in elasticity = (dQ/dP) × (P/Q). Evaluate at €170 and round to two decimal places.' };
    const explanation = String(values.explanation || '').trim();
    if (explanation.length < 60) return { feedback: 'Explain the percentage relationship, interpretation and assumptions.' };
    progress.elasticity = { value: Number(values.value), explanation };
    return { accepted: true, feedback: 'Good: elasticity checked. Now test a room rate of your own.' };
  }
  if (formName === 'case-hotel-advice') {
    if (!progress.elasticity) return { feedback: 'Complete the elasticity step first.' };
    const price = Number(values.price);
    if (!String(values.price ?? '').trim() || !Number.isFinite(price) || price < 110 || price > 220) return { feedback: 'Choose a room rate between €110 and €220.' };
    const outcome = hotelAtPrice(price);
    for (const [field, expected, label] of [['predictedRequested', outcome.requested, 'requested rooms'], ['predictedSold', outcome.sold, 'sold rooms'], ['predictedRevenue', outcome.revenue, 'room revenue']]) if (!close(values[field], expected, 0.02)) return { feedback: `Recheck ${label}: use the demand equation, apply the 80-room sales limit, then multiply sold rooms by price.` };
    if (values.profitClaim !== 'no') return { feedback: 'Room revenue excludes operating costs. Reconsider whether it can establish maximum profit.' };
    const reflection = String(values.reflection || '').trim();
    if (reflection.length < 80) return { feedback: 'Explain your price choice, capacity effects and what the missing costs leave uncertain.' };
    progress.interpretation = { ...outcome, profitClaim: values.profitClaim, reflection };
    return { accepted: true, feedback: 'Saved: your numerical predictions are checked; your explanation is ready for instructor review.' };
  }
  return null;
}
