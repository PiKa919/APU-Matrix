# Hardening Task 6: Leaderboard release readiness

Status: complete

## Scope

- Added `tests/leaderboard-integration.test.jsx` as the automated integration portion of Task 6.
- Kept the test at the existing Dashboard, LeaderboardStage, TanStack definition, and table boundaries.
- No production components, CSS, dependencies, routes, datasets, or scraper files required changes for this task.
- Browser/computer checks were intentionally not performed; the controller owns that verification.

## TDD evidence

- RED: the first focused run exposed two test-harness failures because the new Dashboard integration tests did not stub `window.matchMedia`, which `ThemeToggle` requires. After adding the existing minimal matchMedia test stub, the focused test exercised the intended behavior and passed without production changes.
- GREEN: `bun run test -- tests/leaderboard-integration.test.jsx` — 1 file, 6 tests passed, output clean.

## Coverage added

- Polite loading status while Dashboard requests are pending.
- Alert error state and retry of both device and benchmark requests.
- CPU, AI, AnTuTu, and GPU switching with only one populated chart mounted at a time.
- Honest GPU unavailable state.
- Zero-result filter reset.
- Chart caption and sibling-variant connector explanation.
- TanStack definition pointer/keyboard/focus flags and equivalent tooltip metadata payloads.
- Chart-definition identity stability across benchmark-table pagination, search, and sorting.

## Final verification

- Focused integration tests: 6 passed.
- Full suite: 20 files, 125 tests passed.
- ESLint: passed with no warnings.
- Next.js build: passed.
- Build route audit: only `/`, `/_not-found`, `/api/benchmarks`, and `/api/devices` were emitted; no `/api/scrape/` route.
- Build/import audit: no `MongoDB credentials not found`, Chart.js, scraper, or MongoDB public-runtime residue found.

## Concerns

- Responsive, dark/light, pointer, keyboard, and screenshot verification remain pending for the controller's browser/computer-use pass, as required by the task brief.

## Review-gap closure

- Replaced the mocked TanStack chart surface in the integration suite with real SVG rendering. The test now asserts the rendered chart is an SVG with `tabindex="0"`, retains the chart description, and exposes the configured definition tooltip payload alongside the rendered benchmark metadata. It does not claim a jsdom pointer or keyboard tooltip event was simulated; browser interaction remains controller-owned.
- Added a `createChartScene` assertion that verifies the exact-generation sibling connector mark has three distinct geometry points for the Samsung sibling series.
- Updated retry coverage so the initial `/api/devices` and `/api/benchmarks` requests both fail, the UI exposes both error states, Refresh retries both endpoints, and the recovered device/benchmark surfaces render.
- Replaced the impossible zero-result processor value with valid `Samsung` and `Tensor G4` options whose combination has no matching point.
- Fixed the confirmed mobile overflow root cause with the single explicit shrinkable page-grid track: `.page-content { grid-template-columns: minmax(0, 1fr); }`.

## Fresh verification after review-gap closure

- Focused: `bun run test -- tests/responsiveCss.test.js tests/leaderboard-integration.test.jsx` — 2 files, 8 tests passed.
- Full suite: `bun run test` — 21 files, 127 tests passed.
- Lint: `bun run lint` — passed with no warnings.
- Build: `bun run build` — passed; emitted only `/`, `/_not-found`, `/api/benchmarks`, and `/api/devices`.
- Runtime/build-input audit: clean; no MongoDB warning, scraper route, or legacy Chart.js residue.
- `git diff --check` — clean.
- Browser/computer screenshots and viewport measurements remain intentionally unperformed; the controller owns that verification.
