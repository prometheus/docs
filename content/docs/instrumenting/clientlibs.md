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
* [C](https://github.com/digitalocean/prometheus-client-c)
* [C++](https://github.com/jupp0r/prometheus-cpp)
* [Common Lisp](https://github.com/deadtrickster/prometheus.cl)
* [Elixir](https://github.com/deadtrickster/prometheus.ex)
* [Erlang](https://github.com/deadtrickster/prometheus.erl)
* [Haskell](https://github.com/fimad/prometheus-haskell)
* [Lua](https://github.com/knyar/nginx-lua-prometheus) for Nginx
* [Lua](https://github.com/tarantool/prometheus) for Tarantool
* [.NET / C#](https://github.com/andrasm/prometheus-net)
* [Node.js](https://github.com/siimon/prom-client)
* [Perl](https://metacpan.org/pod/Net::Prometheus)
* [PHP](https://github.com/Jimdo/prometheus_client_php)
* [Rust](https://github.com/pingcap/rust-prometheus)

When Prometheus scrapes your instance's HTTP endpoint, the client library
sends the current state of all tracked metrics to the server.

If no client library is available for your language, or you want to avoid
dependencies, you may also implement one of the supported [exposition
formats](/docs/instrumenting/exposition_formats/) yourself to expose metrics.

When implementing a new Prometheus client library, please follow the
[guidelines on writing client libraries](/docs/instrumenting/writing_clientlibs).
Note that this document is still a work in progress. Please also consider
consulting the [development mailing list](https://groups.google.com/forum/#!forum/prometheus-developers).
We are happy to give advice on how to make your library as useful and
consistent as possible.
