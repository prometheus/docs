---
title: Storage
nav_icon: database
sort_rank: 2
---

# Storage

Prometheus has a sophisticated local storage subsystem. 

This sections deals with the various configuration settings and issues you
might run into. To dive deeper into the topic, check out the following blogs:

* [Writing a Time Series from Scratch](https://fabxc.org/blog/2017-04-10-writing-a-tsdb/).

## Disk usage

Prometheus stores its on-disk time series data under the directory specified by
the flag `storage.local.path`. The default path is `./data` (relative to the
working directory), which is good to try something out quickly but most likely
not what you want for actual operations. The flag `storage.local.retention`
allows you to configure the retention time for samples. Adjust it to your needs
and your available disk space.

## Helpful metrics

Out of the metrics that Prometheus exposes about itself, the following are
particularly useful to tweak flags and find out about the required
resources. They also help to create alerts to find out in time if a Prometheus
server has problems or is out of capacity.

* `tsdb_active_appenders`: The current number of active appenders, which shows the ingestion pressure.
* `tsdb_blocks_loaded`: The number of tsdb blocks loaded.
* `tsdb_compaction_duration`: A summary for the compaction duration.
* `tsdb_compactions_failed_total`: The number of failed compactions.
* `tsdb_compactions_total`: The number of compactions finished.
* `tsdb_compactions_triggered_total`: The number of compactions triggered.
* `tsdb_samples_appended_total` The number of samples ingested after startup.