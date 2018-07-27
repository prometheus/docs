---
title: Instrumenting a Go application
---

# Instrumenting a Go application for Prometheus

Prometheus has an official [Go client library](https://github.com/prometheus/client_golang) that you can use to instrument Go applications. In this guide, we'll create a simple Go application that exposes Prometheus metrics via HTTP.

NOTE: For comprehensive API documentation, see the [GoDoc](https://godoc.org/github.com/prometheus/client_golang) for Prometheus' various Go libraries.

## Installation

You can install the main `prometheus` and `promhttp` libraries necessary for the guide using [`go get`](https://golang.org/doc/articles/go_command.html):

```bash
go get github.com/prometheus/client_golang/prometheus
go get github.com/prometheus/client_golang/prometheus/promhttp
```

## How Go exposition works

To expose Prometheus metrics in a Go application, you need to provide a `/metrics` HTTP endpoint. You can use the [`prometheus/promhttp`](https://godoc.org/github.com/prometheus/client_golang/prometheus/promhttp) library's HTTP [`Handler`](https://godoc.org/github.com/prometheus/client_golang/prometheus/promhttp#Handler) as the handler function.

This minimal application, for example, would expose the default metrics for Go applications via `localhost:2112/metrics`:

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

The application [above](#how-go-exposition-works) exposes only the default Go metrics. You can also register your own custom application-specific metrics. This example application exposes a `myapp_queued_ops` [gauge](/docs/concepts/metric_types/#gauge) that registers the number of currently queued operations. Every 2 seconds, the gauge is incremented by one.

```go
package main

import (
        "net/http"
        "time"

        "github.com/prometheus/client_golang/prometheus"
        "github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
        opsQueued = prometheus.NewGauge(prometheus.GaugeOpts{
                Name: "myapp_queued_ops",
                Help: "The number of operations currently queued",
        })
)

func recordMetrics() {
        go func() {
                for {
                        opsQueued.Add(1)
                        time.Sleep(2 * time.Second)
                }
        }()
}

func init() {
        prometheus.MustRegister(opsQueued)
}

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

In the metrics output, you'll see the help text, type information, and current value of the `myapp_queued_ops` gauge:

```
# HELP myapp_queued_ops The number of operations currently queued
# TYPE myapp_queued_ops gauge
myapp_queued_ops 1
```

You can [configure](/docs/prometheus/latest/configuration/configuration/#<scrape_config>) a locally running Prometheus instance to scrape metrics from the application. Here's an example `prometheus.yml` configuration:

```yaml
scrape_configs:
- job_name: myapp
  scrape_interval: 10s
  static_configs:
  - targets:
    - localhost:2112
```
