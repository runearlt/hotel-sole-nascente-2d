import { SCENARIO } from './config.js';

export const round = (n, places = 2) => Math.round((n + Number.EPSILON) * 10 ** places) / 10 ** places;
export const eur = n => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n);

export function hotelAtPrice(price, config = SCENARIO.hotel) {
  const { intercept, slope } = config.demand;
  const requested = Math.max(0, (price - intercept) / slope);
  const sold = Math.min(requested, config.rooms);
  return { price, requested, sold, revenue: price * sold, capped: requested > config.rooms + 1e-8,
    elasticity: requested > 0 ? (1 / slope) * price / requested : null };
}
export function inverseHotel(quantity, config = SCENARIO.hotel) {
  return config.demand.intercept + config.demand.slope * quantity;
}
export function revenueBestHotel(config = SCENARIO.hotel) {
  const unconstrained = -config.demand.intercept / (2 * config.demand.slope);
  const rooms = Math.min(config.rooms, Math.max(0, unconstrained));
  return { rooms, price: inverseHotel(rooms, config), revenue: rooms * inverseHotel(rooms, config), unconstrained };
}
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
