---
title: Monitoring Linux host metrics with the Node Exporter
---

# Monitoring Linux host metrics with the Node Exporter

The Prometheus [**Node Exporter**](https://github.com/prometheus/node_exporter) exposes a wide variety of hardware- and kernel-related metrics.

In this guide, you will:

* Start up a Node Exporter on `localhost`
* Start up a Prometheus instance on `localhost` that's configured to scrape metrics from the running Node Exporter

NOTE: While the Prometheus Node Exporter is for *nix systems, there is a [WMI exporter](https://github.com/martinlindhe/wmi_exporter) for Windows that serves an analogous purpose.

## Installing and running the Node Exporter

The Prometheus Node Exporter is a single static binary that you can install [via tarball](#tarball-installation). You can [download](/downloads#node_exporter) page, extract it, and run it:

```bash
wget https://github.com/prometheus/node_exporter/releases/download/v*/node_exporter-*.*-amd64.tar.gz
tar xvfz node_exporter-*.*-amd64.tar.gz
cd node_exporter-*.*-amd64
./node_exporter
```

You should see output like this indicating that the Node Exporter is now running and exposing metrics on port 9100:

```
INFO[0000] Starting node_exporter (version=0.16.0, branch=HEAD, revision=d42bd70f4363dced6b77d8fc311ea57b63387e4f)  source="node_exporter.go:82"
INFO[0000] Build context (go=go1.9.6, user=root@a67a9bc13a69, date=20180515-15:53:28)  source="node_exporter.go:83"
INFO[0000] Enabled collectors:                           source="node_exporter.go:90"
INFO[0000]  - boottime                                   source="node_exporter.go:97"
...
INFO[0000] Listening on :9100                            source="node_exporter.go:111"
```

## Node Exporter metrics

Once the Node Exporter is installed and running, you can verify that metrics are being exported by cURLing the `/metrics` endpoint:

```bash
curl http://localhost:9100/metrics
```

You should see output like this:

```
# HELP go_gc_duration_seconds A summary of the GC invocation durations.
# TYPE go_gc_duration_seconds summary
go_gc_duration_seconds{quantile="0"} 3.8996e-05
go_gc_duration_seconds{quantile="0.25"} 4.5926e-05
go_gc_duration_seconds{quantile="0.5"} 5.846e-05
# etc.
```

Success! The Node Exporter is now exposing metrics that Prometheus can scrape, including a wide variety of system metrics further down in the output (prefixed with `node_`). To view those metrics (along with help and type information):

```bash
curl http://localhost:9100/metrics | grep "node_"
```

## Configuring your Prometheus instances

Your locally running Prometheus instance needs to be properly configured in order to access Node Exporter metrics. The following [`scrape_config`](../prometheus/latest/configuration/configuration/#<scrape_config>) block will tell Prometheus that scrape from the Node Exporter via `localhost:9100`:

```yaml
scrape_configs:
- job_name: 'node'
  static_configs:
  - targets: ['localhost:9100']
```

To install Prometheus, [download the latest release](/download) for your platform,

```bash
tar xvf prometheus-*.*-amd64.tar.gz
cd prometheus-*.*
```

Once Prometheus is installed you can start it up, using the `--config.file` flag to point to the Prometheus configuration that you created:

```bash
./prometheus --config.file=./prometheus.yml
```

## Exploring Node Exporter metrics through the Prometheus expression browser

Now that Prometheus is scraping metrics from a running Node Exporter instance, you can explore those metrics using the Prometheus UI (aka the [expression browser](/docs/visualization/expression-browser)). Navigate to `localhost:9090/graph` in your browser and use the main expression bar at the top of the page to enter expressions, which looks like this:

![](/assets/prometheus-expression-bar.png)

Metrics specific to the Node Exporter are prefixed with `node_` and include metrics like `node_cpu_seconds_total` and `node_exporter_build_info`.

Click on the links below to see some example metrics:

Metric | Type | Meaning
:------|:-----|:-------
[`rate(node_cpu_seconds_total{mode="system"}[1m])`](http://localhost:9090/graph?g0.range_input=1h&g0.expr=rate(node_cpu_seconds_total%7Bmode%3D%22system%22%7D%5B1m%5D)&g0.tab=1) | counter | The number of seconds CPUs have spent in `system` mode in the last minute
[`node_filesystem_avail_bytes`](http://localhost:9090/graph?g0.range_input=1h&g0.expr=node_filesystem_avail_bytes&g0.tab=1) | gauge | The filesystem space available to non-root users (in bytes)
[`node_network_receive_bytes_total`](http://localhost:9090/graph?g0.range_input=1h&g0.expr=node_network_receive_bytes_total&g0.tab=1) | counter |