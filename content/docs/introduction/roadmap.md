---
title: Roadmap
sort_rank: 6
---

# Roadmap

The following is only a selection of some of the major features we plan to
implement in the near future. To get a more complete overview of planned
features and current work, see the issue trackers for the various repositories,
for example, the [Prometheus
server](https://github.com/prometheus/prometheus/issues).

### Hierarchical federation

Hierarchical federation will allow higher-level Prometheus servers to collect
aggregated time series data from subordinated servers. This will enable more
scalable monitoring topologies. For example, a setup might consist of
per-datacenter Prometheus servers that collect data in high detail, and a set
of global Prometheus servers which collect and store only aggregated data from
those local servers. This allows you to have an aggregate global view and
detailed local views.

GitHub issue: [#9](https://github.com/prometheus/prometheus/issues/9)

### Support for more types of service discovery

Currently Prometheus supports configuring static HTTP targets, as well as
discovering targets dynamically via [DNS SRV
records](http://en.wikipedia.org/wiki/SRV_record) and [Consul](https://www.consul.io/). There is also a file-based interface that allows you to connect your own discovery mechanisms. We plan to natively support more
types of service discovery (e.g. Zookeeper) in the future.

### Long-term storage

Currently Prometheus has support for storing samples on local disk, as well as
experimental support for writing data into OpenTSDB and InfluxDB. We plan to
improve long-term storage support, although the details are not determined yet.
This might include read-back support from OpenTSDB/InfluxDB in Prometheus, or
support for other long-term storage backends.

GitHub issue: [#10](https://github.com/prometheus/prometheus/issues/10)

### Improved staleness handling

Currently Prometheus omits time series from query results if the timestamp for
which the query is executed is more than 5 minutes away from the nearest
sample. This means that time series will grow "stale" in instant queries after
not receiving samples for 5 minutes. This currently prevents usage of
client-side timestamps from the Pushgateway or CloudWatch Exporter, which might
indicate a time more than 5 minutes in the past. We plan on only considering a
time series stale if it was not present in the most recent scrape.

GitHub issue: [#398](https://github.com/prometheus/prometheus/issues/398)

### Server-side metric metadata support

At this time, metric types and other metadata are only used in the
client libaries and in the exposition format, but not persisted or
utilized in the Prometheus server. We plan on making use of this
metadata in the future. For example, we could suggest automatic rates
over counters, warn users if they take the rate of a gauge, or display
metric documentation strings. Some metric types, like the upcoming
[server-side histograms](https://github.com/prometheus/prometheus/issues/480),
could also be stored and processed in a more efficient way.  The
details of this are still to be determined.

### More client libraries and exporters

Prometheus has a range of client libraries and exporters. There are always more
languages that could be supported, or systems that would be useful to export
metrics from. We will add more as we need them. We are also happy to accept
pull requests and advise on how best to integrate with Prometheus.
