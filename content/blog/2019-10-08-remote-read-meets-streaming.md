---
title: Remote Read Meets Streaming
created_at: 2019-10-08
kind: article
author_name: Bartlomiej Plotka
---

The new Prometheus version 2.13.0 is available and as always, it includes many fixes and improvements ([CHANGELOG](https://github.com/prometheus/prometheus/blob/release-2.13/CHANGELOG.md)). 
However, there is one feature that some projects and users were waiting for: [chunked, streamed version of remote read API](https://docs.google.com/document/d/1JqrU3NjM9HoGLSTPYOvR217f5HBKBiJTqikEB9UiJL0/edit#heading=h.3en2gbeew2sa).  

In this article I would like to present a deep dive of what we changed in the remote protocol, why and how to effectively use it.

## Remote APIs

Prometheus since the 1.x version had the ability to interact directly with its storage using [remote API](https://prometheus.io/docs/prometheus/latest/storage/#remote-storage-integrations). 

This API offers two methods: **write** and **read** which allows a 3rd party system to either:

* Receive pushed samples by Prometheus: "Write"
* Pull samples from Prometheus or to Prometheus: "Read"

![Remote read and write architecture](/assets/blog/2019-10-08/remote_integrations.png)

Both methods are using HTTP with messages encoded with [protobufs](https://github.com/protocolbuffers/protobuf). 
Additionally, both request and response for both methods are optionally compressed using [snappy](https://github.com/google/snappy).

### Remote Write 

This is the most popular way to replicate Prometheus data into 3rd party system. In this mode, Prometheus streams samples, 
by periodically sending a batch of those to the given endpoint. 

Remote read was recently improved massively in March with [WAL-based remote read](https://grafana.com/blog/2019/03/25/whats-new-in-prometheus-2.8-wal-based-remote-write/) which
improved the reliability and resource consumption. It is also worth to note that Write is supported by almost all 3rd 
party integrations mentioned [here](https://prometheus.io/docs/operating/integrations/#remote-endpoints-and-storage).

### Remote Read

Read method is a bit less popular. It was added in [March 2017](https://github.com/prometheus/prometheus/commit/febed48703b6f82b54b4e1927c53ab6c46257c2f) (server side) and did not change much
since back then. Prometheus 2.13.0 release fixes the known bottlenecks of the Read, so we will focus on the Read method in this article.

The key idea of the remote read is to allow querying Prometheus storage, [the TSDB](https://github.com/prometheus/prometheus/tree/master/tsdb) directly without PromQL evaluation. 
Similar interface, [`Querier`](https://github.com/prometheus/prometheus/blob/91d7175eaac18b00e370965f3a8186cc40bf9f55/storage/interface.go#L53), PromQL engine is using to get data from storage. 

The remote read request is a very simple HTTP request with the following protobuf payload:

```
message Query {
  int64 start_timestamp_ms = 1;
  int64 end_timestamp_ms = 2;
  repeated prometheus.LabelMatcher matchers = 3;
  prometheus.ReadHints hints = 4;
}
```

With that payload, client can ask for certain series matching given `matchers` and time range with `end` and `start`.

The response is equally simple. It returns the matched time series with **raw** samples of value and timestamp.

```
message Sample {
  double value    = 1;
  int64 timestamp = 2;
}

message TimeSeries {
  repeated Label labels   = 1;
  repeated Sample samples = 2;
}

message QueryResult {
  repeated prometheus.TimeSeries timeseries = 1;
}
```

This essentially allows read access to metrics in TSDB that Prometheus collected. The main use cases for remote read are:

* Seamless Prometheus upgrades between different data formats of Prometheus, so having [Prometheus reading from another Prometheus](https://www.robustperception.io/accessing-data-from-prometheus-1-x-in-prometheus-2-0) 
* Prometheus being able to read from 3rd party long term storage systems e.g InfluxDB.
* 3rd party system querying data from Prometheus e.g [Thanos](https://thanos.io).

## Remote Read: Problem Statement

There were two key problems for such a simple remote read. It was easy to use and understand, but there were no
streaming capabilities within single HTTP request, for the protobuf format we defined. Secondly, the response was 
including raw samples (`float64` value and `int64` timestamp) instead of
an encoded, compressed batch of samples called "chunks" that are used to store metrics inside TSDB.

The server algorithm for remote read before improvement was follows: 

1. Parse request.
1. Select metrics from TSDB.
1. For all decoded series:
  * For all samples:
      * Add to response protobuf
1. Marshal response.
1. Snappy compress.
1. Send back the HTTP response.  
 
In the essence, this means that the whole response of the remote read had to be buffered in raw, uncompressed form to marshall it 
in potentially huge protobuf before sending it to the client. The whole response has to then be fully buffered in the client again to be able
to unmarshal it from protobuf. Only after that client could access raw samples.

What does it mean? It means that requests for, let's say, only 8 hours that matches 10 000 series can take up to **2.5GB** of memory allocated by both client and server each!

Find below, memory usage metric for both Prometheus and [Thanos Sidecar](https://thanos.io/components/sidecar.md/) (remote read client) during remote read request time:

![Prometheus 2.12.0: RSS of single read 8h of 10k series](/assets/blog/2019-10-08/10kseries8hours-2.12.png)

![Prometheus 2.12.0: Heap-only allocations of single read 8h of 10k series](/assets/blog/2019-10-08/10series8hours-2.12-allocs.png)

It's worth to note, that querying 10k series is never great even for Prometheus native HTTP `query_range` endpoint,
simply because fetching and storing hundreds of megabytes in your browser is not great. 
Additionally, for dashboards and rendering purposes it is not practical to have that much of the data. 
That's why usually we craft queries that have no more than 20 series.

This is great, but a very common technique is to compose queries in such way that query returns **aggregated** 20 series, 
however underneath the query engine has to touch potentially thousands of series to evaluate the response (e.g `count()` function or [subqueries](https://prometheus.io/blog/2019/01/28/subquery-support/)).
That's why systems like Thanos, which among other data, uses TSDB data from remote read, it's very often the case that the request is heavy. 

## Solution

To explain the solution and its benefits, it's important to understand the way Prometheus iterates over the data when queried.
The core concept can be shown in [`Querier's`](https://github.com/prometheus/prometheus/blob/91d7175eaac18b00e370965f3a8186cc40bf9f55/storage/interface.go#L53)
`Select` method returned type called `SeriesSet`. The interface is presented below:

```
// SeriesSet contains a set of series.
type SeriesSet interface {
	Next() bool
	At() Series
	Err() error
}

// Series represents a single time series.
type Series interface {
	// Labels returns the complete set of labels identifying the series.
	Labels() labels.Labels
	// Iterator returns a new iterator of the data of the series.
	Iterator() SeriesIterator
}

// SeriesIterator iterates over the data of a time series.
type SeriesIterator interface {
	// At returns the current timestamp/value pair.
	At() (t int64, v float64)
	// Next advances the iterator by one.
	Next() bool
	Err() error
}
```

These sets of interfaces allow "streaming" flow inside the process. We no longer have to have, precomputed list of series that hold samples.
With this interface each `SeriesSet.Next()` implementation can fetch series on demand. 
In a similar way, within each series. we can also dynamically fetch each sample respectively via `SeriesIterator.Next`.  

With this contract, Prometheus can minimize allocated memory, because the PromQL engine can iterate over samples optimally to evaluate the query. 
In the same way TSDB, so Prometheus storage, can implement `SeriesSet` in a way that fetches the series optimally from blocks stored in the filesystem one by one, minimizing allocations.

Why this is important for remote read? Well, ideally we would like to reuse the same pattern of streaming using iterators for our remote HTTP API.
Because protobuf has no native delimiting logic, we [`extended`](https://github.com/prometheus/prometheus/pull/5703/files#diff-7bdb1c90d5a59fc5ead16457e6d2b038R44)
proto definition to allow sending **set of small protocol buffer messages** instead of a single, huge one. We called this mode `STREAMED_XOR_CHUNKS` remote read.
This means that Prometheus does not need to buffer the whole response anymore. Instead it can work on each series sequentially and send a single frame per
each `SeriesSet.Next` or batch of `SeriesIterator.Next` iterations, potentially reusing the same memory pages for next series!

Now, the response of `STREAMED_XOR_CHUNKS` remote read is a set of Protobuf messages (frames) as presented below:

```
// ChunkedReadResponse is a response when response_type equals STREAMED_XOR_CHUNKS.
// We strictly stream full series after series, optionally split by time. This means that a single frame can contain
// partition of the single series, but once a new series is started to be streamed it means that no more chunks will
// be sent for previous one.
message ChunkedReadResponse {
  repeated prometheus.ChunkedSeries chunked_series = 1;
}

// ChunkedSeries represents single, encoded time series.
message ChunkedSeries {
  // Labels should be sorted.
  repeated Label labels = 1 [(gogoproto.nullable) = false];
  // Chunks will be in start time order and may overlap.
  repeated Chunk chunks = 2 [(gogoproto.nullable) = false];
}
```

As you can see the frame does not include raw samples anymore. That's the second improvement we did: We send in the message
samples batched in chunks (see [this video](https://www.youtube.com/watch?v=b_pEevMAC3I) to learn more about chunks), 
which are exactly the same chunks we store in the TSDB. 

We ended up with the following server algorithm:

1. Parse request.
1. Select metrics from TSDB.
1. For all series:
  * For all samples:
    * Encode into chunks
       * if the frame is >= 1MB; break
  * Marshal `ChunkedReadResponse` message.
  * Snappy compress
  * Send the message   

You can find full design [here](https://docs.google.com/document/d/1JqrU3NjM9HoGLSTPYOvR217f5HBKBiJTqikEB9UiJL0/edit#).

## Benchmarks

Let's compare remote read characteristics between Prometheus `2.12.0` and `2.13.0`. As the initial results presented 
at the beginning of this article, I was using Prometheus as a server, and Thanos sidecar as a client of the remote read.
I was invoking testing remote read request by running gRPC call against Thanos sidecar using `grpcurl`.
Test was performed from my laptop (Lenovo X1 16GB, i7 8th) with Kubernetes in docker (using [kind](https://github.com/kubernetes-sigs/kind)) 

The data was artificially generated, and represents highly dynamic 10k series (worst case scenario).

The full test bench is available in [thanosbench repo](https://github.com/thanos-io/thanosbench/blob/master/benchmarks/remote-read/README.md).

### Memory

![Prometheus 2.12.0: Heap-only allocations of single read 8h of 10k series](/assets/blog/2019-10-08/10series8hours-2.12-allocs.png)

![Prometheus 2.13.0: Heap-only allocations of single read 8h of 10k series](/assets/blog/2019-10-08/10series8hours-2.13-allocs.png)

Reducing memory was the key item we aimed for with our solution. Prometheus instead of allocating GBs of memory, buffers 
roughly 50MB during the whole request, whereas for Thanos there is only a marginal memory use. Thanks to the streamed
Thanos gRPC StoreAPI, sidecar is now a very simple proxy.

Additionally, I tried different time ranges and number of series, but as expected I kept seeing
maximum of 50MB in allocations for Prometheus and nothing really visible for Thanos. This proves that our remote read
uses **constant memory per request** allowing straightforward capacity planning against user traffic, with help of the concurrency limit. 

### CPU

![Prometheus 2.12.0: CPU time of single read 8h of 10k series](/assets/blog/2019-10-08/10kseries8hours-2.12-cpu.png)

![Prometheus 2.13.0: CPU time of single read 8h of 10k series](/assets/blog/2019-10-08/10kseries8hours-2.13-cpu.png)

During my tests, CPU usage was also improved, with more 2x less CPU time used. 

### Latency

We achieved to reduce remote read request latency as well, thanks to streaming and less encoding.
 
Remote read request for 10k series, for 8h took for different versions:

|      | 2.12.0: avg time | 2.13.0: avg time |
|------|------------------|------------------|
| real | 0m34.701s        | 0m8.164s         |
| user | 0m7.324s         | 0m8.181s         |
| sys  | 0m1.172s         | 0m0.749s         |

If we reduced the time range to 2h I seen:

|      | 2.12.0: avg time | 2.13.0: avg time |
|------|------------------|------------------|
| real | 0m10.904s        | 0m4.145s         |
| user | 0m6.236s         | 0m4.322s         |
| sys  | 0m0.973s         | 0m0.536s         |

Additionally to the ~2.5x lower latency, we can see that response is streamed immediately in comparison to the non-streamed
version where we were waiting for 27s (`real` minus `user` time) just on processing and marshaling on Prometheus and then on Thanos side. 

## Compatibility

Remote read was extended in a backward and forward compatible way. This is thanks to the protobuf and `accepted_response_types` field which is
ignored for older servers. In the same time server works just fine if `accepted_response_types` is not present by older clients assuming old `SAMPLED` remote read.

## Usage

3rd party system to use the new, streamed remote read in Prometheus v2.13.0, it has to add  `accepted_response_types = [STREAMED_XOR_CHUNKS]` to the request.

Then Prometheus will stream `ChunkedReadResponse` instead of old message. Each `ChunkedReadResponse` message is 
following varint size and fixed size bigendian uint32 for CRC32 Castagnoli checksum.

For Go it is recommended to use our [ChunkedReader](https://github.com/prometheus/prometheus/blob/48b2c9c8eae2d4a286d8e9384c2918aefd41d8de/storage/remote/chunked.go#L103)
 to read directly from the stream.   

Note that `storage.remote.read-sample-limit` flag is no longer working for `STREAMED_XOR_CHUNKS`.
`storage.remote.read-concurrent-limit` works as previously.

There also new option `storage.remote.read-max-bytes-in-frame` which controls the maximum size of each message. It is advised
to keep it 1MB as the default as it is recommended by Google to keep protobuf message [not larger than 1MB](https://developers.google.com/protocol-buffers/docs/techniques#large-data).

As mentioned before, [Thanos](https://thanos.io) gains a lot with this improvement. We added support for the new remote read  in `v0.7.0`, so this version or any newer, 
will use streamed remote read automatically whenever Prometheus 2.13 or newer is used next to the Thanos sidecar.

## Next Steps

Release 2.13.0 introduces extended remote read and Prometheus server side implementation, However at the moment of writing
there are still few items to do in order to fully get advantage from the extended remote read protocol:

* Support for client side of Prometheus remote read: [In progress](https://github.com/prometheus/prometheus/issues/5926) 
* Avoid reencoding of chunks for blocks during remote read: [In progress](https://github.com/prometheus/prometheus/pull/5882)

## Summary

To sum up, the main benefits of chunked, streaming of remote read are:

* Both client and server are capable to use **constant memory size and per each request**. This is because Prometheus now
at maximum buffers just a single small frame instead of the whole response during remote read. This massively helps with
capacity planning, especially for non-compressible resource like memory.
* Prometheus server does not need to decode chunks to raw samples anymore during remote read. The same for client side for
encoding, **if** the system is reusing native TSDB XOR compression (like Thanos does). 

As always, if we you have any issues or feedback, feel free to submit a ticket on GitHub or reach us on the mailing list.
