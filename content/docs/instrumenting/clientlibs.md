---
title: Client libraries
sort_rank: 1
---

# Client libraries

If you want to monitor services which do not have existing Prometheus
instrumentation, you will need to instrument your application's code via one of
the Prometheus client libraries.

First, familiarize yourself with the Prometheus-supported
[metric types](/docs/concepts/metric_types/). To use these types programmatically, see
your specific client library's documentation.

Choose a Prometheus client library that matches the language in which your
application is written. This lets you define and expose internal metrics via an
HTTP endpoint on your application’s instance:

- [Go](https://github.com/prometheus/client_golang)
- [Java or Scala](https://github.com/prometheus/client_java)
- [Ruby](https://github.com/prometheus/client_ruby)

When Prometheus scrapes your instance's HTTP endpoint, the client library
sends the current state of all tracked metrics to the server.

If no client library is available for your language, or you want to avoid
dependencies on a client library, you may also implement one of the supported
[exposition formats](/docs/instrumenting/exposition_formats) yourself to
expose metrics.
