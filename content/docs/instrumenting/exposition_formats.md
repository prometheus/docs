---
title: Exposition formats
sort_rank: 6
---

# Exposition formats

Prometheus implements two different wire formats which clients may use to
expose metrics to a Prometheus server: a simple text-based format and a more
efficient and robust protocol-buffer format. Prometheus servers and clients use
[content negotation](http://en.wikipedia.org/wiki/Content_negotiation) to
establish the actual format to use. A server will prefer receiving the
protocol-buffer format, and will fall back to the text-based format if the
client does not support the former.

The majority of users should use the existing [client libraries](/docs/instrumenting/clientlibs/)
that already implement the exposition formats.

## Format version 0.0.4

This is the current metrics exposition format version.

As of this version, there are two alternate formats understood by Prometheus: a
protocol-buffer based format and a text format. Clients must support at least
one of these two alternate formats.

In addition, clients may optionally expose other text formats that are not
understood by Prometheus. They exist solely for consumption by human beings and
are meant to facilitate debugging. It is strongly recommended that a client
library supports at least one human-readable format. A human-readable format
should be the fallback in case the HTTP `Content-Type` header is not understood
by the client library. The version `0.0.4` text format is generally considered
human readable, so it is a good fallback candidate (and also understood by
Prometheus).

### Format variants comparison

|               | Protocol buffer format | Text format |
|---------------|------------------------|-------------|
| **Inception** | April 2014 | April 2014  |
| **Supported in** | Prometheus version `>=0.4.0` | Prometheus version `>=0.4.0` |
| **Transmission** | HTTP | HTTP |
| **Encoding** | [32-bit varint-encoded record length-delimited](https://developers.google.com/protocol-buffers/docs/reference/java/com/google/protobuf/AbstractMessageLite#writeDelimitedTo(java.  io.OutputStream)) Protocol Buffer messages of type [io.prometheus.client.MetricFamily](https://github.com/prometheus/client_model/blob/086fe7ca28bde6cec2acd5223423c1475a362858/metrics.proto#L76-  L81) | UTF-8, `\n` line endings |
| **HTTP `Content-Type`** | `application/vnd.google.protobuf; proto=io.prometheus.client.MetricFamily; encoding=delimited` | `text/plain; version=0.0.4` (A missing `version` value will lead to a fall-back to the most recent text format version.) |
| **Optional HTTP `Content-Encoding`** | `gzip` | `gzip` |
| **Advantages** | <ul><li>Cross-platform</li><li>Size</li><li>Encoding and decoding costs</li><li>Strict schema</li><li>Supports concatenation and theoretically streaming (only server-side behavior would need to change)</li></ul> | <ul><li>Human-readable</li><li>Easy to assemble, especially for minimalistic cases (no nesting required)</li><li>Readable line by line (with the exception of type hints and docstrings)</li></ul> |
| **Limitations** | <ul><li>Not human-readable</li></ul> | <ul><li>Verbose</li><li>Types and docstrings not integral part of the syntax, meaning little-to-nonexistent metric contract validation</li><li>Parsing cost</li></ul>|
| **Supported metric primitives** | <ul><li>Counter</li><li>Gauge</li><li>Histogram</li><li>Summary</li><li>Untyped</li></ul> | <ul><li>Counter</li><li>Gauge</li><li>Histogram</li><li>Summary</li><li>Untyped</li></ul> |
| **Compatibility** | Version `0.0.3` protocol buffers are also valid version `0.0.4` protocol buffers. | none |

### Protocol buffer format details

Reproducible sorting of the protocol buffer fields in repeated expositions is
preferred but not required, i.e. do not sort if the computational cost is
prohibitive.

Each `MetricFamily` within the same exposition must have a unique name. Each
`Metric` within the same `MetricFamily` must have a unique set of `LabelPair`
fields. Otherwise, the ingestion behavior is undefined.

### Text format details

The protocol is line-oriented. A line-feed character (`\n`) separates lines.
The last line must end with a line-feed character. Empty lines are ignored.

Within a line, tokens can be separated by any number of blanks and/or tabs (and
have to be separated by at least one if they would otherwise merge with the
previous token). Leading and trailing whitespace is ignored.

Lines with a `#` as the first non-whitespace character are comments. They are
ignored unless the first token after `#` is either `HELP` or `TYPE`. Those
lines are treated as follows: If the token is `HELP`, at least one more token
is expected, which is the metric name. All remaining tokens are considered the
docstring for that metric name. `HELP` lines may contain any sequence of UTF-8
characters (after the metric name), but the backslash and the line-feed
characters have to be escaped as `\\` and `\n`, respectively. Only one `HELP`
line may exist for the same metric name.

If the token is `TYPE`, exactly two more tokens are expected. The first is the
metric name, and the second is either `counter`, `gauge`, `histogram`,
`summary`, or `untyped`, defining the type for the metric of that name. Only
one `TYPE` line may exist for the same metric name. The `TYPE` line for a
metric name has to appear before the first sample is reported for that metric
name. If there is no `TYPE` line for a metric name, the type is set to
`untyped`. Remaining lines describe samples, one per line, with the following
syntax (EBNF):

    metric_name [
      "{" label_name "=" `"` label_value `"` { "," label_name "=" `"` label_value `"` } [ "," ] "}"
    ] value [ timestamp ]

`metric_name` and `label_name` have the usual Prometheus expression language restrictions. `label_value` can be any sequence of UTF-8 characters, but the backslash, the double-quote, and the line-feed characters have to be escaped as `\\`, `\"`, and `\n`, respectively.
`value` is a float, and timestamp an `int64` (milliseconds since epoch, i.e. 1970-01-01 00:00:00 UTC, excluding leap seconds), represented as required by the [Go strconv package](http://golang.org/pkg/strconv/) (see functions `ParseInt` and `ParseFloat`). In particular, `Nan`, `+Inf`, and `-Inf` are valid values.

All lines for a given metric must be provided as one uninterrupted group, with
the optional `HELP` and `TYPE` lines first (in no particular order). Beyond
that, reproducible sorting in repeated expositions is preferred but not
required, i.e. do not sort if the computational cost is prohibitive.

Each line must have a unique combination of metric name and labels. Otherwise,
the ingestion behavior is undefined.

The `histogram` and `summary` types are difficult to represent in the text
format. The following conventions apply:

* The sample sum for a summary or histogram named `x` is given as a separate sample named `x_sum`.
* The sample count for a summary or histogram named `x` is given as a separate sample named `x_count`.
* Each quantile of a summary named `x` is given as a separate sample line with the same name `x` and a label `{quantile="y"}`.
* Each bucket count of a histogram named `x` is given as a separate sample line with the name `x_bucket` and a label `{le="y"}` (where `y` is the upper bound of the bucket).
* A histogram _must_ have a bucket with `{le="+Inf"}`. Its value _must_ be identical to the value of `x_count`.
* The buckets of a histogram and the quantiles of a summary must appear in increasing numerical order of their label values (for the `le` or the `quantile` label, respectively).

See also the example below.

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
# HELP telemetry_requests_metrics_latency_microseconds A summary of the response latency.
# TYPE telemetry_requests_metrics_latency_microseconds summary
telemetry_requests_metrics_latency_microseconds{quantile="0.01"} 3102
telemetry_requests_metrics_latency_microseconds{quantile="0.05"} 3272
telemetry_requests_metrics_latency_microseconds{quantile="0.5"} 4773
telemetry_requests_metrics_latency_microseconds{quantile="0.9"} 9001
telemetry_requests_metrics_latency_microseconds{quantile="0.99"} 76656
telemetry_requests_metrics_latency_microseconds_sum 1.7560473e+07
telemetry_requests_metrics_latency_microseconds_count 2693
```

#### Optional Text Representations

The following three optional text formats are meant for human consumption only
and are not understood by Prometheus. Their definition may therefore be
somewhat loose. Client libraries may or may not support these formats. Tools
should not rely on these formats.

1. HTML: This format is requested by an HTTP `Content-Type` header with value
   of `text/html`. It is a "pretty" rendering of the metrics to be looked at in a
   browser. While the generating client is technically completely free in
   assembling the HTML, consistency between client libraries should be aimed for.
2. Protocol buffer text format: Identical to the protocol buffer format, but in
   text form. It consists of the protocol messages concatenated in their text
   format (also known as "debug strings"), separated by an additional new line
   character (i.e. there is an empty line between protocol messages). The format
   is requested as the protocol buffer format, but the `encoding` in the HTTP
   `Content-Type` header set to `text`.
3. Protocol buffer compact text format: Identical to (2) but using the compact
   text format instead of the normal text format. The compact text format puts the
   whole protocol message on one line. The protocol messages are still separated
   by new line characters, but no "empty line" is needed for separation. (Simply
   one protocol message per line.) The format is requested as the protocol buffer
   format, but the `encoding` in the HTTP `Content-Type` header set to
   `compact-text`.

## Historical versions

For details on historical format versions, see the legacy
[Client Data Exposition Format](https://docs.google.com/document/d/1ZjyKiKxZV83VI9ZKAXRGKaUKK2BIWCT7oiGBKDBpjEY/edit?usp=sharing)
document.
