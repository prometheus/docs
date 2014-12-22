---
title: Functions
sort_rank: 3
---

# Functions

## abs()

`abs(v vector)` returns the input vector with all sample values converted to
their absolute value.

## count_scalar()

`count_scalar(v instant-vector)` returns the number of elements in a timeseries
vector as a scalar. This is in contrast to the `count()` aggregation operator,
which always returns a vector (an empty one if the input vector is empty) and
allows grouping by labels via a `by` clause.

## delta()

`delta(v range-vector, counter bool)` calculates the difference between the
first and last value of each timeseries element in a range vector `v`,
returning an instant vector with the given deltas and equivalent labels. If
`counter` is set to `1` (`true`), the timeseries in the range vector are
treated as monotonically increasing counters. Breaks in monotonicity (such as
counter resets due to target restarts) are automatically adjusted for. Setting
`counter` to `0` (`false`) turns this behavior off.

Example which returns the total number of HTTP requests counted within the last
5 minutes, per timeseries in the range vector:

```
delta(http_requests{job="api-server"}[5m], 1)
```

Example which returns the difference in CPU temperature between now and 2 hours
ago:

```
delta(cpu_temp_celsius{host="zeus"}[2h], 0)
```

## drop_common_labels()

`drop_common_labels(instant-vector)` drops all labels that have the same name
and value across all series in the input vector.

## rate()

`rate(v range-vector)` behaves like `delta()`, with two differences:
* the returned delta is converted into a per-second rate, according to the respective interval
* the `counter` argument is implicitly set to `1` (`true`)

Example call which returns the per-second rate of HTTP requests as measured
over the last 5 minutes, per timeseries in the range vector:

```
rate(http_requests{job="api-server"}[5m])
```

## scalar()

Given a single-element input vector, `scalar(v instant-vector)` returns the
sample value of that single element as a scalar. If the input vector doesn't
have exactly one element, `scalar` will return `NaN`.

## sort()

`sort(v instant-vector)` returns vector elements sorted by their sample values,
in ascending order.

## sort_desc()

Same as `sort`, but sorts in descending order.

## time()

`time()` returns the number of seconds since January 1, 1970 UTC. Note that
this doesn't actually return the current time, but the time at which the
expression is to be evaluated.

## *_over_time(): Aggregating values within series over time:

The following functions allow aggregating each series of a given range vector
over time and return an instant vector with per-series aggregation results:

- `avg_over_time(range-vector)`: the average value of all points under the specified interval.
- `min_over_time(range-vector)`: the minimum value of all points under the specified interval.
- `max_over_time(range-vector)`: the maximum value of all points under the specified interval.
- `sum_over_time(range-vector)`: the sum of all values under the specified interval.
- `count_over_time(range-vector)`: the count of all values under the specified interval.

## topk() / bottomk()

`topk(k integer, v instant-vector)` returns the `k` largest elements of `v` by
sample value.

`bottomk(k integer, v instant-vector` returns the `k` smallest elements of `v`
by sample value.
