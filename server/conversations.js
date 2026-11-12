import { randomUUID } from 'node:crypto';

export class Conversations {
  constructor({now=Date.now,ttl=30*60*1000,max=200}={}) {this.now=now;this.ttl=ttl;this.max=max;this.sessions=new Map();}
  session(req,res) {
    const id=String(req.headers.cookie||'').match(/(?:^|;\s*)sole_session=([a-f0-9-]{36})(?:;|$)/)?.[1];
    if (id && this.sessions.has(id)) {const record=this.sessions.get(id);if (this.now()-record.touched<this.ttl) {record.touched=this.now();return id;}this.sessions.delete(id);}
    for (const [key,value] of this.sessions) if (this.now()-value.touched>=this.ttl) this.sessions.delete(key);
    if (this.sessions.size>=this.max) this.sessions.delete(this.sessions.keys().next().value);
    const next=randomUUID();this.sessions.set(next,{touched:this.now(),actors:new Map()});
    const secure=Boolean(req.socket.encrypted) || req.headers['x-forwarded-proto']==='https';
    res.setHeader('Set-Cookie',`sole_session=${next}; HttpOnly; SameSite=Strict; Path=/${secure?'; Secure':''}`);
    return next;
  }
  key(body) {return `${typeof body.conversationId==='string' && /^[a-zA-Z0-9_-]{16,64}$/.test(body.conversationId)?body.conversationId:'default'}:${body.personId}`;}
  history(id,body) {return this.sessions.get(id)?.actors.get(this.key(body))||[];}
  record(id,body,reply) {
    const session=this.sessions.get(id);if (!session) return;
    const key=this.key(body);
    if (!session.actors.has(key) && session.actors.size>=28) session.actors.delete(session.actors.keys().next().value);
    session.actors.set(key,[...this.history(id,body),{personId:body.personId,question:body.question,answer:reply.answer}].slice(-6));
  }
}
