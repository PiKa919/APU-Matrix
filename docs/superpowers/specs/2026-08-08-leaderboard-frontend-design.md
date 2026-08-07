# APU Matrix Leaderboard Frontend Design

## Goal

Replace the current single-purpose dashboard presentation with an elegant leaderboard-first analytical website that is useful with existing price and AnTuTu data, while reserving the central graph canvas for future CPU, GPU, AI, and AnTuTu visualizations.

## Product framing

APU Matrix is a phone-performance research product. It will publish device and processor comparisons, benchmark data, price context, and short editorial Field Notes. The design must support a growing device catalog and future article pages without turning the first release into a dense administration dashboard.

## Visual direction

Reading: analytical leaderboard for research-minded phone buyers, with a minimal dark editorial language and restrained spatial motion.

| Design dial | Value | Reason |
|---|---:|---|
| Design variance | 5/10 | A clean data hierarchy with a few asymmetric moments. |
| Motion intensity | 5/10 | The hero adds a clear sense of technology without making the data surface theatrical. |
| Visual density | 4/10 | The graph is allowed to breathe, while current data remains scannable. |

The default theme is graphite dark. A complete off-white light theme must use the same semantic tokens, hierarchy, and one cyan accent. Corners use a consistent subtle radius. Typography uses the existing Space Grotesk family instead of adding a remote font dependency.

## Information architecture

The primary navigation is stable and prepares the product for future routes:

- Overview: the leaderboard home page.
- Devices: future canonical phone catalog and detail views.
- Processors: future chipset catalog and comparison views.
- Field Notes: future short benchmark explainers and editorial posts.

The first release implements Overview. The other navigation items are labeled as upcoming surfaces without inventing content or routes that do not exist.

## Page composition

### Top bar

One-line desktop navigation with APU Matrix wordmark, the four primary destinations, a theme toggle, and one refresh/status control. It remains compact and keyboard accessible.

### Hero

A split hero keeps copy on the left and an isolated Three.js processor-lattice scene on the right. Copy uses one compact headline, a short explanation, and one CTA that moves the reader to the leaderboard. The 3D scene uses low-poly geometry, a cyan trace accent, and no external model asset.

The hero respects reduced-motion preferences by rendering a static canvas state. The Three.js code is a lazy-loaded client leaf, separate from page data fetching and regular UI motion.

### Leaderboard stage

The leaderboard stage is the dominant visual element. It includes:

- Metric controls for CPU, GPU, AI, and AnTuTu.
- Device/processor filter placeholders that do not imply the filters already affect unavailable datasets.
- A source and refresh-status row.
- A fixed-height graph canvas reserve labeled as awaiting normalized benchmark data.
- A compact legend that defines the future chart colors but does not fabricate plotted values.

The stage takes hierarchy cues from the reference: a large graph area, quiet grid treatment, limited color, and visible controls. It must not reproduce the reference’s labels, data, or composition verbatim.

### Insight snippets

Three compact explanatory snippets beneath the stage describe how future data will be interpreted: CPU for app responsiveness, GPU for gaming/graphics, and AI for on-device models. These are short information blocks, not equal promotional cards.

### Current data table

Use the existing `/api/devices` result to render a compact phone table. It must show phone, processor, AnTuTu score, current normalized INR price, and price type. The table is the only present-day data view; it is not a replacement for the future graph.

It includes loading, error, empty, and responsive states. On small screens, preserve the phone and score and allow nonessential columns to collapse.

### Field Notes

A small section reserves space for future articles. It uses real content labels only: no fake authors, dates, or fabricated article metrics. The first release can use two clearly marked coming-soon entries.

## Interaction and accessibility

- Theme mode defaults to system preference and can be toggled manually; the selection persists locally.
- Every interactive element has visible focus treatment and accessible labels.
- Buttons maintain AA contrast in both themes.
- The graph reserve and table expose useful accessible labels and loading status.
- Motion uses transform and opacity only, honors reduced motion, and has cleanup on unmount.
- The layout becomes single-column below 768px; the 3D scene moves below hero copy and the table collapses lower-priority columns.

## Technical design

The existing Next.js client page can remain the data-fetching boundary for the first release. It should be decomposed into focused components:

| Component | Responsibility |
|---|---|
| `ThemeToggle` | System-aware dark/light theme selection and persistence. |
| `HeroProcessorScene` | Lazy-loaded Three.js visual and reduced-motion fallback. |
| `LeaderboardStage` | Metric controls, source status, and graph reserve. |
| `DeviceSnapshotTable` | Current `/api/devices` data table. |
| `FieldNotesPreview` | Future editorial entry placeholders. |
| `app/page.js` | Page composition, data request, loading/error state. |

Three.js must be added only after checking the current dependencies. It is loaded dynamically and does not block the initial text or data table.

## Non-goals

- Do not implement real CPU/GPU/AI graph calculations yet.
- Do not fabricate chart points, benchmark scores, blog posts, user testimonials, or device metrics.
- Do not build unimplemented Device, Processor, or Field Notes routes.
- Do not change the existing `/api/devices` data contract.
- Do not replace the current benchmark collection work; this frontend consumes the currently available fields and future placeholders.

## Success criteria

- The home page looks like a cohesive analytical product, not a default component gallery.
- Dark and light modes both pass contrast and hierarchy checks.
- The leaderboard reserve clearly communicates future data without pretending it already exists.
- Existing device-price data remains visible and useful.
- The 3D hero is lightweight, optional, and accessible.
- The page is responsive and tests pass.
