import test from 'node:test';
import assert from 'node:assert/strict';
import { answerFreeQuestion, FREE_AGENTS } from '../public/free-agents.js';

test('each role has editable instructions and role facts', () => {
  for (const id of ['lucia', 'marco', 'elena', 'marta', 'paolo', 'sofia', 'giulia']) {
    assert.ok(FREE_AGENTS[id].instruction);
    assert.ok(FREE_AGENTS[id].facts.length >= 2);
  }
});

test('case facts count as interview evidence without giving a solution', () => {
  const price = answerFreeQuestion('lucia', 'What is the current room price?');
  const booking = answerFreeQuestion('lucia', 'How many room bookings do you have?');
  assert.equal(price.factId, 'price');
  assert.equal(booking.factId, 'bookings');
  assert.match(price.answer, /78 rooms|DKK/);
  assert.doesNotMatch(price.answer + booking.answer, /€170|262|profit-maximizing|marginal revenue/i);
});

test('solution requests, vague questions and wrong-role questions earn no fact credit', () => {
  for (const question of ['What is the optimal room price?', 'Calculate marginal revenue for me.', 'What is the answer?']) {
    assert.equal(answerFreeQuestion('lucia', question).factId, null);
  }
  assert.equal(answerFreeQuestion('marta', 'How do I calculate the best staffing plan?').factId, null);
  assert.equal(answerFreeQuestion('lucia', 'help').factId, null);
  const wrong = answerFreeQuestion('lucia', 'What can one baker produce?');
  assert.equal(wrong.factId, null);
  assert.match(wrong.answer, /Paolo/);
});

test('student can retrieve required facts from each responsible person', () => {
  const cases = [
    ['marco', 'What are the demand curves for groups A, B and C?', 'other'],
    ['marco', 'Who are the guest groups?', 'comparable'],
    ['elena', 'What is the room capacity?', 'full'],
    ['elena', 'Are hotel operating costs available?', 'costs'],
    ['marta', 'What does the hotel need for breakfast?', 'order'],
    ['marta', 'What are the labour and ingredient costs?', 'cost'],
    ['paolo', 'What does one baker produce?', 'one'],
    ['paolo', 'What do two bakers produce?', 'two'],
    ['paolo', 'What do three bakers produce?', 'three'],
    ['sofia', 'What are the wine options and prices?', 'options'],
    ['sofia', 'What did the tasting panel score?', 'taste'],
    ['giulia', 'What is the estate reserve stock limit?', 'stock'],
    ['giulia', 'What is the dinner forecast?', 'forecast']
  ];
  for (const [person, question, expected] of cases) assert.equal(answerFreeQuestion(person, question, { nextPeriodGuests: 69 }).factId, expected, `${person}: ${question}`);
});

test('common paraphrases still retrieve the intended observations', () => {
  assert.equal(answerFreeQuestion('lucia', 'How much does a room cost per night?').factId, 'price');
  assert.equal(answerFreeQuestion('lucia', 'How does occupancy change by season?').factId, 'bookings');
  assert.equal(answerFreeQuestion('marco', 'What is the estimated demand function?').factId, 'other');
  assert.equal(answerFreeQuestion('marta', 'How many rolls does the hotel need?').factId, 'order');
});

test('concept explanations do not reveal or credit case solutions', () => {
  const elasticity = answerFreeQuestion('lucia', 'What does elasticity mean?');
  assert.equal(elasticity.factId, null);
  assert.match(elasticity.answer, /room requests change/i);
  const marginal = answerFreeQuestion('paolo', 'What does marginal product mean?');
  assert.equal(marginal.factId, null);
  assert.match(marginal.answer, /extra output/i);
  assert.doesNotMatch(marginal.answer, /20 rolls|5 rolls/i);
});
