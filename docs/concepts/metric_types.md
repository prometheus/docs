---
title: Metric types
sort_rank: 2
---

The Prometheus instrumentation libraries offer four core metric types. With the
exception of native histograms, these are currently only differentiated in the
API of instrumentation libraries and in the exposition protocols.
The Prometheus server does not yet make
use of the type information and flattens all types except native histograms
into untyped time series of floating point values. Native histograms, however,
are ingested as time series of special composite histogram samples. In the
future, Prometheus might handle other metric types as [composite
types](/blog/2026/02/14/modernizing-prometheus-composite-samples/), too. There
is also ongoing work to persist the type information of the simple float
samples.

## Counter

A _counter_ is a cumulative metric that represents a single [monotonically
increasing counter](https://en.wikipedia.org/wiki/Monotonic_function) whose
value can only increase or be reset to zero on restart. For example, you can
use a counter to represent the number of requests served, tasks completed, or
errors.

Do not use a counter to expose a value that can decrease. For example, do not
use a counter for the number of currently running processes; instead use a gauge.

Instrumentation library usage documentation for counters:

   * [Go](http://godoc.org/github.com/prometheus/client_golang/prometheus#Counter)
   * [Java](https://prometheus.github.io/client_java/getting-started/metric-types/#counter)
   * [Python](https://prometheus.github.io/client_python/instrumenting/counter/)
   * [Ruby](https://github.com/prometheus/client_ruby#counter)
   * [.Net](https://github.com/prometheus-net/prometheus-net#counters)
   * [Rust](https://docs.rs/prometheus-client/latest/prometheus_client/metrics/counter/index.html)

## Gauge

A _gauge_ is a metric that represents a single numerical value that can
arbitrarily go up and down.

Gauges are typically used for measured values like temperatures or current
memory usage, but also "counts" that can go up and down, like the number of
concurrent requests.

Instrumentation library usage documentation for gauges:

   * [Go](http://godoc.org/github.com/prometheus/client_golang/prometheus#Gauge)
   * [Java](https://prometheus.github.io/client_java/getting-started/metric-types/#gauge)
   * [Python](https://prometheus.github.io/client_python/instrumenting/gauge/)
   * [Ruby](https://github.com/prometheus/client_ruby#gauge)
   * [.Net](https://github.com/prometheus-net/prometheus-net#gauges)
   * [Rust](https://docs.rs/prometheus-client/latest/prometheus_client/metrics/gauge/index.html)

## Histogram

A _histogram_ records observations (usually things like request durations or
response sizes) by counting them in configurable buckets. It also provides a sum
of all observed values. As such, a histogram is essentially a bucketed counter.
However, a histogram can also represent the current state of a distribution, in
which case it is called a _gauge histogram_. In contrast to the usual
counter-like histograms, gauge histograms are rarely directly exposed by
instrumented programs and are thus not (yet) usable in instrumentation
libraries, but they are represented in newer versions of the protobuf
exposition format and in [OpenMetrics](https://openmetrics.io/). They are also
created regularly by PromQL expressions. For example, the outcome of applying
the `rate` function to a counter histogram is a gauge histogram, in the same
way as the outcome of applying the `rate` function to a counter is a gauge.

Histograms exists in two fundamentally different versions: The more recent
_native histograms_ and the older _classic histograms_.

A native histogram is exposed and ingested as composite samples, where each
sample represents the count and sum of observations together with a dynamic set
of buckets.

A classic histogram, however, consists of multiple time series of simple float
samples. A classic histogram with a base metric name of `<basename>` results in
the following time series:

  * cumulative counters for the observation buckets, exposed as
    `<basename>_bucket{le="<upper inclusive bound>"}`
  * the **total sum** of all observed values, exposed as `<basename>_sum`
  * the **count** of events that have been observed, exposed as
    `<basename>_count` (identical to `<basename>_bucket{le="+Inf"}` above)

Native histograms are generally much more efficient than classic histograms,
allow much higher resolution, do not require explicit configuration of bucket
boundaries during instrumentation, and provide atomicity when transferred over
the network (e.g. via the Prometheus remote write procol, where classic
histograms suffer from possible partial transfer because their constituent time
series are transferred independently). Their bucketing schema ensures that they
are always aggregatable with each other, even if the resolution might have
changed, while classic histograms with different bucket boundaries are not
generally aggregatable. If the instrumentation library you are using supports
native histograms (currently this is the case for Go and Java), you should
probably [prefer native histograms over classic
histograms](/docs/practices/histograms).

If you are stuck with classic histograms for whatever reason, there is a way to
get at least some of the benefits of native histograms: You can configure
Prometheus to ingest classic histograms into a special form of native
histograms, called Native Histograms with Custom Bucket boundaries (NHCB).
NHCBs are stored as the same composite samples as usual native histograms,
providing increased efficiency and atomic network transfers, similar to regular
native histgorms. However, the buckets of NHCBs still have the same layout as
in their classic counterparts, statically configured during instrumentation,
with the same limited resolution and range and the same problems of
aggregatability upon changing the bucket boundaries.

Use the [`histogram_quantile()`
function](/docs/prometheus/latest/querying/functions/#histogram_quantile) to
calculate quantiles from histograms or even aggregations of histograms. It
works for both classic and native histograms, using a slightly different
syntax. Histograms are also suitable to calculate an [Apdex
score](http://en.wikipedia.org/wiki/Apdex).

You can operate directly on the buckets of a classic histogram, as they are
represented as individual series (called `<basename>_bucket{le="<upper
inclusive bound>"}` as described above). Remember, however, that these buckets
are [cumulative](https://en.wikipedia.org/wiki/Histogram#Cumulative_histogram),
i.e. every bucket counts all observations less than or equal to the upper
boundary provided as a label. With native histograms, you can look at
observations within given boundaries with the [`histogram_fraction()`
function](/docs/prometheus/latest/querying/functions/#histogram_fraction) (to
calculate fractions of observations) and the [trim operators]() (to filter for
the desired band of observations).

See [histograms and summaries](/docs/practices/histograms) for details of
histogram usage and differences to [summaries](#summary).

NOTE: Beginning with Prometheus v3.0, the values of the `le` label of classic
histograms are normalized during ingestion to follow the format of
[OpenMetrics Canonical Numbers](https://github.com/prometheus/OpenMetrics/blob/main/specification/OpenMetrics.md#considerations-canonical-numbers).

Instrumentation library usage documentation for histograms:

   * [Go](http://godoc.org/github.com/prometheus/client_golang/prometheus#Histogram)
   * [Java](https://prometheus.github.io/client_java/getting-started/metric-types/#histogram)
   * [Python](https://prometheus.github.io/client_python/instrumenting/histogram/)
   * [Ruby](https://github.com/prometheus/client_ruby#histogram)
   * [.Net](https://github.com/prometheus-net/prometheus-net#histogram)
   * [Rust](https://docs.rs/prometheus-client/latest/prometheus_client/metrics/histogram/index.html)

## Summary

Similar to a _histogram_, a _summary_ samples observations (usually things like
request durations and response sizes). While it also provides a total count of
observations and a sum of all observed values, it calculates configurable
quantiles over a sliding time window.

A summary with a base metric name of `<basename>` exposes multiple time series
during a scrape:

  * streaming **φ-quantiles** (0 ≤ φ ≤ 1) of observed events, exposed as `<basename>{quantile="<φ>"}`
  * the **total sum** of all observed values, exposed as `<basename>_sum`
  * the **count** of events that have been observed, exposed as `<basename>_count`

See [histograms and summaries](/docs/practices/histograms) for
detailed explanations of φ-quantiles, summary usage, and differences
to [histograms](#histogram).

NOTE: Beginning with Prometheus v3.0, the values of the `quantile` label are normalized during
ingestion to follow the format of [OpenMetrics Canonical Numbers](https://github.com/prometheus/OpenMetrics/blob/main/specification/OpenMetrics.md#considerations-canonical-numbers).

Instrumentation library usage documentation for summaries:

   * [Go](http://godoc.org/github.com/prometheus/client_golang/prometheus#Summary)
   * [Java](https://prometheus.github.io/client_java/getting-started/metric-types/#summary)
   * [Python](https://prometheus.github.io/client_python/instrumenting/summary/)
   * [Ruby](https://github.com/prometheus/client_ruby#summary)
   * [.Net](https://github.com/prometheus-net/prometheus-net#summary)
