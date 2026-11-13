import test from 'node:test';
import assert from 'node:assert/strict';
import { converse } from '../server/server.js';
import { providerResponse } from './mock-provider.mjs';

const body = {personId:'lucia', question:'What is your reference room price?'};
const modelResponse = text => providerResponse(text+' Marco has another observation.',['price']);

test('missing configuration is distinguishable from a model reply', async () => {
  let called = false;
  const reply = await converse(body, {mode:'live',key:'',fetcher:()=>{called=true;}});
  assert.equal(called,false); assert.equal(reply.source,'fallback'); assert.equal(reply.reason,'missing_api_key');
});
test('accepted model output reports the configured model and provider request ID', async () => {
  const reply = await converse(body, {mode:'mock',key:'fake',fetcher:async()=>modelResponse('At €170 per room for one night, 69 rooms were requested.')});
  assert.equal(reply.source,'mock'); assert.equal(reply.model,'gpt-5-mini'); assert.equal(reply.requestId,'mock_request_not_live');
});
test('rejected model output is reported rather than silently mislabelled as AI', async () => {
  const reply = await converse(body, {mode:'mock',key:'fake',fetcher:async()=>modelResponse('P=262-(4/3)Q.')});
  assert.equal(reply.source,'fallback'); assert.equal(reply.reason,'model_output_rejected'); assert.equal(reply.requestId,'mock_request_not_live');
});
test('provider failures expose safe status categories without credentials', async () => {
  for (const [status,reason] of [[401,'authentication_error'],[403,'api_access_denied'],[404,'model_unavailable'],[429,'quota_or_rate_limit'],[500,'upstream_error']]) {
    const reply = await converse(body,{mode:'mock',key:'fake',fetcher:async()=>({ok:false,status,headers:new Headers({'x-request-id':'req_test'})})});
    assert.equal(reply.reason,reason); assert.equal(reply.source,'fallback'); assert.equal(reply.upstreamStatus,status); assert.equal(reply.requestId,'req_test');
    assert.doesNotMatch(JSON.stringify(reply),/fake/);
  }
});
