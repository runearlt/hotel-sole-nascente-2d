export const HOTEL_DEMO = Object.freeze({
  name: 'Hotel Sole Nascente', label: '80-room EUR demonstration', rooms: 80,
  referencePrice: 170, comparisonPrice: 190,
  observations: Object.freeze([{ price: 170, requested: 69 }, { price: 190, requested: 54 }]),
  demand: Object.freeze({ intercept: 262, slope: -4 / 3 }),
  conditions: 'Same season, booking window, competitor prices and service conditions in both examples.',
  costStatus: 'Hotel operating and room-level cost data have not been supplied.'
});
