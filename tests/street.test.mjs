import assert from 'node:assert/strict';
import test from 'node:test';
import { Town, STREET_PEOPLE, streetChoice, bestStreetChoice } from '../public/town.js';

test('each street exercise has a feasible, highest-utility option', () => {
  for (const person of STREET_PEOPLE) {
    const best = bestStreetChoice(person);
    const options = person.options.map(option => streetChoice(person, option.amounts));
    assert.ok(options.some(option => option.affordable && option.utility === best.utility));
    assert.equal(options.filter(option => option.affordable && option.utility === best.utility).length, 1);
    assert.ok(best.cost <= person.budget);
  }
});

test('pedestrians stay outside building collision boxes', () => {
  const blocked = Town.prototype.blocked;
  for (const person of STREET_PEOPLE) {
    for (const [x, y] of [person.from, person.to]) assert.equal(blocked(x, y), false, `${person.name} intersects a building`);
  }
});
