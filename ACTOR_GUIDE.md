# Actor dialogue modes

The game starts by asking students to choose **Guided** or **Ask your own questions**. Both modes share the same case, notebook, calculations, decisions, and progress. Students can switch modes from the town screen without losing work. Existing saved games open in Guided mode.

Guided dialogue remains in `public/app.js` (`Q`). The free-question role cards are in [`public/free-agents.js`](public/free-agents.js). There is one card each for Lucia, Marco, Elena, Marta, Paolo, Sofia, and Giulia. Edit a card's `facts` to change what that person knows, `match` phrases to recognize more student wording, and `say` to change the short factual reply. `solutionBoundary` and `scopePrompt` control what the person says when asked for the answer or an unclear question. `instruction` records the role's teaching boundary for instructors and future model integration.

The current role agents run **locally in the browser**. They recognize questions against instructor-authored facts and never call an external AI service. That makes their replies predictable and avoids exposing the solved demand, MR, elasticity, staffing, or wine-order result through dialogue. The calculation workspaces still show the usual feedback after students submit their own work. Free-form wording outside the configured matches gets a clarification or a handoff; add new matches after reviewing real student questions.

Before teaching, check that any edited case numbers in `public/config.js` still agree with the dialogue facts, economics model, and exercise validations. Run `npm test` and `npm run test:student` before publishing; the browser journey covers both modes at desktop and phone sizes.
