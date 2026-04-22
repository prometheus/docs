---
title: Exploring the predict_linear function
created_at: 2026-04-06
kind: article
author_name: "Opeyemi Onikute (@Ope__O)"
---

You may want to know whether a negative situation will happen in the future based on the current trend. For example, whether a web server will run out of available disk space. This represents a shift in thinking about resiliency and reliability engineering — from being reactive to proactive.

Not enough people know that you can accomplish this principle with Prometheus, which is why we are writing this quick refresher. PromQL's `predict_linear` function lets you project a time series into the future using linear regression, so you can build proactive alerts instead of relying only on static thresholds.

This post describes the syntax, how it works, practical examples, when to use it, and when not to.

<!-- more -->
## The syntax

`predict_linear` takes a range vector and a scalar number of seconds:

```promql
predict_linear(v range-vector, t scalar)
```

The input parameters are as explained below:
- **v**: a range vector over which linear regression is performed. e.g. the last 6 hours of your metric.
- **t**: The number of seconds into the future for which to predict the value. For example, 8 hours would be 8*60*60=28,800 seconds.

The function then returns the predicted value at *evaluation time + t* based on the given trend in the range. Note that v **must** be a range vector with at least two float samples per timeseries.

With these parameters, you can predict the future expected value of your metric based on the trend in the range vector you've provided. This is made possible using a machine learning technique called linear regression.

## How does it work?

`predict_linear` implements linear regression by fitting a line to the samples in the given range. This line is given by *f(x) = slope × x + intercept*. The slope is derived from the data and represents the rate of change. The intercept is the value at the evaluation time.

Prometheus uses the [Kahan summation algorithm](https://en.wikipedia.org/wiki/Kahan_summation_algorithm) for numerical stability during computation. This improves the accuracy of the result by significantly reducing the numerical error of the computation. 

With the slope and intercept obtained, the predicted value at time *now + t* is then *f(x) = f(now + t)*. *predict_linear* is essentially taking the slope and intercept it obtains, and applying it to the future time you've provided. 

Generally speaking, you are not "predicting the future". You are simply using a mathematical representation of the current trend to estimate the future value. This makes *predict_linear* best suited to only slowly-changing, linear behaviour, such as available disk space decreasing over time.

Do not attempt to use *predict_linear* for metrics that exhibit bursty patterns, as we'll illustrate in the examples below.

## Examples of using predict_linear

The examples below should help you build some intuition about how and when to use predict_linear.

### Predict available disk space into the future

To predict free disk bytes 24 hours (86400 seconds) from now, using the trend of the last 3 hours, you will need a query like this:

```promql
predict_linear(node_filesystem_free_bytes[3h], 86400)
```

If this predicted value is less than 0, it means that, based on the current trajectory over the last 3 hours, the disk would be full within a day. You can use that in an alert:

```yaml
- alert: DiskFullSoon
  expr: predict_linear(node_filesystem_free_bytes[3h], 86400) < 0
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Disk may be full within 24h"
```

You can explore this idea with different ranges and horizons. In practice, choosing a longer range (e.g., 6h or 1d) usually makes the prediction less sensitive to short-term noise. The trade-off, however, is that the prediction reacts more slowly to a change in trend. 

### Predict CPU usage (❌)

You may be tempted to predict a metric that looks linear in some graphs you've seen. Be careful here, as *predict_linear* becomes unsuitable once the metric is spiky. With CPU usage, for instance, you may see a steady increase depending on the type of compute you're running, but a single process may run something intensive and make the trend non-linear.

```yaml
- alert: CPUHighSoon
  expr: predict_linear(node_cpu_seconds_total[3h], 86400) > 60
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "CPU will be above threshold in 24 hours"
```

This is a good example of what not to do with *predict_linear*. With every spike, the trend becomes harder to fit a line through, and it is impossible to predict the spikes themselves.

For more complex forecasting, it is recommended to export your metrics and send them to a more suitable forecasting library.

## Limitations and caveats

As mentioned in the example above, the caveats around *predict_linear* usage all concern the linearity of your metric. Consult the list below if you're ever in doubt:

- **Machine learning callout**: For more complex forecasting using machine learning, particularly non-linear data, it's currently best to export your metrics and use a more suitable library for prediction. The function assumes the trend is roughly linear in the provided window. Sudden drops or sawtooth patterns will produce overly pessimistic or optimistic predictions.
- **Not suitable for forecast graphs.** Using `predict_linear` for visualisation can be misleading. At each evaluation time, the range window moves, so you get a new regression and a new slope. The function is only suitable for alerting or real-time evaluation. For discussion and alternatives, see [this Prometheus discussion](https://github.com/prometheus/prometheus/discussions/11705).

## Summary

With `predict_linear`, you have a simple, native way to turn the current trend into a value you can alert on. For example, "free space will hit zero in 24h if the trend continues." It is best suited for proactive capacity alerts. For richer forecasting or visualisation, consider exporting the metric data and using a more suitable tool. 

For the full list of PromQL functions, see the [documentation](https://prometheus.io/docs/prometheus/latest/querying/functions/).
