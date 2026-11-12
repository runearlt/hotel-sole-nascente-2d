const integer=(env,name,fallback,min,max)=>{
  if (!env[name]) return fallback;
  const value=Number(env[name]);
  if (!Number.isInteger(value) || value<min || value>max) throw new Error(`Invalid ${name} configuration.`);
  return value;
};
export function runtimeConfig(env=process.env) {
  const mode=env.ACTOR_API_MODE || 'offline';
  if (!['offline','live'].includes(mode)) throw new Error('ACTOR_API_MODE must be offline or live.');
  return {mode,model:env.OPENAI_MODEL||'gpt-5-mini',
    timeoutMs:integer(env,'ACTOR_TIMEOUT_MS',15000,100,30000),
    maxOutputTokens:integer(env,'ACTOR_MAX_OUTPUT_TOKENS',800,200,1600),
    callsPerDay:integer(env,'ACTOR_MAX_CALLS_PER_DAY',400,1,100000),
    callsPerSessionMinute:integer(env,'ACTOR_CALLS_PER_SESSION_MINUTE',20,1,1000),
    callsPerIpMinute:integer(env,'ACTOR_CALLS_PER_IP_MINUTE',120,1,10000),
    concurrency:integer(env,'ACTOR_MAX_CONCURRENT_CALLS',4,1,20)};
}

// A process-local hard cap on paid call attempts; failures also consume an attempt.
export class UsageControl {
  constructor(config,now=Date.now) {this.config=config;this.now=now;this.windows=new Map();this.active=0;this.day='';this.count=0;}
  reserve(session='direct',ip='direct') {
    const now=this.now(),day=new Date(now).toISOString().slice(0,10);
    if (day!==this.day) {this.day=day;this.count=0;}
    if (this.count>=this.config.callsPerDay) return {reason:'daily_limit'};
    if (this.active>=this.config.concurrency) return {reason:'concurrency_limit'};
    const entries=[[`session:${session}`,this.config.callsPerSessionMinute,'session_rate_limit'],[`ip:${ip}`,this.config.callsPerIpMinute,'ip_rate_limit']];
    for (const [key,limit,reason] of entries) {
      const recent=(this.windows.get(key)||[]).filter(t=>now-t<60000);this.windows.set(key,recent);
      if (recent.length>=limit) return {reason};
    }
    for (const [key] of entries) this.windows.get(key).push(now);
    if (this.windows.size>2000) for (const [key,times] of this.windows) if (!times.length || now-times.at(-1)>=60000) this.windows.delete(key);
    this.count++;this.active++;
    let released=false;
    return {release:()=>{if (!released) {this.active--;released=true;}}};
  }
}
