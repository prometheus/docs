---
title: Jobs and instances
sort_rank: 3
---

In Prometheus terms, an endpoint you can scrape is called an _instance_,
usually corresponding to a single process. A collection of instances with the same purpose, a process replicated for scalability or reliability for example, is called a _job_.

For example, an API server job with four replicated instances:

   * job: `api-server`
      * instance 1: `1.2.3.4:5670`
      * instance 2: `1.2.3.4:5671`
      * instance 3: `5.6.7.8:5670`
      * instance 4: `5.6.7.8:5671`

## Automatically generated labels and time series

When Prometheus scrapes a target, it attaches some labels automatically to the
scraped time series which serve to identify the scraped target:

* `job`: The configured job name that the target belongs to.
* `instance`: The `<host>:<port>` part of the target's URL that was scraped.

If either of these labels are already present in the scraped data, the behavior
depends on the `honor_labels` configuration option. See the
[scrape configuration documentation](/docs/prometheus/latest/configuration/configuration/#scrape_config)
for more information.

For each instance scrape, Prometheus stores a [sample](/docs/introduction/glossary#sample) in
the following time series:

* `up{job="<job-name>", instance="<instance-id>"}`: `1` if the instance is
   healthy, i.e. reachable, or `0` if the scrape failed.
* `scrape_duration_seconds{job="<job-name>", instance="<instance-id>"}`:
   duration of the scrape.
* `scrape_samples_post_metric_relabeling{job="<job-name>", instance="<instance-id>"}`:
   the number of samples remaining after metric relabeling was applied.
* `scrape_samples_scraped{job="<job-name>", instance="<instance-id>"}`:
   the number of samples the target exposed.
* `scrape_series_added{job="<job-name>", instance="<instance-id>"}`:
   the approximate number of new series in this scrape. *New in v2.10*

The `up` time series is useful for instance availability monitoring.

With the [`extra-scrape-metrics` feature flag](/docs/prometheus/latest/feature_flags/#extra-scrape-metrics) several additional metrics are available:

* `scrape_timeout_seconds{job="<job-name>", instance="<instance-id>"}`: The configured `scrape_timeout` for a target.
* `scrape_sample_limit{job="<job-name>", instance="<instance-id>"}`: The configured `sample_limit` for a target. Returns zero if there is no limit configured.
* `scrape_body_size_bytes{job="<job-name>", instance="<instance-id>"}`: The uncompressed size of the most recent scrape response, if successful. Scrapes failing because `body_size_limit` is exceeded report -1, other scrape failures report 0.
