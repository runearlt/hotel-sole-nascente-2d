// Keep blank values and non-numeric types distinct from a genuine zero.
export function numericInput(value) {
  if(typeof value!=='number' && typeof value!=='string')return NaN;
  if(typeof value==='string' && !value.trim())return NaN;
  const number=Number(value);return Number.isFinite(number)?number:NaN;
}
export const closeNumber=(value,expected,tolerance=.0051)=>Number.isFinite(numericInput(value))&&Math.abs(numericInput(value)-expected)<=tolerance;
