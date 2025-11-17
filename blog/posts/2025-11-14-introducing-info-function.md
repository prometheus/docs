---
title: Introducing the Experimental info() Function
created_at: 2025-11-14
kind: article
author_name: Arve Knudsen
---

Enriching metrics with metadata labels can be surprisingly tricky in Prometheus, even if you're a PromQL wiz!
Traditionally, complex PromQL join syntax is required in Prometheus to add even basic information like Kubernetes cluster names or cloud provider regions to queries.
The new, still experimental `info()` function, promises a simpler way, making label enrichment as simple as wrapping your query in a single function call.

In Prometheus 3.0, we introduced the [`info()`](https://prometheus.io/docs/prometheus/latest/querying/functions/#info) function, a powerful new way to enrich your time series with labels from info metrics.
`info` doesn't only offer a simpler syntax however.
It also solves a subtle yet critical problem that has plagued join queries for years: The "churn problem" that causes queries to fail when "non-identifying" info metric labels change.
Identifying labels here in practice means those that are joined on.

Whether you're working with OpenTelemetry resource attributes, Kubernetes labels, or any other metadata, the `info()` function makes your PromQL queries cleaner, more reliable, and easier to understand.

<!-- more -->

## The Problem: Complex Joins and The Churn Problem

Let us start by looking at what we have had to do until now.
Imagine you're monitoring HTTP request durations via OpenTelemetry and want to break them down by Kubernetes cluster.
Your metrics have `job` and `instance` labels, but the cluster name lives in a separate `target_info` metric, as the `k8s_cluster_name` label.
Here's what the traditional approach looks like:

```promql
sum by (k8s_cluster_name, http_status_code) (
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

Here's the subtle but serious problem: What happens when a Kubernetes pod gets recreated?
The `k8s_pod_name` label in `target_info` changes, and Prometheus sees this as a completely new time series.

If the old `target_info` series isn't properly marked as stale immediately, both the old and new series can exist simultaneously for up to 5 minutes (the default lookback delta).
During this overlap period, your join query finds **two distinct matching `target_info` time series** and fails with a "many-to-many matching" error.

This could in practice mean your dashboards break and your alerts stop firing when infrastructure changes are happening, perhaps precisely when you would need visibility the most.

## The Solution: Simple, Reliable Label Enrichment

The `info()` function solves both problems at once.
Here's the same query using `info()`:

```promql
sum by (k8s_cluster_name, http_status_code) (
  info(
    rate(http_server_request_duration_seconds_count[2m]),
    {k8s_cluster_name=~".+"}
  )
)
```

Much more comprehensible, no?
The real magic happens under the hood though: **`info()` automatically selects the time series with the latest sample**, eliminating churn-related join failures entirely.

### Basic Syntax

```promql
info(v instant-vector, [data-label-selector instant-vector])
```

- **`v`**: The instant vector to enrich with metadata labels
- **`data-label-selector`** (optional): Label matchers in curly braces to filter which labels to include

If you omit the second parameter, `info()` adds **all** data labels from `target_info`:

```promql
info(rate(http_server_request_duration_seconds_count[2m]))
```

### Selecting Different Info Metrics

By default, `info()` uses the `target_info` metric.
However, you can select different info metrics (like `build_info`, `node_uname_info`, or `kube_pod_labels`) by including a `__name__` matcher in the data-label-selector:

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

### Kubernetes Metadata

Enrich your metrics with Kubernetes-specific information:

```promql
# Add cluster and namespace information to request rates
info(
  sum by (job, http_status_code) (
    rate(http_server_request_duration_seconds_count[2m])
  ),
  {k8s_cluster_name=~".+", k8s_namespace_name=~".+"}
)
```

### Cloud Provider Metadata

Add cloud provider information to understand costs and performance by region:

```promql
# Enrich with AWS/GCP/Azure region and availability zone
info(
  rate(cloud_storage_request_count[5m]),
  {cloud_provider=~".+", cloud_region=~".+", cloud_availability_zone=~".+"}
)
```

## Before and After: Side-by-Side Comparison

Let's see how the `info()` function simplifies real queries:

### Example 1: Basic Label Enrichment

**Traditional approach:**
```promql
rate(http_server_request_duration_seconds_count[2m])
  * on (job, instance) group_left (k8s_cluster_name)
    target_info
```

**With info():**
```promql
info(
  rate(http_server_request_duration_seconds_count[2m]),
  {k8s_cluster_name=~".+"}
)
```

### Example 2: Aggregation with Multiple Labels

**Traditional approach:**
```promql
sum by (k8s_cluster_name, k8s_namespace_name, http_status_code) (
    rate(http_server_request_duration_seconds_count[2m])
  * on (job, instance) group_left (k8s_cluster_name, k8s_namespace_name)
    target_info
)
```

**With info():**
```promql
sum by (k8s_cluster_name, k8s_namespace_name, http_status_code) (
  info(
    rate(http_server_request_duration_seconds_count[2m]),
    {k8s_cluster_name=~".+", k8s_namespace_name=~".+"}
  )
)
```

The intent is much clearer with `info`: We're enriching `http_server_request_duration_seconds_count` with cluster and namespace information, then aggregating by those labels and `http_status_code`.

## Technical Benefits

Beyond cleaner syntax, the `info()` function provides several technical advantages:

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
Here are some simple examples to try:

```promql
# Basic usage - add all target_info labels
info(up)

# Selective enrichment - add only cluster name
info(up, {k8s_cluster_name=~".+"})

# In a real query
info(
  rate(http_server_request_duration_seconds_count[5m]),
  {k8s_cluster_name=~".+"}
)

# With aggregation
sum by (k8s_cluster_name) (
  info(up, {k8s_cluster_name=~".+"})
)
```

## Current Limitations and Future Plans

The current implementation is an **MVP (Minimum Viable Product)** designed to validate the approach and gather user feedback.
It has some intentional limitations:

### Current Constraints

1. **Default info metric:** Only considers `target_info` by default
   - Workaround: You can use `__name__` matchers like `{__name__=~"(target|build)_info"}` in the data-label-selector, though this still assumes `job` and `instance` as identifying labels

2. **Fixed identifying labels:** Always assumes `job` and `instance` are the identifying labels for joining
   - This works for most use cases but may not be suitable for all scenarios

### Future Development

These limitations are meant to be temporary.
The experimental status allows us to:
- Gather real-world usage feedback
- Understand which use cases matter the most
- Iterate on the design before committing to a final API

A future version of the `info()` function should:
- Support all info metrics (not just `target_info`)
- Dynamically determine identifying labels based on the info metric's structure

**Important:** Because this is an experimental feature, the behavior may change in future Prometheus versions, or the function could potentially be removed from PromQL entirely based on user feedback.

## Conclusion

The experimental `info()` function represents a significant step forward in making PromQL more accessible and reliable.
By simplifying metadata label enrichment and automatically handling the churn problem, it removes two major pain points for Prometheus users, especially those adopting OpenTelemetry.

We encourage you to try the `info()` function and share your feedback:
- What use cases does it solve for you?
- What additional functionality would you like to see?
- How could the API be improved?
- Do you see improved performance?

Your feedback will directly shape the future of this feature and help us determine whether it should become a permanent part of PromQL.

To learn more:
- [PromQL functions documentation](https://prometheus.io/docs/prometheus/latest/querying/functions/#info)
- [OpenTelemetry guide (includes detailed info() usage)](https://prometheus.io/docs/guides/opentelemetry/)
- [Feature proposal](https://github.com/prometheus/proposals/blob/main/proposals/0037-native-support-for-info-metrics-metadata.md)

Please feel welcome to share your thoughts with the Prometheus community on [GitHub Discussions](https://github.com/prometheus/prometheus/discussions) or get in touch with us on the [CNCF Slack #prometheus channel](https://cloud-native.slack.com/).

Happy querying!
