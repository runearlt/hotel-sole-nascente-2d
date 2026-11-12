import './no-paid-calls.mjs';
const {createGameServer,converse}=await import('../server/server.js');
const {runtimeConfig}=await import('../server/runtime-config.js');
const {mockProvider}=await import('./mock-provider.mjs');
const mock=process.argv.includes('--mock');
const config={...runtimeConfig(),callsPerDay:10000,callsPerSessionMinute:1000,callsPerIpMinute:10000};
const server=createGameServer({config,converseFn:(body,options)=>converse(body,{...options,key:'',mode:mock?'mock':'offline',...(mock?{fetcher:mockProvider}:{})})});
server.listen(Number(process.env.PORT||8174),'127.0.0.1',()=>console.log(`Offline ${mock?'MOCK transport':'case-fact'} server http://127.0.0.1:${server.address().port}/ — paid calls disabled`));
