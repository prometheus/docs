---
title: Metric and label naming
sort_rank: 1
---

# Metric and label naming

The metric and label conventions presented in this document are not required
for using Prometheus, but can serve as both a style-guide and collection of
best practices. Individual organizations may want to approach e.g. naming
conventions differently.

## Metric names

A metric name:

* should have a (single-word) application prefix relevant to the containing Prometheus domain
 * <code><b>prometheus</b>\_notifications\_total</code>
 * <code><b>indexer</b>\_requests\_latencies\_milliseconds</code>
 * <code><b>processor</b>\_requests\_total</code>
* must have a single unit (i.e. do not mix seconds with milliseconds)
* should have a units suffix
 * <code>api\_http\_request\_latency\_<b>milliseconds</b></code>
 * <code>node\_memory\_usage\_<b>bytes</b></code>
 * <code>api\_http\_requests\_<b>total</b></code> (for an accumulating count)
* should represent the same logical thing-being-measured across all label dimensions
 * request duration
 * bytes of data transfer
 * instantaneous resource usage as a percentage

As a rule of thumb, either the `sum()` or the `avg()` over all dimensions of a
given metric should be meaningful (though not necessarily useful). If it is not
meaningful, split the data up into multiple metrics. For example, having the
capacity of various queues in one metric is good, while mixing the capacity of a
queue with the current number of elements in the queue is not.

## Labels

Use labels to differentiate the characteristics of the thing that is being measured:

 * `api_http_requests_total` - differentiate request types: `type="create|update|delete"`
 * `api_request_duration_nanoseconds` - differentiate request stages: `stage="extract|transform|load"`

Do not put the label names in the metric name, as this introduces redundancy
and will cause confusion if the respective labels are aggregated away.

CAUTION: <b>CAUTION:</b> Remember that every unique key-value label pair
represents a new time series, which can dramatically increase the amount of
data stored. Do not use labels to store dimensions with high cardinality (many
different label values), such as user IDs, email addresses, or other unbounded
sets of values.
