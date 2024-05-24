---
title: Prometheus Remote-Write Specification 2.0
sort_rank: 4
---

# Prometheus Remote-Write Specification

* Version: 2.0
* Status: Proposed
* Date: May 2024

The remote write specification, in general, is intended to document the standard for how Prometheus and Prometheus remote-write-compatible agents send data to a Prometheus or Prometheus remote-write compatible receivers.

This document is intended to define a second version of the [Prometheus Remote Write](./remote_write_spec.md) API with minor changes to protocol and semantics. This second version also adds a new wire format with new features enabling more use cases and wider adoption on top of performance and cost savings. Finally, this spec outlines how to implement backward compatible senders and receivers (even under a single endpoint) using existing basic content negotiation request headers. More advanced, automatic content negotiation mechanisms might come in future versions, if needed. For the rationales behind the 2.0 specification, see [the formal proposal](https://github.com/prometheus/proposals/pull/35).

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED",  "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119).

## Introduction

### Background

The remote write protocol is designed to make it possible to reliably propagate samples in real-time from a sender to a receiver, without loss.

The remote write protocol is designed to make stateless implementations of the server possible; as such there are little-to-no inter-message references.  As such the protocol is not considered "streaming." To achieve a streaming effect multiple messages should be sent over the same connection using e.g. HTTP/1.1 or HTTP/2. "Fancy" technologies such as gRPC were considered, but at the time were not widely adopted, and it was challenging to expose gRPC services to the internet behind load balancers such as an AWS EC2 ELB.

The remote write protocol contains opportunities for batching, e.g. sending multiple samples for different series in a single request. It is not expected that multiple samples for the same series will be commonly sent in the same request, although there is support for this in the protocol.

A test suite can be found at https://github.com/prometheus/compliance/tree/main/remote_write_sender. The test's 2.0 compatibility [is in progress](https://github.com/prometheus/compliance/issues/101).

### Glossary

For the purposes of this document the following definitions MUST be followed:

* a "Sender" is something that sends Prometheus Remote Write data.
* a "Receiver" is something that receives Prometheus Remote Write data.
* a "Sample" is a pair of (timestamp, value).
* a "Histogram" is a pair of (timestamp, [histogram value](https://github.com/prometheus/docs/blob/b9657b5f5b264b81add39f6db2f1df36faf03efe/content/docs/concepts/native_histograms.md)).
* a "Label" is a pair of (key, value).
* a "Series" is a list of samples, identified by a unique set of labels.

## Definitions

### Protocol

The Remote Write Protocol MUST consist of RPCs with the request body encoded using a Google Protobuf 3 message and then compressed.

The protobuf encoding MUST use either of the following schemas: 

* [`prometheus.WriteRequest`](./remote_write_spec.md#protocol) introduced in the Remote Write 1.0 specification. As of 2.0 the `prometheus.WriteRequest` message is deprecated. It SHOULD be used only for compatibility reasons. Sender and Receiver MAY NOT support `prometheus.WriteRequest`.
* `io.prometheus.write.v2.Request` introduced in this specification and defined [below](#ioprometheuswritev2request-proto-schema). Senders and Receivers SHOULD use `io.prometheus.write.v2.Request` when possible. Sender and Receiver MUST support `io.prometheus.write.v2.Request`.

The encoded message MUST be compressed with [Google’s Snappy](https://github.com/google/snappy). The block format MUST be used -- the framed format MUST NOT be used.

Sender MUST send encoded and compressed proto message in the body of an HTTP POST request and send it to the Receiver via HTTP at a provided URL path. The Receiver MAY specify any HTTP URL path to receive metrics.

Sender MUST send the following reserved headers with the HTTP request:

* `Content-Encoding: <compression>`

  Content encoding request header MUST follow [the RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-content-encoding). Sender MUST use the `snappy` value. Receiver MUST support `snappy` compression. New, optional compression algorithms might come in 2.x or beyond.

* `Content-Type: application/x-protobuf` or `Content-Type: application/x-protobuf;proto=<fully qualified name>`

  Content type request header MUST follow [the RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-content-type). Sender MUST use `application/x-protobuf` as the only media type. Sender MAY add `;proto=` parameter to the header's value to indicate the fully qualified name of the protobuf message (schema) that was used, from the two mentioned above. As a result, Sender MUST send any of the three supported header values:

  For the deprecated message introduced in PRW 1.0, identified by `prometheus.WriteRequest`:
    * `Content-Type: application/x-protobuf`
    * `Content-Type: application/x-protobuf;proto=prometheus.WriteRequest`
  For the message introduced in PRW 2.0, identified by `io.prometheus.write.v2.Request`:
    * `Content-Type: application/x-protobuf;proto=io.prometheus.write.v2.Request`
  
  When talking to 1.x Receiver, the Sender SHOULD use `Content-Type: application/x-protobuf` for backward compatibility. Otherwise, Sender SHOULD use `Content-Type: application/x-protobuf;proto=io.prometheus.write.v2.Request`. More proto messages might come in 2.x or beyond.

* `User-Agent: <name & version of the sender>`
* `X-Prometheus-Remote-Write-Version: <remote write spec major and minor version>`

  When talking to 1.x Receiver, the Sender MUST use `X-Prometheus-Remote-Write-Version: 0.1.0` for backward compatibility. Otherwise, Sender SHOULD use the newest remote write version it is compatible with e.g. `X-Prometheus-Remote-Write-Version: 2.0.0`.

Sender MAY allow users to add custom HTTP headers; they MUST NOT allow users to configure them in such a way as to send reserved headers.

### Response

Receiver ingesting all samples successfully MUST return HTTP 200 status code. In such a successful case, the response body from the Receiver SHOULD be empty; Sender MUST ignore the response body. The response body is RESERVED for future use.

The following subsections specify Sender and Receiver semantics around write errors.

#### Partial Write

Sender SHOULD use Prometheus Remote Write to send samples for multiple series in a single request. As a result, Receiver MAY ingest valid samples within a write request that contains invalid or otherwise unwritten samples, which represents a partial write case.

In a partial write case, Receiver MUST NOT return HTTP 200 status code. Receiver MUST provide a human-readable error message in the response body. The Receiver's error SHOULD contain information about the amount of the samples being rejected and for what reasons.

Sender MUST NOT try and interpret the error message, and SHOULD log it as is.

#### Unsupported Request Content

Receiver MUST return [415 HTTP Unsupported Media Type](https://www.rfc-editor.org/rfc/rfc9110.html#name-415-unsupported-media-type) status code if they don't support a given content type or encoding provided by the Sender.

Sender SHOULD expect [400 HTTP Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) for the above reasons from the 1.x Receiver, for backward compatibility.

#### Invalid Samples

Receiver MAY NOT support certain metric types or samples (e.g. Receiver might reject sample without metadata type specified or without created timestamp, while another Receiver might accept such sample.). It’s up to the Receiver what sample is invalid. Receiver MUST return a [400 HTTP Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) status code for write requests that contain any invalid samples, unless the [partial retryable write](#retries-on-partial-writes) occurs.

Sender MUST NOT retry on 4xx HTTP (other than [429](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)) status codes, which MUST be used by Receiver to indicate that the write will never be able to succeed and should not be retried. Sender MAY retry on 415 HTTP status code with a different content-type or encoding to see if Receiver supports it.

### Retries & Backoff

Receiver MAY return a [429 HTTP Too Many Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429) status code to indicate the overloaded server situation. Receiver MAY return [the Retry-After](https://www.rfc-editor.org/rfc/rfc9110.html#name-retry-after) header to indicate the time for the next write attempt. Receiver MAY return a 5xx HTTP status code to represent internal server errors, that should be retried.

Sender MAY retry on 429 HTTP status code. Sender MUST retry write requests on 5xx HTTP. Sender MUST use a backoff algorithm to prevent overwhelming the server. Sender MAY handle [the Retry-After response header](https://www.rfc-editor.org/rfc/rfc9110.html#name-retry-after) to estimate the next retry time.

The difference between 429 vs 5xx handling is due to a potential situation for the Sender “falling behind” if the Receiver cannot keep up. As a result, the ability to NOT retry on 429 allows progress is made when there are Sender side errors (e.g. too much traffic), while the data is not lost when there are Receiver side errors.

### Retries on Partial Writes

Receiver MAY return a 5xx HTTP or 429 HTTP status code on partial write or [partial invalid sample cases](#partial-write), when it expects Sender to retry the whole request. In that case Receiver MUST support idempotency as sender MAY retry with the same request.

### Backward and Forward Compatibility

The protocol follows [semantic versioning 2.0](https://semver.org/): any 2.x compatible Receiver MUST be able to read any 2.x compatible Sender and vice versa. Breaking or backwards incompatible changes will result in a 3.x version of the spec.

The proto formats itself are forward / backward compatible, in some respects:

* Removing fields from the proto requirements mean a major version bump.
* Adding (optional) fields will be a minor version bump.

In other words, this means that future minor versions of 2.x MAY add new optional fields to `io.prometheus.write.v2.Request`, new compressions, content types (wire formats) and negotiation mechanisms, as long as they are backward compatible (e.g. optional to both Receivers and Senders).

### 2.x vs 1.x Compatibility

The 2.x protocol is breaking compatibility with 1.x by introducing a new `io.prometheus.write.v2.Request` content type (wire format) and deprecating the `prometheus.WriteRequest`.

2.x Senders MAY support 1.x Receivers by allowing users to configure what content type sender should use. 2.x Senders also MAY automatically fall back to different content types, if the Receiver returns 415 HTTP status code.

#### `io.prometheus.write.v2.Request` Proto Schema

<!---
TODO(bwplotka): Move link to the one on Prometheus main or even buf. 
-->
The source of truth is [here](https://github.com/prometheus/prometheus/blob/remote-write-2.0/prompb/io/prometheus/write/v2/types.proto#L32). The `gogo` dependency and options CAN be ignored. They are not part of the specification as they don't impact the serialized format.

The simplified version of the new `io.prometheus.write.v2.Request` is presented below.

```
// Request represents a request to write the given timeseries to a remote destination.
message Request {
  // symbols contains a de-duplicated array of string elements used for various
  // items in a Request message, like labels and metadata items. For the sender convenience
  // around empty values for optional fields like unit_ref, symbols array MUST start with
  // empty string.
  //
  // To decode each of the symbolized strings, referenced, by "ref(s)" suffix, you
  // need to lookup the actual string by index from symbols array. The order of
  // strings is up to the sender. The receiver should not assume any particular encoding.
  repeated string symbols = 1;
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
  // (histogram field), but not both. For typical sender (real-time metric
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
  // metrics. Note that some receivers might require this and in return fail to
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

// Exemplar is an additional information attached to some series' samples.
message Exemplar {
  // labels_refs is a list of label name-value pair references, encoded
  // as indices to the Request.symbols array. This list's len is always
  // a multiple of 2, and the underlying labels should be sorted lexicographically.
  repeated uint32 labels_refs = 1;
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
  // For Go, see github.com/prometheus/prometheus/model/timestamp/timestamp.go
  // for conversion from/to time.Time to Prometheus timestamp.
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
  // text for the metric. Help is optional, reference should point to empty string in
  // such a case.
  uint32 help_ref = 3;
  // unit_ref is a reference to the Request.symbols array representing unit
  // for the metric. Unit is optional, reference should point to empty string in
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

* Label references MUST be provided.
* At least one element in Samples or in Histograms MUST be provided. For series which (rarely) would mix float and histogram samples, a separate `TimeSeries` message MUST be used.
* Metadata fields SHOULD be provided.
* Exemplars SHOULD be provided, if they exist for a series.
* Created timestamp SHOULD be provided for metrics that follow counter semantics (e.g. counters and histograms).

The following subsections define some schema elements in details.

#### Symbols

The `io.prometheus.write.v2.Request` proto schema is designed to [intern all strings](https://en.wikipedia.org/wiki/String_interning) for the proven additional compression and memory efficiency gains on top of the standard compressions.

Symbols table MUST be provided and it MUST contain deduplicated strings used in series, exemplar labels and metadata strings. The first element of symbols table MUST be an empty string. References MUST point to the existing index in the Symbols string array.

#### Series Labels

The complete set of labels MUST be sent with each Sample or Histogram sample. Additionally, the label set associated with samples:

* SHOULD contain a `__name__` label.
* MUST NOT contain repeated label names.
* MUST have label names sorted in lexicographical order.
* MUST NOT contain any empty label names or values.

Metric names, label names, and label values MUST be any sequence of UTF-8 characters.

Metric names SHOULD adhere to the regex `[a-zA-Z_:]([a-zA-Z0-9_:])*`.
Label names SHOULD adhere to the regex `[a-zA-Z_]([a-zA-Z0-9_])*`.

Names that does not adhere to the above, might be harder to use for PromQL users (see [the UTF-8 proposal for more details](https://github.com/prometheus/proposals/blob/main/proposals/2023-08-21-utf8.md)).

Label names beginning with "__" are RESERVED for system usage and SHOULD NOT be used, see [Prometheus Data Model](https://prometheus.io/docs/concepts/data_model/).

Receiver also MAY impose limits on the number and length of labels, but this is receiver-specific and is out of scope for this document.

#### Samples and Histogram Samples

Sender MUST send samples (or histogram samples) for any given TimeSeries in timestamp order. Sender MAY send multiple requests for different series in parallel.

Sender MUST send stale markers when a time series will no longer be appended to, for time series that were "scraped".

Stale markers MUST be signalled by the special NaN value `0x7ff0000000000002`. This value MUST NOT be used otherwise.

Typically, Sender can detect when a time series will no longer be appended to using the following techniques:

1. Detecting, using service discovery, that the target exposing the series has gone away
1. Noticing the target is no longer exposing the time series between successive scrapes
1. Failing to scrape the target that originally exposed a time series
1. Tracking configuration and evaluation for recording and alerting rules

#### Metadata

Metadata SHOULD follow the official Prometheus guidelines for:

* [Type](https://prometheus.io/docs/instrumenting/writing_exporters/#types)
* [Help](https://prometheus.io/docs/instrumenting/writing_exporters/#help-strings).

Metadata MAY follow the official OpenMetrics guidelines for:

* [Unit](https://github.com/OpenObservability/OpenMetrics/blob/main/specification/OpenMetrics.md#unit)

#### Exemplars

Each exemplar, if attached to a `TimeSeries`:

* MUST contain at least one label set, so two references to a symbols table.
* MUST contain value.
* MAY contain timestamp.

## Out of Scope

The same as in [1.0](./remote_write_spec.md#out-of-scope).

## Future Plans

This section contains speculative plans that are not considered part of protocol specification yet, but are mentioned here for completeness. Note that 2.0 specification completed [2 of 3 future plans in the 1.0](./remote_write_spec.md#future-plans).

* **Transactionality** There is still no transactionality defined for 2.0 specification, mostly because it makes scalable Sender implementation difficult. Prometheus Sender aims at being "transactional" - i.e. to never expose a partially scraped target to a query. We intend to do the same with remote write -- for instance, in the future we would like to "align" remote write with scrapes, perhaps such that all the samples, metadata and exemplars for a single scrape are sent in a single remote write request.

  However, Remote Write 2.0 specification solves an important transactionality problem for [the classic histogram buckets](https://docs.google.com/document/d/1mpcSWH1B82q-BtJza-eJ8xMLlKt6EJ9oFGH325vtY1Q/edit#heading=h.ueg7q07wymku). This is done thanks to the native histograms supporting custom bucket-ing possible with the `io.prometheus.write.v2.Request` wire format. Sender might translate all classic histograms to native histograms this way, but it's out of this specification to mandate this. However, for this reason Receiver MAY ignore certain metric types (e.g. classic histograms).

* **Alternative wire formats**. The OpenTelemetry community has shown the validity of Apache Arrow (and potentially other columnar formats) for over the wire data transfer with their OTLP protocol. We would like to do experiments to confirm the compatibility of a similar format with Prometheus’ data model, and include benchmarks of any resource usage changes. We would potentially maintain both a protobuf and columnar format long term for compatibility reasons and use our content negotiation to add different proto message for this purpose.

* **Global symbols**. Pre-defined string dictionary for interning The protocol could pre-define a static dictionary of ref->symbol that includes strings that are considered common, e.g. “namespace”, “le”, “job”, “seconds”, “bytes”, etc. Sender and refer to these without the need to include them in the request’s symbols table. This dictionary could incrementally grow with minor versions releases of the protocol.

## Related

### FAQ

**Why did you not use gRPC?**
Because 1.0 protocol is not using gRPC, breaking it would increase friction in the adoption. See 1.0 [reason](./remote_write_spec.md#faq).

**Why not streaming protobuf messages?**
If you use persistent HTTP/1.1 connections, they are pretty close to streaming. Of course headers have to be re-sent, but yes that is less expensive than a new TCP set up.

**Why do we send samples in order?**
The in-order constraint comes from the encoding we use for time series data in Prometheus, the implementation of which is append only. It is possible to remove this constraint, for instance by buffering samples and reordering them before encoding.

**How can we parallelise requests with the in-order constraint?**
Samples must be in-order _for a given series_. Remote write requests can be sent in parallel as long as they are for different series. In Prometheus, we shard the samples by their labels into separate queues, and then writes happen sequentially in each queue. This guarantees samples for the same series are delivered in order, but samples for different series are sent in parallel - and potentially "out of order" between different series.

**What are the differences between Remote Write 2.0 and OpenTelemetry's OTLP protocol?**
[OpenTelemetry OTLP](https://github.com/open-telemetry/opentelemetry-proto/blob/a05597bff803d3d9405fcdd1e1fb1f42bed4eb7a/docs/specification.md) is a protocol for transporting of telemetry data (such as metrics, logs, traces and profiles) between telemetry sources, intermediate nodes and telemetry backends. The recommended transport involves gRPC with protobuf, but HTTP with protobuf or JSON are also described. It was designed from scratch with the intent to support variety of different observability signals, data types and extra information. For [metrics](https://github.com/open-telemetry/opentelemetry-proto/blob/main/opentelemetry/proto/metrics/v1/metrics.proto) that means additional non-identifying labels, flags, temporal aggregations types, resource or scoped metrics, schema URLs and more. OTLP also requires [the semantic convention](https://opentelemetry.io/docs/concepts/semantic-conventions/) to be used.

Remote Write was designed for simplicity, efficiency and organic growth. First version was officially released in 2023, when already [dozens of battle-tested adopters in the CNCF ecosystem](./remote_write_spec.md#compatible-senders-and-receivers) were using it for years. Remote Write 2.0 iterates on the previous protocol by adding a few new elements (metadata, exemplars, created timestamp and native histograms) and string interning. Remote Write 2.0 is always stateless, focuses only on metrics and is opinionated -- it is scoped down to elements that by Prometheus community, is all you need to have robust metric solution. We believe Remote Write 2.0 proposes an export transport, for metrics, that is a magnitude simpler to adopt and use, and often more efficient than competitors.
