# OpenMetrics 2.0 Migration Guide Update

## What This Is

An update to the OpenMetrics 2.0 migration guide (`docs/tutorials/open_metrics_2_0_migration.md`) to reflect upstream changes in the OM 2.0 specification (`docs/specs/om/open_metrics_spec_2_0.md`). The migration guide targets exposer authors migrating from OM 1.0 to OM 2.0.

## Core Value

The migration guide must be accurate relative to the current OM 2.0 spec. Exposer authors reading it should not encounter advice that contradicts the specification.

## Current State

All milestones complete. Migration guide is fully synced with OM 2.0 spec and has consistent Breaking/Non-breaking labels.

## Requirements

### Validated

- ✓ Terminology updated: MetricPoint → Sample/Metric, MetricName → Metric Name -- v1.0
- ✓ GaugeHistogram CompositeValue fields corrected: count/sum → gcount/gsum -- v1.0
- ✓ Escaping relaxation, StateSet section, Unknown type note added -- v1.0
- ✓ Full diff review confirmed no other spec inconsistencies -- v1.0
- ✓ Breaking/Non-breaking labels reclassified using precise definition -- v1.1
- ✓ Quick reference table Breaking? column synced with section labels -- v1.1

### Active

(None)

### Out of Scope

- Fixes to the OM 2.0 spec itself -- only the migration guide is in scope
- Fixes to the OM 1.0 spec
- New tutorial content beyond what the label changes require

## Context

The prometheus-docs repo contains both the OM specs and the migration guide. v1.0 milestone brought the guide in sync with the current spec. This milestone refines the Breaking/Non-breaking labels using a precise definition agreed upon during spec review.

**New definition:** A change is "Breaking" if and only if a line that was valid in OM 1.0 is now invalid in OM 2.0.

**Reclassification summary:**
- Stays Breaking: MetricFamily match, st@ replaces _created, CompositeValues, Sum/Count required, Exemplar mandatory timestamps
- Non-breaking → Breaking: Info _info suffix (TYPE line must now include _info)
- Breaking → Non-breaking: UTF-8 names (additive), Native Histograms (new feature)
- Edge case: Content-Type version header (HTTP header, not exposition line)

## Constraints

- **Scope**: Only `docs/tutorials/open_metrics_2_0_migration.md` should be edited
- **Style**: Match existing guide style (Breaking/Non-breaking labels, OM 1.0/OM 2.0 before/after blocks, spec cross-references)
- **Branch**: Work is on `owilliams/om2-migration`

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| StateSet gets full section | New MetricGroup concept is significant enough for exposer authors | ✓ Good |
| Unknown gets brief note only | Niche type, low impact for most exposer authors | ✓ Good |
| Escaping gets its own subsection | ABNF change is actionable for exposer authors doing UTF-8 quoting | ✓ Good |
| Breaking = valid OM 1.0 line now invalid in OM 2.0 | Precise, testable definition agreed during spec review | ✓ Good |

---
*Last updated: 2026-03-20 after v1.1 milestone*
