---
title: Metric types
sort_rank: 2
---

# Metric types

The Prometheus client libraries offer four core metric types. These are
currently only differentiated in the client libraries (to enable APIs tailored
to the usage of the specific types) and in the wire protocol. The Prometheus
server does not yet make use of the type information and flattens all data into
untyped time series. This may change in the future.

## Counter

A _counter_ is a cumulative metric that represents a single numerical value
that only ever goes up. A counter is typically used to count requests served,
tasks completed, errors occurred, etc. Counters should not be used to expose
current counts of items whose number can also go down, e.g. the number of
currently running goroutines. Use gauges for this use case.

Client library usage documentation for counters:

   * [Go](http://godoc.org/github.com/prometheus/client_golang/prometheus#Counter)
   * [Java](https://github.com/prometheus/client_java/blob/master/simpleclient/src/main/java/io/prometheus/client/Counter.java)
   * [Ruby](https://github.com/prometheus/client_ruby#counter)
   * [Python](https://github.com/prometheus/client_python#counter)

## Gauge

A _gauge_ is a metric that represents a single numerical value that can
arbitrarily go up and down.

Gauges are typically used for measured values like temperatures or current
memory usage, but also "counts" that can go up and down, like the number of
running goroutines.

Client library usage documentation for gauges:

   * [Go](http://godoc.org/github.com/prometheus/client_golang/prometheus#Gauge)
   * [Java](https://github.com/prometheus/client_java/blob/master/simpleclient/src/main/java/io/prometheus/client/Gauge.java)
   * [Ruby](https://github.com/prometheus/client_ruby#gauge)
   * [Python](https://github.com/prometheus/client_python#gauge)

## Histogram

A _histogram_ samples observations (usually things like request durations or
response sizes) and counts them in configurable buckets. It also provides a sum
of all observed values.

A histogram with a base metric name of `<basename>` exposes multiple time series
during a scrape:

  * cumulative counters for the observation buckets, exposed as `<basename>_bucket{le="<upper inclusive bound>"}`
  * the **total sum** of all observed values, exposed as `<basename>_sum`
  * the **count** of events that have been observed, exposed as `<basename>_count` (identical to `<basename>_bucket{le="+Inf"}` above)

Use the
[`histogram_quantile()` function](/docs/querying/functions/#histogram_quantile)
to calculate quantiles from histograms or even aggregations of histograms. A
histogram is also suitable to calculate an
[Apdex score](http://en.wikipedia.org/wiki/Apdex). When operating on buckets,
remember that the histogram is
[cumulative](https://en.wikipedia.org/wiki/Histogram#Cumulative_histogram). See
[histograms and summaries](/docs/practices/histograms) for details of histogram
usage and differences to [summaries](#summary).

Client library usage documentation for histograms:

   * [Go](http://godoc.org/github.com/prometheus/client_golang/prometheus#Histogram)
   * [Java](https://github.com/prometheus/client_java/blob/master/simpleclient/src/main/java/io/prometheus/client/Histogram.java)
   * [Python](https://github.com/prometheus/client_python#histogram)

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

Client library usage documentation for summaries:

   * [Go](http://godoc.org/github.com/prometheus/client_golang/prometheus#Summary)
   * [Java](https://github.com/prometheus/client_java/blob/master/simpleclient/src/main/java/io/prometheus/client/Summary.java)
   * [Ruby](https://github.com/prometheus/client_ruby#summary)
   * [Python](https://github.com/prometheus/client_python#summary)
