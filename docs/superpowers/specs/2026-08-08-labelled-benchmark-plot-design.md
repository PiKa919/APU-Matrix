# Labelled benchmark plot design

## Reference direction

Use the supplied leaderboard reference as the visual baseline: a generous dark plotting surface, muted grid, thin connected series, vivid points, and directly labelled marks.

## Plot treatment

- Render the phone model beside each plotted point in its company colour.
- Render a small secondary line beneath it with the brand and INR price.
- Keep labels with their point on canvas so the chart remains a single visual surface; tooltips remain available for exact values.
- Use a lightweight Chart.js drawing plugin to place labels after datasets are drawn. It must avoid placing a label directly over its own point and use simple alternate offsets for dense local clusters.
- Make series lines less prominent than dots and labels; retain existing generation-only connections.
- Remove the inset-card treatment around the plot while preserving the accessible table below it.
- Apply equivalent muted colors in light mode.

## Verification

- Test the chart configuration includes the label-drawing plugin and uses phone model text from point data.
- Test the series line remains visually subordinate to labelled dot datasets.
- Inspect the running CPU/AI chart in the browser at desktop width.
