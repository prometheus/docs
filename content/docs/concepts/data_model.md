---
title: Data model
sort_rank: 1
---

# Data model

Prometheus fundamentally stores all data as [_time
series_](http://en.wikipedia.org/wiki/Time_series): streams of timestamped
values belonging to the same metric and the same set of labeled dimensions.
Besides stored time series, Prometheus may generate temporary derived time series
as the result of queries.

## Metric names and labels

Every time series is uniquely identified by its metric name and optional key-value pairs called labels.

***Metric names:***

 * Specify the general feature of a system that is measured (e.g. `http_requests_total` - the total number of HTTP requests received).
 * In Prometheus 2.x, metric names must contain only ASCII letters, digits, underscores, and colons, matching `[a-zA-Z_:][a-zA-Z0-9_:]*`.
 * In Prometheus 3.x, it is still recommended to use ASCII, but Unicode letters and special characters are also allowed in metric names. That include dashes `-` and dots `.`.
 * To use metric names with Unicode characters or special characters in Prometheus 3.0 queries, you can reference the metric name between double quotes in curly braces. For example, to query a metric named `foo-bar`, use `{"foo-bar"}`. Other labels must be specified in the same curly braces: `{"goo-bar", foo="bar"}`.

Note: Colons are reserved for user-defined recording rules. They should not be used by exporters or in direct instrumentation code.

***Metric labels:***

 * Labels allow Prometheus to track different dimensions for the same metric name (for example, all HTTP POST requests to `/api/tracks`).
 * A new time series is created whenever you add, remove, or change any label values.
 * In Prometheus 2.x, label names use the regex `[a-zA-Z_][a-zA-Z0-9_]*`.
 * In Prometheus 3.x, Unicode characters and special characters are also allowed. That include dashes `-` and dots `.`.
 * Label names starting with `__` (two underscores) remain reserved for internal usage.
 * Label values may contain any Unicode characters in both Prometheus 2.x and 3.0.
 * To query label names with Unicode and special characters in Prometheus 3.0, simply specify them between double quotes: `sum by ("my-instance") (my_metric)`.

See also the [best practices for naming metrics and labels](/docs/practices/naming/).

## Samples

Samples form the actual time series data. Each sample consists of:

   * a float64 value
   * a millisecond-precision timestamp

NOTE: Beginning with Prometheus v2.40, there is experimental support for native
histograms. Instead of a simple float64, the sample value may now take the form
of a full histogram.

## Notation

Given a metric name and a set of labels, time series are frequently identified
using this notation:

    <metric name>{<label name>=<label value>, ...}

For example, a time series with the metric name `api_http_requests_total` and
the labels `method="POST"` and `handler="/messages"` could be written like
this:

    api_http_requests_total{method="POST", handler="/messages"}

This is the same notation that [OpenTSDB](http://opentsdb.net/) uses.
