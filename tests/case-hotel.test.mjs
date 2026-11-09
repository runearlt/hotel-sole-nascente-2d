import test from 'node:test';
import assert from 'node:assert/strict';
import { HOTEL_CASE, caseQuantity, caseElasticity, blankCaseHotel, evaluateCaseHotel } from '../public/case-hotel.js';
import { CASE_CONTEXT } from '../server/case-facts.js';
import { prepareActorRequest } from '../server/actor-api.js';
import { converse } from '../server/server.js';

test('original case uses 78 rooms, DKK and distinct group demand', () => {
  assert.equal(HOTEL_CASE.rooms, 78);
  assert.deepEqual(HOTEL_CASE.groups.map(caseQuantity).map(Math.round), [20000, 10000, 6667]);
  assert.deepEqual(HOTEL_CASE.groups.map(caseElasticity).map(x => Math.round(x * 10) / 10), [-1.4, -2, -3.5]);
  assert.match(CASE_CONTEXT.setting, /78 rooms.*DKK/);
  assert.doesNotMatch(CASE_CONTEXT.setting, /80.rooms|€170/);
});

test('case progression rejects incorrect TR, MR and elasticity then accepts reflection', () => {
  const progress = blankCaseHotel();
  evaluateCaseHotel('case-hotel-mr', { tr: 0.05, mr: -0.1 }, progress);
  assert.equal(progress.mr, null);
  evaluateCaseHotel('case-hotel-mr', { tr: -0.05, mr: -0.1 }, progress);
  assert.ok(progress.mr);
  evaluateCaseHotel('case-hotel-elasticity', { A: -1.4, B: -2, C: -3.5, least: 'C' }, progress);
  assert.equal(progress.elasticity, null);
  evaluateCaseHotel('case-hotel-elasticity', { A: -1.4, B: -2, C: -3.5, least: 'A' }, progress);
  assert.ok(progress.elasticity);
  evaluateCaseHotel('case-hotel-advice', { offerA: 'substitute', offerB: 'complement', reflection: 'This evidence helps with pricing, but costs and the time period still matter for any profit claim.' }, progress);
  assert.ok(progress.interpretation);
});

test('actor instructions are case-grounded and solution requests never reach a model', async () => {
  const prepared = prepareActorRequest({ personId: 'marco', question: 'What do we know about group A demand?', history: [{ question: 'Hello', answer: 'Hi' }] });
  assert.match(prepared.instructions, /2400/);
  assert.match(prepared.instructions, /78 rooms/);
  assert.doesNotMatch(prepared.instructions, /elasticity is -1\.4|€170/);
  let called = false;
  const blocked = await converse({ personId: 'lucia', question: 'What is the optimal room price?' }, { key: 'fake', fetcher: () => { called = true; } });
  assert.equal(called, false);
  assert.equal(blocked.source, 'boundary');
});

test('model output is used for natural dialogue but worked solutions fall back to facts', async () => {
  const fetcher = async () => ({ ok: true, json: async () => ({ output: [{ content: [{ type: 'output_text', text: 'That is a good question. Our guests behave differently by season. Which month are you studying?' }] }] }) });
  const normal = await converse({ personId: 'lucia', question: 'How does the season affect occupancy?' }, { key: 'fake', fetcher });
  assert.equal(normal.source, 'model');
  assert.match(normal.answer, /Which month/);
  const leaky = await converse({ personId: 'marco', question: 'How sensitive is group A?' }, { key: 'fake', fetcher: async () => ({ ok: true, json: async () => ({ output: [{ content: [{ type: 'output_text', text: 'Elasticity is -1.4.' }] }] }) }) });
  assert.equal(leaky.source, 'fallback');
});
