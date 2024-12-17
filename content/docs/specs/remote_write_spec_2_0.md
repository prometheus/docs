---
title: "Prometheus Remote-Write 2.0 [EXPERIMENTAL]"
sort_rank: 4
---

# Prometheus Remote-Write Specification

* Version: 2.0-rc.3
* Status: **Experimental**
* Date: May 2024

The Remote-Write specification, in general, is intended to document the standard for how Prometheus and Prometheus Remote-Write compatible senders send data to Prometheus or Prometheus Remote-Write compatible receivers.

This document is intended to define a second version of the [Prometheus Remote-Write](./remote_write_spec.md) API with minor changes to protocol and semantics. This second version adds a new Protobuf Message with new features enabling more use cases and wider adoption on top of performance and cost savings. The second version also deprecates the previous Protobuf Message from a [1.0 Remote-Write specification](/docs/specs/remote_write_spec/#protocol) and adds mandatory [`X-Prometheus-Remote-Write-*-Written` HTTP response headers](#required-written-response-headers)for reliability purposes. Finally, this spec outlines how to implement backwards-compatible senders and receivers (even under a single endpoint) using existing basic content negotiation request headers. More advanced, automatic content negotiation mechanisms might come in a future minor version if needed. For the rationales behind the 2.0 specification, see [the formal proposal](https://github.com/prometheus/proposals/pull/35).

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED",  "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119).

> NOTE: This is a release candidate for Remote-Write 2.0 specification. This means that this specification is currently in an experimental state--no major changes are expected, but we reserve the right to break the compatibility if it's necessary, based on the early adopters' feedback. The potential feedback, questions and suggestions should be added as comments to the [PR with the open proposal](https://github.com/prometheus/proposals/pull/35).

## Introduction

### Background

The Remote-Write protocol is designed to make it possible to reliably propagate samples in real-time from a sender to a receiver, without loss.

<!---
For the detailed rationales behind each 2.0 Remote-Write decision, see: https://github.com/prometheus/proposals/blob/alexg/remote-write-20-proposal/proposals/2024-04-09_remote-write-20.md
-->
The Remote-Write protocol is designed to be stateless; there is strictly no inter-message communication. As such the protocol is not considered "streaming". To achieve a streaming effect multiple messages should be sent over the same connection using e.g. HTTP/1.1 or HTTP/2. "Fancy" technologies such as gRPC were considered, but at the time were not widely adopted, and it was challenging to expose gRPC services to the internet behind load balancers such as an AWS EC2 ELB.

The Remote-Write protocol contains opportunities for batching, e.g. sending multiple samples for different series in a single request. It is not expected that multiple samples for the same series will be commonly sent in the same request, although there is support for this in the Protobuf Message.

A test suite can be found at https://github.com/prometheus/compliance/tree/main/remote_write_sender. The compliance tests for remote write 2.0 compatibility are still [in progress](https://github.com/prometheus/compliance/issues/101).

### Glossary

In this document, the following definitions are followed:

* `Remote-Write` is the name of this Prometheus protocol.
* a `Protocol` is a communication specification that enables the client and server to transfer metrics.
* a `Protobuf Message` (or Proto Message) refers to the [content type](https://www.rfc-editor.org/rfc/rfc9110.html#name-content-type) definition of the data structure for this Protocol. Since the specification uses [Google Protocol Buffers ("protobuf")](https://protobuf.dev/) exclusively, the schema is defined in a ["proto" file](https://protobuf.dev/programming-guides/proto3/) and represented by a single Protobuf ["message"](https://protobuf.dev/programming-guides/proto3/#simple).
* a `Wire Format` is the format of the data as it travels on the wire (i.e. in a network). In the case of Remote-Write, this is always the compressed binary protobuf format.
* a `Sender` is something that sends Remote-Write data.
* a `Receiver` is something that receives (writes) Remote-Write data. The meaning of `Written` is up to the Receiver e.g. usually it means storing received data in a database, but also just validating, splitting or enhancing it.
* `Written` refers to data the `Receiver` has received and is accepting. Whether or not it has ingested this data to persistent storage, written it to a WAL, etc. is up to the `Receiver`. The only distinction is that the `Receiver` has accepted this data rather than explicitly rejecting it with an error response.
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
The protobuf serialization MUST use either of the following Protobuf Messages:

* The `prometheus.WriteRequest` introduced in [the Remote-Write 1.0 specification](./remote_write_spec.md#protocol). As of 2.0, this message is deprecated. It SHOULD be used only for compatibility reasons. Senders and Receivers MAY NOT support the `prometheus.WriteRequest`.
* The `io.prometheus.write.v2.Request` introduced in this specification and defined [below](#protobuf-message). Senders and Receivers SHOULD use this message when possible. Senders and Receivers MUST support the `io.prometheus.write.v2.Request`.

Protobuf Message MUST use binary Wire Format. Then, MUST be compressed with [Google’s Snappy](https://github.com/google/snappy). Snappy's [block format](https://github.com/google/snappy/blob/2c94e11145f0b7b184b831577c93e5a41c4c0346/format_description.txt) MUST be used -- [the framed format](https://github.com/google/snappy/blob/2c94e11145f0b7b184b831577c93e5a41c4c0346/framing_format.txt) MUST NOT be used.

Senders MUST send a serialized and compressed Protobuf Message in the body of an HTTP POST request and send it to the Receiver via HTTP at the provided URL path. Receivers MAY specify any HTTP URL path to receive metrics.

<!---
Rationales: https://github.com/prometheus/proposals/blob/alexg/remote-write-20-proposal/proposals/2024-04-09_remote-write-20.md#basic-content-negotiation-built-on-what-we-have
-->
Senders MUST send the following reserved headers with the HTTP request:

- `Content-Encoding`
- `Content-Type`
- `X-Prometheus-Remote-Write-Version`
- `User-Agent`

Senders MAY allow users to add custom HTTP headers; they MUST NOT allow users to configure them in such a way as to send reserved headers.

#### Content-Encoding

```
Content-Encoding: <compression>
```

<!---
Rationales: https://github.com/prometheus/proposals/blob/alexg/remote-write-20-proposal/proposals/2024-04-09_remote-write-20.md#no-new-compression-added--yet-
-->
Content encoding request header MUST follow [the RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-content-encoding). Senders MUST use the `snappy` value. Receivers MUST support `snappy` compression. New, optional compression algorithms might come in 2.x or beyond.

#### Content-Type

```
Content-Type: application/x-protobuf
Content-Type: application/x-protobuf;proto=<fully qualified name>
```

Content type request header MUST follow [the RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-content-type). Senders MUST use `application/x-protobuf` as the only media type. Senders MAY add `;proto=` parameter to the header's value to indicate the fully qualified name of the Protobuf Message that was used, from the two mentioned above. As a result, Senders MUST send any of the three supported header values:

For the deprecated message introduced in PRW 1.0, identified by `prometheus.WriteRequest`:

* `Content-Type: application/x-protobuf`
* `Content-Type: application/x-protobuf;proto=prometheus.WriteRequest`

For the message introduced in PRW 2.0, identified by `io.prometheus.write.v2.Request`:

* `Content-Type: application/x-protobuf;proto=io.prometheus.write.v2.Request`

When talking to 1.x Receivers, Senders SHOULD use `Content-Type: application/x-protobuf` for backward compatibility. Otherwise, Senders SHOULD use `Content-Type: application/x-protobuf;proto=io.prometheus.write.v2.Request`. More Protobuf Messages might come in 2.x or beyond.

Receivers MUST use the content type header to identify the Protobuf Message schema to use. Accidental wrong schema choices may result in non-deterministic behaviour (e.g. corruptions).

> NOTE: Thanks to reserved fields in [`io.prometheus.write.v2.Request`](#protobuf-message), Receiver accidental use of wrong schema with `prometheus.WriteRequest` will result in empty message. This is generally for convenience to avoid surprising errors, but don't rely on it -- future Protobuf Messages might not have this feature.

#### X-Prometheus-Remote-Write-Version

```
X-Prometheus-Remote-Write-Version: <Remote-Write spec major and minor version>
```

When talking to 1.x Receivers, Senders MUST use `X-Prometheus-Remote-Write-Version: 0.1.0` for backward compatibility. Otherwise, Senders SHOULD use the newest Remote-Write version it is compatible with e.g. `X-Prometheus-Remote-Write-Version: 2.0.0`.

#### User-Agent

```
User-Agent: <name & version of the Sender>
```

Senders MUST include a user agent header that SHOULD follow [the RFC 9110 User-Agent header format](https://www.rfc-editor.org/rfc/rfc9110.html#name-user-agent).

### Response

Receivers that written all data successfully MUST return a [success 2xx HTTP status code](https://www.rfc-editor.org/rfc/rfc9110.html#name-successful-2xx). In such a successful case, the response body from the Receiver SHOULD be empty and the status code SHOULD be [204 HTTP No Content](https://www.rfc-editor.org/rfc/rfc9110.html#name-204-no-content); Senders MUST ignore the response body. The response body is RESERVED for future use.

Receivers MUST NOT return a 2xx HTTP status code if any of the pieces of sent data known to the Receiver (e.g. Samples, Histograms, Exemplars) were NOT written successfully (both [partial write](#partial-write) or full write rejection). In such a case, the Receiver MUST provide a human-readable error message in the response body. The Receiver's error SHOULD contain information about the amount of the samples being rejected and for what reasons. Senders MUST NOT try and interpret the error message and SHOULD log it as is.

The following subsections specify Sender and Receiver semantics around headers and different write error cases.

#### Required `Written` Response Headers

<!---
Rationales: https://github.com/prometheus/prometheus/issues/14359
-->
Upon a successful content negotiation, Receivers process (write) the received batch of data. Once completed (with success or failure) for each important piece of data (currently Samples, Histograms and Exemplars) Receivers MUST send a dedicated HTTP `X-Prometheus-Remote-Write-*-Written` response header with the precise number of successfully written elements.

Each header value MUST be a single 64-bit integer. The header names MUST be as follows:

```
X-Prometheus-Remote-Write-Samples-Written <count of all successfully written Samples>
X-Prometheus-Remote-Write-Histograms-Written <count of all successfully written Histogram samples>
X-Prometheus-Remote-Write-Exemplars-Written <count of all successfully written Exemplars>
```

Upon receiving a 2xx or a 4xx status code, Senders CAN assume that any missing `X-Prometheus-Remote-Write-*-Written` response header means no element from this category (e.g. Sample) was written by the Receiver (count of `0`). Senders MUST NOT assume the same when using the deprecated `prometheus.WriteRequest` Protobuf Message due to the risk of hitting 1.0 Receiver without this feature.

Senders MAY use those headers to confirm which parts of data were successfully written by the Receiver. Common use cases:

* Better handling of the [Partial Write](#partial-write) failure situations: Senders MAY use those headers for more accurate client instrumentation and error handling.
* Detecting broken 1.0 Receiver implementations: Senders SHOULD assume [415 HTTP Unsupported Media Type](https://www.rfc-editor.org/rfc/rfc9110.html#name-415-unsupported-media-type) status code when sending the data using `io.prometheus.write.v2.Request` request and receiving 2xx HTTP status code, but none of the `X-Prometheus-Remote-Write-*-Written` response headers from the Receiver. This is a common issue for the 1.0 Receivers that do not check the `Content-Type` request header; accidental decoding of the `io.prometheus.write.v2.Request` payload with `prometheus.WriteRequest` schema results in empty result and no decoding errors.
* Detecting other broken implementations or issues: Senders MAY use those headers to detect broken Sender and Receiver implementations or other problems.

Senders MUST NOT assume what Remote Write specification version the Receiver implements from the remote write response headers.

More (optional) headers might come in the future, e.g. when more entities or fields are added and worth confirming.

#### Partial Write

<!---
Rationales: https://github.com/prometheus/proposals/blob/alexg/remote-write-20-proposal/proposals/2024-04-09_remote-write-20.md#partial-writes
-->
Senders SHOULD use Remote-Write to send samples for multiple series in a single request. As a result, Receivers MAY write valid samples within a write request that also contains some invalid or otherwise unwritten samples, which represents a partial write case. In such a case, the Receiver MUST return non-2xx status code following the [Invalid Samples](#invalid-samples) and [Retry on Partial Writes](#retries-on-partial-writes) sections.

#### Unsupported Request Content

Receivers MUST return [415 HTTP Unsupported Media Type](https://www.rfc-editor.org/rfc/rfc9110.html#name-415-unsupported-media-type) status code if they don't support a given content type or encoding provided by Senders.

Senders SHOULD expect [400 HTTP Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) for the above reasons from 1.x Receivers, for backwards compatibility.

#### Invalid Samples

Receivers MAY NOT support certain metric types or samples (e.g. a Receiver might reject sample without metadata type specified or without created timestamp, while another Receiver might accept such sample.). It’s up to the Receiver what sample is invalid. Receivers MUST return a [400 HTTP Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) status code for write requests that contain any invalid samples unless the [partial retriable write](#retries-on-partial-writes) occurs.

Senders MUST NOT retry on a 4xx HTTP status codes (other than [429](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)), which MUST be used by Receivers to indicate that the write operation will never be able to succeed and should not be retried. Senders MAY retry on the 415 HTTP status code with a different content type or encoding to see if the Receiver supports it.

### Retries & Backoff

Receivers MAY return a [429 HTTP Too Many Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429) status code to indicate the overloaded server situation. Receivers MAY return [the Retry-After](https://www.rfc-editor.org/rfc/rfc9110.html#name-retry-after) header to indicate the time for the next write attempt. Receivers MAY return a 5xx HTTP status code to represent internal server errors.

Senders MAY retry on a 429 HTTP status code. Senders MUST retry write requests on 5xx HTTP. Senders MUST use a backoff algorithm to prevent overwhelming the server. Senders MAY handle [the Retry-After response header](https://www.rfc-editor.org/rfc/rfc9110.html#name-retry-after) to estimate the next retry time.

The difference between 429 vs 5xx handling is due to the potential situation of a Sender “falling behind” when the Receiver cannot keep up with the request volume, or the Receiver choosing to rate limit the Sender to protect its availability. As a result, Senders has the option to NOT retry on 429, which allows progress to be made when there are Sender side errors (e.g. too much traffic), while the data is not lost when there are Receiver side errors (5xx).

#### Retries on Partial Writes

Receivers MAY return a 5xx HTTP or 429 HTTP status code on partial write or [partial invalid sample cases](#partial-write) when it expects Senders to retry the whole request. In that case, the Receiver MUST support idempotency as Senders MAY retry with the same request.

### Backward and Forward Compatibility

The protocol follows [semantic versioning 2.0](https://semver.org/): any 2.x compatible Receiver MUST be able to read any 2.x compatible Senders and vice versa. Breaking or backwards incompatible changes will result in a 3.x version of the spec.

The Protobuf Messages (in Wire Format) themselves are forward / backward compatible, in some respects:

* Removing fields from the Protobuf Message requires a major version bump.
* Adding (optional) fields can be done in a minor version bump.

In other words, this means that future minor versions of 2.x MAY add new optional fields to `io.prometheus.write.v2.Request`, new compressions, Protobuf Messages and negotiation mechanisms, as long as they are backwards compatible (e.g. optional to both Receiver and Sender).

#### 2.x vs 1.x Compatibility

The 2.x protocol is breaking compatibility with 1.x by introducing a new, mandatory `io.prometheus.write.v2.Request` Protobuf Message and deprecating the `prometheus.WriteRequest`.

2.x Senders MAY support 1.x Receivers by allowing users to configure what content type Senders should use. 2.x Senders also MAY automatically fall back to different content types, if the Receiver returns 415 HTTP status code.

## Protobuf Message

### `io.prometheus.write.v2.Request`

The `io.prometheus.write.v2.Request` references the new Protobuf Message that's meant to replace and deprecate the Remote-Write 1.0's `prometheus.WriteRequest` message.

<!---
TODO(bwplotka): Move link to the one on Prometheus main or even buf.
-->
The full schema and source of the truth is in Prometheus repository in [`prompb/io/prometheus/write/v2/types.proto`](https://github.com/prometheus/prometheus/blob/remote-write-2.0/prompb/io/prometheus/write/v2/types.proto#L32). The `gogo` dependency and options CAN be ignored ([will be removed eventually](https://github.com/prometheus/prometheus/issues/11908)). They are not part of the specification as they don't impact the serialized format.

The simplified version of the new `io.prometheus.write.v2.Request` is presented below.

```
// Request represents a request to write the given timeseries to a remote destination.
message Request {
  // Since Request supersedes 1.0 spec's prometheus.WriteRequest, we reserve the top-down message
  // for the deterministic interop between those two.
  // Generally it's not needed, because Receivers must use the Content-Type header, but we want to
  // be sympathetic to adopters with mistaken implementations and have deterministic error (empty
  // message if you use the wrong proto schema).
  reserved 1 to 3;

  // symbols contains a de-duplicated array of string elements used for various
  // items in a Request message, like labels and metadata items. For the sender's convenience
  // around empty values for optional fields like unit_ref, symbols array MUST start with
  // empty string.
  //
  // To decode each of the symbolized strings, referenced, by "ref(s)" suffix, you
  // need to lookup the actual string by index from symbols array. The order of
  // strings is up to the sender. The receiver should not assume any particular encoding.
  repeated string symbols = 4;
  // timeseries represents an array of distinct series with 0 or more samples.
  repeated TimeSeries timeseries = 5;
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
  // write such samples within the Request.
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
  // timestamp represents the timestamp of the exemplar in ms.
  // For Go, see github.com/prometheus/prometheus/model/timestamp/timestamp.go
  // for conversion from/to time.Time to Prometheus timestamp.
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
* `metadata` sub-fields SHOULD be provided. Receivers MAY reject series with unspecified `Metadata.type`.
* Exemplars SHOULD be provided if they exist for a series.
* `created_timestamp` SHOULD be provided for metrics that follow counter semantics (e.g. counters and histograms). Receivers MAY reject those series without `created_timestamp` being set.

The following subsections define some schema elements in detail.

#### Symbols

<!---
Rationales: https://github.com/prometheus/proposals/blob/alexg/remote-write-20-proposal/proposals/2024-04-09_remote-write-20.md#partial-writes#string-interning
-->
The `io.prometheus.write.v2.Request` Protobuf Message is designed to [intern all strings](https://en.wikipedia.org/wiki/String_interning) for the proven additional compression and memory efficiency gains on top of the standard compressions.

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

Receivers also MAY impose limits on the number and length of labels, but this is receiver-specific and is out of the scope of this document.

#### Samples and Histogram Samples

<!---
Rationales: https://github.com/prometheus/proposals/blob/alexg/remote-write-20-proposal/proposals/2024-04-09_remote-write-20.md#partial-writes#native-histograms
-->
Senders MUST send `samples` (or `histograms`) for any given `TimeSeries` in timestamp order. Senders MAY send multiple requests for different series in parallel.

<!---
Rationales: https://github.com/prometheus/proposals/blob/alexg/remote-write-20-proposal/proposals/2024-04-09_remote-write-20.md#partial-writes#being-pull-vs-push-agnostic
-->
Senders SHOULD send stale markers when a time series will no longer be appended to.
Senders MUST send stale markers if the discontinuation of time series is possible to detect, for example:

* For series that were pulled (scraped), unless explicit timestamp was used.
* For series that is resulted by a recording rule evaluation.

Generally, not sending stale markers for series that are discontinued can lead to the Receiver [non-trivial query time alignment issues](https://prometheus.io/docs/prometheus/latest/querying/basics/#staleness).

Stale markers MUST be signalled by the special NaN value `0x7ff0000000000002`. This value MUST NOT be used otherwise.

Typically, Senders can detect when a time series will no longer be appended using the following techniques:

1. Detecting, using service discovery, that the target exposing the series has gone away.
1. Noticing the target is no longer exposing the time series between successive scrapes.
1. Failing to scrape the target that originally exposed a time series.
1. Tracking configuration and evaluation for recording and alerting rules.
1. Tracking discontinuation of metrics for non-scrape source of metric (e.g. in k6 when the benchmark has finished for series per benchmark, it could emit a stale marker).

#### Metadata

Metadata SHOULD follow the official Prometheus guidelines for [Type](https://prometheus.io/docs/instrumenting/writing_exporters/#types) and [Help](https://prometheus.io/docs/instrumenting/writing_exporters/#help-strings).

Metadata MAY follow the official OpenMetrics guidelines for [Unit](https://github.com/prometheus/OpenMetrics/blob/v1.0.0/specification/OpenMetrics.md#unit).

#### Exemplars

Each exemplar, if attached to a `TimeSeries`:

* MUST contain a value.

<!---
Rationales: https://github.com/prometheus/proposals/blob/alexg/remote-write-20-proposal/proposals/2024-04-09_remote-write-20.md#partial-writes#exemplars
-->
* MAY contain labels e.g. referencing trace or request ID. If the exemplar references a trace it SHOULD use the `trace_id` label name, as a best practice.
* MUST contain a timestamp. While exemplar timestamps are optional in Prometheus/Open Metrics exposition formats, the assumption is that a timestamp is assigned at scrape time in the same way a timestamp is assigned to the scrape sample. Receivers require exemplar timestamps to reliably handle (e.g. deduplicate) incoming exemplars.

## Out of Scope

The same as in [1.0](./remote_write_spec.md#out-of-scope).

## Future Plans

This section contains speculative plans that are not considered part of protocol specification yet but are mentioned here for completeness. Note that 2.0 specification completed [2 of 3 future plans in the 1.0](./remote_write_spec.md#future-plans).

* **Transactionality** There is still no transactionality defined for 2.0 specification, mostly because it makes a scalable Sender implementation difficult. Prometheus Sender aims at being "transactional" - i.e. to never expose a partially scraped target to a query. We intend to do the same with Remote-Write -- for instance, in the future we would like to "align" Remote-Write with scrapes, perhaps such that all the samples, metadata and exemplars for a single scrape are sent in a single Remote-Write request.

  However, Remote-Write 2.0 specification solves an important transactionality problem for [the classic histogram buckets](https://docs.google.com/document/d/1mpcSWH1B82q-BtJza-eJ8xMLlKt6EJ9oFGH325vtY1Q/edit#heading=h.ueg7q07wymku). This is done thanks to the native histograms supporting custom bucket-ing possible with the `io.prometheus.write.v2.Request` wire format. Senders might translate all classic histograms to native histograms this way, but it's out of this specification to mandate this. However, for this reason, Receivers MAY ignore certain metric types (e.g. classic histograms).

* **Alternative wire formats**. The OpenTelemetry community has shown the validity of Apache Arrow (and potentially other columnar formats) for over-wire data transfer with their OTLP protocol. We would like to do experiments to confirm the compatibility of a similar format with Prometheus’ data model and include benchmarks of any resource usage changes. We would potentially maintain both a protobuf and columnar format long term for compatibility reasons and use our content negotiation to add different Protobuf Messages for this purpose.

* **Global symbols**. Pre-defined string dictionary for interning The protocol could pre-define a static dictionary of ref->symbol that includes strings that are considered common, e.g. “namespace”, “le”, “job”, “seconds”, “bytes”, etc. Senders could refer to these without the need to include them in the request’s symbols table. This dictionary could incrementally grow with minor version releases of this protocol.

## Related

### FAQ

**Why did you not use gRPC?**
Because the 1.0 protocol does not use gRPC, breaking it would increase friction in the adoption. See 1.0 [reason](./remote_write_spec.md#faq).

**Why not stream protobuf messages?**
If you use persistent HTTP/1.1 connections, they are pretty close to streaming. Of course, headers have to be re-sent, but that is less expensive than a new TCP set up.

**Why do we send samples in order?**
The in-order constraint comes from the encoding we use for time series data in Prometheus, the implementation of which is optimized for append-only workloads. However, this requirement is also shared across many other databases and vendors in the ecosystem. In fact, [Prometheus with OOO feature enabled](https://youtu.be/qYsycK3nTSQ?t=1321), allows out-of-order writes, but with the performance penalty, thus reserved for rare events. To sum up, Receivers may support out-of-order write, though it is not permitted by the specification. In the future e.g. 2.x spec versions, we could extend content type to negotiate the out-of-order writes, if needed.

**How can we parallelise requests with the in-order constraint?**
Samples must be in-order _for a given series_. However, even if a Receiver does not support out-of-order write, the Remote-Write requests can be sent in parallel as long as they are for different series. Prometheus shards the samples by their labels into separate queues, and then writes happen sequentially in each queue. This guarantees samples for the same series are delivered in order, but samples for different series are sent in parallel - and potentially "out of order" between different series.

**What are the differences between Remote-Write 2.0 and OpenTelemetry's OTLP protocol?**
[OpenTelemetry OTLP](https://github.com/open-telemetry/opentelemetry-proto/blob/a05597bff803d3d9405fcdd1e1fb1f42bed4eb7a/docs/specification.md) is a protocol for transporting of telemetry data (such as metrics, logs, traces and profiles) between telemetry sources, intermediate nodes and telemetry backends. The recommended transport involves gRPC with protobuf, but HTTP with protobuf or JSON are also described. It was designed from scratch with the intent to support a variety of different observability signals, data types and extra information. For [metrics](https://github.com/open-telemetry/opentelemetry-proto/blob/main/opentelemetry/proto/metrics/v1/metrics.proto) that means additional non-identifying labels, flags, temporal aggregations types, resource or scoped metrics, schema URLs and more. OTLP also requires [the semantic convention](https://opentelemetry.io/docs/concepts/semantic-conventions/) to be used.

Remote-Write was designed for simplicity, efficiency and organic growth. The first version was officially released in 2023, when already [dozens of battle-tested adopters in the CNCF ecosystem](./remote_write_spec.md#compatible-senders-and-receivers) had been using this protocol for years. Remote-Write 2.0 iterates on the previous protocol by adding a few new elements (metadata, exemplars, created timestamp and native histograms) and string interning. Remote-Write 2.0 is always stateless, focuses only on metrics and is opinionated; as such it is scoped down to elements that the Prometheus community considers enough to have a robust metric solution. The intention is to ensure the Remote-Write is a stable protocol that is cheaper and simpler to adopt and use than the alternatives in the observability ecosystem.
