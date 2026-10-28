# Synthetic playtest: Hotel Sole Nascente

This is an automated browser exercise, **not a study with real students**. The 200 profiles are scripted and know how to correct an intentionally wrong answer after one feedback cycle. Their completion rate therefore tests whether the route remains functional; it does not estimate a real class's completion rate or learning gain.

## Method

- Seed: `20261028`; 40 novice, 120 typical, and 40 advanced synthetic profiles.
- Each profile visits the hotel, bakery, and vineyard; interviews the required people; submits the production, demand, TR/MR, price, elasticity, and purchasing work; and writes the required reflections. A seeded subset also tries the optional street utility task.
- Seeded profiles deliberately submit common wrong answers. The runner checks whether the game rejects them and whether the corrected submission reaches the next stage.
- Estimated minutes are a heuristic based on interview, navigation, form, retry, and hint counts plus assumed reading/calculation time. They are **not observed durations**. The 30-minute target needs a timed pilot with actual students.
- Run locally with `python3 -m http.server 8174 --directory public` and `node tests/simulate-students.mjs` from the repository root. Set `GAME_URL` if using another port.

## Results

| Check | Before | After |
| --- | ---: | ---: |
| Scripted journeys completed | 200/200 | 200/200 |
| Deliberately wrong hotel room predictions accepted | 76 | 0 |
| Typical-profile median estimated time | 31.0 min | 31.3 min |
| Novice-profile median estimated time | 37.4 min | 38.8 min |
| Advanced-profile median estimated time | 25.4 min | 25.9 min |

The final run additionally injected wrong TR coefficients. Zero wrong demand, TR, MR, bakery-plan, or wine-cost submissions were accepted. The optional utility task was solved in 50 seeded journeys. The final typical-profile estimate is close to, but slightly above, 30 minutes; the novice estimate is substantially longer.

## Design and teaching review

- **Observed browser behavior:** A hotel room-rate decision could previously be saved with wrong predicted requests or revenue. The game now asks for a correction before the decision is recorded, with feedback that distinguishes requested rooms from capacity-limited sales.
- **Teaching focus:** Students now enter both the Q-squared coefficient of total revenue and the Q coefficient of marginal revenue. This checks the TR-to-MR reasoning instead of only the final MR number.
- **Synthetic friction signal:** Re-entering already known bakery output was clerical work. The gathered output figures now remain visible in a compact reference table, while students still calculate marginal output, order cost, and guests served for all three plans.
- **Visual review:** Mobile dialogue and workspace text was increased. A 390-pixel browser check found no horizontal overflow; the long workspace scrolls vertically.

These points are design hypotheses from scripted paths and browser inspection, **not quotations or opinions from students**. A small real pilot should time the full exercise, observe where students seek help, and ask whether the feedback supports understanding without giving away the solution. The simulation does not validate educational effectiveness.
