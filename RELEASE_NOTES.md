# API version

The conversation engine now lets the model interpret a free-text question, choose evidence from the selected actor's permitted card and compose a response. The server validates evidence and teaching boundaries before crediting progress. It no longer gives the model a fixed answer to rephrase.

The daily model-attempt allowance is 400, covering the planned 350 daily prompts with room for testing.

The release keeps each actor's memory separate, gives Lucia and Marco only their own hotel observation, preserves student calculations, and provides a written student case. Optional exercises clarify the one-hour bakery batch, zero resale value for surplus rolls, shared wine bottles and the predefined estate-first mixed plan.

`ACTOR_API_MODE=offline` is the default, including when a secret key is already configured. Visible labels distinguish AI, offline test simulation, student-work rules and case-fact fallback. Timeouts, conservative call limits, bounded memory and explicit live-test consent are implemented.

Verified offline: 48 unit/HTTP tests, desktop and phone journeys, 100 independent synthetic student profiles, 1,500 mock replies with zero unintended fallbacks, and an isolated production install/start. No deliberately wrong tested calculation or profit claim was accepted. Paid model calls: zero. See `tests/OFFLINE_VERIFICATION.json` and `PREPARATION_AUDIT.md` for evidence and limits.

Start locally with `npm ci` and `npm run start:offline`. Reproduce the full checks with `npm run test:offline`. Follow `RENDER_ACTIVATION.md` to deploy offline and later activate funded requests. Live model behaviour and hosted deployment remain unverified in this release.
