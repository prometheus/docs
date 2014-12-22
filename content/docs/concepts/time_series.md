---
title: Time series
sort_rank: 1
---

# Time series

Prometheus fundamentally stores all data as
[time series](http://en.wikipedia.org/wiki/Time_series): series of
timestamp values.

## Identification
Time series are uniquely identified by a _metric name_ and a set of _key-value
pairs_, also known as labels. Changing any label value, including adding or
removing a label, will result in a new time series.

Metric names must match the regular expression `[a-zA-Z_:][a-zA-Z0-9_:]`.

## Samples
Samples form the actual data that time series consist of. A sample consists of:

   * a value with float64-precision
   * a timestamp with millisecond-precision

## Notation
Given a metric name and a set of labels, we frequently identify time series using this notation:

    <metric name>{<label name>=<label value>, ...}

For example, a time series with the metric name `api_http_requests_total` and
the labels `method="POST"` and `handler="/messages"` could be written like
this:

    api_http_requests_total{method="POST", handler="/messages"}
