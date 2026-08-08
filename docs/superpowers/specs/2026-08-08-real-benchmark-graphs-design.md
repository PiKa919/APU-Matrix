# Real Benchmark Graphs Design

## Goal

Replace the leaderboard's placeholder graph with honest, price-versus-performance views built from the user's manually collected Geekbench CSV data.

## Data contract

- Source: `public/data/phone-metrics-pricing.csv`.
- Plot only records with both a metric value and `y_price_inr`.
- CPU uses Geekbench 6 multi-core as the horizontal value and retains the single-core value for the tooltip/table.
- AI uses Geekbench AI quantized score as the horizontal value and shows backend, accelerator, and precision.
- AnTuTu uses `x_metric_antutu_score` as the horizontal value.
- GPU has no 3DMark records yet, so it renders a clear empty state rather than fabricated points.

## Visual and interaction rules

- Vertical axis: normalized INR price. Horizontal axis: selected metric.
- Brand determines dot colour. The colour is stable across every view.
- A line connects only points from the same non-empty `device_family` and brand, sorted by release year then numeric model generation.
- A series with fewer than two deduplicated phones gets dots but no line.
- Duplicate canonical models collapse to the record with the most complete benchmark metadata, then the most recent observation.
- Tooltips and the table expose the exact phone, price type, benchmark value, and source URL where supplied.
- The existing dark/light theme tokens continue to control chart background, text, grid, borders, and empty states.

## Current coverage

- CPU and AI each have 19 plot-ready source rows before deduplication.
- AnTuTu and pricing cover the current CSV.
- GPU is intentionally empty until Wild Life Extreme score/FPS are recorded.
- The presently reliable families are `iPhone` and `Galaxy S`; the graph must not infer a family from processor tier.
