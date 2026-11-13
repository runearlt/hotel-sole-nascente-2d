import test from 'node:test';
import assert from 'node:assert/strict';
import {hotelAtPrice,revenueBestHotel,bakeryOutcome,wineOutcome} from '../public/economics.js';
import {SCENARIO} from '../public/config.js';
import {answerFreeQuestion} from '../public/free-agents.js';
test('independently derived demand, elasticity and capped revenue agree across the price range',()=>{
 const p1=170,q1=69,p2=190,q2=54;
 const dqdp=(q2-q1)/(p2-p1),directIntercept=q1-dqdp*p1;
 for(let p=110;p<=220;p+=.5){
  const q=directIntercept+dqdp*p,sold=Math.min(80,q),result=hotelAtPrice(p);
  assert.ok(Math.abs(result.requested-q)<1e-10);
  assert.ok(Math.abs(result.sold-sold)<1e-10);
  assert.ok(Math.abs(result.revenue-p*sold)<1e-8);
  assert.ok(Math.abs(result.elasticity-dqdp*p/q)<1e-10);
 }
 const best=revenueBestHotel();
 for(let p=110;p<=220;p+=.01)assert.ok(hotelAtPrice(p).revenue<=best.revenue+1e-8);
 assert.equal(hotelAtPrice(300).requested,0);
 assert.equal(hotelAtPrice(300).elasticity,null);
});
test('extension accounts charge all output and keep independent forecasts separate',()=>{
 for(const plan of SCENARIO.breakfast.plans){const r=bakeryOutcome(plan);assert.equal(r.orderCost,plan.bakers*20+plan.rolls*.6);assert.equal(r.contribution,Math.min(plan.rolls,60)*3-r.orderCost);assert.equal(r.leftover,plan.rolls-Math.min(plan.rolls,60));}
 assert.deepEqual(wineOutcome('mixed'),{choice:'mixed',bottles:40,estate:30,house:10,cost:440});
 const previous=SCENARIO.breakfast.guests;
 try{SCENARIO.breakfast.guests=75;assert.match(answerFreeQuestion('giulia','What is the dinner forecast?').answer,/60 resident diners and 20 outside diners/);assert.equal(wineOutcome('house').bottles,40);}finally{SCENARIO.breakfast.guests=previous;}
});
