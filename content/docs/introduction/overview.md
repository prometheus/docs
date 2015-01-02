---
title: Overview
sort_rank: 1
---

# Overview

## What is Prometheus?

[Prometheus](https://github.com/prometheus) is an open-source systems
monitoring and alerting toolkit built at [SoundCloud](http://soundcloud.com).
Since its inception in 2012, it has become the standard for instrumenting new
services at SoundCloud and has seen growing external usage and contributions.
Prometheus's main distinguishing features are:

- a **multi-dimensional** data model (time series identified by metric name and key/value pairs)
- a [**flexible query language**](/docs/using/querying/basics/)
  to leverage this dimensionality
- no reliance on distributed storage; **single server nodes are autonomous**
- time series collection happens via a **pull model** over HTTP
- **pushing time series** is supported via an intermediary gateway
- targets are discovered via **service discovery** or **static configuration**
- multiple modes of **graphing and dashboarding support**

The Prometheus ecosystem consists of multiple components, many of which are
optional:

- the main [Prometheus server](https://github.com/prometheus/prometheus) which scrapes and stores time series data
- client libraries for instrumenting application code
- a [push gateway](https://github.com/prometheus/pushgateway) for supporting short-lived jobs
- a [GUI-based dashboard builder](PromDash) based on Rails/SQL
- special-purpose exporters (for HAProxy, StatsD, Ganglia, etc.) 
- an (experimental) [alert manager](https://github.com/prometheus/alertmanager)
- a [command-line querying tool](https://github.com/prometheus/prometheus_cli)
- various support tools

This diagram illustrates the overall architecture of Prometheus and some of
its ecosystem components:

![Prometheus architecture](/assets/architecture.svg)

## When does it fit?

Prometheus works well both for machine-based monitoring as well as monitoring
of highly dynamic service-oriented architectures. In a world of microservices,
its support for multi-dimensional data collection and querying is a particular
strength.

Prometheus is designed for reliability, to be the system you go to
during an outage to allow you to quickly diagnose problems. Each Prometheus
server is standalone, not depending on network storage or other remote services.
You can rely it when other parts of your infrastructure are broken, and
you don't have to setup complex infrastructure to use it.

## When doesn't it fit?

Prometheus values reliability. You can always view what statistics are
available about your system, even under failure conditions. If you need 100%
accuracy, such as for per-request billing, Prometheus is not a good choice as
we keep things simple and easy to understand. In such a case you would be best
using some other system to collect and analyse the data for billing, and
Prometheus for the rest of your monitoring.
