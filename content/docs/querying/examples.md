---
title: Examples
sort_rank: 4
---

# Query Examples

## Simple literals

Return (as a sample vector) all time series with the metric
`http_requests_total`:

    http_requests_total

Return (as a sample vector) all time series with the metric
`http_requests_total` and the given `job` and `group` labels:

    http_requests_total{job="prometheus", group="canary"}

Return a whole range of time (in this case 5 minutes) for the same vector,
making it a range vector:

    http_requests_total{job="prometheus", group="canary"}[5m]

## Using Functions, Operators, etc.

Return (as a sample vector) the per-second rate for all time series with the
`http_requests_total` metric name, as measured over the last 5 minutes:

    rate(http_requests_total[5m])

Let's say that the `http_request_totals` time series all have the labels `job`
(fanout by job name) and `instance` (fanout by instance of the job). We might
want to sum over the rate of all instances, so we get fewer output time series:

    sum(rate(http_requests_total[5m]))
