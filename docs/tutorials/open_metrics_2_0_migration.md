# OpenMetrics 2.0 Migration Guide for Exposer Authors

This guide covers the changes from OpenMetrics 1.0 to OpenMetrics 2.0 that affect exposer implementations. Sections are organized by implementation order so you can adopt changes incrementally, starting with version negotiation and working through metric types, syntax, and metadata.

> **Draft specification.** OpenMetrics 2.0 is currently version 2.0.0-rc0 and is not yet finalized. Details in this guide may change before the spec reaches 2.0.0. Track progress at the [OpenMetrics 2.0 work group issue](https://github.com/prometheus/OpenMetrics/issues/276).

## How to use this guide

Each section below follows a consistent pattern:

- A **Breaking** or **Non-breaking** label indicating whether the change breaks 1.0 parsers.
- A brief refresher of the 1.0 behavior.
- The 2.0 change.
- Before/after code blocks labeled "OM 1.0:" and "OM 2.0:" showing the difference.
- A "See:" link to the relevant section in the [OM 2.0 spec](../specs/om/open_metrics_spec_2_0.md).

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

OM 2.0 removes the `application/openmetrics-protobuf` format entirely. You may continue to support the protobuf format for 1.0, but 2.0 does not contain a new or updated protobuf format. For the Prometheus protobuf wire format and other available formats, see the [exposition formats documentation](https://prometheus.io/docs/instrumenting/exposition_formats). Protobuf removal is covered in more detail in the [Metadata Changes](#metadata-changes) section.

See: [Protocol Negotiation](../specs/om/open_metrics_spec_2_0.md#protocol-negotiation) in the OM 2.0 spec.

## Metadata Changes

OM 2.0 relaxes several metadata requirements and renames a few conventions. This section covers all metadata-level changes that affect how MetricFamilies are described.

### MetricFamily Metadata Relaxation

XXXX Go into more detail about how the metric name === the metricfamily name now.

**Non-breaking**

In OM 1.0, every MetricFamily MUST have a name, HELP, TYPE, and UNIT metadata.

In OM 2.0, only the name remains a MUST requirement. Help, Type, and Unit metadata are now SHOULD (recommended but not required). The name must exactly match every MetricPoint's MetricName in the family.

OM 1.0:
```
# TYPE http_requests_total counter
# UNIT http_requests_total seconds
# HELP http_requests_total Total HTTP requests.
http_requests_total 1027
```

OM 2.0:
```
# TYPE http_requests_total counter
# UNIT http_requests_total seconds
# HELP http_requests_total Total HTTP requests.
http_requests_total 1027
```

The OM 2.0 example looks the same because this is a non-breaking change. Exposers already providing TYPE, UNIT, and HELP metadata can continue to do so unchanged. The difference is that new exposers are no longer required to include them. A minimal valid OM 2.0 MetricFamily only needs the name and at least one MetricPoint.

See: [MetricFamily](../specs/om/open_metrics_spec_2_0.md#metricfamily) in the OM 2.0 spec.

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

### Target Info Rename

**Breaking**

XXXX this is again around metricfamily === metric

In OM 1.0, the target metadata Info MetricFamily is called "target".

In OM 2.0, it is renamed to "target_info" to be consistent with the `_info` suffix requirement for Info type metrics.

OM 1.0:
```
# TYPE target info
# HELP target Target metadata
target_info{env="prod"} 1
```

OM 2.0:
```
# TYPE target_info info
# HELP target_info Target metadata
target_info{env="prod"} 1
```

The sample line (`target_info{...}`) stays the same in both versions because OM 1.0 already appended `_info` to the sample name. The change is in the TYPE and HELP metadata lines, where the MetricFamily name changes from "target" to "target_info".

See: [Supporting Target Metadata in both Push-based and Pull-based Systems](../specs/om/open_metrics_spec_2_0.md#supporting-target-metadata-in-both-push-based-and-pull-based-systems) in the OM 2.0 spec.

## Naming Changes

OM 2.0 tightens the relationship between MetricFamily names and MetricPoint MetricNames, and changes the suffix rules for counters and info metrics. In OM 1.0, parsers implicitly stripped known suffixes to map sample names back to their MetricFamily. In OM 2.0, this implicit stripping is gone: the MetricFamily name must exactly match the MetricName on every MetricPoint.

### MetricFamily Name Must Match MetricName

**Breaking**

In OM 1.0, a counter's TYPE line used a base name (e.g. `http_requests`) while its samples carried the `_total` suffix (e.g. `http_requests_total`). The parser knew to strip `_total` when matching samples back to their MetricFamily, so the MetricFamily name and sample MetricName could differ.

In OM 2.0, the MetricFamily name MUST exactly match every MetricPoint's MetricName. There is no implicit suffix stripping. For counters, this means the TYPE line must include `_total` if the samples use it.

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

In OM 1.0, counter MetricFamily names MUST end in `_total`.

In OM 2.0, counter MetricFamily names SHOULD end in `_total`. It is no longer mandatory.

> **Tip:** Whether to keep or drop `_total` depends on your environment. Keeping `_total` preserves human readability and backward compatibility with older tools and dashboards that expect the suffix. Dropping `_total` gives you cleaner names, especially when using UTF-8 metric names, and smoother integration with the OpenTelemetry bridge. Both are valid choices under the spec.

If you keep `_total` (which most existing exposers will), no change is needed beyond the MetricFamily name match described above:

OM 1.0:
```
# TYPE http_requests counter
http_requests_total 1027
```

OM 2.0:
```
# TYPE http_requests_total counter
http_requests_total 1027
```

**Info _info**

**Non-breaking**

In OM 1.0, Info MetricFamily names did not have a suffix requirement at the MetricFamily level. The parser added `_info` to sample names automatically, so a MetricFamily named `build` produced samples named `build_info`.

In OM 2.0, Info MetricFamily names MUST end in `_info`. This is consistent with the MetricFamily-must-match-MetricName rule: since samples already carried `_info`, the MetricFamily name must now include it too.

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

This is a SHOULD NOT (not MUST NOT), so existing metrics with these suffixes will still parse. However, renaming them avoids subtle collision bugs when your metrics are consumed by systems that expand compound types into classic representation.

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
http_request_duration_seconds_bucket{method="GET",le="0.1"} 800
http_request_duration_seconds_bucket{method="GET",le="0.5"} 950
http_request_duration_seconds_bucket{method="GET",le="+Inf"} 1027
http_request_duration_seconds_sum{method="GET"} 172.5
http_request_duration_seconds_count{method="GET"} 1027
# TYPE build_info info
# HELP build_info Build metadata.
build_info{version="1.4.2",branch="main",goversion="go1.22"} 1
# EOF
```

What each metric demonstrates:

- **http_requests_total** (counter): TYPE line uses `http_requests_total`, matching the sample name exactly. The `_total` suffix is kept for readability and backward compatibility.
- **http_request_duration_seconds** (histogram): MetricFamily name avoids reserved suffixes. The `_bucket`, `_sum`, and `_count` suffixes appear only on expanded samples, not on the MetricFamily name.
- **build_info** (info): TYPE line uses `build_info`, matching the sample name. The `_info` suffix is present on the MetricFamily name as required.

## UTF-8 Names

**Non-breaking**

OM 2.0 allows metric and label names to contain UTF-8 characters beyond the traditional `[a-zA-Z0-9_:]` set. This exists primarily for OpenTelemetry bridge scenarios, where metrics use dotted naming conventions like `process.cpu.seconds`. Dotted names pair well with the relaxed `_total` suffix rule described in [Naming Changes](#naming-changes) (see [Counter and Info Suffix Rules](#counter-and-info-suffix-rules)), since dropping `_total` gives you cleaner dotted metric names.

Be aware that not all Prometheus ecosystem tools support UTF-8 metric names yet.

### Metric Name Quoting

Metric names that do not match `^[a-zA-Z_:][a-zA-Z0-9_:]*$` MUST be enclosed in double quotes. Any metric name MAY be enclosed in double quotes, but quoting is only required when the name contains characters outside the traditional set.

Within quoted strings, use `\\` for a literal backslash, `\"` for a literal double quote, and `\n` for a newline.

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

An OM 2.0 sample line has the following field ordering:

```
metric_name value [timestamp] [st@start_timestamp] [# exemplar...]
```

OM 2.0 replaces separate `_created` samples with an inline Start Timestamp (`st@`) on the sample line itself, reducing exposition size and avoiding race conditions between the `_created` sample and the value sample. Counters, histograms, and summaries have creation semantics and support Start Timestamps; gauges do not.

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

The OM 1.0 example uses `http_requests` as the TYPE name (implicit suffix stripping), while OM 2.0 uses `http_requests_total` (MetricFamily must match MetricName, per [Naming Changes](#naming-changes)). The `http_requests_created` sample becomes the inline `st@` timestamp.

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

All three types — `histogram`, `summary`, and `gaugehistogram` — MUST use CompositeValue syntax in OM 2.0. OM 1.0 parsers cannot read the `{...}` block format, making this a breaking change.

### Counter Value Simplification

**Non-breaking** (text format only)

In OM 2.0, the Counter data model defines the value as a plain Number. The separate "Total" concept that existed in the OM 1.0 protobuf data model is removed. For exposers using the text format, Counter samples already were numbers — no change to what you emit.

OM 1.0:
```
# TYPE http_requests_total counter
http_requests_total 1027
```

OM 2.0:
```
# TYPE http_requests_total counter
http_requests_total 1027
```

The output looks the same. The change is in the data model: OM 1.0 had a `Counter.total` sub-field; OM 2.0 specifies the value directly as a Number.

See: [Counter](../specs/om/open_metrics_spec_2_0.md#counter) in the OM 2.0 spec.

### Summary

**Rule:** In OM 2.0, a Summary MetricPoint MUST contain Count, Sum, and a set of quantiles. In OM 1.0 these were all MAY. Exposers that previously omitted count or sum must now include them.

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

All five sample lines collapse to one. The quantile map moves inside the CompositeValue block. Count and sum are now mandatory fields. If there are no observations, use `quantile:[]` (empty quantile list) — this is valid and satisfies the MUST requirement.

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

A GaugeHistogram measures current distributions (not reset-based). Common examples: queue depth, in-flight request size. Unlike a histogram, values are gauge-semantics — they can go up or down without a reset. The OM 1.0 expanded format used `_gcount`/`_gsum` suffixes (and was rarely supported); OM 2.0 uses CompositeValue with `count` and `sum` field names.

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
queue_depth_bytes {count:23,sum:1048576,bucket:[1024:5,65536:18,+Inf:23]}
```

The CompositeValue format is identical to a classic histogram. The `TYPE` line distinguishes them. Fields must appear in this order: `count`, `sum`, `bucket`. GaugeHistograms do not have Start Timestamps (no creation semantics).

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
queue_depth_bytes{queue="work"} {count:23,sum:1048576,bucket:[1024:5,65536:18,+Inf:23]} 1710000000
# EOF
```

Note: The counter line uses a plain Number value, not a CompositeValue. The summary and histogram use CompositeValue blocks. The gaugehistogram has no Start Timestamp (no creation semantics).

## Native Histograms

**Non-breaking**

Native histograms are new in OM 2.0. Instead of fixed bucket boundaries chosen at instrumentation time, native histograms use an exponential bucket schema that provides automatic resolution across all value ranges without any bucket configuration. The `schema` field controls bucket width granularity: higher values produce narrower (finer) buckets.

This section builds on the CompositeValue syntax covered in [CompositeValues](#compositevalues). Native histogram fields follow the same `{key:value,...}` format.

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

GaugeHistogram MetricPoints with native buckets follow the same syntax as histogram. The TYPE line distinguishes them. No separate example is needed.

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
