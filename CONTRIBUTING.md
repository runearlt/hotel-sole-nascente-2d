# Working on Hotel Sole Nascente

`main` is the stable version. `development` is the working version deployed at [the development game](https://hotel-sole-nascente-2d-dev.onrender.com/). Do not edit either branch directly for routine changes.

1. Create a short branch from `development`, such as `feature/clearer-elasticity-feedback`.
2. Make one focused change and run the tests below.
3. Open a pull request into `development`. Explain the economics goal and show the student path you checked. The Student exercise checks run automatically on every pull request to `development` or `main`.
4. Have a teammate review the teaching logic and the interface. Merge only after the checks pass.
5. Check the development Render site. When a version is ready for students or colleagues, open a separate pull request from `development` into `main`.

## Local checks

Install once with `npm ci` and `npx playwright install chromium`. Then start the local server with `npm start` and run:

```sh
npm test
npm run test:student
npm run test:simulation
```

The student journey clicks visible controls through the main hotel case before the optional bakery and vineyard exercises at desktop and mobile widths, in both dialogue modes. The 100-profile simulation probes calculations, mistakes, hints, and retries. Both are automated tests, **not evidence that real students learned or finished in 30 minutes**. Timed classroom observation and student feedback remain necessary. See `tests/CASE_REVIEW.md` for the case and mathematics audit, and `tests/PLAYTEST.md` for verification scope.
