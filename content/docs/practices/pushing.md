---
title: Pushing data
sort_rank: 2
---

# Pushing Data

Occasionally you will need to monitor components which cannot be scraped: They
might be behind a firewall, or they might be too short-lived to expose data
reliably via the pull model. The
[push gateway](https://github.com/prometheus/pushgateway) allows you to push
time series from these components to an intermediary job which Prometheus can
scrape.

For more information on installing and using the push gateway, see the
project's
[README.md](https://github.com/prometheus/pushgateway/blob/master/README.md).
