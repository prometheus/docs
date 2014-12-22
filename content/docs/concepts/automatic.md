---
title: Automatic labels and synthetic metrics
sort_rank: 3
---

# Automatic labels and metrics

## Automatically attached labels

When Prometheus scrapes a target, it attaches some labels automatically to the
scraped time series which serve to identify the scraped target:

* `job`: The configured job name that the target belongs to.
* `instance`: The URL of the target's endpoint that was scraped.

If either of these labels are already present in the client-exposed data,
Prometheus does not replace their values. Instead, it adds new labels with an
`exporter_` prefix prepended to the label name: `exporter_job` and
`exporter_instance`. The same pattern holds true for any labels that have been
manually configured for a target group. This enables intermediary exporters to
proxy metrics.

## Synthetic time series
Prometheus also generates and stores some time series automatically which are
not directly derived from scraped data:

* `up`: for each endpoint scrape, a sample of the form `up{job="...", instance="..."}` is stored, with a value of `1` indicating that the target was successfully scraped (it is up) and `0` indicating that the endpoint is down.
* `ALERTS`: for pending and firing alerts, a time series of the form `ALERTS{alertname="...", alertstate="pending|firing",...alertlabels...}` is written out. The sample value is `1` as long as the alert is in the indicated active (pending/firing) state, but a single `0` value gets written out when an alert transitions from active to inactive state.
