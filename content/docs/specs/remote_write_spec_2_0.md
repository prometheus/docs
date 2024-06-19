---
title: "Prometheus Remote-Write 2.0 [EXPERIMENTAL]"
sort_rank: 4
---

# Prometheus Remote-Write Specification

* Version: 2.0-rc.0
* Status: **Experimental**
* Date: May 2024

The Remote-Write specification, in general, is intended to document the standard for how Prometheus and Prometheus Remote-Write compatible senders send data to Prometheus or Prometheus Remote-Write compatible receivers.

This document is intended to define a second version of the [Prometheus Remote-Write](./remote_write_spec.md) API with minor changes to protocol and semantics. This second version adds a new Proto Message with new features enabling more use cases and wider adoption on top of performance and cost savings. The second version also deprecates the previous Proto Message from a [1.0 Remote-Write specification](./remote_write_spec.md#protocol). Finally, this spec outlines how to implement backwards-compatible senders and receivers (even under a single endpoint) using existing basic content negotiation request headers. More advanced, automatic content negotiation mechanisms might come in a future minor version, if needed. For the rationales behind the 2.0 specification, see [the formal proposal](https://github.com/prometheus/proposals/pull/35).

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED",  "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119).

> NOTE: This is a release candidate for Remote-Write 2.0 specification. This means that this specification is currently in an experimental state--no major changes are expected, but we reserve the rights to break the compatibility if it's absolutely necessary, based on the early adopters' feedback. The potential feedback, questions and suggestions should be added as comments to the [PR with the open proposal](https://github.com/prometheus/proposals/pull/35).

## Introduction

### Background

The Remote-Write protocol is designed to make it possible to reliably propagate samples in real-time from a sender to a receiver, without loss.

<!---
For the detailed rationales behind each 2.0 Remote-Write decision, see: https://github.com/prometheus/proposals/blob/alexg/remote-write-20-proposal/proposals/2024-04-09_remote-write-20.md
-->
The Remote-Write protocol is designed to be stateless; there is strictly no inter-message communication. As such the protocol is not considered "streaming". To achieve a streaming effect multiple messages should be sent over the same connection using e.g. HTTP/1.1 or HTTP/2. "Fancy" technologies such as gRPC were considered, but at the time were not widely adopted, and it was challenging to expose gRPC services to the internet behind load balancers such as an AWS EC2 ELB.

The Remote-Write protocol contains opportunities for batching, e.g. sending multiple samples for different series in a single request. It is not expected that multiple samples for the same series will be commonly sent in the same request, although there is support for this in the Proto Message.

A test suite can be found at https://github.com/prometheus/compliance/tree/main/remote_write_sender. The compliance tests for remote write 2.0 compatibility are still [in progress](https://github.com/prometheus/compliance/issues/101).

### Glossary

In this document, the following definitions are followed:

* a `Remote-Write` is the name of this Prometheus protocol.
* a `Protocol` is a communication specification that enables the client and server to transfer metrics.
* a `Proto Message` (or Protobuf Message) refers to the [content type](https://www.rfc-editor.org/rfc/rfc9110.html#name-content-type) definition of the data structure for this Protocol. Since the specification uses [Google Protocol Buffers ("protobuf")](https://protobuf.dev/) exclusively, the schema is defined in a ["proto" file](https://protobuf.dev/programming-guides/proto3/) and represented by a single Protobuf ["message"](https://protobuf.dev/programming-guides/proto3/#simple).
* a `Wire Format` is the format of the data as it travels on the wire (i.e. in a network). In the case of Remote-Write, this is always the compressed binary protobuf format.
* a `Sender` is something that sends Remote-Write data.
* a `Receiver` is something that receives Remote-Write data.
* a `Sample` is a pair of (timestamp, value).
* a `Histogram` is a pair of (timestamp, [histogram value](https://github.com/prometheus/docs/blob/b9657b5f5b264b81add39f6db2f1df36faf03efe/content/docs/concepts/native_histograms.md)).
* a `Label` is a pair of (key, value).
* a `Series` is a list of samples, identified by a unique set of labels.

## Definitions

### Protocol

The Remote-Write Protocol MUST consist of RPCs with the request body serialized using a Google Protocol Buffers and then compressed.

<!---
Rationales: https://github.com/prometheus/proposals/blob/alexg/remote-write-20-proposal/proposals/2024-04-09_remote-write-20.md#a-new-protobuf-message-identified-by-fully-qualified-name-old-one-deprecated
-->
The protobuf serialization MUST use either of the following Proto Messages:

* The `prometheus.WriteRequest` introduced in [the Remote-Write 1.0 specification](./remote_write_spec.md#protocol). As of 2.0, this message is deprecated. It SHOULD be used only for compatibility reasons. Sender and Receiver MAY NOT support the `prometheus.WriteRequest`.
* The `io.prometheus.write.v2.Request` introduced in this specification and defined [below](#proto-message). Sender and Receiver SHOULD use this message when possible. Sender and Receiver MUST support the `io.prometheus.write.v2.Request`.

The Proto Message MUST use binary Wire Format. Then, MUST be compressed with [Google’s Snappy](https://github.com/google/snappy). Snappy's [block format](https://github.com/google/snappy/blob/2c94e11145f0b7b184b831577c93e5a41c4c0346/format_description.txt) MUST be used -- [the framed format](https://github.com/google/snappy/blob/2c94e11145f0b7b184b831577c93e5a41c4c0346/framing_format.txt) MUST NOT be used.

Sender MUST send a serialized and compressed Proto Message in the body of an HTTP POST request and send it to the Receiver via HTTP at the provided URL path. The Receiver MAY specify any HTTP URL path to receive metrics.

<!---
Rationales: https://github.com/prometheus/proposals/blob/alexg/remote-write-20-proposal/proposals/2024-04-09_remote-write-20.md#basic-content-negotiation-built-on-what-we-have
-->
Sender MUST send the following reserved headers with the HTTP request:

- `Content-Encoding`
- `Content-Type`
- `X-Prometheus-Remote-Write-Version`
- `User-Agent`

Sender MAY allow users to add custom HTTP headers; they MUST NOT allow users to configure them in such a way as to send reserved headers.

#### Content-Encoding

```
Content-Encoding: <compression>
```

<!---
Rationales: https://github.com/prometheus/proposals/blob/alexg/remote-write-20-proposal/proposals/2024-04-09_remote-write-20.md#no-new-compression-added--yet-
-->
Content encoding request header MUST follow [the RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-content-encoding). Sender MUST use the `snappy` value. Receiver MUST support `snappy` compression. New, optional compression algorithms might come in 2.x or beyond.

#### Content-Type

```
Content-Type: application/x-protobuf
Content-Type: application/x-protobuf;proto=<fully qualified name>
```

Content type request header MUST follow [the RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-content-type). Sender MUST use `application/x-protobuf` as the only media type. Sender MAY add `;proto=` parameter to the header's value to indicate the fully qualified name of the Proto Message that was used, from the two mentioned above. As a result, Sender MUST send any of the three supported header values:

For the deprecated message introduced in PRW 1.0, identified by `prometheus.WriteRequest`:

* `Content-Type: application/x-protobuf`
* `Content-Type: application/x-protobuf;proto=prometheus.WriteRequest`
  
For the message introduced in PRW 2.0, identified by `io.prometheus.write.v2.Request`:
  
* `Content-Type: application/x-protobuf;proto=io.prometheus.write.v2.Request`
  
When talking to 1.x Receiver, Sender SHOULD use `Content-Type: application/x-protobuf` for backward compatibility. Otherwise, Sender SHOULD use `Content-Type: application/x-protobuf;proto=io.prometheus.write.v2.Request`. More Proto Messages might come in 2.x or beyond.

#### X-Prometheus-Remote-Write-Version

```
X-Prometheus-Remote-Write-Version: <Remote-Write spec major and minor version>
```

When talking to 1.x Receiver, Sender MUST use `X-Prometheus-Remote-Write-Version: 0.1.0` for backward compatibility. Otherwise, Sender SHOULD use the newest Remote-Write version it is compatible with e.g. `X-Prometheus-Remote-Write-Version: 2.0.0`.

#### User-Agent

```
User-Agent: <name & version of the sender>
```

Sender MUST include a user agent header that SHOULD follow [the RFC 9110 User-Agent header format](https://www.rfc-editor.org/rfc/rfc9110.html#name-user-agent).

### Response

Receiver ingesting all samples successfully MUST return a 200 HTTP status code. In such a successful case, the response body from the Receiver SHOULD be empty; Sender MUST ignore the response body. The response body is RESERVED for future use.

Receiver MUST NOT return a 200 HTTP status code if any of the samples were not written successfully (e.g. on a [partial write](#partial-write) or a full write rejection). In such a case, Receiver MUST provide a human-readable error message in the response body. The Receiver's error SHOULD contain information about the amount of the samples being rejected and for what reasons. Sender MUST NOT try and interpret the error message and SHOULD log it as is.

The following subsections specify Sender and Receiver semantics around different write error cases.

#### Partial Write

<!---
Rationales: https://github.com/prometheus/proposals/blob/alexg/remote-write-20-proposal/proposals/2024-04-09_remote-write-20.md#partial-writes
-->
Sender SHOULD use Remote-Write to send samples for multiple series in a single request. As a result, Receiver MAY ingest valid samples within a write request that also contains some invalid or otherwise unwritten samples, which represents a partial write case. In such a case, Receiver MUST return non-200 status code following the [Invalid Samples](#invalid-samples) and [Retry on Partial Writes](#retries-on-partial-writes) sections.

#### Unsupported Request Content

Receiver MUST return [415 HTTP Unsupported Media Type](https://www.rfc-editor.org/rfc/rfc9110.html#name-415-unsupported-media-type) status code if they don't support a given content type or encoding provided by Sender.

Sender SHOULD expect [400 HTTP Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) for the above reasons from the 1.x Receiver, for backwards compatibility.

#### Invalid Samples

Receiver MAY NOT support certain metric types or samples (e.g. Receiver might reject sample without metadata type specified or without created timestamp, while another Receiver might accept such sample.). It’s up to the Receiver what sample is invalid. Receiver MUST return a [400 HTTP Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) status code for write requests that contain any invalid samples unless the [partial retriable write](#retries-on-partial-writes) occurs.

Sender MUST NOT retry on a 4xx HTTP status codes (other than [429](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)), which MUST be used by Receiver to indicate that the write operation will never be able to succeed and should not be retried. Sender MAY retry on the 415 HTTP status code with a different content type or encoding to see if Receiver supports it.

### Retries & Backoff

Receiver MAY return a [429 HTTP Too Many Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429) status code to indicate the overloaded server situation. Receiver MAY return [the Retry-After](https://www.rfc-editor.org/rfc/rfc9110.html#name-retry-after) header to indicate the time for the next write attempt. Receiver MAY return a 5xx HTTP status code to represent internal server errors.

Sender MAY retry on a 429 HTTP status code. Sender MUST retry write requests on 5xx HTTP. Sender MUST use a backoff algorithm to prevent overwhelming the server. Sender MAY handle [the Retry-After response header](https://www.rfc-editor.org/rfc/rfc9110.html#name-retry-after) to estimate the next retry time.

The difference between 429 vs 5xx handling is due to the potential situation of Sender “falling behind” when Receiver cannot keep up with the request volume, or Receiver choosing to rate limit Sender to protect its own availability. As a result, Sender has the option to NOT retry on 429, which allows progress to be made when there are Sender side errors (e.g. too much traffic), while the data is not lost when there are Receiver side errors (5xx).

#### Retries on Partial Writes

Receiver MAY return a 5xx HTTP or 429 HTTP status code on partial write or [partial invalid sample cases](#partial-write) when it expects Sender to retry the whole request. In that case Receiver MUST support idempotency as sender MAY retry with the same request.

### Backward and Forward Compatibility

The protocol follows [semantic versioning 2.0](https://semver.org/): any 2.x compatible Receiver MUST be able to read any 2.x compatible Sender and vice versa. Breaking or backwards incompatible changes will result in a 3.x version of the spec.

The Proto Messages (in Wire Format) themselves are forward / backward compatible, in some respects:

* Removing fields from the proto message requires a major version bump.
* Adding (optional) fields can be done in a minor version bump.

In other words, this means that future minor versions of 2.x MAY add new optional fields to `io.prometheus.write.v2.Request`, new compressions, Proto Messages and negotiation mechanisms, as long as they are backwards compatible (e.g. optional to both Receiver and Sender).

#### 2.x vs 1.x Compatibility

The 2.x protocol is breaking compatibility with 1.x by introducing a new, mandatory `io.prometheus.write.v2.Request` Proto Message and deprecating the `prometheus.WriteRequest`.

2.x Sender MAY support 1.x Receiver by allowing users to configure what content type Sender should use. 2.x Sender also MAY automatically fall back to different content types, if the Receiver returns 415 HTTP status code.

## Proto Message

### `io.prometheus.write.v2.Request`

The `io.prometheus.write.v2.Request` references the new Proto Message that's meant to replace and deprecate the Remote-Write 1.0's `prometheus.WriteRequest` message.

<!---
TODO(bwplotka): Move link to the one on Prometheus main or even buf. 
-->
The full schema and source of the truth is in Prometheus repository in [`prompb/io/prometheus/write/v2/types.proto`](https://github.com/prometheus/prometheus/blob/remote-write-2.0/prompb/io/prometheus/write/v2/types.proto#L32). The `gogo` dependency and options CAN be ignored ([will be removed eventually](https://github.com/prometheus/prometheus/issues/11908)). They are not part of the specification as they don't impact the serialized format.

The simplified version of the new `io.prometheus.write.v2.Request` is presented below.

```
// Request represents a request to write the given timeseries to a remote destination.
message Request {
  // symbols contains a de-duplicated array of string elements used for various
  // items in a Request message, like labels and metadata items. For the sender's convenience
  // around empty values for optional fields like unit_ref, symbols array MUST start with
  // empty string.
  //
  // To decode each of the symbolized strings, referenced, by "ref(s)" suffix, you
  // need to lookup the actual string by index from symbols array. The order of
  // strings is up to the sender. The receiver should not assume any particular encoding.
  repeated string symbols = 1;
  // timeseries represents an array of distinct series with 0 or more samples.
  repeated TimeSeries timeseries = 2;
}

// TimeSeries represents a single series.
message TimeSeries {
  // labels_refs is a list of label name-value pair references, encoded
  // as indices to the Request.symbols array. This list's length is always
  // a multiple of two, and the underlying labels should be sorted lexicographically.
  //
  // Note that there might be multiple TimeSeries objects in the same
  // Requests with the same labels e.g. for different exemplars, metadata
  // or created timestamp.
  repeated uint32 labels_refs = 1;

  // Timeseries messages can either specify samples or (native) histogram samples
  // (histogram field), but not both. For a typical sender (real-time metric
  // streaming), in healthy cases, there will be only one sample or histogram.
  //
  // Samples and histograms are sorted by timestamp (older first).
  repeated Sample samples = 2;
  repeated Histogram histograms = 3;

  // exemplars represents an optional set of exemplars attached to this series' samples.
  repeated Exemplar exemplars = 4;

  // metadata represents the metadata associated with the given series' samples.
  Metadata metadata = 5;

  // created_timestamp represents an optional created timestamp associated with
  // this series' samples in ms format, typically for counter or histogram type
  // metrics. Created timestamp represents the time when the counter started
  // counting (sometimes referred to as start timestamp), which can increase
  // the accuracy of query results.
  //
  // Note that some receivers might require this and in return fail to
  // ingest such samples within the Request.
  //
  // For Go, see github.com/prometheus/prometheus/model/timestamp/timestamp.go
  // for conversion from/to time.Time to Prometheus timestamp.
  //
  // Note that the "optional" keyword is omitted due to
  // https://cloud.google.com/apis/design/design_patterns.md#optional_primitive_fields
  // Zero value means value not set. If you need to use exactly zero value for
  // the timestamp, use 1 millisecond before or after.
  int64 created_timestamp = 6;
}

// Exemplar represents additional information attached to some series' samples.
message Exemplar {
  // labels_refs is an optional list of label name-value pair references, encoded
  // as indices to the Request.symbols array. This list's len is always
  // a multiple of 2, and the underlying labels should be sorted lexicographically.
  // If the exemplar references a trace it should use the `trace_id` label name, as a best practice.
  repeated uint32 labels_refs = 1;
  // value represents an exact example value. This can be useful when the exemplar
  // is attached to a histogram, which only gives an estimated value through buckets.
  double value = 2;
  // timestamp represents an optional timestamp of the sample in ms.
  // For Go, see github.com/prometheus/prometheus/model/timestamp/timestamp.go
  // for conversion from/to time.Time to Prometheus timestamp.
  //
  // Note that the "optional" keyword is omitted due to
  // https://cloud.google.com/apis/design/design_patterns.md#optional_primitive_fields
  // Zero value means value not set. If you need to use exactly zero value for
  // the timestamp, use 1 millisecond before or after.
  int64 timestamp = 3;
}

// Sample represents series sample.
message Sample {
  // value of the sample.
  double value = 1;
  // timestamp represents timestamp of the sample in ms.
  int64 timestamp = 2;
}

// Metadata represents the metadata associated with the given series' samples.
message Metadata {
  enum MetricType {
    METRIC_TYPE_UNSPECIFIED    = 0;
    METRIC_TYPE_COUNTER        = 1;
    METRIC_TYPE_GAUGE          = 2;
    METRIC_TYPE_HISTOGRAM      = 3;
    METRIC_TYPE_GAUGEHISTOGRAM = 4;
    METRIC_TYPE_SUMMARY        = 5;
    METRIC_TYPE_INFO           = 6;
    METRIC_TYPE_STATESET       = 7;
  }
  MetricType type = 1;
  // help_ref is a reference to the Request.symbols array representing help
  // text for the metric. Help is optional, reference should point to an empty string in
  // such a case.
  uint32 help_ref = 3;
  // unit_ref is a reference to the Request.symbols array representing a unit
  // for the metric. Unit is optional, reference should point to an empty string in
  // such a case.
  uint32 unit_ref = 4;
}

// A native histogram, also known as a sparse histogram.
// See https://github.com/prometheus/prometheus/blob/remote-write-2.0/prompb/io/prometheus/write/v2/types.proto#L142
// for a full message that follows the native histogram spec for both sparse
// and exponential, as well as, custom bucketing.
message Histogram { ... }
```

All timestamps MUST be int64 counted as milliseconds since the Unix epoch. Sample's values MUST be float64.

For every `TimeSeries` message:

* `labels_refs` MUST be provided.

<!---
Rationales: https://github.com/prometheus/proposals/blob/alexg/remote-write-20-proposal/proposals/2024-04-09_remote-write-20.md#partial-writes#samples-vs-native-histogram-samples
-->
* At least one element in `samples` or in `histograms` MUST be provided. A `TimeSeries` MUST NOT include both `samples` and `histograms`. For series which (rarely) would mix float and histogram samples, a separate `TimeSeries` message MUST be used.

<!---
Rationales: https://github.com/prometheus/proposals/blob/alexg/remote-write-20-proposal/proposals/2024-04-09_remote-write-20.md#always-on-metadata
-->
* `metadata` sub-fields SHOULD be provided. Receiver MAY reject series with unspecified `Metadata.type`.
* Exemplars SHOULD be provided if they exist for a series.
* `created_timestamp` SHOULD be provided for metrics that follow counter semantics (e.g. counters and histograms). Receiver MAY reject those series without `created_timestamp` being set.

The following subsections define some schema elements in detail.

#### Symbols

<!---
Rationales: https://github.com/prometheus/proposals/blob/alexg/remote-write-20-proposal/proposals/2024-04-09_remote-write-20.md#partial-writes#string-interning
-->
The `io.prometheus.write.v2.Request` Proto Message is designed to [intern all strings](https://en.wikipedia.org/wiki/String_interning) for the proven additional compression and memory efficiency gains on top of the standard compressions.

The `symbols` table MUST be provided and it MUST contain deduplicated strings used in series, exemplar labels, and metadata strings. The first element of the `symbols` table MUST be an empty string, which is used to represent empty or unspecified values such as when `Metadata.unit_ref` or `Metadata.help_ref` are not provided. References MUST point to the existing index in the `symbols` string array.

#### Series Labels

<!---
Rationales: https://github.com/prometheus/proposals/blob/alexg/remote-write-20-proposal/proposals/2024-04-09_remote-write-20.md#labels-and-utf-8
-->
The complete set of labels MUST be sent with each `Sample` or `Histogram` sample. Additionally, the label set associated with samples:

* SHOULD contain a `__name__` label.
* MUST NOT contain repeated label names.
* MUST have label names sorted in lexicographical order.
* MUST NOT contain any empty label names or values.

Metric names, label names, and label values MUST be any sequence of UTF-8 characters.

Metric names SHOULD adhere to the regex `[a-zA-Z_:]([a-zA-Z0-9_:])*`. 

Label names SHOULD adhere to the regex `[a-zA-Z_]([a-zA-Z0-9_])*`.

Names that do not adhere to the above, might be harder to use for PromQL users (see [the UTF-8 proposal for more details](https://github.com/prometheus/proposals/blob/main/proposals/2023-08-21-utf8.md)).

Label names beginning with "__" are RESERVED for system usage and SHOULD NOT be used, see [Prometheus Data Model](https://prometheus.io/docs/concepts/data_model/).

Receiver also MAY impose limits on the number and length of labels, but this is receiver-specific and is out of the scope for this document.

#### Samples and Histogram Samples

<!---
Rationales: https://github.com/prometheus/proposals/blob/alexg/remote-write-20-proposal/proposals/2024-04-09_remote-write-20.md#partial-writes#native-histograms
-->
Sender MUST send `samples` (or `histograms`) for any given `TimeSeries` in timestamp order. Sender MAY send multiple requests for different series in parallel.

<!---
Rationales: https://github.com/prometheus/proposals/blob/alexg/remote-write-20-proposal/proposals/2024-04-09_remote-write-20.md#partial-writes#being-pull-vs-push-agnostic
-->
Sender SHOULD send stale markers when a time series will no longer be appended to.
Sender MUST send stale markers if the discontinuation of time series is possible to detect, for example:

* For series that were pulled (scraped), unless explicit timestamp was used. 
* For series that is resulted by a recording rule evaluation.

Generally, not sending stale markers for series that are discontinued can lead to Receiver [non-trivial query time alignment issues](https://prometheus.io/docs/prometheus/latest/querying/basics/#staleness).

Stale markers MUST be signalled by the special NaN value `0x7ff0000000000002`. This value MUST NOT be used otherwise.

Typically, Sender can detect when a time series will no longer be appended using the following techniques:

1. Detecting, using service discovery, that the target exposing the series has gone away.
1. Noticing the target is no longer exposing the time series between successive scrapes.
1. Failing to scrape the target that originally exposed a time series.
1. Tracking configuration and evaluation for recording and alerting rules.
1. Tracking discontinuation of metrics for non-scrape source of metric (e.g. in k6 when the benchmark has finished for series per benchmark, it could emit a stale marker).

#### Metadata

Metadata SHOULD follow the official Prometheus guidelines for [Type](https://prometheus.io/docs/instrumenting/writing_exporters/#types) and [Help](https://prometheus.io/docs/instrumenting/writing_exporters/#help-strings).

Metadata MAY follow the official OpenMetrics guidelines for [Unit](https://github.com/OpenObservability/OpenMetrics/blob/main/specification/OpenMetrics.md#unit).

#### Exemplars

Each exemplar, if attached to a `TimeSeries`:

* MUST contain a value.

<!---
Rationales: https://github.com/prometheus/proposals/blob/alexg/remote-write-20-proposal/proposals/2024-04-09_remote-write-20.md#partial-writes#exemplars
-->
* MAY contain labels e.g. referencing trace or request ID. If the exemplar references a trace it SHOULD use the `trace_id` label name, as a best practice.
* MAY contain a timestamp.

## Out of Scope

The same as in [1.0](./remote_write_spec.md#out-of-scope).

## Future Plans

This section contains speculative plans that are not considered part of protocol specification yet but are mentioned here for completeness. Note that 2.0 specification completed [2 of 3 future plans in the 1.0](./remote_write_spec.md#future-plans).

* **Transactionality** There is still no transactionality defined for 2.0 specification, mostly because it makes scalable Sender implementation difficult. Prometheus Sender aims at being "transactional" - i.e. to never expose a partially scraped target to a query. We intend to do the same with Remote-Write -- for instance, in the future we would like to "align" Remote-Write with scrapes, perhaps such that all the samples, metadata and exemplars for a single scrape are sent in a single Remote-Write request.

  However, Remote-Write 2.0 specification solves an important transactionality problem for [the classic histogram buckets](https://docs.google.com/document/d/1mpcSWH1B82q-BtJza-eJ8xMLlKt6EJ9oFGH325vtY1Q/edit#heading=h.ueg7q07wymku). This is done thanks to the native histograms supporting custom bucket-ing possible with the `io.prometheus.write.v2.Request` wire format. Sender might translate all classic histograms to native histograms this way, but it's out of this specification to mandate this. However, for this reason, Receiver MAY ignore certain metric types (e.g. classic histograms).

* **Alternative wire formats**. The OpenTelemetry community has shown the validity of Apache Arrow (and potentially other columnar formats) for over-wire data transfer with their OTLP protocol. We would like to do experiments to confirm the compatibility of a similar format with Prometheus’ data model and include benchmarks of any resource usage changes. We would potentially maintain both a protobuf and columnar format long term for compatibility reasons and use our content negotiation to add different proto messages for this purpose.

* **Global symbols**. Pre-defined string dictionary for interning The protocol could pre-define a static dictionary of ref->symbol that includes strings that are considered common, e.g. “namespace”, “le”, “job”, “seconds”, “bytes”, etc. Sender could refer to these without the need to include them in the request’s symbols table. This dictionary could incrementally grow with a minor version releases of this protocol.

## Related

### FAQ

**Why did you not use gRPC?**
Because 1.0 protocol does not use gRPC, breaking it would increase friction in the adoption. See 1.0 [reason](./remote_write_spec.md#faq).

**Why not stream protobuf messages?**
If you use persistent HTTP/1.1 connections, they are pretty close to streaming. Of course headers have to be re-sent, but yes that is less expensive than a new TCP set up.

**Why do we send samples in order?**
The in-order constraint comes from the encoding we use for time series data in Prometheus, the implementation of which is optimized for append-only workloads. However, this requirement is also shared across many other databases and vendors in the ecosystem. In fact, [Prometheus with OOO feature enabled](https://youtu.be/qYsycK3nTSQ?t=1321), allows out-of-order writes, but with the performance penalty, thus reserved for rare events. To sum up, Receiver may support out-of-order ingestion, though it is not permitted by the specification. In the future e.g. 2.x spec versions, we could extend content type to negotiate the out-of-order writes, if needed.

**How can we parallelise requests with the in-order constraint?**
Samples must be in-order _for a given series_. However, even if Receiver does not support out-of-order ingestion, the Remote-Write requests can be sent in parallel as long as they are for different series. Prometheus shards the samples by their labels into separate queues, and then writes happen sequentially in each queue. This guarantees samples for the same series are delivered in order, but samples for different series are sent in parallel - and potentially "out of order" between different series.

**What are the differences between Remote-Write 2.0 and OpenTelemetry's OTLP protocol?**
[OpenTelemetry OTLP](https://github.com/open-telemetry/opentelemetry-proto/blob/a05597bff803d3d9405fcdd1e1fb1f42bed4eb7a/docs/specification.md) is a protocol for transporting of telemetry data (such as metrics, logs, traces and profiles) between telemetry sources, intermediate nodes and telemetry backends. The recommended transport involves gRPC with protobuf, but HTTP with protobuf or JSON are also described. It was designed from scratch with the intent to support a variety of different observability signals, data types and extra information. For [metrics](https://github.com/open-telemetry/opentelemetry-proto/blob/main/opentelemetry/proto/metrics/v1/metrics.proto) that means additional non-identifying labels, flags, temporal aggregations types, resource or scoped metrics, schema URLs and more. OTLP also requires [the semantic convention](https://opentelemetry.io/docs/concepts/semantic-conventions/) to be used.

Remote-Write was designed for simplicity, efficiency and organic growth. The first version was officially released in 2023, when already [dozens of battle-tested adopters in the CNCF ecosystem](./remote_write_spec.md#compatible-senders-and-receivers) had been using this protocol for years. Remote-Write 2.0 iterates on the previous protocol by adding a few new elements (metadata, exemplars, created timestamp and native histograms) and string interning. Remote-Write 2.0 is always stateless, focuses only on metrics and is opinionated; as such it is scoped down to elements that Prometheus community considers enough to have a robust metric solution. The intention is to ensure the Remote-Write is a stable protocol that is a cheaper and simpler to adopt and use than the alternatives in the observability ecosystem.
