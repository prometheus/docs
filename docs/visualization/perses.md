---
title: Perses support for Prometheus
nav_title: Perses
sort_rank: 3
---

[Perses](https://perses.dev) supports Prometheus since the beginning of the project.

Here is an example of a Perses dashboard querying Prometheus for data:

[![Perses screenshot](/assets/docs/perses_prometheus.png)](/assets/docs/perses_prometheus.png)

## Installing

To install Perses, see the official [Perses documentation](https://perses.dev/perses/docs/installation/in-a-container/).

## Using

By default, Perses will be listening on port `8080`. You can access the web UI at `http://localhost:8080`. There is no
login by default.

### Data source in Perses

Perses supports and provides a way to define data sources. It slightly differs from how it is done in Grafana, but you
should not be so surprised if you are familiar with Grafana.

Data sources concept is defined in the [Perses documentation](https://perses.dev/perses/docs/concepts/datasources).

### Importing pre-built dashboards

Perses is providing a set of pre-built dashboards that you can import into your instance. These dashboards are
maintained by the community and can be found in
the [Perses dashboard repository](https://github.com/perses/community-dashboards)
