import test from 'node:test';
import assert from 'node:assert/strict';
import { answerFreeQuestion, FREE_AGENTS } from '../public/free-agents.js';

test('all characters have role instructions and factual observations', () => {
  for (const actor of Object.values(FREE_AGENTS)) { assert.ok(actor.instruction); assert.ok(actor.facts.length >= 2); }
});

test('students can gather every hotel input from the responsible actor', () => {
  for (const [person, question, id, expected] of [
    ['lucia', 'What reference room price do you use?', 'price', /170/],
    ['lucia', 'How many rooms are requested at €170?', 'bookings', /69/],
    ['marco', 'What comparison observation is supplied at €190?', 'other', /54/],
    ['marco', 'Are conditions comparable?', 'comparable', /season.*booking window.*competitor.*service/],
    ['elena', 'What is the capacity?', 'full', /80/],
    ['elena', 'Are operating costs supplied?', 'costs', /not.*supplied/]
  ]) { const result = answerFreeQuestion(person, question); assert.ok(result.factIds.includes(id), question); assert.match(result.answer, expected); }
});

test('equation requests give only the actor’s own point and leave derivation to students', () => {
  for (const actor of ['lucia', 'marco']) {
    const result = answerFreeQuestion(actor, 'What demand equation is supplied? Do not solve it.');
    assert.match(result.answer, /derive.*yourself/);
    assert.doesNotMatch(result.answer, /262|196\.5|4\/3|0\.75|[PQ]\s*=/);
    assert.doesNotMatch(result.answer, actor === 'lucia' ? /190|54/ : /170|69/);
  }
});

test('missing income and cross-price data are acknowledged instead of borrowed from the old case', () => {
  assert.match(answerFreeQuestion('marco', 'What income elasticities are supplied?').answer, /do not have/);
  const cross = answerFreeQuestion('marco', 'What are the cross-price elasticities for Offers A and B?');
  assert.match(cross.answer, /do not have/);
  assert.doesNotMatch(cross.answer, /3\.3|2\.4|1\.2/);
});

test('wrong-role questions redirect and computed quantities remain student work', () => {
  assert.match(answerFreeQuestion('lucia', 'What is the demand equation?').answer, /derive.*Marco/);
  assert.match(answerFreeQuestion('lucia', 'Are operating costs given?').answer, /Elena/);
  for (const question of ['Calculate the quantity at €150.', 'Give me TR and MR.', 'What is the optimal room price?', 'What is price elasticity at €170?', 'Solve the demand function.']) {
    const result = answerFreeQuestion('marco', question);
    assert.equal(result.factId, 'other', question);
    assert.doesNotMatch(result.answer, /84|1\.85|2\.666|155\.33/);
  }
});

test('greetings and bakery follow-ups are natural without revealing marginal products', () => {
  assert.match(answerFreeQuestion('marta', 'Hello').answer, /Hello.*Marta/);
  const result = answerFreeQuestion('paolo', 'And two?', { history: [{ question: 'What can one baker produce?', answer: '40 rolls' }] });
  assert.equal(result.factId, 'two'); assert.match(result.answer, /60/);
  assert.doesNotMatch(result.answer, /20 extra/);
  const third = answerFreeQuestion('paolo', 'And three?', {history:[{question:'What can one baker produce?',answer:'40 rolls'},{question:'And two?',answer:result.answer}]});
  assert.equal(third.factId, 'three'); assert.match(third.answer, /65/);
});

test('optional exercise numbers are available, but not purchase totals or decisions', () => {
  for (const [person, question, expected] of [
    ['marta', 'What are labour and ingredient costs?', /20.*0\.60/],
    ['marta', 'Can surplus rolls be resold?', /€0 resale value/],
    ['paolo', 'What do three bakers produce?', /65/],
    ['sofia', 'What are the wine prices?', /8.*12/],
    ['giulia', 'What is the estate stock?', /30/]
  ]) assert.match(answerFreeQuestion(person, question).answer, expected);
  assert.doesNotMatch(answerFreeQuestion('sofia', 'Calculate the purchase cost.').answer, /640|880/);
});

test('broad and vague questions offer topics without numerical evidence', () => {
  for (const actor of ['lucia', 'marco', 'elena']) for (const question of ['What can you tell me about hotel bookings?', 'Tell me more']) {
    const reply = answerFreeQuestion(actor, question);
    assert.equal(reply.factId, null); assert.doesNotMatch(reply.answer, /\d/);
  }
});
test('each hotel actor gives one complete point and refers other observations', () => {
  const lucia = answerFreeQuestion('lucia', 'What is the room price?');
  assert.match(lucia.answer, /170.*69/); assert.deepEqual(lucia.factIds, ['price', 'bookings']);
  assert.match(answerFreeQuestion('marco', 'What are your bookings?').answer, /190.*54/);
  for (const [actor, colleague, question] of [['lucia', 'Marco', 'What happened at €190?'], ['marco', 'Lucia', 'What happened at €170?']]) {
    const result = answerFreeQuestion(actor, question); assert.match(result.answer, new RegExp(colleague)); assert.doesNotMatch(result.answer, /\d/);
  }
  for (const actor of ['lucia', 'marco']) {
    const reply = answerFreeQuestion(actor, 'Give me both observations');
    assert.doesNotMatch(reply.answer, actor === 'lucia' ? /190|54/ : /170|69/);
  }
});
test('actors check a submitted demand function without supplying or correcting it', () => {
  for (const equation of ['P = 262 - (4/3)Q', 'P(Q)=262-1.3333Q', 'Q = 196.5 - 0.75P']) {
    const reply = answerFreeQuestion('marco', 'Is my equation '+equation+' correct?');
    assert.match(reply.answer, /Yes.*\?/); assert.doesNotMatch(reply.answer, /262|196|1\.333|0\.75/);
  }
  assert.match(answerFreeQuestion('lucia', 'Is P=260-1.3Q correct?').answer, /does not match/);
  for (const question of ['Check my revenue: 11730', 'Is my price elasticity -1.85 correct?', 'Verify my MR=262-2.6667Q']) assert.match(answerFreeQuestion('marco', question).answer, /workspace/);
});
test('repeated questions preserve facts and never disclose the second point', () => {
  const first = answerFreeQuestion('lucia', 'What are your bookings?');
  const repeated = answerFreeQuestion('lucia', 'What are your bookings?', {history:[{question:'What are your bookings?',answer:first.answer}]});
  assert.equal(repeated.answer, first.answer); assert.doesNotMatch(repeated.answer,/190|54/);
});
