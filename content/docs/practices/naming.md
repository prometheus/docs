---
title: Metric and label naming
sort_rank: 1
---

# Metric and label naming

The metric and label conventions presented in this document are not required
for using Prometheus, but can serve as both a style-guide and a collection of
best practices. Individual organizations may want to approach some of these 
practices, e.g. naming conventions, differently.

## Metric names

A metric name...

* ...should have a (single-word) application prefix relevant to the domain the
  metric belongs to. The prefix is sometimes referred to as `namespace` by
  client libraries. For metrics specific to an application, the prefix is
  usually the application name itself. Sometimes, however, metrics are more
  generic, like standardized metrics exported by client libraries. Examples:
 * <code><b>prometheus</b>\_notifications\_total</code>
   (specific to the Prometheus server)
 * <code><b>process</b>\_cpu\_seconds\_total</code>
   (exported by many client libraries)
 * <code><b>http</b>\_request\_duration\_seconds</code>
   (for all HTTP requests)
* ...must have a single unit (i.e. do not mix seconds with milliseconds, or seconds with bytes).
* ...should use base units (e.g. seconds, bytes, meters - not milliseconds, megabytes, kilometers).
* ...should have a suffix describing the unit, in plural form. Note that an accumulating count has `total` as a suffix, in addition to the unit if applicable.
 * <code>http\_request\_duration\_<b>seconds</b></code>
 * <code>node\_memory\_usage\_<b>bytes</b></code>
 * <code>http\_requests\_<b>total</b></code>
   (for a unit-less accumulating count)
 * <code>process\_cpu\_<b>seconds\_total</b></code>
   (for an accumulating count with unit)
* ...should represent the same logical thing-being-measured across all label
  dimensions.
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
 * `api_request_duration_seconds` - differentiate request stages: `stage="extract|transform|load"`

Do not put the label names in the metric name, as this introduces redundancy
and will cause confusion if the respective labels are aggregated away.

CAUTION: **CAUTION:** Remember that every unique combination of key-value label
pairs represents a new time series, which can dramatically increase the amount
of data stored. Do not use labels to store dimensions with high cardinality
(many different label values), such as user IDs, email addresses, or other
unbounded sets of values.
