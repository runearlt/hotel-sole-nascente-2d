import test from 'node:test';
import assert from 'node:assert/strict';
import {numericInput,closeNumber} from '../public/input-checks.js';
test('blank, non-finite and non-numeric types never become a valid zero',()=>{
 for(const v of ['', '  ',null,undefined,true,false,[],[0],{},NaN,Infinity,'Infinity'])assert.equal(Number.isNaN(numericInput(v)),true,String(v));
 for(const v of [0,'0','0.00'])assert.equal(closeNumber(v,0),true);
 assert.equal(closeNumber('-1.3333',-4/3,.0001),true);
});
