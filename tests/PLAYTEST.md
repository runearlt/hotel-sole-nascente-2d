# EUR demonstration verification

The current test suite uses the 80-room EUR demonstration selected by the instructor on 12 November 2026. This replaces the original 78-room DKK hotel exercise. See `CASE_REVIEW.md` for the numerical audit and `ACTOR_GUIDE.md` for disclosure rules.

Checks cover supplied observations versus calculated results, demand-derivation prerequisites, correct TR/MR and elasticity, the 80-room sales cap, profit-claim rejection, editable drafts and saved decisions, role-specific factual replies, one observation per actor, equation withholding and submitted-function confirmation, missing data and mocked model-output violations.

The browser journey covers desktop and phone using free-text interviews, main-hotel completion before optional exercises, draft recovery, revisions, notebook export and delayed actor replies. A separate migration check preserves prior DKK work in an archive and resets active hotel progress/history and outdated wine assumptions.

The simulation runs 100 scripted profiles with different mistakes, hints and rate choices (€150, €170 and €190), plus optional bakery, wine and street choices. These are synthetic tests, not real students, learning measurements or observed completion times. Any pacing estimates printed by the legacy simulation script are heuristic only.

Use a local server with model calls disabled. API behavior is tested with mocked responses; bulk browser tests must not consume paid live API credits. Publication and live model verification must be reported separately from local checks.

Latest local verification (12 November 2026): desktop 1280×800 and phone 390×844 completed the hotel, bakery and wine routes. All 100 synthetic browser profiles completed, with zero incorrect demand functions, TR/MR coefficients, elasticities, bakery plans, wine costs or profit claims accepted. The final release passed 48 unit/HTTP checks and used 1,500 explicitly labelled mock replies in the 100 profiles, with no unintended fallback and no live model replies. Actor selection, evidence validation and the HTTP session store were exercised through the real server protocol. Mock responses are deterministic and do not establish model quality. Screenshots are saved under ignored `test-artifacts/`.

Run the complete reproducible check with `npm run test:offline`. It blocks external fetch calls, removes test-process API keys, starts an injected local mock transport and writes logs plus `test-artifacts/offline-verification.json`. Each profile has a separate cookie session. The committed `tests/OFFLINE_VERIFICATION.json` records the passing snapshot, numerical rejection counts and runtime source hashes. Production dependency installation and `npm start` were also checked in an isolated matching source copy with offline mode and no key.

The future paid smoke test requires the explicit `--allow-paid` flag and checks the new Node deployment/configuration before sending three questions. It was not run with funded API access for this release. `RENDER_ACTIVATION.md` explains how to activate later and conduct a human conversation pilot.
