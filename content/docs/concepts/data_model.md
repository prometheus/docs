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
 * Metric names may contain ASCII letters, digits, underscores, and colons. It must match the regex `[a-zA-Z_:][a-zA-Z0-9_:]*`.
   
Note: The colons are reserved for user defined recording rules. They should not be used by exporters or direct instrumentation.



***Metric labels:***

 * Enable Prometheus's dimensional data model to identify any given combination of labels for the same metric name. It identifies a particular dimensional instantiation of that metric (for example: all HTTP requests that used the method `POST` to the `/api/tracks` handler). The query language allows filtering and aggregation based on these dimensions. 
 * The change of any labels value, including adding or removing labels, will create a new time series.
 * Labels may contain ASCII letters, numbers, as well as underscores. They must match the regex `[a-zA-Z_][a-zA-Z0-9_]*`. 
 * Label names beginning with `__` (two "_") are reserved for internal use.
 * Label values may contain any Unicode characters.
 * Labels with an empty label value are considered equivalent to labels that do not exist.


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
