# API version — supervised student pilot

The deployed hotel uses the agreed 80-room EUR demonstration case. Lucia supplies €170 / 69 rooms requested; Marco supplies €190 / 54. Each holds only their own observation. Students derive demand, revenue, marginal revenue and elasticity themselves. Actors can confirm a submitted demand equation without supplying a corrected equation, and cannot compute solutions. Bakery and wine are optional independent illustrations.

This audit corrected nonlinear equations being accepted as linear prefixes, equivalent equation notation, inconsistent rounding, blank values being treated as zero, premature worked-answer feedback, coupled bakery/wine forecasts, keyboard focus and Escape handling, duplicate chat submissions, common spelling errors, unsupported referrals and silent storage failures. Model responses are checked against role-specific evidence. Rejected responses use a visibly labelled factual fallback; missing information is acknowledged.

Verification: 58 unit/HTTP tests; desktop and phone browser journeys; 100 varied synthetic student journeys completed, including 20 simulated outage recoveries. No deliberately wrong tested calculation was accepted. Offline checks made zero paid calls. Synthetic timing estimates are not measured student completion times.

The approved hosted audit used 24 requests: 16 verified model replies, four labelled factual fallbacks and four deterministic student-work boundaries. All 24 functional checks passed. The initial sample revealed an unsupported referral; the final four checks verified its correction. Live API operation was verified against Render production commit 35a2438085fbcba4a6ee226cea15ee5d2fa1c7e6, with the key configured and live mode enabled. GET /api/status now exposes the deployed commit without exposing secrets. Status alone does not prove provider success; the live response IDs do.

Run npm ci, then npm run test:offline for reproducible unpaid checks. Live scripts require explicit --allow-paid approval. Render retains the default 400 model-attempt daily cap. Never put an API key in GitHub or browser code.

Pilot checklist:
- Ask Lucia and Marco separately for price and rooms requested; repeat with natural wording and a typo.
- Derive demand in the workspace, try an incorrect answer, then revise it.
- Complete revenue and elasticity work independently; ask Elena about capacity and unavailable costs.
- Explore optional bakery/wine assumptions, quantities and units without asking actors for solutions.
- Export the notebook, reload and verify saved progress; restart only after exporting.
- Record confusing replies and their source label, and have an instructor review written reasoning.

Limits: this is suitable for a supervised formative pilot, not a secure examination. Browser-delivered checks can be inspected. Synthetic tests do not establish learning outcomes. Free Render cold starts and provider failures can trigger labelled fallbacks. AI wording can still vary; instructors should monitor initial sessions.
