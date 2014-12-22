---
title: The basics
sort_rank: 1
---

# Querying Prometheus

## Overview

Prometheus provides a functional expression language that lets the user select
and aggregate timeseries data in real-time. The result of an expression can
either be shown as a graph, viewed as data in the expression browser, or
consumed and further processed by external systems via the HTTP API.

## Examples

This document is meant as a reference. For learning, it might be easier to
start with a couple of examples. See the [Expression Language Examples](/using/querying/examples).

## Basic Concepts

### Timeseries

Data in Prometheus is stored as timeseries, which are uniquely identified by a
metric name and a set of arbitrary label/value pairs. Each timeseries can have
one or more data points attached to it. Data points are timestamp/value pairs.

#### Metric name
The metric name of a timeseries (e.g. `http_requests_total`) specifies the
general feature of a system that is measured. It may contain alpha-numeric
characters, plus underscores and colons.

#### Labels
The label/value pairs which identify a timeseries allow later filtering and
aggregation by these dimensions (e.g. `endpoint`, `response_code`, `instance`). Label keys
are identifiers (alpha-numeric characters plus underscores, but no colons),
while their values may be arbitrary strings.

#### Data points
Each timeseries can have one or more data points attached to it, which are
timestamp/value pairs. Values are always encoded as floating-point numbers
(currently 64-bit precision).

## Expression Language Data Types

In Prometheus' expression language, an expression or sub-expression can
evaluate to one of four types:

* **string**
* **scalar** - simple numeric floating point value
* **instant vector** - vector of multiple timeseries, containing a single sample for each timeseries, with all samples sharing the same (instant) timestamp
* **range vector** - vector of multiple timeseries, containing a range of data points over time for each timeseries

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

## Timeseries Selectors

### Instant Vector Selectors

Instant vector selectors allow the selection of a set of timeseries and a
single sample value for each at a given timestamp (instant): in the simplest
form, only a metric name is specified. This results in an instant vector
containing elements for all timeseries that have this metric name.

This example selects all timeseries that have the `http_requests_total` metric
name:

    http_requests_total

It is possible to filter these timeseries further by appending a set of labels
to match in curly braces (`{}`).

This example selects only those timeseries with the `http_requests_total`
metric name that also have the `job` label set to `prometheus` and their
`group` label set to `canary`:

    http_requests_total{job="prometheus",group="canary"}

It is also possible to negatively match a label value, or to match label values
again regular expressions. The following label matching operators exist:

* `=`: Select labels that are exactly equal to the provided string.
* `!=`: Select labels that are not equal to the provided string.
* `=~`: Select labels that regex-match the provided string (or substring).
* `!~`: Select labels that do not regex-match the provided string (or substring).

For example, this selects all `http_requests_total` timeseries for `staging`,
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
minutes for all timeseries that have the metric name `http_requests_total` and
a `job` label set to `prometheus`:

    http_requests_total{job="prometheus"}[5m]

## Operators

Prometheus supports many binary and aggregation operators. These are described
in detail in the [[Expression Language Operators]] page.

## Functions

Prometheus supports several functions to operate on data. These are described
in detail in the [[Expression Language Functions]] page.

## Gotchas

TODO:
* staleness and interpolation
* ...
