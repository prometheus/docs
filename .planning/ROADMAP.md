# Roadmap: OM 2.0 Migration Guide Update

## Milestones

- [x] **v1.0 Spec Alignment** - Phase 1 (shipped 2026-03-20)
- [ ] **v1.1 Breaking Label Reclassification** - Phase 2 (in progress)

## Phases

<details>
<summary>v1.0 Spec Alignment (Phase 1) - SHIPPED 2026-03-20</summary>

- [x] **Phase 1: Spec Alignment** - Add missing sections and verify full guide-to-spec consistency

### Phase 1: Spec Alignment
**Goal**: Migration guide fully reflects all OM 2.0 spec changes, with no remaining inconsistencies
**Depends on**: Nothing
**Requirements**: ESC-01, SS-01, UNK-01, DIFF-01
**Success Criteria** (what must be TRUE):
  1. The escaping subsection documents that single backslash before any character is now valid ABNF, and double backslash is a SHOULD recommendation
  2. A StateSet section exists with OM 1.0/OM 2.0 comparison showing the MetricGroup terminology change
  3. The Unknown type entry notes that CompositeValue is now allowed in addition to Number
  4. A manual diff review between the guide and spec confirms no other inconsistencies remain
**Plans:** 1 plan

Plans:
- [x] 01-01-PLAN.md -- Add escaping relaxation, StateSet section, Unknown note, and diff review

</details>

## v1.1 Breaking Label Reclassification

- [ ] **Phase 2: Label Reclassification** - Reclassify all Breaking/Non-breaking labels using precise definition

## Phase Details

### Phase 2: Label Reclassification
**Goal**: Every Breaking/Non-breaking label in the migration guide accurately reflects whether that change invalidates previously valid OM 1.0 lines
**Depends on**: Phase 1 (spec alignment complete)
**Requirements**: LABEL-01, LABEL-02, LABEL-03, LABEL-04, LABEL-05, LABEL-06, LABEL-07
**Success Criteria** (what must be TRUE):
  1. The "How to use this guide" section defines Breaking as "a line valid in OM 1.0 is now invalid in OM 2.0"
  2. Info _info suffix section is labeled Breaking; UTF-8 Names and Native Histograms sections are labeled Non-breaking
  3. The Content-Type version header section clarifies it applies to HTTP headers (not exposition lines) with appropriate label
  4. The quick reference table's Breaking? column matches every section-level label
  5. No section-level prose contradicts its own Breaking/Non-breaking label
**Plans:** 1 plan

Plans:
- [ ] 02-01-PLAN.md -- Reclassify Breaking/Non-breaking labels, update quick reference table, add definition

## Progress

**Execution Order:** Phase 2

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Spec Alignment | v1.0 | 1/1 | Complete | 2026-03-20 |
| 2. Label Reclassification | v1.1 | 0/1 | In progress | - |
