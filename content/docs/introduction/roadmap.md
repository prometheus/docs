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

### New storage engine

A new more efficient storage engine is in development. It will offer reduced
resource usage, better inverted indexes, and generally allow Prometheus to
scale further.

### Long-term storage

Currently Prometheus has support for storing samples on local disk, as well as
experimental support for sending data into remote systems via a generic mechanism.
Example receivers exist for a [variety of TSDBs](https://github.com/prometheus/prometheus/tree/master/documentation/examples/remote_storage).

We plan to add read-back support from other TSDBs via a generic mechanism in Prometheus,
such as [Cortex](https://github.com/weaveworks/cortex).

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
client libraries and in the exposition format, but not persisted or
utilized in the Prometheus server. We plan on making use of this
metadata in the future. The first step is to aggregate this data in-memory
in Prometheus and provide it via an experimental API endpoint.

### First-class metric type support

Prometheus breaks up notions of first class metric types such as Histograms or Summaries
into a flattened time series based representation in various places. Prometheus' database
and query language are both time-series oriented. The exposition formats provide different
degrees of first-class metrics.
  
The protocol buffer exposition format provides full first-class metrics. The text format
reduces them into a time series representation and merely provieds typing hints. Providing
stronger typing for the text format is one potential goal of the [OpenMetrics intiative](https://github.com/RichiH/OpenMetrics).
Adapting such first-class metrics in the storage layer may provide significant performance
benefits through a reduced number of time series and specialized compression algorithms.
This can likely be implemented as transparently to the user.  
Stronger typing in the query language may enhance expressiveness and prevent many cases of
semantically invalid queries. It is unclear whether PromQL can be adapted to
support true metric types or whether a new query language should be developed.

### Prometheus metrics format as a standard

We intend to submit a cleaned up version of our format for standardization
to a group such as the IETF.

### Backfill time series

Backfilling will permit bulk loads of data in the past. This will allow for
retroactive rule evaluations, and transferring old data from other monitoring
systems.

### Support the Ecosystem

Prometheus has a range of client libraries and exporters. There are always more
languages that could be supported, or systems that would be useful to export
metrics from. We will support the ecosystem in creating and expanding these.
