---
title: OpenMetrics 2.0 Migration Guide for Exposer Authors
sort_rank: 6
---

This guide covers the changes from OpenMetrics 1.0 to OpenMetrics 2.0 that affect exposer implementations. Sections are organized by implementation order so you can implement changes incrementally, starting with version negotiation and working through metric types, syntax, and metadata.

> **Draft specification.** OpenMetrics 2.0 is currently version 2.0.0-rc0 and is not yet finalized. Details in this guide may change before the spec reaches 2.0.0. Track progress at the [OpenMetrics 2.0 work group issue](https://github.com/prometheus/OpenMetrics/issues/276).

This guide covers the changes most relevant to exposer authors. For the complete specification including ABNF grammar, conformance requirements, and ingester rules, see the full [OpenMetrics 2.0 specification](../specs/om/open_metrics_spec_2_0.md). If you find errors or have questions, file an issue on the [OpenMetrics repository](https://github.com/prometheus/OpenMetrics).

## How to use this guide

Each section below guides implementers through the change:

- A **Breaking** or **Non-breaking** label indicating whether the change in syntax would cause a failure to parse in 1.0 parsers.
- A brief refresher of the 1.0 behavior and the 2.0 change.
- Before/after code blocks labeled "OM 1.0:" and "OM 2.0:" showing the difference.

There is also a reference to the relevant section of the specification if more detail is required.

## Quick Reference

OpenMetrics 2.0 contains many changes. Some of those changes are a loosening of previously-strict requirements, like the way metric names are constructed or character limits. Most of these changes are in service of allowing OpenTelemetry metric data to be encoded in OpenMetrics without violating the specification. Other changes introduce new syntaxes, mostly focused on allowing metric data to be encoded into a single line rather than requiring multiple lines to describe one cohesive piece of information.  Lastly, some changes add new features and data types, like Native Histograms.

| Change                                                                           | 1.0                                      | 2.0                                                | Breaking? |
| -------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------- | --------- |
| [**Negotiation**](#version-negotiation-and-content-type)                         |                                          |                                                    |           |
| [Content-Type version header](#version-negotiation-and-content-type)             | `version=1.0.0`                          | `version=2.0.0`                                    | Yes       |
| [Negotiation defaults](#negotiation-defaults)                                    | Oldest version                           | Same (default to 1.0)                              | No        |
| [**Naming**](#naming-changes)                                                    |                                          |                                                    |           |
| [MetricFamily must match Metric Name](#metricfamily-name-must-match-metric-name) | Implicit suffix stripping                | Exact match required                               | Yes       |
| [Counter _total / Info _info suffixes](#counter-and-info-suffix-rules)           | `_total` MUST; `_info` implicit          | `_total` SHOULD; `_info` MUST on name              | No        |
| [Reserved suffixes](#reserved-suffixes)                                          | Not specified                            | `_count`/`_sum`/`_bucket` etc. SHOULD NOT          | No        |
| [**Metadata**](#metadata-changes)                                                |                                          |                                                    |           |
| [Reserved label prefix](#reserved-label-prefix)                                  | `_` reserved                             | `__` reserved                                      | No        |
| [**UTF-8 Names**](#utf-8-names)                                                  |                                          |                                                    |           |
| [Metric and label name quoting](#metric-name-quoting)                            | `[a-zA-Z0-9_:]` only                     | UTF-8 allowed; quoted when needed                  | Yes       |
| [**Start Timestamps**](#start-timestamps)                                        |                                          |                                                    |           |
| [st@ replaces _created](#start-timestamps)                                       | Separate `_created` sample               | Inline `st@` on sample line                        | Yes       |
| [**CompositeValues**](#compositevalues)                                          |                                          |                                                    |           |
| [Summary / Histogram / GaugeHistogram](#compositevalues)                         | Expanded `_bucket`/`_count`/`_sum` lines | Single `{key:value}` CompositeValue                | Yes       |
| [Sum and Count required](#sum-and-count-required)                                | `_count`/`_sum` optional                 | Count and Sum required in CompositeValue           | Yes       |
| [**Native Histograms**](#native-histograms)                                      |                                          |                                                    |           |
| [Native-only and combined histograms](#native-only-histogram)                    | N/A                                      | Exponential buckets via `schema`/`spans`/`buckets` | Yes       |
| [**Exemplars**](#exemplars)                                                      |                                          |                                                    |           |
| [Mandatory timestamps / multiple exemplars](#mandatory-timestamps)               | Optional timestamp; max 1                | Mandatory timestamp; multiple allowed              | Yes       |
| [Size limit / W3C keys / histogram placement](#size-limit-relaxation)            | 128-char limit; bucket-level             | Soft limit; W3C keys; sample-level                 | Mixed     |
| [**StateSet**](#stateset)                                                        |                                          |                                                    |           |
| [MetricGroup terminology](#stateset)                                             | Metric / MetricPoint                     | MetricGroup / Metric                               | No        |
| [**Unknown Type**](#unknown-type)                                                |                                          |                                                    |           |
| [CompositeValue allowed](#unknown-type)                                          | Number only                              | Number or CompositeValue                           | No        |

## Version Negotiation and Content-Type

**Breaking**

In OM 1.0, exposers used the following Content-Type header to identify their format:

OM 1.0:
```
application/openmetrics-text; version=1.0.0; charset=utf-8
```

OM 2.0:
```
application/openmetrics-text; version=2.0.0; charset=utf-8
```

### Negotiation defaults

Exposers MUST default to the oldest version of the standard (1.0.0) when no specific version is requested. This applies to both pull and push models:

- **Pull-based (HTTP):** Use standard HTTP content-type negotiation. If the scraper does not request version 2.0.0, respond with 1.0.0.
- **Push-based:** Use version 1.0.0 unless the ingestor explicitly requests a newer version.

This means your exposer should continue serving 1.0 format by default and only switch to 2.0 when the consumer asks for it.

### Protobuf format removed

OM 2.0 no longer specifies an official protobuf format. You may continue to support the protobuf format for 1.0, but 2.0 does not contain a new or updated protobuf format. For the Prometheus protobuf wire format and other available formats, see the [exposition formats documentation](https://prometheus.io/docs/instrumenting/exposition_formats).

See: [Protocol Negotiation](../specs/om/open_metrics_spec_2_0.md#protocol-negotiation) in the OM 2.0 spec.

## Naming Changes

OM 2.0 tightens the relationship between MetricFamily names and Metric Names, and changes the suffix rules for counters and info metrics. In OM 1.0, parsers implicitly stripped known suffixes to map sample names back to their MetricFamily. In OM 2.0, this implicit stripping is gone: the MetricFamily name must exactly match every Metric's Name.

### MetricFamily Name Must Match Metric Name

**Breaking**

In OM 1.0, a counter's TYPE line used a base name (e.g. `http_requests`) while its samples carried the `_total` suffix (e.g. `http_requests_total`). The parser knew to strip `_total` when matching samples back to their MetricFamily, so the MetricFamily name and sample Metric Name could differ.

In OM 2.0, the MetricFamily name MUST exactly match every Metric's Name. There is no implicit suffix stripping. For counters, this means the TYPE line must include `_total` if the samples use it.

OM 1.0:
```
# TYPE http_requests counter
# HELP http_requests Total HTTP requests.
http_requests_total 1027
```

OM 2.0:
```
# TYPE http_requests_total counter
# HELP http_requests_total Total HTTP requests.
http_requests_total 1027
```

Notice that the TYPE and HELP lines now use `http_requests_total` to match the sample name exactly. This is the most common change you will need to make: update TYPE and HELP metadata names to include the suffix that was previously only on samples.

See: [MetricFamily](../specs/om/open_metrics_spec_2_0.md#metricfamily) in the OM 2.0 spec.

### Counter and Info Suffix Rules

**Counter _total**

**Non-breaking**

In OM 1.0, counter Metric names MUST end in `_total`.

In OM 2.0, counter Metric names SHOULD end in `_total`. It is no longer mandatory.

> **Tip:** The change in rule to SHOULD is primarily intended to enable compatibility with OpenTelemetry, which does not require any particular format for counter metric names.

OM 1.0:
```
# TYPE http_requests counter
http_requests_total 1027
```

Valid OM 2.0:
```
# TYPE http_requests counter
http_requests 1027
```

**Info _info**

**Non-breaking**

In OM 1.0, Info MetricFamily names did not have a suffix requirement at the MetricFamily level. The parser added `_info` to sample names automatically, so a MetricFamily named `build` produced samples named `build_info`.

In OM 2.0, Info MetricFamily names MUST end in `_info`. This is consistent with the MetricFamily-must-match-Metric-Name rule: since samples already carried `_info`, the MetricFamily name must now include it too.

OM 1.0:
```
# TYPE build info
# HELP build Build information.
build_info{version="1.4.2",branch="main"} 1
```

OM 2.0:
```
# TYPE build_info info
# HELP build_info Build information.
build_info{version="1.4.2",branch="main"} 1
```

This is the same pattern as the target_info rename covered in the [Metadata Changes](#metadata-changes) section, but applied as a general rule: all Info metrics, not just target, must have `_info` in their MetricFamily name.

See: [Counter](../specs/om/open_metrics_spec_2_0.md#counter) and [Info](../specs/om/open_metrics_spec_2_0.md#info) in the OM 2.0 spec.

### Reserved Suffixes

**Non-breaking**

MetricFamily names SHOULD NOT end with any of these reserved suffixes:

- `_count`
- `_sum`
- `_bucket`
- `_gcount`
- `_gsum`

These suffixes are reserved because older ingestors that convert histograms and summaries to classic representation expand them into samples with these suffixes. If you have a gauge called `foo_bucket` and a histogram called `foo`, older ingestors would expand the histogram into `foo_bucket`, `foo_count`, and `foo_sum` samples, creating a collision with your gauge.

This is a SHOULD NOT (not MUST NOT), so existing metrics with these suffixes will still parse. However, renaming them avoids collision bugs when your metrics are consumed by systems that expand compound types into classic representation.

See: [MetricFamily](../specs/om/open_metrics_spec_2_0.md#metricfamily) in the OM 2.0 spec.

### Naming Changes in Practice

Here is a complete OM 2.0 exposition for an HTTP server, showing how the naming rules work together:

```
# TYPE http_requests_total counter
# HELP http_requests_total Total HTTP requests received.
http_requests_total{method="GET",code="200"} 1027
http_requests_total{method="POST",code="201"} 53
# TYPE http_request_duration_seconds histogram
# HELP http_request_duration_seconds Duration of HTTP requests in seconds.
http_request_duration_seconds{method="GET"} {count:1027,sum:172.5,bucket:[0.1:800,0.5:950,+Inf:1027]}
# TYPE build_info info
# HELP build_info Build metadata.
build_info{version="1.4.2",branch="main",goversion="go1.22"} 1
# EOF
```

What each metric demonstrates:

- **http_requests_total** (counter): TYPE line uses `http_requests_total`, matching the sample name exactly. The `_total` suffix is kept for readability and backward compatibility.
- **http_request_duration_seconds** (histogram): MetricFamily name avoids reserved suffixes. The histogram uses CompositeValue syntax with all bucket data on a single line (described later).
- **build_info** (info): TYPE line uses `build_info`, matching the sample name. The `_info` suffix is present on the MetricFamily name as required.

## Metadata Changes

OM 2.0 relaxes several metadata requirements and renames a few conventions. This section covers all metadata-level changes that affect how MetricFamilies are described.

### Reserved Label Prefix

**Non-breaking**

In OM 1.0, label names beginning with a single underscore (`_`) are RESERVED and must not be used unless specified by the standard.

In OM 2.0, the reserved prefix is now a double underscore (`__`). Single-underscore labels are available for user use.

OM 1.0:
```
# _my_label is reserved; user labels must not start with _
my_metric{app="web"} 1
```

OM 2.0:
```
# __reserved is reserved; _my_label is now allowed for users
my_metric{_my_label="custom",app="web"} 1
```

OM 2.0 also allows `__type` and `__unit` labels as alternatives to TYPE and UNIT metadata in federation scenarios where MetricFamily metadata might otherwise conflict.

See: [Label](../specs/om/open_metrics_spec_2_0.md#label) in the OM 2.0 spec.

## UTF-8 Names

**Breaking**

OM 2.0 allows metric and label names to contain UTF-8 characters beyond the traditional `[a-zA-Z0-9_:]` set. This exists primarily for OpenTelemetry bridge scenarios, where metrics use dotted naming conventions like `process.cpu.seconds`. Dotted names pair well with the relaxed `_total` suffix rule described in [Naming Changes](#naming-changes) (see [Counter and Info Suffix Rules](#counter-and-info-suffix-rules)), since dropping `_total` gives you cleaner dotted metric names.

Be aware that not all Prometheus ecosystem tools support UTF-8 metric names yet.

### Metric Name Quoting

Metric names that do not match `^[a-zA-Z_:][a-zA-Z0-9_:]*$` MUST be enclosed in double quotes. Any metric name MAY be enclosed in double quotes, but quoting is only required when the name contains characters outside the traditional set.

Within quoted strings, the following escapes apply:

- `\\` for a literal backslash
- `\"` for a literal double quote
- `\n` for a newline

**New in OM 2.0:** The ABNF now also permits a backslash before any normal character (`BS normal-char`). This means sequences like `\a` are valid syntax and will parse. However, a double backslash SHOULD be used to represent a literal backslash, and a single backslash SHOULD NOT be used for undefined escape sequences. For example, `\\a` is equivalent and preferable to `\a`.

See: [Escaping](../specs/om/open_metrics_spec_2_0.md#escaping) in the OM 2.0 spec.

```
# TYPE "process.cpu.seconds" counter
# HELP "process.cpu.seconds" Total user and system CPU time spent in seconds.
{"process.cpu.seconds"} 4.20072246e+06
```

See: [UTF-8 Quoting](../specs/om/open_metrics_spec_2_0.md#utf-8-quoting) in the OM 2.0 spec.

### Label Name Quoting

Label names that do not match `^[a-zA-Z_][a-zA-Z0-9_]*$` MUST be enclosed in double quotes. Any label name MAY be enclosed in double quotes, but quoting is only required when the name contains characters outside the traditional set.

```
{"process.cpu.seconds","node.name"="my_node"} 4.20072246e+06
```

See: [UTF-8 Quoting](../specs/om/open_metrics_spec_2_0.md#utf-8-quoting) in the OM 2.0 spec.

### Alternative Brace Syntax

When a metric name requires quoting, the quoted name moves inside the braces as the first element. This is required for quoted metric names: the metric name MUST appear inside the braces, not outside. In the ABNF grammar, this is the `name-and-labels-in-braces` production.

The following complete example shows TYPE, UNIT, and HELP metadata with a quoted metric name, followed by a sample line using the brace syntax with both a quoted metric name and a quoted label name:

```
# TYPE "process.cpu.seconds" counter
# UNIT "process.cpu.seconds" seconds
# HELP "process.cpu.seconds" Total user and system CPU time spent in seconds.
{"process.cpu.seconds","node.name"="my_node"} 4.20072246e+06
```

See: [UTF-8 Quoting](../specs/om/open_metrics_spec_2_0.md#utf-8-quoting) in the OM 2.0 spec.

## Start Timestamps

**Breaking**

OM 2.0 replaces separate `_created` samples with an inline Start Timestamp (`st@`) on the sample line itself, reducing exposition size and avoiding race conditions between the `_created` sample and the value sample. Counters, histograms, and summaries have creation semantics and support Start Timestamps; gauges do not.

So an OM 2.0 sample line has the following field ordering:

```
metric_name value [timestamp] [st@start_timestamp] [# exemplar...]
```

**Counter**

OM 1.0:
```
# TYPE http_requests counter
http_requests_total 1027
http_requests_created 1000000000
```

OM 2.0:
```
# TYPE http_requests_total counter
http_requests_total 1027 st@1000000000
```

The OM 1.0 example uses `http_requests` as the TYPE name (implicit suffix stripping), while OM 2.0 uses `http_requests_total` (MetricFamily must match Metric Name, per [Naming Changes](#naming-changes)). The `http_requests_created` sample becomes the inline `st@` timestamp.

**Histogram**

OM 1.0:
```
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 800
http_request_duration_seconds_bucket{le="0.5"} 950
http_request_duration_seconds_bucket{le="+Inf"} 1027
http_request_duration_seconds_sum 172.5
http_request_duration_seconds_count 1027
http_request_duration_seconds_created 1000000000
```

OM 2.0 histograms use CompositeValue syntax (covered in detail in [CompositeValues](#compositevalues)). Here we focus on where `st@` appears:

OM 2.0:
```
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds {count:1027,sum:172.5,bucket:[0.1:800,0.5:950,+Inf:1027]} st@1000000000
```

The `_created` sample disappears entirely. The `st@` timestamp appears after the value on the single CompositeValue line.

**Start Timestamps in Practice**

This combined example shows counters and a histogram together with labels, timestamps, Start Timestamps, and an exemplar demonstrating the full field ordering:

```
# TYPE http_requests_total counter
http_requests_total{method="GET",code="200"} 1027 1710000000 st@1000000000 # {trace_id="abc123",span_id="def456"} 1.0 1709999999
http_requests_total{method="POST",code="201"} 53 1710000000 st@1000000000
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds{method="GET"} {count:1027,sum:172.5,bucket:[0.1:800,0.5:950,+Inf:1027]} 1710000000 st@1000000000
# EOF
```

See also: [Exemplars](#exemplars)

See: [Counter](../specs/om/open_metrics_spec_2_0.md#counter) and [Histogram with Classic Buckets](../specs/om/open_metrics_spec_2_0.md#histogram-with-classic-buckets) in the OM 2.0 spec.

## CompositeValues

**Breaking**

In OM 1.0, complex metric types (histograms, summaries, gaugehistograms) were represented as multiple expanded sample lines — one line per bucket, one for count, one for sum. In OM 2.0, these become a single sample line whose value is a CompositeValue: a structured `{key:value,...}` block containing all the fields at once.

All three types — `histogram`, `summary`, and `gaugehistogram` — MUST use CompositeValue syntax in OM 2.0.

### Syntax overview

A CompositeValue is enclosed in curly braces and contains comma-separated `key:value` fields with no whitespace. Keys are fixed literal names; values are numbers, integers, or bracket-enclosed lists depending on the field. The full set of keys is:

| Key                | Value type          | Used by                             | Description                                                 |
| ------------------ | ------------------- | ----------------------------------- | ----------------------------------------------------------- |
| `count`            | number              | histogram, summary                  | Observation count.                                          |
| `sum`              | number              | histogram, summary                  | Sum of observed values.                                     |
| `gcount`           | number              | gaugehistogram                      | Gauge observation count.                                    |
| `gsum`             | number              | gaugehistogram                      | Gauge sum of observed values.                               |
| `quantile`         | `[q:v,...]`         | summary                             | Quantile/value pairs, sorted by quantile.                   |
| `bucket`           | `[le:v,...,+Inf:v]` | histogram, gaugehistogram (classic) | Classic bucket upper-bound/count pairs. `+Inf` is required. |
| `schema`           | integer             | histogram, gaugehistogram (native)  | Native histogram resolution schema.                         |
| `zero_threshold`   | realnumber          | histogram, gaugehistogram (native)  | Width of the zero bucket.                                   |
| `zero_count`       | number              | histogram, gaugehistogram (native)  | Count of observations in the zero bucket.                   |
| `negative_spans`   | `[off:len,...]`     | histogram, gaugehistogram (native)  | Span definitions for negative buckets.                      |
| `negative_buckets` | `[v,...]`           | histogram, gaugehistogram (native)  | Counts for negative buckets.                                |
| `positive_spans`   | `[off:len,...]`     | histogram, gaugehistogram (native)  | Span definitions for positive buckets.                      |
| `positive_buckets` | `[v,...]`           | histogram, gaugehistogram (native)  | Counts for positive buckets.                                |

Not every key appears in every CompositeValue. Which keys are required depends on the metric type:

- **Summary:** `count`, `sum`, `quantile`
- **Classic histogram:** `count`, `sum`, `bucket`
- **Classic gaugehistogram:** `gcount`, `gsum`, `bucket`
- **Native histogram:** `count`, `sum`, `schema`, `zero_threshold`, `zero_count`, and optionally `negative_spans`/`negative_buckets` and/or `positive_spans`/`positive_buckets`
- **Native gaugehistogram:** `gcount`, `gsum`, `schema`, `zero_threshold`, `zero_count`, and optionally `negative_spans`/`negative_buckets` and/or `positive_spans`/`positive_buckets`
- **Combined (classic + native):** `count`/`gcount`, `sum`/`gsum`, native fields, then `bucket`

An abstract example showing every key (a combined classic + native histogram):

```
{count:<n>,sum:<n>,schema:<i>,zero_threshold:<r>,zero_count:<n>,negative_spans:[<off>:<len>,...],negative_buckets:[<n>,...],positive_spans:[<off>:<len>,...],positive_buckets:[<n>,...],bucket:[<le>:<n>,...,+Inf:<n>]}
```

Where `<n>` is a number, `<i>` is an integer, `<r>` is a real number, `<off>` is an integer offset, `<len>` is a positive integer length, and `<le>` is a real-valued bucket boundary. Fields must appear in the order shown. There must not be any whitespace inside the braces.

See: [CompositeValues](../specs/om/open_metrics_spec_2_0.md#compositevalues) in the OM 2.0 spec.

### Summary

**Rule:** In OM 2.0, a Summary Sample MUST contain Count, Sum, and a set of quantiles. In OM 1.0 these were all MAY. Exposers that previously omitted count or sum must now include them.

OM 1.0:
```
# TYPE http_request_duration_seconds_summary summary
http_request_duration_seconds_summary{quantile="0.5"} 0.013
http_request_duration_seconds_summary{quantile="0.9"} 0.025
http_request_duration_seconds_summary{quantile="0.99"} 0.10
http_request_duration_seconds_summary_sum 172.5
http_request_duration_seconds_summary_count 1027
```

OM 2.0:
```
# TYPE http_request_duration_seconds_summary summary
http_request_duration_seconds_summary {count:1027,sum:172.5,quantile:[0.5:0.013,0.9:0.025,0.99:0.10]}
```

All five sample lines collapse to one. The quantile map moves inside the CompositeValue block. Count and sum are now mandatory fields. If there are no observations, use `quantile:[]` (empty quantile list).

See: [Summary](../specs/om/open_metrics_spec_2_0.md#summary) in the OM 2.0 spec.

### Histogram

OM 1.0:
```
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 800
http_request_duration_seconds_bucket{le="0.5"} 950
http_request_duration_seconds_bucket{le="+Inf"} 1027
http_request_duration_seconds_sum 172.5
http_request_duration_seconds_count 1027
```

OM 2.0:
```
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds {count:1027,sum:172.5,bucket:[0.1:800,0.5:950,+Inf:1027]}
```

Every `_bucket`, `_sum`, and `_count` sample line merges into a single CompositeValue. The bucket list uses `threshold:count` pairs, with the +Inf bucket included. Fields must appear in this order: `count`, `sum`, `bucket`. The `_sum` and `_count` suffixes disappear entirely.

See: [Histogram with Classic Buckets](../specs/om/open_metrics_spec_2_0.md#histogram-with-classic-buckets) in the OM 2.0 spec.

### GaugeHistogram

A GaugeHistogram measures current distributions (not reset-based). Common examples: queue depth, in-flight request size. Unlike a histogram, values are gauge-semantics — they can go up or down without a reset. The OM 1.0 expanded format used `_gcount`/`_gsum` suffixes; OM 2.0 uses CompositeValue with `gcount` and `gsum` field names (preserving the gauge-semantic prefix).

OM 1.0:
```
# TYPE queue_depth_bytes gaugehistogram
queue_depth_bytes_bucket{le="1024"} 5
queue_depth_bytes_bucket{le="65536"} 18
queue_depth_bytes_bucket{le="+Inf"} 23
queue_depth_bytes_gcount 23
queue_depth_bytes_gsum 1048576
```

OM 2.0:
```
# TYPE queue_depth_bytes gaugehistogram
queue_depth_bytes {gcount:23,gsum:1048576,bucket:[1024:5,65536:18,+Inf:23]}
```

The CompositeValue format is similar to a classic histogram, but uses `gcount` and `gsum` instead of `count` and `sum`. The `TYPE` line also distinguishes them. Fields must appear in this order: `gcount`, `gsum`, `bucket`. GaugeHistograms do not have Start Timestamps (no creation semantics).

See: [GaugeHistogram with Classic Buckets](../specs/om/open_metrics_spec_2_0.md#gaugehistogram-with-classic-buckets) in the OM 2.0 spec.

### CompositeValues in Practice

A complete exposition showing all types together:

```
# TYPE http_requests_total counter
http_requests_total{method="GET",code="200"} 1027 1710000000 st@1000000000
# TYPE http_request_duration_seconds_summary summary
http_request_duration_seconds_summary{path="/api/v1"} {count:1027,sum:172.5,quantile:[0.5:0.013,0.9:0.025,0.99:0.10]} 1710000000 st@1000000000
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds{path="/api/v1"} {count:1027,sum:172.5,bucket:[0.1:800,0.5:950,+Inf:1027]} 1710000000 st@1000000000
# TYPE queue_depth_bytes gaugehistogram
queue_depth_bytes{queue="work"} {gcount:23,gsum:1048576,bucket:[1024:5,65536:18,+Inf:23]} 1710000000
# EOF
```

Note: The counter line uses a plain Number value, not a CompositeValue. The summary and histogram use CompositeValue blocks. The gaugehistogram has no Start Timestamp (no creation semantics).

### Sum and Count Required

**Breaking**

The Sum and Count are now required in OM 2.0 for histograms and gaugehistograms. In OM 1.0 these were optional.

**Histogram**

OM 1.0:
```
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 800
http_request_duration_seconds_bucket{le="0.5"} 950
http_request_duration_seconds_bucket{le="+Inf"} 1027
http_request_duration_seconds_created 1000000000
```

OM 2.0:
```
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds {count:1027,sum:172.5,bucket:[0.1:800,0.5:950,+Inf:1027]} st@1000000000
```

**GaugeHistogram**

OM 1.0:
```
# TYPE queue_depth_bytes gaugehistogram
queue_depth_bytes_bucket{le="1024"} 5
queue_depth_bytes_bucket{le="65536"} 18
queue_depth_bytes_bucket{le="+Inf"} 23
```

OM 2.0:
```
# TYPE queue_depth_bytes gaugehistogram
queue_depth_bytes {gcount:23,gsum:1048576,bucket:[1024:5,65536:18,+Inf:23]}
```

See: [Histogram](../specs/om/open_metrics_spec_2_0.md#histogram) and [GaugeHistogram](../specs/om/open_metrics_spec_2_0.md#gaugehistogram) in the OM 2.0 spec.

## Native Histograms

**Breaking**

Native histograms are new in OM 2.0. Instead of fixed bucket boundaries chosen at instrumentation time, native histograms use an exponential bucket schema that provides automatic resolution across all value ranges without any bucket configuration. The `schema` field controls bucket width granularity: higher values produce narrower (finer) buckets.

This section builds on the CompositeValue syntax covered in [CompositeValues](#compositevalues). Native histogram fields follow the same `{key:value,...}` format described above.

### Native-Only Histogram

A native-only histogram CompositeValue contains these fields, in order:

- `count` -- total number of observations (number).
- `sum` -- sum of all observed values (number).
- `schema` -- integer (-4 to 8) controlling exponential bucket width. Higher values mean finer granularity.
- `zero_threshold` -- non-negative float defining the zero bucket boundary [-threshold, +threshold].
- `zero_count` -- number of observations in the zero bucket.
- `positive_spans` -- list of `offset:length` pairs mapping bucket indices (see below).
- `positive_buckets` -- list of observation counts, one per bucket.

Spans are `offset:length` pairs that describe which exponential buckets are populated. The first span's offset is the starting bucket index (can be negative). Its length is the number of consecutive populated buckets starting from that index. Each subsequent span's offset is the number of empty buckets to skip before the next group. The sum of all span lengths equals the total number of values in the bucket list. See [Native Buckets](../specs/om/open_metrics_spec_2_0.md#native-buckets) in the spec for the bucket boundary formula.

Negative spans and buckets (`negative_spans`, `negative_buckets`) use the same syntax for negative observations.

If no buckets are populated, the span and bucket fields can be omitted entirely.

```
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds {count:59,sum:120.0,schema:3,zero_threshold:1e-4,zero_count:2,positive_spans:[0:3,2:2],positive_buckets:[10,15,12,8,12]} 1710000000 st@1000000000
```

The example has two spans: the first starts at bucket index 0 with 3 consecutive buckets, then skips 2 empty buckets, then 2 more consecutive buckets. The total bucket count is 3 + 2 = 5, matching the five values in `positive_buckets`.

See: [Histogram with Native Buckets](../specs/om/open_metrics_spec_2_0.md#histogram-with-native-buckets) in the OM 2.0 spec.

### Combined Classic and Native

Some consumers do not support native buckets yet. A combined CompositeValue includes both representations in a single line, providing backward compatibility. The field order is: `count`, `sum`, then all native fields (`schema` through `positive_buckets`), then the classic `bucket` field. This ordering lets parsers that prefer native buckets stop reading before the classic bucket list.

```
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds {count:59,sum:120.0,schema:3,zero_threshold:1e-4,zero_count:2,positive_spans:[0:3,2:2],positive_buckets:[10,15,12,8,12],bucket:[0.01:5,0.1:25,1.0:47,10.0:57,+Inf:59]} st@1000000000
```

See: [Histogram with both Classic and Native Buckets](../specs/om/open_metrics_spec_2_0.md#histogram-with-both-classic-and-native-buckets) in the OM 2.0 spec.

### GaugeHistogram with Native Buckets

GaugeHistogram Samples with native buckets follow the same syntax as histogram, except using `gcount` and `gsum` instead of `count` and `sum`. The TYPE line also distinguishes them.

See: [GaugeHistogram with Native Buckets](../specs/om/open_metrics_spec_2_0.md#gaugehistogram-with-native-buckets) in the OM 2.0 spec.

### Native Histograms in Practice

A realistic exposition showing native-only and combined classic+native histograms together:

```
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds{method="GET"} {count:59,sum:120.0,schema:3,zero_threshold:1e-4,zero_count:2,positive_spans:[0:3,2:2],positive_buckets:[10,15,12,8,12]} 1710000000 st@1000000000
http_request_duration_seconds{method="POST"} {count:34,sum:68.5,schema:3,zero_threshold:1e-4,zero_count:1,positive_spans:[0:2,3:1],positive_buckets:[8,12,13],bucket:[0.01:3,0.1:14,1.0:28,10.0:33,+Inf:34]} 1710000000 st@1000000000
# EOF
```

The GET line uses native-only fields. The POST line includes both native and classic bucket fields for consumers that do not yet support native buckets. The next section covers exemplar syntax that can be attached to these lines (see [Exemplars](#exemplars)).

## Exemplars

**Breaking**

OM 2.0 changes several exemplar rules. Mandatory timestamps, multiple exemplars per sample, and relaxed size limits all affect how exposers attach trace context to metrics.

### Mandatory Timestamps

In OM 1.0, exemplar timestamps were optional (MAY). In OM 2.0, every exemplar MUST include a timestamp. This alone is a breaking change for OM 1.0 parsers that do not expect a timestamp after the exemplar value.

```
http_requests_total 1027 1710000000 # {trace_id="abc123",span_id="def456"} 1.0 1709999999
```

The exemplar (everything after `#`) has labels, a value (`1.0`), and a mandatory timestamp (`1709999999`).

### Multiple Exemplars

In OM 1.0, each sample could have at most one exemplar. OM 2.0 allows multiple exemplars on a single sample. Each exemplar starts with `#` followed by its own label set, value, and timestamp.

```
http_requests_total 1027 1710000000 # {trace_id="abc123",span_id="def456"} 1.0 1709999999 # {trace_id="xyz789",span_id="uvw012"} 1.0 1709999800
```

### W3C Trace Context Keys

OM 2.0 recommends using `trace_id` and `span_id` as exemplar label keys, following W3C Trace Context conventions. The examples above already demonstrate this. Using consistent key names lets consumers correlate metrics with distributed traces without per-exporter configuration.

### Size Limit Relaxation

In OM 1.0, exemplar label sets had a hard 128-character limit. OM 2.0 removes this hard cap and replaces it with soft guidance: exposers SHOULD NOT emit excessively large exemplar label sets. This accommodates longer trace identifiers (such as W3C 32-character hex trace IDs) without requiring truncation.

### Histogram Exemplar Placement

In OM 1.0, histogram exemplars appeared on individual `_bucket` lines. In OM 2.0 with CompositeValue syntax, exemplars attach to the single sample line after the CompositeValue. Exemplars without labels MUST use an empty LabelSet `{}`. When attaching multiple exemplars to a Sample, use consistent label names across all exemplars on that Sample.

See: [Exemplars](../specs/om/open_metrics_spec_2_0.md#exemplars) in the OM 2.0 spec.

## StateSet

**Non-breaking**

OM 2.0 introduces the "MetricGroup" concept for StateSet. A StateSet is now structured as a set of Metrics called a StateSet MetricGroup. This reflects a broader terminology change in the spec:

| Concept | OM 1.0 Term | OM 2.0 Term |
| ------- | ----------- | ----------- |
| A set of related state samples | Metric | MetricGroup |
| An individual state sample | MetricPoint | Metric |

For exposer authors, the wire format for StateSet is unchanged. A StateSet still produces one sample per state with a boolean value (1 or 0), using the MetricFamily name as the label name and the state name as the label value:

```
# TYPE feature_flags stateset
feature_flags{feature_flags="dark_mode"} 1
feature_flags{feature_flags="beta_api"} 0
```

The MetricGroup concept is mainly relevant for understanding the spec and for library/SDK authors who model the data internally. If you are only emitting text exposition, no changes are needed.

See: [StateSet](../specs/om/open_metrics_spec_2_0.md#stateset) in the OM 2.0 spec.

## Unknown Type

**Non-breaking**

In OM 1.0, a Sample in a Metric with the Unknown type could only have a Number value. In OM 2.0, a Sample in a Metric with the Unknown type may also have a CompositeValue.

Since the Unknown type SHOULD NOT be used in general (it exists for third-party metrics where the type is indeterminate), this is a minor change. It primarily affects ingestors and libraries that need to handle arbitrary Unknown-typed data.

See: [Unknown](../specs/om/open_metrics_spec_2_0.md#unknown) in the OM 2.0 spec.

