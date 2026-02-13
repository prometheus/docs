---
title: "Modernizing Prometheus: Native Storage for Composite Types"
created_at: 2025-02-14
kind: article
author_name: "Bartłomiej Płotka (@bwplotka)"
---

Over the last year, the Prometheus community has been working hard on several interesting and ambitious changes that previously would have been seen as controversial or not feasible. While there might be little visibility about those from the outside (e.g., it's not an OpenClaw Prometheus plugin, sorry 🙃), Prometheus developers are, **organically**, steering Prometheus into a certain, coherent future. Piece by piece, we unexpectedly get closer to goals we never dreamed we would achieve as an open-source project!

This post starts (hopefully!) as a series of blog posts that share a few ambitious shifts that might be exciting to new and existing Prometheus users and developers. In this post, I'd love to focus on the idea of **native storage for the composite types** which is tidying up a lot of challenges that piled up over time. Make sure to check the provided inlined links on how you can adopt some of those changes early or contribute!

<!-- more -->

> CAUTION: Disclaimer: This post is intended as a fun overview, from my own personal point of view as a Prometheus maintainer. Some of the mentioned changes haven't been (yet) officially approved by the Prometheus Team; some of them were not proved in production.

> NOTE: This post was written by humans; AI was used only for cosmetic and grammar fixes.

## Classic Representation: Primitive Samples

As you might know, the Prometheus data model (so server, PromQL, protocols) supports `gauges`, `counters`, `histograms` and `summaries`. [OpenMetrics 1.0](https://prometheus.io/docs/specs/om/open_metrics_spec/) extended this with `gaugehistogram`, `info` and `stateset` types.

Impressively, for a long time Prometheus' TSDB storage implementation had an explicitly clean and simple data model. The TSDB was allowing the storage and retrieval of string-labelled **Primitive** samples containing only `float64` values and `int64` timestamps. It was completely metric-type-agnostic.

The metric types were implied on top of the TSDB, for humans and basic type-based semantics in PromQL. For simplicity, let's call this way of storing types a **Classic** type model or representation. In this model:

We have **Primitive** types: 

* `gauge` is a "default" type with no special rules, just a float sample with labels.
* `counter` that should have a `_total` suffix in the name for humans to understand its semantics.
    
   ```
   foo_total 17.0
   ```
  
* `info` that needs `_info` suffix in the metric name and always has a value of `1`.

We have **Composite** types. This is where the fun begins. In the classic representation, composite metrics are represented as a set of primitive float samples:

* `histogram` is a group of `counters` with certain mandatory suffixes and `le` labels:
   
   ```
   foo_bucket{le="0.0"} 0
   foo_bucket{le="1e-05"} 0
   foo_bucket{le="0.0001"} 5
   foo_bucket{le="0.1"} 8
   foo_bucket{le="1.0"} 10
   foo_bucket{le="10.0"} 11
   foo_bucket{le="100000.0"} 11
   foo_bucket{le="1e+06"} 15
   foo_bucket{le="1e+23"} 16
   foo_bucket{le="1.1e+23"} 17
   foo_bucket{le="+Inf"} 17
   foo_count 17
   foo_sum 324789.3
   ```
  
* `gaugehistogram`, `summary`, `stateset` type follow the same logic – a group of special `counters` that compose a single metric.

The classic model served the Prometheus project well. It significantly simplified the storage implementation, enabling Prometheus to be one of the most optimized, open-source times-series database, with distributed versions based on the same model available in projects like Cortex, Thanos and Mimir, etc.

Unfortunately, there are always tradeoffs. This classic model has a few limitations:

* **Efficiency:** It tends to yield overhead for composite types, because every new piece of data (e.g., new bucket) takes a precious index space (it's a new unique series), whereas samples are significantly more compressible (rarely change, time-oriented).
* **Functionality:** It poses limitations to the shape and flexibility of the data you store (unless we'd go into some JSON-encoded labels, which have massive downsides). 
* **Transactionality:** Primitive pieces of composite types (separate counters) are processed independently. While we did a lot of work to ensure write isolation and transactionality for scrapes, transactionality completely breaks apart when data is received or sent via remote write, OTLP protocols, or, for distributed long-term storage, Prometheus solutions. For example, `foo` histogram might be sent, but `foo_bucket{le="1.1e+23"} 17` counter might be delayed or dropped accidentally, which risks triggering false positive alerts or no alerts, depending on the situation. 
* **Reliability:** Consumers of the TSDB data have to essentially guess the type semantics. There's nothing stopping users to write `foo_bucket` gauge or `foo_total` histogram.

### A Glimpse of Native Storage for Composite Types

The classic model was challenged by the introduction of [native histograms](https://prometheus.io/docs/specs/native_histograms/). TSDB was extended to store [composite histogram samples](https://github.com/prometheus/prometheus/blob/19fd0b0b1dbfe01a5e49f5d04544a7c5853c12bb/model/histogram/histogram.go#L50) other than float. We tend to call this a **Native** histogram, because TSDB can now "natively" store a full (sparse with sparse and exponential buckets) histogram as an atomic, composite sample. 

At that point, the common wisdom was to stop there. The special advanced histogram that's generally meant to replace the "classic" histograms uses composite sample, while the rest of the metrics use the classic model. Making other composite types consistent with the new native model felt extremely disruptive to users, with too much work and risks. A common counter-argument was that user will eventually migrate their classic histograms naturally, and summaries are also less useful, given the native histogram powerful bucketing and lower cost.

Unfortunately, the migration to native histograms was known to take time, given the slight PromQL change to use them, and the new bucketing and client changes needed (applications have to define new or edit existing metrics to new histograms). There will be also an old software used for long that never migrates. Eventually it leaves Prometheus with no chance of deprecating classic histograms, with all the software solutions required to support classic model, likely for decades.

However, native histograms did push TSDB and the ecosystem into that new composite sample pattern. Some of those changes could be easily adapted to all composite types. Native histograms also gave us a glimpse of many benefits of that native support. It was tempting to ask ourselves: **would it be possible to add native counterparts of the existing composite metrics to replace them, ideally transparently?**

Organically, in 2024, for transactionality and efficiency, we introduced [native histogram custom buckets(NHCB)](https://github.com/prometheus/proposals/blob/main/proposals/0031-classic-histograms-stored-as-native-histograms.md) concept that essentially allows storing classic histograms with the explicit buckets natively, reusing native histogram composite sample data structures.

NHCB has proven to be at least 30% more efficient than the classic representation, while offering functional parity with
classic histograms. However, two practical challenges emerged that slowed down the adoption: 

A) **Expanding** is relatively trivial, but **Combining** is often not feasible. We don't want to wait for client ecosystem adoption, so we envisioned NHCB being converted on scrape from the classic representation. That has proven to be quite expensive and has a reliability risk in edge cases because of the [previously mentioned transactionality](#classic-representation-primitive-samples) issue. Combination logic is also practically impossible on push receivers (e.g., remote write with classic histograms), as you could end up having different parts of the same histogram sample (e.g., buckets and count) sent via different remote write shards or sequential messages. This combination challenge is also why OpenTelemetry collector users see an extra overhead on `prometheusreceiver` as OpenTelemetry model strictly follows the composite sample model.

B) **Consumption** is slightly different, especially PromQL query syntax. Our initial decision was to surface NHCB histograms using native histogram-like PromQL syntax. For example the following classic histogram:

   ```
   foo_bucket{le="0.0"} 0
   # ...
   foo_bucket{le="1.1e+23"} 17
   foo_bucket{le="+Inf"} 17
   foo_count 17
   foo_sum 324789.3
   ```

   When we convert to NHCB, you no longer can use `foo_bucket` as your metric name selector. Since NHCB is now stored as a `foo` metric, you need to use:

   ```
   histogram_quantile(0.9, sum(foo{job="a"}))
   
   # Old syntax: histogram_quantile(0.9, sum(foo_bucket{job="a"}) by (le))
   ```

   On top of that, similar problems occur on other Prometheus outputs (federation, remote read, remote write).

> NOTE: Fun fact: Prometheus [client data model (SDKs)](https://github.com/prometheus/client_model) and `PrometheusProto`
> scrape protocol use the composite sample model already!

### Native Representation: Composite Samples

Let's go straight to the point: Organically, the Prometheus community seems to align with the idea of an **eventual move to a fully composite sample model on the storage layer**, given all the benefits. To avoid burdening users (and downstream projects) with migration pains and to deprecate the classic model ASAP for the sustainability of the Prometheus codebase, we seem to agree that this move has to be **a transparent storage layer detail** instead of new "native" types that users have to manually adopt.

Let's go through evidences of this direction, which also represents efforts you can contribute or adopt early!

1. We are discussing the "native" [summary](https://github.com/prometheus/prometheus/issues/16949) and [stateset](https://github.com/prometheus/prometheus/issues/17914) to fully eliminate classic model for all composite types. Feel free to join and help on that work!
2. We are working on [the OpenMetrics 2.0](https://docs.google.com/document/d/1FCD-38Xz1-9b3ExgHOeDTQUKUatzgj5KbCND9t-abZY/edit?tab=t.lvx6fags1fga#heading=h.uaaplxxbz60u) to consolidate and improve the pull protocol scene and apply the new learnings. One of the core changes will be the move to [composite values in text](https://github.com/prometheus/docs/pull/2679), which makes the text format trivial to parse for the storages that support composite types natively. This solves the **Combining (A)** challenge. Note that, by default, for now, all composite types will be still "expanded" to classic format on scrape, so there's no breaking change for users. Feel free to join our WG to help or give feedback.
3. Prometheus receive and export protocol has been updated. [Remote Write 2.0](https://prometheus.io/docs/specs/prw/remote_write_spec_2_0/) allows transporting histograms in the "native" form instead of a classic representation (classic one is still supported). In the future versions (e.g. 2.1), we could easily follow a similar pattern and add native summaries and stateset. Contributions welcome to [make Remote Write 2.0 stable](https://github.com/prometheus/prometheus/issues/16944)!
4. We are experimenting with the **Consumption (B)** compatibility modes that translate the composite types store as composite samples to classic representation. This is not trivial; there are edge cases, but it might be more feasible (and needed!) than we might have initially anticipated. See:
   * [PromQL compatibility mode for NHCB](https://github.com/prometheus/prometheus/issues/16948)
   * [Expanding on remote write](https://github.com/prometheus/prometheus/issues/17147)
   * We need expanding for federation too.

   On PromQL it might work as follows, for NHCB that used to be a classic histogram:
    
   ```
   # New syntax gives our "foo" NHCB:    
   histogram_quantile(0.9, sum(foo{job="a"}))
   # Old syntax still works, expanding "foo" NHCB to classic representation:
   histogram_quantile(0.9, sum(foo_bucket{job="a"}) by (le))
   ```

When implemented all those pieces should make it possible to fully switch different parts of your metric collection pipeline to native form **transparently**.

> CAUTION: The common pattern for migrating to native histograms or NHCBs was double-write -- you could have both `foo` NHCB/native histogram and classic histogram (`foo_bucket`, `foo_sum`, `foo_count` series) stored in Prometheus. This proven to be a bit challenging to implement and ensure reliability, it obviously adds more overhead, and it's hard to tell when to turn double write off in your systems. This mixed collection will also produce tricky cases  with the planned consumption (4th point above) compatibility mode (e.g. collision warnings). As a result, the compatibility mode provide a valid alternative to the previous double-write migration story.

## Summary

Moving Prometheus to a native composite type world is not easy and will take time, especially around coding, testing and optimizing. Notably it switches performance characteristics of the metric load from uniform, predictable sample sizes to a sample size that depends on a type. Another challenge is
coding -- maintaining different sample types already proven to be very verbose (we [need unions, Go!](https://github.com/prometheus/prometheus/issues/17925)).

However, the recent work revealed a very clean and **possible** path that yields clear benefits around functionality, transactionality, reliability, and efficiency in the very near future, which is pretty exciting!

If you have any questions around any changes feel free to:

* DM me on Slack.
* Visit `#prometheus-dev` Slack channel and share your questions.
* Comment on related issues, create PRs, also **review** PRs (the most impactful work!)

Prometheus community is also on KubeConEU 2026 in Amsterdam! Make sure to:

* Visit our Prometheus KubeCon booth.
* Attend our [Prometheus V3 One Year In: OpenMetrics 2.0 and More!](https://sched.co/2EF4F) session.
* Attend our [contributing workshop](https://sched.co/2EF7p).

I'm hoping we can share stories of other important, orthogonal shifts we see in the community in future posts. No promises (and help welcome!), but there's a lot to cover, such as (random order, not a full list):

1. Our native [start timestamp feature journey](https://github.com/prometheus/proposals/pull/60) that cleanly unblocks native [delta temporality](https://github.com/prometheus/proposals/pull/48) without hacks like abusing gauges, new metric types, or label annotations. `__temporality__` labels.
2. Optional [schematization of Prometheus metrics](https://sched.co/2CVzR) that attempt to solve a ton of stability problems with metric naming and shape; building on top of OpenTelemetry semconv.
3. Our [metadata storage journey](https://github.com/prometheus/prometheus/issues/12608) that attempts to improve the OpenTelemetry Entities and resource attributes storage and consumption experience.
4. Our journey to organize and extend Prometheus scrape pull protocols with the recent ownership move of OpenMetrics.
5. An incredible [TSDB Parquet](https://promcon.io/2025-munich/talks/beyond-tsdb-unlocking-prometheus-with-parquet-for-modern-scale/) effort, coming from the three LTS project groups (Cortex, Thanos, Mimir) working together, attempting to improve high cardinality cases. 
6. Fun experiments with PromQL extensions, like [PromQL with pipes and variables](https://github.com/prometheus/prometheus/pull/17487)and some new SQL transpilation ideas.
7. Governance changes.

See you in open-source!