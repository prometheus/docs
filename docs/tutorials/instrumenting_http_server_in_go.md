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
   http.HandleFunc("/ping",ping)

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


Now lets add a metric to the server which will instrument the number of requests made to the ping endpoint,the counter metric type is suitable for this as we know the request count doesn’t go down and only increases.

Create a Prometheus counter

```go
var pingCounter = prometheus.NewCounter(
   prometheus.CounterOpts{
       Name: "ping_request_count",
       Help: "No of request handled by Ping handler",
   },
)
```

Next lets update the ping Handler to increase the count of the counter using `pingCounter.Inc()`.

```go
func ping(w http.ResponseWriter, req *http.Request) {
   pingCounter.Inc()
   fmt.Fprintf(w, "pong")
}
```

Then register the counter to the Default Register and expose the metrics.

```go
func main() {
   prometheus.MustRegister(pingCounter)
   http.HandleFunc("/ping", ping)
   http.Handle("/metrics", promhttp.Handler())
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
   "github.com/prometheus/client_golang/prometheus/promhttp"
)

var pingCounter = prometheus.NewCounter(
   prometheus.CounterOpts{
       Name: "ping_request_count",
       Help: "No of request handled by Ping handler",
   },
)

func ping(w http.ResponseWriter, req *http.Request) {
   pingCounter.Inc()
   fmt.Fprintf(w, "pong")
}

func main() {
   prometheus.MustRegister(pingCounter)

   http.HandleFunc("/ping", ping)
   http.Handle("/metrics", promhttp.Handler())
   http.ListenAndServe(":8090", nil)
}
```

Run the example

```sh
go mod init prom_example
go mod tidy
go run server.go
```

Now hit the localhost:8090/ping endpoint a couple of times and sending a request to localhost:8090 will provide the metrics.

[![Ping Metric](/assets/docs/tutorial/ping_metric.png)](/assets/docs/tutorial/ping_metric.png)

Here the `ping_request_count` shows that `/ping` endpoint was called 3 times.

The Default Register comes with a collector for go runtime metrics and that is why we see other metrics like `go_threads`, `go_goroutines` etc.

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
