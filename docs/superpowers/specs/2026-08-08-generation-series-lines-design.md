# Generation-level benchmark series lines

## Goal

Connect benchmark chart points only when they are variants of the same phone generation. A Samsung Galaxy S24 must not connect to a Galaxy S25 or S26; Galaxy S26, S26+, and S26 Ultra may connect.

## Design

- Derive a `seriesKey` from `phone_name` by retaining the model prefix and its first generation number, while removing known variant suffixes such as Plus, Pro, Ultra, FE, Max, and storage or connectivity qualifiers.
- Group plotted line series by `phone_brand + seriesKey` and retain groups only when they contain at least two points.
- Continue to use the raw benchmark points for dots, tables, and tooltips; only the joining-line grouping changes.
- If a model name cannot produce a reliable key, omit it from line grouping rather than infer a relationship.

## Verification

- Add fixtures demonstrating that Galaxy S26 variants create one series.
- Assert that Galaxy S24, S25, and S26 do not appear in a shared series.
- Preserve iPhone generation grouping and the existing graph API contract.
