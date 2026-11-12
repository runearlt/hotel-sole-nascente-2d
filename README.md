# Hotel Sole Nascente API preparation

The hotel is the main exercise. Students interview staff using free text, collect one price–quantity point from Lucia and another from Marco, derive demand, then complete their own calculations. Bakery, wine and street activities are optional extensions.

## Run without API credits

```sh
npm ci
npm run start:offline
```

Open http://127.0.0.1:8174/. Replies are labelled **Case reply · Offline mode**. No key or API credits are needed. Even the normal `npm start` defaults to offline; live requests require an explicit `ACTOR_API_MODE=live` setting. `.env.example` documents the settings, but the app does not automatically load `.env` files.

For a visibly labelled deterministic simulation of the provider protocol, use `npm run start:mock`. Its replies say **Simulated reply · Offline test**. This tests software integration, not actual model quality.

## Verify the release offline

With Playwright and its browser installed, run:

```sh
npm run test:offline
```

The command starts an isolated local mock server, runs unit and HTTP checks, completes desktop and phone journeys, then runs 100 separate synthetic student profiles. It blocks external fetch calls, removes API credentials from test processes, and writes logs, screenshots and `test-artifacts/offline-verification.json`. No paid live test is included. On macOS the browser scripts use installed Chrome for automated checks; elsewhere install Chromium with `npx playwright install chromium`.

## How live conversations work

The model receives only the selected actor's fact card and that actor's server-recorded conversation. It interprets the question and selects evidence, returning a structured answer and fact IDs. The server validates role ownership, quantities, complete observations, disclosure limits and calculation boundaries before crediting progress. The deterministic reply is only an offline/error fallback, not a template the model must rephrase.

Lucia owns €170 with 69 rooms requested; Marco owns €190 with 54 requested. Actors never supply the demand equation or calculate solutions. A separate deterministic checker can confirm a student-submitted demand function without restating or correcting it. All other calculation checks belong in the workspace.

See [ACTOR_GUIDE.md](ACTOR_GUIDE.md) for all interaction rules, [RENDER_ACTIVATION.md](RENDER_ACTIVATION.md) for deployment and later funded testing, and [tests/CASE_REVIEW.md](tests/CASE_REVIEW.md) for the instructor mathematics audit.

## Verification limits

Mocked tests establish software behaviour and enforced boundaries against the tested examples. They do not establish the future model's conversational quality, account access, credit balance, classroom learning outcomes or hosted performance. Once credits are available, the explicit paid smoke test and a human conversation pilot remain necessary.
