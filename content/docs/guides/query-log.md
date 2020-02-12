---
title: Query Log
sort_rank: 1
---

# Using the Prometheus query log

Prometheus has the ability to log all the queries run by the engine to a log
file. This guide demonstrates how to use that log file, which fields it does
contain and provides advanced tips about how to operate the log file.

The query log has been introduced in v2.16.0 and is disabled by default.

## Enable the query log

The query log can be enabled and disabled at runtime. It can therefore be
activated when you want to investigate slownesses or high load on your
Prometheus instance.

To enable or disable the query log, two steps are needed:

1. Adapt the configuration to add or remove the query log configuration.
1. Reload the Prometheus server configuration.

### Logging all the queries to a file

This example demonstrates how to log all the queries to
a file called `/var/log/prometheus/query.log`.

First, let's ensure that Prometheus has write access to a directory
`/var/log/prometheus`. We will assume that Prometheus is running under a user
called Prometheus:

```shell
# mkdir /var/log/prometheus
# chown prometheus: /var/log/prometheus
```

Then, adapt the `prometheus.yml` configuration file:

```yaml
global:
  scrape_interval:     15s
  evaluation_interval: 15s
  query_log_file: /var/log/prometheus/query.log
scrape_configs:
  - job_name: 'prometheus'
    - targets: ['localhost:9090']
```

And, reload the Prometheus configuration:

```shell
$ curl -X POST http://127.0.0.1:9090/-/reload
```

Or, if Prometheus is not launched with `--web.enable-lifecycle`:

```shell
$ killall -HUP prometheus
```

The file `/var/log/prometheus/query.log` should now exist and all the queries
will be logged to that file.

To disable the query log, repeat the operation but remove `query_log_file` from
the configuration.

## Verifying if the query log is enabled

Prometheus conveniently exposes metrics that indicates if the query log is
enabled and working:

```
# HELP prometheus_engine_query_log_enabled State of the query log.
# TYPE prometheus_engine_query_log_enabled gauge
prometheus_engine_query_log_enabled 0
# HELP prometheus_engine_query_log_failures_total The number of query log failures.
# TYPE prometheus_engine_query_log_failures_total counter
prometheus_engine_query_log_failures_total 0
```

The first metric, `prometheus_engine_query_log_enabled` is set to 1 of the
query log is enabled, and 0 otherwise.
The second one, `prometheus_engine_query_log_failures_total`, indicates the
number of queries that could not be logged.

## Format of the query log

The query log is a JSON-formatted log. Here is an overview of the fields
present on any query:

```
{
    "params": {
        "end": "2020-02-08T14:59:50.368Z",
        "query": "up == 0",
        "start": "2020-02-08T13:59:50.368Z",
        "step": 5
    },
    "stats": {
        "timings": {
            "evalTotalTime": 0.000447452,
            "execQueueTime": 7.599e-06,
            "execTotalTime": 0.000461232,
            "innerEvalTime": 0.000427033,
            "queryPreparationTime": 1.4177e-05,
            "resultSortTime": 6.48e-07
        }
    },
    "ts": "2020-02-08T14:59:50.387Z"
}
```

- params: the query itself. The start and end timestamp, the step and the actual
  query.
- stats: statistics. Currently, it contains internal engine timers.
- ts: timestamp of the log line.

Additionally, depending on what triggered the request, you will have additional
fields in the JSON lines.

### API Queries and consoles

HTTP requests contain the client IP, the method and the path:

```
{
    "httpRequest": {
        "clientIP": "127.0.0.1",
        "method": "GET",
        "path": "/api/v1/query_range"
    }
}
```

The path will contain the web prefix if it is set, and can also point to a
console.

The client IP is the network IP address and does not take into consideration the
headers like `X-Forwarded-For`. If you wish to log the original caller behind a
proxy, you need to do so in the proxy itself.

### Recording rules and alerts

Recording rules and alerts contain a ruleGroup element which contains the path
of the file and the name of the group:

```
{
    "ruleGroup": {
        "file": "rules.yml",
        "name": "partners"
    }
}
```


## Rotating the query log

Prometheus will not rotate the query log itself. Instead, you can use external
tools to do so.

One of those tools is logrotate. Please refer to the documentation of your
operating system for the initial logrotate setup.

Once it is set up, here is an example of file you can add as
`/etc/logrotate.d/prometheus`:

```
/var/log/prometheus/query.log {
    daily
    rotate 7
    compress
    delaycompress
    postrotate
        killall -HUP prometheus
    endscript
}
```

That will rotate your file daily and keep one week of history.
