---
title: Our commitment to OpenTelemetry
created_at: 2024-03-13
kind: article
author_name: Goutham Veeramachaneni (@Gouthamve) and Carrie Edwards (@carrieedwards)
---

*The [OpenTelemetry project](https://opentelemetry.io/) is an Observability framework and toolkit designed to create and manage telemetry data such as traces, metrics, and logs. It is gaining widespread adoption due to its consistent specification between signals and promise to reduce vendor lock-in which is something that we’re excited about.*

## Looking back at 2023

Over the past few years, we have collaborated with the OpenTelemetry community to make sure that OpenTelemetry and Prometheus support each other bidirectionally. This led to the drafting of the official specification to convert between the two systems, as well as the implementations that allow you to ingest Prometheus metrics into OpenTelemetry Collector and vice-versa.

Since then, we have spent a significant amount of time understanding the [challenges faced by OpenTelemetry users](https://docs.google.com/document/d/1epvoO_R7JhmHYsII-GJ6Yw99Ky91dKOqOtZGqX7Bk0g/edit?usp=sharing) when storing their metrics in Prometheus and based on those, explored [how we can address them](https://docs.google.com/document/d/1NGdKqcmDExynRXgC_u1CDtotz9IUdMrq2yyIq95hl70/edit?usp=sharing). Some of the changes proposed need careful considerations to avoid breaking either side's operating promises, e.g. supporting both push and pull. At PromCon Berlin 2023, we attempted to summarize our ideas in [one of the talks](https://www.youtube.com/watch?v=mcabOH70FqU).

At our [dev summit in Berlin](https://docs.google.com/document/d/11LC3wJcVk00l8w5P3oLQ-m3Y37iom6INAMEu2ZAGIIE/edit#bookmark=id.9kp854ea3sv4), we spent the majority of our time discussing these changes and our general stance on OpenTelemetry in depth, and the broad consensus is that we want [“to be the default store for OpenTelemetry metrics”](https://docs.google.com/document/d/11LC3wJcVk00l8w5P3oLQ-m3Y37iom6INAMEu2ZAGIIE/edit#bookmark=id.196i9ij1u7fs)!

We’ve formed a core group of developers to lead this initiative, and we are going to release a Prometheus 3.0 in 2024 with OTel support as one of its more important features. Here’s a sneak peek at what's coming in 2024.

## The year ahead

### OTLP Ingestion GA

In [Prometheus v2.47.0](https://github.com/prometheus/prometheus/releases/tag/v2.47.0), released on 6th September 2023, we added experimental support for OTLP ingestion in Prometheus. We’re constantly improving this and we plan to add support for staleness and make it a stable feature. We will also mark our support for out-of-order ingestion as stable. This involves also GA-ing our support for native / exponential histograms.

### Support UTF-8 metric and label names

[OpenTelemetry semantic conventions](https://github.com/open-telemetry/semantic-conventions/blob/main/docs/http/http-metrics.md) push for `“.”` to be the namespacing character. For example, `http.server.request.duration`. However, Prometheus currently requires a [more limited character set](https://prometheus.io/docs/instrumenting/writing_exporters/#naming), which means we convert the metric to `http_server_request_duration` when ingesting it into Prometheus.

This causes unnecessary dissonance and we’re working on removing this limitation by adding UTF-8 support for all labels and metric names. The progress is tracked [here](https://github.com/prometheus/prometheus/issues/13095).

### Native support for resource attributes

OpenTelemetry differentiates between metric attributes (labels to identify the metric itself, like `http.status_code`) and resource attributes (labels to identify the source of the metrics, like `k8s.pod.name`), while Prometheus has a more flat label schema. This leads to many usability issues that are detailed [here](https://docs.google.com/document/d/1gG-eTQ4SxmfbGwkrblnUk97fWQA93umvXHEzQn2Nv7E/edit?usp=sharing).

We’re [exploring several solutions](https://docs.google.com/document/d/1FgHxOzCQ1Rom-PjHXsgujK8x5Xx3GTiwyG__U3Gd9Tw/edit) to this problem from many fronts (Query, UX, storage, etc.), but our goal is to make it quite easy to filter and group on resource attributes. This is a work in progress, and feedback and help are wanted!

### OTLP export in the ecosystem

Prometheus remote write is supported by [most of the leading Observability projects and vendors](https://prometheus.io/docs/operating/integrations/#remote-endpoints-and-storage) already. However, OpenTelemetry Protocol (OTLP) is gaining prominence and we would like to support it across the Prometheus ecosystem.

We would like to add support for it to the Prometheus server, SDKs and the exporters. This would mean that any service instrumented with the Prometheus SDKs will also be able to _push_ OTLP and it will unlock the rich Prometheus exporter ecosystem for OpenTelemetry users.

However, we intend to keep and develop the OpenMetrics exposition format as an optimized / simplified format for Prometheus and pull-based use-cases.

### Delta temporality

The OpenTelemetry project also supports [Delta temporality](https://grafana.com/blog/2023/09/26/opentelemetry-metrics-a-guide-to-delta-vs.-cumulative-temporality-trade-offs/) which has some use-cases for the Observability ecosystem. We have a lot of Prometheus users still running statsd and using the statsd_exporter for various reasons.

We would like to support the Delta temporality of OpenTelemetry in the Prometheus server and are [working towards it](https://github.com/open-telemetry/opentelemetry-collector-contrib/issues/30479).

## Call for contributions!

As you can see, a lot of new and exciting things are coming to Prometheus! If working in the intersection between two of the most relevant open-source projects around observability sounds challenging and interesting to you, we'd like to have you on board!

This year there is also a change of governance in the works that will make the process of becoming a maintainer easier than ever! If you ever wanted to have an impact on Prometheus, now is a great time to get started.

Our first focus has always been to be as open and transparent as possible on how we are organizing all the work above so that you can also contribute. We are looking for contributors to support this initiative and help implement these features. Check out the [Prometheus 3.0 public board](https://github.com/orgs/prometheus/projects/9) and [Prometheus OTel support milestone](https://github.com/prometheus/prometheus/issues?q=is%3Aopen+is%3Aissue+milestone%3A%22OTEL+Support%22) to track the progress of the feature development and see ways that you can [contribute](https://github.com/prometheus/prometheus/blob/main/CONTRIBUTING.md).

## Conclusion

Some of the changes proposed are large and invasive or involve a fundamental departure from the original data model of Prometheus. However, we plan to introduce these gracefully so that Prometheus 3.0 will have no major breaking changes and most of the users can upgrade without impact.

We are excited to embark on this new chapter for Prometheus and would love your feedback on the changes suggested.
