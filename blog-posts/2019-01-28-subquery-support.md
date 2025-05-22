---
title: Subquery Support
created_at: 2019-01-28
kind: article
author_name: Ganesh Vernekar
---

## Introduction

As the title suggests, a subquery is a part of a query, and allows you to do a range query within a query, which was not possible before. It has been a long-standing feature request: [prometheus/prometheus/1227](https://github.com/prometheus/prometheus/issues/1227).

The [pull request](https://github.com/prometheus/prometheus/pull/4831) for subquery support was recently merged into Prometheus and will be available in Prometheus 2.7. Let’s learn more about it below.

## Motivation

Sometimes, there are cases when you want to spot a problem using `rate` with lower resolution/range (e.g. `5m`) while aggregating this data for higher range (e.g. `max_over_time` for `1h`).

Previously, the above was not possible for a single *PromQL* query. If you wanted to have a range selection on a query for your alerting rules or graphing, it would require you to have a recording rule based on that query, and perform range selection on the metrics created by the recording rules. Example: `max_over_time(rate(my_counter_total[5m])[1h])`.

When you want some quick results on data spanning days or weeks, it can be quite a bit of a wait until you have enough data in your recording rules before it can be used. Forgetting to add recording rules can be frustrating. And it would be tedious to create a recording rule for each step of a query.

With subquery support, all the waiting and frustration is taken care of.

<!-- more -->

## Subqueries

A subquery is similar to a [/api/v1/query_range](https://prometheus.io/docs/prometheus/latest/querying/api/#range-queries) API call, but embedded within an instant query. The result of a subquery is a range vector.

The Prometheus team arrived at a consensus for the syntax of subqueries at the Prometheus Dev Summit 2018 held in Munich. These are the [notes of the summit on subquery support](https://docs.google.com/document/d/1-C5PycocOZEVIPrmM1hn8fBelShqtqiAmFptoG4yK70/edit#heading=h.q32gdnoqz8t0), and a brief [design doc for the syntax](https://docs.google.com/document/d/1P_G87zN88YvmMr4iwLWygChMTZhai1L7S_c0awu1CAE/edit?usp=sharing) used for implementing subquery support.

    <instant_query> '[' <range> ':' [ <resolution> ] ']' [ offset <duration> ]

* `<instant_query>` is equivalent to `query` field in `/query_range` API.
* `<range>` and `offset <duration>` is similar to a range selector.
* `<resolution>` is optional, which is equivalent to `step` in `/query_range` API.

When the resolution is not specified, the global evaluation interval is taken as the default resolution for the subquery. Also, the step of the subquery is aligned independently, and does not depend on the parent query's evaluation time.

## Examples

The subquery inside the `min_over_time` function returns the 5-minute rate of the `http_requests_total` metric for the past 30 minutes, at a resolution of 1 minute. This would be equivalent to a `/query_range` API call with `query=rate(http_requests_total[5m]), end=<now>, start=<now>-30m, step=1m`, and taking the min of all received values.

    min_over_time( rate(http_requests_total[5m])[30m:1m] )

Breakdown:

* `rate(http_requests_total[5m])[30m:1m]` is the subquery, where `rate(http_requests_total[5m])` is the query to be executed.
* `rate(http_requests_total[5m])` is executed from `start=<now>-30m` to `end=<now>`, at a resolution of `1m`. Note that `start` time is aligned independently with step of `1m` (aligned steps are `0m 1m 2m 3m ...`).
* Finally the result of all the evaluations above are passed to `min_over_time()`.

Below is an example of a nested subquery, and usage of default resolution. The innermost subquery gets the rate of `distance_covered_meters_total` over a range of time. We use that to get `deriv()` of the rates, again for a range of time. And finally take the max of all the derivatives.
Note that the `<now>` time for the innermost subquery is relative to the evaluation time of the outer subquery on `deriv()`.

    max_over_time( deriv( rate(distance_covered_meters_total[1m])[5m:1m] )[10m:] )

In most cases you would require the default evaluation interval, which is the interval at which rules are evaluated by default. Custom resolutions will be helpful in cases where you want to compute less/more frequently, e.g. expensive queries which you might want to compute less frequently.

## Epilogue

Though subqueries are very convenient to use in place of recording rules, using them unnecessarily has performance implications. Heavy subqueries should eventually be converted to recording rules for efficiency.

It is also not recommended to have subqueries inside a recording rule. Rather create more recording rules if you do need to use subqueries in a recording rule.
