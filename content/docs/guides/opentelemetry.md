---
title: OpenTelemetry
---

# Using Prometheus as your OpenTelemetry backend

Prometheus supports [OTLP](https://opentelemetry.io/docs/specs/otlp) (aka "OpenTelemetry Protocol") ingestion through [HTTP](https://opentelemetry.io/docs/specs/otlp/#otlphttp).

## Enable the OTLP receiver

By default, the OTLP receiver is disabled. This is because Prometheus can work without any authentication, so it would not be safe to accept incoming traffic unless explicitly configured.

To enable the receiver you need to toggle the flag `--enable-feature=otlp-write-receiver`.

```shell
$ prometheus --enable-feature=otlp-write-receiver
```

## Enable out-of-order ingestion

There are multiple reasons why you might want to enable out-of-order ingestion.

For example, the OpenTelemetry collector encourages batching and you could have multiple replicas of the collector sending data to Prometheus. Because there is no mechanism ordering those samples they could get out-of-order.

To enable out-of-order ingestion you need to extend the Prometheus configuration file with the following:

```shell
storage:
  tsdb:
    out_of_order_time_window: 30m
```

30 minutes of out-of-order have been enough for most cases but don't hesitate to adjust this value to your needs.

## Promoting resource attributes

Based on experience and conversations with our community, we've found that out of all the commonly seen resource attributes, these are the ones that are most frequently promoted by our users:

```yaml
- service.instance.id
- service.name
- service.namespace
- cloud.availability_zone
- cloud.region
- container.name
- deployment.environment
- k8s.cluster.name
- k8s.container.name
- k8s.cronjob.name
- k8s.daemonset.name
- k8s.deployment.name
- k8s.job.name
- k8s.namespace.name
- k8s.pod.name
- k8s.replicaset.name
- k8s.statefulset.name
```

By default Prometheus won't be promoting any attributes. If you'd like to promote any of them, you can do so in this section of the Prometheus configuration file:

```yaml
otlp:
  resource_attributes:
    - service.instance.id
    - deployment.environment
    - k8s.cluster.name
    - ...
```

## UTF-8

The UTF-8 support for Prometheus is not ready yet so both the Prometheus Remote Write Exporter and the OTLP Ingestion endpoint still rely on the [Prometheus normalization translator package from OpenTelemetry](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/pkg/translator/prometheus).

So if you are sending non-valid characters to Prometheus, they will be replaced with an underscore `_` character.

Once the UTF-8 feature is merged into Prometheus, we will revisit this.

## Delta Temporality

The [OpenTelemetry specification says](https://opentelemetry.io/docs/specs/otel/metrics/data-model/#temporality) that both Delta temporality and Cumulative temporality are supported.

While Delta temporality is common in systems like statsd and graphite, cumulative temporality is the default temporality for Prometheus.

Today Prometheus does not have support for delta temporality but we are learning from the OpenTelemetry community and we are considering adding support for it in the future.

If you are coming from a delta temporality system we recommend that you use the [delta to cumulative processor](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/processor/deltatocumulativeprocessor) in your OTel pipeline.
