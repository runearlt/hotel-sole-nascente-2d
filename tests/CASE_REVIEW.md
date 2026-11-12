# Case and mathematics review

Reviewed on 11 November 2026 against the supplied `1. EN - Case.doc`, especially Table 3 and questions 4.1.1–4.1.4. This file records developer and instructor checks; it is not served to students or included in actor prompts.

## Development website findings

The deployed development site still serves an illustrative scenario with 80 rooms, euro reference prices of 170 and 190, and inverse demand `P = 262 − (4/3)Q`. Its calculations belong to that demonstration, not the supplied hotel case. The verified remote `development` revision was `9b07f64c2f53e1eb99c331986534eca22aaf5f8f`.

The prepared replacement uses the original 78-room hotel in Sirmione on Lake Garda. Table 3 prices use DKK and quantities refer to customer-group room-nights. The group demand estimates must not be capped at nightly physical room capacity without a matching period. The case does not supply a hotel cost function, so the game must not claim to calculate a profit-maximizing nightly rate.

## Independent numerical checks

For inverse demand `P = a + bQ`, use `Q = (P − a)/b` and `dQ/dP = 1/b`. The inverse-demand slope is not the direct-demand derivative.

| Group | Inverse demand | Q at DKK 1,400 | dQ/dP | Point price elasticity |
| --- | --- | ---: | ---: | ---: |
| A | P = 2400 − 0.05Q | 20,000 | −20 | −1.40 |
| B | P = 2100 − 0.07Q | 10,000 | −14.285714… | −2.00 |
| C | P = 1800 − 0.06Q | 6,666.666667… | −16.666667… | −3.50 |

Elasticity is `(dQ/dP) × P/Q`. Group A has the smallest absolute elasticity at this price. All three groups have elastic demand at this price; least sensitive does not mean inelastic. The exercise now requires two-decimal accuracy and a written explanation and assumptions, rather than numbers alone.

Supporting group A revenue work is `TR(Q) = 2400Q − 0.05Q²` and `MR(Q) = 2400 − 0.10Q`. This is supporting practice, not a separately numbered question in the supplied case. Zero, missing, wrong-sign and nearby incorrect coefficients are rejected.

## Interpretation and modeling

- Income elasticities 1.5, 2.8 and 2.4 indicate positive, more-than-proportional responses to income, with other factors fixed. These are elasticities, not coefficients to copy into a linear demand equation.
- Positive cross-price elasticities for Offer A are consistent with substitutes; negative ones for Offer B are consistent with complements. Possible product examples are interpretations, not uniquely identified facts.
- A model such as `Q = α + βP + γI + δPs + θPk` should normally have `β < 0`, `γ > 0`, `δ > 0`, `θ < 0` under the specified assumptions. Coefficient magnitudes require defined units and estimation data.
- Rental restrictions, weather, local opposition to tourism and changing incomes are case evidence to discuss. A changed price or a baseline demand shift does not by itself prove that the Ps or Pk sensitivity coefficients changed. Students must explain mechanisms and uncertainty.
- Written reasoning is stored for instructor review. Character counts and selected signs cannot certify the quality of an explanation.

## Optional extensions

The bakery and wine tasks are separate illustrative euro exercises. Their data must not be described as original-case observations or inferred from Table 3.

Bakery order costs are €44, €76 and €99 for one, two and three bakers; contract contributions are €76, €104 and €81. The third plan incurs ingredient costs on all 65 rolls, although only 60 guests can be served.

Wine uses 60 resident dinner guests plus 20 outside diners, independently of hotel demand calculations. The default forecast is now consistently 80 dinners. House-only purchasing costs €640; a mix of 60 estate and 20 house bottles costs €880. Tasting scores do not establish willingness to pay or a profit effect.

## Actor delivery

Actors now share the relevant approved facts through the same fact source in Guided and free-question modes. Factual requests for equations are distinguished from requests for worked solutions. A group-specific demand question returns that group's curve; brief follow-ups, greetings and two-part factual questions are supported. Income, cross-price and case-event evidence can be requested from the responsible hotel staff.

When an API is configured, each reply is grounded in the approved content selected for that turn and the character's voice. Client-supplied prior answers are not treated as case evidence. Incomplete replies, numerical inventions, omitted required quantities and common worked solutions fall back to approved responses. These checks are not a guarantee against every possible semantic error; live model quality still requires a pilot.

With no API key, conversations use deterministic, conversational replies and do not incur model charges. No live paid model calls were used for verification.

## Release status

The reviewed release is published on `open-version-api` (Open version API). The Render service must deploy that branch to receive these changes; publishing a GitHub branch alone does not update an existing service tracking `development`. The site can run the local conversational fallback as static files; `/api/actor` requires a Node web service using `npm ci --omit=dev` and `npm start`. The Blueprint selects the free plan. An API key is configured separately as a server secret.
