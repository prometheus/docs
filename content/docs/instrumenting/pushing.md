---
title: Pushing metrics
sort_rank: 3
---

# Pushing metrics

Occasionally you will need to monitor components which cannot be scraped. The
[Prometheus Pushgateway](https://github.com/prometheus/pushgateway) allows you
to push time series from [short-lived service-level batch
jobs](/docs/practices/pushing/) to an intermediary job which Prometheus can
scrape. Combined with Prometheus's simple text-based exposition format, this
makes it easy to instrument even shell scripts without a client library.

 * For more information on using the Pushgateway and use from a Unix shell, see the project's
[README.md](https://github.com/prometheus/pushgateway/blob/master/README.md).

 * For use from Java see the
[PushGateway](https://prometheus.github.io/client_java/io/prometheus/client/exporter/PushGateway.html)
class.

 * For use from Go see the [Push](https://godoc.org/github.com/prometheus/client_golang/prometheus/push#Pusher.Push) and [Add](https://godoc.org/github.com/prometheus/client_golang/prometheus/push#Pusher.Add) methods.

 * For use from Python see [Exporting to a Pushgateway](https://github.com/prometheus/client_python#exporting-to-a-pushgateway).

 * For use from Ruby see the [Pushgateway documentation](https://github.com/prometheus/client_ruby#pushgateway).

* To find out about Pushgateway support of [client libraries maintained outside of the Prometheus project](/docs/instrumenting/clientlibs/), refer to their respective documentation.
