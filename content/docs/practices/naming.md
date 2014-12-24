---
title: Metric and label naming
sort_rank: 1
---

# Metric and label naming

The metric and label conventions presented in this document are not required
for using Prometheus, but can serve as both a style-guide and collection of
best practices. Individual organizations might want to approach e.g. naming
conventions differently.

## Metric names

A metric name:

* should have a (single-word) application prefix relevant to the containing Prometheus domain
 * <code><b>prometheus</b>\_notifications\_total</code>
 * <code><b>indexer</b>\_requests\_latencies\_milliseconds</code>
 * <code><b>processor</b>\_requests\_total</code>
* must have a single unit (i.e. don't mix seconds with milliseconds)
* should have a units suffix
 * <code>api\_http\_request\_latency\_<b>milliseconds</b></code>
 * <code>node\_memory\_usage\_<b>bytes</b></code>
 * <code>api\_http\_requests\_<b>total</b></code> (for an accumulating count)
* should represent the same logical thing-being-measured
 * request duration
 * bytes of data transfer
 * instantaneous resource usage as a percentage

As a rule of thumb, if you `sum()` or `avg()` over all dimensions of a given
metric, the result should be meaningful (though not necessarily useful). If it
isn't meaningful, split the data up into multiple metrics. For example, having
the capacity of various queues in the metric is good, mixing the capacity of a
queue with the number of elements is not.

## Labels

Use labels to differentiate

* class of thing-being-measured
 * `api_http_requests_total` - differentiate request types: `type={create,update,delete}`
 * `api_request_duration_nanoseconds` - differentiate request stages: `stage={extract,transform,load}`

Remember that every unique (label, value) pair represents a new axis of
cardinality for the associated metric, which can dramatically increase the
amount of data stored.


