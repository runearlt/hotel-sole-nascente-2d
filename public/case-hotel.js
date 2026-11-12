// Student exercise adapted from 1. EN - Case.doc, sections 1–4.1.4.
// Tentative solutions in the source document are never sent to students.
export const HOTEL_CASE = Object.freeze({
  rooms: 78,
  price: 1400,
  groups: [
    { id: 'A', name: 'Individual travelers without children', intercept: 2400, slope: -0.05, income: 1.5, crossA: 1.2, crossB: -1.2, share: 50 },
    { id: 'B', name: 'Group travelers', intercept: 2100, slope: -0.07, income: 2.8, crossA: 1.5, crossB: -3.3, share: 30 },
    { id: 'C', name: 'Families with children', intercept: 1800, slope: -0.06, income: 2.4, crossA: 2.8, crossB: -2.4, share: 10 }
  ]
});

export const dkk = value => new Intl.NumberFormat('en-DK', { style: 'currency', currency: 'DKK', maximumFractionDigits: 2 }).format(value);
export const caseQuantity = group => (HOTEL_CASE.price - group.intercept) / group.slope;
export const caseElasticity = group => (1 / group.slope) * HOTEL_CASE.price / caseQuantity(group);
const close = (value, expected, tolerance = 0.0001) => value != null && String(value).trim() !== '' && Number.isFinite(Number(value)) && Math.abs(Number(value) - expected) <= tolerance;

export function blankCaseHotel() { return { mr: null, elasticity: null, interpretation: null, demandModel: null, changes: null, feedback: '' }; }

export const caseHotelComplete = progress => !!(progress.mr && progress.elasticity && progress.interpretation && progress.demandModel && progress.changes);

export const caseHotelStage = progress => progress.editing || ['mr', 'elasticity', 'interpretation', 'demandModel', 'changes'].find(key => !progress[key]) || 'complete';

export function caseHotelTask(progress, interviewed, esc) {
  const stage = caseHotelStage(progress);
  const ready = ['price', 'bookings', 'other', 'comparable', 'full', 'costs'].every(id => interviewed.includes(id));
  let body = `<div class="hotel-part-track">${[['mr','TR/MR support'],['elasticity','4.1.1 · Price elasticity'],['interpretation','4.1.2 · Interpret elasticities'],['demandModel','4.1.3 · Demand model'],['changes','4.1.4 · Case events']].map(([key,label], index, steps) => `<span class="${progress[key] ? 'done' : index === 0 || progress[steps[index - 1][0]] ? 'active' : ''}">${label}</span>`).join('')}</div><p class="muted">Original Hotel Sole Nascente case · 78 rooms · prices in DKK · Q means customer-group room-nights, not rooms on one night. TR/MR is a supporting exercise; bakery and winery are optional extensions.</p>`;
  if (!ready) {
    return body + `<h2>Gather the original case facts</h2><p>Ask Lucia about the hotel, Marco about the customer groups and their demand curves, and Elena about capacity and costs.</p><div class="step-list">${[['price','Lucia: hotel and units'],['bookings','Lucia: occupancy and season'],['other','Marco: group demand curves'],['comparable','Marco: group definitions'],['full','Elena: room capacity'],['costs','Elena: available cost information']].map(([id, label]) => `<div class="step ${interviewed.includes(id) ? 'done' : ''}"><b>${interviewed.includes(id) ? '✓' : '•'}</b><span>${label}</span></div>`).join('')}</div>${progress.feedback ? `<p class="notice">${esc(progress.feedback)}</p>` : ''}`;
  }
  body += `<div class="button-row" aria-label="Review saved hotel work">${[['mr','TR/MR'],['elasticity','4.1.1'],['interpretation','4.1.2'],['demandModel','4.1.3'],['changes','4.1.4']].filter(([key]) => progress[key]).map(([key,label]) => `<button type="button" class="button secondary" data-case-step="${key}">Review ${label}</button>`).join('')}${progress.editing ? '<button type="button" class="button secondary" data-action="finish-review">Back to current step</button>' : ''}</div>`;
  if (stage === 'mr') {
    return body + `<h2>Find TR and MR for group A</h2><p>Marco's estimated inverse demand for group A is <code>P(Q) = 2400 − 0.05Q</code>. Q is room-nights demanded by that group over the case's period. Multiply by Q for total revenue, then differentiate for marginal revenue.</p><div class="notice"><code>TR(Q) = 2400Q + dQ²</code><br><code>MR(Q) = 2400 + cQ</code></div><form data-form="case-hotel-mr"><div class="field-grid"><label class="field">Coefficient d in TR<input name="tr" type="number" step="any" required></label><label class="field">Coefficient c in MR<input name="mr" type="number" step="any" required></label></div><button class="button">Check my functions</button></form>${progress.feedback ? `<p class="notice">${esc(progress.feedback)}</p>` : ''}`;
  }
  if (stage === 'elasticity') {
    return body + `<h2>4.1.1 · Compare price sensitivity</h2><p>At ${dkk(HOTEL_CASE.price)}, use each group's inverse demand to find Q, then calculate <code>ε = (dQ/dP) × (P/Q)</code>. Report signed values rounded to two decimal places. Compare absolute values when judging sensitivity.</p><div class="scroll-table"><table class="observation-table"><tr><th>Group</th><th>Inverse demand</th><th>High-season share</th></tr>${HOTEL_CASE.groups.map(g => `<tr><td>${g.id} · ${g.name}</td><td>P = ${g.intercept} ${g.slope}Q</td><td>${g.share}%</td></tr>`).join('')}</table></div><p class="muted">The remaining 10% of stays are a mixed group. Demand estimates are not capped at 78 without a matching time period.</p><form data-form="case-hotel-elasticity"><div class="field-grid">${HOTEL_CASE.groups.map(g => `<label class="field">Group ${g.id} elasticity<input name="${g.id}" type="number" step="any" required placeholder="Include the sign"></label>`).join('')}</div><label class="field">Least price-sensitive group<select name="least" required><option value="">Choose a group</option>${HOTEL_CASE.groups.map(g => `<option value="${g.id}">${g.id}</option>`).join('')}</select></label><label class="field">Explain price elasticity, justify your comparison at DKK 1,400, and state your assumptions.<textarea name="explanation" minlength="60" required></textarea></label><p class="muted">Numbers are checked automatically; your written reasoning is saved for instructor review.</p><button class="button">Compare groups</button></form>${progress.feedback ? `<p class="notice" role="status">${esc(progress.feedback)}</p>` : ''}`;
  }
  if (stage === 'interpretation') {
    return body + `<h2>4.1.2 · Interpret income and cross-price elasticities</h2><p>The case gives income elasticities (A: 1.5, B: 2.8, C: 2.4). Cross-price elasticities for Offer A are positive (1.2, 1.5, 2.8), and for Offer B negative (−1.2, −3.3, −2.4).</p><form data-form="case-hotel-advice"><label class="field">Offer A is likely<select name="offerA" required><option value="">Choose</option><option value="substitute">a substitute</option><option value="complement">a complement</option></select></label><label class="field">Offer B is likely<select name="offerB" required><option value="">Choose</option><option value="substitute">a substitute</option><option value="complement">a complement</option></select></label><label class="field">Define income and cross-price elasticity. Interpret their signs and magnitudes for the three groups, suggest possible examples of Offers A and B, and explain what this means for pricing and uncertainty.<textarea name="reflection" minlength="80" required></textarea></label><p class="muted">Offer classifications are checked automatically. Your written explanation is saved for instructor review.</p><button class="button">Save advice</button></form>${progress.feedback ? `<p class="notice" role="status">${esc(progress.feedback)}</p>` : ''}`;
  }
  if (stage === 'demandModel') {
    return body + `<h2>4.1.3 · Build a multiple demand model</h2><p>Define a model for room-nights demanded using the hotel's price, income, substitute prices and complement prices. Choose the expected coefficient signs, holding other factors fixed.</p><form data-form="case-hotel-model"><div class="field-grid">${[['own','Hotel room price'],['income','Guest income'],['substitute','Substitute prices (Ps)'],['complement','Complement prices (Pk)']].map(([name,label]) => `<label class="field">${label}<select name="${name}" required><option value="">Choose sign</option><option value="positive">Positive</option><option value="negative">Negative</option></select></label>`).join('')}</div><label class="field">Write your demand function, define the variables and units, and explain the signs and coefficient magnitudes. What additional data would estimation require?<textarea name="model" minlength="80" required></textarea></label><button class="button">Save demand model</button></form>${progress.feedback ? `<p class="notice" role="status">${esc(progress.feedback)}</p>` : ''}`;
  }
  if (stage === 'changes') {
    return body + `<h2>4.1.4 · What could change the coefficients?</h2><p>The case describes restrictions on private rentals, extreme weather, local opposition to tourism and changing Northern European incomes. These are statements in the case, not verified current events.</p><form data-form="case-hotel-changes"><label class="field">Choose case evidence<select name="event" required><option value="">Choose an event</option><option value="rentals">Private rental restrictions</option><option value="climate">Extreme weather</option><option value="tourism">Local opposition to tourism</option><option value="income">Northern European incomes</option></select></label><label class="field">Explain possible effects on the Ps and Pk coefficients. Distinguish a change in a price or baseline demand from a change in sensitivity to that price. State your assumptions and uncertainty.<textarea name="reflection" minlength="80" required></textarea></label><button class="button">Save case analysis</button></form>${progress.feedback ? `<p class="notice" role="status">${esc(progress.feedback)}</p>` : ''}`;
  }
  return body + `<h2>Hotel case completed</h2><p>You completed questions 4.1.1–4.1.4 and the supporting TR/MR exercise. Review your reasoning in the notebook and export it for discussion. Written explanations are saved for instructor review; saving them does not certify their economic reasoning.</p><div class="notice">${esc(progress.interpretation.reflection)}</div><p class="muted">The case does not provide a hotel cost function or a common time unit linking Table 3 group demand to one night's 78-room capacity. These calculations do not establish a profit-maximizing nightly room rate.</p>`;
}

export function evaluateCaseHotel(formName, values, progress) {
  const prerequisite = { 'case-hotel-elasticity': 'mr', 'case-hotel-advice': 'elasticity', 'case-hotel-model': 'interpretation', 'case-hotel-changes': 'demandModel' }[formName];
  if (prerequisite && !progress[prerequisite]) return { feedback: 'Complete the previous hotel step first.' };
  if (formName === 'case-hotel-mr') {
    if (!close(values.tr, -0.05)) return { feedback: 'Multiply every term in P(Q) by Q. The Q² coefficient keeps its negative sign.' };
    if (!close(values.mr, -0.1)) return { feedback: 'Differentiate TR(Q). The Q coefficient in MR is twice the Q² coefficient in TR.' };
    progress.mr = { tr: Number(values.tr), mr: Number(values.mr) };
    return { accepted: true, feedback: 'Your TR and MR coefficients are correct. Now compare the three customer groups.' };
  }
  if (formName === 'case-hotel-elasticity') {
    for (const group of HOTEL_CASE.groups) if (!close(values[group.id], caseElasticity(group), 0.0051)) return { feedback: `Recheck group ${group.id}. First find Q at DKK 1,400, then use (1 / inverse-demand slope) × (1400 / Q). Round to two decimal places.` };
    if (values.least !== 'A') return { feedback: 'Compare absolute values. The elasticity closest to zero is least price-sensitive.' };
    const explanation = String(values.explanation || '').trim();
    if (explanation.length < 60) return { feedback: 'Explain what price elasticity measures, justify your group comparison and state your assumptions.' };
    progress.elasticity = { values: Object.fromEntries(HOTEL_CASE.groups.map(group => [group.id, Number(values[group.id])])), least: values.least, explanation };
    return { accepted: true, feedback: 'Good. Now interpret income and cross-price elasticities for the director.' };
  }
  if (formName === 'case-hotel-advice') {
    if (values.offerA !== 'substitute' || values.offerB !== 'complement') return { feedback: 'A positive cross-price elasticity suggests substitutes; a negative one suggests complements.' };
    const reflection = String(values.reflection || '').trim();
    if (reflection.length < 80) return { feedback: 'Explain income and cross-price elasticity, interpret the figures, and suggest examples of both offers.' };
    progress.interpretation = { offerA: values.offerA, offerB: values.offerB, reflection };
    return { accepted: true, feedback: 'Your case advice is saved.' };
  }
  if (formName === 'case-hotel-model') {
    if (values.own !== 'negative' || values.income !== 'positive' || values.substitute !== 'positive' || values.complement !== 'negative') return { feedback: 'Reconsider each sign while holding other factors fixed. Use the income and cross-price evidence in Table 3.' };
    const model = String(values.model || '').trim();
    if (model.length < 80) return { feedback: 'Define your function and units, explain the signs, and discuss what determines coefficient magnitudes.' };
    progress.demandModel = { own: values.own, income: values.income, substitute: values.substitute, complement: values.complement, model };
    return { accepted: true, feedback: 'Saved: signs checked; written model saved for instructor review. Now consider case events.' };
  }
  if (formName === 'case-hotel-changes') {
    const reflection = String(values.reflection || '').trim();
    if (!['rentals', 'climate', 'tourism', 'income'].includes(values.event) || reflection.length < 80) return { feedback: 'Choose case evidence and explain its possible effects on both Ps and Pk sensitivity, including assumptions.' };
    progress.changes = { event: values.event, reflection };
    return { accepted: true, feedback: 'Saved: case analysis ready for instructor review. You can export your notebook.' };
  }
  return null;
}
