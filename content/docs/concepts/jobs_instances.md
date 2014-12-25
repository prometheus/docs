---
title: Jobs and instances
sort_rank: 3
---

# Jobs and instances

In Prometheus terms, any individually scraped target is called an _instance_,
usually corresponding to a single process. A collection of instances of the
same type (replicated for scalability or reliability) is called a _job_.

For example, an API server job with four replicated instances:

   * job: `api-server`
      * instance 1: `http://1.2.3.4:5670/metrics`
      * instance 2: `http://1.2.3.4:5671/metrics`
      * instance 3: `http://5.6.7.8:5670/metrics`
      * instance 4: `http://5.6.7.8:5671/metrics`

## Automatically generated labels and time series

When Prometheus scrapes a target, it attaches some labels automatically to the
scraped time series which serve to identify the scraped target:

* `job`: The configured job name that the target belongs to.
* `instance`: The URL of the target's endpoint that was scraped.

If either of these labels are already present in the scraped data, Prometheus
does not replace their values. Instead, it adds new labels with an `exporter_`
prefix prepended to the label name: `exporter_job` and `exporter_instance`. The
same pattern holds true for any labels that have been manually configured for a
target group. This enables intermediary exporters to proxy metrics.

For each instance scrape, Prometheus stores a sample of the form
`up{job="<job-name>", instance="<instance-url>"}` with a value of `1` if the
instance was scraped successfully or a value of `0` if the scrape failed. This
time series is useful for instance availability monitoring.

TODO: move alerts stuff somewhere else (Prometheus also stores * `ALERTS`: for pending and firing alerts, a time series of the form `ALERTS{alertname="...", alertstate="pending|firing",...alertlabels...}` is written out. The sample value is `1` as long as the alert is in the indicated active (pending/firing) state, but a single `0` value gets written out when an alert transitions from active to inactive state.)
