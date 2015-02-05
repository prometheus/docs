---
title: Functions
sort_rank: 3
---

# Functions

## `abs()`

`abs(v vector)` returns the input vector with all sample values converted to
their absolute value.

## `absent(v vector)`

`absent(v vector)` returns an empty vector if the vector passed to it has any
elements and a 1-element vector with the value 1 if the vector passed to it has
no elements.

In the second case, `absent()` tries to be smart about deriving labels of
the 1-element output vector from the input vector:

| Expression                                       | Result
|--------------------------------------------------|--------
| absent(nonexistent{job="myjob"})                 | {job="myjob"}
| absent(nonexistent{job="myjob",instance=~".*"})  | {job="myjob"}
| absent(sum(nonexistent{job="myjob"}))            | {}

This is useful for alerting on when no time series
exist for a given metric name and label combination.

## `ceil()`

`ceil(v instant-vector)` rounds the sample values of all elements in `v` up to
the nearest integer.

## `count_scalar()`

`count_scalar(v instant-vector)` returns the number of elements in a time series
vector as a scalar. This is in contrast to the `count()` aggregation operator,
which always returns a vector (an empty one if the input vector is empty) and
allows grouping by labels via a `by` clause.

## `delta()`

`delta(v range-vector)` calculates the difference between the
first and last value of each time series element in a range vector `v`,
returning an instant vector with the given deltas and equivalent labels.
The delta is interpolated to cover the full time range. 

The following example expression returns the difference in CPU temperature
between now and 2 hours ago:

```
delta(cpu_temp_celsius{host="zeus"}[2h])
```

`delta` should only be used with gauges.

## `deriv()`

`deriv(v range-vector)` calculates the derivative of the time series in a range
vector `v`, using [simple linear regression](http://en.wikipedia.org/wiki/Simple_linear_regression).

The following example expression returns the predicted CPU temperature in 5
minutes based on the previous hour of data:

```
cpu_temp_celsius{host="zeus"} + deriv(cpu_temp_celsius{host="zeus"}[1h]) * 5 * 60
```

`deriv` should only be used with gauges.

## `drop_common_labels()`

`drop_common_labels(instant-vector)` drops all labels that have the same name
and value across all series in the input vector.

## `floor()`

`floor(v instant-vector)` rounds the sample values of all elements in `v` down
to the nearest integer.

## `rate()`

`rate(v range-vector)` calculate the per-second average rate of increase of the
time series in the range vector. Breaks in monotonicity (such as counter
resets due to target restarts) are automatically adjusted for.

The following example expression returns the per-second rate of HTTP requests as measured
over the last 5 minutes, per time series in the range vector:

```
rate(http_requests_total{job="api-server"}[5m])
```

`rate` should only be used with counters.

## `round()`

`round(v instant-vector, to_nearest=1 scalar)` rounds the sample values of all
elements in `v` to the nearest integer. Ties are resolved by rounding up. The
optional `to_nearest` argument allows specifying the nearest multiple to which
the sample values should be rounded. This multiple may also be a fraction.

## `scalar()`

Given a single-element input vector, `scalar(v instant-vector)` returns the
sample value of that single element as a scalar. If the input vector doesn't
have exactly one element, `scalar` will return `NaN`.

## `sort()`

`sort(v instant-vector)` returns vector elements sorted by their sample values,
in ascending order.

## `sort_desc()`

Same as `sort`, but sorts in descending order.

## `time()`

`time()` returns the number of seconds since January 1, 1970 UTC. Note that
this doesn't actually return the current time, but the time at which the
expression is to be evaluated.

## `<aggregation>_over_time()`: Aggregating values over time:

The following functions allow aggregating each series of a given range vector
over time and return an instant vector with per-series aggregation results:

* `avg_over_time(range-vector)`: the average value of all points under the specified interval.
* `min_over_time(range-vector)`: the minimum value of all points under the specified interval.
* `max_over_time(range-vector)`: the maximum value of all points under the specified interval.
* `sum_over_time(range-vector)`: the sum of all values under the specified interval.
* `count_over_time(range-vector)`: the count of all values under the specified interval.

## `topk()` and `bottomk()`

`topk(k integer, v instant-vector)` returns the `k` largest elements of `v` by
sample value.

`bottomk(k integer, v instant-vector` returns the `k` smallest elements of `v`
by sample value.
