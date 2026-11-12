import { HOTEL_DEMO } from './hotel-demo.js';

// Check only an equation the student has already supplied; never generate an answer.
export function checkStudentDemand(text) {
  const source = String(text).replace(/[−–]/g, '-').replace(/\s+/g, ' ').replace(/\s*([=+\-/*()×])\s*/g, '$1').replace(/(\d)\s+([PQ])/gi, '$1$2').replace(/[×*]/g, '').replace(/\(([-+]?\d+(?:\.\d+)?\/\d+(?:\.\d+)?)\)/g, '$1');
  const numeric = '[+-]?(?:\\d+(?:\\.\\d+)?|\\.\\d+)(?:/\\d+(?:\\.\\d+)?)?';
  const equation = source.match(new RegExp(`([PQ])(?:\\([PQ]\\))?=(${numeric})([+-](?:\\d+(?:\\.\\d+)?|\\.\\d+)(?:/\\d+(?:\\.\\d+)?)?)([PQ])(?![\\dA-Za-z+*/-])`, 'i'));
  if (!equation || equation[1].toUpperCase() === equation[4].toUpperCase()) return null;
  const number = value => value.split('/').map(Number).reduce((left, right) => left / right);
  const intercept = number(equation[2]), slope = number(equation[3]);
  if (!Number.isFinite(intercept) || !Number.isFinite(slope)) return null;
  const inverse = equation[1].toUpperCase() === 'P';
  const predictions = HOTEL_DEMO.observations.map(({price, requested}) => inverse ? Math.abs(intercept + slope * requested - price) : Math.abs(intercept + slope * price - requested));
  return predictions.every(error => error <= 0.02);
}
