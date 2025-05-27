---
title: OpenTelemetry
---

# Using Prometheus as your OpenTelemetry backend

Prometheus supports [OTLP](https://opentelemetry.io/docs/specs/otlp) (aka "OpenTelemetry Protocol") ingestion through [HTTP](https://opentelemetry.io/docs/specs/otlp/#otlphttp).

## Enable the OTLP receiver

By default, the OTLP receiver is disabled, similarly to the Remote Write receiver.
This is because Prometheus can work without any authentication, so it would not be
safe to accept incoming traffic unless explicitly configured.

To enable the receiver you need to toggle the CLI flag `--web.enable-otlp-receiver`.
This will cause Prometheus to serve OTLP metrics receiving on HTTP `/api/v1/otlp/v1/metrics` path.

```shell
$ prometheus --web.enable-otlp-receiver
```

## Send OpenTelemetry Metrics to the Prometheus Server

Generally you need to tell the source of the OTLP metrics traffic about Prometheus endpoint and the fact that the
[HTTP](https://opentelemetry.io/docs/specs/otlp/#otlphttp) mode of OTLP should be used (gRPC is usually a default).

OpenTelemetry SDKs and instrumentation libraries can be usually configured via [standard environment variables](https://opentelemetry.io/docs/languages/sdk-configuration/). The following are the OpenTelemetry variables needed to send OpenTelemetry metrics to a Prometheus server on localhost:

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

## Configuring Prometheus

This section explains various recommended configuration aspects of Prometheus server to enable and tune your OpenTelemetry flow.

See the example Prometheus configuration [file](https://github.com/prometheus/prometheus/blob/main/documentation/examples/prometheus-otlp.yml)
we will use in the below section.

### Enable out-of-order ingestion

There are multiple reasons why you might want to enable out-of-order ingestion.

For example, the OpenTelemetry collector encourages batching and you could have multiple replicas of the collector sending data to Prometheus. Because there is no mechanism ordering those samples they could get out-of-order.

To enable out-of-order ingestion you need to extend the Prometheus configuration file with the following:

```shell
storage:
  tsdb:
    out_of_order_time_window: 30m
```

30 minutes of out-of-order have been enough for most cases but don't hesitate to adjust this value to your needs.

### Promoting resource attributes

Based on experience and conversations with our community, we've found that out of all the commonly seen resource attributes,
there are certain worth attaching to all your OTLP metrics.

By default, Prometheus won't be promoting any attributes. If you'd like to promote any
of them, you can do so in this section of the Prometheus configuration file. The following
snippet shares the best practice set of attributes to promote:

```yaml
otlp:
  # Recommended attributes to be promoted to labels.
  promote_resource_attributes:
    - service.instance.id
    - service.name
    - service.namespace
    - service.version
    - cloud.availability_zone
    - cloud.region
    - container.name
    - deployment.environment
    - deployment.environment.name
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

## Including resource attributes at query time

All non-promoted, more verbose or unique labels are attached to a special `target_info`.

You can use this metric to join some labels on query time.

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

By default `service.name`, `service.namespace` and `service.instance.id` themselves are not added to `target_info`, because they are converted into `job` and `instance`. However the following configuration parameter can be enabled to add them to `target_info` directly (going through normalization to replace dots with underscores, if `otlp.translation_strategy` is `UnderscoreEscapingWithSuffixes`) on top of the conversion into `job` and `instance`.

```
otlp:
  keep_identifying_resource_attributes: true
```

The rest of the resource attributes are also added as labels to the `target_info` series, names converted to Prometheus format (e.g. dots converted to underscores) if `otlp.translation_strategy` is `UnderscoreEscapingWithSuffixes`.
If a resource lacks both `service.instance.id` and `service.name` attributes, no corresponding `target_info` series is generated.

For each of a resource's OTel metrics, Prometheus converts it to a corresponding Prometheus time series, and (if `target_info` is generated) adds the right `instance` and `job` labels.

## UTF-8

From the 3.x version, Prometheus supports UTF-8 for metric names and labels, so [Prometheus normalization translator package from OpenTelemetry](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/pkg/translator/prometheus) can be omitted. Note that when Prometheus announces through content negotiation that it allows UTF-8 characters, it does not require that metric names contain previously-unsupported characters. The OTLP metrics may be converted in several different ways, depending on the configuration of the endpoint. So while UTF-8 is enabled by default in Prometheus storage and UI, you need to set the `translation_strategy` for OTLP metrics receiver, which by default is set to old normalization `UnderscoreEscapingWithSuffixes`.

There are three possible translation strategies, two of which require UTF-8 support to be enabled in Prometheus:

* `UnderscoreEscapingWithSuffixes`, the default. This fully escapes metric names for classic [Prometheus metric name compatibility](https://prometheus.io/docs/practices/naming/), and includes appending type and unit suffixes.
* `NoUTF8EscapingWithSuffixes` will disable changing special characters to `_` which allows native use of OpenTelemetry metric format, especially with [the semantic conventions](https://opentelemetry.io/docs/specs/semconv/general/metrics/). Note that special suffixes like units and `_total` for counters will be attached to prevent possible collisions with multiple metrics of the same name having different type or units. This mode requires UTF-8 to be enabled.
* `NoTranslation`. This strategy bypasses all metric and label name translation, passing them through unaltered. This mode requires UTF-8 to be enabled. Note that without suffixes, it is possible to have collisions when multiple metrics of the same name have different type or units.

```
otlp:
  # Ingest OTLP data keeping UTF-8 characters in metric/label names.
  translation_strategy: NoTranslation
```

## Delta Temporality

The [OpenTelemetry specification says](https://opentelemetry.io/docs/specs/otel/metrics/data-model/#temporality) that both Delta temporality and Cumulative temporality are supported. While delta temporality is common in systems like statsd and graphite, cumulative temporality is the default in Prometheus.

Today, Prometheus embeds the [delta to cumulative processor](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/processor/deltatocumulativeprocessor) from [OpenTelemetry-Collector-contrib](https://github.com/open-telemetry/opentelemetry-collector-contrib), which is capable of ingesting deltas and transforming them into the equivalent cumulative representation before storing in Prometheus' TSDB.

This feature is ***experimental***, so start Prometheus with the feature-flag `otlp-deltatocumulative` enabled to use it.

The team is still working on a more efficient way of handling OTLP deltas.
