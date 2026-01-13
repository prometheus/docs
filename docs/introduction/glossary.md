---
title: Glossary
sort_rank: 9
---

### Alert

An alert is the outcome of an alerting rule in Prometheus that is
actively firing. Alerts are sent from Prometheus to the Alertmanager.

### Alertmanager

The [Alertmanager](/docs/alerting/latest/overview/) takes in alerts, aggregates them into
groups, de-duplicates, applies silences, throttles, and then sends out
notifications to email, Pagerduty, Slack etc.

### Bridge

A bridge is a component that takes samples from a client library and
exposes them to a non-Prometheus monitoring system. For example, the Python, Go, and Java clients can export metrics to Graphite.

### Client library

A client library is a library in some language (e.g. Go, Java, Python, Ruby)
that makes it easy to directly instrument your code, write custom collectors to
pull metrics from other systems and expose the metrics to Prometheus.

### Collector

A collector is a part of an exporter that represents a set of metrics. It may be
a single metric if it is part of direct instrumentation, or many metrics if it is pulling metrics from another system.

### Direct instrumentation

Direct instrumentation is instrumentation added inline as part of the source code of a program, using a [client library](#client-library).

### Endpoint

A source of metrics that can be scraped, usually corresponding to a single process.

### Exporter

An exporter is a binary running alongside the application you
want to obtain metrics from. The exporter exposes Prometheus metrics, commonly by converting metrics that are exposed in a non-Prometheus format into a format that Prometheus supports.

### Instance

An instance is a label that uniquely identifies a target in a job.

### Job

A collection of targets with the same purpose, for example monitoring a group of like processes replicated for scalability or reliability, is called a job.

### Mixin

A mixin is a reusable and extensible set of Prometheus alerts, recording rules, and Grafana dashboards for a specific component or system. Mixins are typically packaged using [Jsonnet](https://jsonnet.org/) and can be combined to create comprehensive monitoring configurations. They enable standardized monitoring across similar infrastructure components.

### Notification

A notification represents a group of one or more alerts, and is sent by the Alertmanager to email, Pagerduty, Slack etc.

### Promdash

Promdash was a native dashboard builder for Prometheus. It has been deprecated and replaced by [Grafana](../visualization/grafana.md).

### Prometheus

Prometheus usually refers to the core binary of the Prometheus system. It may
also refer to the Prometheus monitoring system as a whole.

### PromQL

[PromQL](/docs/prometheus/latest/querying/basics/) is the Prometheus Query Language. It allows for
a wide range of operations including aggregation, slicing and dicing, prediction and joins.

### Pushgateway

The [Pushgateway](../instrumenting/pushing.md) persists the most recent push
of metrics from batch jobs. This allows Prometheus to scrape their metrics
after they have terminated.

### Recording Rules

Recording rules precompute frequently needed or computationally expensive expressions
and save their results as a new set of time series.

### Remote Read

Remote read is a Prometheus feature that allows transparent reading of time series from
other systems (such as long term storage) as part of queries.

### Remote Read Adapter

Not all systems directly support remote read. A remote read adapter sits between
Prometheus and another system, converting time series requests and responses between them.

### Remote Read Endpoint

A remote read endpoint is what Prometheus talks to when doing a remote read.

### Remote Write

Remote write is a Prometheus feature that allows sending ingested samples on the
fly to other systems, such as long term storage.

### Remote Write Adapter

Not all systems directly support remote write. A remote write adapter sits
between Prometheus and another system, converting the samples in the remote
write into a format the other system can understand.

### Remote Write Endpoint

A remote write endpoint is what Prometheus talks to when doing a remote write.

### Sample

A sample is a single value at a point in time in a time series.

In Prometheus, each sample consists of a float64 value and a millisecond-precision timestamp.

### Silence

A silence in the Alertmanager prevents alerts, with labels matching the silence, from
being included in notifications.

### Target

A target is the definition of an object to scrape. For example, what labels to apply, any authentication required to connect, or other information that defines how the scrape will occur.

### Time Series

The Prometheus time series are streams of timestamped values belonging to the same metric and the same set of labeled dimensions.
Prometheus stores all data as time series.

