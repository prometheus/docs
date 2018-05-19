---
title: First steps
sort_rank: 3
---

# First steps with Prometheus

Welcome to Prometheus! Prometheus is a monitoring platform that collects metrics from monitored targets by scraping metrics HTTP endpoints on these targets. This guide will show you to how to install, configure and monitor our first resource with Prometheus. You'll download, install and run Prometheus. You'll also download and install an exporter, tools that expose time series data on hosts and services. Our first exporter will be the Node Exporter, which exposes host-level metrics like CPU, memory, and disk. 

## Downloading Prometheus

[Download the latest release](/download) of Prometheus for your platform, then
extract it:

```language-bash
tar xvfz prometheus-*.tar.gz
cd prometheus-*
```

The Prometheus server is a single binary called `prometheus` (or `prometheus.exe` on Microsoft Windows). We can run the binary and see help on its options by passing the `--help` flag.

```language-bash
./prometheus --help
usage: prometheus [<flags>]

The Prometheus monitoring server

. . .
```

Before starting Prometheus, let's configure it. 

## Configuring Prometheus

Prometheus configuration is [YAML](http://www.yaml.org/start.html). The Prometheus download comes with a sample configuration in a file called `prometheus.yml` that is a good place to get started.

We've stripped out most of the comments in the example file to make it more succinct (comments are the lines prefixed with a `#`).

```language-yaml
global:
  scrape_interval:     15s
  evaluation_interval: 15s

rule_files:
  # - "first.rules"
  # - "second.rules"

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ['localhost:9090']
```

There are three blocks of configuration in the example configuration file: `global`, `rule_files`, and `scrape_configs`. 

The `global` block controls the Prometheus server's global configuration. We have two options present. The first, `scrape_interval`, controls how often Prometheus will scrape targets. You can override this for individual targets. In this case the global setting is to scrape every 15 seconds. The `evaluation_interval` option controls how often Prometheus will evaluate rules. Prometheus uses rules to create new time series and to generate alerts.

The `rule_files` block specifies the location of any rules we want the Prometheus server to load. For now we've got no rules.

The last block, `scrape_configs`, controls what resources Prometheus monitors. Since Prometheus also exposes data about itself as an HTTP endpoint it can scrape and monitor its own health. In the default configuration there is a single job, called `prometheus`, which scrapes the time series data exposed by the Prometheus server. The job contains a single, statically configured, target, the `localhost` on port `9090`. Prometheus expects metrics to be available on targets on a path of `/metrics`. So this default job is scraping via the URL: http://localhost:9090/metrics.

The time series data returned will detail the state and performance of the Prometheus server.

For a complete specification of configuration options, see the
[configuration documentation](/docs/operating/configuration).

## Starting Prometheus

To start Prometheus with our newly created configuration file, change to the directory containing the Prometheus binary and run:

```language-bash
./prometheus --config.file=prometheus.yml
```

Prometheus should start up. You should also be able to browse to a status page about itself at http://localhost:9090. Give it about 30 seconds to collect data about itself from its own HTTP metrics endpoint.

You can also verify that Prometheus is serving metrics about itself by
navigating to its own metrics endpoint: http://localhost:9090/metrics.

## Using the expression browser

Let us try looking at some data that Prometheus has collected about itself. To
use Prometheus's built-in expression browser, navigate to
http://localhost:9090/graph and choose the "Console" view within the "Graph"
tab.

As you can gather from http://localhost:9090/metrics, one metric that
Prometheus exports about itself is called
`http_requests_total` (the total number of HTTP requests the Prometheus server has made). Go ahead and enter this into the expression console:

```
http_requests_total
```

This should return a number of different time series (along with the latest value recorded for each), all with the metric name `http_requests_total`, but with different labels. These labels designate different types of requests.

If we were only interested in requests that resulted in HTTP code `200`, we could use this query to retrieve that information:

```
http_requests_total{code="200"}
```

To count the number of returned time series, you could write:

```
count(http_requests_total)
```

For more about the expression language, see the
[expression language documentation](/docs/querying/basics/).

## Using the graphing interface

To graph expressions, navigate to http://localhost:9090/graph and use the "Graph" tab.

For example, enter the following expression to graph the per-second HTTP request rate happening in the self-scraped Prometheus:

```
rate(http_requests_total[1m])
```

You can experiment with the graph range parameters and other settings.

## Installing the Node Exporter

Collecting metrics from Prometheus alone is not a good representation of Prometheus' capabilities. So let's use the Node Exporter to monitor our first resource. We're going to monitor the local Linux host that the Prometheus server is running on but you could monitor any Linux or OS X host. There's also [a WMI exporter](https://github.com/martinlindhe/wmi_exporter) for Microsoft Windows hosts too.

[Download the latest release of the Node Exporter](/download/#node_exporter) of Prometheus for your platform, then extract it:

```language-bash
tar xvfz node_exporter-*.tar.gz
cd node_exporter-*
```

The Node Exporter is a single binary, `node_exporter`, and has a configurable set of collectors for gathering various types of host-based metrics. By default, collectors gather [CPU, memory, disk, and other metrics](https://github.com/prometheus/node_exporter#enabled-by-default) and expose them for scraping.

Let's start the Node Exporter now on our Linux host.

```language-bash
./node_exporter
```

The Node Exporter's metrics are available on port `9100` on the host at the `/metrics` path. In our case this is: http://localhost:9100/metrics.

You can browse to this URL to see the metrics being exposed.

We now need to tell Prometheus about our new exporter.

## Configuring Prometheus to monitor the host

We will configure Prometheus to scrape this new target. To achieve this, add a new job definition to the `scrape_configs` section in our `prometheus.yml`:

```
- job_name: node
  static_configs:
    - targets: ['localhost:9100']
```

Our new job is called `node`. It scrapes a static target, `localhost` on port `9100`. You would replace this name with the name or IP address of the host you're monitoring. 

Now we restart our Prometheus server to activate our new job.

Go to the expression browser and verify that Prometheus now has information
about the time series that this endpoint exposes. Navigate to
http://localhost:9090/graph and use the dropdown next to the "Execute" button to see a list of metrics this server is collecting. In the list you'll see a number of metrics prefixed with `node_`, that have been collected by the Node Exporter by our `node` job. For example, you can see the node's CPU usage via the `node_cpu` metric. 

One useful metric to look for is the `up` metric. The `up` metric can be used to track the status of the target. If the metric has a value of `1` then the scrape of the target was successful, if `0` it failed. This can help give you an indication of the status of the target. You'll see two `up` metrics, one for each target we're scraping: the Prometheus server and the Node Exporter.

## Summary

Now you've been introduced to Prometheus, installed it, and configured it to monitor your first resources. We've also installed our first exporter and seen the basics of how to work with time series data scraped using the expression browser. You can find more [documentation](/docs/introduction/overview/) to help you continue to learn more about Prometheus. 
