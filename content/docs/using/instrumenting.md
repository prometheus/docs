---
title: Instrumenting your code
sort_rank: 2
---

# Instrumenting your code

If you want to monitor services which do not have existing Prometheus
instrumentation, you will need to instrument your application's code via one of
the Prometheus client libraries.

First, familiarize yourself with the Prometheus-supported
[metrics types](/concepts/metric_types/). To use these types programmatically, see
your specific client library's documentation.

Choose a Prometheus client library that matches the language in which your
application is written. This lets you define and expose internal metrics via an
HTTP endpoint on your application’s instance:

- [Go](https://github.com/prometheus/client_golang)
- [Java or Scala](https://github.com/prometheus/client_java)
- [Ruby](https://github.com/prometheus/client_ruby)

When Prometheus scrapes your instance's HTTP endpoint, the client library
sends the current state of all tracked metrics to the server.
