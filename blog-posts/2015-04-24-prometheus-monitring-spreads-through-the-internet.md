---
title: Prometheus Monitoring Spreads through the Internet
created_at: 2015-04-24
kind: article
author_name: Brian Brazil
---

It has been almost three months since we publicly announced Prometheus version
0.10.0, and we're now at version 0.13.1.

[SoundCloud's announcement blog post](https://developers.soundcloud.com/blog/prometheus-monitoring-at-soundcloud)
remains the best overview of the key components of Prometheus, but there has
been a lot of other online activity around Prometheus. This post will let you
catch up on anything you missed.

In the future, we will use this blog to publish more articles and announcements
to help you get the most out of Prometheus.

<!-- more -->

## Using Prometheus

Posts on how to use Prometheus comprise the majority of online content. Here
are the ones we're aware of with the part of the ecosystem they cover:

* Container Exporter: [Monitor Docker Containers with Prometheus](https://5pi.de/2015/01/26/monitor-docker-containers-with-prometheus/)
* HAProxy: [HAProxy Monitoring with Prometheus](http://www.boxever.com/haproxy-monitoring-with-prometheus)
* Java Client: [Easy Java Instrumentation with Prometheus](http://www.boxever.com/easy-java-instrumentation-with-prometheus)
* Java Client and Labels: [The Power of Multi-Dimensional Labels in Prometheus](http://www.boxever.com/the-power-of-multi-dimensional-labels-in-prometheus)
* Node Exporter: [Monitoring your Machines with Prometheus](http://www.boxever.com/monitoring-your-machines-with-prometheus)
* JMX Exporter: [Cassandra Consoles with JMX and Prometheus](http://www.boxever.com/cassandra-consoles-with-jmx-and-prometheus)
* Python Client and Node Exporter Textfile Collector: [Monitoring Python Batch Jobs](http://www.boxever.com/monitoring-python-batch-jobs)
* Mesos Exporter: [Monitoring Mesos tasks with Prometheus](http://www.antonlindstrom.com/2015/02/24/monitoring-mesos-tasks-with-prometheus.html)
* Synapse: [Monitoring Synapse Metrics with Prometheus](http://matrix.org/blog/2015/04/23/monitoring-synapse-metrics-with-prometheus/)

## Articles

These articles look at how Prometheus fits into the broader picture of keeping services up and running:

* [Prometheus: A Next-Generation Monitoring System](http://www.boxever.com/prometheus-a-next-generation-monitoring-system)
* [SoundCloud’s Prometheus: A Monitoring System and Time Series Database Suited for Containers](http://thenewstack.io/soundclouds-prometheus-monitoring-system-time-series-database-suited-containers/)
* [Docker Monitoring Continued: Prometheus and Sysdig](http://rancher.com/docker-monitoring-continued-prometheus-and-sysdig/)

## Philosophy

Monitoring isn't just about the technical details. How it affects the design of
your systems, operations, and human factors are important too:

* [Push vs Pull for Monitoring](http://www.boxever.com/push-vs-pull-for-monitoring)
* [Systems Monitoring with Prometheus](http://www.slideshare.net/brianbrazil/devops-ireland-systems-monitoring-with-prometheus)
* [Monitoring your Python with Prometheus](http://www.slideshare.net/brianbrazil/python-ireland-monitoring-your-python-with-prometheus)

The comments on the [Hacker News post](https://news.ycombinator.com/item?id=8995696) about Prometheus are also insightful.

## Non-English

Several posts have appeared in languages beyond English:

* Japanese how-to about installing Prometheus on CentOS: [データ可視化アプリの新星、PrometheusをCentOSにインストールする方法](http://y-ken.hatenablog.com/entry/how-to-install-prometheus)
* Japanese in-depth tutorial: [【入門】PrometheusでサーバやDockerコンテナのリソース監視](http://pocketstudio.jp/log3/2015/02/11/what_is_prometheus_monitoring/)
* Japanese overview: [Prometheus: Go言語で書かれたモニタリングシステム](http://wazanova.jp/items/1672)
* Russian podcast that mentions Prometheus: [RWPOD 04 выпуск 03 сезона](http://www.rwpod.com/posts/2015/02/02/podcast-03-04.html)

## Closing

Finally, I'd like to share how to run [Prometheus on a Raspberry Pi](https://5pi.de/2015/02/10/prometheus-on-raspberry-pi/).
