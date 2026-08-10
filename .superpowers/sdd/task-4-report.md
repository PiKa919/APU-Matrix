# Task 4 Report: Reduced-Motion Three.js Hero Scene

## Changed files

- `components/HeroProcessorScene.jsx` — added a client-only native Three.js processor lattice. The component owns scene creation, renderer setup, lattice geometry/materials, resize handling, rendering, animation, and teardown inside one effect.
- `tests/HeroProcessorScene.test.jsx` — added mocked-renderer coverage for the accessible animated state, reduced-motion static state, renderer disposal, and RAF cancellation.
- `vitest.setup.js` — added the jsdom-only `ResizeObserver` fallback required by the scene test environment.
- `app/globals.css` — added the scoped `.hero-scene` container and canvas styling.
- `package.json` and `package-lock.json` — added only direct `three@^0.185.1` / locked `three@0.185.1`.

No changes were made to `/api/devices`, the existing table/leaderboard components, or unrelated dependencies.

## TDD evidence

- Dependency precondition: `rg -n '"three"|"@react-three/fiber"|"@react-three/drei"' package.json` produced no output before installation.
- Red: `npm test -- tests/HeroProcessorScene.test.jsx` failed because `@/components/HeroProcessorScene` did not exist.
- Green: focused test passed with 2/2 tests after the component and test-only resize fallback were added.
- Test fixture correction: Vitest hoists `vi.mock`, so shared renderer spies were moved into the mock factory. The mock also received `Mesh.position.set` and `PerspectiveCamera.updateProjectionMatrix`, matching the direct Three.js APIs used by the required scene.

## Lifecycle and cleanup verification

- Non-reduced motion draws immediately, schedules RAF, and cleanup cancels the recorded RAF id.
- Reduced motion draws exactly one static scene and never schedules RAF.
- Cleanup disconnects the `ResizeObserver`, disposes every tracked geometry/material, disposes the renderer, and removes the renderer canvas from the container.
- The focused test verifies renderer disposal and RAF cancellation on unmount; implementation inspection verifies observer disconnection, resource disposal, and canvas removal.

## Verification outcomes

- `npm test` — PASS: 16 files, 68 tests.
- `npm run lint` — PASS.
- `npm run build` — PASS. Build emitted existing missing-MongoDB-credentials messages while generating pages, but completed successfully and retained `/api/devices` as a dynamic route.
- `git diff --check` — PASS before commit.

## Commit

- `81148e0 feat: add reduced-motion processor lattice hero`

## Concerns

- `npm install three` reported 23 existing audit advisories (3 low, 3 moderate, 16 high, 1 critical). They were not changed because remediation would exceed this task's dependency scope.
- The successful production build logs missing MongoDB credentials; this is unrelated to the hero scene and existed as a runtime configuration warning.

## Review follow-up: lifecycle cleanup regression coverage

- Replaced the truthy RAF guard with `frameId !== undefined`, so a scheduled browser frame id of `0` is canceled during cleanup.
- Strengthened the mocked Three.js lifecycle test with independent renderer, geometry, and material disposal spies. It asserts 9 geometry disposals, 9 material disposals, observer disconnection, cancellation of RAF id `0`, and removal of the appended canvas from its parent. The reduced-motion static-render test remains in place.
- TDD red: `npm test -- tests/HeroProcessorScene.test.jsx` failed at the expected `cancelAnimationFrame(0)` assertion before the guard fix.
- TDD green: `npm test -- tests/HeroProcessorScene.test.jsx` passed: 1 file, 2 tests.
- `npm run lint` — PASS.
- `npm run build` — PASS; it emitted the pre-existing missing-MongoDB-credentials messages while completing the production build.
- Commit: `b1816aa fix: fully clean up processor lattice scene`.

## Re-review follow-up: renderer canvas removal assertion

- The Three.js mock now captures the exact `WebGLRenderer.domElement` canvas instance and exposes it to the lifecycle test.
- The test spies on that canvas instance's `remove` method before unmount and asserts it is called exactly once, independently of React host-node detachment.
- TDD red: `npm test -- tests/HeroProcessorScene.test.jsx` failed because the mock did not yet expose `getRendererCanvas`.
- TDD green: `npm test -- tests/HeroProcessorScene.test.jsx` passed: 1 file, 2 tests.
- `npm run lint` — PASS.
- `npm run build` — PASS; it emitted the pre-existing missing-MongoDB-credentials messages while completing the production build.
- Commit: `a3e056b test: verify processor canvas cleanup`.

---

# Hardening Task 4 Report: Complete, sortable, paginated, responsive snapshot

## Status

Implemented and verified on `codex/apu-matrix-leaderboard`.

## Implemented

- Added one normalized device row model for phone, processor, AnTuTu score, normalized INR price, and price type.
- Added case-insensitive search across phone and processor.
- Added accessible Phone, AnTuTu, and Price sorting in ascending/descending order with scoped headers and `aria-sort`.
- Added fixed 25-row pagination with result counts, disabled boundary controls, and page-one resets after search/sort changes.
- Added loading status, error alert, no-records state, no-match status, and Reset search action.
- Kept all fields in the same semantic table on mobile and added `data-label` values for stacked card presentation below 768px.
- Added shrink-safe `min-width: 0` / `max-width: 100%` rules across the page, hero, leaderboard, chart, benchmark table, and snapshot wrappers. Wide tables retain overflow inside their own wrappers.

## TDD evidence

- RED: `bun run test -- tests/DeviceSnapshotTable.test.jsx tests/Dashboard.test.jsx` failed with 8 missing-behavior failures before implementation, including missing searchbox/sort controls/pagination and missing scoped headers.
- GREEN: the same focused command passed with 2 files and 13 tests.
- Full suite: `bun run test` passed with 21 files and 122 tests.
- Lint: `bun run lint` passed with zero errors and zero warnings.

## Files changed for this task

- `components/DeviceSnapshotTable.jsx`
- `app/globals.css`
- `app/page.js`
- `components/LeaderboardStage.jsx`
- `components/BenchmarkScatterPlot.jsx`
- `components/BenchmarkPointTable.jsx`
- `tests/DeviceSnapshotTable.test.jsx`
- `tests/Dashboard.test.jsx`

## Concerns

- Existing unrelated report history in this file was preserved; this hardening report was appended below it.
- Browser screenshot checks at 390px/768px/desktop were not run in this task because the app browser worker was unavailable. DOM/CSS regression coverage and full automated verification passed.

## Commit

- `feat: harden snapshot and mobile layout`
