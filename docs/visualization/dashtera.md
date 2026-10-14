---
title: Dashtera support for Prometheus
nav_title: Dashtera
sort_rank: 4
---

[Dashtera](https://dashtera.com/) is a no-code data visualization and dashboarding platform. It is designed for building
interactive dashboards from data sources like databases, streaming connectors, and files. Dashtera
offers a range of chart and panel types, including high-performance XY, statistical, and 3D visualizations.

Here is an example of a Dashtera dashboard querying Prometheus for data:

[![Dashtera screenshot](/assets/docs/dashtera_prometheus.png)](/assets/docs/dashtera_prometheus.png)

## Getting started

Sign up at [Dashtera](https://dashtera.com/) to create an account and use [Dashtera app](https://app.dashtera.com/) to create a project.

Dashtera offers a free Basic account with limited capacity. The Prometheus connector is not included in the Basic plan,
so connecting Prometheus requires a paid subscription. Paid Dashtera plans include a 14-day free trial; see
[Dashtera pricing](https://dashtera.com/pricing/) for the current plans and terms.

Dashtera's real-time streaming features are also paid. They are offered separately for supported streaming connectors.

## Connecting to Prometheus

In the dashboard designer:

1. Click **Data Sources** in the left-hand menu.
2. Choose **Remote Data Sources** tab.
3. Click **Connection** and select **Prometheus** from the available data connectors.

For the connector setup, see the [Dashtera Prometheus connector documentation](https://docs.dashtera.com/datasources/data-connectors/prometheus/).

## Querying Prometheus data

Enter PromQL directly in Dashtera's query editor, then bind the query results to a visualization panel.

### Historical queries

Range selector when the query should return multiple samples over time.

```promql
rate(http_requests_total[5m])
```

### Real-time monitoring

Instant PromQL expression to monitor the newest available values. Dashtera polls Prometheus to update the data, which you can display.

```promql
http_requests_total
```
