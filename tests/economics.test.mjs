import test from 'node:test';
import assert from 'node:assert/strict';
import { bakeryOutcome, wineOutcome } from '../public/economics.js';
import { SCENARIO } from '../public/config.js';

test('optional bakery contribution counts only served guests and costs all produced rolls', () => {
  const plans = SCENARIO.breakfast.plans.map(plan => bakeryOutcome(plan));
  assert.deepEqual(plans.map(plan => plan.served), [40, 60, 60]);
  assert.deepEqual(plans.map(plan => plan.orderCost), [44, 76, 99]);
  assert.deepEqual(plans.map(plan => plan.contribution), [76, 104, 81]);
  assert.deepEqual(plans.map(plan => plan.leftover), [0, 0, 5]);
});

test('optional wine forecast and purchasing agree on 80 diners sharing 40 bottles with a 30-bottle estate limit', () => {
  assert.equal(SCENARIO.wine.dinnerGuests, SCENARIO.breakfast.guests + SCENARIO.wine.outsideDiners);
  assert.deepEqual(wineOutcome('house'), { choice: 'house', bottles: 40, estate: 0, house: 40, cost: 320 });
  assert.deepEqual(wineOutcome('mixed'), { choice: 'mixed', bottles: 40, estate: 30, house: 10, cost: 440 });
});
