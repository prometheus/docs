---
title: "Why Cardinality Problems Often Show Up Too Late"
author: Ben (@yupme-bot)
date: 2026-03-23
---

High-cardinality metrics are a well-known problem in Prometheus. Most people are familiar with the guidance: avoid labels with unbounded values like user IDs, request IDs, or full URL paths.

In practice though, these issues often do not show up until much later—usually once metrics are already being scraped and stored.

This post is about why that happens, and why cardinality problems tend to surface downstream rather than where they are actually introduced.

<!-- more -->

## The symptom: cardinality shows up late

In Prometheus, every unique combination of label values creates a new time series. When high-entropy values are used as labels, the number of series can grow quickly.

This is usually first noticed through things like `scrape_series_added`, memory pressure, or slow queries.

By that point, the issue is already in the system, and the focus shifts to mitigation—reducing label sets, relabeling, or rewriting instrumentation.

## Where the problem actually starts

The root cause is usually not in Prometheus itself, but earlier in the pipeline.

With OpenTelemetry-style instrumentation, it is very easy to attach rich context as attributes:

```go
attribute.String("user_id", id)
attribute.String("path", request.URL.Path)
```

Nothing about this looks wrong in isolation.

But if those values end up as labels downstream, each distinct value becomes a new time series.

A single line attaching a highly variable value as an attribute can look completely reasonable in a code review.

At moderate traffic, this can quickly translate into very large numbers of distinct series if those values are converted into labels downstream.

The instrumentation accepts it, the collector passes it through, and the impact only becomes visible once the data reaches storage.

## Why it is hard to catch early

There are a few reasons this slips through:

### Client libraries don’t know intent

Instrumentation libraries cannot reliably tell whether a value is bounded or not.

### The distributed multiplier

A label that looks “safe” in a single process can become problematic when scaled across many instances. What looks like a small number of values locally can turn into a much larger cardinality footprint globally.

A label that produces a modest number of values in a single process can still explode into a much larger overall series count when scaled across many instances.

### Guidance exists, but is not visible at the right time

The docs are clear about avoiding high-cardinality labels, but that guidance is not always present when writing instrumentation.

### The impact is delayed

The effect only becomes visible once the data is ingested and stored, which makes the feedback loop slow.

## The timing gap

This creates a gap in the pipeline:

```
Code → Instrumentation → Collector → Prometheus → Detection

         ↑ problem introduced here
                                   ↑ problem noticed here
```

This is often where the confusion comes from: the system that observes the problem is not the system that introduced it.

The gap between where the issue is introduced and where it becomes visible is often surprisingly large.

- The issue is introduced early, during instrumentation
- It becomes visible late, during scraping and storage
- It is fixed after the fact, through mitigation

By the time it is noticed, it is often already affecting production systems.

Most solutions today focus on reducing the impact—normalizing values, limiting label sets, or making attribute-to-label conversion opt-in.

## Practical takeaways

There is no single fix, but a few patterns help:

- **Think about identity vs. data**  
  Labels define identity. Frequently changing values usually do not belong there.

- **Normalize where possible**  
  For example, `/user/123/profile` can often be represented as `/user/:id/profile`.

- **Be careful with attribute-to-label conversion**  
  Not every attribute needs to become a metric label.

- **Treat cardinality as a design concern**  
  It is much easier to avoid these issues up front than to fix them later.

## Closing thoughts

Cardinality issues are not new, and the guidance around them is well established.

What is less obvious is how easy it is to introduce them early and only discover them later.

Most of the ecosystem today focuses on managing the impact once high-cardinality data reaches storage.

It may be worth thinking more about how to surface that feedback earlier—closer to where instrumentation is written.

Shortening that feedback loop, whether through better tooling, reviews, or automated checks, could help turn cardinality management from a reactive problem into something that is caught during development.
