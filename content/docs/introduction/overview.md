---
title: Overview
sort_rank: 1
---

## What is Prometheus?

[Prometheus](https://github.com/prometheus) is an open-source systems
monitoring and alerting toolkit built at [SoundCloud](http://soundcloud.com).
Since its inception in 2012, it has become the standard for instrumenting new
services at SoundCloud. Prometheus' main distinguishing features as compared to
other monitoring systems are:

- a **multi-dimensional** data model (via key/value pairs attached to timeseries)
- a [**flexible query language**](http://localhost:3000/using/querying/basics/)
  to leverage this dimensionality
- no reliance on distributed storage; **single server nodes are autonomous**
- timeseries collection happens via a **pull model** over HTTP
- **pushing timeseries** is supported via an intermediary gateway
- targets are discovered via **service discovery** or **static configuration**
- multiple modes of **graphing and dashboarding support**
- **federation support** coming soon

The Prometheus ecosystem consists of multiple components, many of which are
optional:

- the main [Prometheus server](https://github.com/prometheus/prometheus) which scrapes and stores timeseries data
- client libraries for instrumenting application code
- a [push gateway](https://github.com/prometheus/pushgateway) for supporting short-lived jobs
- a [GUI-based dashboard builder](PromDash) based on Rails/SQL
- special-purpose exporters (for HAProxy, StatsD, Ganglia, etc.) 
- an (experimental) [alert manager](https://github.com/prometheus/alertmanager)
- a [command-line querying tool](https://github.com/prometheus/prometheus_cli)
- various support tools

## When does it fit?

Prometheus works well both for machine-based monitoring as well as monitoring
of highly dynamic service-oriented architectures. In a world of microservices,
its support for multi-dimensional data collection and querying is a particular
strength.

TODO: highlight advantage of not depending on distributed storage.
