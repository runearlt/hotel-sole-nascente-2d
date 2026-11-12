# Working on Hotel Sole Nascente

`main` is the stable version. `development` is the working version deployed at [the development game](https://hotel-sole-nascente-2d-dev.onrender.com/). Do not edit either branch directly for routine changes.

1. Create a short branch from `development`, such as `feature/clearer-elasticity-feedback`.
2. Make one focused change and run the tests below.
3. Open a pull request into `development`. Explain the economics goal and show the student path you checked. The Student exercise checks run automatically on every pull request to `development` or `main`.
4. Have a teammate review the teaching logic and the interface. Merge only after the checks pass.
5. Check the development Render site. When a version is ready for students or colleagues, open a separate pull request from `development` into `main`.

## API preparation branch

The current user-authorized API work is on `api-version`; retain the stable branches as the baseline. The active scope follows the OMEGA meeting and subsequent actor-disclosure decisions. Do not implement unresolved proposals for separate game worlds or shared private actor knowledge as if they were agreed requirements.

## Local checks

Install once with `npm ci` and install Playwright's Chromium where no supported browser is available. Run the complete preparation check with:

```sh
npm run test:offline
```

This starts a local injected mock transport and runs the unit, local HTTP, desktop/mobile and 100-profile checks. External provider requests are blocked. No API key is required. For manual offline exploration use `npm run start:offline`; use `npm run start:mock` for a visibly labelled simulated transport. Neither is a live-model test.

The browser journeys exercise the hotel before optional bakery and winery extensions. The synthetic profiles probe wrong calculations, hints, revisions and retries. They are not evidence that real students learned or finished within a particular time. See `tests/CASE_REVIEW.md` for the mathematics audit, `ACTOR_GUIDE.md` for disclosure rules and `RENDER_ACTIVATION.md` for later funded testing. CI uses the same offline verification command.
