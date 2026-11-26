---
title: "Exploring Horizontally Scalable Prometheus in Rust"
created_at: 2026-11-26
kind: article
author_name: "Bartłomiej Płotka (@bwplotka)"
---

Today, at the [November 2026 Prometheus DevSummit](https://docs.google.com/document/d/1uurQCi5iVufhYHGlBZ8mJMK_freDFKPG0iYBQqJ9fvA/edit), the Prometheus community reached consensus on [PROM-116: Horizontally scalable Prometheus in Rust](https://github.com/prometheus/proposals/blob/main/proposals/0116-horizontally-scalable-prometheus.md) and merged the proposal.

Let's get the most important expectation straight right at the top. **No, Prometheus is not being rewritten in Rust next month, and Go `prometheus/prometheus` is not going anywhere.** What we agreed on is something more deliberate and, honestly, much more exciting: opening space under Prometheus governance for Rust and columnar storage experiments with horizontally scalable scope, incubated in our secondary GitHub organization at `prometheus-community/prometheus.rs`.

<!-- more -->

> NOTE: The existing experimental `prometheus/prometheus.rs` repository will be transferred to `prometheus-community/prometheus.rs` as part of this decision.

Because headlines on the internet love turning any Rust mention into "everything is changing tomorrow," several maintainers at the DevSummit asked us to communicate clearly from day one. So here is the full picture of why we made this decision, how we are protecting single-node Prometheus, and what it means for users and contributors across Prometheus, Thanos, Cortex, and beyond.

## Why now, and why under Prometheus?

Historically, Prometheus maintainers consistently said "no" to clustering and distributed storage inside the Prometheus project. That resistance made complete sense. Single-node Prometheus succeeded because it is **an autonomous binary with local TSDB and zero external storage dependencies. You can trust it to fire alerts when everything else is broken.**

That boundary also led to a thriving downstream ecosystem: [Cortex](https://cortexmetrics.io/), [Thanos](https://thanos.io/), and later [Grafana Mimir](https://grafana.com/oss/mimir/). Each project built its own ingestion pipeline, compactor, object-storage layer, and distributed query engine on top of Go Prometheus TSDB.

Over the last few years, two shifts made us rethink that boundary.

First, ecosystem fragmentation has started to hurt. Upstream maintenance on Go Thanos slowed down significantly, Cortex runs on a small maintainer group across three companies, and Mimir moves fast under AGPL-3.0 outside CNCF neutral governance. Meanwhile, as cardinality and ingestion scale kept climbing, companies like Cloudflare, Shopify, AWS, Red Hat, Grafana, and Dash0 began building internal Rust and columnar prototypes on [Apache Arrow](https://arrow.apache.org/), [Apache DataFusion](https://datafusion.apache.org/), and modern columnar formats like Parquet and [Vortex](https://github.com/vortex-data/vortex).

Second, as Julius Volz pointed out during the DevSummit, keeping Go Prometheus packages focused solely on single-node servers created a hidden tax in both directions. Downstream backends had to work around single-node assumptions and multiply component variants, while `prometheus/prometheus` still absorbed special-case hooks and flags (like `DB.CompactSelectedSeries` and `EnableOverlappingCompaction`) purely for Thanos, Cortex, and Mimir.

Early open-source prototypes across the [Prometheus.rs SIG](https://docs.google.com/document/d/1uZjrWeAfRaN6fIp4L7pd-lMqc650bClJeg7jGO3gerE/edit) already show why so many teams are excited about Rust and Arrow:

* Scraping and relabeling prototypes in [prometheus/scrape.rs](https://github.com/prometheus/scrape.rs) measured roughly 30x lower collector memory into Arrow batches ([prombenchy#19](https://github.com/bwplotka/prombenchy/pull/19#issuecomment-6788714420)), 8.1x faster decoding than Go `expfmt` ([scrape.rs#13](https://github.com/prometheus/scrape.rs/pull/13)), and 35.8x faster vectorized relabeling ([scrape.rs#40](https://github.com/prometheus/scrape.rs/pull/40)).
* Query execution experiments in [prometheus-community/promql-rs](https://github.com/prometheus-community/promql-rs) already pass over 80% of upstream float `promqltest` checks ([promql-rs#92](https://github.com/prometheus-community/promql-rs/pull/92)) while running 4.8x to 24x faster than Go Prometheus on 100k-series range queries ([promql-rs#85](https://github.com/prometheus-community/promql-rs/pull/85)).
* Columnar ingestion and storage drafts ([Thanos 2.0](https://docs.google.com/document/d/1fn8JdEiHe0UBF4MPCVE41GHMtAkQ8n_3T8ovIadfX1A/edit) and [Prometheus.rs](https://docs.google.com/document/d/1NB5qyEthztPjp2in8AeDq_l8PoYxsAa1QhImanJDQHM/edit)) point to major RAM reductions at tens of millions of active series and roughly 0.7 bytes per sample in sorted columnar files.

Because much of the database community is moving to Rust and Arrow anyway, we had a rare choice. Either watch everyone build closed forks or invent a fourth competing open-source organization, or pool our effort under one vendor-neutral Apache-2.0 roof backed by Prometheus's refreshed governance, elected Steering Committee, and 2-seat-per-employer cap.

## The architecture: modular crates first, two modes on top

A key point from review on [PR #116](https://github.com/prometheus/proposals/pull/116) is that this effort is not only about horizontal scale. The core idea is building **small, standalone, separately published Rust crates** with strict boundaries, then composing them into both a single-node binary and opt-in distributed components.

[![PROM-116 governance, repository, and deployment architecture overview](/assets/blog/2026-11-26/architecture-overview.png)](/assets/blog/2026-11-26/architecture-overview.png)

There are two practical reasons we are focusing on reusable crates first:

1. **Incremental adoption without a big-bang rewrite.** Even if a team never switches its entire monitoring stack, it can adopt a single crate (such as a Rust scraper, PromQL engine, or columnar compactor) and contribute bug fixes or tests upstream. That aligns cloud vendor incentives with upstream open source instead of pushing teams into private forks.
2. **Smaller units are easier to review and maintain.** Whether code is written by humans or assisted by coding agents, small libraries with strict interfaces and strong conformance tests are much easier to reason about than tangled monoliths or huge microservice stacks.

Just as importantly, **single-node Prometheus will not be `-role=all`** running a dozen distributed microservices in one process. The monolith composes dedicated single-node components on top of the same core crates, with zero external coordination services required.

## Why incubate in `prometheus-community/prometheus.rs`?

One of the most thoughtful debates on PR #116 and at the DevSummit was where the repository should live: directly in `prometheus/prometheus.rs`, or in the secondary `prometheus-community` organization.

Personally, I initially argued for `prometheus/prometheus.rs` so we could rally everyone in one spot. But other maintainers raised a sharp point about the [second-system effect](https://en.wikipedia.org/wiki/Second-system_effect) (think Perl 6 or Python 3) and user trust. People rely on Prometheus to wake them up when production breaks. Even if a repo carries an `[EXPERIMENTAL]` label, hosting it under the primary `prometheus` GitHub organization creates unrealistic expectations that everything is about to switch over or is already production-hardened.

We reached consensus to incubate in **`prometheus-community/prometheus.rs`** instead. That gives us the best of both worlds: one shared Apache-2.0 monorepo under Prometheus governance and the Prometheus.rs SIG, with honest expectations while we prove out the architecture component by component. Moving into the primary `prometheus` organization later will require meeting our graduation gates and a separate community decision.

## Protecting single-node Prometheus

Let's be explicit: **whenever the interests of single-node Prometheus and horizontally scalable Prometheus conflict, single-node Prometheus comes first.**

Instead of relying on goodwill alone, PROM-116 puts five concrete guardrails in place from day one:

* **Separate lean monolith binary.** Sharing a Cargo workspace does not mean linking distributed roles or cloud SDKs into single-node releases. The default monolith compiles as its own binary target with zero distributed flags, coordination libraries, or cloud-SDK CVEs.
* **One-way crate dependencies.** Core crates for scraping, PromQL, rule evaluation, and local storage cannot depend on distributed coordination, multi-tenant auth, or cloud object-store SDKs. Distributed layers depend downward on core crates, never the reverse.
* **Deterministic pre-merge gates plus scheduled benchmarks.** Pre-merge CI enforces deterministic checks like crate dependency direction and monolith binary-size limits. Scheduled benchmarks on dedicated hardware track single-node RSS, CPU, query latency, and cold-start time alongside 100M-series workloads, backed by a revert-or-fix policy for regressions.
* **Separate maintainership.** Monolith core and distributed components have distinct maintainer rosters or `CODEOWNERS` areas, with monolith maintainers holding approval authority over default behavior and shared crate interfaces.
* **Interface contracts and rolling upgrade tests.** Components must carry API contract and regression tests across their boundaries, and distributed roles must ship with a documented and tested rolling upgrade order.

To prevent long-term maintenance decay, distributed components also cannot graduate from `[EXPERIMENTAL]` to stable without active maintainers from at least two independent employers, and they face annual health reviews with an explicit demotion or archival path if maintainership stalls.

## What this means for users today

If you run Prometheus, Thanos, Cortex, or Mimir in production today, here is the practical takeaway:

* **Go `prometheus/prometheus` keeps running full speed.** Its scope does not change, it will not take on clustering, and new features (like native metadata, delta temporality, and composite sample storage) continue landing there first. Experimental Go features behind feature flags do not require an immediate Rust port.
* **No deprecation timeline for Go Prometheus.** Whether, when, or how Go Prometheus might ever be deprecated is completely out of scope for PROM-116 and belongs solely to `prometheus/prometheus` maintainers in a separate future proposal.
* **`prometheus/compliance` is the contract.** Passing shared conformance and interoperability suites for PromQL, OpenMetrics, Remote Write, OTLP ingestion, and HTTP APIs is a mandatory graduation gate, alongside an openly tracked compatibility gap list for stable features.
* **Thanos and Cortex remain independent CNCF projects.** A Prometheus proposal cannot bind Thanos or Cortex. Their future belongs solely to their maintainers, and their communities are welcome to collaborate under Prometheus and adopt Rust crates incrementally. Similarly, PROM-116 makes no assumptions or promises about Grafana Mimir, while welcoming interested contributors.

## Who is working on this, and how to get involved

This is not a solo experiment. A diverse group of maintainers and contributors across companies is already building the first crates:

* **[prometheus-community/promql-rs](https://github.com/prometheus-community/promql-rs)** for PromQL parsing and execution.
* **[prometheus/scrape.rs](https://github.com/prometheus/scrape.rs)** for target scraping and OpenMetrics decoding.
* Early `tsdb.rs` exploration to make sure existing Go Prometheus data directories (TSDB blocks and WAL) can be read cleanly on future single-node upgrades.

There is a long road ahead, and details matter. As we noted at the DevSummit, getting full compatibility right across every edge case is hard work that will take real time and real production testing.

If you want to follow along or help build this component by component:

* Read the full merged [PROM-116 proposal](https://github.com/prometheus/proposals/blob/main/proposals/0116-horizontally-scalable-prometheus.md) and review [PROM-115](https://github.com/prometheus/proposals/pull/115) (establishing Prometheus SIG governance, which our SIG charter builds on).
* Join `#prometheus-dev` on the CNCF Slack and check out the [Prometheus.rs SIG meeting notes](https://docs.google.com/document/d/1uZjrWeAfRaN6fIp4L7pd-lMqc650bClJeg7jGO3gerE/edit).
* Contribute code, benchmarks, or **PR reviews** (often the most impactful help!) to [prometheus/scrape.rs](https://github.com/prometheus/scrape.rs), [prometheus-community/promql-rs](https://github.com/prometheus-community/promql-rs), and [prometheus/compliance](https://github.com/prometheus/compliance).

We plan to share regular, honest progress updates as individual crates mature and hit real benchmarks and roadblocks. See you in open source!
