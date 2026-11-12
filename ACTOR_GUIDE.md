# Hotel case and actor interaction rules

The active scenario remains the instructor-selected 80-room EUR demonstration from https://hotel-sole-nascente-2d.onrender.com/. This replaces the original 78-room DKK document. Hotel observations are €170 with 69 rooms requested and €190 with 54 requested, for one night under comparable conditions. The demand function is a student result, never supplied case information.

## Decisions from the 20 interaction questions

| Question | Implemented behaviour |
| --- | --- |
| 1 | Broad questions receive an introduction or role scope and topics to ask about, without numbers. |
| 2 | A specific request for price or bookings receives one complete price–quantity point. |
| 3 | Lucia holds €170 / 69; Marco holds €190 / 54. |
| 4 | Each gives only their own point and names the colleague holding the other. |
| 5 | Requests for the demand function receive the actor's own point and a reminder to derive it. |
| 6 | A submitted linear function can be checked; a correct function receives confirmation and a reflective question, never a restated solution. Incorrect functions receive no corrected equation. |
| 7 | Actors supply raw case information; mathematical methods and hints belong to the workspace. |
| 8 | Requests at a new price return the actor's own observation, never a forecast calculated for the student. |
| 9 | Revenue, elasticity and MR checking belongs to the workspace. |
| 10 | API replies use distinct professional voices. |
| 11 | Replies normally contain one to three sentences. |
| 12 | Vague follow-ups suggest two topics. |
| 13 | Each actor remembers the current page session; reload or restart clears conversation memory. Notebook evidence remains saved. |
| 14 | Actors receive only their own conversation questions. Information from colleagues is known only if the student mentions it. |
| 15 | Repeated questions restate the same permitted facts without adding new evidence. |
| 16 | Missing information is acknowledged; estimates are not invented. |
| 17 | Visible job titles and short responsibility descriptions identify each actor's remit. |
| 18 | All interviews use free text; prepared question buttons and Guided mode have been removed. |
| 19 | Students collect the observations, conditions, capacity and missing-cost information, then correctly derive demand before progressing to TR/MR. |
| 20 | Hotel is the main case; optional exercises have explicit, plausible time, cost and purchasing assumptions. |

`public/hotel-demo.js` holds the scenario and internal reference coefficients. `public/case-hotel.js` validates workspace work. `public/demand-check.js` checks only a supplied equation in the forms P=a+bQ or Q=a+bP, including decimal and fractional coefficients; unsupported forms are not graded by the actor. These checks do not generate or expose a corrected equation. The browser's reference calculations are teaching validation, not a secure examination answer store.

Elena supplies capacity and acknowledges missing operating costs. Neither income nor cross-price estimates are supplied. Optional bakery production is a one-hour breakfast batch: labour €20 per baker, ingredients €0.60 per roll, and a bread-service contract paying €3 per served guest rather than a full breakfast price. Output observations remain 40/60/65 rolls. Optional wine assumes 60 resident and 20 outside adult diners choosing wine, sharing one 750 ml bottle per two diners; estate stock is 30 bottles. These are illustrative assumptions, not market estimates or a consequence of the student's room-rate decision.

## API and state handling

`server/role-cards.js` builds an actor-specific card from the canonical factual observations. It includes a professional voice, responsibilities, two suggested topics, permitted facts, disclosure rules and colleagues' job titles. It never includes another actor's numerical observation or the answer key. `server/actor-api.js` lets the model interpret the question, select relevant evidence and compose its own response. It does not pass a predetermined answer to rephrase.

The Responses request uses strict structured output with `answer`, `factIds` and `kind`. The server checks role-owned IDs, at most two facts per response, numerical evidence, a complete own observation, comparable conditions, missing costs, brief answers and calculation boundaries. Lucia's single complete point credits both the price and bookings milestones. Unsupported or rejected output uses clearly labelled case facts. These checks cover tested failure patterns; a funded conversational pilot remains necessary for semantic and style evaluation.

Requests for worked solutions and checks of submitted demand functions are handled deterministically, without a model call. A correct submitted function receives confirmation and a reflective question, not a restated equation. Revenue, MR and elasticity checks remain in the workspace.

`server/conversations.js` stores only the current actor's validated replies and student questions. Browser-provided histories and runtime overrides are ignored. Session cookies separate students; an in-memory page ID separates reload/restart sessions; actor IDs separate colleagues. The server sends up to six own turns, not another actor's conversations. History expires after 30 minutes of inactivity, is bounded in memory and is lost on server restart. Browser notebooks remain persistent and separate from conversational memory.

Case versions 1/2 are archived before restarting hotel work under version 3. Old wine work is archived before applying shared-bottle assumptions; bakery work remains saved. Drafts survive hints, notebook navigation and reloads. `public/student-case.html` provides the written introduction while withholding the observations and demand function for investigation.

## Offline mode and usage controls

`ACTOR_API_MODE` defaults to `offline`. In this mode no provider call is made even if `OPENAI_API_KEY` exists. `live` must be explicitly selected later. Test-only `mock` transport can be injected by the local test harness, but cannot be enabled through the production environment or a student request. It never uses the default external fetch implementation.

The key stays server-side. Never put it in source or the browser. `.env.example` contains names/defaults only; actual `.env` files are ignored by Git. The normal start command reads environment variables, not an automatic .env loader.

Visible labels distinguish AI replies (`model`), simulated offline test replies (`mock`), student-work rules (`boundary`) and case-fact fallback (`fallback`). The notebook records source, reason and available request IDs. A status endpoint reports configuration only, with `providerVerified: false`; it does not claim a successful paid call.

Usage controls cap output tokens, timeout, concurrent attempts, attempts per minute by session/socket IP, and attempts per process per UTC day. There are no automatic retries. The counters are in memory; they are not a persistent financial budget. Defaults and exact setup are in `RENDER_ACTIVATION.md`.

## Verification

`npm run test:offline` starts an isolated mock server, blocks external fetch calls, strips test-process API credentials, runs unit/HTTP checks, desktop/phone journeys and 100 synthetic student profiles. Every synthetic student receives a separate cookie session. A report is written to `test-artifacts/offline-verification.json`; logs and screenshots remain in that ignored directory. These mocks test the protocol, case rules and workflow, not the future model's reasoning quality or real learning outcomes.

The future live command is `npm run test:api:live -- --allow-paid https://hotel-sole-nascente-2d-case-conversations.onrender.com/`. Without the explicit flag it sends no network request. With it, it checks configuration and sends up to three paid factual questions; source, request ID and actor-owned values must pass. No such funded check is part of this preparation goal. See `RENDER_ACTIVATION.md` for activation and follow-up human pilot questions.
