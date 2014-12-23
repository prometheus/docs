---
title: Pushing metrics
sort_rank: 3
---

# Pushing metrics

Occasionally you will need to monitor components which cannot be scraped. They
might live behind a firewall, or they might be too short-lived to expose data
reliably via the pull model. The
[Prometheus push gateway](https://github.com/prometheus/pushgateway) allows you to push
time series from these components to an intermediary job which Prometheus can
scrape. Combined with Prometheus's simple text-based exposition format, this
makes it easy to instrument even shell scripts without a client library.

For more information on using the push gateway, see the project's
[README.md](https://github.com/prometheus/pushgateway/blob/master/README.md).
