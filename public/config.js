// Illustrative bakery and winery extensions. Hotel case facts live in case-hotel.js.
import { HOTEL_DEMO } from './hotel-demo.js';

export const SCENARIO = Object.freeze({
  hotel: HOTEL_DEMO,
  label: 'Game extensions · illustrative data',
  breakfast: {
    guests: 60, revenuePerBreakfast: 3, rollsPerGuest: 1, fixedOvenCount: 1,
    batchHours: 1,
    plans: [
      { bakers: 1, rolls: 40, labour: 20, ingredients: 24 },
      { bakers: 2, rolls: 60, labour: 40, ingredients: 36 },
      { bakers: 3, rolls: 65, labour: 60, ingredients: 39 }
    ]
  },
  wine: {
    outsideDiners: 20,
    dinnerGuests: 80,
    bottlesPerDiner: 0.5,
    estateLimit: 30,
    options: [
      { id: 'house', name: 'Coastal house wine', price: 8, available: 100, tasting: 'Fresh and easy to pair; tasting panel score 7/10.' },
      { id: 'mixed', name: 'Estate stock first then house wine', price: null, available: 100, tasting: 'Use estate stock up to the order requirement, then house wine. Estate scored 9/10 in the small panel; only 30 bottles are available.' }
    ],
    estatePrice: 12
  }
});

export const ACTORS = Object.freeze({
  hotel: {
    name: 'Lucia', role: 'Hotel manager', personality: 'Practical, careful with claims',
    objective: 'Use the linked EUR demonstration to derive revenue functions, calculate elasticity and test a room rate.',
    knownFacts: ['80-room nightly capacity', '€170 with 69 requested rooms', '€190 with 54 requested rooms'],
    model: 'Students derive linear demand from observations held by different staff members.',
    assumptions: ['Comparable season, booking window, competitors and service', 'No room-level cost function supplied'],
    introduction: 'Welcome. I can share our supplied prices and bookings so you can investigate the room-rate decision.',
    openingQuestion: 'price'
  },
  bakery: {
    name: 'Marta', role: 'Bakery owner', personality: 'Warm, busy, conscious of waste',
    objective: 'Fill the hotel order without paying for unneeded production.',
    knownFacts: ['The hotel needs 60 rolls', 'Output with one, two, and three bakers', 'Labour and ingredients costs'],
    model: 'Discrete output and cost plans from SCENARIO.breakfast; one oven stays fixed.',
    assumptions: ['One roll per served guest', 'No resale value for leftover rolls'],
    introduction: 'The hotel needs breakfast rolls tomorrow. I can hire extra bakers, but we still have one oven.',
    openingQuestion: 'order'
  },
  winery: {
    name: 'Sofia', role: 'Winemaker', personality: 'Curious, candid about supply limits',
    objective: 'Supply wine the hotel can explain and afford.',
    knownFacts: ['Two wine purchasing options', 'Prices, supply limits, and small tasting-panel scores'],
    model: 'Explicit bottle purchasing costs; tasting is evidence, not a profit or satisfaction forecast.',
    assumptions: ['One 750 ml bottle shared by two adult diners choosing wine; an illustrative purchasing forecast'],
    introduction: 'Come in. The hotel can buy a reliable house wine or include a limited estate reserve. Let’s compare what we actually know.',
    openingQuestion: 'options'
  }
});
