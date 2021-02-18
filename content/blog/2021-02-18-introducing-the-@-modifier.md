---
title: Introducing the '@' Modifier
created_at: 2021-02-18
kind: article
author_name: Ganesh Vernekar
---

In Prometheus v2.25.0, we have introduced a new PromQL modifier `@`. Similar to how `offset` modifier lets you offset the evaluation of vector selector, range vector selector, and subqueries by a fixed duration relative to the evaluation time, the `@` modifier lets you fix the evaluation for those selectors irrespective of the query evaluation time.

    <vector-selector> @ <timestamp>
    <range-vector-selector> @ <timestamp>
    <subquery> @ <timestamp>

The `<timestamp>` is a unix timestamp and described with a float literal.

For example, the query `http_requests_total @ 1609746000` returns the value of `http_requests_total` at `2021-01-04T07:40:00+00:00`. The query `rate(http_requests_total[5m] @ 1609746000)` returns the 5-minute rate of `http_requests_total` at the same time.

Additionally, `start()` and `end()` can also be used as values for the `@` modifier as special values. For a range query, they resolve to the start and end of the range query respectively and remain the same for all steps. For an instant query, `start()` and `end()` both resolve to the evaluation time.

One of the interesting use cases of `@` is fixing the `topk()` for range queries. The following query plots the `1m` rate of `http_requests_total` of those series whose last `1h` rate was among the top 5.

    rate(http_requests_total[1m]) # This acts like the actual selector.
      and
    topk(5, rate(http_requests_total[1h] @ end())) # This acts like a ranking function which filters the selector.

Similarly, the `topk()` ranking can be replaced with other functions like `histogram_quantile()`, `rate()` with `<aggregation>_over_time()`, etc. Let us know how you use this new modifier!

`@` modifier is disabled by default and can be enabled using the flag `--enable-feature=promql-at-modifier`. Learn more about feature flags in [this blog post](https://prometheus.io/blog/2021/02/17/introducing-feature-flags/) and find the docs for `@` modifier [here](https://prometheus.io/docs/prometheus/latest/querying/basics/#modifier).