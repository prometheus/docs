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

<!---
TODO(bwplotka): Challenge last sentence (e.g. OTel coll usage)?
-->
The remote write protocol is not intended for use by applications to push metrics to Prometheus remote-write-compatible Receiver. It is intended that a Prometheus remote-write-compatible sender scrapes instrumented applications or exporters and sends remote write messages to a server.

<!---
TODO(bwplotka): Add support for 2.0 to those suites 
-->
A test suite can be found at https://github.com/prometheus/compliance/tree/main/remote_write_sender.

### Glossary

For the purposes of this document the following definitions MUST be followed:

* a "Sender" is something that sends Prometheus Remote Write data.
* a "Receiver" is something that receives Prometheus Remote Write data.
* a "Sample" is a pair of (timestamp, value).
* a "Histogram" is a pair of (timestamp, histogram value).
* a "Label" is a pair of (key, value).
* a "Series" is a list of samples, identified by a unique set of labels.

## Definitions

### Protocol

The Remote Write Protocol MUST consist of RPCs with the request body encoded using a Google Protobuf 3 message. The protobuf encoding MUST use either of the following schemas: 

<!---
TODO(bwplotka): Do we deprecate it?
-->
* [`prometheus.WriteRequest`](./remote_write_spec.md#protocol) introduced in the Remote Write 1.0 specification. As of 2.0 the `prometheus.WriteRequest` message is deprecated.
* `io.prometheus.write.v2.Request` introduced in this specification and defined [below](#ioprometheuswritev2request-proto-schema). Senders SHOULD use `io.prometheus.write.v2.Request` when possible.

Sender MUST send encoded and compresses proto message in the body of an HTTP POST request and send it to the Receiver via HTTP at a provided URL path. The Receiver MAY specify any HTTP URL path to receive metrics.

Sender MUST send the following "reserved" headers with the HTTP request:

* `Content-Encoding: <compression>`

  Content encoding request header MUST follow [the RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-content-encoding). Sender MUST use the `snappy` value. More compression algorithms might come in 2.x or beyond.

* `Content-Type: application/x-protobuf` or `Content-Type: application/x-protobuf;proto=<fully qualified name>`
  
  <!---
  TODO(bwplotka): The framing here is a bit inconsistent with deprecation policy. We can either mention sender MUST use either 1.0 or 2.0 message. Or we can say sender MUST use 2.0 message and it MAY/SHOULD use 1.0 message against 1.x receiver. What do we prefer?
  -->
  Content type request header MUST follow [the RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-content-type). Sender MUST use `application/x-protobuf` as the only media type. Sender MAY add `;proto=` parameter to the header's value to indicate the fully qualified name of the protobuf message (schema) that was used, from the two mentioned above. As a result, Sender MUST send any of the three supported header values:

  For the message introduced in PRW 1.0, identified by `prometheus.WriteRequest`:
    * `Content-Type: application/x-protobuf`
    * `Content-Type: application/x-protobuf;proto=prometheus.WriteRequest`
  For the message introduced in PRW 2.0, identified by `io.prometheus.write.v2.Request`:
    * `Content-Type: application/x-protobuf;proto=io.prometheus.write.v2.Request`
  
  Sender SHOULD use `Content-Type: application/x-protobuf`, for backward compatibility, when talking to 1.x Receiver. Sender SHOULD use `Content-Type: application/x-protobuf;proto=io.prometheus.write.v2.Request` when talking to Receiver supporting 2.x. More proto messages might come in 2.x or beyond.

* `User-Agent: <name & version of the sender>`
* `X-Prometheus-Remote-Write-Version: <remote write specificiation version the sender follows>`

  Sender SHOULD use `X-Prometheus-Remote-Write-Version: 0.1.0` for backward compatibility, when using 1.0 proto message.

Sender MAY allow users to send custom HTTP headers; they MUST NOT allow users to configure them in such a way as to send reserved headers.

<!---
TODO(bwplotka): Kind of repeated statement, feedback welcome how to structure it.
-->
The remote write request in the body of the HTTP POST MUST be compressed with [Google’s Snappy](https://github.com/google/snappy). The block format MUST be used -- the framed format MUST NOT be used. The remote write request MUST be encoded using Google Protobuf 3, and MUST use either of the schemas defined above. 

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
  // items in a Request message, like labels and metadata items. To decode
  // each of those items, referenced, by "ref(s)" suffix, you need to lookup the
  // actual string by index from symbols array. The order of strings is up to
  // the client, server should not assume any particular encoding.
  repeated string symbols = 1;
  // timeseries represents an array of distinct series with 0 or more samples.
  repeated TimeSeries timeseries = 2;
}

// TimeSeries represents a single series.
message TimeSeries {
  // labels_refs is a list of label name-value pair references, encoded
  // as indices to the Request.symbols array. This list's length is always
  // a multiple of two, and the underlying labels should be sorted.
  //
  // Note that there might be multiple TimeSeries objects in the same
  // Requests with the same labels e.g. for different exemplars, metadata
  // or created timestamp.
  repeated uint32 labels_refs = 1;

  // Timeseries messages can either specify samples or (native) histogram samples
  // (histogram field), but not both. For typical clients (real-time metric
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
  // metrics. Note that some servers might require this and in return fail to
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
  // a multiple of 2, and the underlying labels should be sorted.
  repeated uint32 labels_refs = 1;
  double value = 2;
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
    METRIC_TYPE_UNSPECIFIED        = 0;
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
  // text for the metric.
  uint32 help_ref = 3;
  // unit_ref is a reference to the Request.symbols array representing unit
  // for the metric.
  uint32 unit_ref = 4;
}

// A native histogram, also known as a sparse histogram.
message Histogram { ... }

// A BucketSpan defines a number of consecutive buckets with their
// offset.
message BucketSpan { ... }
```

All timestamps MUST be int64 counted as milliseconds since the Unix epoch. Sample's values MUST be float64.

For every `TimeSeries` message:

* Label references MUST be provided.
* At least one element in Samples or in Histograms MUST be provided. For series which (rarely) would mix float and histogram samples, a separate `TimeSeries` message MUST be used.
<!---
TODO(bwplotka): We have some inconsistency here. In gdoc we talked this should be SHOULD. But proto has it as MUST (?). What do we want at the end? What's wrong with MUST here?
-->
* Metadata MUST be provided.
* Exemplars SHOULD be provided, if they exist.
* Created timestamp SHOULD be provided for metrics that follow counter semantics (e.g. counters and histograms).

The following subsections define some schema elements in details.

#### Symbols

The `io.prometheus.write.v2.Request` proto schema is designed to [intern all strings](https://en.wikipedia.org/wiki/String_interning) for the proven additional compression and memory efficiency gains on top of the standard compressions.

Symbols table containing deduplicated strings used in series and exemplar labels, metadata strings MUST be provided. References MUST point to the existing index in the Symbols string array.

#### Series Labels

The complete set of labels MUST be sent with each Sample or Histogram sample. Additionally, the label set associated with samples:

- SHOULD contain a `__name__` label.
- MUST NOT contain repeated label names.
- MUST have label names sorted in lexicographical order.
- MUST NOT contain any empty label names or values.

Sender MUST only send valid metric names, label names, and label values:

<!---
TODO(bwplotka): Add mention for UTF-8 support going forward, see https://docs.google.com/document/d/1PljkX3YLLT-4f7MqrLt7XCVPG3IsjRREzYrUzBxCPV0/edit?disco=AAAA4gSqQ7g
-->
- Metric names MUST adhere to the regex `[a-zA-Z_:]([a-zA-Z0-9_:])*`.
- Label names MUST adhere to the regex `[a-zA-Z_]([a-zA-Z0-9_])*`.
- Label values MAY be any sequence of UTF-8 characters .

Receiver MAY impose limits on the number and length of labels, but this will be receiver-specific and is out of scope for this document.

Label names beginning with "__" are RESERVED for system usage and SHOULD NOT be used, see [Prometheus Data Model](https://prometheus.io/docs/concepts/data_model/).

#### Samples

<!---
TODO(bwplotka): Does this apply to histograms?
-->
Sender MUST send samples for any given TimeSeries in timestamp order. Sender MAY send multiple requests for different series in parallel.

Sender MUST send stale markers when a time series will no longer be appended to.

Stale markers MUST be signalled by the special NaN value `0x7ff0000000000002`. This value MUST NOT be used otherwise.

Typically, Sender can detect when a time series will no longer be appended to using the following techniques:

1. Detecting, using service discovery, that the target exposing the series has gone away
1. Noticing the target is no longer exposing the time series between successive scrapes
1. Failing to scrape the target that originally exposed a time series
1. Tracking configuration and evaluation for recording and alerting rules

#### Metadata

Metadata SHOULD follow the official guidelines for [TYPE](https://prometheus.io/docs/instrumenting/writing_exporters/#types) and [HELP](https://prometheus.io/docs/instrumenting/writing_exporters/#help-strings).

#### Exemplars

<!---
TODO(bwplotka): Anything to say here?
-->
TBD

#### Created Timestamp

<!---
TODO(bwplotka): TBD
-->
TBD

### Responses

Receiver ingesting all samples successfully MUST return HTTP 200 status code. In such a successful case, the response body from the Receiver SHOULD be empty; Sender MUST ignore the response body. The response body is RESERVED for future use.

The following subsections specify Sender and Receiver semantics around write errors.

#### Partial Write

Sender SHOULD use Prometheus Remote Write to request write of multiple samples, across multiple series. As a result, Receiver MAY ingest valid samples within a write request that contains invalid or otherwise unwritten samples, which represents a partial write case.

In a partial write case, Receiver MUST NOT return HTTP 200 status code. Receiver MUST provide a human-readable error message in the response body. Sender MUST NOT try and interpret the error message, and SHOULD log it as is.

#### Unsupported Request Content

Receiver MAY NOT support certain content types or encodings defined in [the Protocol section](#protocol). Receiver MUST return [415 HTTP Unsupported Media Type](https://www.rfc-editor.org/rfc/rfc9110.html#name-415-unsupported-media-type) status code if they don't support a given content type or encoding provided by the Sender.

Sender SHOULD expect [400 HTTP Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) for the above reasons from the 1.x Receiver, for backward compatibility.

<!---
TODO(bwplotka): Note sure if worth mentioning given we decided to not include auto negotiation logic in 2.0. I think I would delete it.
-->
Sender MAY retry write requests on 415 HTTP status code, with different content type and compression settings.

#### Invalid Samples

<!---
TODO(bwplotka): This wording assumes metadata is optional, which I think it should NOT be.
-->
Receiver MAY NOT support certain metric types or samples (e.g. Receiver might reject sample without metadata or without created timestamp, while another Receiver might accept such sample.). It’s up to the Receiver what sample is invalid. Receiver MUST return a [400 HTTP Bad Request](https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request) status code for write requests that contain any invalid samples, unless the [partial retryable write](#retries-on-partial-writes) occurs.

Sender MUST NOT retry on 4xx HTTP (other than 429 and 415) status codes, which MUST be used by Receiver to indicate that the write will never be able to succeed and should not be retried.

### Retries & Backoff

Receiver MAY return a [429 HTTP Too Many Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429) status code to indicate the overloaded server situation. Receiver MAY return [the Retry-After](https://www.rfc-editor.org/rfc/rfc9110.html#name-retry-after) header to indicate the time for the next write attempt. Receiver MAY return a 5xx HTTP status code to represent internal server errors.

Sender MAY retry on 429 HTTP status code. Sender MUST retry write requests on 5xx HTTP. Sender MUST use a backoff algorithm to prevent overwhelming the server. Sender MAY handle [the Retry-After response header](https://www.rfc-editor.org/rfc/rfc9110.html#name-retry-after) to estimate the next retry time.

The difference between 429 vs 5xx handling is due to potential for Sender “falling behind” if the Receiver cannot keep up. As a result, the ability to NOT retry on 429 allows progress is made when there are Sender side errors (e.g. too much traffic), while the data is not lost when there are Receiver side errors.

### Retries on Partial Writes

No partial retry-ability is specified (ability for receiver to ask for retry on certain samples only), but Receiver MAY return a HTTP 5xx or 429 status code a case of partial write cases (e.g. when some samples require retry, while the rest of the samples were successfully written). In that case Receiver MUST support idempotency as sender MAY retry with the same request. It’s up to Receiver implementation to decide what’s best with [the specified sender retry semantics](#retries--backoff).

Similarly, Receiver MAY return a HTTP 5xx or 429 status code on partial write or [partial invalid sample cases](#partial-write), when it expects Sender to retry the whole request.

### Backward and forward compatibility

TBD

<!---
TODO(bwplotka): TBD, below is copy of 1.x
The protocol follows [semantic versioning 2.0](https://semver.org/): any 1.x compatible Receiver MUST be able to read any 1.x compatible sender and so on.  Breaking/backwards incompatible changes will result in a 2.x version of the spec.

The proto format itself is forward / backward compatible, in some respects:

- Removing fields from the proto will mean a major version bump.
- Adding (optional) fields will be a minor version bump.

Negotiation:

- Sender MUST send the version number in a headers.
- Receiver MAY return the highest version number they support in a response header ("X-Prometheus-Remote-Write-Version").
- Sender who wish to send in a format >1.x MUST start by sending an empty 1.x, and see if the response says the receiver supports something else.  The Sender MAY use any supported version .  If there is no version header in the response, Sender MUST assume 1.x compatibility only.
-->

Receiver MAY ingest valid samples within a write request that otherwise contains invalid samples. Receiver MUST return a HTTP 400 status code ("Bad Request") for write requests that contain any invalid samples. Receiver SHOULD provide a human readable error message in the response body. Sender MUST NOT try and interpret the error message, and SHOULD log it as is.

## Out of Scope

<!---
TODO(bwplotka): Do we need this section?
-->

The same as in [1.0](./remote_write_spec.md#out-of-scope).

## Future Plans

This section contains speculative plans that are not considered part of protocol specification, but are mentioned here for completeness. Note that 2.0 specification completed [2 of 3 future plans in the 1.0](./remote_write_spec.md#future-plans).

* **Transactionality** There is still no transactionality defined for 2.0 specification, mostly because it makes scalable Prometheus Sender implementation difficult. Prometheus aims at being "transactional" - i.e. to never expose a partially scraped target to a query. We intend to do the same with remote write -- for instance, in the future we would like to "align" remote write with scrapes, perhaps such that all the samples, metadata and exemplars for a single scrape are sent in a single remote write request.

  However, Remote Write 2.0 specification solves a key transactionality problem for [the classic histogram buckets](https://docs.google.com/document/d/1mpcSWH1B82q-BtJza-eJ8xMLlKt6EJ9oFGH325vtY1Q/edit#heading=h.ueg7q07wymku). This is done thanks to native histograms supporting custom bucket-ing which is supported by `io.prometheus.write.v2.Request`. Sender might translate all classic histograms to native histograms this way, but it's out of this specification to mandate this. However, for this reason Receiver MAY ignore certain metric types (e.g. classic histograms).

* **Alternative wire formats**. The OpenTelemetry community has shown the validity of Apache Arrow (and potentially other columnar formats) for over the wire data transfer with their OTLP protocol. We would like to do experiments to confirm the compatibility of a similar format with Prometheus’ data model, and include benchmarks of any resource usage changes. We would potentially maintain both a protobuf and columnar format long term for compatibility reasons and use our content negotiation to add different proto message for this purpose.

* Pre-defined string dictionary for interning The protocol could pre-define a static dictionary of ref->symbol that includes strings that are considered common, e.g. “namespace”, “le”, “job”, “seconds”, “bytes”, etc. Sender and refer to these without the need to include them in the request’s symbols table. This dictionary could incrementally grow with minor versions releases of the protocol.

## Related

### FAQ

See 1.0 FAQ

**Why did you not use gRPC?**
Because 1.0 protocol is not using gRPC, breaking it would increase friction in the adoption. See 1.0 [reason](./remote_write_spec.md#faq).

**Why not streaming protobuf messages?**
The same rationale as in 1.0 [reasoning](./remote_write_spec.md#faq).

**Why do we send samples in order?**
The same rationale as in 1.0 [reasoning](./remote_write_spec.md#faq).

**How can we parallelise requests with the in-order constraint?**
The same answer as in 1.0 [reasoning](./remote_write_spec.md#faq).

<!---
TODO(bwplotka): There might be more e.g. why not Arrow and Otel.
-->
