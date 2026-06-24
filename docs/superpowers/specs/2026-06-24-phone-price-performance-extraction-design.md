# Phone Price Performance Extraction Design

## Context

APU Matrix needs a reliable phone-level extraction and visualization pipeline for value analysis. The target chart plots AnTuTu performance on the x-axis and phone retail price on the y-axis, while each dot represents a phone or phone configuration.

The current app already contains partial visualization and scraping work, but the data path is split:

- `/api/devices` currently serves `STATIC_DEVICES`, not the richer extracted data.
- `public/data/snapdragon_detailed.json` contains richer processor-grouped phone records, but only a small subset has usable INR prices.
- Existing chart components partly support price/performance views, but they do not yet consume a single normalized, source-aware dataset.

The design below makes extraction coverage measurable and gives the UI a stable dataset built for analysis.

## Goals

- Build a repeatable extraction pipeline that joins phone benchmark scores, processor metadata, phone metadata, and launch/current pricing.
- Prefer launch price for plotting, fall back to current market price when launch price is unavailable, and send fully unpriced phones to a review table.
- Support prices from multiple currencies and markets, including INR, USD, CNY, EUR, and other currencies when source data provides them.
- Preserve source metadata, raw values, normalized values, and confidence for every extracted field.
- Build a chart similar to the provided dark scatter reference: sparse grid, colored dots, hover detail, inline labels for important points, and filters.
- Avoid silently dropping extraction failures; expose missing fields and conflicting source values in a quality report.

## Non-Goals

- Do not estimate launch price from current price or exchange-rate history.
- Do not use manually invented prices for graph points.
- Do not build full admin CRUD for source corrections in the first implementation.
- Do not attempt real-time browser scraping from the client.

## Data Model

The pipeline will write one chart-ready dataset where each row is one plotted or reviewable phone point:

```js
{
  id,
  phoneName,
  phoneBrand,
  processorName,
  processorBrand,
  processorSeries,
  processorGeneration,
  antutuScore,
  antutuRank,
  category,
  releaseDate,
  plottedPrice: {
    amount,
    currency,
    normalizedINR,
    normalizedUSD,
    priceType: "launch" | "current",
    source,
    confidence
  },
  launchPrices: [
    {
      amount,
      currency,
      normalizedINR,
      normalizedUSD,
      source,
      rawValue,
      confidence
    }
  ],
  currentPrices: [
    {
      amount,
      currency,
      normalizedINR,
      normalizedUSD,
      source,
      rawValue,
      confidence
    }
  ],
  sourceMatches: [
    {
      source,
      matchedName,
      url,
      confidence
    }
  ],
  missingFields: []
}
```

Rows with `plottedPrice` are eligible for the graph. Rows without `plottedPrice` stay in the dataset for the missing-price review table.

## Extraction Pipeline

### 1. Benchmark Extraction

Use existing AnTuTu extraction code and local ranking files as benchmark inputs. Each benchmark row should capture:

- phone name
- category
- rank
- total AnTuTu score
- component scores when available
- raw chipset hint when available
- source metadata and extraction timestamp

NanoReview-style phone benchmark pages can be used as an additional cross-check source for phone scores and processor names.

### 2. Processor Normalization

Normalize raw processor strings into canonical fields:

- `processorName`: canonical display name, such as `Snapdragon 8 Elite Gen 5`
- `processorBrand`: `Snapdragon`, `MediaTek`, `Exynos`, `Tensor`, `Kirin`, `Apple`, `Unisoc`, or `Other`
- `processorSeries`: broad tier such as `flagship`, `premium`, `mid`, `entry`, or `other`
- `processorGeneration`: generation key used by filters, such as `8 Elite Gen 5`, `8 Gen 3`, `Dimensity 9400`, `Tensor G4`

Normalization must handle aliases such as:

- `Qualcomm Snapdragon ...`
- `S-8 Elite Gen 5`
- Chinese AnTuTu Snapdragon and Dimensity names
- `MediaTek Dimensity ...`
- `EXYNOS ...`
- compact Kirin names such as `KIRIN980`

### 3. Phone Enrichment

For each benchmark phone row, the pipeline will query multiple metadata sources. The initial source set is:

- GSMArena for release date, chipset, memory variants, and listed price when available.
- Kimovil for broader regional/current pricing and additional phone matching coverage.
- NanoReview for score/spec cross-checking where available.
- Local manual override JSON for hard cases, source corrections, and known aliases.

The matching layer should produce confidence scores based on normalized brand/model token overlap, exact aliases, release year proximity, and processor agreement. Low-confidence matches stay reviewable instead of being promoted silently.

### 4. Price Selection

The graph uses phone retail price with this priority:

1. Launch price, when available from any trusted source.
2. Current market price, when launch price is unavailable.
3. No graph point. The phone appears in the missing-price review table.

The selected value becomes `plottedPrice`. All candidate values remain in `launchPrices` or `currentPrices` for auditability.

Currency normalization stores both original currency and normalized INR/USD values. The normalized values use a pipeline exchange-rate table captured with the run metadata so results are reproducible.

### 5. Quality Report

Every pipeline run will write a quality report with:

- total benchmark rows
- total plotted rows
- rows using launch price
- rows using current-price fallback
- rows missing any usable price
- source match counts
- source failure counts
- low-confidence matches
- price conflicts across sources
- processor conflicts across sources
- duplicate phone/configuration candidates

This report is the primary way to detect whether extraction coverage is improving.

## Visualization Design

The main chart is a dark scatter plot modeled after the provided reference image.

- X-axis: AnTuTu score, increasing left to right.
- Y-axis: phone retail price, increasing bottom to top.
- Dot: one phone or phone configuration.
- Dot color: processor brand by default.
- Optional color mode: processor generation or series when one processor brand is selected.
- Dot shape or stroke: distinguishes launch-price points from current-price fallback points.
- Tooltip: phone name, phone brand, processor, AnTuTu score, plotted price, price type, source, release date, RAM/storage when available.
- Inline labels: selected point, hovered point, top-value outliers, highest-score devices, and manually pinned devices only.
- Value cue: an unobtrusive "best value" direction annotation toward high score and low price.

The chart should avoid label clutter. Dense clusters remain unlabeled until hovered or selected.

## Filters

The UI will provide filters for:

- processor brand
- processor generation
- processor series or tier
- phone brand
- price type: launch, current fallback, or both
- category
- AnTuTu score range
- price range
- source confidence bucket
- hide/show missing-price review table

The filter state should update the chart, summary counts, and missing-price table together.

## Missing-Price Review Table

Phones without a launch or current price remain visible in a review table below or beside the graph. The table should include:

- phone name
- benchmark score
- processor
- category
- attempted sources
- best match confidence per source
- missing fields
- reason excluded from chart

This table prevents extraction misses from becoming invisible.

## Error Handling

- A source failure records an error in the report but does not fail the whole run.
- Low-confidence source matches are retained as candidates but not used for plotted fields.
- Conflicting high-confidence values are flagged in the report.
- A weaker source cannot overwrite a stronger source without being recorded as a fallback.
- Missing launch price can fall back to current market price; missing current price cannot fall back to invented or estimated price.
- Every plotted point must have phone name, processor name, AnTuTu score, plotted price, price source, and price type.

## Testing

Required test coverage:

- processor normalization unit tests
- currency parsing and normalization unit tests
- price priority unit tests
- phone matching unit tests
- fixture-based source extractor tests using saved HTML/JSON snippets
- dataset validation test for chart-ready rows
- UI tests for filters, tooltip content, price-type styling, and missing-price review table
- smoke test that runs the pipeline on a small fixture set and writes chart-ready JSON

Live network calls should not be required for ordinary tests.

## Implementation Boundaries

The first implementation should create a local repeatable pipeline and chart-ready static JSON. It does not need to fully migrate the app back to MongoDB. A database-backed workflow can be added later if continuous refreshes, admin review, or historical source tracking becomes necessary.

The implementation should also respect the current dirty worktree by touching only files required for the extraction pipeline, chart dataset, chart UI, tests, and design/plan docs.
