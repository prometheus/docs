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

### Long-term storage

Currently Prometheus has support for storing samples on local disk, as well as
experimental support for sending data into remote systems via a generic mechanism.
Example receivers exist for a [variety of TSDBs](https://github.com/prometheus/prometheus/tree/master/documentation/examples/remote_storage).

We plan to add read-back support from other TSDBs via a generic mechanism in Prometheus,
such as [Cortex](https://github.com/weaveworks/cortex).

GitHub issue: [#10](https://github.com/prometheus/prometheus/issues/10)

### Server-side metric metadata support

At this time, metric types and other metadata are only used in the
client libraries and in the exposition format, but not persisted or
utilized in the Prometheus server. We plan on making use of this
metadata in the future. The first step is to aggregate this data in-memory
in Prometheus and provide it via an experimental API endpoint.

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
