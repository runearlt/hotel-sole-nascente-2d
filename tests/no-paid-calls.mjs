// Loaded before every offline test. Provider requests must use an injected mock.
process.env.ACTOR_API_MODE='offline';
delete process.env.OPENAI_API_KEY;
const networkFetch=globalThis.fetch;
globalThis.fetch=(input,options)=>{
  const url=new URL(typeof input==='string' || input instanceof URL?input:input.url);
  if (!['127.0.0.1','localhost','[::1]'].includes(url.hostname)) throw new Error('External network disabled during offline tests.');
  return networkFetch(input,options);
};
