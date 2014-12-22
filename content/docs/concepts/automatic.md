---
title: Automatic labels and synthetic metrics
sort_rank: 3
---

# Automatic labels and metrics

## Automatically attached labels

When Prometheus scrapes a target, it attaches some labels automatically to the
scraped metrics time series which serve to identify the scraped target:

* `job`: The configured Prometheus job name for which the target was scraped.
* `instance`: The specific URL of the instance's endpoint that was scraped.

If either of these labels are already present in the scraped data, they are not
replaced. Instead, Prometheus adds its own labels with `exporter_` prepended to
the label name: `exporter_job` and `exporter_instance`. The same pattern holds
true for any manually supplied base labels supplied for a target group.

## Synthetic time series
Prometheus also generates some time series internally which are not directly
taken from the scraped data:

* `up`: for each endpoint scrape, a sample of the form `up{job="...", instance="..."}` is stored, with a value of `1.0` indicating that the target was successfully scraped (it is up) and `0.0` indicating that the endpoint is down.
* `ALERTS`: for pending and firing alerts, a time series of the form `ALERTS{alertname="...", alertstate="pending|firing",...alertlabels...}` is written out. The sample value is 1.0 as long as the alert is in the indicated active (pending/firing) state, but a single 0.0 value gets written out when an alert transitions from active to inactive state.
