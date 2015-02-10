---
title: Metric types
sort_rank: 2
---

# Metric Types

The Prometheus client libraries offer three core metric types:

  * Counters
  * Gauges
  * Summaries

These metric types are currently only differentiated in the client libraries
(to enable APIs tailored to the usage of the specific types) and in the wire
protocol. The Prometheus server does not yet make use of the type information
and flattens all data into untyped time series. This may change in the future.

## Counter

A _counter_ is a cumulative metric that represents a single numerical value
that only ever goes up. A counter is typically used to count requests served,
tasks completed, errors occurred, etc. Counters should not be used to expose
current counts of items whose number can also go down, e.g. the number of
currently running goroutines. Use gauges for this use case.

See the client library usage documentation for counters:

   * [Go](http://godoc.org/github.com/prometheus/client_golang/prometheus#Counter)
   * [Java](https://github.com/prometheus/client_java/blob/master/client/src/main/java/io/prometheus/client/metrics/Counter.java)
   * [Java (simple client)](https://github.com/prometheus/client_java/blob/master/simpleclient/src/main/java/io/prometheus/client/Counter.java)
   * [Ruby](https://github.com/prometheus/client_ruby#counter)
   * [Python](https://github.com/prometheus/client_python#counter)

## Gauge

A _gauge_ is a metric that represents a single numerical value that can
arbitrarily go up and down.

Gauges are typically used for measured values like temperatures or current
memory usage, but also "counts" that can go up and down, like the number of
running goroutines.

See the client library usage documentation for gauges:

   * [Go](http://godoc.org/github.com/prometheus/client_golang/prometheus#Gauge)
   * [Java](https://github.com/prometheus/client_java/blob/master/client/src/main/java/io/prometheus/client/metrics/Gauge.java)
   * [Java (simple client)](https://github.com/prometheus/client_java/blob/master/simpleclient/src/main/java/io/prometheus/client/Gauge.java)
   * [Ruby](https://github.com/prometheus/client_ruby#gauge)
   * [Python](https://github.com/prometheus/client_python#gauge)

## Summaries

A _summary_ samples observations (usually things like request durations) over
sliding windows of time and provides instantaneous insight into their
distributions, frequencies, and sums.

A summary with a base metric name of `<basename>` exposes multiple time series
during a scrape:

  * streaming **quantile values** of observed events, exposed as `<basename>{quantile="<quantile label>"}`
  * the **total sum** of all observed values, exposed as `<basename>_sum`
  * the **count** of events that have been observed, exposed as `<basename>_count`

This is quite convenient, for if you are interested in tracking latencies of an
operation in real time, you get three types of information reported for free
with one metric.

A typical use-case is the observation of request latencies or response sizes.

See the client library usage documentation for summaries:

   * [Go](http://godoc.org/github.com/prometheus/client_golang/prometheus#Summary)
   * [Java](https://github.com/prometheus/client_java/blob/master/client/src/main/java/io/prometheus/client/metrics/Summary.java)
   * [Java (simple client)](https://github.com/prometheus/client_java/blob/master/simpleclient/src/main/java/io/prometheus/client/Summary.java)
   * [Ruby](https://github.com/prometheus/client_ruby#summary)
   * [Python](https://github.com/prometheus/client_python#summary)
