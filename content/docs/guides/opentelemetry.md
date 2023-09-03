---
title: Ingesting OpenTelemetry Metrics
---

# Ingest Native OpenTelemetry Metrics to Prometheus

Prometheus supports ingesting native OpenTelemetry Metrics from release 2.47 onwards. Before this change, Prometheus was not supporting ingesting the OpenTelemetry Metrics natively, there was a way to convert the OpenTelemetry Metrics into Prometheus Metrics format either via Prometheus Remote Write Exporter.

In this guide, we will learn about

- Configuration changes required in Prometheus setup to enable the ingestion of OpenTelemetry Metrics.
- Setting up a Python application with OpenTelemetry SDK.
- Emitting OpenTelemetry metrics via auto-instrumentation.
- Ingesting those metrics in Prometheus natively.
- Setup manual instrumentation of metrics.
- Ingesting those metrics in Prometheus natively.

> The guide expects that you have basic understanding of differences between Prometheus / OpenMetrics format and [OpenTelemetry Metrics standard](https://opentelemetry.io/docs/specs/otel/metrics/).

## Prometheus Configuration

There are no guarantees that OpenTelemetry data will arrive in order. However, Prometheus expects data to be in order by default. This is one of the nicer properties of a scrape-based system in which the timing is controlled centrally, and it allows substantial efficiency gains.

Yet, because of this data may be dropped if sending OpenTelemetry data directly to Prometheus. The fix is easy: Simply enable Out of Order ingestion in Prometheus.


``` yaml
storage:
  tsdb:
    # A 10min time window is enough because it can easily absorb retries and network delays.
    out_of_order_time_window: 10m
```

The support for OpenTelemetry Metrics ingestion is supported in Prometheus via a feature flag. Run Prometheus with the `otlp-write-receiver` flag enabled as follows:

``` shell
prometheus --enable-feature=otlp-write-receiver --config=prometheus.yml
```

Once the feature is successfully enabled, you can see the evidence in the logs.

``` shell
$ prometheus --enable-feature=otlp-write-receiver
ts=2023-09-03T04:11:01.456Z caller=main.go:175 level=info msg="Experimental OTLP write receiver enabled"
```

## Setting up a Python Flask Application

We will use a Flask API application for the demonstration in this guide. The application performs calculator operations and responds to `add`, `subtract`, `multiply` and `divide` operations.

> It is assumed that you have latest version of Python and `pip` setup.

``` shell
mkdir otel-to-prom
cd otel-to-prom
pip install Flask
```

Create the application.

``` python
from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route('/add', methods=['POST'])
def add():
    data = request.json
    result = data['num1'] + data['num2']
    return jsonify({"result": result})

@app.route('/subtract', methods=['POST'])
def subtract():
    data = request.json
    result = data['num1'] - data['num2']
    return jsonify({"result": result})

@app.route('/multiply', methods=['POST'])
def multiply():
    data = request.json
    result = data['num1'] * data['num2']
    return jsonify({"result": result})

@app.route('/divide', methods=['POST'])
def divide():
    data = request.json
    if data['num2'] == 0:
        return jsonify({"error": "Division by zero is not allowed."}), 400
    result = data['num1'] / data['num2']
    return jsonify({"result": result})

if __name__ == '__main__':
    app.run(debug=True)

```

Start the application and send a couple of requests:

``` shell
$ python app.py
 * Serving Flask app 'app'
 * Debug mode: on
WARNING: This is a development server. Do not use it in a production deployment. Use a production WSGI server instead.
 * Running on http://127.0.0.1:5000
Press CTRL+C to quit
 * Restarting with stat
 * Debugger is active!
 * Debugger PIN: 988-101-184
127.0.0.1 - - [03/Sep/2023 09:48:09] "POST /add HTTP/1.1" 200 -
```

``` shell
$ curl -X POST -H "Content-Type: application/json" -d '{"num1": 5, "num2": 100}' http://127.0.0.1:5000/add

{
  "result": 105
}
```

## Auto Instrumentation

Let's add the OpenTelemetry instrumentation now. We will use Otel's Flask instrumentation library which auto-instruments all request handelers.

``` shell
pip opentelemetry-api opentelemetry-sdk opentelemetry-exporter-otlp opentelemetry-instrumentation-flask
```

Then update the code as follows:

``` shell
from flask import Flask, jsonify, request
from opentelemetry import metrics
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.flask import FlaskInstrumentor

# Configure the OTLP metrics exporter
otlp_exporter = OTLPMetricExporter(endpoint="http://localhost:9090/api/v1/otlp/v1/metrics")
reader = PeriodicExportingMetricReader(otlp_exporter, 1000)
resource = Resource.create({"service.name": "calculator"})
provider = MeterProvider(metric_readers=[reader], resource=resource)

metrics.set_meter_provider(provider)
meter = metrics.get_meter(__name__)

app = Flask(__name__)
FlaskInstrumentor().instrument_app(app)
```

A lot is happening is here, let's break it down.

- We created the OTLP Exporter with the Prometheus endpoint which accepts the OpenTelemetry metrics in native format. The endpoint path is `/api/v1/otlp/v1/metrics`.
- We setup required `reader`, `resource` and `provider` for metrics instrumentation.
- We wrapped the Flask app in `FlaskInstrumentor's` `instrument_app` method so that the auto instrumentation will kick in.

When the application is run and few requests are sent to it, the auto instrumented metrics will be **pushed** from the application to Prometheus via the `FlaskInstrumentor`.

By default, this library emits following metrics:

- `http.server.duration` which is a Histogram.
- `http.server.active_requests` which is UpDownCounter.

The Prometheus' OTLP write recevier endpoint takes care of coverting these OpenTelemetry metrics into Prometheus format seamlessly. Following metrics will be present in Prometheus.

- `http_requests_duration_milliseconds_bucket`
- `http_requests_duration_milliseconds_count`
- `http_requests_duration_milliseconds_sum`
- `http_server_active_requests`

## Custom Instrumentation

Let's add a custom metric in the Python application to count number of calculaor operations performed.

``` python
# Custom Metric
calc_metric = meter.create_counter(
    name="calc_operation",
    description="Records every Calculator Operation",
)

@app.route('/add', methods=['POST'])
def add():
    data = request.json
    result = data['num1'] + data['num2']
    calc_metric.add(1, {"operation": "add"})
    return jsonify({"result": result})

@app.route('/subtract', methods=['POST'])
def subtract():
    data = request.json
    result = data['num1'] - data['num2']
    calc_metric.add(1, {"operation": "sub"})
    return jsonify({"result": result})
```

The `calc_operation` is a Counter which counts every operation performed.

After this change, when we deploy and send a couple of requests, the application will push `calc_operation` metric to Prometheus.

We will see it in Prometheus as `calc_operation_total` as it a counter metric.

You can add more custom metrics with different types and they will appear in Prometheus seamlessly.

## Summary

In this guide, we setup a Python application with OpenTelemetry SDK and ingested native OpenTelemetry metrics into Prometheus directly. We performed automatic instrumetnation as well as custom instrumentation.
