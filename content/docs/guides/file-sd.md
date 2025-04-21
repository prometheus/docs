---
title: Use file-based service discovery to discover scrape targets
---

# Use file-based service discovery to discover scrape targets

Prometheus offers a variety of [service discovery options](https://github.com/prometheus/prometheus/tree/main/discovery) for discovering scrape targets, including [Kubernetes](/docs/prometheus/latest/configuration/configuration/#kubernetes_sd_config), [Consul](/docs/prometheus/latest/configuration/configuration/#consul_sd_config), and many others. If you need to use a service discovery system that is not currently supported, your use case may be best served by Prometheus' [file-based service discovery](/docs/prometheus/latest/configuration/configuration/#file_sd_config) mechanism, which enables you to list scrape targets in a JSON file (along with metadata about those targets).

In this guide, we will:

* Install and run a Prometheus [Node Exporter](../node-exporter) locally
* Create a `targets.json` file specifying the host and port information for the Node Exporter
* Install and run a Prometheus instance that is configured to discover the Node Exporter using the `targets.json` file

## Installing and running the Node Exporter

See [this section](../node-exporter#installing-and-running-the-node-exporter) of the [Monitoring Linux host metrics with the Node Exporter](../node-exporter) guide. The Node Exporter runs on port 9100. To ensure that the Node Exporter is exposing metrics:

```bash
curl http://localhost:9100/metrics
```

The metrics output should look something like this:

```
# HELP go_gc_duration_seconds A summary of the GC invocation durations.
# TYPE go_gc_duration_seconds summary
go_gc_duration_seconds{quantile="0"} 0
go_gc_duration_seconds{quantile="0.25"} 0
go_gc_duration_seconds{quantile="0.5"} 0
...
```

## Installing, configuring, and running Prometheus

Like the Node Exporter, Prometheus is a single static binary that you can install via tarball. [Download the latest release](/download#prometheus) for your platform and untar it:

```bash
wget https://github.com/prometheus/prometheus/releases/download/v*/prometheus-*.*-amd64.tar.gz
tar xvf prometheus-*.*-amd64.tar.gz
cd prometheus-*.*
```

The untarred directory contains a `prometheus.yml` configuration file. Replace the current contents of that file with this:

```yaml
scrape_configs:
- job_name: 'node'
  file_sd_configs:
  - files:
    - 'targets.json'
```

This configuration specifies that there is a job called `node` (for the Node Exporter) that retrieves host and port information for Node Exporter instances from a `targets.json` file.

Now create that `targets.json` file and add this content to it:

```json
[
  {
    "labels": {
      "job": "node"
    },
    "targets": [
      "localhost:9100"
    ]
  }
]
```

NOTE: In this guide we'll work with JSON service discovery configurations manually for the sake of brevity. In general, however, we recommend that you use some kind of JSON-generating process or tool instead.

This configuration specifies that there is a `node` job with one target: `localhost:9100`.

Now you can start up Prometheus:

```bash
./prometheus
```

If Prometheus has started up successfully, you should see a line like this in the logs:

```
level=info ts=2018-08-13T20:39:24.905651509Z caller=main.go:500 msg="Server is ready to receive web requests."
```

## Exploring the discovered services' metrics

With Prometheus up and running, you can explore metrics exposed by the `node` service using the Prometheus [expression browser](/docs/visualization/browser). If you explore the [`up{job="node"}`](http://localhost:9090/graph?g0.range_input=1h&g0.expr=up%7Bjob%3D%22node%22%7D&g0.tab=1) metric, for example, you can see that the Node Exporter is being appropriately discovered.

## Changing the targets list dynamically

When using Prometheus' file-based service discovery mechanism, the Prometheus instance will listen for changes to the file and automatically update the scrape target list, without requiring an instance restart. To demonstrate this, start up a second Node Exporter instance on port 9200. First navigate to the directory containing the Node Exporter binary and run this command in a new terminal window:

```bash
./node_exporter --web.listen-address=":9200"
```

Now modify the config in `targets.json` by adding an entry for the new Node Exporter:

```json
[
  {
    "targets": [
      "localhost:9100"
    ],
    "labels": {
      "job": "node"
    }
  },
  {
    "targets": [
      "localhost:9200"
    ],
    "labels": {
      "job": "node"
    }
  }
]
```

When you save the changes, Prometheus will automatically be notified of the new list of targets. The [`up{job="node"}`](http://localhost:9090/graph?g0.range_input=1h&g0.expr=up%7Bjob%3D%22node%22%7D&g0.tab=1) metric should display two instances with `instance` labels `localhost:9100` and `localhost:9200`.

## Summary

In this guide, you installed and ran a Prometheus Node Exporter and configured Prometheus to discover and scrape metrics from the Node Exporter using file-based service discovery.
