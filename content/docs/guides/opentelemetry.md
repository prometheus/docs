---
title: OpenTelemetry
---

# Using Prometheus as your OpenTelemetry backend

Prometheus supports [OTLP](https://opentelemetry.io/docs/specs/otlp) (aka "OpenTelemetry Protocol") ingestion through [HTTP](https://opentelemetry.io/docs/specs/otlp/#otlphttp).

## Enable the OTLP receiver

By default, the OTLP receiver is disabled. This is because Prometheus can work without any authentication, so it would not be safe to accept incoming traffic unless explicitly configured.

To enable the receiver you need to toggle the flag `--web.enable-otlp-receiver`.

```shell
$ prometheus --enable-feature=otlp-write-receiver
```

## Send OpenTelemetry Metrics to the Prometheus Server

OpenTelemetry SDKs and instrumentation libraries can be configured via [standard environment variables](https://opentelemetry.io/docs/languages/sdk-configuration/). The following are the OpenTelemetry variables needed to send OpenTelemetry metrics to a Prometheus server on localhost:

```shell
export OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
export OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=http://localhost:9090/api/v1/otlp/v1/metrics
```

Turn off traces and logs:

```shell
export OTEL_TRACES_EXPORTER=none
export OTEL_LOGS_EXPORTER=none
```

The default push interval for OpenTelemetry metrics is 60 seconds. The following will set a 15 second push interval:

```shell
export OTEL_METRIC_EXPORT_INTERVAL=15000
```

If your instrumentation library does not provide `service.name` and `service.instance.id` out-of-the-box, it is highly recommended to set them.

```shell
export OTEL_SERVICE_NAME="my-example-service"
export OTEL_RESOURCE_ATTRIBUTES="service.instance.id=$(uuidgen)"
```

The above assumes that `uuidgen` command is available on your system. Make sure that `service.instance.id` is unique for each instance, and that a new `service.instance.id` is generated whenever a resource attribute chances. The [recommended](https://github.com/open-telemetry/semantic-conventions/tree/main/docs/resource) way is to generate a new UUID on each startup of an instance.

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

## Including resource attributes at query time

An alternative to promoting resource attributes, as described in the previous section, is to add labels from the `target_info` metric when querying.

This is conceptually known as a "join" query.
An example of such a query can look like the following:

```promql
rate(http_server_request_duration_seconds_count[2m])
* on (job, instance) group_left (k8s_cluster_name)
target_info
```

What happens in this query is that the time series resulting from `rate(http_server_request_duration_seconds_count[2m])` are augmented with the `k8s_cluster_name` label from the `target_info` series that share the same `job` and `instance` labels.
In other words, the `job` and `instance` labels are shared between `http_server_request_duration_seconds_count` and `target_info`, akin to SQL foreign keys.
The `k8s_cluster_name` label, On the other hand, corresponds to the OTel resource attribute `k8s.cluster.name` (Prometheus converts dots to underscores).

So, what is the relation between the `target_info` metric and OTel resource attributes?
When Prometheus processes an OTLP write request, and provided that contained resources include the attributes `service.instance.id` and/or `service.name`, Prometheus generates the info metric `target_info` for every (OTel) resource.
It adds to each such `target_info` series the label `instance` with the value of the `service.instance.id` resource attribute, and the label `job` with the value of the `service.name` resource attribute.
If the resource attribute `service.namespace` exists, it's prefixed to the `job` label value (i.e., `<service.namespace>/<service.name>`).
The rest of the resource attributes are also added as labels to the `target_info` series, names converted to Prometheus format (e.g. dots converted to underscores).
If a resource lacks both `service.instance.id` and `service.name` attributes, no corresponding `target_info` series is generated.

For each of a resource's OTel metrics, Prometheus converts it to a corresponding Prometheus time series, and (if `target_info` is generated) adds the right `instance` and `job` labels.

## UTF-8

The UTF-8 support for Prometheus is not ready yet so both the Prometheus Remote Write Exporter and the OTLP Ingestion endpoint still rely on the [Prometheus normalization translator package from OpenTelemetry](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/pkg/translator/prometheus).

So if you are sending non-valid characters to Prometheus, they will be replaced with an underscore `_` character.

Once the UTF-8 feature is merged into Prometheus, we will revisit this.

## Delta Temporality

The [OpenTelemetry specification says](https://opentelemetry.io/docs/specs/otel/metrics/data-model/#temporality) that both Delta temporality and Cumulative temporality are supported.

While Delta temporality is common in systems like statsd and graphite, cumulative temporality is the default temporality for Prometheus.

Today Prometheus does not have support for delta temporality but we are learning from the OpenTelemetry community and we are considering adding support for it in the future.

If you are coming from a delta temporality system we recommend that you use the [delta to cumulative processor](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/processor/deltatocumulativeprocessor) in your OTel pipeline.
