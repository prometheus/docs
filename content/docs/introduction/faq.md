---
title: FAQ
sort_rank: 5
---

# Frequently Asked Questions

## General

### What is Prometheus?
Prometheus is an open-source systems monitoring and alerting toolkit
with an active ecosystem. See the [overview](../overview).

### How does Prometheus compare against \[other monitoring system\]?

See the [comparison](../comparison) page.

### What dependencies does Prometheus have?

The main Prometheus server runs standalone and has no external dependencies.

### Can Prometheus be made highly available?

Yes, run identical Prometheus servers on two or more separate machines.
Identical alerts will be deduplicated by the [Alertmanager](https://github.com/prometheus/alertmanager).

The Alertmanager cannot currently be made highly available, but this is a goal.

### What language is Prometheus written in?

Most Prometheus components are written in Go. Some are also written in Java and Ruby.

### Why do you pull rather than push?

Pulling over HTTP offers a number of advantages:

* You can run your monitoring on your laptop when developing changes.
* You can more easily tell if a target is down.
* You can manually go to a target and inspect its health with a web browser.

Overall we believe that pulling is slightly better than pushing, but it should
not be considered a major point when considering a monitoring system.

The [Push vs Pull for Monitoring](http://www.boxever.com/push-vs-pull-for-monitoring)
blog post by Brian Brazil goes into more detail.

For cases where you must push, we offer the [Pushgateway](../../instrumenting/pushing).

### Who wrote Prometheus?

Prometheus was initially started privately by
[Matt T. Proud](http://www.matttproud.com) and
[Julius Volz](http://juliusv.com). The majority of its
development has been sponsored by [SoundCloud](https://soundcloud.com).

Other companies making active contributions include [Boxever](www.boxever.com)
and [Docker](https://www.docker.com). A full list can be found in the
[CONTRIBUTORS](https://github.com/prometheus/prometheus/blob/master/CONTRIBUTORS.md)
file in each repository.

### What license is Prometheus released under?

Prometheus is released under the
[Apache 2.0](https://github.com/prometheus/prometheus/blob/master/LICENSE) license.

### What is the plural of Prometheus?

After extensive research it has been determined that the correct plural of
'Prometheus' is 'Prometheis'.

### Can I send alerts?

Yes, with the experimental [Alertmanager](https://github.com/prometheus/alertmanager).
[PagerDuty](https://www.pagerduty.com/) and email are supported.

### Can I create dashboards?

Yes, with [PromDash](../../visualization/promdash/) and [Console
templates](visualization/consoles/).

## Instrumentation

### Which languages have instrumentation libraries?

Currently there are client libraries for:

* [Go](https://github.com/prometheus/client_golang)
* [Java or Scala](https://github.com/prometheus/client_java)
* [Ruby](https://github.com/prometheus/client_ruby)

If you are interested in contributing a client library for a new language, see
the [exposition formats](../../instrumenting/exposition_formats/).

### Can I monitor machines?

Yes, the [Node Exporter](https://github.com/prometheus/node_exporter) exposes
an extensive set of machine-level metrics on Linux such as CPU usage, memory,
disk utilization, filesystem fullness and network bandwidth.

### Can I monitor batch jobs?

Yes, using the [Pushgateway](../../instrumenting/pushing). See also the
[best practices](../../practices/instrumentation/#batch-jobs) for monitoring batch
jobs.

### What applications can Prometheus monitor out of the box?

See [exporters for third-party systems](../../instrumenting/exporters).

### Which Java client should I use?

New users are advised to use the
[simpleclient](https://github.com/prometheus/client_java/tree/master/simpleclient).
For more information, see the [comparison](https://github.com/prometheus/client_java/wiki).

### Can I monitor JVM applications via JMX?

Yes, for applications that you cannot instrument directly with the Java client
you can use the [JMX Exporter](https://github.com/prometheus/jmx_exporter)
either standalone or as a Java Agent.

### What is the performance impact of instrumentation?

Performance across client libraries and languages may vary. For Java,
[benchmarks](https://github.com/prometheus/client_java/blob/master/benchmark/README.md)
indicate that incrementing a counter/gauge with the Java client will take
12-17ns, depending on contention. This is negligible for all but the most
latency-critical code.
