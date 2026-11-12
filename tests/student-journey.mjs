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

async function runJourney(width, height, mode = 'free') {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const click = selector => page.locator(selector).first().click();
  const freeQuestions = {
    price: 'What is your reference room price and currency?', bookings: 'What bookings are supplied at €170?',
    order: 'What does the hotel need for breakfast?', cost: 'What are the labour and ingredient costs?',
    one: 'What does one baker produce?', two: 'What do two bakers produce?', three: 'What do three bakers produce?',
    other: 'What comparison observation is supplied at €190?', comparable: 'Are the conditions comparable?',
    full: 'What is the room capacity?', costs: 'Are hotel operating costs available?',
    income: 'Are income elasticities supplied?', cross: 'Are cross-price elasticities provided?', events: 'What changes could affect the demonstration?',
    options: 'What are the wine options and prices?', taste: 'What did the tasting panel score?',
    stock: 'What is the estate reserve stock limit?', forecast: 'What is the dinner forecast?'
  };
  const ask = async (...ids) => { for (const id of ids) {
    { const before = await page.evaluate(() => JSON.parse(localStorage.getItem('sole-bay-simulation-v1')).log.filter(row => row.kind === 'question').length); await page.locator('#free-question-input').fill(freeQuestions[id]); await click('.free-question button[type="submit"]'); await page.waitForFunction(count => JSON.parse(localStorage.getItem('sole-bay-simulation-v1')).log.filter(row => row.kind === 'question').length > count, before); }
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
      await page.route('**/api/actor', route => route.fulfill({contentType:'application/json',body:JSON.stringify(route.request().postDataJSON().question.includes('optimal') ? {answer:'At €170 per room for one night, 69 rooms were requested. You need to derive the demand function yourself.',factIds:['price','bookings'],source:'boundary'} : {answer:'At €170 per room for one night, 69 rooms were requested.',factIds:['price','bookings'],source:'mock'})}));
      await page.locator('#free-question-input').fill('What is your reference room price?');
      await click('.free-question button[type="submit"]');
      await page.locator('.reply-source').getByText('Simulated reply · Offline test', {exact:true}).waitFor();
      await page.locator('#free-question-input').fill('What is the optimal room price?');
      await click('.free-question button[type="submit"]');
      await page.locator('.scene-speech').getByText(/derive the demand function yourself/i).waitFor();
      assert.match(await page.locator('.scene-speech').innerText(), /derive the demand function yourself/i);
      assert.match(await page.locator('.reply-source').innerText(), /Case reply.*Student-work rule/);
      await page.unroute('**/api/actor');
      await page.locator('#free-question-input').fill('What can one baker produce?');
      await click('.free-question button[type="submit"]');
      await page.locator('.scene-speech').getByText(/Paolo/).waitFor();
      assert.match(await page.locator('.scene-speech').innerText(), /Paolo/);
      assert.equal(await page.locator('[data-question]').count(), 0);
      let delayedRoute, announceArrival;
      const delayedQuestion = 'What reference room price do you use? Please take your time.';
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
      await delayedRoute.fulfill({ contentType: 'application/json', body: JSON.stringify({ answer: 'Lucia’s delayed reply: our reference price is €170.', factId: 'price', source: 'fallback' }) });
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
    await page.locator('#free-question-input').fill('Is my demand equation P=262-(4/3)Q correct?');
    await click('.free-question button[type="submit"]');
    await page.locator('.scene-speech').getByText(/Yes.*matches/).waitFor();
    assert.doesNotMatch(await page.locator('.scene-speech').innerText(), /262|4\/3/);
    await ask('other', 'comparable');
    await ask('income', 'cross');
    await closeTalk();
    await click('.interior-actions [data-person="elena"]');
    await ask('full', 'costs');
    await click('.scene-dialogue [data-action="workspace"]');
    assert.equal(await page.locator('[data-form="case-hotel-mr"]').count(), 0);
    assert.doesNotMatch(await page.locator('.mini-task').innerText(), /262|196\.5|1\.333/);
    await fill(page.locator('[data-form="case-hotel-demand"]'), { intercept: 170, slope: -1 });
    assert.equal(await page.locator('[data-form="case-hotel-mr"]').count(), 0);
    await fill(page.locator('[data-form="case-hotel-demand"]'), { intercept: 262, slope: -4/3 });
    await page.locator('[name="tr"]').fill('-0.05');
    await click('[data-action="hint"]');
    assert.equal(await page.locator('[name="tr"]').inputValue(), '-0.05', 'hints must retain unfinished work');
    await page.reload({ waitUntil: 'domcontentloaded' });
    assert.equal(await page.locator('[name="tr"]').inputValue(), '-0.05', 'draft must survive reload');
    let resumedHistory;
    await page.route('**/api/actor', route => { resumedHistory = route.request().postDataJSON().history; return route.continue(); });
    await click('.mini-tool-links [data-action="dialogue"]');
    assert.equal(await page.locator('.conversation-history').count(), 0, 'conversation memory must reset on reload');
    await page.locator('#free-question-input').fill('What is the room capacity?');
    await click('.free-question button[type="submit"]');
    await page.locator('.scene-speech').getByText(/80 rooms/).waitFor();
    assert.equal(resumedHistory, undefined, 'browser must not supply purported actor history');
    await page.unroute('**/api/actor');
    await click('.scene-dialogue [data-action="workspace"]');
    assert.equal(await page.locator('[name="tr"]').inputValue(), '-0.05');
    await fill(page.locator('[data-form="case-hotel-mr"]'), { tr: 0, mr: -8 / 3 });
    assert.equal(await page.locator('[name="tr"]').inputValue(), '0', 'rejected answer must remain editable');
    await fill(page.locator('[data-form="case-hotel-mr"]'), { tr: -4 / 3, mr: -8 / 3 });
    await fill(page.locator('[data-form="case-hotel-elasticity"]'), { value: -1.85, explanation: 'Price elasticity compares percentage room requests and price changes. I hold other conditions fixed and distinguish requests from capacity-limited sales.' });
    await page.locator('[name="reflection"]').fill(reflection);
    await page.locator('[name="price"]').fill('150');
    await click('[data-action="hint"]');
    assert.match(await page.locator('.hint-box').innerText(), /requested rooms/);
    assert.equal(await page.locator('[name="reflection"]').inputValue(), reflection);
    await click('.mini-tool-links [data-view="notebook"]');
    await click('.screen-head [data-view="hotel"]');
    await click('.interior-actions [data-action="workspace"]');
    assert.equal(await page.locator('[name="reflection"]').inputValue(), reflection);
    assert.equal(await page.locator('[name="price"]').inputValue(), '150');
    await fill(page.locator('[data-form="case-hotel-advice"]'), { price: 150, predictedRequested: 84, predictedSold: 80, predictedRevenue: 12000, profitClaim: 'no', reflection });
    await page.getByRole('heading', { name: 'Hotel case completed', exact: true }).waitFor();
    await mkdir('test-artifacts', { recursive: true });
    await page.screenshot({ path: join('test-artifacts', `verified-hotel-${width}.png`) });
    await click('[data-case-step="interpretation"]');
    assert.equal(await page.locator('[name="reflection"]').inputValue(), reflection);
    const revisedReflection = reflection + ' I would compare a higher rate while remembering that operating costs are unknown.';
    await fill(page.locator('[data-form="case-hotel-advice"]'), { price: 190, predictedRequested: 54, predictedSold: 54, predictedRevenue: 10260, profitClaim: 'no', reflection: revisedReflection });
    await page.getByRole('heading', { name: 'Hotel case completed', exact: true }).waitFor();
    const caseState = await page.evaluate(() => JSON.parse(localStorage.getItem('sole-bay-simulation-v1')));
    assert.equal(caseState.breakfast.decision, null, 'hotel must complete without bakery');
    assert.equal(caseState.winery.choice, null, 'hotel must complete without winery');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Hotel case completed', exact: true }).waitFor();
    await click('.mini-head [data-action="close-overlay"]');
    await click('.game-go');
    await page.getByRole('heading', { name: 'Field notebook', exact: true }).waitFor();
    assert.match(await page.locator('.panel.full').first().innerText(), /Saved rate/);
    const downloadPromise = page.waitForEvent('download');
    await click('[data-action="export"]');
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), 'sole-bay-notebook.json');
    const downloadStream = await download.createReadStream();
    let exportedText = '';
    for await (const chunk of downloadStream) exportedText += chunk.toString();
    const exported = JSON.parse(exportedText);
    assert.equal(exported.state.caseHotel.interpretation.reflection, revisedReflection);
    assert.equal(exported.state.caseHotel.interpretation.price, 190);
    assert.equal(exported.state.caseHotel.interpretation.revenue, 10260);
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
    await fill(wine, { predictedEstate: 0, predictedHouse: 40, predictedCost: 320, reason });
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
  const migrationContext = await browser.newContext();
  const migrationPage = await migrationContext.newPage();
  await migrationPage.goto(URL, { waitUntil: 'domcontentloaded' });
  await migrationPage.evaluate(() => localStorage.setItem('sole-bay-simulation-v1', JSON.stringify({ mode: 'guided', view: 'town', caseVersion: 1, caseHotel: { mr: { tr: -0.05, mr: -0.1 }, elasticity: null, interpretation: { reflection: 'Previously saved DKK work' } }, interviews: { hotel: ['price'], bakery: [], winery: [] }, log: [{ kind: 'question', actor: 'hotel', detail: 'Old DKK case question', data: { answer: '78 rooms', speaker: 'Lucia' } }] })));
  await migrationPage.reload({ waitUntil: 'domcontentloaded' });
  await migrationPage.locator('[data-visit="hotel"]').first().click();
  const migrated = await migrationPage.evaluate(() => JSON.parse(localStorage.getItem('sole-bay-simulation-v1')));
  assert.equal(migrated.caseVersion, 3);
  assert.equal(migrated.caseHotel.mr, null);
  assert.equal(migrated.archives[0].caseHotel.interpretation.reflection, 'Previously saved DKK work');
  assert.equal(migrated.log.some(row => row.detail === 'Old DKK case question'), false);
  await migrationContext.close();
  await runJourney(1280, 800);
  await runJourney(390, 844);
} finally {
  await browser.close();
}
