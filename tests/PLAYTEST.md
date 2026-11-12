# Synthetic playtest · 11 November 2026

The revised local game was checked using **100 scripted profiles**, not real students. All 100 completed the hotel tasks and extension route. This tests programmed interactions and validation, not learning, student satisfaction or all possible written answers.

- Seed: `20261028`; 20 novice, 60 typical and 20 advanced synthetic profiles.
- The baseline 100-profile run passed but missed overly permissive TR/MR validation. Separate probes reproduced acceptance of zero, blank TR and an incorrect MR coefficient. Regression tests now reject those inputs.
- Revised simulations rejected all deliberately incorrect TR, MR, elasticity, demand-model signs, bakery plans and wine costs. All three final bakery plans, both wine options and all four case-event selections were exercised. Twenty-seven profiles also solved one of the optional street exercises after an incorrect choice, covering both street characters.
- Four visible-control journeys passed: desktop (1280 × 800) and phone (390 × 844), each in Guided and free-question modes. They completed the hotel before visiting either extension, checked draft retention across hints, notebook visits and reloads, revised a saved answer, verified the notebook JSON download, and followed the main action into each optional workspace.
- All 26 unit tests passed, including actor disclosure, follow-up context, model-response checks and extension arithmetic. No API key was configured: free-question browser journeys used deterministic fallback replies, not live model responses. A fresh server on port 8175 explicitly disabled paid API calls for verification.
- Hotel hints now follow the current exercise. Completed hotel work leads to the notebook; optional exercises remain in their own workspace until finished. Screenshots were inspected for layout on desktop and phone.
- The case audit added the written price-elasticity explanation, two-decimal numerical checks, group-specific factual replies, income and cross-price evidence, and case-event dialogue. A delayed-response browser check verifies that one character’s reply cannot appear as another character’s answer.
- Automated checks validate numerical answers and coefficient signs. Written interpretations, demand models and event analyses are saved for instructor review, not semantically graded.

Run locally with `npm start`, then `npm test`, `npm run test:student`, and `npm run test:simulation`. Simulation pacing estimates are heuristic, not measured student completion times. A real student pilot remains necessary. These results apply to local changes; the public Render deployment has not been updated.
