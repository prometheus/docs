---
title: Comparison to alternatives
sort_rank: 4
---

# Comparison to alternatives

## Prometheus vs. Graphite

### Scope

[Graphite](http://graphite.readthedocs.org/en/latest/) focuses on being a
passive time series database with a query language and graphing features. Any
other concerns are addressed by external components.

Prometheus is a full monitoring and trending system that includes built-in and
active scraping, storing, querying, graphing, and alerting based on time series
data. It has knowledge about what the world should look like (which endpoints
should exist, what time series patterns mean trouble, etc.), and actively tries
to find faults.

### Data model

Graphite stores numeric samples for named time series, much like Prometheus
does. However, Prometheus's metadata model is richer: while Graphite metric
names consist of dot-separated components which implicitly encode dimensions,
Prometheus encodes dimensions explicitly as key-value pairs (labels) attached
to a metric name. This allows easy filtering, grouping, and matching by these
labels via in the query language.

Further, especially when Graphite is used in combination with
[StatsD](https://github.com/etsy/statsd/), it is common to store only
aggregated data over all monitored instances, rather than preserving the
instance as a dimension and being able to drill down into individual
problematic ones.

As an example, storing the number of HTTP requests to API servers with the
response code `500` and the method `POST` to the `/tracks` endpoint would
commonly be encoded like this in Graphite/StatsD:

```
stats.api-server.tracks.post.500 -> 93
```

In Prometheus the same data could be encoded like this (assuming three api-server instances):

```
api_server_http_requests_total{method="POST","handler="/tracks",status="500",instance="<sample1>"} -> 34
api_server_http_requests_total{method="POST","handler="/tracks",status="500",instance="<sample2>"} -> 28
api_server_http_requests_total{method="POST","handler="/tracks",status="500",instance="<sample3>"} -> 31
```

### Storage

Graphite stores time series data on local disk in the
[Whisper](http://graphite.readthedocs.org/en/latest/whisper.html) format, an
RRD-style database that expects samples to arrive at regular intervals. Every
timeseries is stored in a separate file, and new samples overwrite old ones
after a certain amount of time.

Prometheus also creates one local file per time series, but allows storing
samples at arbitrary intervals as scrapes or rule evaluations occur. Since new
samples are simply appended, old data may be kept arbitrarily long. Prometheus
also works well for many short-lived, frequently changing sets of timeseries.

## Prometheus vs. InfluxDB

[InfluxDB](http://influxdb.com/) is a very promising new open-source time
series database. It didn't exist when Prometheus development began, so we were
unable to consider it as an alternative at the time. Still, there are
significant differences between Prometheus and InfluxDB, and both systems are
geared towards slightly different use cases.

### Scope

The same scope differences as in the case of
[Graphite](/docs/introduction/comparison/#prometheus-vs.-graphite) apply here.

### Data model / storage

*Summary:* InfluxDB stores rows of events with full metadata for each event;
Prometheus only stores numeric samples for existing time series. Both are good
for different use cases.

While InfluxDB's data model also allows annotation of data with arbitrary
key-value pairs, it differs significantly from Prometheus in the way this data
is modeled and stored. At its core, InfluxDB stores timestamped events with full metadata
(key-value pairs) attached to each event / row. Prometheus stores only numeric
time series and stores metadata for each time series exactly once, and then
continues to simply append timestamped samples for that existing metadata
entry. In a
[test from March 2014](https://docs.google.com/document/d/1OgnI7YBCT_Ub9Em39dEfx9BuiqRNS3oA62i8fJbwwQ8/edit?usp=sharing),
dumping typical Prometheus time series data into InfluxDB required **11x more
disk storage in InfluxDB than in Prometheus** due to this different data model.

If you are only interested in tracking the development of existing named
time series (for example, the cumulative count of HTTP requests with the method
`POST` to the `/api/tracks` endpoint on the instance
`http://1.2.3.4:12345/metrics`), Prometheus will require much less storage
space than InfluxDB. Further, Prometheus indexes all time series dimensions for
efficient filtering, while InfluxDB currently only indexes tables by row
timestamps (issue to track adding column indexes:
https://github.com/influxdb/influxdb/issues/582).

Still, InfluxDB is better geared towards the following use cases:

   * storing all **individual** events, not just time series of values
      * e.g. storing every HTTP request with full metadata *vs.* storing the cumulative count of HTTP requests for certain dimensions
   * storing time series with completely unbounded dimensionality
      * e.g. storing user IDs or email addresses in the key-value metadata *vs.*
        storing bounded dimensionality like the HTTP method, HTTP handler and
        instance ID

There are other storage features, such as downsampling, which InfluxDB supports
and Prometheus doesn't yet.

### Architecture

Prometheus servers run independently of each other and only rely on their local
storage for their core functionality: scraping, rule processing, and alerting.

InfluxDB is by design a distributed storage cluster with storage and queries
being handled by many nodes at once.

This means that InfluxDB will be easier to scale horizontally, but it also
means that you have to manage the complexity of a distributed storage system
from the beginning. Prometheus will be simpler to run, but at some point you
will need to shard servers explicitly along scalability boundaries like
products, services, datacenters, or similar aspects. Independent servers (which
can be run redundantly in parallel) may also give you better reliability and
failure isolation, though that is debatable, since InfluxDB also can tolerate
node outages due to data replication.

## OpenTSDB

[OpenTSDB](http://opentsdb.net/) is a distributed time series database based on
[Hadoop](http://hadoop.apache.org/) and [HBase](http://hbase.apache.org/).

### Scope

The same scope differences as in the case of
[Graphite](/docs/introduction/comparison/#prometheus-vs.-graphite) apply here.

### Data model

OpenTSDB's data model is almost identical to Prometheus's: time series are
identified by a set of arbitrary key-value pairs (OpenTSDB "tags" are
Prometheus "labels"). There are minor differences though, such as that
Prometheus allows arbitrary characters in label values, while OpenTSDB is more
restrictive. OpenTSDB is also lacking a full query language, only allowing
simple aggregations via its API.

### Storage

[OpenTSDB](http://opentsdb.net/)'s storage is implemented on top of
[Hadoop](http://hadoop.apache.org/) and [HBase](http://hbase.apache.org/). This
means that it is easy to scale OpenTSDB horizontally, but you have to accept
the overall complexity of running a Hadoop/HBase cluster from the beginning.

Again, as in the case of InfluxDB, Prometheus will be simpler to run initially,
but will require explicit sharding once the capacity of a single node is
exceeded.
