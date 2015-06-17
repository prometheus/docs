---
title: Practical Anomaly Detection
created_at: 2015-06-17
kind: article
author_name: Brian Brazil
---

In his *[Open Letter To Monitoring/Metrics/Alerting Companies](http://www.kitchensoap.com/2015/05/01/openlettertomonitoringproducts/)*,
John Allspaw asserts that attempting "to detect anomalies perfectly, at the right time, is not possible".

I have seen more than one attempt by talented engineers to build a system to
automatically detect and diagnose problems based on time series data. While it
is certainly possible to get a demonstration working, the data always turned
out to be too noisy to make this approach work for anything but the simplest of
real-world systems.

All hope is not lost though. There are some common anomalies which you can
detect and deal with. The Prometheus [query
language](../../../../../docs/querying/basics/) gives you the tools to discover
these while avoiding false positives.

## Building a query

A common problem is a small number of servers within a service not
performing as well as the rest, such as by having increased latency.  While
the issue may not impact your overall SLA, it is worth having a human look when
they have a chance.

Let us say that we have `instance:latency_seconds:mean5m` representing the
average query latency for each instance of a service, calculated from a
[Summary](../../../../../docs/concepts/metric_types/#summary) metric.

A simple way to start would be to look for instances with latency
a more than two standard deviations above the mean:

```
  instance:latency_seconds:mean5m
> on (job) group_left(instance)
  (
      avg by (job)(instance:latency_seconds:mean5m) 
    + on (job)
      2 * stddev by (job)(instance:latency_seconds:mean5m)
  )
```

You try this out, and discover that there are false positives when
the latencies are very tightly bunched. You add a requirement
that the instance latency also has to be 20% above the average:

```
  (  
      instance:latency_seconds:mean5m
    > on (job) group_left(instance)
      (
          avg by (job)(instance:latency_seconds:mean5m) 
        + on (job)
          2 * stddev by (job)(instance:latency_seconds:mean5m)
      )
  )
> on (job) group_left(instance)
  1.2 * avg by (job)(instance:latency_seconds:mean5m)
```

Finally, you find that false positives tend to happen at low traffic levels.
You add a requirement for there to be enough traffic for 1 query per second to
be going to each instance. You put all this in an alert:

```
ALERT InstanceLatencyOutlier
  IF
        (  
            instance:latency_seconds:mean5m
          > on (job) group_left(instance)
            (
                avg by (job)(instance:latency_seconds:mean5m) 
              + on (job)
                2 * stddev by (job)(instance:latency_seconds:mean5m)
            )
        )
      > on (job) group_left(instance)
        1.2 * avg by (job)(instance:latency_seconds:mean5m)
    and on (job)
        avg by (job)(instance:latency_seconds_count:rate5m)
      >
        1
  FOR 30m
  SUMMARY "{{$labels.instance}} in {{$labels.job}} is a latency outlier"
  DESCRIPTION "{{$labels.instance}} has latency of {{humanizeDuration $value}}"
```

## Automatic actions

The above alert can feed into the
[alertmanager](../../../../../docs/alerting/alertmanager/), and from there to
your chat, ticketing or paging systems. After a while you might discover that the
usual cause is something that there is not a proper fix for, but there is an
automated action such as a restart, reboot or machine replacement that resolves
the issue.

Rather than having humans handle this repetitive task, one option is to
get the alertmanager to send the alert to a web service that will perform
the action with appropriate throttling and safety features.

The [generic webhook](../../../../../docs/alerting/alertmanager/#generic-webhook)
sends alert notifications to a HTTP endpoint of your choice. A simple alertmanager configuration that uses it:

```
notification_config {
  name: "restart_webhook"
  webhook_config {
    url: "http://example.org/my/hook"
  }
}
aggregation_rule {
  filter {
    name_re: "alertname"
    value_re: "InstanceLatencyOutlier"
  }
  notification_config_name: "restart_webhook"
}
```


## Summary

The Prometheus query language allows for rich processing of your monitoring
data. This lets you to create alerts with good signal to noise ratios, and the
alertmanager's generic webhook support can trigger automatic remediation.
This all combines to enables oncall engineers to focus on problems where they can
have the most impact.
