# EUR demonstration mathematics and disclosure review

On 12 November 2026 the instructor explicitly chose to replace the original case with the linked demonstration at https://hotel-sole-nascente-2d.onrender.com/. This review supersedes the earlier 78-room DKK audit. It is developer/instructor material, not an actor prompt or a public student asset.

## Supplied information actors may disclose

- 80 rooms available for one night, prices in EUR.
- Reference observation: price €170, requested rooms 69.
- Comparison observation: price €190, requested rooms 54.
- Same season, booking window, competitor prices and service conditions.
- Operating and room-level costs are missing. No income or cross-price elasticities are given.

Lucia provides the reference observation, Marco the comparison and conditions, and Elena capacity and missing-cost information. The raw observations are supplied facts even though the model also reproduces them. Requests for quantities at other prices require student calculation.

## Independent calculation checks

The student must derive inverse demand `P(Q) = 262 − (4/3)Q`. Direct demand is `Qd(P) = 196.5 − 0.75P`. At €170 demand is 69; at €190 it is 54. Uncapped total revenue is `TR(Q) = 262Q − (4/3)Q²`; uncapped marginal revenue is `MR(Q) = 262 − (8/3)Q`.

Point price elasticity of requested rooms at €170 is `−0.75 × 170 / 69 = −1.847826…`, accepted as −1.85 to two decimal places. Students must also provide an explanation and assumptions.

Actual sales are `min(Qd(P), 80)`. At €150, 84 rooms are requested but only 80 can be sold, giving €12,000 room revenue rather than €12,600. At €170 revenue is €11,730; at €190 it is €10,260. Fractional demand is permitted in the continuous teaching model.

The capacity boundary is approximately €155.333333. The uncapped revenue-maximizing quantity would be 98.25 rooms, exceeding capacity. With the 80-room limit, maximum room revenue occurs at that capacity boundary. Neither result establishes maximum profit: operating costs are unknown. Uncapped MR must not be described as marginal revenue of capacity-capped sales.

## Student workflow and safeguards

Interview staff, correctly derive inverse demand from the two observations, derive TR/MR, calculate elasticity, then predict requested rooms, sold rooms and revenue for a chosen rate. Only checked arithmetic and a saved justification complete the main hotel route. Bakery, wine and street exercises remain optional. Previous DKK hotel work is archived rather than mixed into active EUR conversations.

Actors never supply demand equations, coefficients, worked quantities, elasticities, revenue functions or decisions. They may confirm a student-supplied demand function and ask a reflective question; they never restate or correct it. Numerical matching alone is not a semantic guarantee, so model replies also receive equation and teaching-boundary checks. Tests include equation requests including “do not solve,” submitted-function checking, solution requests, missing data, wrong-role routing and mocked model violations.

The bakery uses a one-hour batch with costs €44/€76/€99 and bread-service contract contributions €76/€104/€81. Labour is €20 per baker-hour; €3 is contract revenue per guest served, not the full hotel breakfast price. Wine assumes an independent forecast of 80 adult diners choosing wine and one shared 750 ml bottle per two diners: 40 bottles. House-only costs €320 and a 30-estate/10-house mix costs €440. Estate stock is 30 bottles. Actors give component data, not these worked totals or purchasing advice.
