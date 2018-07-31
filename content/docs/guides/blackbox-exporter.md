---
title: Probing HTTP endpoints using the Blackbox Exporter
---

# Probing HTTP endpoints using the Blackbox Exporter

The Prometheus [**Blackbox Exporter**](https://github.com/prometheus/blackbox_exporter) probes service endpoints for a variety of protocols---HTTP, HTTPS, DNS, TCP, and ICMP---and exposes probe-related metrics to Prometheus.

In this guide, you will:

* Create and start up a simple HTTP server that exposes a health check endpoint
* Configure Prometheus to scrape metrics from the Blackbox Exporter
* Configure a Blackbox Exporter to probe that health check endpoint and expose metrics to Prometheus

## Prerequisites

In order to follow along with this guide, you'll need to have the following installed:

* [Python](https://www.python.org) and [pip](https://pypi.org/project/pip)
* the [Flask](http://flask.pocoo.org) web framework, which can be installed using pip:

  ```shell
  pip install flask
  ```

## Local web server with health check

We'll start by creating a simple HTTP server that exposes a single `/health` endpoint. If the server is running, i.e. "healthy," a `GET` request to that endpoint will return a `200 OK` response. The server will be written in Python and use the [Flask](https://pypi.org/project/pip) web framework. Paste this code into a `server.py` file:

```python
from flask import Flask

app = Flask(__name__)

@app.route('/health')
def health():
    return '', 200

if __name__ == '__main__':
    app.run(port=2112)
```

To start up the server:

```shell
python server.py
```

You should see something like this in the logs:

```
Starting up the server on port 2112
 * Serving Flask app "server" (lazy loading)
 * Environment: production
   WARNING: Do not use the development server in a production environment.
   Use a production WSGI server instead.
 * Debug mode: off
 * Running on http://127.0.0.1:2112/ (Press CTRL+C to quit)
```

To test the `/health` endpoint:

```shell
curl -i http://localhost:2112/health
```

If you get a `200 OK` response then the HTTP service is ready to go.

# Installing, configuring, and running Prometheus

To install Prometheus, [download the latest release](/download#prometheus) for your platform and untar it:

```bash
wget https://github.com/prometheus/prometheus/releases/download/v*/prometheus-*.*-amd64.tar.gz
tar xvfz prometheus-*.*-amd64.tar.gz
cd prometheus-*.*-amd64
```

There is a `prometheus.yml` config file in that directory that you can modify to make Prometheus scrape metrics from the Blackbox Exporter. Replace the contents of that file with this:

```yaml
scrape_configs:
- job_name: blackbox
  metrics_path: /probe
  scrape_interval: 5s
  params:
    module: [http_2xx]
  static_configs:
  - targets:
    - localhost:2112/health
  relabel_configs:
  - source_labels: [__address__]
    target_label: __param_target
  - source_labels: [__param_target]
    target_label: instance
  - target_label: __address__
    replacement: localhost:9115
```

This instructs Prometheus to scrape the Blackbox Exporter's `/probe` endpoint and passes the `targets` list, which includes the Python web server running on port 2112, to the Blackbox Exporter. With this configuration in place, start Prometheus:

```shell
./prometheus
```

## Installing, configuring, and running the Blackbox Exporter

Like Prometheus, the Blackbox Exporter is a single static binary that you can install via tarball. [Download the latest release](/download#blackbox_exporter) for your platform and untar it:

```bash
wget https://github.com/prometheus/blackbox_exporter/releases/download/v*/blackbox_exporter-*.*-amd64.tar.gz
tar xvfz blackbox_exporter-*.*-amd64.tar.gz
cd blackbox_exporter-*.*-amd64
```

The untarred folder contains a `blackbox.yml` file for configuring the exporter. Delete the current contents and replace it with this:

```yaml
modules:
  http_2xx:
    prober: http
    timeout: 5s
    http:
      method: GET
```

With this configuration, the Blackbox Exporter will use the built-in `http_2xx` module, which periodically probes HTTP endpoints (the interval is set in your Prometheus configuration).

NOTE: In the Blackbox Exporter configuration, you don't need to specify host or port information for the specific endpoints that you want to probe, only which modules you'd like to use. Host and port information is specifed in the [Prometheus configuration](#prometheus-configuration).

To start up the Blackbox Exporter on port 9115 using the `blackbox.yml` configuration:

```shell
./blackbox_exporter
```

## Exploring Blackbox Exporter probes

Navigate to http://localhost:9115 in your browser to see the Blackbox Exporter's web interface. Under the **Recent Probes** section you'll see results from the exporter's most recent probes as a table. You should see entries like this:

Module | Target | Result | Debug
:------|:-------|:-------|:-----
`http_2xx` | `localhost:2112/health` | Success | Logs
`http_2xx` | `localhost:2112/health` | Success | Logs
`http_2xx` | `localhost:2112/health` | Success | Logs

In the Prometheus [expression browser](/docs/visualization/browser), accessible at http://localhost:9090/graph, you can a variety of Blackbox-Exporter-specific metrics, which have the `probe_` prefix, for example, the [`probe_success{instance="localhost:2112/health",job="blackbox"}`](http://localhost:9090/graph?g0.range_input=1h&g0.expr=probe_success{instance%3D%localhost%3A2112%2Fhealth%22}), which indicates whether the most recent probe was successful.

## Summary

In this guide, you configured a Prometheus instance to scrape metrics from a Blackbox Exporter, which in turn probed the `/health` endpoint of a Python web service to test the liveness of the service.
