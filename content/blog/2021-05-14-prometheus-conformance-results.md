---
title: "Prometheus Conformance Program: First round of results"
created_at: 2021-10-14
kind: article
author_name: Richard "RichiH" Hartmann
---

Today, we're launching the Prometheus Conformance Program. While the legal paperwork still needs to be finalized, we ran tests, and we consider the below our first round of results.

As a quick reminder: The program is called Prometheus **Conformance**, software can be **compliant** to specific tests, which result in a **compatibility** rating. The nomenclature might seem complex, but it allows us to speak about this topic without using endless word snakes.

We found that it's quite hard to reason about what needs to be applied to what software. To help sort my thoughts, I created [an overview](https://docs.google.com/document/d/1VGMme9RgpclqF4CF2woNmgFqq0J7nqHn-l72uNmAxhA), introducing four new categories we can put software into:
* Metrics Exposers
* Agent/Collector
* Prometheus Storage Backends
* Full Prometheus Compatibility

I am not convinced that those categories are perfect, even though Julius and Julien helped polish them. Feedback is very much welcome. Maybe counter-intuitively, we want the community, not just Prometheus-team, to shape this effort. To help with that, we will launch a WG Conformance within Prometheus. As with [WG Docs](https://docs.google.com/document/d/1k7_Ya7j5HrIgxXghTCj-26CuwPyGdAbHS0uQf0Ir2tw) and [WG Storage](https://docs.google.com/document/d/1HWL-NIfog3_pFxUny0kAHeoxd0grnqhCBcHVPZN4y3Y), those will be public and we actively invite participation.

Two of those categories have a variety of test targets, already: Agent/Collector and Full Prometheus Compatibility.

Let's flip the order around, because most of you will be interested in the latter.

## Full Prometheus Compatibility

As I [alluded to recently](https://www.youtube.com/watch?v=CBDZKjgRiew), the maintainer/adoption ratio of Prometheus is surprisingly, or shockingly, low. In different words, we hope that the economic incentives around Prometheus Compatibility will entice vendors to assign resources in building out the tests with us. If you always wanted to contribute to Prometheus during work time, this might by the way; and a way that will have you touch a lot of highly relevant aspects of Prometheus.

We know what tests we want to build out, but we are not there yet. As announced previously, it would be unfair to hold this against projects or vendors. As such, test shims are defined as being passed. The currently semi-manual nature of e.g. the [PromQL tests Julius ran this week](https://promlabs.com/blog/2021/10/14/promql-vendor-compatibility-round-three) mean that Julius tested sending data through Prometheus Remote Write in most cases as part of PromQL testing. We're reusing his results in more than one way here. This will be untangled soon, and more tests from different angles will keep ratcheting up the requirements and thus End User confidence.

It makes sense to look at projects and aaS offerings in two sets.

### Projects

#### Passing

| Projects | Version | Score
|----------|---------|------
| Cortex | 1.10.0 | **100%**
| M3 | 1.3.0 | **100%**
| Promscale | 0.6.2 | **100%**
| Thanos | 0.23.1 | **100%**

#### Not passing

VictoriaMetrics 1.67.0 is not passing and [does not intend to pass](https://promlabs.com/blog/2021/10/14/promql-vendor-compatibility-round-three#victoriametrics). In the spirit of End User confidence, we decided to track their results while they position themselves as a drop-in replacement for Prometheus.

### aaS

#### Passing

* Chronosphere
* Grafana Cloud

#### Not passing

* Amazon Managed Service for Prometheus
* Google Cloud Managed Service for Prometheus
* New Relic
* Sysdig Monitor

As Amazon Managed Service for Prometheus is based on Cortex just like Grafana Cloud, we expect them to pass after the next update cycle.

## Agent/Collector

| Sender | Version | Score
|--------|---------|------
| Grafana Agent | 0.19.0 | **100%**
| Prometheus | 2.30.3 | **100%**
| OpenTelemetry Collector | 0.37.0 | **100%**
| Telegraf | 1.20.2 | **73.68%**
| Timber Vector | 0.16.1 | **36.84%**
| VictoriaMetrics Agent | 1.67.0 | **21.05%**

That means we consider three agents/collectors to be Prometheus compatible as of today: Grafana Agent, Prometheus itself, and the OpenTelemetry Collector.

NB: We tested Vector 0.16.1 instead of 0.17.0 because there are no binary downloads for 0.17.0 and our test toolchain currently expects binaries.

The raw results are:

````
--- FAIL: TestRemoteWrite (108.29s)
    --- PASS: TestRemoteWrite/grafana (0.00s)
        --- PASS: TestRemoteWrite/grafana/Summary (10.03s)
        --- PASS: TestRemoteWrite/grafana/JobLabel (10.03s)
        --- PASS: TestRemoteWrite/grafana/Up (10.03s)
        --- PASS: TestRemoteWrite/grafana/RepeatedLabels (10.04s)
        --- PASS: TestRemoteWrite/grafana/HonorLabels (10.04s)
        --- PASS: TestRemoteWrite/grafana/EmptyLabels (10.04s)
        --- PASS: TestRemoteWrite/grafana/Histogram (10.04s)
        --- PASS: TestRemoteWrite/grafana/Staleness (10.04s)
        --- PASS: TestRemoteWrite/grafana/Gauge (10.04s)
        --- PASS: TestRemoteWrite/grafana/SortedLabels (10.04s)
        --- PASS: TestRemoteWrite/grafana/Invalid (10.04s)
        --- PASS: TestRemoteWrite/grafana/NameLabel (10.04s)
        --- PASS: TestRemoteWrite/grafana/Counter (10.04s)
        --- PASS: TestRemoteWrite/grafana/InstanceLabel (10.04s)
        --- PASS: TestRemoteWrite/grafana/Retries400 (10.04s)
        --- PASS: TestRemoteWrite/grafana/Headers (10.04s)
        --- PASS: TestRemoteWrite/grafana/Timestamp (10.04s)
        --- PASS: TestRemoteWrite/grafana/Retries500 (10.06s)
        --- PASS: TestRemoteWrite/grafana/Ordering (24.94s)
    --- PASS: TestRemoteWrite/otelcollector (0.00s)
        --- PASS: TestRemoteWrite/otelcollector/Gauge (10.01s)
        --- PASS: TestRemoteWrite/otelcollector/JobLabel (10.01s)
        --- PASS: TestRemoteWrite/otelcollector/SortedLabels (10.01s)
        --- PASS: TestRemoteWrite/otelcollector/Invalid (10.01s)
        --- PASS: TestRemoteWrite/otelcollector/Histogram (10.01s)
        --- PASS: TestRemoteWrite/otelcollector/RepeatedLabels (10.01s)
        --- PASS: TestRemoteWrite/otelcollector/Counter (10.01s)
        --- PASS: TestRemoteWrite/otelcollector/Retries500 (10.01s)
        --- PASS: TestRemoteWrite/otelcollector/HonorLabels (10.01s)
        --- PASS: TestRemoteWrite/otelcollector/InstanceLabel (10.01s)
        --- PASS: TestRemoteWrite/otelcollector/Retries400 (10.01s)
        --- PASS: TestRemoteWrite/otelcollector/Up (10.01s)
        --- PASS: TestRemoteWrite/otelcollector/NameLabel (10.01s)
        --- PASS: TestRemoteWrite/otelcollector/Staleness (10.01s)
        --- PASS: TestRemoteWrite/otelcollector/EmptyLabels (10.01s)
        --- PASS: TestRemoteWrite/otelcollector/Timestamp (10.01s)
        --- PASS: TestRemoteWrite/otelcollector/Headers (10.01s)
        --- PASS: TestRemoteWrite/otelcollector/Summary (10.01s)
        --- PASS: TestRemoteWrite/otelcollector/Ordering (17.34s)
    --- PASS: TestRemoteWrite/prometheus (0.00s)
        --- PASS: TestRemoteWrite/prometheus/Headers (10.03s)
        --- PASS: TestRemoteWrite/prometheus/Counter (10.03s)
        --- PASS: TestRemoteWrite/prometheus/EmptyLabels (10.03s)
        --- PASS: TestRemoteWrite/prometheus/JobLabel (10.03s)
        --- PASS: TestRemoteWrite/prometheus/Timestamp (10.03s)
        --- PASS: TestRemoteWrite/prometheus/Staleness (10.03s)
        --- PASS: TestRemoteWrite/prometheus/Summary (10.03s)
        --- PASS: TestRemoteWrite/prometheus/RepeatedLabels (10.03s)
        --- PASS: TestRemoteWrite/prometheus/Histogram (10.03s)
        --- PASS: TestRemoteWrite/prometheus/Retries400 (10.03s)
        --- PASS: TestRemoteWrite/prometheus/Invalid (10.03s)
        --- PASS: TestRemoteWrite/prometheus/Up (10.03s)
        --- PASS: TestRemoteWrite/prometheus/HonorLabels (10.03s)
        --- PASS: TestRemoteWrite/prometheus/SortedLabels (10.03s)
        --- PASS: TestRemoteWrite/prometheus/InstanceLabel (10.03s)
        --- PASS: TestRemoteWrite/prometheus/NameLabel (10.03s)
        --- PASS: TestRemoteWrite/prometheus/Gauge (10.03s)
        --- PASS: TestRemoteWrite/prometheus/Retries500 (10.06s)
        --- PASS: TestRemoteWrite/prometheus/Ordering (22.78s)
    --- FAIL: TestRemoteWrite/telegraf (0.00s)
        --- PASS: TestRemoteWrite/telegraf/EmptyLabels (10.01s)
        --- PASS: TestRemoteWrite/telegraf/Counter (10.01s)
        --- FAIL: TestRemoteWrite/telegraf/Invalid (10.01s)
        --- PASS: TestRemoteWrite/telegraf/Retries400 (10.02s)
        --- FAIL: TestRemoteWrite/telegraf/HonorLabels (10.02s)
        --- FAIL: TestRemoteWrite/telegraf/Staleness (10.02s)
        --- PASS: TestRemoteWrite/telegraf/SortedLabels (10.02s)
        --- FAIL: TestRemoteWrite/telegraf/Retries500 (10.02s)
        --- PASS: TestRemoteWrite/telegraf/Summary (10.02s)
        --- PASS: TestRemoteWrite/telegraf/Timestamp (10.02s)
        --- PASS: TestRemoteWrite/telegraf/NameLabel (10.02s)
        --- PASS: TestRemoteWrite/telegraf/Headers (10.02s)
        --- PASS: TestRemoteWrite/telegraf/JobLabel (10.02s)
        --- FAIL: TestRemoteWrite/telegraf/Up (10.02s)
        --- PASS: TestRemoteWrite/telegraf/Histogram (10.02s)
        --- PASS: TestRemoteWrite/telegraf/Gauge (10.02s)
        --- PASS: TestRemoteWrite/telegraf/RepeatedLabels (10.02s)
        --- PASS: TestRemoteWrite/telegraf/InstanceLabel (10.02s)
        --- PASS: TestRemoteWrite/telegraf/Ordering (10.02s)
    --- FAIL: TestRemoteWrite/vector (0.01s)
        --- FAIL: TestRemoteWrite/vector/Retries500 (17.96s)
        --- FAIL: TestRemoteWrite/vector/InstanceLabel (17.97s)
        --- PASS: TestRemoteWrite/vector/Retries400 (17.97s)
        --- FAIL: TestRemoteWrite/vector/Staleness (17.97s)
        --- FAIL: TestRemoteWrite/vector/Up (17.97s)
        --- FAIL: TestRemoteWrite/vector/EmptyLabels (17.97s)
        --- PASS: TestRemoteWrite/vector/Summary (17.97s)
        --- FAIL: TestRemoteWrite/vector/Headers (17.97s)
        --- FAIL: TestRemoteWrite/vector/JobLabel (17.97s)
        --- PASS: TestRemoteWrite/vector/NameLabel (17.97s)
        --- FAIL: TestRemoteWrite/vector/RepeatedLabels (17.97s)
        --- PASS: TestRemoteWrite/vector/Timestamp (17.97s)
        --- PASS: TestRemoteWrite/vector/Histogram (17.97s)
        --- FAIL: TestRemoteWrite/vector/Counter (17.97s)
        --- FAIL: TestRemoteWrite/vector/HonorLabels (17.97s)
        --- PASS: TestRemoteWrite/vector/Gauge (17.97s)
        --- PASS: TestRemoteWrite/vector/SortedLabels (17.97s)
        --- FAIL: TestRemoteWrite/vector/Invalid (17.97s)
        --- FAIL: TestRemoteWrite/vector/Ordering (21.63s)
    --- FAIL: TestRemoteWrite/vmagent (0.01s)
        --- FAIL: TestRemoteWrite/vmagent/Summary (10.01s)
        --- FAIL: TestRemoteWrite/vmagent/JobLabel (10.02s)
        --- FAIL: TestRemoteWrite/vmagent/RepeatedLabels (10.02s)
        --- PASS: TestRemoteWrite/vmagent/Retries400 (10.02s)
        --- FAIL: TestRemoteWrite/vmagent/HonorLabels (10.02s)
        --- PASS: TestRemoteWrite/vmagent/Retries500 (10.02s)
        --- PASS: TestRemoteWrite/vmagent/Staleness (10.02s)
        --- FAIL: TestRemoteWrite/vmagent/Histogram (10.02s)
        --- FAIL: TestRemoteWrite/vmagent/EmptyLabels (10.02s)
        --- FAIL: TestRemoteWrite/vmagent/SortedLabels (10.02s)
        --- FAIL: TestRemoteWrite/vmagent/Up (10.02s)
        --- FAIL: TestRemoteWrite/vmagent/Gauge (10.02s)
        --- PASS: TestRemoteWrite/vmagent/NameLabel (10.02s)
        --- FAIL: TestRemoteWrite/vmagent/Timestamp (10.02s)
        --- FAIL: TestRemoteWrite/vmagent/Counter (10.02s)
        --- FAIL: TestRemoteWrite/vmagent/InstanceLabel (10.02s)
        --- FAIL: TestRemoteWrite/vmagent/Invalid (10.02s)
        --- FAIL: TestRemoteWrite/vmagent/Headers (10.02s)
        --- FAIL: TestRemoteWrite/vmagent/Ordering (11.56s)
````
