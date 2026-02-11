---
title: "Modernizing Prometheus: Native Types"
created_at: 2025-02-14
kind: article
author_name: "Bartłomiej Płotka (@bwplotka)"
---

For the last year, Prometheus community has been hard-working on several interesting and ambitious changes that previously could have been seen as controversial or not feasible. While there might little visibility about those from the outside (e.g. it's not an OpenClaw Prometheus plugin, sorry 🙃), Prometheus developers are, **organically**, steering Prometheus into a certain, coherent future. Piece-by-piece we accidentally go closer to goals we never dreamed we will achieve as an open-source project!

This post starts (hopefully!) as series of blog posts that share a few ambitious shifts that might be exciting to new and existing Prometheus users and developers. In this post I'd love to focus on the concept of **Native Types** which transforms Prometheus TSDB and ecosystem to an even better timeseries database. Make sure to check the provided inlined links on how you can adopt those changes early or contribute! Enjoy.  

> NOTE: Disclaimer: This post is intended as a fun overview, from my own personal point of view as a Prometheus maintainer. Some of the mentioned changes haven't been (yet) officially approved by the Prometheus Team; some of them were not proved in production.

This post was written by humans; AI was used only for cosmetic and grammar fixes. 

<!-- more -->

## Native Storage for Complex Metric Types

As you might know, Prometheus data model (so server, PromQL, protocols) supports `gauges`, `counters`, `histograms` and `summaries`. [OpenMetrics 1.0](https://prometheus.io/docs/specs/om/open_metrics_spec/) extended this with `gaugehistogram`, `info` and `stateset` types.

Impressively, Prometheus TSDB storage implementation had explicitly clean and simple data model. TSDB was allowing to store and retrieve string labelled samples containing only `float64` value and `int64` timestamp. Absolutely type agnostic.

The metric types were virtually implied on top of the TSDB, for humans and simple semantics on PromQL engine. For simplicity,
let's call this way of storing types a **Classic** type model or representation.

* `gauge` is a "default" primitive type, no rules, just a float sample with labels.
* `counter` is a second primitive type. The only (soft) rule is that it should have `_total` suffix in name for humans to understand its semantics
    
```
foo_total 17.0
```
  
* `info` needs `_info` suffix and has to have value of 1.

Fun begins when it comes to **Complex** type. We call those "complex", because in a classic representation, they are represented as a set of float samples:

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
  
* `gaugehistogram`, `summary`, `stateset` type follow the same logic - a group of special `counters`.

Classic model served Prometheus project well and simplified the storage implementation, making Prometheus one the most optimized,
open-source times-series database, with distributed versions based on the same model available in projects like Cortex, Thanos and Mimir.

Unfortunately, there are always tradeoffs. This generic type model has a few limitations:

* **Efficiency:** It tends to yield overhead for complex types, because every new piece of data (e.g. new bucket) takes a precious index space (it's a new unique series), where-as samples are significantly more compressible (rarely change, time oriented).
* **Functionality:** It poses limitations to shape and flexibility of the data you store (unless we'd go into some JSON encoded labels, which has massive downsides). 
* **Transactionality:** Parts of complex values (separate counters) are processed independently. While we did a lot of work to ensure write isolation and transactionality for scrapes, transactionality completely breaks apart when data is received or send via remote write, OTLP protocols or for distributed long-term storage Prometheus solutions. For example `foo` histogram might be sent but `foo_bucket{le="1.1e+23"} 17` counter might be delayed or dropped accidentally, which is critical inconsistency risk. 
* **Reliability:** Consumers of the TSDB data have to essentially guess the type semantics. There's nothing stopping users to write `foo_bucket` gauge or `foo_total` histogram.

### Glimpse of Native Model

Classic model was challenged by the introduction of [native histograms](https://prometheus.io/docs/specs/native_histograms/). TSDB was extended to store [complex samples](https://github.com/prometheus/prometheus/blob/19fd0b0b1dbfe01a5e49f5d04544a7c5853c12bb/model/histogram/histogram.go#L50) other than float. We call this a **Native** model, which was introduced for a new sparse and exponential bucket-ed histograms.

At that point, the common wisdom was to stop there. Special advanced histogram that's meant to replace "classic" histogram is native, rest of metrics use classic model. Making other complex types consistent with the native model felt extremely disruptive to users, with too much work and risks.

On top of that migration to native histograms was known to take time, given the slight PromQL change to use then, new bucketing and clients changes needed (apps has to define new or edit existing metrics to new histograms). Eventually it left 
Prometheus with no chance of deprecating classic histograms, probably ever.

However, native histogram did push TSDB into new implementation patterns for the native types that could be applied to other complex types. It also gave us a glimpse of many benefits of a native model. It was tempting to ask ourselves: **would it be possible to add native counterparts of the existing complex metrics to replace them fully?**

Organically, in 2024, for transactionality and efficiency, we introduced [NHCB (native histogram custom buckets)](https://github.com/prometheus/proposals/blob/main/proposals/0031-classic-histograms-stored-as-native-histograms.md) concept that essentially allows storing "classic" histograms with explicit buckets natively, so all information in a single sample (reusing native histogram data structures).

NHCB proven to be at least 30% more efficient than the classic storage on all metrics, while offering functional parity with
classic histograms and transactionality. Two practical challenges emerge that slows down adoption: 

A) Consumption, especially PromQL query changes slightly. Our initial decision was to surface NHCB histograms using native histogram-like PromQL syntax. Notably the "native" form surfaces the consumption layers: Instead of `foo_bucket` you would query `foo` or some new counterpart function like [`histogram_bucket`](https://github.com/prometheus/prometheus/pull/18030). Then on Prometheus outputs (federation, remote write) there are issues if the further storage hops don't support the native types.
B) "Expanding" is relatively trivial, "Combining" is often not feasible: We don't want to wait for client ecosystem adoption, so we envisioned NHCB being converted on scrape from the classic representation. That has been proven to be actually expensive and has reliability risk on edge cases because of the previously mentioned transactionality issue. "Combination" logic is also practically impossible on push receivers e.g. remote write with classic histograms as you could end up having different parts of the same histogram sample (e.g. buckets and count) sent via different remote write shards or sequential messages. The "combination" is also OpenTelemetry collector user see an extra overhead on `prometheusreceiver` as Otel has a native model, by design.

> NOTE: Fun fact: Prometheus [client data model (SDKs)](https://github.com/prometheus/client_model) is fully native already!

### Organic Native Model

Let's go straight to the point -- organically, Prometheus community seems to align with the idea of **eventual move to a full native model on storage layer**, given all the benefits. To not leave the migration pains to users (and downstream projects) and to kill classic model ASAP for the sustainability of Prometheus codebase, we seem to agree that this move has to be **a transparent storage layer detail** instead of new native types that users has to manually adopt.

Let's go through evidences of this direction, which also represents efforts you can contribute or adopt early!

1. We are discussing native type storage implementations for the native [summaries](https://github.com/prometheus/prometheus/issues/16949) and [stateset](https://github.com/prometheus/prometheus/issues/17914) to fully eliminate classic model for all complex types. Feel free to join and help on that work!
2. We are working on [the OpenMetrics 2.0](https://docs.google.com/document/d/1FCD-38Xz1-9b3ExgHOeDTQUKUatzgj5KbCND9t-abZY/edit?tab=t.lvx6fags1fga#heading=h.uaaplxxbz60u) to consolidate and improve pull protocol scene with new learnings. One of the core changes will be the move to [composite types in text](https://github.com/prometheus/docs/pull/2679) which makes the text format trivial to parse for the native complex types ingestors, solving the **Combining** challenge, similar to what `PrometheusProto` is doing now. Note that, by default, all native types will be still "expanded" to classic format in storage, so no breaking changes for users. Feel free to join our WG to help or give feedback.
3. Prometheus receive and export protocol has been updated. [Remote Write 2.0](https://prometheus.io/docs/specs/prw/remote_write_spec_2_0/) allows transporting histograms in the "native" form instead of a classic representation (classic one is still supported). In future versions (e.g. 2.1) we could easily follow similar pattern and add native summaries and stateset. Contributions welcome to [make Remote Write 2.0 stable](https://github.com/prometheus/prometheus/issues/16944)!
4. We are experimenting with consumption compatibility modes that surface native types as classic ones. This is not trivial, there are edge cases, but it might be more feasibly (and needed!) than we might have initially thought. See:
   * [PromQL compatibility mode for NHCB](https://github.com/prometheus/prometheus/issues/16948)
   * [Expanding on remote write](https://github.com/prometheus/prometheus/issues/17147)
   * We need something for federation too (add issue TBD)

When implemented all those pieces should make it possible to fully switch different parts of your metric collection pipeline to native form **transparently**.

## Summary

Moving Prometheus to a native type world is not easy and will take time, especially around coding, testing and optimizing. But it reveals very clean and **possible** path for clear benefits around functionality, transactionality, reliability and efficiency in the very near future, which is pretty exciting to me!

If you have any questions around any changes feel free to:

* DM me on Slack.
* Visit `#prometheus-dev` Slack channel and share your questions.
* Comment on related issues, create PRs, also **review** PRs (the most impactful work!)

Prometheus community is also on KubeConEU 2026 in Amsterdam! Make sure to:

* Visit our Prometheus KubeCon booth.
* Attend our [Prometheus V3 One Year In: OpenMetrics 2.0 and More!](https://sched.co/2EF4F) session.
* Attend our [contributing workshop](https://sched.co/2EF7p).

I wished we share stories of other important, orthogonal shifts we see in the community in the next posts. No promises (and help welcome!), but there's a lot to explain about (random order, not a full list):

1. Our native [start timestamp feature journey](https://github.com/prometheus/proposals/pull/60) that cleanly unblocks native [delta temporality](https://github.com/prometheus/proposals/pull/48) without hacks like abusing gauges, new metric types, or label annotations. `__temporality__` labels.
2. Optional [schematization of Prometheus metrics](https://sched.co/2CVzR) that attempt to solve a ton of stability problems with metric naming and shape; building on top of OpenTelemetry semconv.
3. Our metadata storage journey that attempts to [improve](https://github.com/prometheus/proposals/pull/71), still developed, OpenTelemetry Entities and resource attributes concepts.
4. Our journey to organize and extend Prometheus scrape pull protocols with the recent ownership move of OpenMetrics.
5. An incredible [TSDB Parquet](https://promcon.io/2025-munich/talks/beyond-tsdb-unlocking-prometheus-with-parquet-for-modern-scale/) effort, coming from the three LTS project groups (Cortex, Thanos, Mimir) working together, attempting to improve high cardinality cases. 
6. Fun experiments with PromQL extensions, like [PromQL with pipes and variables](https://github.com/prometheus/prometheus/pull/17487)and some new SQL transpilation ideas.

See You in open-source!