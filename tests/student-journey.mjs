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
    }
    await ask('price', 'bookings');
    await closeTalk();
    await click('.interior-actions [data-view="town"]');

    await click('.game-go');
    await click('.game-go');
    await ask('order', 'cost');
    await closeTalk();
    await click('.interior-actions [data-person="paolo"]');
    await ask('one', 'two', 'three');
    await click('.scene-dialogue [data-action="workspace"]');
    assert.equal(await page.locator('.observation-table').isVisible(), true);
    for (const [bakers, extra, cost, served] of [[1, 40, 44, 40], [2, 20, 76, 60], [3, 5, 99, 60]]) {
      await fill(page.locator('[data-form="bakery-test"]'), { bakers, predictedExtra: extra, predictedCost: cost, prediction: served });
    }
    await fill(page.locator('[data-form="bakery-decide"]'), { bakers: 2, reason });
    await fill(page.locator('[data-form="bakery-reflect"]'), { reflection });
    await town();

    await click('.game-go');
    await click('.game-go');
    await ask('other', 'comparable');
    await closeTalk();
    await click('.interior-actions [data-person="elena"]');
    await ask('full', 'costs');
    await click('.scene-dialogue [data-action="workspace"]');
    await fill(page.locator('[data-form="case-hotel-mr"]'), { tr: -0.05, mr: -0.1 });
    await fill(page.locator('[data-form="case-hotel-elasticity"]'), { A: -1.4, B: -2, C: -3.5, least: 'A' });
    await fill(page.locator('[data-form="case-hotel-advice"]'), { offerA: 'substitute', offerB: 'complement', reflection });
    await town();

    await click('.game-go');
    await click('.game-go');
    await ask('options', 'taste');
    await closeTalk();
    await click('.interior-actions [data-person="giulia"]');
    await ask('stock', 'forecast');
    await click('.scene-dialogue [data-action="workspace"]');
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
