---
title: Basics
sort_rank: 1
---

# Querying Prometheus

Prometheus provides a functional expression language that lets the user select
and aggregate time series data in real time. The result of an expression can
either be shown as a graph, viewed as tabular data in Prometheus's expression
browser, or consumed by external systems via the HTTP API.

## Examples

This document is meant as a reference. For learning, it might be easier to
start with a couple of [examples](/docs/querying/examples/).

## Expression Language Data Types

In Prometheus's expression language, an expression or sub-expression can
evaluate to one of four types:

* **Instant vector** - a set of time series containing a single sample for each time series, all sharing the same timestamp
* **Range vector** - a set of time series containing a range of data points over time for each time series
* **Scalar** - a simple numeric floating point value
* **String** - a simple string value; currently unused

Depending on the use-case (e.g. when graphing vs. displaying the output of an
expression), only some of these types are legal as the result from a
user-specified expression. For example, an expression that returns an instant
vector is the only type that can be directly graphed.

## Literals

### String Literals

Strings may be specified as literals in single or double quotes.

Example:

    "this is a string"

### Float Literals

Scalar float values can be literally written as numbers of the form
`[-](digits)[.(digits)]`.

    -2.43

## Time series Selectors

### Instant Vector Selectors

Instant vector selectors allow the selection of a set of time series and a
single sample value for each at a given timestamp (instant): in the simplest
form, only a metric name is specified. This results in an instant vector
containing elements for all time series that have this metric name.

This example selects all time series that have the `http_requests_total` metric
name:

    http_requests_total

It is possible to filter these time series further by appending a set of labels
to match in curly braces (`{}`).

This example selects only those time series with the `http_requests_total`
metric name that also have the `job` label set to `prometheus` and their
`group` label set to `canary`:

    http_requests_total{job="prometheus",group="canary"}

It is also possible to negatively match a label value, or to match label values
again regular expressions. The following label matching operators exist:

* `=`: Select labels that are exactly equal to the provided string.
* `!=`: Select labels that are not equal to the provided string.
* `=~`: Select labels that regex-match the provided string (or substring).
* `!~`: Select labels that do not regex-match the provided string (or substring).

For example, this selects all `http_requests_total` time series for `staging`,
`testing`, and `development` environments and HTTP methods other than `GET`.

    http_requests_total{environment=~"staging|testing|development",method!="GET"}

### Range Vector Selectors

Range vector literals work like instant vector literals, except that they
select a range of samples back from the current instant. Syntactically, a range
duration is appended in square brackets (`[]`) at the end of a vector selector
to specify how far back in time values should be fetched for each resulting
range vector element.

Time durations are specified as a number, followed immediately by one of the
following units:

* `s` - seconds
* `m` - minutes
* `h` - hours
* `d` - days
* `w` - weeks
* `y` - years

In this example, we select all the values we have recorded within the last 5
minutes for all time series that have the metric name `http_requests_total` and
a `job` label set to `prometheus`:

    http_requests_total{job="prometheus"}[5m]

## Operators

Prometheus supports many binary and aggregation operators. These are described
in detail in the [expression language operators](/docs/querying/operators/) page.

## Functions

Prometheus supports several functions to operate on data. These are described
in detail in the [expression language functions](/docs/querying/functions/) page.

## Gotchas

### Interpolation and staleness

When queries are run, timestamps at which to sample data are selected
independent of the actual present time series data. This is mainly to support
cases like aggregation (`sum`, `avg`, and so on), where multiple aggregated
time series do not exactly align in time. At every one of these predetermined
sampling times, Prometheus searches for the closest surrounding samples and
linearly interpolates a timestamp-value pair between the actual stored samples.
That means that the generated sample has timestamp and sample values which are
somewhere in between the timestamp and sample values of the surrounding samples
(depending on how close the query timestamp is to either surrounding point).

If no stored sample is found either (by default) 5 minutes before or after a
sampling timestamp, no interpolated sample is generated for this time series at
this point in time. This effectively means that time series "disappear" from
graphs at times where their latest collected sample is 5 older than 5 minutes.

NOTE: <b>NOTE:</b> Staleness and interpolation handling might change. See
https://github.com/prometheus/prometheus/issues/398 and
https://github.com/prometheus/prometheus/issues/386.

### Avoiding slow queries and overloads

If a query needs to operate on a very large amount of data, graphing it might
time out or overload the server or browser. Thus, when constructing queries
over unknown data, always start building the query in the tabular view of
Prometheus's expression browser until the result set seems reasonable
(hundreds, not thousands, of time series at most).  Only when you have filtered
or aggregated your data sufficiently, switch to graph mode. If the expression
still takes too long to graph ad-hoc, pre-record it via a [recording
rule](/docs/querying/rules/#recording-rules).

This is especially relevant for Prometheus's query language, where a bare
metric name selector like `api_http_requests_total` could expand to thousands
of time series with different labels. Also keep in mind that expressions which
aggregate over many time series will generate load on the server even if the
output is only a small number of time series. This is similar to how it would
be slow to sum all values of a column in a relational database, even if the
output value is only a single number.
