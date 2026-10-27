// Demonstration scenario. Replace these values with instructor-approved case data before teaching.
export const SCENARIO = Object.freeze({
  label: 'Demonstration case · not observed hotel data',
  hotel: {
    name: 'Hotel Sole Nascente', rooms: 80, referencePrice: 170, comparisonPrice: 190,
    demand: { intercept: 262, slope: -4 / 3 },
    conditions: 'Same season, booking window, competitor prices, and service conditions in both examples.',
    costStatus: 'Hotel operating and room-level cost data have not been supplied.'
  },
  breakfast: {
    guests: 60, revenuePerBreakfast: 3, rollsPerGuest: 1, fixedOvenCount: 1,
    plans: [
      { bakers: 1, rolls: 40, labour: 20, ingredients: 24 },
      { bakers: 2, rolls: 60, labour: 40, ingredients: 36 },
      { bakers: 3, rolls: 65, labour: 60, ingredients: 39 }
    ]
  },
  wine: {
    outsideDiners: 20,
    dinnerGuests: 100,
    options: [
      { id: 'house', name: 'Coastal house wine', price: 8, available: 100, tasting: 'Fresh and easy to pair; tasting panel score 7/10.' },
      { id: 'mixed', name: 'Estate reserve plus house wine', price: null, available: 100, tasting: 'Estate reserve scored 9/10 in the same small panel, but only 60 bottles are available.' }
    ],
    estatePrice: 12
  }
});

export const ACTORS = Object.freeze({
  hotel: {
    name: 'Lucia', role: 'Hotel manager', personality: 'Practical, careful with claims',
    objective: 'Set a defensible room price without confusing room revenue with profit.',
    knownFacts: ['Current and comparison prices', 'Requested rooms', '80-room physical capacity', 'Comparable conditions'],
    model: 'Linear demand from SCENARIO.hotel.demand; room sales are capped at physical capacity.',
    assumptions: ['Same conditions across the two demonstration observations', 'No hotel cost function supplied'],
    introduction: 'Welcome to Hotel Sole Nascente. Let’s find out what our room prices tell us about bookings.',
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
    assumptions: ['One bottle per dinner booking for this classroom comparison'],
    introduction: 'Come in. The hotel can buy a reliable house wine or include a limited estate reserve. Let’s compare what we actually know.',
    openingQuestion: 'options'
  }
});
