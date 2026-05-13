---
title: Introducing the Experimental info() Function
created_at: 2025-12-16
kind: article
author_name: Arve Knudsen
---

Enriching metrics with metadata labels can be surprisingly tricky in Prometheus, even if you're a PromQL wiz!
The PromQL join query traditionally used for this is inherently quite complex because it has to specify the labels to join on, the info metric to join with, and the labels to enrich with. 
The new, still experimental `info()` function, promises a simpler way, making label enrichment as simple as wrapping your query in a single function call.

In Prometheus 3.0, we introduced the [`info()`](https://prometheus.io/docs/prometheus/latest/querying/functions/#info) function, a powerful new way to enrich your time series with labels from info metrics.
What's special about `info()` versus the traditional join query technique is that it relieves you from having to specify _identifying labels_, which info metric(s) to join with, and the ("data" or "non-identifying") labels to enrich with.
Note that "identifying labels" in this particular context refers to the set of labels that identify the info metrics in question, and are shared with associated non-info metrics.
They are the labels you would join on in a Prometheus [join query](https://grafana.com/blog/2021/08/04/how-to-use-promql-joins-for-more-effective-queries-of-prometheus-metrics-at-scale).
Conceptually, they can be compared to [foreign keys](https://en.wikipedia.org/wiki/Foreign_key) in relational databases.

Beyond the main functionality, `info()` also solves a subtle yet critical problem that has plagued join queries for years: The "churn problem" that causes queries to fail when non-identifying info metric labels change, combined with missing staleness marking (as is the case with OTLP ingestion).

Whether you're working with OpenTelemetry resource attributes, Kubernetes labels, or any other metadata, the `info()` function makes your PromQL queries cleaner, more reliable, and easier to understand.

<!-- more -->

## The Problem: Complex Joins and The Churn Problem

Let us start by looking at what we have had to do until now.
Imagine you're monitoring HTTP request durations via OpenTelemetry and want to break them down by Kubernetes cluster.
You push your metrics to Prometheus' OTLP endpoint.
Your metrics have `job` and `instance` labels, but the cluster name lives in a separate `target_info` metric, as the `k8s_cluster_name` label.
Here's what the traditional approach looks like:

```promql
sum by (http_status_code, k8s_cluster_name) (
    rate(http_server_request_duration_seconds_count[2m])
  * on (job, instance) group_left (k8s_cluster_name)
    target_info
)
```

While this works, there are several issues:

**1. Complexity:** You need to know:
- Which info metric contains your labels (`target_info`)
- Which labels are the "identifying" labels to join on (`job`, `instance`)
- Which data labels you want to add (`k8s_cluster_name`)
- The proper PromQL join syntax (`on`, `group_left`)

This requires expert-level PromQL knowledge and makes queries harder to read and maintain.

**2. The Churn Problem (The Critical Issue):**

Here's the subtle but serious problem: What happens when an OTel resource attribute changes in a Kubernetes container, while the identifying resource attributes stay the same?
An example could be the resource attribute `k8s.pod.labels.app.kubernetes.io/version`.
Then the corresponding `target_info` label `k8s_pod_labels_app_kubernetes_io_version` changes, and Prometheus sees a completely new `target_info` time series.

As the OTLP endpoint doesn't mark the old `target_info` series as stale, both the old and new series can exist simultaneously for up to 5 minutes (the default lookback delta).
During this overlap period, your join query finds **two distinct matching `target_info` time series** and fails with a "many-to-many matching" error.

This could in practice mean your dashboards break and your alerts stop firing when infrastructure changes are happening, perhaps precisely when you would need visibility the most.

### The Info Function Presents a Solution

The previous join query can be converted to use the `info` function as follows:

```promql
sum by (http_status_code, k8s_cluster_name) (
  info(rate(http_server_request_duration_seconds_count[2m]))
)
```

Much more comprehensible, isn't it?
As regards solving the churn problem, the real magic happens under the hood: **`info()` automatically selects the time series with the latest sample**, eliminating churn-related join failures entirely.
Note that this call to `info()` returns all data labels from `target_info`, but it doesn't matter because we aggregate them away with `sum`.

## Basic Syntax

```promql
info(v instant-vector, [data-label-selector instant-vector])
```

- **`v`**: The instant vector to enrich with metadata labels
- **`data-label-selector`** (optional): Label matchers in curly braces to filter which labels to include

In its most basic form, omitting the second parameter, `info()` adds **all** data labels from `target_info`:

```promql
info(rate(http_server_request_duration_seconds_count[2m]))
```

Through the second parameter on the other hand, you can control which data labels to include from `target_info`:

```promql
info(
  rate(http_server_request_duration_seconds_count[2m]),
  {k8s_cluster_name=~".+"}
)
```

In the example above, `info()` includes the `k8s_cluster_name` data label from `target_info`.
Because the selector matches any non-empty string, it will include any `k8s_cluster_name` label value.

It's also possible to filter which `k8s_cluster_name` label values to include:

```promql
info(
  rate(http_server_request_duration_seconds_count[2m]),
  {k8s_cluster_name="us-east-0"}
)
```

## Selecting Different Info Metrics

By default, `info()` uses the `target_info` metric.
However, you can select different info metrics (like `build_info` or `node_uname_info`) by including a `__name__` matcher in the data-label-selector:

```promql
# Use build_info instead of target_info
info(up, {__name__="build_info"})

# Use multiple info metrics (combines labels from both)
info(up, {__name__=~"(target|build)_info"})

# Select build_info and only include the version label
info(up, {__name__="build_info", version=~".+"})
```

**Note:** The current implementation always uses `job` and `instance` as the identifying labels for joining, regardless of which info metric you select.
This works well for most standard info metrics but may have limitations with custom info metrics that use different identifying labels.
An example of an info metric that has different identifying labels than `job` and `instance` is `kube_pod_labels`, its identifying labels are instead: `namespace` and `pod`.
The intention is that `info()` in the future knows which metrics in the TSDB are info metrics and automatically uses all of them, unless the selection is explicitly restricted by a name matcher like the above, and which are the identifying labels for each info metric.

## Real-World Use Cases

### OpenTelemetry Integration

The primary driver for the `info()` function is [OpenTelemetry](https://prometheus.io/blog/2024/03/14/commitment-to-opentelemetry/) (OTel) integration.
When using Prometheus as an OTel backend, resource attributes (metadata about the metrics producer) are automatically converted to the `target_info` metric:

- `service.instance.id` → `instance` label
- `service.name` → `job` label
- `service.namespace` → prefixed to `job` (i.e., `<namespace>/<service.name>`)
- All other resource attributes → data labels on `target_info`

This means that, so long as at least either the `service.instance.id` or the `service.name` resource attribute is included, every OTel metric you send to Prometheus over OTLP can be enriched with resource attributes using `info()`:

```promql
# Add all OTel resource attributes
info(rate(http_server_request_duration_seconds_sum[5m]))

# Add only specific attributes
info(
  rate(http_server_request_duration_seconds_sum[5m]),
  {k8s_cluster_name=~".+", k8s_namespace_name=~".+", k8s_pod_name=~".+"}
)
```

### Build Information

Enrich your metrics with build-time information:

```promql
# Add version and branch information to request rates
sum by (job, http_status_code, version, branch) (
  info(
    rate(http_server_request_duration_seconds_count[2m]),
    {__name__="build_info"}
  )
)
```

### Filter on Producer Version

Pick only metrics from certain producer versions:

```promql
sum by (job, http_status_code, version) (
  info(
    rate(http_server_request_duration_seconds_count[2m]),
    {__name__="build_info", version=~"2\\..+"}
  )
)
```

## Before and After: Side-by-Side Comparison

Let's see how the `info()` function simplifies real queries:

### Example 1: OpenTelemetry Resource Attribute Enrichment

**Traditional approach:**
```promql
sum by (http_status_code, k8s_cluster_name, k8s_namespace_name, k8s_container_name) (
    rate(http_server_request_duration_seconds_count[2m])
  * on (job, instance) group_left (k8s_cluster_name, k8s_namespace_name, k8s_container_name)
    target_info
)
```

**With info():**
```promql
sum by (http_status_code, k8s_cluster_name, k8s_namespace_name, k8s_container_name) (
  info(rate(http_server_request_duration_seconds_count[2m]))
)
```

The intent is much clearer with `info`: We're enriching `http_server_request_duration_seconds_count` with Kubernetes related OpenTelemetry resource attributes.

### Example 2: Filtering by Label Value

**Traditional approach:**
```promql
sum by (http_status_code, k8s_cluster_name) (
    rate(http_server_request_duration_seconds_count[2m])
  * on (job, instance) group_left (k8s_cluster_name)
    target_info{k8s_cluster_name=~"us-.*"}
)
```

**With info():**
```promql
sum by (http_status_code, k8s_cluster_name) (
  info(
    rate(http_server_request_duration_seconds_count[2m]),
    {k8s_cluster_name=~"us-.*"}
  )
)
```

Here we filter to only include metrics from clusters in the US (which names start with `us-`). The `info()` version integrates the filter naturally into the data-label-selector.

## Technical Benefits

Beyond the fundamental UX benefits, the `info()` function provides several technical advantages:

### 1. Automatic Churn Handling

As previously mentioned, `info()` automatically picks the matching info time series with the latest sample when multiple versions exist.
This eliminates the "many-to-many matching" errors that plague traditional join queries during churn.

**How it works:** When non-identifying info metric labels change (e.g., a pod is re-created), there's a brief period where both old and new series might exist.
The `info()` function simply selects whichever has the most recent sample, ensuring your queries keep working.

### 2. Better Performance

The `info()` function is more efficient than traditional joins:
- Only selects matching info series
- Avoids unnecessary label matching operations
- Optimized query execution path

## Getting Started

The `info()` function is experimental and must be enabled via a feature flag:

```bash
prometheus --enable-feature=promql-experimental-functions
```

Once enabled, you can start using it immediately.

## Current Limitations and Future Plans

The current implementation is an **MVP (Minimum Viable Product)** designed to validate the approach and gather user feedback.
The implementation has some intentional limitations:

### Current Constraints

1. **Default info metric:** Only considers `target_info` by default
   - Workaround: You can use `__name__` matchers like `{__name__=~"(target|build)_info"}` in the data-label-selector, though this still assumes `job` and `instance` as identifying labels

2. **Fixed identifying labels:** Always assumes `job` and `instance` are the identifying labels for joining
   - This unfortunately makes `info()` unsuitable for certain scenarios, e.g. including data labels from `kube_pod_labels`, but it's a problem we want to solve in the future

### Future Development

These limitations are meant to be temporary.
The experimental status allows us to:
- Gather real-world usage feedback
- Understand which use cases matter the most
- Iterate on the design before committing to a final API

A future version of the `info()` function should:
- Consider all info metrics by default (not just `target_info`)
- Automatically understand identifying labels based on info metric metadata

**Important:** Because this is an experimental feature, the behavior may change in future Prometheus versions, or the function could potentially be removed from PromQL entirely based on user feedback.

## Giving Feedback

Your feedback will directly shape the future of this feature and help us determine whether it should become a permanent part of PromQL.
Feedback may be provided e.g. through our [community connections](https://prometheus.io/community/#community-connections) or by opening a [Prometheus issue](https://github.com/prometheus/prometheus/issues).

We encourage you to try the `info()` function and share your feedback:
- What use cases does it solve for you?
- What additional functionality would you like to see?
- How could the API be improved?
- Do you see improved performance?

## Conclusion

The experimental `info()` function represents a significant step forward in making PromQL more accessible and reliable.
By simplifying metadata label enrichment and automatically handling the churn problem, it removes two major pain points for Prometheus users, especially those adopting OpenTelemetry.

To learn more:
- [PromQL functions documentation](https://prometheus.io/docs/prometheus/latest/querying/functions/#info)
- [OpenTelemetry guide (includes detailed info() usage)](https://prometheus.io/docs/guides/opentelemetry/)
- [Feature proposal](https://github.com/prometheus/proposals/blob/main/proposals/0037-native-support-for-info-metrics-metadata.md)

Please feel welcome to share your thoughts with the Prometheus community on [GitHub Discussions](https://github.com/prometheus/prometheus/discussions) or get in touch with us on the [CNCF Slack #prometheus channel](https://cloud-native.slack.com/).

Happy querying!
