import test from 'node:test';
import assert from 'node:assert/strict';
import {checkStudentDemand} from '../public/demand-check.js';
test('equivalent student linear notation is checked without evaluating code',()=>{
 for(const text of ['P = 262 - (4/3)Q','P(Q)=262-4Q/3','P=262-Q*4/3','Q(P) = (262-P)*3/4','Q=0.75(262-P)','Is P=262-1.3333Q correct?','Q = 196.5 - .75P','P=2.62e2-4/3Q'])assert.equal(checkStudentDemand(text),true,text);
 for(const text of ['P=262-(4/3)Q^2','P=262-(4/3)Q**2','P=262-4/3Q+999','P=262-4/3Q/0','P=262-4/(3Q)','P(P)=262-4/3Q','P=262-4/3Q alert(1)','P=262-4/3Q+','P=262.01-4/3Q','P=262-1.3335Q','P=262-4/3Q and P=200-Q','P=262-4/3Q=0','P=260-1.3Q','P=Infinity-Q'])assert.equal(checkStudentDemand(text),false,text);
 assert.equal(checkStudentDemand('What is the demand function?'),null);
});
