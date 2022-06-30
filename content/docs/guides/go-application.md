---
title: Instrumenting a Go application
---

# Instrumenting a Go application for Prometheus

Prometheus has an official [Go client library](https://github.com/prometheus/client_golang) that you can use to instrument Go applications. In this guide, we'll create a simple Go application that exposes Prometheus metrics via HTTP.

NOTE: For comprehensive API documentation, see the [GoDoc](https://godoc.org/github.com/prometheus/client_golang) for Prometheus' various Go libraries.

## Installation

You can install the `prometheus`, `promauto`, and `promhttp` libraries necessary for the guide using [`go get`](https://golang.org/doc/articles/go_command.html):

```bash
go get github.com/prometheus/client_golang/prometheus
go get github.com/prometheus/client_golang/prometheus/promauto
go get github.com/prometheus/client_golang/prometheus/promhttp
```

## How Go exposition works

To expose Prometheus metrics in a Go application, you need to provide a `/metrics` HTTP endpoint. You can use the [`prometheus/promhttp`](https://godoc.org/github.com/prometheus/client_golang/prometheus/promhttp) library's HTTP [`Handler`](https://godoc.org/github.com/prometheus/client_golang/prometheus/promhttp#Handler) as the handler function.

This minimal application, for example, would expose the default metrics for Go applications via `http://localhost:2112/metrics`:

```go
package main

import (
        "net/http"

        "github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
        http.Handle("/metrics", promhttp.Handler())
        http.ListenAndServe(":2112", nil)
}
```

To start the application:

```bash
go run main.go
```

To access the metrics:

```bash
curl http://localhost:2112/metrics
```

## Adding your own metrics

The application [above](#how-go-exposition-works) exposes only the default Go metrics. You can also register your own custom application-specific metrics. This example application exposes a `myapp_processed_ops_total` [counter](/docs/concepts/metric_types/#counter) that counts the number of operations that have been processed thus far. Every 2 seconds, the counter is incremented by one.

```go
package main

import (
	"net/http"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func recordMetrics() {
	go func() {
		for {
			opsProcessed.Inc()
			time.Sleep(2 * time.Second)
		}
	}()
}

var (
	opsProcessed = promauto.NewCounter(prometheus.CounterOpts{
		Name: "myapp_processed_ops_total",
		Help: "The total number of processed events",
	})
)

func main() {
	recordMetrics()

	http.Handle("/metrics", promhttp.Handler())
	http.ListenAndServe(":2112", nil)
}
```

To run the application:

```bash
go run main.go
```

To access the metrics:

```bash
curl http://localhost:2112/metrics
```

In the metrics output, you'll see the help text, type information, and current value of the `myapp_processed_ops_total` counter:

```
# HELP myapp_processed_ops_total The total number of processed events
# TYPE myapp_processed_ops_total counter
myapp_processed_ops_total 5
```

You can [configure](/docs/prometheus/latest/configuration/configuration/#scrape_config) a locally running Prometheus instance to scrape metrics from the application. Here's an example `prometheus.yml` configuration:

```yaml
scrape_configs:
- job_name: myapp
  scrape_interval: 10s
  static_configs:
  - targets:
    - localhost:2112
```

## Other Go client features

In this guide we covered just a small handful of features available in the Prometheus Go client libraries. You can also expose other metrics types, such as [gauges](https://godoc.org/github.com/prometheus/client_golang/prometheus#Gauge) and [histograms](https://godoc.org/github.com/prometheus/client_golang/prometheus#Histogram), [non-global registries](https://godoc.org/github.com/prometheus/client_golang/prometheus#Registry), functions for [pushing metrics](https://godoc.org/github.com/prometheus/client_golang/prometheus/push) to Prometheus [PushGateways](/docs/instrumenting/pushing/), bridging Prometheus and [Graphite](https://godoc.org/github.com/prometheus/client_golang/prometheus/graphite), and more.

## Summary

In this guide, you created two sample Go applications that expose metrics to Prometheus---one that exposes only the default Go metrics and one that also exposes a custom Prometheus counter---and configured a Prometheus instance to scrape metrics from those applications.
