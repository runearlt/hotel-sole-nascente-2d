import { SCENARIO } from './config.js';

export const round = (n, places = 2) => Math.round((n + Number.EPSILON) * 10 ** places) / 10 ** places;
export const eur = n => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n);

export function hotelAtPrice(price, config = SCENARIO.hotel) {
  const requested = Math.max(0, (price - config.demand.intercept) / config.demand.slope);
  const sold = Math.min(requested, config.rooms);
  return { price, requested, sold, revenue: price * sold, capped: requested > config.rooms,
    elasticity: requested > 0 ? price / (config.demand.slope * requested) : null };
}
export const inverseHotel = (quantity, config = SCENARIO.hotel) => config.demand.intercept + config.demand.slope * quantity;
export function revenueBestHotel(config = SCENARIO.hotel) {
  const unconstrained = -config.demand.intercept / (2 * config.demand.slope);
  const rooms = Math.min(config.rooms, Math.max(0, unconstrained));
  const price = inverseHotel(rooms, config);
  return { rooms, price, revenue: price * rooms, unconstrained };
}

export function bakeryOutcome(plan, config = SCENARIO.breakfast) {
  const served = Math.min(config.guests, plan.rolls);
  const revenue = served * config.revenuePerBreakfast;
  const orderCost = plan.labour + plan.ingredients;
  return { ...plan, served, leftover: plan.rolls - served, revenue, orderCost, contribution: revenue - orderCost,
    serviceRate: served / config.guests };
}
export function wineOutcome(choice, config = SCENARIO.wine, bottles = Math.ceil(config.dinnerGuests * config.bottlesPerDiner)) {
  if (choice === 'mixed') {
    const estate = Math.min(config.estateLimit, bottles);
    return { choice, bottles, estate, house: bottles - estate, cost: estate * config.estatePrice + (bottles - estate) * config.options[0].price };
  }
  return { choice: 'house', bottles, estate: 0, house: bottles, cost: bottles * config.options[0].price };
}
