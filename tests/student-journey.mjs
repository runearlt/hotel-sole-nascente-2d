import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const URL = process.env.GAME_URL || 'http://127.0.0.1:8174/';
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROME_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROME_PATH }
    : process.platform === 'darwin' ? { executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' } : {})
});

async function fill(form, values) {
  for (const [name, value] of Object.entries(values)) {
    const field = form.locator(`[name="${name}"]`);
    const type = await field.first().getAttribute('type');
    const tag = await field.first().evaluate(element => element.tagName);
    if (type === 'radio') await form.locator(`[name="${name}"][value="${value}"]`).check();
    else if (tag === 'SELECT') await field.selectOption(String(value));
    else await field.fill(String(value));
  }
  await form.locator('button[type="submit"], button:not([type])').first().click();
}

async function runJourney(width, height, mode = 'guided') {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const click = selector => page.locator(selector).first().click();
  const freeQuestions = {
    price: 'How many rooms does the original hotel have and what units does the case use?', bookings: 'How does occupancy change by season?',
    order: 'What does the hotel need for breakfast?', cost: 'What are the labour and ingredient costs?',
    one: 'What does one baker produce?', two: 'What do two bakers produce?', three: 'What do three bakers produce?',
    other: 'What are the demand curves for groups A, B and C?', comparable: 'Who are the guest groups?',
    full: 'What is the room capacity?', costs: 'Are hotel operating costs available?',
    income: 'What income elasticities does Table 3 give?', cross: 'What do we know about Offers A and B?', events: 'What climate challenges does the case describe?',
    options: 'What are the wine options and prices?', taste: 'What did the tasting panel score?',
    stock: 'What is the estate reserve stock limit?', forecast: 'What is the dinner forecast?'
  };
  const ask = async (...ids) => { for (const id of ids) {
    if (mode === 'guided') await click(`.scene-dialogue [data-question="${id}"]`);
    else { const before = await page.evaluate(() => JSON.parse(localStorage.getItem('sole-bay-simulation-v1')).log.filter(row => row.kind === 'question').length); await page.locator('#free-question-input').fill(freeQuestions[id]); await click('.free-question button[type="submit"]'); await page.waitForFunction(count => JSON.parse(localStorage.getItem('sole-bay-simulation-v1')).log.filter(row => row.kind === 'question').length > count, before); }
  } };
  const closeTalk = () => click('.scene-dialogue [data-action="close-overlay"]');
  const town = async () => { await click('.mini-head [data-action="close-overlay"]'); await click('.interior-actions [data-view="town"]'); };
  const reason = 'I compared the available evidence, capacity and costs, while keeping uncertain profit effects separate.';
  const reflection = 'I would check the result against my prediction and revise the decision if the evidence or constraints changed.';

  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.removeItem('sole-bay-simulation-v1'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await click(`[data-mode="${mode}"]`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}px town overflows`);

    await click('.game-go');
    await click('.game-go');
    if (mode === 'free') {
      assert.equal(await page.locator('.scene-question').count(), 0, 'free mode must hide prepared questions');
      await page.locator('#free-question-input').fill('What is the optimal room price?');
      await click('.free-question button[type="submit"]');
      await page.locator('.scene-speech').getByText(/calculations and advice are yours/i).waitFor();
      assert.match(await page.locator('.scene-speech').innerText(), /calculations and advice are yours/i);
      await page.locator('#free-question-input').fill('What can one baker produce?');
      await click('.free-question button[type="submit"]');
      await page.locator('.scene-speech').getByText(/Paolo/).waitFor();
      assert.match(await page.locator('.scene-speech').innerText(), /Paolo/);
      assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('sole-bay-simulation-v1')).interviews.hotel), []);
      let delayedRoute, announceArrival;
      const delayedQuestion = 'How many rooms do you have? Please take your time.';
      const arrived = new Promise(resolve => { announceArrival = resolve; });
      await page.route('**/api/actor', route => {
        if (route.request().postDataJSON()?.question === delayedQuestion) { delayedRoute = route; announceArrival(); }
        else route.continue();
      });
      await page.locator('#free-question-input').fill(delayedQuestion);
      await click('.free-question button[type="submit"]');
      await arrived;
      await closeTalk();
      await click('.interior-actions [data-person="marco"]');
      await delayedRoute.fulfill({ contentType: 'application/json', body: JSON.stringify({ answer: 'Lucia’s delayed reply: we have 78 rooms.', factId: 'price', source: 'fallback' }) });
      await page.waitForFunction(question => JSON.parse(localStorage.getItem('sole-bay-simulation-v1')).log.some(row => row.detail === question), delayedQuestion);
      assert.doesNotMatch(await page.locator('.scene-speech').innerText(), /Lucia’s delayed reply/);
      await page.unroute('**/api/actor');
      await closeTalk();
      await click('.interior-actions [data-person="lucia"]');
    }
    await ask('price', 'bookings');
    await ask('events');
    await closeTalk();
    await click('.interior-actions [data-person="marco"]');
    await ask('other', 'comparable');
    await ask('income', 'cross');
    await closeTalk();
    await click('.interior-actions [data-person="elena"]');
    await ask('full', 'costs');
    await click('.scene-dialogue [data-action="workspace"]');
    await page.locator('[name="tr"]').fill('-0.05');
    await click('[data-action="hint"]');
    assert.equal(await page.locator('[name="tr"]').inputValue(), '-0.05', 'hints must retain unfinished work');
    await page.reload({ waitUntil: 'domcontentloaded' });
    assert.equal(await page.locator('[name="tr"]').inputValue(), '-0.05', 'draft must survive reload');
    await fill(page.locator('[data-form="case-hotel-mr"]'), { tr: 0, mr: -0.1 });
    assert.equal(await page.locator('[name="tr"]').inputValue(), '0', 'rejected answer must remain editable');
    await fill(page.locator('[data-form="case-hotel-mr"]'), { tr: -0.05, mr: -0.1 });
    await fill(page.locator('[data-form="case-hotel-elasticity"]'), { A: -1.4, B: -2, C: -3.5, least: 'A', explanation: 'Price elasticity compares percentage demand and price changes. I compare absolute values at the same price, holding other demand factors and the case period fixed.' });
    await fill(page.locator('[data-form="case-hotel-advice"]'), { offerA: 'substitute', offerB: 'complement', reflection });
    const modelDraft = 'My model draft: room-night demand depends on own price, income and related prices.';
    await page.locator('[data-form="case-hotel-model"] [name="model"]').fill(modelDraft);
    await page.locator('[name="own"]').selectOption('negative');
    await click('[data-action="hint"]');
    assert.match(await page.locator('.hint-box').innerText(), /factors.*room-night demand/i);
    assert.equal(await page.locator('[name="model"]').inputValue(), modelDraft);
    await click('.mini-tool-links [data-view="notebook"]');
    await click('.screen-head [data-view="hotel"]');
    await click('.interior-actions [data-action="workspace"]');
    assert.equal(await page.locator('[name="model"]').inputValue(), modelDraft, 'notebook visit must retain draft');
    assert.equal(await page.locator('[name="own"]').inputValue(), 'negative');
    await mkdir('test-artifacts', { recursive: true });
    await page.screenshot({ path: join('test-artifacts', `hotel-model-${mode}-${width}.png`) });
    await fill(page.locator('[data-form="case-hotel-model"]'), { own: 'negative', income: 'positive', substitute: 'positive', complement: 'negative', model: 'Q = a - bP + cI + dPs - ePk. Q is room-nights and prices are DKK. Sensitivities depend on the segment and must be estimated with additional data.' });
    await fill(page.locator('[data-form="case-hotel-changes"]'), { event: 'climate', reflection: 'Climate events may shift baseline demand and could alter sensitivity to substitute and complement prices. Neither coefficient direction is established without additional evidence.' });
    await page.getByRole('heading', { name: 'Hotel case completed', exact: true }).waitFor();
    await click('[data-case-step="interpretation"]');
    assert.equal(await page.locator('[name="reflection"]').inputValue(), reflection, 'review must load saved answer');
    const revisedReflection = `${reflection} I would also compare percentage responses across all three groups.`;
    await fill(page.locator('[data-form="case-hotel-advice"]'), { offerA: 'substitute', offerB: 'complement', reflection: revisedReflection });
    await page.getByRole('heading', { name: 'Hotel case completed', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('sole-bay-simulation-v1')).caseHotel.interpretation.reflection), revisedReflection);
    const caseState = await page.evaluate(() => JSON.parse(localStorage.getItem('sole-bay-simulation-v1')));
    assert.equal(caseState.breakfast.decision, null, 'hotel must complete without bakery');
    assert.equal(caseState.winery.choice, null, 'hotel must complete without winery');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Hotel case completed', exact: true }).waitFor();
    await click('.mini-head [data-action="close-overlay"]');
    await click('.game-go');
    await page.getByRole('heading', { name: 'Field notebook', exact: true }).waitFor();
    assert.match(await page.locator('.panel.full').first().innerText(), /Multiple demand model/);
    const downloadPromise = page.waitForEvent('download');
    await click('[data-action="export"]');
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), 'sole-bay-notebook.json');
    const downloadStream = await download.createReadStream();
    let exportedText = '';
    for await (const chunk of downloadStream) exportedText += chunk.toString();
    const exported = JSON.parse(exportedText);
    assert.equal(exported.state.caseHotel.interpretation.reflection, revisedReflection);
    assert.ok(exported.state.caseHotel.demandModel.model);
    assert.ok(exported.state.caseHotel.changes.reflection);
    await click('.screen-head [data-view="hotel"]');
    await click('.interior-actions [data-view="town"]');
    assert.match(await page.locator('.game-objective').innerText(), /Hotel case complete/);

    await click('[data-visit="bakery"]');
    await click('.game-go');
    await ask('order', 'cost');
    await closeTalk();
    await click('.interior-actions [data-person="paolo"]');
    await ask('one', 'two', 'three');
    await closeTalk();
    await click('.game-go[data-action="workspace"]');
    assert.equal(await page.locator('.observation-table').isVisible(), true);
    for (const [bakers, extra, cost, served] of [[1, 40, 44, 40], [2, 20, 76, 60], [3, 5, 99, 60]]) {
      await fill(page.locator('[data-form="bakery-test"]'), { bakers, predictedExtra: extra, predictedCost: cost, prediction: served });
      if (bakers < 3) assert.equal(await page.locator('[name="bakers"]').first().inputValue(), String(bakers + 1), 'next untested plan should be selected');
    }
    await fill(page.locator('[data-form="bakery-decide"]'), { bakers: 2, reason });
    await fill(page.locator('[data-form="bakery-reflect"]'), { reflection });
    await town();

    await click('[data-visit="winery"]');
    await click('.game-go');
    await ask('options', 'taste');
    await closeTalk();
    await click('.interior-actions [data-person="giulia"]');
    await ask('stock', 'forecast');
    await closeTalk();
    await click('.game-go[data-action="workspace"]');
    const wine = page.locator('[data-form="winery-decide"]');
    await wine.locator('[name="choice"][value="house"]').check();
    await fill(wine, { predictedEstate: 0, predictedHouse: 80, predictedCost: 640, reason });
    await fill(page.locator('[data-form="winery-reflect"]'), { reflection });
    const state = await page.evaluate(() => JSON.parse(localStorage.getItem('sole-bay-simulation-v1')));
    assert.ok(state.breakfast.decision?.reflection, 'breakfast reflection missing');
    assert.ok(state.caseHotel.mr, 'TR/MR step missing');
    assert.ok(state.caseHotel.elasticity, 'elasticity comparison missing');
    assert.ok(state.caseHotel.interpretation, 'case advice missing');
    assert.ok(state.winery.reflection, 'wine reflection missing');
    assert.deepEqual(errors, [], 'browser reported page errors');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}px workspace overflows`);
    await mkdir('test-artifacts', { recursive: true });
    await page.screenshot({ path: join('test-artifacts', `verified-${mode}-${width}.png`) });
    console.log(`${width}x${height} ${mode}: visible student journey completed`);
  } catch (error) {
    await mkdir('test-artifacts', { recursive: true });
    await page.screenshot({ path: join('test-artifacts', `student-journey-${mode}-${width}.png`) });
    throw error;
  } finally {
    await context.close();
  }
}

try {
  await runJourney(1280, 800);
  await runJourney(390, 844);
  await runJourney(1280, 800, 'free');
  await runJourney(390, 844, 'free');
} finally {
  await browser.close();
}
