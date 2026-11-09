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
const close = (value, expected, tolerance = 0.08) => Number.isFinite(Number(value)) && Math.abs(Number(value) - expected) <= tolerance;

export function blankCaseHotel() { return { mr: null, elasticity: null, interpretation: null, feedback: '' }; }

export function caseHotelTask(progress, interviewed, esc) {
  const a = HOTEL_CASE.groups[0];
  const ready = ['price', 'bookings', 'other', 'comparable'].every(id => interviewed.includes(id));
  let body = `<div class="hotel-part-track"><span class="${progress.mr ? 'done' : 'active'}">1 · Demand, TR and MR</span><span class="${progress.elasticity ? 'done' : progress.mr ? 'active' : ''}">2 · Elasticity</span><span class="${progress.interpretation ? 'done' : progress.elasticity ? 'active' : ''}">3 · Advise the hotel</span></div><p class="muted">Original Hotel Sole Nascente case · 78 rooms · prices in DKK · Q means customer-group room-nights, not rooms on one night. Bakery and winery are separate game extensions.</p>`;
  if (!ready) {
    return body + `<h2>Gather the original case facts</h2><p>Ask Lucia about the hotel, Marco about the customer groups and their demand curves, and Elena about capacity and costs.</p><div class="step-list">${[['price','Hotel and units'],['bookings','Occupancy and season'],['other','Group demand curves'],['comparable','Group definitions']].map(([id, label]) => `<div class="step ${interviewed.includes(id) ? 'done' : ''}"><b>${interviewed.includes(id) ? '✓' : '•'}</b><span>${label}</span></div>`).join('')}</div>${progress.feedback ? `<p class="notice">${esc(progress.feedback)}</p>` : ''}`;
  }
  if (!progress.mr) {
    return body + `<h2>Find TR and MR for group A</h2><p>Marco's estimated inverse demand for group A is <code>P(Q) = 2400 − 0.05Q</code>. Q is room-nights demanded by that group over the case's period. Multiply by Q for total revenue, then differentiate for marginal revenue.</p><div class="notice"><code>TR(Q) = 2400Q + dQ²</code><br><code>MR(Q) = 2400 + cQ</code></div><form data-form="case-hotel-mr"><div class="field-grid"><label class="field">Coefficient d in TR<input name="tr" type="number" step="any" required></label><label class="field">Coefficient c in MR<input name="mr" type="number" step="any" required></label></div><button class="button">Check my functions</button></form>${progress.feedback ? `<p class="notice">${esc(progress.feedback)}</p>` : ''}`;
  }
  if (!progress.elasticity) {
    return body + `<h2>Compare price sensitivity</h2><p>At ${dkk(HOTEL_CASE.price)}, use each group's inverse demand to find Q, then calculate <code>ε = (dQ/dP) × (P/Q)</code>. A smaller absolute elasticity means less sensitivity.</p><div class="scroll-table"><table class="observation-table"><tr><th>Group</th><th>Inverse demand</th><th>High-season share</th></tr>${HOTEL_CASE.groups.map(g => `<tr><td>${g.id}</td><td>P = ${g.intercept} ${g.slope}Q</td><td>${g.share}%</td></tr>`).join('')}</table></div><form data-form="case-hotel-elasticity"><div class="field-grid">${HOTEL_CASE.groups.map(g => `<label class="field">Group ${g.id} elasticity<input name="${g.id}" type="number" step="any" required placeholder="Include the sign"></label>`).join('')}</div><label class="field">Least price-sensitive group<select name="least" required><option value="">Choose a group</option>${HOTEL_CASE.groups.map(g => `<option value="${g.id}">${g.id}</option>`).join('')}</select></label><button class="button">Compare groups</button></form>${progress.feedback ? `<p class="notice">${esc(progress.feedback)}</p>` : ''}`;
  }
  if (!progress.interpretation) {
    return body + `<h2>Give the director your advice</h2><p>The case gives income elasticities (A: 1.5, B: 2.8, C: 2.4). Cross-price elasticities for Offer A are positive (1.2, 1.5, 2.8), and for Offer B negative (−1.2, −3.3, −2.4).</p><form data-form="case-hotel-advice"><label class="field">Offer A is likely<select name="offerA" required><option value="">Choose</option><option value="substitute">a substitute</option><option value="complement">a complement</option></select></label><label class="field">Offer B is likely<select name="offerB" required><option value="">Choose</option><option value="substitute">a substitute</option><option value="complement">a complement</option></select></label><label class="field">What would you tell the hotel about pricing, demand and uncertainty? Explain what the numbers can and cannot prove.<textarea name="reflection" minlength="35" required></textarea></label><button class="button">Save advice</button></form>${progress.feedback ? `<p class="notice">${esc(progress.feedback)}</p>` : ''}`;
  }
  return body + `<h2>Case work completed</h2><p>You derived group A's TR and MR, compared all three groups at ${dkk(HOTEL_CASE.price)}, and saved your advice. Review your reasoning in the notebook.</p><div class="notice">${esc(progress.interpretation.reflection)}</div><p class="muted">The case does not provide a hotel cost function or a common time unit linking Table 3 group demand to one night's 78-room capacity. These calculations do not establish a profit-maximizing nightly room rate.</p>`;
}

export function evaluateCaseHotel(formName, values, progress) {
  if (formName === 'case-hotel-mr') {
    if (!close(values.tr, -0.05)) return { feedback: 'Multiply every term in P(Q) by Q. The Q² coefficient keeps its negative sign.' };
    if (!close(values.mr, -0.1)) return { feedback: 'Differentiate TR(Q). The Q coefficient in MR is twice the Q² coefficient in TR.' };
    progress.mr = { tr: Number(values.tr), mr: Number(values.mr) };
    return { feedback: 'Your TR and MR coefficients are correct. Now compare the three customer groups.' };
  }
  if (formName === 'case-hotel-elasticity') {
    for (const group of HOTEL_CASE.groups) if (!close(values[group.id], caseElasticity(group), 0.12)) return { feedback: `Recheck group ${group.id}. First find Q at DKK 1,400, then use (1 / inverse-demand slope) × (1400 / Q).` };
    if (values.least !== 'A') return { feedback: 'Compare absolute values. The elasticity closest to zero is least price-sensitive.' };
    progress.elasticity = { values: Object.fromEntries(HOTEL_CASE.groups.map(group => [group.id, Number(values[group.id])])), least: values.least };
    return { feedback: 'Good. Now interpret income and cross-price elasticities for the director.' };
  }
  if (formName === 'case-hotel-advice') {
    if (values.offerA !== 'substitute' || values.offerB !== 'complement') return { feedback: 'A positive cross-price elasticity suggests substitutes; a negative one suggests complements.' };
    const reflection = String(values.reflection || '').trim();
    if (reflection.length < 35) return { feedback: 'Add a few more sentences about pricing and what remains uncertain.' };
    progress.interpretation = { offerA: values.offerA, offerB: values.offerB, reflection };
    return { feedback: 'Your case advice is saved.' };
  }
  return null;
}
