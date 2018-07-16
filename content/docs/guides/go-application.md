---
title: Instrumenting a Go application
---

# Instrumenting a Go application for Prometheus

Prometheus has an official [Go client library](https://github.com/prometheus/client_golang) that you can use to [instrument](/docs/instrumenting/pushing) Go applications. In this guide, we'll create a simple Go application that exposes Prometheus metrics via HTTP.

NOTE: For comprehensive API documentation, see the [GoDoc](https://godoc.org/github.com/prometheus/client_golang) for Prometheus' various Go libraries.

## Installation

You can install the main `prometheus` library using [`go get`](https://golang.org/doc/articles/go_command.html):

```bash
go get github.com/prometheus/client_golang/prometheus
```

See the [GoDoc](https://godoc.org/github.com/prometheus/client_golang#pkg-subdirectories) for a listing of other libraries you may need to install.

## How Go instrumentation works

To instrument a Go application, you need to expose a `/metrics` HTTP endpoint that serves Prometheus metrics using the [`prometheus/promhttp`](https://godoc.org/github.com/prometheus/client_golang/prometheus/promhttp) library.

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

## Example application with non-default metrics

The application [above](#how-go-instrumentation-works) exposes only the default Go metrics. You can also register your own custom application-specific metrics. This example application exposes an `opsQueued` [gauge](/docs/concepts/metric_types/#gauge) that registers the number of currently queued operations. Every 2 seconds, the gauge is incremented by one.

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
                Name: "ops_queued",
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

func main() {
        prometheus.MustRegister(opsQueued)

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

In the metrics output, you'll see the help text, type information, and current value of the `ops_queued` gauge:

```
# HELP ops_queued The number of operations currently queued
# TYPE ops_queued gauge
ops_queued 1
```
