---
title: Data model
sort_rank: 1
---

Prometheus fundamentally stores all data as [_time
series_](http://en.wikipedia.org/wiki/Time_series): streams of timestamped
values belonging to the same metric and the same set of labeled dimensions.
Besides stored time series, Prometheus may generate temporary derived time series
as the result of queries.

## Metric names and labels

Every time series is uniquely identified by its metric name and optional key-value pairs called labels.

***Metric names:***

* Metric names SHOULD specify the general feature of a system that is measured (e.g. `http_requests_total` - the total number of HTTP requests received).
* Metric names MAY use any UTF-8 characters.
* Metric names SHOULD match the regex `[a-zA-Z_:][a-zA-Z0-9_:]*` for the best experience and compatibility (see the warning below). Metric names outside of that set will require quoting e.g. when used in PromQL (see the [UTF-8 guide](../guides/utf8.md#querying)).

NOTE: Colons (':') are reserved for user-defined recording rules. They SHOULD NOT be used by exporters or direct instrumentation.

***Metric labels:***

Labels let you capture different instances of the same metric name. For example: all HTTP requests that used the method `POST` to the `/api/tracks` handler. We refer to this as Prometheus's "dimensional data model". The query language allows filtering and aggregation based on these dimensions. The change of any label's value, including adding or removing labels, will create a new time series.

* Label names MAY use any UTF-8 characters.
* Label names beginning with `__` (two underscores) MUST be reserved for internal Prometheus use.
* Label names SHOULD match the regex `[a-zA-Z_][a-zA-Z0-9_]*` for the best experience and compatibility (see the warning below). Label names outside of that regex will require quoting e.g. when used in PromQL (see the [UTF-8 guide](../guides/utf8.md#querying)).
* Label values MAY contain any UTF-8 characters.
* Labels with an empty label value are considered equivalent to labels that do not exist.

WARNING: The [UTF-8](../guides/utf8.md) support for metric and label names was added relatively recently in Prometheus v3.0.0. It might take time for the wider ecosystem (downstream PromQL compatible projects and vendors, tooling, third-party instrumentation, collectors, etc.) to adopt new quoting mechanisms, relaxed validation etc. For the best compatibility it's recommended to stick to the recommended ("SHOULD") character set.

INFO: See also the [best practices for naming metrics and labels](/docs/practices/naming/).

## Samples

Samples form the actual time series data. Each sample consists of:

* a float64 or [native histogram](https://prometheus.io/docs/specs/native_histograms/) value
* a millisecond-precision timestamp

## Notation

Given a metric name and a set of labels, time series are frequently identified
using this notation:

    <metric name>{<label name>="<label value>", ...}

For example, a time series with the metric name `api_http_requests_total` and
the labels `method="POST"` and `handler="/messages"` could be written like
this:

    api_http_requests_total{method="POST", handler="/messages"}

This is the same notation that [OpenTSDB](http://opentsdb.net/) uses.

Names with UTF-8 characters outside the recommended set must be quoted, using
this notation:

    {"<metric name>", <label name>="<label value>", ...}

Since metric name are internally represented as a label pair
with a special label name (`__name__="<metric name>"`) one could also use the following notation:

    {__name__="<metric name>", <label name>="<label value>", ...}

