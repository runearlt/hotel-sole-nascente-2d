import { SCENARIO } from './config.js';

export const round = (n, places = 2) => Math.round((n + Number.EPSILON) * 10 ** places) / 10 ** places;
export const eur = n => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n);

export function bakeryOutcome(plan, config = SCENARIO.breakfast) {
  const served = Math.min(config.guests, plan.rolls);
  const revenue = served * config.revenuePerBreakfast;
  const orderCost = plan.labour + plan.ingredients;
  return { ...plan, served, leftover: plan.rolls - served, revenue, orderCost, contribution: revenue - orderCost,
    serviceRate: served / config.guests };
}
export function wineOutcome(choice, config = SCENARIO.wine, bottles = config.dinnerGuests) {
  if (choice === 'mixed') {
    const estate = Math.min(60, bottles);
    return { choice, bottles, estate, house: bottles - estate, cost: estate * config.estatePrice + (bottles - estate) * config.options[0].price };
  }
  return { choice: 'house', bottles, estate: 0, house: bottles, cost: bottles * config.options[0].price };
}
