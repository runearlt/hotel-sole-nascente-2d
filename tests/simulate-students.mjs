import { chromium } from 'playwright';

const URL = process.env.GAME_URL || 'http://127.0.0.1:8174/';
const COUNT = Number(process.env.STUDENTS || 200);
const SEED = 20261028;

function random(seed) {
  let value = seed >>> 0;
  return () => ((value = (1664525 * value + 1013904223) >>> 0) / 2 ** 32);
}

const rng = random(SEED);
const trRng = random(SEED + 1);
const profiles = Array.from({ length: COUNT }, (_, index) => {
  const ability = index % 5 === 0 ? 'novice' : index % 5 === 4 ? 'advanced' : 'typical';
  const chance = ability === 'novice' ? 0.7 : ability === 'typical' ? 0.32 : 0.08;
  return {
    id: index + 1, ability,
    modelError: rng() < chance, trError: trRng() < chance, mrError: rng() < chance,
    bakeryError: rng() < chance, priceError: rng() < chance,
    elasticityError: rng() < chance, wineError: rng() < chance,
    profitError: rng() < chance / 2,
    usesHints: rng() < (ability === 'novice' ? .8 : ability === 'typical' ? .35 : .1),
    doesStreet: rng() < .25,
    price: [150, 170, 185][Math.floor(rng() * 3)],
    wine: rng() < .5 ? 'house' : 'mixed'
  };
});

const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
const results = [];
try {
  for (const profile of profiles) {
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.removeItem('sole-bay-simulation-v1'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    const result = await page.evaluate(profile => {
      const KEY = 'sole-bay-simulation-v1';
      const counts = { questions: 0, formAttempts: 0, hints: 0, navigation: 0, retries: 0 };
      const read = () => JSON.parse(localStorage.getItem(KEY));
      const click = selector => {
        const target = document.querySelector(selector);
        if (!target) throw new Error(`Missing ${selector}`);
        target.click();
        if (selector.includes('data-visit') || selector.includes('data-view')) counts.navigation++;
        if (selector.includes('data-question')) counts.questions++;
        if (selector.includes('data-action="hint"')) counts.hints++;
      };
      const submit = (name, entries) => {
        const form = document.querySelector(`form[data-form="${name}"]`);
        if (!form) throw new Error(`Missing form ${name}`);
        for (const [field, value] of Object.entries(entries)) {
          const input = form.elements.namedItem(field);
          if (!input) throw new Error(`Missing ${name}.${field}`);
          if (input instanceof RadioNodeList) {
            const choice = [...input].find(option => option.value === String(value));
            if (!choice) throw new Error(`Missing option ${name}.${field}=${value}`);
            choice.checked = true;
          } else input.value = String(value);
        }
        counts.formAttempts++;
        form.requestSubmit();
      };
      const talk = (person, questions) => {
        click('[data-action="close-overlay"]');
        click(`[data-person="${person}"]`);
        for (const id of questions) click(`[data-question="${id}"]`);
      };
      const leave = () => { click('[data-action="close-overlay"]'); click('[data-view="town"]'); };
      const reason = 'I compared the available evidence, capacity and costs, while keeping uncertain profit effects separate.';
      const reflection = 'I would check the result against my prediction and revise the decision if the evidence or constraints changed.';
      const flags = { wrongModelAccepted: false, wrongTRAccepted: false, wrongMRAccepted: false, wrongHotelPredictionAccepted: false, wrongBakeryPlanAccepted: false, wrongWineCostAccepted: false };

      click('[data-visit="hotel"]');
      click('[data-person="lucia"]');
      for (const id of ['price', 'bookings']) click(`[data-question="${id}"]`);
      leave();

      click('[data-visit="bakery"]');
      click('[data-person="marta"]');
      for (const id of ['order', 'cost']) click(`[data-question="${id}"]`);
      talk('paolo', ['one', 'two', 'three']);
      click('[data-action="workspace"]');
      if (profile.usesHints) click('[data-action="hint"]');
      for (const plan of [[1, 40, 44, 40], [2, 20, 76, 60], [3, 5, 99, 60]]) {
        const [bakers, extra, cost, served] = plan;
        if (profile.bakeryError && bakers === 2) {
          submit('bakery-test', { bakers, predictedExtra: extra + 10, predictedCost: cost, prediction: served });
          counts.retries++;
          flags.wrongBakeryPlanAccepted = read().breakfast.runs.at(-1)?.verified !== false;
        }
        submit('bakery-test', { bakers, predictedExtra: extra, predictedCost: cost, prediction: served });
      }
      submit('bakery-decide', { bakers: 2, reason });
      submit('bakery-reflect', { reflection });
      leave();

      click('[data-visit="hotel"]');
      click('[data-person="marco"]');
      for (const id of ['other', 'comparable']) click(`[data-question="${id}"]`);
      talk('elena', ['full', 'costs']);
      click('[data-action="workspace"]');
      if (profile.usesHints) click('[data-action="hint"]');
      if (profile.modelError) { submit('hotel-model', { intercept: 262, slope: 1.33 }); counts.retries++; flags.wrongModelAccepted = !!read().hotel.model; }
      submit('hotel-model', { intercept: 262, slope: -4 / 3 });
      if (profile.trError) { submit('hotel-mr', { trSlope: 4 / 3, slope: -8 / 3 }); counts.retries++; flags.wrongTRAccepted = !!read().hotel.mr; }
      if (profile.mrError) { submit('hotel-mr', { trSlope: -4 / 3, slope: 8 / 3 }); counts.retries++; flags.wrongMRAccepted = !!read().hotel.mr; }
      submit('hotel-mr', { trSlope: -4 / 3, slope: -8 / 3 });

      const requested = (profile.price - 262) / (-4 / 3);
      const sold = Math.min(requested, 80);
      const revenue = profile.price * sold;
      if (profile.profitError) {
        submit('hotel-decide', { price: profile.price, predictedRequested: requested, predictedRevenue: revenue, profitClaim: 'yes', reason });
        counts.retries++;
      }
      if (profile.priceError) {
        submit('hotel-decide', { price: profile.price, predictedRequested: requested + 5, predictedRevenue: revenue + 200, profitClaim: 'no', reason });
        counts.retries++;
        flags.wrongHotelPredictionAccepted = !!read().hotel.decision;
      }
      if (!read().hotel.decision) submit('hotel-decide', { price: profile.price, predictedRequested: requested, predictedRevenue: revenue, profitClaim: 'no', reason });
      submit('hotel-reflect', { reflection });
      if (profile.usesHints) click('[data-action="hint"]');
      const elasticity = -.75 * 170 / 69;
      if (profile.elasticityError) {
        submit('hotel-elasticity', { value: -elasticity, direction: 'fewer', revenueDirection: 'fall' });
        counts.retries++;
      }
      submit('hotel-elasticity', { value: elasticity, direction: 'fewer', revenueDirection: 'fall' });
      submit('hotel-elasticity-reflect', { reflection });
      leave();

      click('[data-visit="winery"]');
      click('[data-person="sofia"]');
      for (const id of ['options', 'taste']) click(`[data-question="${id}"]`);
      talk('giulia', ['stock', 'forecast']);
      click('[data-action="workspace"]');
      if (profile.usesHints) click('[data-action="hint"]');
      const bottles = Math.ceil(sold) + 20;
      const estate = profile.wine === 'mixed' ? Math.min(60, bottles) : 0;
      const house = bottles - estate;
      const cost = 12 * estate + 8 * house;
      if (profile.wineError) {
        submit('winery-decide', { choice: profile.wine, predictedEstate: estate, predictedHouse: house, predictedCost: cost + 20, reason });
        counts.retries++;
        flags.wrongWineCostAccepted = !!read().winery.choice;
      }
      submit('winery-decide', { choice: profile.wine, predictedEstate: estate, predictedHouse: house, predictedCost: cost, reason });
      submit('winery-reflect', { reflection });
      leave();
      if (profile.doesStreet) {
        click('[data-street="ana"]');
        click('[data-street-choice="balanced"]');
        click('[data-action="close-overlay"]');
      }
      const final = read();
      const complete = !!final.breakfast.decision?.reflection && !!final.hotel.decision?.reflection && !!final.hotel.elasticity?.reflection && !!final.winery.reflection && !final.winery.needsReview;
      // These task-time weights are assumptions for synthetic pacing, not measured student durations.
      const estimatedMinutes = 15.8 + counts.questions * .42 + counts.navigation * .22 + counts.formAttempts * .33 + counts.retries * .72 + counts.hints * .25 + (profile.doesStreet ? 1.8 : 0) + (profile.ability === 'novice' ? 3.3 : profile.ability === 'advanced' ? -2.8 : 0);
      return { id: profile.id, ability: profile.ability, complete, estimatedMinutes: Math.round(estimatedMinutes * 10) / 10, counts, flags, milestones: { bakery: !!final.breakfast.decision, demand: !!final.hotel.model, mr: !!final.hotel.mr, roomRate: !!final.hotel.decision, elasticity: !!final.hotel.elasticity?.reflection, wine: !!final.winery.choice }, streetSolved: !!final.street.ana?.solved };
    }, profile);
    results.push(result);
    if (profile.id % 25 === 0) process.stderr.write(`Simulated ${profile.id}/${COUNT} browser playthroughs\n`);
  }
} finally {
  await browser.close();
}

const median = values => {
  const sorted = [...values].sort((a, b) => a - b);
  return (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.floor(sorted.length / 2)]) / 2;
};
const summary = {
  kind: 'synthetic-browser-playthroughs', seed: SEED, url: URL, count: results.length,
  completed: results.filter(row => row.complete).length,
  typicalMedianEstimatedMinutes: median(results.filter(row => row.ability === 'typical').map(row => row.estimatedMinutes)),
  allMedianEstimatedMinutes: median(results.map(row => row.estimatedMinutes)),
  allP75EstimatedMinutes: [...results.map(row => row.estimatedMinutes)].sort((a, b) => a - b)[Math.floor(results.length * .75)],
  wrongHotelPredictionsAccepted: results.filter(row => row.flags.wrongHotelPredictionAccepted).length,
  wrongModelsAccepted: results.filter(row => row.flags.wrongModelAccepted).length,
  wrongTRCoefficientsAccepted: results.filter(row => row.flags.wrongTRAccepted).length,
  wrongMRCoefficientsAccepted: results.filter(row => row.flags.wrongMRAccepted).length,
  wrongBakeryPlansAccepted: results.filter(row => row.flags.wrongBakeryPlanAccepted).length,
  wrongWineCostsAccepted: results.filter(row => row.flags.wrongWineCostAccepted).length,
  totalHints: results.reduce((sum, row) => sum + row.counts.hints, 0),
  totalRetries: results.reduce((sum, row) => sum + row.counts.retries, 0),
  optionalStreetSolved: results.filter(row => row.streetSolved).length,
  byAbility: Object.fromEntries(['novice', 'typical', 'advanced'].map(ability => {
    const rows = results.filter(row => row.ability === ability);
    return [ability, { count: rows.length, completed: rows.filter(row => row.complete).length, medianEstimatedMinutes: median(rows.map(row => row.estimatedMinutes)) }];
  })),
  failures: results.filter(row => !row.complete).map(row => row.id)
};
console.log(JSON.stringify(summary, null, 2));
if (summary.completed !== COUNT || summary.wrongModelsAccepted || summary.wrongTRCoefficientsAccepted || summary.wrongMRCoefficientsAccepted || summary.wrongHotelPredictionsAccepted || summary.wrongBakeryPlansAccepted || summary.wrongWineCostsAccepted) process.exitCode = 1;
