---
title: Announcing Prometheus 3.0
created_at: 2024-11-24
kind: article
author_name: The Prometheus Team
draft: true
---

Following the recent release of [Prometheus 3.0 beta](https://prometheus.io/blog/2024/09/11/prometheus-3-beta/) at PromCon in Berlin, the Prometheus Team
is excited to announce the release of Prometheus Version 3.0! This latest version marks a major milestone, as it is the first major release in 7 years. Prometheus has come a long way in that time, evolving from an obscure project for data nerds into a standard part of cloud-native deployment stack.

Since the beta release, a few additional breaking changes have been added.

# What's New

Here is a summary of the exciting changes that have been released as part of the beta version, as well as what has been added since:

## New UI

One of the highlights in Prometheus 3.0 is its brand-new UI that is enabled by default:

![New UI query page](/assets/blog/2024-09-24/blog_post_screenshot_tree_view-s.png)

The UI has been completely rewritten with less clutter, a more modern look and feel, new features like a The UI has been completely rewritten with less clutter, 
a more modern look and feel, new features like a [**PromLens**](https://promlens.com/)-style tree view, and will make future maintenance easier by using a more modern technical stack.

Learn more about the new UI in general in [Julius' detailed article on the PromLabs blog](https://promlabs.com/blog/2024/09/11/a-look-at-the-new-prometheus-3-0-ui/).
Users can temporarily enable the old UI by using the `old-ui` feature flag.

Since the new UI is not battle-tested yet, it is also very possible that there are still bugs. If you find any, please 
[report them on GitHub](https://github.com/prometheus/prometheus/issues/new?assignees=&labels=&projects=&template=bug_report.yml).

Since the beta, the user interface has been updated to support UTF-8 metric and label names.

![New UTF-8 UI](/assets/blog/2024-09-24/utf8_ui.png)

## Remote Write 2.0

Remote-Write 2.0 iterates on the previous protocol version by adding native support for a host of new elements including metadata, exemplars,
created timestamp and native histograms. It also uses string interning to reduce payload size and CPU usage when compressing and decompressing. 
There is better handling for partial writes to provide more details to clients when this occurs. More details can be found 
[here](https://prometheus.io/docs/specs/remote_write_spec_2_0/.

## UTF-8 Support

Prometheus now allows all valid UTF-8 characters to be used in metric and label names by default, as well as label values,
as has been true in version 2.x.

Users will need to make sure their metrics producers are configured to pass UTF-8 names, and if either side does not support UTF-8,
metric names will be escaped using the traditional underscore-replacement method. PromQL queries can be written with the new quoting syntax
in order to retrieve UTF-8 metrics, or users can specify the __name__  label name manually.

Not all language clients have yet been updated with support for UTF-8 but the primary Go libraries have been. 

## OTLP Support

In alignment with [our commitment to OpenTelemetry](https://prometheus.io/blog/2024/03/14/commitment-to-opentelemetry/), Prometheus 3.0 features 
several new features to improve interoperability with OpenTelemetry. 

### OTLP Ingestion

Prometheus can be configured as a native receiver for the OTLP Metrics protocol, receiving OTLP metrics on the `/api/v1/otlp/v1/metrics` endpoint.

See our [guide](https://prometheus.io/docs/guides/opentelemetry) on best practices for consuming OTLP metric traffic into Prometheus.

### UTF-8 Normalization

With Prometheus 3.0, thanks to [UTF-8 support](#utf-8-support), users can store and query OpenTelemetry metrics without annoying changes to metric and label names like [changing dots to underscores](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/pkg/translator/prometheus).

Notably this allows **less confusion** for users and tooling in terms of the discrepancy between what’s defined in OpenTelemetry semantic convention or SDK and what’s actually queryable.

To achieve this for OTLP ingestion, Prometheus 3.0 has experimental support for different translation strategies. See [otlp section in the Prometheus configuration](https://prometheus.io/docs/prometheus/latest/configuration/configuration/#:~:text=Settings%20related%20to%20the%20OTLP%20receiver%20feature.) for details.

> NOTE: While “NoUTF8EscapingWithSuffixes” strategy allows special characters, it still adds required suffixes for the best experience. See [the proposal on the future work to enable no suffixes](https://github.com/prometheus/proposals/pull/39) in Prometheus.

## Native Histograms

Native histograms are a Prometheus metric type that offer a higher efficiency and lower cost alternative to Classic Histograms. Rather than having to choose (and potentially have to update) bucket boundaries based on the data set, native histograms have pre-set bucket boundaries based on exponential growth.

Native Histograms are still experimental and not yet enabled by default, and can be turned on by passing `--enable-feature=native-histograms`. Some aspects of Native Histograms, like the text format and accessor functions / operators are still under active design.

## Breaking Changes

The Prometheus community strives to [not break existing features within a major release](https://prometheus.io/docs/prometheus/latest/stability/). With a new major release we took the opportunity to clean up a few, but small, long-standing issues. In other words, Prometheus 3.0 contains a few breaking changes. This includes changes to feature flags, configuration files, PromQL, and scrape protocols.

Please read the [migration guide](https://prometheus.io/docs/prometheus/3.0/migration/) to find out if your setup is affected and what actions to take.

# Performance

It’s impressive to see what we have accomplished in the community since Prometheus 2.0. We all love numbers, so let’s celebrate the efficiency improvements we made for both CPU and memory use for the TSDB mode. Below you can see performance numbers between 3 Prometheus versions on the node with 8 CPU and 49 GB allocatable memory.

* 2.0.0 (7 years ago)
* 2.18.0 (4 years ago)
* 3.0.0 (now)

![Memory bytes](/assets/blog/2024-09-24/memory_bytes_ui.png)

![CPU seconds](/assets/blog/2024-09-24/cpu_seconds.png)

It’s furthermore impressive that those numbers were taken using our [prombench macrobenchmark](https://github.com/prometheus/prometheus/pull/15366) 
that uses the same PromQL queries, configuration and environment–highlighting backward compatibility and stability for the core features, even with 3.0.

# What's Next

There are still tons of exciting features and improvements we can make in Prometheus and the ecosystem. Here is a non-exhaustive list to get you excited and… 
hopefully motivate you to contribute and join us!

* New, more inclusive **governance**
* More **OpenTelemetry** compatibility and features
* OpenMetrics 2.0, now under Prometheus governance!
* Native Histograms stability (and with custom buckets!)
* More optimizations!
* UTF-8 support coverage in more SDKs and tools

# Try It Out!

You can try out Prometheus 3.0 by downloading it from our [official binaries](https://prometheus.io/download/#prometheus) and [container images](https://quay.io/repository/prometheus/prometheus?tab=tags).

If you are upgrading from Prometheus 2.x, check out the migration guide for more information on any adjustments you will have to make. 
Please note that we strongly recommend upgrading to v2.55 before upgrading to v3.0. Rollback is possible from v3.0 to v2.55, but not to earlier versions.

As always, we welcome feedback and contributions from the community!
