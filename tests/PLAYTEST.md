# Synthetic playtest: original hotel case and game extensions

This browser run uses **200 scripted profiles**, not real students. It checks that the route works and rejects deliberately wrong TR, MR, elasticity, bakery and wine answers. It does not measure learning or a real class's completion rate.

- Seed: `20261028`; 40 novice, 120 typical and 40 advanced synthetic profiles.
- All 200 completed the guided path. No deliberately wrong TR, MR, elasticity, bakery or wine submissions were accepted.
- Estimated median time for typical profiles: **29.65 minutes**; novice: **35.7 minutes**; advanced: **25.4 minutes**. These are heuristic estimates using assumed reading and calculation times, not observed durations.
- Desktop and phone journeys were also checked in Guided and free-question modes. With no API key in the test environment, free-question mode used deterministic actor replies.

Run locally with `npm start`, then `npm test`, `npm run test:student`, and `npm run test:simulation`. A timed pilot with real students is needed to judge difficulty, naturalness of model conversations and educational value.
