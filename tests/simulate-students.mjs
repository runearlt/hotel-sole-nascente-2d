import { chromium } from 'playwright';

const URL = process.env.GAME_URL || 'http://127.0.0.1:8174/';
const COUNT = Number(process.env.STUDENTS || 100);
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
    trError: trRng() < chance, mrError: rng() < chance,
    bakeryError: rng() < chance,
    elasticityError: rng() < chance, wineError: rng() < chance,
    interpretationError: rng() < chance / 2,
    usesHints: rng() < (ability === 'novice' ? .8 : ability === 'typical' ? .35 : .1),
    doesStreet: rng() < .25,
    wine: rng() < .5 ? 'house' : 'mixed'
  };
});

const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROME_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROME_PATH }
    : process.platform === 'darwin' ? { executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' } : {})
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
const results = [];
try {
  for (const profile of profiles) {
    await page.context().clearCookies(); // Each profile is a different student, not one rate-limited session.
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.removeItem('sole-bay-simulation-v1'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('[data-mode="free"]').waitFor();
    const result = await page.evaluate(async profile => {
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
      const questionsById = {
        price: 'What is your reference room price?', bookings: 'What bookings do you observe?',
        other: 'What comparison observation do you have?', comparable: 'Are the conditions comparable?',
        full: 'What is the room capacity?', costs: 'Are operating costs available?',
        order: 'What does the hotel need for breakfast?', cost: 'What are labour and ingredient costs?',
        one: 'What does one baker produce?', two: 'What do two bakers produce?', three: 'What do three bakers produce?',
        options: 'What are the wine prices?', taste: 'What did the tasting panel score?',
        stock: 'What is the estate reserve stock limit?', forecast: 'What is the dinner forecast?'
      };
      const ask = async ids => {
        for (const id of ids) {
          const before = read().log.filter(row => row.kind === 'question').length;
          submit('free-question', { question: questionsById[id] }); counts.questions++;
          while (read().log.filter(row => row.kind === 'question').length === before) await new Promise(resolve => setTimeout(resolve, 5));
        }
      };
      const talk = async (person, questions) => {
        click('[data-action="close-overlay"]');
        click(`[data-person="${person}"]`);
        await ask(questions);
      };
      const leave = () => { click('[data-action="close-overlay"]'); click('[data-view="town"]'); };
      const reason = 'I compared the available evidence, capacity and costs, while keeping uncertain profit effects separate.';
      const reflection = 'I would check the result against my prediction and revise the decision if the evidence or constraints changed.';
      const flags = { wrongDemandAccepted: false, wrongTRAccepted: false, wrongMRAccepted: false, wrongElasticityAccepted: false, wrongBakeryPlanAccepted: false, wrongWineCostAccepted: false, wrongModelAccepted: false };

      click('[data-mode="free"]');
      click('[data-visit="hotel"]');
      click('[data-person="lucia"]');
      await ask(['price', 'bookings']);
      leave();

      click('[data-visit="bakery"]');
      click('[data-person="marta"]');
      await ask(['order', 'cost']);
      await talk('paolo', ['one', 'two', 'three']);
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
      submit('bakery-decide', { bakers: 1 + profile.id % 3, reason });
      submit('bakery-reflect', { reflection });
      leave();

      click('[data-visit="hotel"]');
      click('[data-person="marco"]');
      await ask(['other', 'comparable']);
      await talk('elena', ['full', 'costs']);
      click('[data-action="workspace"]');
      if (profile.usesHints) click('[data-action="hint"]');
      submit('case-hotel-demand', { intercept: 170, slope: -1 }); counts.retries++;
      flags.wrongDemandAccepted = !!read().caseHotel.demand;
      submit('case-hotel-demand', { intercept: 262, slope: -4/3 });
      submit('case-hotel-mr', { tr: 0, mr: -8 / 3 }); counts.retries++;
      flags.wrongTRAccepted = !!read().caseHotel.mr;
      submit('case-hotel-mr', { tr: -4 / 3, mr: -0.03 }); counts.retries++;
      flags.wrongMRAccepted = !!read().caseHotel.mr;
      submit('case-hotel-mr', { tr: -4 / 3, mr: -8 / 3 });
      if (profile.usesHints) click('[data-action="hint"]');
      if (profile.elasticityError) {
        submit('case-hotel-elasticity', { value: 1.85, explanation: reflection }); counts.retries++;
        flags.wrongElasticityAccepted = !!read().caseHotel.elasticity;
      }
      submit('case-hotel-elasticity', { value: -1.85, explanation: reflection });
      const price = [150, 170, 190][profile.id % 3];
      const requested = (262 - price) * .75;
      const sold = Math.min(requested, 80);
      submit('case-hotel-advice', { price, predictedRequested: requested, predictedSold: sold, predictedRevenue: price * sold, profitClaim: 'yes', reflection }); counts.retries++;
      flags.wrongModelAccepted = !!read().caseHotel.interpretation;
      submit('case-hotel-advice', { price, predictedRequested: requested, predictedSold: sold, predictedRevenue: price * sold, profitClaim: 'no', reflection });
      leave();

      click('[data-visit="winery"]');
      click('[data-person="sofia"]');
      await ask(['options', 'taste']);
      await talk('giulia', ['stock', 'forecast']);
      click('[data-action="workspace"]');
      if (profile.usesHints) click('[data-action="hint"]');
      const bottles = 40;
      const estate = profile.wine === 'mixed' ? Math.min(30, bottles) : 0;
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
        click(`[data-street="${profile.id % 2 ? 'ana' : 'enzo'}"]`);
        click(`[data-street-choice="${profile.id % 2 ? profile.id % 4 === 1 ? 'coffee' : 'gelato' : profile.id % 4 === 0 ? 'snack' : 'drinks'}"]`);
        click('[data-street-choice="balanced"]');
        click('[data-action="close-overlay"]');
      }
      const final = read();
      const actorSources=Object.fromEntries(['mock','boundary','fallback','model'].map(source=>[source,final.log.filter(row=>row.kind==='question' && row.data?.source===source).length]));
      const unexpectedFallback=profile.expectMock && (actorSources.fallback>0 || actorSources.model>0 || !actorSources.mock);
      const complete = !unexpectedFallback && !!final.breakfast.decision?.reflection && !!final.caseHotel.demand && !!final.caseHotel.mr && !!final.caseHotel.elasticity && !!final.caseHotel.interpretation && !!final.winery.reflection && !final.winery.needsReview;
      // These task-time weights are assumptions for synthetic pacing, not measured student durations.
      const estimatedMinutes = 15.8 + counts.questions * .42 + counts.navigation * .22 + counts.formAttempts * .33 + counts.retries * .72 + counts.hints * .25 + (profile.doesStreet ? 1.8 : 0) + (profile.ability === 'novice' ? 3.3 : profile.ability === 'advanced' ? -2.8 : 0);
      return { actorSources, id: profile.id, ability: profile.ability, complete, estimatedMinutes: Math.round(estimatedMinutes * 10) / 10, counts, flags, milestones: { bakery: !!final.breakfast.decision, mr: !!final.caseHotel.mr, elasticity: !!final.caseHotel.elasticity, hotelAdvice: !!final.caseHotel.interpretation, wine: !!final.winery.choice }, streetSolved: Object.values(final.street).some(person => person.solved) };
    }, {...profile,expectMock:process.env.EXPECT_MOCK_TRANSPORT==='1'});
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
  actorReplySources: Object.fromEntries(['mock','boundary','fallback','model'].map(source=>[source,results.reduce((sum,row)=>sum+(row.actorSources[source]||0),0)])),
  typicalMedianEstimatedMinutes: median(results.filter(row => row.ability === 'typical').map(row => row.estimatedMinutes)),
  allMedianEstimatedMinutes: median(results.map(row => row.estimatedMinutes)),
  allP75EstimatedMinutes: [...results.map(row => row.estimatedMinutes)].sort((a, b) => a - b)[Math.floor(results.length * .75)],
  wrongDemandFunctionsAccepted: results.filter(row => row.flags.wrongDemandAccepted).length,
  wrongElasticitiesAccepted: results.filter(row => row.flags.wrongElasticityAccepted).length,
  wrongTRCoefficientsAccepted: results.filter(row => row.flags.wrongTRAccepted).length,
  wrongMRCoefficientsAccepted: results.filter(row => row.flags.wrongMRAccepted).length,
  wrongBakeryPlansAccepted: results.filter(row => row.flags.wrongBakeryPlanAccepted).length,
  wrongWineCostsAccepted: results.filter(row => row.flags.wrongWineCostAccepted).length,
  wrongProfitClaimsAccepted: results.filter(row => row.flags.wrongModelAccepted).length,
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
if (summary.completed !== COUNT || summary.wrongDemandFunctionsAccepted || summary.wrongTRCoefficientsAccepted || summary.wrongMRCoefficientsAccepted || summary.wrongElasticitiesAccepted || summary.wrongBakeryPlansAccepted || summary.wrongWineCostsAccepted || summary.wrongProfitClaimsAccepted) process.exitCode = 1;
