---
title: Practical Anomaly Detection
created_at: 2015-06-18
kind: article
author_name: Brian Brazil
---

In his *[Open Letter To Monitoring/Metrics/Alerting Companies](http://www.kitchensoap.com/2015/05/01/openlettertomonitoringproducts/)*,
John Allspaw asserts that attempting "to detect anomalies perfectly, at the right time, is not possible".

I have seen several attempts by talented engineers to build systems to
automatically detect and diagnose problems based on time series data. While it
is certainly possible to get a demonstration working, the data always turned
out to be too noisy to make this approach work for anything but the simplest of
real-world systems.

All hope is not lost though. There are many common anomalies which you can
detect and handle with custom-built rules. The Prometheus [query
language](/docs/prometheus/latest/querying/basics/) gives you the tools to discover
these anomalies while avoiding false positives.

<!-- more -->

## Building a query

A common problem within a service is when a small number of servers are not
performing as well as the rest, such as responding with increased latency.

Let us say that we have a metric `instance:latency_seconds:mean5m` representing the
average query latency for each instance of a service, calculated via a
[recording rule](/docs/prometheus/latest/configuration/recording_rules/) from a
[Summary](/docs/concepts/metric_types/#summary) metric.

A simple way to start would be to look for instances with a latency
more than two standard deviations above the mean:

```
  instance:latency_seconds:mean5m
> on (job) group_left()
  (
      avg by (job)(instance:latency_seconds:mean5m)
    + on (job)
      2 * stddev by (job)(instance:latency_seconds:mean5m)
  )
```

You try this out and discover that there are false positives when
the latencies are very tightly clustered. So you add a requirement
that the instance latency also has to be 20% above the average:

```
  (
      instance:latency_seconds:mean5m
    > on (job) group_left()
      (
          avg by (job)(instance:latency_seconds:mean5m)
        + on (job)
          2 * stddev by (job)(instance:latency_seconds:mean5m)
      )
  )
> on (job) group_left()
  1.2 * avg by (job)(instance:latency_seconds:mean5m)
```

Finally, you find that false positives tend to happen at low traffic levels.
You add a requirement for there to be enough traffic for 1 query per second to
be going to each instance. You create an alert definition for all of this:

```yaml
groups:
- name: Practical Anomaly Detection
  rules:
  - alert: InstanceLatencyOutlier
    expr: >
      (
            (
                instance:latency_seconds:mean5m
              > on (job) group_left()
                (
                    avg by (job)(instance:latency_seconds:mean5m)
                  + on (job)
                    2 * stddev by (job)(instance:latency_seconds:mean5m)
                )
            )
          > on (job) group_left()
            1.2 * avg by (job)(instance:latency_seconds:mean5m)
        and on (job)
            avg by (job)(instance:latency_seconds_count:rate5m)
          >
            1
      )
    for: 30m
```

## Automatic actions

The above alert can feed into the
[Alertmanager](/docs/alerting/alertmanager/), and from there to
your chat, ticketing, or paging systems. After a while you might discover that the
usual cause of the alert is something that there is not a proper fix for, but there is an
automated action such as a restart, reboot, or machine replacement that resolves
the issue.

Rather than having humans handle this repetitive task, one option is to
get the Alertmanager to send the alert to a web service that will perform
the action with appropriate throttling and safety features.

The [generic webhook](/docs/alerting/alertmanager/#generic-webhook)
sends alert notifications to an HTTP endpoint of your choice. A simple Alertmanager
configuration that uses it could look like this:

```
# A simple notification configuration which only sends alert notifications to
# an external webhook.
receivers:
- name: restart_webhook
  webhook_configs:
    url: "http://example.org/my/hook"

route:
  receiver: restart_webhook
```

## Summary

The Prometheus query language allows for rich processing of your monitoring
data. This lets you to create alerts with good signal-to-noise ratios, and the
Alertmanager's generic webhook support can trigger automatic remediations.
This all combines to enable oncall engineers to focus on problems where they can
have the most impact.

When defining alerts for your services, see also our [alerting best practices](/docs/practices/alerting/).
