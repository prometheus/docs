---
title: Metric and label naming
sort_rank: 1
---

The metric and label conventions presented in this document are not required
for using Prometheus, but can serve as both a style-guide and a collection of
best practices. Individual organizations may want to approach some of these
practices, e.g. naming conventions, differently.

## Metric names

A metric name...

* ...MUST comply with the [data model](/docs/concepts/data_model/#metric-names-and-labels) for valid characters.
* ...SHOULD have a (single-word) application prefix relevant to the domain the
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
* ...MUST refer to a single unit (e.g. do not mix seconds with milliseconds) and to a single quantity (e.g. do not mix request size with request duration).
* ...SHOULD use base units (e.g. seconds, bytes, meters - not milliseconds, megabytes, kilometers). See [below](#base-units) for a list of base units.
* ...SHOULD have a suffix describing the unit, in plural form. Note that an accumulating count has `total` as a suffix, in addition to the unit if applicable. Also note that this applies to units in the narrow sense (like the units in the table below), but not to countable things in general. For example, <code>connections</code> or <code>notifications</code> are not considered units for this rule and do not have to be at the end of the metric name. (See also examples in the next paragraph.)
  * <code>http\_request\_duration\_<b>seconds</b></code>
  * <code>node\_memory\_usage\_<b>bytes</b></code>
  * <code>http\_requests\_<b>total</b></code>
    (for a unit-less accumulating count)
  * <code>process\_cpu\_<b>seconds\_total</b></code>
    (for an accumulating count with unit)
  * <code>foobar_build<b>\_info</b></code>
    (for a pseudo-metric that provides [metadata](https://www.robustperception.io/exposing-the-software-version-to-prometheus) about the running binary)
  * <code>data\_pipeline\_last\_record\_processed\_<b>timestamp_seconds</b></code>
    (for a timestamp that tracks the time of the latest record processed in a data processing pipeline)
* ...MAY order its name components in a way that leads to convenient grouping when a list of metric names is sorted lexicographically, as long as all the other rules are followed. The following examples have their the common name components first so that all the related metrics are sorted together:
  * <code>prometheus\_tsdb\_head\_truncations\_closed\_total</code>
  * <code>prometheus\_tsdb\_head\_truncations\_established\_total</code>
  * <code>prometheus\_tsdb\_head\_truncations\_failed\_total</code>
  * <code>prometheus\_tsdb\_head\_truncations\_total</code><br/>
  The following examples are also valid, but are following a different trade-off. They are easier to read individually, but unrelated metrics like <code>prometheus\_tsdb\_head\_series</code> might get sorted in between.
  * <code>prometheus\_tsdb\_head\_closed\_truncations\_total</code>
  * <code>prometheus\_tsdb\_head\_established\_truncations\_total</code>
  * <code>prometheus\_tsdb\_head\_failed\_truncations\_total</code>
  * <code>prometheus\_tsdb\_head\_truncations\_total</code>
* ...SHOULD represent the same logical thing-being-measured across all label
  dimensions.
  * request duration
  * bytes of data transfer
  * instantaneous resource usage as a percentage

As a rule of thumb, either the `sum()` or the `avg()` over all dimensions of a
given metric should be meaningful (though not necessarily useful). If it is not
meaningful, split the data up into multiple metrics. For example, having the
capacity of various queues in one metric is good, while mixing the capacity of a
queue with the current number of elements in the queue is not.

### Why include unit and type suffixes in metric names?

Some metric naming conventions (e.g. OpenTelemetry) do not recommend or even do not allow
including information about a metric unit and type in the metric name. A common
argument is that those pieces of information are already defined somewhere else (e.g. schema,
metadata, other labels, etc.).

Prometheus strongly recommends including unit and type in a metric name, even if you store that
information elsewhere, because of the following practical reasons:

* **Metric consumption reliability and UX**: When interacting with a modern UI to
use such a metric in PromQL, it's possible to display rich information about the metric's type and unit
(autocompletion, overlays, pop-ups). Unfortunately, interactive, adhoc querying in a powerful UI is not
the only way that users interact with metrics. Metric consumption ecosystem is vast. Majority
of the consumption comes in a form of the plain YAML configuration for variety of observability tools like
alerting, recording, autoscaling, dashboards, analysis, processing, etc. It's **critical**, especially
during monitoring/SRE incident practices to look on PromQL expressions in plain YAML and understand
the underlying metric type and unit you work with.
* **Metric collisions**: With growing adoption and metric changes over time, there are cases where lack
of unit and type information in the metric name will cause certain series to collide (e.g. `process_cpu` for seconds and milliseconds).

## Labels

Use labels to differentiate the characteristics of the thing that is being measured:

 * `api_http_requests_total` - differentiate request types: `operation="create|update|delete"`
 * `api_request_duration_seconds` - differentiate request stages: `stage="extract|transform|load"`

Do not put the label names in the metric name, as this introduces redundancy
and will cause confusion if the respective labels are aggregated away.

CAUTION: Remember that every unique combination of key-value label
pairs represents a new time series, which can dramatically increase the amount
of data stored. Do not use labels to store dimensions with high cardinality
(many different label values), such as user IDs, email addresses, or other
unbounded sets of values.

## Base Units

Prometheus does not have any units hard coded. For better compatibility, base
units should be used. The following lists some metrics families with their base unit.
The list is not exhaustive.

| Family | Base unit | Remark |
| -------| --------- | ------ |
| Time   | seconds   |        |
| Temperature | celsius | _celsius_ is preferred over _kelvin_ for practical reasons. _kelvin_ is acceptable as a base unit in special cases like color temperature or where temperature has to be absolute. |
| Length | meters | |
| Bytes  | bytes | |
| Bits   | bytes | To avoid confusion combining different metrics, always use _bytes_, even where _bits_ appear more common. |
| Percent | ratio | Values are 0–1 (rather than 0–100). `ratio` is only used as a suffix for names like `disk_usage_ratio`. The usual metric name follows the pattern `A_per_B`. |
| Voltage | volts | |
| Electric current | amperes | |
| Energy | joules | |
| Power  | | Prefer exporting a counter of joules, then `rate(joules[5m])` gives you power in Watts. |
| Mass   | grams | _grams_ is preferred over _kilograms_ to avoid issues with the _kilo_ prefix. |
