# Requirements: OM 2.0 Migration Guide Update

**Defined:** 2026-03-20
**Core Value:** Migration guide must be accurate relative to current OM 2.0 spec

## v1.1 Requirements

### Label Reclassification

- [x] **LABEL-01**: Info _info suffix section label changed from Non-breaking to Breaking
- [x] **LABEL-02**: UTF-8 Names section label changed from Breaking to Non-breaking
- [x] **LABEL-03**: Native Histograms section label changed from Breaking to Non-breaking
- [x] **LABEL-04**: Content-Type version header section clarified (edge case, HTTP header not exposition line)
- [x] **LABEL-05**: Quick reference table Breaking? column updated to match new labels
- [x] **LABEL-06**: Breaking/Non-breaking definition added to "How to use this guide" section
- [x] **LABEL-07**: All section-level prose referencing breaking/non-breaking reviewed for consistency

## v1.0 Requirements (Complete)

### Consistency

- [x] **TERM-01**: All MetricPoint references updated to Sample/Metric
- [x] **TERM-02**: All MetricName references updated to Metric Name / Metric's Name
- [x] **GHIST-01**: GaugeHistogram CompositeValue uses gcount/gsum

### New Coverage

- [x] **ESC-01**: Escaping subsection updated to reflect relaxed ABNF rules
- [x] **SS-01**: StateSet section added covering MetricGroup terminology change
- [x] **UNK-01**: Brief note added that Unknown type now allows CompositeValue
- [x] **DIFF-01**: Full diff review confirms no other inconsistencies

## Out of Scope

| Feature | Reason |
|---------|--------|
| OM 2.0 spec fixes | Only the migration guide is in scope |
| OM 1.0 spec changes | Upstream spec, not our concern |
| New tutorial content beyond label changes | Scope limited to reclassification |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LABEL-01 | Phase 2 | Complete |
| LABEL-02 | Phase 2 | Complete |
| LABEL-03 | Phase 2 | Complete |
| LABEL-04 | Phase 2 | Complete |
| LABEL-05 | Phase 2 | Complete |
| LABEL-06 | Phase 2 | Complete |
| LABEL-07 | Phase 2 | Complete |

**Coverage:**
- v1.1 requirements: 7 total
- Mapped to phases: 7
- Unmapped: 0

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-20 after v1.1 roadmap creation*
