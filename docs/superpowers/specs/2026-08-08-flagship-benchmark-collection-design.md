# Flagship Benchmark Collection Design

## Goal

Extend APU Matrix with an auditable, weekly-refreshed benchmark dataset for premium non-folding Apple, Samsung, Google, and Motorola phones released from 2023 onward. Each eligible phone will retain price data and add CPU, GPU, and AI benchmark fields.

## Scope

Include the complete premium phone line for each annual family:

- Apple iPhone standard, Plus, Pro, and Pro Max.
- Samsung Galaxy S standard, Plus, and Ultra.
- Google Pixel standard and Pro.
- Motorola Edge premium variants and Edge Plus or Ultra where sold.

Exclude tablets, foldables, Galaxy A devices, Pixel A devices, Motorola G devices, older releases, duplicate aliases, and non-phone hardware. A canonical inventory is the authority for inclusion, rather than the current AnTuTu-derived data alone.

## Benchmark policy

The dataset must never mix benchmark generations in one ranking.

| Chart | Canonical benchmark | Required values |
|---|---|---|
| CPU | Geekbench 6 CPU | single-core score, multi-core score |
| GPU | 3DMark Wild Life Extreme | score, FPS |
| AI | Geekbench AI | quantized score, backend, accelerator |

AnTuTu remains a reference-only field. Rows may be published with a missing benchmark, but the application must display the missing state rather than infer, convert, or fabricate a score.

## Data sources and provenance

The collector uses a source manifest rather than broad crawling. Every fetched value must carry its original URL, observed date, benchmark version, source type, and match confidence.

1. Use a documented public benchmark result or chart page when it can be accessed normally and permits collection.
2. Otherwise use a selected editorial review page that identifies the phone variant and benchmark version.
3. Never bypass access controls, CAPTCHAs, login requirements, rate limits, robots restrictions, or terms.
4. Preserve a source snapshot hash and raw extracted text for review.
5. Send ambiguous model matches, version mismatches, and changed values outside a configured tolerance to a review queue.

The data source manifest will make adding, disabling, or replacing a source independent of the rest of the pipeline.

## Canonical data model

The existing `public/data/phone-metrics-pricing.csv` will gain the following columns:

| Group | Columns |
|---|---|
| Eligibility | `is_v1_flagship`, `device_family`, `release_year`, `device_variant`, `canonical_model` |
| CPU | `cpu_geekbench6_single_core`, `cpu_geekbench6_multi_core`, `cpu_source_url`, `cpu_observed_at`, `cpu_match_confidence` |
| GPU | `gpu_3dmark_wild_life_extreme_score`, `gpu_3dmark_wild_life_extreme_fps`, `gpu_source_url`, `gpu_observed_at`, `gpu_match_confidence` |
| AI | `ai_geekbench_quantized_score`, `ai_backend`, `ai_accelerator`, `ai_precision`, `ai_source_url`, `ai_observed_at`, `ai_match_confidence` |
| Collection | `benchmark_status`, `benchmark_review_reason`, `benchmark_last_checked_at`, `benchmark_source_hash` |

Existing `x_metric_antutu_score` remains unchanged. Chart columns are numeric or empty, never display-formatted strings. ISO 8601 dates are required for collection timestamps.

## Pipeline

1. Build `flagship-phone-inventory.json` from explicit model-family rules and canonical aliases.
2. Join inventory entries to price rows by normalized brand, canonical model, and release year.
3. Fetch only source-manifest URLs for eligible phones, with host-level rate limits and conditional refresh headers when supported.
4. Extract source-specific benchmark records into normalized CPU, GPU, and AI candidate objects.
5. Validate exact benchmark generation, device match, metric range, and required provenance.
6. Choose the highest-confidence compatible candidate per metric, while retaining all candidates in an audit JSON file.
7. Write the enriched CSV, an audit JSON dataset, and a review queue CSV/JSON.
8. Produce a coverage report that lists eligible devices, complete rows, missing metrics, source failures, duplicates, and changed values.

## Weekly schedule and safety

The project already declares a weekly Vercel cron. The implementation will add one protected collection entry point that runs once per week, or can be run locally with the same command. It will:

- Use an explicit secret for scheduled invocation.
- Limit requests per host and stop a host after repeated failures.
- Reuse existing values when the source is unchanged.
- Commit no data automatically from a deployed server; it writes generated artifacts only in a controlled collection environment.
- Log one concise run summary and retain reviewable artifacts.

## Failure handling

- Unavailable, blocked, or unpermitted sources become `source_unavailable`, not retry storms.
- Unknown aliases become `needs_model_review`.
- A wrong version becomes `benchmark_version_mismatch`.
- Values that differ materially from the previous accepted value become `needs_value_review`.
- A failed source never erases the previously accepted benchmark value.

## Testing

Unit tests will cover inventory eligibility, alias matching, benchmark-version validation, candidate selection, CSV serialization, and review-queue generation. Adapter fixtures will test normal, missing, blocked, ambiguous, and stale-source responses. An integration test will execute the pipeline with local fixtures and verify that the coverage report reconciles with the CSV.

## Initial success criteria

- The CSV includes all approved benchmark columns.
- Every v1 inventory row has a stable canonical identifier and price linkage or an explicit price-review state.
- No ranking mixes Geekbench 6 and Geekbench 7, or different 3DMark test names.
- Every accepted benchmark value has a URL, observed date, version, and confidence.
- Weekly execution is rate-limited, idempotent, and produces a review queue instead of silently accepting uncertain data.
