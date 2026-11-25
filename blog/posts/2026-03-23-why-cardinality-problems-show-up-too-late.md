---
title: Why Cardinality Problems Often Show Up Too Late
author: Ben (@yupme-bot)
date: 2026-03-23
---

High-cardinality metrics are a well-known problem in Prometheus. Most people who use Prometheus have seen the guidance: avoid labels with values that can grow without a clear bound, such as user IDs, request IDs, email addresses, session IDs, trace IDs, or full URL paths.

That guidance is correct.

The harder problem is timing.

In practice, cardinality issues often do not show up when instrumentation is written. They usually show up later, once the metrics are already being scraped, stored, queried, and operated on.

This post is about why that happens, and why cardinality problems often surface downstream from the place where they were introduced.

<!-- more -->

## What cardinality means in Prometheus

In Prometheus, data is stored as time series. Each time series is identified by a metric name and its label values.

The [Prometheus data model documentation](https://prometheus.io/docs/concepts/data_model/#metric-names-and-labels) explains that every time series is uniquely identified by its metric name and optional key-value pairs called labels.

For example:

```text
http_requests_total{method="GET", route="/users/:id", status="200"}
http_requests_total{method="POST", route="/users/:id", status="500"}
```

These are two different time series because the label values are different.

When people talk about cardinality in Prometheus, they usually mean the number of distinct time series created by metrics and labels.

This matters because every unique label combination creates another series for Prometheus to ingest, store, index, and query. The [Prometheus metric and label naming documentation](https://prometheus.io/docs/practices/naming/#labels) warns about this directly: every unique combination of key-value label pairs represents a new time series, and labels with high-cardinality values such as user IDs, email addresses, or other unbounded sets can dramatically increase stored data.

That is why labels with unbounded values are risky.

By “unbounded,” I mean values whose possible set can keep growing over time. Examples include:

- user IDs
- request IDs
- session IDs
- trace IDs
- email addresses
- raw URL paths
- customer-specific identifiers
- device IDs
- IP addresses, depending on the use case

These values are often useful data. They are just usually not good metric labels.

## The symptom: cardinality shows up late

Cardinality problems are often first noticed through downstream symptoms:

- a sudden increase in active series
- high `scrape_series_added`
- increased Prometheus memory usage
- slower queries
- larger remote write volume
- higher storage cost
- alerts from cardinality dashboards or tooling

By that point, the issue is already in the system.

The focus then shifts to mitigation: reducing label sets, dropping labels, relabeling metrics, rewriting instrumentation, or changing how telemetry is exported.

Those mitigations can help, but they happen after the high-cardinality data has already reached the metrics pipeline.

## Where the problem usually starts

The root cause is often not Prometheus itself.

The problem usually starts earlier, when instrumentation is written.

For example:

```go
counter.Add(ctx, 1,
    metric.WithAttributes(
        attribute.String("user_id", id),
        attribute.String("raw_path", request.URL.Path),
    ),
)
```

Nothing about this looks obviously dangerous in isolation.

The values are real. They are useful for debugging. They describe the request. In a code review, they can look like reasonable context to attach to telemetry.

The problem appears when those values become part of metric identity.

This is not specific to OpenTelemetry. The same pattern can happen with direct Prometheus instrumentation, custom wrappers, framework integrations, exporters, or any pipeline that turns rich request context into metric labels.

OpenTelemetry is a useful example because it makes this pattern easy to see. In the OpenTelemetry-to-Prometheus export path, metric attributes are converted to Prometheus labels. The [OpenTelemetry Prometheus/OpenMetrics compatibility specification](https://opentelemetry.io/docs/specs/otel/compatibility/prometheus_and_openmetrics/#metric-attributes) states that OpenTelemetry metric attributes must be converted to Prometheus labels.

So the risk is not only that attributes might later be copied into labels by configuration. For metric attributes, becoming labels is the expected mapping when exporting to Prometheus-compatible formats.

Resource attributes are handled separately from metric attributes, so this post is focused on metric attributes and metric labels.

For metric attributes, the design question is direct:

> Should this value be part of the identity of a metric time series?

For many request-specific values, the answer is no.

## Labels define identity

A useful way to think about this is:

> Labels are not just extra metadata. Labels define time series identity.

That is the key difference.

A log line can include a user ID without creating a new metric series for every user.

A trace span can include a request ID without creating a new metric series for every request.

But a Prometheus label is different. If a label value changes, the identity of the time series changes.

So this:

```text
http_requests_total{user_id="123"}
http_requests_total{user_id="456"}
http_requests_total{user_id="789"}
```

is not one metric with some extra detail attached.

It is three separate time series.

If `user_id` can take on 50,000 values, that one label can create up to 50,000 series for that metric before considering any other labels.

## Cardinality multiplies across labels

One reason this is easy to underestimate is that labels multiply together.

The Prometheus docs make this point in [Cardinality matters](https://prometheus.io/docs/practices/the_zen/#cardinality-matters): every unique set of labels creates a new time series, and labels are multiplicative across dimensions.

Imagine a metric with these labels:

```text
method: 5 possible values
route: 200 possible values
status: 10 possible values
user_id: 50,000 possible values
```

The possible label combinations are:

```text
5 × 200 × 10 × 50,000 = 500,000,000
```

Not every combination will necessarily appear in practice.

But the example shows the shape of the problem. One unbounded label can dominate the total series count of an otherwise reasonable metric.

Without `user_id`, the same metric has:

```text
5 × 200 × 10 = 10,000
```

That is still something to watch, but it is a very different problem from hundreds of millions of possible combinations.

## Why this is hard to catch early

There are a few reasons these issues slip through.

### Client libraries do not know intent

Instrumentation libraries usually cannot tell whether a value is safe as a label.

A string is just a string.

The library does not know whether `region` has 5 possible values or whether `user_id` has millions. It also does not know whether `raw_path` has already been normalized from `/users/123/profile` to `/users/:id/profile`.

That decision belongs to the instrumentation design.

### Local testing hides the global effect

A label can look harmless in a local test.

A developer may only see a few users, a few paths, or a few requests. In that environment, the metric looks fine.

The problem appears when the same instrumentation runs across many instances, services, tenants, paths, users, and deploys.

What looked small locally can become large globally.

### The pipeline accepts the data

Most telemetry pipelines are designed to accept and forward valid telemetry.

If the metric is syntactically valid, it will usually pass through:

```text
Code → Instrumentation → Collector → Prometheus → Detection
```

The problem is introduced near the start of the pipeline, but it is often noticed near the end.

```text
Code → Instrumentation → Collector → Prometheus → Detection
         ↑ problem introduced here
                                      ↑ problem noticed here
```

That distance creates a slow feedback loop.

### Downstream detection is reactive

Downstream checks are still useful. Dashboards, alerts, `scrape_series_added`, query analysis, and storage metrics can all reveal cardinality problems.

But by the time those signals fire, the system is already paying some cost.

This is similar to other metrics design problems: once identity has been encoded into time series, Prometheus has to ingest, store, and reason about those series. Detecting the problem later is possible, but it is more expensive than preventing it earlier.

## The timing gap

This is the core issue:

- the mistake is introduced during instrumentation
- the data flows through the pipeline as valid telemetry
- the cost appears later during scraping, storage, querying, or remote write
- the fix happens after the fact through mitigation

That timing gap is why cardinality issues can feel surprising.

The system that observes the problem is often not the system that introduced it.

Prometheus may be where the symptom becomes visible, but the decision that created the series count often happened earlier, in application code or telemetry configuration.

## Practical ways to reduce the gap

There is no single fix, but a few practices help.

### Define which labels are allowed

For important metrics, define the expected label set deliberately.

For example:

```text
Good labels:
- method
- normalized route
- status code
- service
- region

Risky labels:
- user_id
- request_id
- session_id
- raw path
- email
- trace_id
```

This makes label choice a design decision instead of an incidental side effect of whatever context is available.

### Normalize values before they become labels

Raw paths are a common example.

Instead of:

```text
/users/123/profile
/users/456/profile
/users/789/profile
```

prefer:

```text
/users/:id/profile
```

The normalized route preserves the useful dimension without creating a new series for every user.

### Estimate label cardinality during review

A simple review question helps:

> Roughly how many values can this label have?

Then ask the same question across labels.

If a metric has multiple labels, multiply the approximate cardinality of each independent label.

This does not need to be perfect. Even rough estimates can reveal risky designs early.

For example:

```text
method × route × status × tenant
```

may be fine if each label has a known bound.

But:

```text
method × route × status × user_id
```

is usually a warning sign.

### Be careful with metric attributes that become labels

Not every useful piece of telemetry context should become a metric attribute.

This is especially important when metrics may be exported to Prometheus-compatible formats, because OpenTelemetry metric attributes are converted to Prometheus labels in that path.

Attributes can be useful in traces, logs, exemplars, or debugging contexts without being safe as metric labels.

Before adding a metric attribute, ask whether the value should define a new time series.

A good rule of thumb:

> If the value identifies a specific request, user, session, trace, or object instance, it probably should not be a metric label.

### Move feedback closer to instrumentation

The earlier this feedback appears, the cheaper it is to fix.

That feedback can come from:

- instrumentation review checklists
- metric naming and label conventions
- static checks
- CI checks
- collector configuration reviews
- generated cardinality estimates
- dashboards that highlight new labels and series growth soon after deploys

The goal is not to replace Prometheus-side detection.

The goal is to avoid relying on Prometheus as the first place the problem becomes visible.

## Closing thoughts

Cardinality issues are not new. The guidance around them is well established.

What is less obvious is how easy it is to introduce a cardinality problem early and only discover it later.

A line of instrumentation can look reasonable in code review. A telemetry pipeline can accept it. Prometheus can scrape it. Only after the series count grows does the cost become obvious.

That makes cardinality not just a storage concern, but a feedback-loop concern.

The usual mitigations still matter: reduce labels, normalize values, drop unsafe dimensions, and avoid unbounded labels.

But it is worth thinking more about where the feedback happens.

If cardinality feedback moves closer to where instrumentation is written, teams can catch these problems while they are still design choices, rather than production incidents.
