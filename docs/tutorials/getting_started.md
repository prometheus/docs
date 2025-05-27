---
title: Getting Started with Prometheus
sort_rank: 1
---

# What is Prometheus ?

Prometheus is a system monitoring and alerting system. It was opensourced by SoundCloud in 2012 and is the second project both to join and to graduate within Cloud Native Computing Foundation after Kubernetes. Prometheus stores all metrics data as time series, i.e metrics information is stored along with the timestamp at which it was recorded, optional key-value pairs called as labels can also be stored along with metrics.
# What are metrics and why is it important?

Metrics in layperson terms is a standard for measurement. What we want to measure depends from application to application. For a web server it can be request times, for a database it can be CPU usage or number of active connections etc.

Metrics play an important role in understanding why your application is working in a certain way. If you run a web application and someone comes up to you and says that the application is slow, you will need some information to find out what is happening with your application. For example the application can become slow when the number of requests are high. If you have the request count metric you can spot the reason and increase the number of servers to handle the heavy load. Whenever you are defining the metrics for your application you must put on your detective hat and ask this question **what all information will be important for me to debug if any issue occurs in my application?**

# Basic Architecture of Prometheus

The basic components of a Prometheus setup are:

- Prometheus Server (the server which scrapes and stores the metrics data).
- Targets to be scraped, for example an instrumented application that exposes its metrics, or an exporter that exposes metrics of another application.
- Alertmanager to raise alerts based on preset rules.

(Note: Apart from this Prometheus has push_gateway which is not covered here).

[![Architecture](/assets/docs/tutorial/architecture.png)](/assets/docs/tutorial/architecture.png)

Let's consider a web server as an example application and we want to extract a certain metric like the number of API calls processed by the web server. So we add certain instrumentation code using the Prometheus client library and expose the metrics information. Now that our web server exposes its metrics we can configure Prometheus to scrape it. Now Prometheus is configured to fetch the metrics from the web server which is listening on xyz IP address port 7500 at a specific time interval, say, every minute.

At 11:00:00 when I make the server public for consumption, the application calculates the request count and exposes it, Prometheus simultaneously scrapes the count metric and stores the value as 0.

By 11:01:00 one request is processed. The instrumentation logic in the server increments the count to 1. When Prometheus scrapes the metric the value of count is 1 now.

By 11:02:00 two more requests are processed and the request count is 1+2 = 3 now. Similarly metrics are scraped and stored.

The user can control the frequency at which metrics are scraped by Prometheus.

| Time Stamp | Request Count (metric) |
| ---------- | ---------------------- |
| 11:00:00   | 0                      |
| 11:01:00   | 1                      |
| 11:02:00   | 3                      |

(Note: This table is just a representation for understanding purposes. Prometheus doesn’t store the values in this exact format)

Prometheus also has an API which allows to query metrics which have been stored by scraping. This API is used to query the metrics, create dashboards/charts on it etc. PromQL is used to query these metrics.

A simple Line chart created on the Request Count metric will look like this

[![Graph](/assets/docs/tutorial/sample_graph.png)](/assets/docs/tutorial/sample_graph.png)

One can scrape multiple useful metrics to understand what is happening in the application and create multiple charts on them. Group the charts into a dashboard and use it to get an overview of the application.

# Show me how it is done

Let’s get our hands dirty and setup Prometheus. Prometheus is written using [Go](https://golang.org/) and all you need is the binary compiled for your operating system. Download the binary corresponding to your operating system from [here](https://prometheus.io/download/) and add the binary to your path.

Prometheus exposes its own metrics which can be consumed by itself or another Prometheus server.

Now that we have Prometheus installed, the next step is to run it. All that we need is just the binary and a configuration file. Prometheus uses yaml files for configuration.


```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ["localhost:9090"]
```

In the above configuration file we have mentioned the `scrape_interval`, i.e how frequently we want Prometheus to scrape the metrics. We have added `scrape_configs` which has a name and target to scrape the metrics from. Prometheus by default listens on port 9090. So add it to targets.

> prometheus --config.file=prometheus.yml

<iframe width="560" height="315" src="https://www.youtube.com/embed/ioa0eISf1Q0" frameborder="0" allowfullscreen></iframe>

Now we have Prometheus up and running and scraping its own metrics every 15s. Prometheus has standard exporters available to export metrics. Next we will run a node exporter which is an exporter for machine metrics and scrape the same using Prometheus. ([Download node metrics exporter.](https://prometheus.io/download/#node_exporter))

Run the node exporter in a terminal.

<code>./node_exporter</code>

[![Node exporter](/assets/docs/tutorial/node_exporter.png)](/assets/docs/tutorial/node_exporter.png)

Next, add node exporter to the list of scrape_configs:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ["localhost:9090"]
  - job_name: node_exporter
    static_configs:
      - targets: ["localhost:9100"]
```

<iframe width="560" height="315" src="https://www.youtube.com/embed/hM5bp53C7Y8" frameborder="0" allowfullscreen></iframe>

In this tutorial we discussed what are metrics and why they are important, basic architecture of Prometheus and how to
run Prometheus.
