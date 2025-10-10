---
title: Comparison to alternatives
sort_rank: 4
---

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
Prometheus encodes dimensions explicitly as key-value pairs, called labels, attached
to a metric name. This allows easy filtering, grouping, and matching by these
labels via the query language.

Further, especially when Graphite is used in combination with
[StatsD](https://github.com/etsy/statsd/), it is common to store only
aggregated data over all monitored instances, rather than preserving the
instance as a dimension and being able to drill down into individual
problematic instances.

For example, storing the number of HTTP requests to API servers with the
response code `500` and the method `POST` to the `/tracks` endpoint would
commonly be encoded like this in Graphite/StatsD:

```
stats.api-server.tracks.post.500 -> 93
```

In Prometheus the same data could be encoded like this (assuming three api-server instances):

```
api_server_http_requests_total{method="POST",handler="/tracks",status="500",instance="<sample1>"} -> 34
api_server_http_requests_total{method="POST",handler="/tracks",status="500",instance="<sample2>"} -> 28
api_server_http_requests_total{method="POST",handler="/tracks",status="500",instance="<sample3>"} -> 31
```

### Storage

Graphite stores time series data on local disk in the
[Whisper](http://graphite.readthedocs.org/en/latest/whisper.html) format, an
RRD-style database that expects samples to arrive at regular intervals. Every
time series is stored in a separate file, and new samples overwrite old ones
after a certain amount of time.

Prometheus also creates one local file per time series, but allows storing
samples at arbitrary intervals as scrapes or rule evaluations occur. Since new
samples are simply appended, old data may be kept arbitrarily long. Prometheus
also works well for many short-lived, frequently changing sets of time series.

### Summary

Prometheus offers a richer data model and query language, in addition to being
easier to run and integrate into your environment. If you want a clustered
solution that can hold historical data long term, Graphite may be a better
choice.


## Prometheus vs. InfluxDB

[InfluxDB](https://influxdata.com/) is an open-source time series database,
with a commercial option for scaling and clustering. The InfluxDB project was
released almost a year after Prometheus development began, so we were unable to
consider it as an alternative at the time. Still, there are significant
differences between Prometheus and InfluxDB, and both systems are geared
towards slightly different use cases.

### Scope

For a fair comparison, we must also consider
[Kapacitor](https://github.com/influxdata/kapacitor) together with InfluxDB, as
in combination they address the same problem space as Prometheus and the
Alertmanager.

The same scope differences as in the case of
[Graphite](#prometheus-vs-graphite) apply here for InfluxDB itself. In addition
InfluxDB offers continuous queries, which are equivalent to Prometheus
recording rules.

Kapacitor’s scope is a combination of Prometheus recording rules, alerting
rules, and the Alertmanager's notification functionality. Prometheus offers [a
more powerful query language for graphing and
alerting](https://www.robustperception.io/translating-between-monitoring-languages/).
The Prometheus Alertmanager additionally offers grouping, deduplication and
silencing functionality.

### Data model / storage

Like Prometheus, the InfluxDB data model has key-value pairs as labels, which
are called tags. In addition, InfluxDB has a second level of labels called
fields, which are more limited in use. InfluxDB supports timestamps with up to
nanosecond resolution, and float64, int64, bool, and string data types.
Prometheus, by contrast, supports the float64 data type with limited support for
strings, and millisecond resolution timestamps.

InfluxDB uses a variant of a [log-structured merge tree for storage with a write ahead log](https://docs.influxdata.com/influxdb/v1.7/concepts/storage_engine/),
sharded by time. This is much more suitable to event logging than Prometheus's
append-only file per time series approach.

[Logs and Metrics and Graphs, Oh My!](https://grafana.com/blog/2016/01/05/logs-and-metrics-and-graphs-oh-my/)
describes the differences between event logging and metrics recording.

### Architecture

Prometheus servers run independently of each other and only rely on their local
storage for their core functionality: scraping, rule processing, and alerting.
The open source version of InfluxDB is similar.

The commercial InfluxDB offering is, by design, a distributed storage cluster
with storage and queries being handled by many nodes at once.

This means that the commercial InfluxDB will be easier to scale horizontally,
but it also means that you have to manage the complexity of a distributed
storage system from the beginning. Prometheus will be simpler to run, but at
some point you will need to shard servers explicitly along scalability
boundaries like products, services, datacenters, or similar aspects.
Independent servers (which can be run redundantly in parallel) may also give
you better reliability and failure isolation.

Kapacitor's open-source release has no built-in distributed/redundant options for
rules,  alerting, or notifications.  The open-source release of Kapacitor can
be scaled via manual sharding by the user, similar to Prometheus itself.
Influx offers [Enterprise Kapacitor](https://docs.influxdata.com/enterprise_kapacitor), which supports an
HA/redundant alerting system.

Prometheus and the Alertmanager by contrast offer a fully open-source redundant
option via running redundant replicas of Prometheus and using the Alertmanager's
[High Availability](https://github.com/prometheus/alertmanager#high-availability)
mode.

### Summary

There are many similarities between the systems. Both have labels (called tags
in InfluxDB) to efficiently support multi-dimensional metrics. Both use
basically the same data compression algorithms. Both have extensive
integrations, including with each other. Both have hooks allowing you to extend
them further, such as analyzing data in statistical tools or performing
automated actions.

Where InfluxDB is better:

  * If you're doing event logging.
  * Commercial option offers clustering for InfluxDB, which is also better for long term data storage.
  * Eventually consistent view of data between replicas.

Where Prometheus is better:

  * If you're primarily doing metrics.
  * More powerful query language, alerting, and notification functionality.
  * Higher availability and uptime for graphing and alerting.

InfluxDB is maintained by a single commercial company following the open-core
model, offering premium features like closed-source clustering, hosting and
support. Prometheus is a [fully open source and independent project](/community/), maintained
by a number of companies and individuals, some of whom also offer commercial services and support.

## Prometheus vs. OpenTSDB

[OpenTSDB](http://opentsdb.net/) is a distributed time series database based on
[Hadoop](http://hadoop.apache.org/) and [HBase](http://hbase.apache.org/).

### Scope

The same scope differences as in the case of
[Graphite](/docs/introduction/comparison/#prometheus-vs-graphite) apply here.

### Data model

OpenTSDB's data model is almost identical to Prometheus's: time series are
identified by a set of arbitrary key-value pairs (OpenTSDB tags are
Prometheus labels). All data for a metric is
[stored together](http://opentsdb.net/docs/build/html/user_guide/writing/index.html#time-series-cardinality),
limiting the cardinality of metrics. There are minor differences though: Prometheus
allows arbitrary characters in label values, while OpenTSDB is more restrictive.
OpenTSDB also lacks a full query language, only allowing simple aggregation and math via its API.

### Storage

[OpenTSDB](http://opentsdb.net/)'s storage is implemented on top of
[Hadoop](http://hadoop.apache.org/) and [HBase](http://hbase.apache.org/). This
means that it is easy to scale OpenTSDB horizontally, but you have to accept
the overall complexity of running a Hadoop/HBase cluster from the beginning.

Prometheus will be simpler to run initially, but will require explicit sharding
once the capacity of a single node is exceeded.

### Summary

Prometheus offers a much richer query language, can handle higher cardinality
metrics, and forms part of a complete monitoring system. If you're already
running Hadoop and value long term storage over these benefits, OpenTSDB is a
good choice.

## Prometheus vs. Nagios

[Nagios](https://www.nagios.org/) is a monitoring system that originated in the
1990s as NetSaint.

### Scope

Nagios is primarily about alerting based on the exit codes of scripts. These are
called “checks”. There is silencing of individual alerts, however no grouping,
routing or deduplication.

There are a variety of plugins. For example, piping the few kilobytes of
perfData plugins are allowed to return [to a time series database such as Graphite](https://github.com/shawn-sterling/graphios) or using NRPE to [run checks on remote machines](https://exchange.nagios.org/directory/Addons/Monitoring-Agents/NRPE--2D-Nagios-Remote-Plugin-Executor/details).

### Data model

Nagios is host-based. Each host can have one or more services and each service
can perform one check.

There is no notion of labels or a query language.

### Storage

Nagios has no storage per-se, beyond the current check state.
There are plugins which can store data such as [for visualisation](https://docs.pnp4nagios.org/).

### Architecture

Nagios servers are standalone. All configuration of checks is via file.

### Summary

Nagios is suitable for basic monitoring of small and/or static systems where
blackbox probing is sufficient.

If you want to do whitebox monitoring, or have a dynamic or cloud based
environment, then Prometheus is a good choice.

## Prometheus vs. Sensu

[Sensu](https://sensu.io) is an open source monitoring and observability pipeline with a commercial distribution which offers additional features for scalability. It can reuse existing Nagios plugins.

### Scope

Sensu is an observability pipeline that focuses on processing and alerting of observability data as a stream of [Events](https://docs.sensu.io/sensu-go/latest/observability-pipeline/observe-events/events/). It provides an extensible framework for event [filtering](https://docs.sensu.io/sensu-go/latest/observability-pipeline/observe-filter/), aggregation, [transformation](https://docs.sensu.io/sensu-go/latest/observability-pipeline/observe-transform/), and [processing](https://docs.sensu.io/sensu-go/latest/observability-pipeline/observe-process/) – including sending alerts to other systems and storing events in third-party systems. Sensu's event processing capabilities are similar in scope to Prometheus alerting rules and Alertmanager.

### Data model

Sensu [Events](https://docs.sensu.io/sensu-go/latest/observability-pipeline/observe-events/events/) represent service health and/or [metrics](https://docs.sensu.io/sensu-go/latest/observability-pipeline/observe-events/events/#metric-attributes) in a structured data format identified by an [entity](https://docs.sensu.io/sensu-go/latest/observability-pipeline/observe-entities/entities/) name (e.g. server, cloud compute instance, container, or service), an event name, and optional [key-value metadata](https://docs.sensu.io/sensu-go/latest/observability-pipeline/observe-events/events/#metadata-attributes) called "labels" or "annotations". The Sensu Event payload may include one or more metric [`points`](https://docs.sensu.io/sensu-go/latest/observability-pipeline/observe-events/events/#points-attributes), represented as a JSON object containing a `name`, `tags` (key/value pairs), `timestamp`, and `value` (always a float).

### Storage

Sensu stores current and recent event status information and real-time inventory data in an embedded database (etcd) or an external RDBMS (PostgreSQL).

### Architecture

All components of a Sensu deployment can be clustered for high availability and improved event-processing throughput.

### Summary

Sensu and Prometheus have a few capabilities in common, but they take very different approaches to monitoring. Both offer extensible discovery mechanisms for dynamic cloud-based environments and ephemeral compute platforms, though the underlying mechanisms are quite different. Both provide support for collecting multi-dimensional metrics via labels and annotations. Both have extensive integrations, and Sensu natively supports collecting metrics from all Prometheus exporters. Both are capable of forwarding observability data to third-party data platforms (e.g. event stores or TSDBs). Where Sensu and Prometheus differ the most is in their use cases.

Where Sensu is better:

- If you're collecting and processing hybrid observability data (including metrics _and/or_ events)
- If you're consolidating multiple monitoring tools and need support for metrics _and_ Nagios-style plugins or check scripts
- More powerful event-processing platform

Where Prometheus is better:

- If you're primarily collecting and evaluating metrics
- If you're monitoring homogeneous Kubernetes infrastructure (if 100% of the workloads you're monitoring are in K8s, Prometheus offers better K8s integration)
- More powerful query language, and built-in support for historical data analysis

Sensu is maintained by a single commercial company following the open-core business model, offering premium features like closed-source event correlation and aggregation, federation, and support. Prometheus is a fully open source and independent project, maintained by a number of companies and individuals, some of whom also offer commercial services and support.
