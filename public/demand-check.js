import { HOTEL_DEMO } from './hotel-demo.js';

// Parse student-supplied affine expressions without eval or executing student code.
// Coefficients remain browser-discoverable: this is formative feedback, not exam security.
function affine(expression, variable) {
  const tokens = expression.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|[PQ()+\-*/]/gi) || [];
  if (tokens.join('').toLowerCase() !== expression.replace(/\s/g, '').toLowerCase() || tokens.length > 100) throw new Error('Unsupported expression');
  let at = 0;
  const add = (x,y,sign=1) => [x[0]+sign*y[0],x[1]+sign*y[1]];
  const multiply = (x,y) => {if(x[1] && y[1]) throw new Error('Nonlinear expression');return [x[0]*y[0],x[0]*y[1]+x[1]*y[0]];};
  function atom() {
    const token=tokens[at++];
    if(token==='+' || token==='-') {const value=atom();return value.map(n=>token==='-'?-n:n);}
    if(token==='(') {const value=sum();if(tokens[at++]!==')')throw new Error('Unclosed expression');return value;}
    if(token?.toUpperCase()===variable)return [0,1];
    if(token && /^(?:\d|\.)/.test(token) && Number.isFinite(Number(token)))return [Number(token),0];
    throw new Error('Invalid expression');
  }
  function product() {
    let value=atom();
    while(at<tokens.length) {
      const token=tokens[at];
      if(token==='*' || token==='/') {
        at++;const next=atom();
        if(token==='/') {if(next[1] || next[0]===0)throw new Error('Invalid denominator');value=value.map(n=>n/next[0]);}
        else value=multiply(value,next);
      } else if(token==='(' || /^[PQ]$/i.test(token)) value=multiply(value,atom());
      else break;
    }
    return value;
  }
  function sum() {let value=product();while(tokens[at]==='+' || tokens[at]==='-'){const sign=tokens[at++];value=add(value,product(),sign==='-'?-1:1);}return value;}
  const value=sum();if(at!==tokens.length || value.some(n=>!Number.isFinite(n)))throw new Error('Invalid expression');return value;
}

export function checkStudentDemand(text) {
  const source=String(text).replace(/[−–]/g,'-').replace(/[×·]/g,'*').replace(/÷/g,'/');
  const left=source.match(/\b([PQ])(?:\(\s*([PQ])\s*\))?\s*=/i);
  if(!left)return null;
  const dependent=left[1].toUpperCase(),variable=dependent==='P'?'Q':'P';
  if(left[2] && left[2].toUpperCase()!==variable)return false;
  // Permit a trailing prose question, but never accept a mathematical prefix.
  if (/\b[PQ](?:\([^)]*\))?\s*=/i.test(source.slice(left.index+left[0].length)))return false;
  const right=source.slice(left.index+left[0].length).split(/[?!;\n]/)[0].replace(/\s+(?:is|correct|right|does|please|and|for)\b.*$/i,'').replace(/[.,]\s*$/,'').trim();
  if(!right || /\b[PQ](?:\([^)]*\))?\s*=/i.test(right))return false;
  try {
    const [intercept,slope]=affine(right,variable);
    if(slope===0)return false;
    const inverseIntercept=dependent==='P'?intercept:-intercept/slope;
    const inverseSlope=dependent==='P'?slope:1/slope;
    return Math.abs(inverseIntercept-HOTEL_DEMO.demand.intercept)<=0.0001 && Math.abs(inverseSlope-HOTEL_DEMO.demand.slope)<=0.0001;
  }catch{return false;}
}
