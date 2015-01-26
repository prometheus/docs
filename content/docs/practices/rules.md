---
title: Recording rules
sort_rank: 5
---

# Recording rules

A consistent naming scheme for [recording rules](/docs/querying/rules/) makes it
easier to interpret the meaning of a rule at a glance. It also avoids mistakes by 
making incorrect or meaningless calculations stand out. 

This page documents how to correctly do aggregation and suggests a naming
convention.

## Naming and aggregation

Recording rules should be of the general form `level:metric:operations`.
`level` represents the aggregation level and labels of the rule output.
`metric` is the metric name and should be unchanged other than stripping
`_total` off counters when using `rate()`. `operations` is a list of operations
that were applied to the metric, newest operation first. 

Keeping the metric name unchanged makes it easy to know what a metric is and
easy to find in the codebase. 

To keep the operations clean, `_sum` is omitted if there are other operations,
as `sum()`. Associative operations can be merged (for example `min_min` is the
same as `min`).

If there is no obvious operation to use, use `sum`.  When taking a ratio by
doing division, separate the metrics using `_per_` and call the operation
`ratio`. 

When aggregating up ratios, aggregate up the numerator and denominator
separately and then divide. Do not take the average of a ratio or average of an
average as that is not statstically valid.

When aggregating up the `_count` and `_sum` of a Summary and dividing to
calculate average observation size, treating it as a ratio would be unwieldy.
Instead keep the metric name without the `_count` or `_sum` suffix and replace
the `rate` in the operation with `mean`. This represents the average
observation size over that time period.

Always specify a `by` clause with at least the `job` label when aggregating.
This is to prevent recording rules without a `job` label, which may cause
conflicts across different jobs.

## Examples

Aggregating up requests per second:

```
instance:requests:rate5m =
  rate(requests_total{job="myjob"}[5m])

job:requests:rate5m =
  sum by (job)(instance:requests:rate5m{job="myjob"})
```

Calculating a request failure ratio and aggregating up to the job-level failure ratio:

```
instance:request_failures:rate5m =
  rate(request_failures_total{job="myjob"}[5m])

instance:request_failures_per_requests:ratio_rate5m =
    instance:request_failures:rate5m{job="myjob"}
  /
    instance:requests:rate5m{job="myjob"}

// Aggregate up numbeator and denominator, then divide.
job:request_failures_per_requests:ratio_rate5m =
    sum by (job)(instance:request_failures:rate5m{job="myjob"})
  /
    sum by (job)(instance:requests:rate5m{job="myjob"})
```


Calculating average latency over a time period from a Summary:

```
instance:request_latency_seconds_count:rate5m =
  rate(request_latency_seconds_count{job="myjob"}[5m])

instance:request_latency_seconds_sum:rate5m =
  rate(request_latency_seconds_sum{job="myjob"}[5m])

instance:request_latency_seconds:mean5m =
    instance:request_latency_seconds_sum:rate5m{job="myjob"}
  /
    instance:request_latency_seconds_count:rate5m{job="myjob"}

// Aggregate up numbeator and denominator, then divide.
job:request_latency_seconds:mean5m =
    sum by (job)(instance:request_latency_seconds_sum:rate5m{job="myjob"})
  /
    sum by (job)(instance:request_latency_seconds_count:rate5m{job="myjob"})
```

Calculating the average query rate across instances is done using the `avg()` function:

```
job:request_latency_seconds_count:avg_rate5m =
  avg by (job)(instance:request_latency_seconds_count:rate5m{job="myjob"})
```

Notice that when aggregating the labels in the `by` clause always match up with
the level of the output recording rule. When there is no aggregation, the
levels always match. If this is not the case a mistake has likely been made in the rules.
