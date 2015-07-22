---
title: Client libraries
sort_rank: 1
---

# Client libraries

Before you can monitor your services, you need to add instrumentation to their
code via one of the Prometheus client libraries. These implement the Prometheus
[metric types](/docs/concepts/metric_types/).

Choose a Prometheus client library that matches the language in which your
application is written. This lets you define and expose internal metrics via an
HTTP endpoint on your application’s instance:

* [Go](https://github.com/prometheus/client_golang)
* [Java or Scala](https://github.com/prometheus/client_java)
* [Python](https://github.com/prometheus/client_python)
* [Ruby](https://github.com/prometheus/client_ruby)

Unofficial third-party client libraries:

* [Bash](https://github.com/aecolley/client_bash)
* [Haskell](https://github.com/fimad/prometheus-haskell)
* [Node.js](https://github.com/StreamMachine/prometheus_client_nodejs)
* [.NET / C#](https://github.com/andrasm/prometheus-net)

When Prometheus scrapes your instance's HTTP endpoint, the client library
sends the current state of all tracked metrics to the server.

If no client library is available for your language, or you want to avoid
dependencies, you may also implement one of the supported [exposition
formats](/docs/instrumenting/exposition_formats/) yourself to expose metrics.

When implementing a new Prometheus client library, please follow the
[Prometheus Client Library Guidelines](https://docs.google.com/document/d/1zHwWVigeAITbaAp6BR4uCByRJH7rtTv4ve6SsoEXJ_Q/edit?usp=sharing).
Note that this document is still a work in progress. Please also consider
consulting the [development mailing list](https://groups.google.com/forum/#!forum/prometheus-developers).
We are happy to give advice on how to make your library as useful and
consistent as possible.
