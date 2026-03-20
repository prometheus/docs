# OpenMetrics 2.0 Migration Guide Update

## What This Is

An update to the OpenMetrics 2.0 migration guide (`docs/tutorials/open_metrics_2_0_migration.md`) to reflect upstream changes in the OM 2.0 specification (`docs/specs/om/open_metrics_spec_2_0.md`). The migration guide targets exposer authors migrating from OM 1.0 to OM 2.0.

## Core Value

The migration guide must be accurate relative to the current OM 2.0 spec. Exposer authors reading it should not encounter advice that contradicts the specification.

## Requirements

### Validated

- ✓ Terminology updated: MetricPoint → Sample/Metric, MetricName → Metric Name -- initial edits
- ✓ GaugeHistogram CompositeValue fields corrected: count/sum → gcount/gsum -- initial edits

### Active

- [ ] Add escaping rules relaxation (ABNF now allows single backslash before any char, double backslash SHOULD)
- [ ] Add StateSet section covering MetricGroup terminology change
- [ ] Add brief note on Unknown type now allowing CompositeValue
- [ ] Full diff review to catch any remaining inconsistencies between guide and spec

### Out of Scope

- Fixes to the OM 2.0 spec itself -- only the migration guide is in scope
- Fixes to the OM 1.0 spec
- New tutorial content beyond what the spec changes require

## Context

The prometheus-docs repo contains both the OM specs and the migration guide. The OM 2.0 spec received several upstream commits that changed terminology and details:
- `38984ad1` changed MetricPoint to Sample
- `0ae66d19` relaxed escaping rules
- `33fb2eb1` added extensions and improvements section
- `974c4ed0` fixes in text format
- `c9ed9a0e` metadata text format updates
- `cb6e9bfe` pre rc.0 changes from WG

The migration guide was written against an earlier draft and needs to catch up.

## Constraints

- **Scope**: Only `docs/tutorials/open_metrics_2_0_migration.md` should be edited
- **Style**: Match existing guide style (Breaking/Non-breaking labels, OM 1.0/OM 2.0 before/after blocks, spec cross-references)
- **Branch**: Work is on `owilliams/om2-migration`

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| StateSet gets full section | New MetricGroup concept is significant enough for exposer authors | -- Pending |
| Unknown gets brief note only | Niche type, low impact for most exposer authors | -- Pending |
| Escaping gets its own subsection | ABNF change is actionable for exposer authors doing UTF-8 quoting | -- Pending |

---
*Last updated: 2026-03-20 after initialization*
