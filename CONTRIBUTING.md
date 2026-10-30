# Working on Hotel Sole Nascente

`main` is the stable version. `development` is the working version deployed at [the development game](https://hotel-sole-nascente-2d-dev.onrender.com/). Do not edit either branch directly for routine changes.

1. Create a short branch from `development`, such as `feature/clearer-elasticity-feedback`.
2. Make one focused change and run the tests below.
3. Open a pull request into `development`. Explain the economics goal and show the student path you checked. The Student exercise checks run automatically on every pull request to `development` or `main`.
4. Have a teammate review the teaching logic and the interface. Merge only after the checks pass.
5. Check the development Render site. When a version is ready for students or colleagues, open a separate pull request from `development` into `main`.

## Local checks

Install once with `npm ci` and `npx playwright install chromium`. Then start a local server with `python3 -m http.server 8174 --directory public` and run:

```sh
npm test
npm run test:student
npm run test:simulation
```

The student journey clicks visible controls through the full hotel, bakery, and vineyard exercises at desktop and mobile widths. The 200-profile simulation probes calculations, mistakes, hints, and retries. Both are automated tests, **not evidence that real students learned or finished in 30 minutes**. Timed classroom observation and student feedback remain necessary.
