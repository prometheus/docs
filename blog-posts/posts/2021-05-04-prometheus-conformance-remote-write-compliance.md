---
title: "Prometheus Conformance Program: Remote Write Compliance Test Results"
created_at: 2021-05-05
kind: article
author_name: Richard "RichiH" Hartmann
---

As [announced by CNCF](https://www.cncf.io/blog/2021/05/03/announcing-the-intent-to-form-the-prometheus-conformance-program/) and by [ourselves](https://prometheus.io/blog/2021/05/03/introducing-prometheus-conformance-program/), we're starting a Prometheus conformance program.

To give everyone an overview of where the ecosystem is before running tests officially, we wanted to show off the newest addition to our happy little bunch of test suites: The Prometheus [Remote Write](https://prometheus.io/docs/prometheus/latest/configuration/configuration/#remote_write) compliance test suite tests the sender part of the Remote Write protocol against our [specification](https://docs.google.com/document/d/1LPhVRSFkGNSuU1fBd81ulhsCPR4hkSZyyBj1SZ8fWOM).

During Monday's [PromCon](https://promcon.io/2021-online/), [Tom Wilkie](https://twitter.com/tom_wilkie) presented the test results from the time of recording a few weeks ago. In the live section, he already had an [update](https://docs.google.com/presentation/d/1RcN58LlS3V5tYCUsftqUvNuCpCsgGR2P7-GoH1MVL0Q/edit#slide=id.gd1789c7f7c_0_0). Two days later we have two more updates:
The addition of the [observability pipeline tool Vector](https://github.com/prometheus/compliance/pull/24), as well as [new versions of existing systems](https://github.com/prometheus/compliance/pull/25).

<!-- more -->

So, without further ado, the current results in alphabetical order are:

| Sender | Version | Score
|--------|---------|------
| Grafana Agent | 0.13.1 | **100%**
| Prometheus | 2.26.0 | **100%**
| OpenTelemetry Collector | 0.26.0 | **41%**
| Telegraf | 1.18.2 | **65%**
| Timber Vector | 0.13.1 | **35%**
| VictoriaMetrics Agent | 1.59.0 | **76%**

The raw results are:

````
--- PASS: TestRemoteWrite/grafana (0.01s)
    --- PASS: TestRemoteWrite/grafana/Counter (10.02s)
    --- PASS: TestRemoteWrite/grafana/EmptyLabels (10.02s)
    --- PASS: TestRemoteWrite/grafana/Gauge (10.02s)
    --- PASS: TestRemoteWrite/grafana/Headers (10.02s)
    --- PASS: TestRemoteWrite/grafana/Histogram (10.02s)
    --- PASS: TestRemoteWrite/grafana/HonorLabels (10.02s)
    --- PASS: TestRemoteWrite/grafana/InstanceLabel (10.02s)
    --- PASS: TestRemoteWrite/grafana/Invalid (10.02s)
    --- PASS: TestRemoteWrite/grafana/JobLabel (10.02s)
    --- PASS: TestRemoteWrite/grafana/NameLabel (10.02s)
    --- PASS: TestRemoteWrite/grafana/Ordering (26.12s)
    --- PASS: TestRemoteWrite/grafana/RepeatedLabels (10.02s)
    --- PASS: TestRemoteWrite/grafana/SortedLabels (10.02s)
    --- PASS: TestRemoteWrite/grafana/Staleness (10.01s)
    --- PASS: TestRemoteWrite/grafana/Summary (10.01s)
    --- PASS: TestRemoteWrite/grafana/Timestamp (10.01s)
    --- PASS: TestRemoteWrite/grafana/Up (10.02s)
--- PASS: TestRemoteWrite/prometheus (0.01s)
    --- PASS: TestRemoteWrite/prometheus/Counter (10.02s)
    --- PASS: TestRemoteWrite/prometheus/EmptyLabels (10.02s)
    --- PASS: TestRemoteWrite/prometheus/Gauge (10.02s)
    --- PASS: TestRemoteWrite/prometheus/Headers (10.02s)
    --- PASS: TestRemoteWrite/prometheus/Histogram (10.02s)
    --- PASS: TestRemoteWrite/prometheus/HonorLabels (10.02s)
    --- PASS: TestRemoteWrite/prometheus/InstanceLabel (10.02s)
    --- PASS: TestRemoteWrite/prometheus/Invalid (10.02s)
    --- PASS: TestRemoteWrite/prometheus/JobLabel (10.02s)
    --- PASS: TestRemoteWrite/prometheus/NameLabel (10.03s)
    --- PASS: TestRemoteWrite/prometheus/Ordering (24.99s)
    --- PASS: TestRemoteWrite/prometheus/RepeatedLabels (10.02s)
    --- PASS: TestRemoteWrite/prometheus/SortedLabels (10.02s)
    --- PASS: TestRemoteWrite/prometheus/Staleness (10.02s)
    --- PASS: TestRemoteWrite/prometheus/Summary (10.02s)
    --- PASS: TestRemoteWrite/prometheus/Timestamp (10.02s)
    --- PASS: TestRemoteWrite/prometheus/Up (10.02s)
--- FAIL: TestRemoteWrite/otelcollector (0.00s)
    --- FAIL: TestRemoteWrite/otelcollector/Counter (10.01s)
    --- FAIL: TestRemoteWrite/otelcollector/Histogram (10.01s)
    --- FAIL: TestRemoteWrite/otelcollector/InstanceLabel (10.01s)
    --- FAIL: TestRemoteWrite/otelcollector/Invalid (10.01s)
    --- FAIL: TestRemoteWrite/otelcollector/JobLabel (10.01s)
    --- FAIL: TestRemoteWrite/otelcollector/Ordering (13.54s)
    --- FAIL: TestRemoteWrite/otelcollector/RepeatedLabels (10.01s)
    --- FAIL: TestRemoteWrite/otelcollector/Staleness (10.01s)
    --- FAIL: TestRemoteWrite/otelcollector/Summary (10.01s)
    --- FAIL: TestRemoteWrite/otelcollector/Up (10.01s)
    --- PASS: TestRemoteWrite/otelcollector/EmptyLabels (10.01s)
    --- PASS: TestRemoteWrite/otelcollector/Gauge (10.01s)
    --- PASS: TestRemoteWrite/otelcollector/Headers (10.01s)
    --- PASS: TestRemoteWrite/otelcollector/HonorLabels (10.01s)
    --- PASS: TestRemoteWrite/otelcollector/NameLabel (10.01s)
    --- PASS: TestRemoteWrite/otelcollector/SortedLabels (10.01s)
    --- PASS: TestRemoteWrite/otelcollector/Timestamp (10.01s)
--- FAIL: TestRemoteWrite/telegraf (0.01s)
    --- FAIL: TestRemoteWrite/telegraf/EmptyLabels (14.60s)
    --- FAIL: TestRemoteWrite/telegraf/HonorLabels (14.61s)
    --- FAIL: TestRemoteWrite/telegraf/Invalid (14.61s)
    --- FAIL: TestRemoteWrite/telegraf/RepeatedLabels (14.61s)
    --- FAIL: TestRemoteWrite/telegraf/Staleness (14.59s)
    --- FAIL: TestRemoteWrite/telegraf/Up (14.60s)
    --- PASS: TestRemoteWrite/telegraf/Counter (14.61s)
    --- PASS: TestRemoteWrite/telegraf/Gauge (14.60s)
    --- PASS: TestRemoteWrite/telegraf/Headers (14.61s)
    --- PASS: TestRemoteWrite/telegraf/Histogram (14.61s)
    --- PASS: TestRemoteWrite/telegraf/InstanceLabel (14.61s)
    --- PASS: TestRemoteWrite/telegraf/JobLabel (14.61s)
    --- PASS: TestRemoteWrite/telegraf/NameLabel (14.60s)
    --- PASS: TestRemoteWrite/telegraf/Ordering (14.61s)
    --- PASS: TestRemoteWrite/telegraf/SortedLabels (14.61s)
    --- PASS: TestRemoteWrite/telegraf/Summary (14.60s)
    --- PASS: TestRemoteWrite/telegraf/Timestamp (14.61s)
--- FAIL: TestRemoteWrite/vector (0.01s)
    --- FAIL: TestRemoteWrite/vector/Counter (10.02s)
    --- FAIL: TestRemoteWrite/vector/EmptyLabels (10.01s)
    --- FAIL: TestRemoteWrite/vector/Headers (10.02s)
    --- FAIL: TestRemoteWrite/vector/HonorLabels (10.02s)
    --- FAIL: TestRemoteWrite/vector/InstanceLabel (10.02s)
    --- FAIL: TestRemoteWrite/vector/Invalid (10.02s)
    --- FAIL: TestRemoteWrite/vector/JobLabel (10.01s)
    --- FAIL: TestRemoteWrite/vector/Ordering (13.01s)
    --- FAIL: TestRemoteWrite/vector/RepeatedLabels (10.02s)
    --- FAIL: TestRemoteWrite/vector/Staleness (10.02s)
    --- FAIL: TestRemoteWrite/vector/Up (10.02s)
    --- PASS: TestRemoteWrite/vector/Gauge (10.02s)
    --- PASS: TestRemoteWrite/vector/Histogram (10.02s)
    --- PASS: TestRemoteWrite/vector/NameLabel (10.02s)
    --- PASS: TestRemoteWrite/vector/SortedLabels (10.02s)
    --- PASS: TestRemoteWrite/vector/Summary (10.02s)
    --- PASS: TestRemoteWrite/vector/Timestamp (10.02s)
--- FAIL: TestRemoteWrite/vmagent (0.01s)
    --- FAIL: TestRemoteWrite/vmagent/Invalid (20.66s)
    --- FAIL: TestRemoteWrite/vmagent/Ordering (22.05s)
    --- FAIL: TestRemoteWrite/vmagent/RepeatedLabels (20.67s)
    --- FAIL: TestRemoteWrite/vmagent/Staleness (20.67s)
    --- PASS: TestRemoteWrite/vmagent/Counter (20.67s)
    --- PASS: TestRemoteWrite/vmagent/EmptyLabels (20.64s)
    --- PASS: TestRemoteWrite/vmagent/Gauge (20.66s)
    --- PASS: TestRemoteWrite/vmagent/Headers (20.64s)
    --- PASS: TestRemoteWrite/vmagent/Histogram (20.66s)
    --- PASS: TestRemoteWrite/vmagent/HonorLabels (20.66s)
    --- PASS: TestRemoteWrite/vmagent/InstanceLabel (20.66s)
    --- PASS: TestRemoteWrite/vmagent/JobLabel (20.66s)
    --- PASS: TestRemoteWrite/vmagent/NameLabel (20.66s)
    --- PASS: TestRemoteWrite/vmagent/SortedLabels (20.66s)
    --- PASS: TestRemoteWrite/vmagent/Summary (20.66s)
    --- PASS: TestRemoteWrite/vmagent/Timestamp (20.67s)
    --- PASS: TestRemoteWrite/vmagent/Up (20.66s)
````

We'll work more on improving our test suites, both by adding more tests & by adding new test targets. If you want to help us, consider adding more of [our list of Remote Write integrations](https://prometheus.io/docs/operating/integrations/#remote-endpoints-and-storage).
