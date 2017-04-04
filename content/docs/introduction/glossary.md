---
title: Glossary
sort_rank: 8
---

# Glossary


### Alert

An alert is the outcome of an alerting rule in Prometheus that is
actively firing. Alerts are sent from Prometheus to the Alertmanager.

### Alertmanager

The [Alertmanager](../../alerting/overview/) takes in alerts, aggregates them into
groups, de-duplicates, applies silences, throttles, and then sends out
notifications to email, Pagerduty, Slack etc.

### Bridge

A bridge is a component that takes samples from a client library and
exposes them to a non-Prometheus monitoring system. For example the Python
client can export metrics to Graphite.

### Client library

A client library is a library in some language (e.g. Go, Java, Python, Ruby)
that makes it easy to directly instrument your code, write custom collectors to
pull metrics from other systems and expose the metrics to Prometheus.

### Collector

A collector is a part of an exporter that represents a set of metrics. It may be
a single metric as part of direct instrumentation, or many metrics if it is pulling
metrics from another system.

### Direct instrumentation

Direct instrumentation is when instrumentation is added inline as part the source code
of a program.

### Exporter

An exporter is a binary that exposes Prometheus metrics, commonly by converting
metrics that are exposed in a non-Prometheus format into a format Prometheus supports.

### Notification

A notification represents a group or one of more alerts, and is sent by the Alertmanager
to email, Pagerduty, Slack etc.

### Promdash

[Promdash](../../visualization/promdash/) is a Ruby-on-Rails dashboard builder for Prometheus.
It is similar at a high-level to Grafana, but is specific to Prometheus.

### Prometheus

Prometheus usually refers to the core binary of the Prometheus system. It may
also refer to the Prometheus monitoring system as a whole.

### PromQL

[PromQL](../../querying/basics/) is the Prometheus Query Language. It allows for
a wide range of operations including aggregation, slicing and dicing, prediction and joins.

### Pushgateway

The [Pushgateway](../../instrumenting/pushing/) persists the most recent push
of metrics from batch jobs. This allows Prometheus to scrape their metrics
after they have terminated.

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

### Silence

A silence in the Alertmanager prevents alerts with labels matching the silence from
being included in notifications.

### Target

One application, server or endpoint that Prometheus is scraping.
