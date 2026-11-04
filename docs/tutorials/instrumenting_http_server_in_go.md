---
title: Instrumenting HTTP server written in Go
sort_rank: 3
---

In this tutorial we will create a simple Go HTTP server and instrument it by adding a counter
metric to keep count of the total number of requests processed by the server.

Here we have a simple HTTP server with `/ping` endpoint which returns `pong` as response.

```go
package main

import (
   "fmt"
   "net/http"
)

func ping(w http.ResponseWriter, req *http.Request) {
   fmt.Fprintf(w,"pong")
}

func main() {
   http.HandleFunc("/ping", ping)

   http.ListenAndServe(":8090", nil)
}
```

Compile and run the server

```bash
go build server.go
./server
```

Now open `http://localhost:8090/ping` in your browser and you must see `pong`.

[![Server](/assets/docs/tutorial/server.png)](/assets/docs/tutorial/server.png)


Now let's add a metric to the server which will instrument the number of requests made to the ping endpoint. The counter metric type is suitable for this as we know the request count doesn’t go down and only increases.

Create a Prometheus counter

```go
type metrics struct {
	pingCounter prometheus.Counter
}

func newMetrics(reg prometheus.Registerer) *metrics {
	m := &metrics{
		pingCounter: promauto.With(reg).NewCounter(
			prometheus.CounterOpts{
				Name: "ping_request_count",
				Help: "Number of requests handled by the ping handler.",
			}),
	}
	return m
}
```

Next, let's update the ping handler to increase the count of the counter using `m.pingCounter.Inc()`.

```go
func ping(m *metrics) func(w http.ResponseWriter, req *http.Request) {
	return func(w http.ResponseWriter, req *http.Request) {
		m.pingCounter.Inc()
		fmt.Fprintf(w, "pong")
	}
}
```

Then create a Prometheus registry, register collectors for Go runtime and process metrics as well as the counter, and expose the metrics.

```go
func main() {
	reg := prometheus.NewRegistry()
	reg.MustRegister(
		collectors.NewGoCollector(),
		collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}),
	)
	m := newMetrics(reg)

	http.HandleFunc("/ping", ping(m))
	http.Handle("/metrics", promhttp.HandlerFor(reg, promhttp.HandlerOpts{}))
	http.ListenAndServe(":8090", nil)
}
```

A custom registry starts empty, so `reg.MustRegister` adds the Go runtime and process collectors.
`promauto.With(reg).NewCounter(...)` creates the counter and registers it with `reg`.
To expose the metrics, the Go Prometheus client library provides the promhttp package.
`promhttp.HandlerFor(reg, promhttp.HandlerOpts{})` provides an `http.Handler` which exposes the metrics registered in `reg`.

Replace `server.go` with the complete instrumented example:

```go
package main

import (
	"fmt"
	"net/http"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

type metrics struct {
	pingCounter prometheus.Counter
}

func newMetrics(reg prometheus.Registerer) *metrics {
	m := &metrics{
		pingCounter: promauto.With(reg).NewCounter(
			prometheus.CounterOpts{
				Name: "ping_request_count",
				Help: "Number of requests handled by the ping handler.",
			}),
	}
	return m
}

func ping(m *metrics) func(w http.ResponseWriter, req *http.Request) {
	return func(w http.ResponseWriter, req *http.Request) {
		m.pingCounter.Inc()
		fmt.Fprintf(w, "pong")
	}
}

func main() {
	reg := prometheus.NewRegistry()
	reg.MustRegister(
		collectors.NewGoCollector(),
		collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}),
	)
	m := newMetrics(reg)

	http.HandleFunc("/ping", ping(m))
	http.Handle("/metrics", promhttp.HandlerFor(reg, promhttp.HandlerOpts{}))
	http.ListenAndServe(":8090", nil)
}
```

Run the example
```bash
go mod init prom_example
go mod tidy
go run server.go
```

After three requests to `http://localhost:8090/ping`, a request to `http://localhost:8090/metrics` returns metrics including:

[![Metrics page showing go_threads, ping_request_count with a value of 3, and process_cpu_seconds_total](/assets/docs/tutorial/ping_metric.png)](/assets/docs/tutorial/ping_metric.png)

Here, the `ping_request_count` shows that the `/ping` endpoint was called 3 times.

The Go and process collectors also expose metrics such as `go_threads` and `process_cpu_seconds_total`.
The available process metrics depend on the operating system.

We have built our first metric exporter. Let’s update our Prometheus config to scrape the metrics from our server.

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ["localhost:9090"]
  - job_name: simple_server
    static_configs:
      - targets: ["localhost:8090"]
```

<code>prometheus --config.file=prometheus.yml</code>

<iframe width="560" height="315" src="https://www.youtube.com/embed/yQIWgZoiW0o" frameborder="0" allowfullscreen></iframe>
