---
title: Instrumenting HTTP server written in Go
sort_rank: 3
---

In this tutorial we will create a simple Go HTTP server and instrumentation it by adding a counter
metric to keep count of the total number of requests processed by the server.

Here we have a simple HTTP server with `/ping` endpoint which returns `pong` as response.

```go
package main

import (
   "fmt"
   "net/http"
)

func ping(w http.ResponseWriter, req *http.Request){
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
./server.go
```

Now open `http://localhost:8090/ping` in your browser and you must see `pong`.

[![Server](/assets/tutorial/server.png)](/assets/tutorial/server.png)


Now lets add a metric to the server which will instrument the number of requests made to the ping endpoint, the counter metric type is suitable for this as we know the request count doesn’t go down and only increases.

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
				Help: "No of request handled by Ping handler",
			}),
	}
	return m
}
```

Next lets update the ping Handler to increase the count of the counter using `metrics.pingCounter.Inc()`.

```go
func ping(m *metrics) func(w http.ResponseWriter, req *http.Request) {
	return func(w http.ResponseWriter, req *http.Request) {
		m.pingCounter.Inc()
		fmt.Fprintf(w, "pong")
	}
}
```

Then register the metrics (in this case only one counter) to a Prometheus Register and expose the metrics.

```go
func main() {
	reg := prometheus.NewRegistry()
	m := newMetrics(reg)

	http.HandleFunc("/ping", ping(m))
	http.Handle("/metrics", promhttp.HandlerFor(reg, promhttp.HandlerOpts{}))
	http.ListenAndServe(":8090", nil)
}
```

The `prometheus.MustRegister` function registers the pingCounter to the default Register.
To expose the metrics the Go Prometheus client library provides the promhttp package.
`promhttp.Handler()` provides a `http.Handler` which exposes the metrics registered in the Default Register.

The sample code depends on the

```go
package main

import (
	"fmt"
	"net/http"

	"github.com/prometheus/client_golang/prometheus"
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
				Help: "No of request handled by Ping handler",
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
go run main.go
```

Now hit the localhost:8090/ping endpoint a couple of times and sending a request to localhost:8090 will provide the metrics.

[![Ping Metric](/assets/tutorial/ping_metric.png)](/assets/tutorial/ping_metric.png)

Here the ping_request_count shows that `/ping` endpoint was called 3 times.

The DefaultRegister comes with a collector for go runtime metrics and that is why we see other metrics like go_threads, go_goroutines etc.

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
