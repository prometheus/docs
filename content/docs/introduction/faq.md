---
title: FAQ
sort_rank: 5
toc: full-width
---

# Frequently Asked Questions

## General

### What is Prometheus?
Prometheus is an open-source systems monitoring and alerting toolkit
with an active ecosystem. See the [overview](/docs/introduction/overview/).

### How does Prometheus compare against other monitoring systems?

See the [comparison](/docs/introduction/comparison/) page.

### What dependencies does Prometheus have?

The main Prometheus server runs standalone and has no external dependencies.

### Can Prometheus be made highly available?

Yes, run identical Prometheus servers on two or more separate machines.
Identical alerts will be deduplicated by the [Alertmanager](https://github.com/prometheus/alertmanager).

The Alertmanager cannot currently be made highly available, but this is a goal.

### I was told Prometheus “doesn't scale”.

There are in fact various ways to scale and federate
Prometheus. Read [Scaling and Federating Prometheus](http://www.robustperception.io/scaling-and-federating-prometheus/)
on the Robust Perception blog to get started.

### What language is Prometheus written in?

Most Prometheus components are written in Go. Some are also written in Java and Ruby.

### How stable are Prometheus features, storage formats, and APIs?

Although Prometheus and many of its ecosystem components are already quite
stable, we will still allow for occasional breaking changes until the
Prometheus server reaches version 1.0.0. These breaking changes will be pointed
out in release announcements for components that already have a proper release
process (like the Prometheus server) or communicated clearly otherwise. After
releasing version 1.0.0, breaking changes will be indicated by increments of
the major version. See also the documentation for [semantic
versioning](http://semver.org/), which we are following.

### Why do you pull rather than push?

Pulling over HTTP offers a number of advantages:

* You can run your monitoring on your laptop when developing changes.
* You can more easily tell if a target is down.
* You can manually go to a target and inspect its health with a web browser.

Overall we believe that pulling is slightly better than pushing, but it should
not be considered a major point when considering a monitoring system.

The [Push vs Pull for Monitoring](http://www.boxever.com/push-vs-pull-for-monitoring)
blog post by Brian Brazil goes into more detail.

For cases where you must push, we offer the [Pushgateway](/docs/instrumenting/pushing/).

### How to feed logs into Prometheus?

Short answer: Don't! Use something like the ELK stack instead.

Longer answer: Prometheus is a system to collect and process metrics, not an
event logging system. The Raintank blog post
[Logs and Metrics and Graphs, Oh My!](https://blog.raintank.io/logs-and-metrics-and-graphs-oh-my/)
provides more details about the differences between logs and metrics.

If you want to extract Prometheus metrics from application logs, Google's
[mtail](https://github.com/google/mtail) might be helpful.

### Who wrote Prometheus?

Prometheus was initially started privately by
[Matt T. Proud](http://www.matttproud.com) and
[Julius Volz](http://juliusv.com). The majority of its
development has been sponsored by [SoundCloud](https://soundcloud.com).

Other companies making active contributions include [Boxever](http://www.boxever.com/)
and [Docker](https://www.docker.com). A full list can be found in the
[AUTHORS](https://github.com/prometheus/prometheus/blob/master/AUTHORS.md)
file in each repository.

### What license is Prometheus released under?

Prometheus is released under the
[Apache 2.0](https://github.com/prometheus/prometheus/blob/master/LICENSE) license.

### What is the plural of Prometheus?

After extensive research it has been determined that the correct plural of
'Prometheus' is 'Prometheis'.

### Can I reload Prometheus's configuration?

Yes, sending SIGHUP to the Prometheus process will reload
and apply the configuration file. The different components attempt
to handle failing changes gracefully.

### Can I send alerts?

Yes, with the experimental [Alertmanager](https://github.com/prometheus/alertmanager).

Currently, the following external systems are supported:

* Email
* Generic Webhooks
* [PagerDuty](http://www.pagerduty.com/)
* [HipChat](https://www.hipchat.com/)
* [Slack](https://slack.com/)
* [Pushover](https://pushover.net/)
* [Flowdock](https://www.flowdock.com/)

### Can I create dashboards?

Yes, with [PromDash](/docs/visualization/promdash/) and [Console templates](/docs/visualization/consoles/). There is also a early support for querying Prometheus servers from [Grafana](/docs/visualization/grafana/).

### Can I change the timezone? Why is everything in UTC?

To avoid any kind of timezone confusion, especially when the so-called
daylight saving time is involved, we decided to exclusively use Unix
time internally and UTC for display purposes in all components of
Prometheus. A carefully done timezone selection could be introduced
into the UI. Contributions are welcome. See
[issue #500](https://github.com/prometheus/prometheus/issues/500)
for the current state of this effort.

## Instrumentation

### Which languages have instrumentation libraries?

There are a number of client libraries for instrumenting your services with
Prometheus metrics. See the [client libraries](/docs/instrumenting/clientlibs/)
documentation for details.

If you are interested in contributing a client library for a new language, see
the [exposition formats](/docs/instrumenting/exposition_formats/).

### Can I monitor machines?

Yes, the [Node Exporter](https://github.com/prometheus/node_exporter) exposes
an extensive set of machine-level metrics on Linux such as CPU usage, memory,
disk utilization, filesystem fullness and network bandwidth.

### Can I monitor batch jobs?

Yes, using the [Pushgateway](/docs/instrumenting/pushing/). See also the
[best practices](/docs/practices/instrumentation/#batch-jobs) for monitoring batch
jobs.

### What applications can Prometheus monitor out of the box?

See [exporters for third-party systems](/docs/instrumenting/exporters/).

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

## Troubleshooting

### My server takes a long time to start up and spams the log with copious information about crash recovery.

You are suffering from an unclean shutdown. Prometheus has to shut
down cleanly after a `SIGTERM`, which might take a while for heavily
used servers. If the server crashes or is killed hard (e.g. OOM kill
by the kernel or your runlevel system got impatient while waiting for
Prometheus to shutdown), a crash recovery has to be performed, which
should take less than a minute under normal circumstances. See [crash recovery](/docs/operating/storage/#crash-recovery) for details.

### I am using ZFS on Linux, and the unit test `TestPersistLoadDropChunks` fails. If I run Prometheus despite the failing test, the weirdest things happen.

You have run into a bug of ZFS on Linux. See [issue #484](https://github.com/prometheus/prometheus/issues/484)
for details. Upgrading to ZFS on Linux v0.6.4 should fix the issue.

## Implementation

### Why are all sample values 64-bit floats? I want integers.

We restrained ourselves to 64-bit floats to simplify the design. The
[IEEE 754 double-precision binary floating-point
format](http://en.wikipedia.org/wiki/Double-precision_floating-point_format)
supports integer precision for values up to 2<sup>53</sup>. Supporting
native 64 bit integers would (only) help if you need integer precision
above 2<sup>53</sup> but below 2<sup>63</sup>. In principle, support
for different sample value types (including some kind of big integer,
supporting even more than 64 bit) could be implemented, but it is not
a priority right now. Note that a counter, even if incremented
one million times per second, will only run into precision issues
after over 285 years.

### Why does Prometheus use a custom storage backend rather than [some other storage method]? Isn't the "one file per time series" approach killing performance?

Initially, Prometheus ran completely on LevelDB, but to achieve better
performance, we had to change the storage for bulk sample data. We
evaluated many storage backends that were available at the time,
without getting satisfactory results. So we implemented exactly the
parts we needed, while keeping LevelDB for indexes and making heavy
use of file system capabilities. Obviously, we could not evaluate
every single storage backend out there, and storage backends have
evolved meanwhile. However, the performance of the solution
implemented now is satisfactory for most use-cases. Our most important
requirements are an acceptable query speed for common queries and a
sustainable ingestion rate of many thousands of samples per
second. The latter depends on the compressibility of the sample data
and on the number of time series the samples belong to, but to give
you an idea, here are some results from benchmarks:

* On an older 8-core machine with Intel Core i7 CPUs, 8GiB RAM, and
  two spinning disks (Samsung HD753LJ) in a RAID-1 setup, Prometheus
  sustained an ingestion rate of 34k samples per second, belonging to
  170k time series, scraped from 600 targets.

* On a modern server with 64GiB RAM and SSD, Prometheus sustained an
  ingestion rate of 525k samples per second, belonging to ~1.5M time
  series, scraped from ~1700 targets.

In both cases, there were no obvious bottlenecks. Various stages of the
processing pipelines reached their limits more or less at the same
ingestion rate.

Running out of inodes is highly unlikely in a usual set-up. There is a
possible downside: If you want to delete Prometheus's storage
directory, you will notice that some file systems are very slow when
deleting files.
