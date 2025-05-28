---
title: Exposition formats
sort_rank: 6
---

Metrics can be exposed to Prometheus using a simple [text-based](#text-based-format)
exposition format. There are various [client libraries](/docs/instrumenting/clientlibs/)
that implement this format for you. If your preferred language doesn't have a client
library you can [create your own](/docs/instrumenting/writing_clientlibs/).

## Text-based format

As of Prometheus version 2.0, all processes that expose metrics to Prometheus need to use
a text-based format. In this section you can find some [basic information](#basic-info)
about this format as well as a more [detailed breakdown](#text-format-details) of the
format.

### Basic info

| Aspect | Description |
|--------|-------------|
| **Inception** | April 2014  |
| **Supported in** |  Prometheus version `>=0.4.0` |
| **Transmission** | HTTP |
| **Encoding** | UTF-8, `\n` line endings |
| **HTTP `Content-Type`** | `text/plain; version=0.0.4` (A missing `version` value will lead to a fall-back to the most recent text format version.) |
| **Optional HTTP `Content-Encoding`** | `gzip` |
| **Advantages** | <ul><li>Human-readable</li><li>Easy to assemble, especially for minimalistic cases (no nesting required)</li><li>Readable line by line (with the exception of type hints and docstrings)</li></ul> |
| **Limitations** | <ul><li>Verbose</li><li>Types and docstrings not integral part of the syntax, meaning little-to-nonexistent metric contract validation</li><li>Parsing cost</li></ul>|
| **Supported metric primitives** | <ul><li>Counter</li><li>Gauge</li><li>Histogram</li><li>Summary</li><li>Untyped</li></ul> |

### Text format details

Prometheus' text-based format is line oriented. Lines are separated by a line
feed character (`\n`). The last line must end with a line feed character.
Empty lines are ignored.

#### Line format

Within a line, tokens can be separated by any number of blanks and/or tabs (and
must be separated by at least one if they would otherwise merge with the previous
token). Leading and trailing whitespace is ignored.

#### Comments, help text, and type information

Lines with a `#` as the first non-whitespace character are comments. They are
ignored unless the first token after `#` is either `HELP` or `TYPE`. Those
lines are treated as follows: If the token is `HELP`, at least one more token
is expected, which is the metric name. All remaining tokens are considered the
docstring for that metric name. `HELP` lines may contain any sequence of UTF-8
characters (after the metric name), but the backslash and the line feed
characters have to be escaped as `\\` and `\n`, respectively. Only one `HELP`
line may exist for any given metric name.

If the token is `TYPE`, exactly two more tokens are expected. The first is the
metric name, and the second is either `counter`, `gauge`, `histogram`,
`summary`, or `untyped`, defining the type for the metric of that name. Only
one `TYPE` line may exist for a given metric name. The `TYPE` line for a
metric name must appear before the first sample is reported for that metric
name. If there is no `TYPE` line for a metric name, the type is set to
`untyped`.

The remaining lines describe samples (one per line) using the following syntax
([EBNF](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form)):

```
metric_name [
  "{" label_name "=" `"` label_value `"` { "," label_name "=" `"` label_value `"` } [ "," ] "}"
] value [ timestamp ]
```

In the sample syntax:

*  `metric_name` and `label_name` carry the usual Prometheus expression language restrictions.
* `label_value` can be any sequence of UTF-8 characters, but the backslash (`\`), double-quote (`"`), and line feed (`\n`) characters have to be escaped as `\\`, `\"`, and `\n`, respectively.
* `value` is a float represented as required by Go's [`ParseFloat()`](https://golang.org/pkg/strconv/#ParseFloat) function. In addition to standard numerical values, `NaN`, `+Inf`, and `-Inf` are valid values representing not a number, positive infinity, and negative infinity, respectively.
* The `timestamp` is an `int64` (milliseconds since epoch, i.e. 1970-01-01 00:00:00 UTC, excluding leap seconds), represented as required by Go's [`ParseInt()`](https://golang.org/pkg/strconv/#ParseInt) function.

#### Grouping and sorting

All lines for a given metric must be provided as one single group, with
the optional `HELP` and `TYPE` lines first (in no particular order). Beyond
that, reproducible sorting in repeated expositions is preferred but not
required, i.e. do not sort if the computational cost is prohibitive.

Each line must have a unique combination of a metric name and labels. Otherwise,
the ingestion behavior is undefined.

#### Histograms and summaries

The `histogram` and `summary` types are difficult to represent in the text
format. The following conventions apply:

* The sample sum for a summary or histogram named `x` is given as a separate sample named `x_sum`.
* The sample count for a summary or histogram named `x` is given as a separate sample named `x_count`.
* Each quantile of a summary named `x` is given as a separate sample line with the same name `x` and a label `{quantile="y"}`.
* Each bucket count of a histogram named `x` is given as a separate sample line with the name `x_bucket` and a label `{le="y"}` (where `y` is the upper bound of the bucket).
* A histogram _must_ have a bucket with `{le="+Inf"}`. Its value _must_ be identical to the value of `x_count`.
* The buckets of a histogram and the quantiles of a summary must appear in increasing numerical order of their label values (for the `le` or the `quantile` label, respectively).

### Text format example

Below is an example of a full-fledged Prometheus metric exposition, including
comments, `HELP` and `TYPE` expressions, a histogram, a summary, character
escaping examples, and more.

```
# HELP http_requests_total The total number of HTTP requests.
# TYPE http_requests_total counter
http_requests_total{method="post",code="200"} 1027 1395066363000
http_requests_total{method="post",code="400"}    3 1395066363000

# Escaping in label values:
msdos_file_access_time_seconds{path="C:\\DIR\\FILE.TXT",error="Cannot find file:\n\"FILE.TXT\""} 1.458255915e9

# Minimalistic line:
metric_without_timestamp_and_labels 12.47

# A weird metric from before the epoch:
something_weird{problem="division by zero"} +Inf -3982045

# A histogram, which has a pretty complex representation in the text format:
# HELP http_request_duration_seconds A histogram of the request duration.
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.05"} 24054
http_request_duration_seconds_bucket{le="0.1"} 33444
http_request_duration_seconds_bucket{le="0.2"} 100392
http_request_duration_seconds_bucket{le="0.5"} 129389
http_request_duration_seconds_bucket{le="1"} 133988
http_request_duration_seconds_bucket{le="+Inf"} 144320
http_request_duration_seconds_sum 53423
http_request_duration_seconds_count 144320

# Finally a summary, which has a complex representation, too:
# HELP rpc_duration_seconds A summary of the RPC duration in seconds.
# TYPE rpc_duration_seconds summary
rpc_duration_seconds{quantile="0.01"} 3102
rpc_duration_seconds{quantile="0.05"} 3272
rpc_duration_seconds{quantile="0.5"} 4773
rpc_duration_seconds{quantile="0.9"} 9001
rpc_duration_seconds{quantile="0.99"} 76656
rpc_duration_seconds_sum 1.7560473e+07
rpc_duration_seconds_count 2693
```

## OpenMetrics Text Format

[OpenMetrics](https://github.com/OpenObservability/OpenMetrics) is the an effort to standardize metric wire formatting built off of Prometheus text format. It is possible to scrape targets
and it is also available to use for federating metrics since at least v2.23.0.

### Exemplars (Experimental)

Utilizing the OpenMetrics format allows for the exposition and querying of [Exemplars](https://github.com/prometheus/OpenMetrics/blob/v1.0.0/specification/OpenMetrics.md#exemplars).
Exemplars provide a point in time snapshot related to a metric set for an otherwise summarized MetricFamily. Additionally they may have a Trace ID attached to them which when used to together
with a tracing system can provide more detailed information related to the specific service.

To enable this experimental feature you must have at least version v2.26.0 and add `--enable-feature=exemplar-storage` to your arguments.

## Protobuf format

Earlier versions of Prometheus supported an exposition format based on [Protocol Buffers](https://developers.google.com/protocol-buffers/) (aka Protobuf) in addition to the current text-based format. With Prometheus 2.0, the Protobuf format was marked as deprecated and Prometheus stopped ingesting samples from said exposition format.

However, new experimental features were added to Prometheus where the Protobuf format was considered the most viable option. Making Prometheus accept Protocol Buffers once again.

Here is a list of experimental features that, once enabled, will configure Prometheus to favor the Protobuf exposition format:

| feature flag | version that introduced it |
|--------------|----------------------------|
| native-histograms | 2.40.0 |
| created-timestamp-zero-ingestion | 2.50.0 |

## Historical versions

For details on historical format versions, see the legacy
[Client Data Exposition Format](https://docs.google.com/document/d/1ZjyKiKxZV83VI9ZKAXRGKaUKK2BIWCT7oiGBKDBpjEY/edit?usp=sharing)
document.

The current version of the original Protobuf format (with the recent extensions
for native histograms) is maintained in the [prometheus/client_model
repository](https://github.com/prometheus/client_model).
