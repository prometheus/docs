---
title: Histograms and summaries
sort_rank: 4
---

NOTE: This document predates native histograms (added as an experimental
feature in Prometheus v2.40). Once native histograms are closer to becoming a
stable feature, this document will be thoroughly updated.

# Histograms and summaries

Histograms and summaries are more complex metric types. Not only does
a single histogram or summary create a multitude of time series, it is
also more difficult to use these metric types correctly. This section
helps you to pick and configure the appropriate metric type for your
use case.

## Library support

First of all, check the library support for
[histograms](/docs/concepts/metric_types/#histogram) and
[summaries](/docs/concepts/metric_types/#summary).

Some libraries support only one of the two types, or they support summaries
only in a limited fashion (lacking [quantile calculation](#quantiles)).

## Count and sum of observations

Histograms and summaries both sample observations, typically request
durations or response sizes. They track the number of observations
*and* the sum of the observed values, allowing you to calculate the
*average* of the observed values. Note that the number of observations
(showing up in Prometheus as a time series with a `_count` suffix) is
inherently a counter (as described above, it only goes up). The sum of
observations (showing up as a time series with a `_sum` suffix)
behaves like a counter, too, as long as there are no negative
observations. Obviously, request durations or response sizes are
never negative. In principle, however, you can use summaries and
histograms to observe negative values (e.g. temperatures in
centigrade). In that case, the sum of observations can go down, so you
cannot apply `rate()` to it anymore. In those rare cases where you need to
apply `rate()` and cannot avoid negative observations, you can use two
separate summaries, one for positive and one for negative observations
(the latter with inverted sign), and combine the results later with suitable
PromQL expressions.

To calculate the average request duration during the last 5 minutes
from a histogram or summary called `http_request_duration_seconds`,
use the following expression:

      rate(http_request_duration_seconds_sum[5m])
    /
      rate(http_request_duration_seconds_count[5m])

## Apdex score

A straight-forward use of histograms (but not summaries) is to count
observations falling into particular buckets of observation
values.

You might have an SLO to serve 95% of requests within 300ms. In that
case, configure a histogram to have a bucket with an upper limit of
0.3 seconds. You can then directly express the relative amount of
requests served within 300ms and easily alert if the value drops below
0.95. The following expression calculates it by job for the requests
served in the last 5 minutes. The request durations were collected with
a histogram called `http_request_duration_seconds`.

      sum(rate(http_request_duration_seconds_bucket{le="0.3"}[5m])) by (job)
    /
      sum(rate(http_request_duration_seconds_count[5m])) by (job)


You can approximate the well-known [Apdex
score](http://en.wikipedia.org/wiki/Apdex) in a similar way. Configure
a bucket with the target request duration as the upper bound and
another bucket with the tolerated request duration (usually 4 times
the target request duration) as the upper bound. Example: The target
request duration is 300ms. The tolerable request duration is 1.2s. The
following expression yields the Apdex score for each job over the last
5 minutes:

    (
      sum(rate(http_request_duration_seconds_bucket{le="0.3"}[5m])) by (job)
    +
      sum(rate(http_request_duration_seconds_bucket{le="1.2"}[5m])) by (job)
    ) / 2 / sum(rate(http_request_duration_seconds_count[5m])) by (job)

Note that we divide the sum of both buckets. The reason is that the histogram
buckets are
[cumulative](https://en.wikipedia.org/wiki/Histogram#Cumulative_histogram). The
`le="0.3"` bucket is also contained in the `le="1.2"` bucket; dividing it by 2
corrects for that.

The calculation does not exactly match the traditional Apdex score, as it
includes errors in the satisfied and tolerable parts of the calculation.

## Quantiles

You can use both summaries and histograms to calculate so-called φ-quantiles,
where 0 ≤ φ ≤ 1. The φ-quantile is the observation value that ranks at number
φ*N among the N observations. Examples for φ-quantiles: The 0.5-quantile is
known as the median. The 0.95-quantile is the 95th percentile.

The essential difference between summaries and histograms is that summaries
calculate streaming φ-quantiles on the client side and expose them directly,
while histograms expose bucketed observation counts and the calculation of
quantiles from the buckets of a histogram happens on the server side using the
[`histogram_quantile()`
function](/docs/prometheus/latest/querying/functions/#histogram_quantile).

The two approaches have a number of different implications:

|   | Histogram | Summary
|---|-----------|---------
| Required configuration | Pick buckets suitable for the expected range of observed values. | Pick desired φ-quantiles and sliding window. Other φ-quantiles and sliding windows cannot be calculated later.
| Client performance | Observations are very cheap as they only need to increment counters. | Observations are expensive due to the streaming quantile calculation.
| Server performance | The server has to calculate quantiles. You can use [recording rules](/docs/prometheus/latest/configuration/recording_rules/#recording-rules) should the ad-hoc calculation take too long (e.g. in a large dashboard). | Low server-side cost.
| Number of time series (in addition to the `_sum` and `_count` series) | One time series per configured bucket. | One time series per configured quantile.
| Quantile error (see below for details) | Error is limited in the dimension of observed values by the width of the relevant bucket. | Error is limited in the dimension of φ by a configurable value.
| Specification of φ-quantile and sliding time-window | Ad-hoc with [Prometheus expressions](/docs/prometheus/latest/querying/functions/#histogram_quantile). | Preconfigured by the client.
| Aggregation | Ad-hoc with [Prometheus expressions](/docs/prometheus/latest/querying/functions/#histogram_quantile). | In general [not aggregatable](http://latencytipoftheday.blogspot.de/2014/06/latencytipoftheday-you-cant-average.html).

Note the importance of the last item in the table. Let us return to
the SLO of serving 95% of requests within 300ms. This time, you do not
want to display the percentage of requests served within 300ms, but
instead the 95th percentile, i.e. the request duration within which
you have served 95% of requests. To do that, you can either configure
a summary with a 0.95-quantile and (for example) a 5-minute decay
time, or you configure a histogram with a few buckets around the 300ms
mark, e.g. `{le="0.1"}`, `{le="0.2"}`, `{le="0.3"}`, and
`{le="0.45"}`. If your service runs replicated with a number of
instances, you will collect request durations from every single one of
them, and then you want to aggregate everything into an overall 95th
percentile. However, aggregating the precomputed quantiles from a
summary rarely makes sense. In this particular case, averaging the
quantiles yields statistically nonsensical values.

    avg(http_request_duration_seconds{quantile="0.95"}) // BAD!

Using histograms, the aggregation is perfectly possible with the
[`histogram_quantile()`
function](/docs/prometheus/latest/querying/functions/#histogram_quantile).

    histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) // GOOD.

Furthermore, should your SLO change and you now want to plot the 90th
percentile, or you want to take into account the last 10 minutes
instead of the last 5 minutes, you only have to adjust the expression
above and you do not need to reconfigure the clients.

## Errors of quantile estimation

Quantiles, whether calculated client-side or server-side, are
estimated. It is important to understand the errors of that
estimation.

Continuing the histogram example from above, imagine your usual
request durations are almost all very close to 220ms, or in other
words, if you could plot the "true" histogram, you would see a very
sharp spike at 220ms. In the Prometheus histogram metric as configured
above, almost all observations, and therefore also the 95th percentile,
will fall into the bucket labeled `{le="0.3"}`, i.e. the bucket from
200ms to 300ms. The histogram implementation guarantees that the true
95th percentile is somewhere between 200ms and 300ms. To return a
single value (rather than an interval), it applies linear
interpolation, which yields 295ms in this case. The calculated
quantile gives you the impression that you are close to breaching the
SLO, but in reality, the 95th percentile is a tiny bit above 220ms,
a quite comfortable distance to your SLO.

Next step in our thought experiment: A change in backend routing
adds a fixed amount of 100ms to all request durations. Now the request
duration has its sharp spike at 320ms and almost all observations will
fall into the bucket from 300ms to 450ms. The 95th percentile is
calculated to be 442.5ms, although the correct value is close to
320ms. While you are only a tiny bit outside of your SLO, the
calculated 95th quantile looks much worse.

A summary would have had no problem calculating the correct percentile
value in both cases, at least if it uses an appropriate algorithm on
the client side (like the [one used by the Go
client](http://dimacs.rutgers.edu/~graham/pubs/slides/bquant-long.pdf)).
Unfortunately, you cannot use a summary if you need to aggregate the
observations from a number of instances.

Luckily, due to your appropriate choice of bucket boundaries, even in
this contrived example of very sharp spikes in the distribution of
observed values, the histogram was able to identify correctly if you
were within or outside of your SLO. Also, the closer the actual value
of the quantile is to our SLO (or in other words, the value we are
actually most interested in), the more accurate the calculated value
becomes.

Let us now modify the experiment once more. In the new setup, the
distributions of request durations has a spike at 150ms, but it is not
quite as sharp as before and only comprises 90% of the
observations. 10% of the observations are evenly spread out in a long
tail between 150ms and 450ms. With that distribution, the 95th
percentile happens to be exactly at our SLO of 300ms. With the
histogram, the calculated value is accurate, as the value of the 95th
percentile happens to coincide with one of the bucket boundaries. Even
slightly different values would still be accurate as the (contrived)
even distribution within the relevant buckets is exactly what the
linear interpolation within a bucket assumes.

The error of the quantile reported by a summary gets more interesting
now. The error of the quantile in a summary is configured in the
dimension of φ. In our case we might have configured 0.95±0.01,
i.e. the calculated value will be between the 94th and 96th
percentile. The 94th quantile with the distribution described above is
270ms, the 96th quantile is 330ms. The calculated value of the 95th
percentile reported by the summary can be anywhere in the interval
between 270ms and 330ms, which unfortunately is all the difference
between clearly within the SLO vs. clearly outside the SLO.

The bottom line is: If you use a summary, you control the error in the
dimension of φ. If you use a histogram, you control the error in the
dimension of the observed value (via choosing the appropriate bucket
layout). With a broad distribution, small changes in φ result in
large deviations in the observed value. With a sharp distribution, a
small interval of observed values covers a large interval of φ.

Two rules of thumb:

  1. If you need to aggregate, choose histograms.

  2. Otherwise, choose a histogram if you have an idea of the range
     and distribution of values that will be observed. Choose a
     summary if you need an accurate quantile, no matter what the
     range and distribution of the values is.


## What can I do if my client library does not support the metric type I need?

Implement it! [Code contributions are welcome](/community/). In general, we
expect histograms to be more urgently needed than summaries. Histograms are
also easier to implement in a client library, so we recommend to implement
histograms first, if in doubt.
