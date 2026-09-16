---
title: Understanding metric types
sort_rank: 2
---

Follow the [Prometheus quickstart](../introduction/first_steps.md) to run a server that scrapes itself, then open its expression browser at `http://localhost:9090/query`. For definitions of the metric types, see [Metric types](../concepts/metric_types.md). Here we will practice querying them instead of repeating those definitions.

## Counter

Enter `promhttp_metric_handler_requests_total` in the expression browser and click **Execute**. Refresh `http://localhost:9090/metrics` a few times to create requests, then execute the query again. To see requests per second over a five-minute window, try:

```promql
rate(promhttp_metric_handler_requests_total[5m])
```

Allow a few scrapes before evaluating `rate()`, since it needs at least two samples in the window.

## Gauge

Try `process_resident_memory_bytes` to inspect the Prometheus process's current memory use. Compare its current value to the highest value seen over five minutes:

```promql
max_over_time(process_resident_memory_bytes[5m])
```

## Histogram

Look for `prometheus_http_request_duration_seconds_bucket` in the expression browser. Each returned series is a cumulative bucket with an `le` label; the available labels and values depend on your Prometheus version and traffic. To estimate the 90th percentile request duration from the bucket rates, run:

```promql
histogram_quantile(0.9, sum by (le) (rate(prometheus_http_request_duration_seconds_bucket[5m])))
```

If the metric has no samples yet, make a few HTTP requests to Prometheus and wait for another scrape. For details on how buckets and quantiles work, return to [Metric types](../concepts/metric_types.md#histogram).

## Summary

If one of your scrape targets exposes a summary, look for its `_sum` and `_count` series in the expression browser. For example, a summary named `example_duration_seconds` exposes `example_duration_seconds_sum` and `example_duration_seconds_count`. Whether a live summary is available depends on the instrumentation of your targets; see [Metric types](../concepts/metric_types.md#summary) for its semantics and aggregation limits.
