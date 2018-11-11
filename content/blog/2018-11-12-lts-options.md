---
title: Prometheus Long-Term Storage Options
created_at: 2018-11-12
kind: article
author_name: Michael Hausenblas
---

While Prometheus itself does not offer a clustered storage solution to store data across multiple machines there are a number of so called Long-Term Storage (LTS) options available. This article reviews the, at the time of writing, available options. We will not provide a recommendation which LTS solution you should pick, since it very much depends on your requirements and preferences, which are unknown to us.

Prometheus [stores](https://prometheus.io/docs/prometheus/latest/storage/) data on local storage, which limits the data you can query or otherwise process to the most recent days or weeks, depending on how much space you have available, locally. If you, however, have the need to retain data for longer time periods, for example for long-term capacity planning, analyzing usage trends, or for regulatory reasons (think financial domain, health care, etc.) then you likely benefit from a LTS solution. There are a number of ways to achieve this (in alphabetical order):

* [Cortex](#cortex)
* [InfluxDB](#influxdb)
* [M3](#m3)
* [Thanos](#thanos)

## Cortex

[Cortex](https://github.com/weaveworks/cortex) providess horizontally scalable, multi-tenant, long term storage for Prometheus metrics when used as a remote write destination, and a horizontally scalable, Prometheus-compatible query API.

Further references:

* Tom Wilkie: [Cortex: open-source, horizontally-scalable, distributed Prometheus](https://www.youtube.com/watch?v=Xi4jq2IUbLs), 06/2017
* Project Frankenstein: Multitenant, Scale-Out Prometheus: [video](https://youtu.be/3Tb4Wc0kfCM) | [slides](http://www.slideshare.net/weaveworks/project-frankenstein-a-multitenant-horizontally-scalable-prometheus-as-a-service), 09/2016


## InfluxDB

[InfluxDB](https://www.influxdata.com/time-series-platform/influxdb/) is a time series database designed to handle high write and query loads and is meant to be used as a backing store for any use case involving large amounts of timestamped data, including DevOps monitoring, application metrics, IoT sensor data, and real-time analytics. InfluxDB supports the [Prometheus remote read and write API](https://docs.influxdata.com/influxdb/v1.6/supported_protocols/prometheus).

Further references:

* [InfluxDB Now Supports Prometheus Remote Read & Write Natively](https://www.influxdata.com/blog/influxdb-now-supports-prometheus-remote-read-write-natively/), 09/2017
* Paul Dix: [InfluxDB + Prometheus](https://speakerdeck.com/pauldix/influxdb-plus-prometheus), 08/2017 


## M3

[M3](http://m3db.github.io/m3/) is a metrics platform, originally developed at Uber, that is built on M3DB, a distributed timeseries database and it provides an [integration of M3DB with Prometheus](http://m3db.github.io/m3/integrations/prometheus/).

Further references:

* [M3: Uber’s Open Source, Large-scale Metrics Platform for Prometheus](https://eng.uber.com/m3/), 08/2018

## Thanos

[Thanos](https://github.com/improbable-eng/thanos) is a set of components that can be composed into a highly available metric system with unlimited storage capacity. It can be added seamlessly on top of existing Prometheus deployments and leverages the Prometheus 2.0 storage format to cost-efficiently store historical metric data in any object storage while retaining fast query latencies. Additionally, it provides a global query view across all Prometheus installations and can merge data from Prometheus HA pairs on the fly.

Further references:

* Fabian Reinartz: [The new Prometheus storage engine](https://www.youtube.com/watch?v=6P-RmOWWA4U), 06/2018
* [Introducing Thanos: Prometheus at scale](https://improbable.io/games/blog/thanos-prometheus-at-scale), 05/2018

## PromCon 2018 panel discussion

Last but not least, have a look at this [PromCon 2018 panel on LTS approaches](https://youtu.be/VvJx0WTiGcA?t=23774) to understand the motivation and design considerations behind each of the above listed offerings better:

<iframe width="560" height="315" src="https://www.youtube.com/watch?v=3pTG_N8yGSU" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

In a nutshell: while Prometheus itself does not support long-term retention of your time series data, there are a number of solutions you can choose from to make this possible.