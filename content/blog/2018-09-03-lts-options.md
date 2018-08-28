---
title: Prometheus Long-Term Storage Options
created_at: 2018-09-03
kind: article
author_name: Michael Hausenblas
---

While Prometheus itself does not offer a clustered storage solution to store data across multiple machines there are a number of so called Long-Term Storage (LTS) options available. This article reviews the, at the time of writing, available options. We will not provide a recommendation which LTS solution you should pick, since it very much depends on your requirements and preferences, which are unknown to us.

Prometheus [stores](https://prometheus.io/docs/prometheus/latest/storage/) data on local storage, which limits the data you can query or otherwise process to the most recent days or weeks, depending on how much space you have available, locally. If you, however, have the need to retain data for longer time periods, for example for long-term capacity planning, analyzing usage trends, or for regulatory reasons (think financial domain, health care, etc.) then you likely benefit from a LTS solution.

There are a number of ways to achieve this (in alphabetical order):

* [Cortex](https://github.com/weaveworks/cortex)
* [InfluxDB](https://docs.influxdata.com/influxdb/v1.6/supported_protocols/prometheus)
* [M3](http://m3db.github.io/m3/integrations/prometheus/)
* [Thanos](https://github.com/improbable-eng/thanos)

## Cortex

## InfluxDB

## M3

## Thanos


Last but not least, have a look at the PromCon 2018 panel on this topic:

> TODO: embed the video URL of the panel here

> TODO: What else is missing? What other LTS do we want to cover here?