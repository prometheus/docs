---
title: Histograms and summaries
sort_rank: 4
---

Histograms and summaries are more complex metric types. For historical reasons,
histograms exist in two variants: classic histograms and native histograms, the
latter even come in a number of sub-variants. This document helps to understand
the difference between all those metric types, how to use them correctly, and
how to pick the right metric type for your use case.

The most important lesson to learn from this document is simple: If you can,
use native histograms and prefer them over both classic histograms and
summaries.

Where things start to become tricky is if you find yourself in a situation
where you cannot simply use native histograms. Most commenly, you might have to
work with existing metrics that include classic histograms or summaries, or
maybe the instrumentation library you are using does not support native
histograms yet. Furthermore, there are a few specific use cases where you might
prefer a summary or a classic histogram.

With this document, you should be able to navigate the related obstacles and
subtleties.

## Overview

Historically, a sample in the Prometheus world was just a timestamped floating
point value. This value could be interpreted as a
[counter](/docs/concepts/metric_types/#counter) or as a
[gauge](/docs/concepts/metric_types/#gauge), i.e. most of the time Prometheus
doesn't maintain a notion of “static typing”, and you just have to know what
kind of metric you are dealing with (assisted by the convention that the name
of a counter should end on `_total`).

But there are more metric types than counters and gauges. In particular, there
is a need to represent distributions of observed values (usually simply called
“observations” in Prometheus terminology). There are fundamentally two
different approaches:

1. The instrumented program calculates a number of pre-configured quantiles
   (e.g. the median or the 90th percentile) over pre-configured time windows
   (e.g. the last ten minutes) and exposes them as additional metrics.
   Prometheus implements this approach in the form of a metric type called
   _summary_. Depending on the used algorithm, the pre-calculated quantiles are
   usually very accurate. But the calculation has a resource cost for the
   instrumented program. Also, you cannot “recalculate” the quantiles later if
   you desire another time window or another percentile, and most importantly,
   you cannot aggregate quantiles (e.g. to calculate the total 90th percentile
   latency for a service backed by multiple replicated workers).
2. The instrumented program represents the distribution in a more fundamental
   way that can later be used to calculate arbitrary quantiles over arbitrary
   time windows. Most importantly, the distribution is represented in a way
   that can be aggregated with each other. This kind of representation is
   sometimes called a _digest_. Prometheus implements this approach in the form
   of a metric type called _histogram_, where observations are counted in
   buckets, as you might know it from the general concept of a
   [histogram](https://en.wikipedia.org/wiki/Histogram).

In both approaches, Prometheus also collects the count and the sum of
observations (see details [below](#count-and-sum-of-observations)).

Common to both approaches is the need to collect a whole lot of numerical
values per sample, not just a single floating point value as before:

- In any case the count and sum of observations.
- In the case of summaries the pre-calculated quantiles.
- In the case of histograms a set of buckets with their population counts and
  boundaries.

The new types of metrics are also called _composite types_.

In a first approach, Prometheus preserved its data model of simple timestamped
floating point values and mapped this multitude of values into one time series
each, distinguished by specific labels. In this way, summaries and classic
histograms were created. In both, the count and sum of observations are each
tracked in a separate time series. Similarly, each pre-calculated quantile of a
summary and each bucket of a histogram is tracked in its own time series.
PromQL operators and functions act on these individual time series, as
explained in detail further below.

On the one hand, this approach has worked quite well. While keeping the data
model simple, it satisfies many use cases. On the other hand, it suffers from
many limitations, especially when it comes to histograms. Thus, much later in
Prometheus's lifetime, native histograms were introduced. A native histogram
sample is a “composition of values”, where a single sample contains the count
and sum of observations and a dynamic number of buckets with their population
count and boundaries. In the Prometheus TSDB, one histogram results in one time
series of native histogram samples rather than a bunch of independent time
series. PromQL operators and functions now have to act on these composite
samples rather than on the individual time series of floats before.

You can read everything about native histograms in their
[specification](/docs/specs/native_histograms/), but be warned that this is a
very technical and detailed document. If you read on here, you can expect a
more digestible and usage-focused explanation.

If you are interested in Prometheus's journey towards native representation of
composite types, you can read more in a [blog
post](/blog/2026/02/14/modernizing-prometheus-composite-samples/).

## Instrumentation library support

First of all, check the library support for
[histograms](/docs/concepts/metric_types/#histogram) and
[summaries](/docs/concepts/metric_types/#summary).

Summaries are usually supported by all libraries, but some might only track the
count and sum of observations and omit the [quantile calculation](#quantiles).
(Quantile-less summaries is still a legitimate use of summaries, see below.)

Classic histogram support is also widespread, but native histogram support is
still rare. Currently, the latter requires exposition via the protobuf format,
limiting the support to protobuf-enabled libraries, like the Java and the Go
library. Support in a text-based format is underway as part of OpenMetrics v2.
Things should be moving very soon, so definitely check what your library has to
offer.

Even if your instrumented program only exposes classic histogram, you can
configure Prometheus to ingest them as native histograms anyway. This will
happen in the form of _Native Histograms with Custom Bucket boundaries_ (NHCB).
These NHCBs have some limitations compared to the usual native histograms
(which feature so-called standard exponential buckets), but they are still much
more efficient to store than pure classic histograms. NHCBs handling in PromQL
is the same as for other native histograms, so a later migration to “real”
native histograms will be easy.

## Ingestion via Open Telemetry

Maybe you aren't even using a Prometheus instrumentation library, but your
metrics come from a collector adhering to the Open Telemetry (OTel) standard.
When ingesting OTel metrics into a Prometheus-compatible backends, the “normal”
OTel histograms can be converted into classic histograms or NHCBs on the
Prometheus side (hint: prefer the latter), while OTel's _exponential histograms_
are always converted into the usual native histograms (with standard
exponential buckets).

## Count and sum of observations

Histograms and summaries both record observations, typically request durations
or response sizes. In all variants (even quantile-less summaries), they track
the number of observations *and* the sum of the observed values, allowing you
to calculate the *average* of the observed values.

To do so, you generally first take a `rate` over the desired duration and then
divide the “rate of the sum” by the “rate of the count”.

For a native histogram (including an NHCB), you extract the sum and count of
observations with the functions `histogram_sum` and `histogram_count`,
respectively. For example, to calculate the average request duration over the
last 5m from a native histogram called `http_request_duration_seconds`, use the
following PromQL expression:

      histogram_sum(rate(http_request_duration_seconds[5m]))
    /
      histogram_count(rate(http_request_duration_seconds[5m]))

For the calculation of the average, there is also a shorter version using the
function `histogram_avg`. The following is equivalent to the above:

    histogram_avg(rate(http_request_duration_seconds[5m]))

In the case of a summary or a classic histogram, you have separate time series
for the sum and count of observations, marked by the magic suffixes `_sum` and
`_count`, respectively. Thus, a summary or classic histogram called
`http_request_duration_seconds` will result in the series
`http_request_duration_seconds_sum` and `http_request_duration_seconds_count`,
and the expression to calculate the average request duration over the last 5m
will look like this:

      rate(http_request_duration_seconds_sum[5m])
    /
      rate(http_request_duration_seconds_count[5m])

The denominator in both expressions above is also useful on its own. It
represents the requests per second served over the last 5m. Another way of
putting it is that the `http_request_duration_seconds_count` series behaves
exactly like a counter for the HTTP requests (which you would call
`http_requests_total` if you did not already have the histogram or summary to
replace it). The key property of a counter in Prometheus is that it always goes
up, unless there is a counter reset.

If your observations are never negative, the
`http_request_duration_seconds_sum` series also always goes up (unless there is
a counter reset). However, if negative observations are in the mix, the sum of
observations may also go down, breaking assumptions made by PromQL. Such a drop
would erroneously be considered a counter reset in the
`rate(http_request_duration_seconds_sum[5m])` calculation above, throwing off
the result. Note that this problem only affects summaries and classic
histograms. Native histograms (including NHCBs) are `rate`'d as a whole,
thereby detecting counter resets correctly. In the rare cases where you cannot
avoid negative observations and are stuck with summaries or classic histograms,
you can use two separate summaries or histograms, one for positive and one for
negative observations (the latter with inverted sign), and combine the results
later with suitable PromQL expressions.

Both the sum and count of observations are additive, so you can easily
aggregate – after the rate, but before the division, and no matter what the
underlying metric type is. These are the expressions to calculate the average
request duration for each `job`:

Native histograms:

      sum by (job) (histogram_sum(rate(http_request_duration_seconds[5m])))
    /
      sum by (job) (histogram_count(rate(http_request_duration_seconds[5m])))

Summaries or classic histograms:

      sum by (job) (rate(http_request_duration_seconds_sum[5m]))
    /
      sum by (job) (rate(http_request_duration_seconds_count[5m]))

## Bucketing

Histograms are essentially bucketed counters, so the most obvious use case that
separates histograms from summaries is to count observations falling into
particular buckets of observation values.

If you instrument code with classic histograms, you will configure fixed bucket
boundaries. If you let Prometheus ingest these classic histograms in the
classic way, each bucket configured in that way will create a series suffixed
with `_bucket`, no matter if the bucket is populated or not. More buckets give
you more options and accuracy in the various queries (see below), but the “one
series per bucket” cost is quite significant.

If you ingest the classic histograms as NHCBs, unpopulated buckets have a
negligible cost, and even populated ones are handled in a more efficient way
because each NHCB is represented by a single series of composite samples
(rather than by a separate series of floats for each bucket and the sum and
count of observations).

However, picking the right buckets in advance can be challenging. And changing
buckets later creates a lot of disruption (as you will see below). If you
instrument code directly with native histograms, you do not pick any bucket
boundaries explicitly, but you configure a desired resolution. Buckets are
created dynamically following an exponential bucketing schema, covering the
whole range of floating point numbers from -Inf to +Inf. Higher resolution
causes higher resource usage, but generally you can reach much higher resolution
than with classic histograms for the same resource cost. Instrumentation
libraries also offer various strategies to limit the count of populated
buckets, like occasional resets of the histogram or adaptive resolution
reduction. See the documentation of the instrumentation library you are using
for details.

To query the fraction of observations falling into a certain range based on a
native histogram, use an expression like the following:

    histogram_fraction(0, 0.3, sum by (job) (rate(http_request_duration_seconds[5m])))
	
This calculates the fraction of HTTP requests for each `job` that lasted
between 0ms and 300ms in the last 5m. (300ms are represented here as `0.3`
seconds as you should always use base units in Prometheus.) Note how the `sum`
correctly aggregates by summing up the corresponding buckets in the involved
histograms. If the histograms have different bucket layouts, they are
reconciled first. With the usual exponential bucketing schema, this works
smoothly, essentially by falling back to the lowest common resolution among all
involved histograms. The same is done to reconcile different bucket layouts
over time (in the 5m range that is used in the `rate` calculation). With NHCBs,
the effects of this depend heavily on the details of the different bucket
layouts. It is well possible that the reconciled aggregated histogram has just
one bucket left, containing all observations. Because of the potentially severe
effects, the query result gets an info-level annotation if NHCBs needed to be
reconciled. This is also one of the reasons why native histograms with the
dynamic exponential buckets are much easier to handle.

The calculated fraction is accurate if there happens to be a bucket boundary
precisely at 0.3. In the common case that there is not, interpolation is used
to return an estimated fraction. This estimation is more accurate with higher
bucket resolutions. If you already know in advance that, for example, you have
an SLO to serve 95% of requests within 300ms, you could use the fixed bucket
boundaries of a classic histogram to allow an accurate calculation. However, if
your SLO changes later, changing the fixed bucket layout accordingy will be
quite tedious. (You have to change the instrumentation of your code. And you
will run into the issues reconciling different bucket layouts as described
above.) If you pick native histograms with the dynamic exponential buckets, you
won't get a bucket boundary at exactly 0.3, but with a decent resolution, the
interpolated estimate will still be quite accurate. In return, you gain the
freedom of changing the range boundaries at will, which is not only helpful if
your SLO changes, but also to explore questions like “Could we maintain a
stricter SLO based on the data of the last quarter?”.

In the pure legacy case of classic histograms that were also ingested as
classic histograms, the corresponding PromQL expression looks quite different:

      sum by (job) (rate(http_request_duration_seconds_bucket{le="0.3"}[5m]))
    /
      sum by (job) (rate(http_request_duration_seconds_count[5m]))

The `le` label name stands for “less or equal”. This label's value is the upper
inclusive boundary of a cumulative bucket (i.e. this bucket contains all
observations less than or equal to 0.3 – including negative observations, which
we assume wouldn't happen in the case of observing request durations).

Note that this expression strictly requires a bucket boundary configured at
0.3. If the histograms involved do not have a bucket with that boundary, no
interpolation is applied. Instead of an estimation, no result is returned at
all. If only some of the involved histograms have such a bucket, an incomplete
result is returned, but without any warning, which is a pretty bad situation to
be in. (Hint: Avoid this “purely classic” case. If you can, ingest classic
histograms as NHCB. Or instrument with native histograms in the first place.)

## Apdex score

When reading about fractions of requests served within a certain duration
range, you might remember the [Apdex
score](http://en.wikipedia.org/wiki/Apdex). For this score, you set a target
request duration and a tolerated request duration (usually 4 times the target
request duration). Let's say your target request duration is 300ms and the
tolerable request duration is 1.2s. If you want to calculate the Apdex score by
`job` over the last 5m, the PromQL expression for native histograms (including
NHCB) is straightforward. Simply add the fraction of requests within your
duration target to half of the fraction of requests with a duration between the
target and the tolerated duration:

      histogram_fraction(0, 0.3, sum by (job) (rate(http_request_duration_seconds[5m])))
    +
      histogram_fraction(0.3, 1.2, sum by (job) (rate(http_request_duration_seconds[5m]))) / 2

In the “pure classic” case, you _must_ have buckets present at the exact
boundaries (giving you an accurace calculation in return). The corresponding
PromQL expression looks quite different because the classic buckets are
cumulative:

        (
            sum by (job) (rate(http_request_duration_seconds_bucket{le="0.3"}[5m]))
          +
            sum by (job) (rate(http_request_duration_seconds_bucket{le="1.2"}[5m]))
        )
      /
        2
    /
      sum by (job) (rate(http_request_duration_seconds_count[5m]))

(For the sake of simplicity, the above expressions do not explicitly exclude
failed requests from the satisfied and tolerated parts of the calculation, as
it would be required for a strictly correct Apdex calculation.)

## Quantiles

You can use both summaries and histograms to calculate so-called φ-quantiles,
where 0 ≤ φ ≤ 1. The φ-quantile is the observation value that ranks at number
φ*N among the N observations. Examples for φ-quantiles: The 0.5-quantile is
known as the median. The 0.95-quantile is also called the 95th percentile.

The essential difference between summaries and histograms is that summaries
calculate streaming φ-quantiles within the instrumented program and expose them
directly, while histograms expose bucketed observation counts and the
calculation of quantiles from the buckets of a histogram happens on the
Prometheus server using the [`histogram_quantile()`
function](/docs/prometheus/latest/querying/functions/#histogram_quantile).
Histograms are further divided into native and classic histograms. The
following table lists some implications of the different approaches.

|   | Native Histogram | Classic Histogram | Summary
|---|------------------|-------------------|---------
| Required configuration during instrumentation | Pick a desired resolution and maybe a strategy to limit the bucket count. | Pick buckets suitable for the expected range of observed values and the desired queries. | Pick desired φ-quantiles and sliding window. Other φ-quantiles and sliding windows cannot be calculated later.
| Instrumentation cost | Observations are cheap as they only need to increment counters. | Observations are cheap as they only need to increment counters. | Observations are relatively expensive due to the streaming quantile calculation.
| Query performance | The server has to calculate quantiles from complex histogram samples. You can use [recording rules](/docs/prometheus/latest/configuration/recording_rules/#recording-rules) should the ad-hoc calculation take too long (e.g. in a large dashboard). | The server has to calculate quantiles from a large number of bucket series. You can use [recording rules](/docs/prometheus/latest/configuration/recording_rules/#recording-rules) should the ad-hoc calculation take too long (e.g. in a large dashboard). | Fast (no quantile calculations on the server, and aggregations are impossible anyway, see below).
| Number of time series per histogram/summary | One (with a composite sample type). | `_sum`, `_count`, and one for each configured bucket. | `_sum`, `_count`, and one for each configured quantile.
| Quantile error (see below for details) | Limited by the configured resolution. | Error is limited by the width of the bucket the quantile is located in. | Configurable, generally very low.
| Specification of φ-quantile and sliding time-window | Ad-hoc with [PromQL expression](/docs/prometheus/latest/querying/functions/#histogram_quantile). | Ad-hoc with [PromQL expression](/docs/prometheus/latest/querying/functions/#histogram_quantile). | Preconfigured during instrumentation.
| Aggregation | Ad-hoc with [PromQL expression](/docs/prometheus/latest/querying/functions/#histogram_quantile), buckets are always compatible. | Ad-hoc with [PromQL expression](/docs/prometheus/latest/querying/functions/#histogram_quantile), provided there are no changes in bucket boundaries. | [Not aggregatable](http://latencytipoftheday.blogspot.de/2014/06/latencytipoftheday-you-cant-average.html).

As mentioned above, classic histograms can be ingested by the Prometheus server
as a special form of native histograms, called NHCBs (Native Histograms with
Custom Bucket boundaries). Therefore, they share some implications with classic
histograms and some with the usual native histograms. On the instrumentation
side, they behave exactly like classic histograms. (In fact, they are identical
to classic histograms, as NHCBs are only created on the server side when a
classic histogram is ingested as an NHCB.) The query performance and number of
time series is the same as for the usual native histograms, but the quantile
error is the same as with a corresponding classic histogram. NHCBs treat a
change of the bucket layout a bit more gracefully than classic histograms, but
it is still a problematic situation (which is at least flagged as such by an
annotation).

Note the importance of the last item in the table. Let us return to the SLO of
serving 95% of requests within 300ms. This time, you do not want to display the
percentage of requests served within 300ms, but instead the 95th percentile,
i.e. the request duration within which you have served 95% of requests. To do
that, you can either configure a summary with a 0.95-quantile and (for example)
a 5-minute decay time, or you configure a native histogram with a decent
resolution (for example, with the Go instrumentation library, you could use a
value of 1.1 for the `NativeHistogramBucketFactor`), or you configure a classic
histogram with a few buckets around the 300ms mark, e.g. `{le="0.1"}`,
`{le="0.2"}`, `{le="0.3"}`, and `{le="0.45"}`. If your service runs replicated
with a number of instances, you will collect request durations from every
single one of them, and then you want to aggregate everything into an overall
95th percentile. However, aggregating the precomputed quantiles from a summary
rarely makes sense. In this particular case, averaging the quantiles yields
statistically nonsensical values.

    avg(http_request_duration_seconds{quantile="0.95"}) // BAD!

Using histograms, the aggregation is perfectly possible with the
[`histogram_quantile()`
function](/docs/prometheus/latest/querying/functions/#histogram_quantile).

Native histogram version (including NHCB):

    histogram_quantile(0.95, sum(rate(http_request_duration_seconds[5m]))) // GOOD.

Classic histogram version:

    histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m]))) // GOOD.

Furthermore, should your SLO change and you now want to plot the 90th
percentile, or you want to take into account the last 10 minutes
instead of the last 5 minutes, you only have to adjust the expressions
above and you do not need to reconfigure the clients.

### Errors of quantile estimation

Quantiles, whether calculated by the instrumented binary or on the Prometheus
server, are estimated. It is important to understand the errors of that
estimation.

Continuing the histogram example from above, imagine your usual request
durations are almost all very close to 220ms, or in other words, in a histogram
with very high resolution, you would see a very sharp spike at 220ms, and the
“true” 95th percentile is also close to 220ms.

With the `NativeHistogramBucketFactor` of 1.1 (following the Go instrumentation
example), the bucket this spike would fall into has a lower boundary of
approximately 0.210 and an upper boundary of approximately 0.229. (This
document deliberately avoids to explain the details how these boundaries are
calculated. See the aforementioned [spec](/docs/specs/native_histograms/) for
details.) To keep things simple, let's assume that indeed _all_ request fall
into this bucket. The interpolation logic of `histogram_quantile` will then
estimate the 95th percentile to be 228ms (again glossing over the details of
the calculation here). However, given the bucket boundaries above, the true
value could be anywhere between 210ms and 229ms, depending on the actual
distribution of requests within the bucket. So this is a fairly accurate
estimation, even in the worst case (the true value could be 210ms rather than
220ms vs. the estimated value of 228ms).

Now let's apply the same to the classic histogram configured as described
above. All observations, and therefore also the 95th percentile, will fall into
the bucket labeled `{le="0.3"}`, i.e. the bucket from 200ms to 300ms. The
interpolation would estimate 295ms in this case, with the guarantee that the
true value is between 200ms and 300ms. Not only is the error margin much
larger, also the estimated value of 295ms is much farther away from the true
value of 220ms than in case of the native histogram, where the estimation was
228ms. Given that the SLO is at 300ms for the 95th percentile, the classic
histogram gives you the impression that you are very close to breaching it, but
in reality you are still doing quite well.

Next step in our thought experiment: A change in backend routing
adds a fixed amount of 100ms to all request durations. Now the request
duration has its sharp spike at 320ms.

The relevant bucket of the native histogram ranges from 297ms to 324ms (again
just stating numbers here without telling you how they are calculated), with
the interpolated estimation for the 95th percentile being 323ms. That's an
almost perfect guess.

The classic histogram, however, will see almost all observations in the bucket
from 300ms to 450ms. The 95th percentile is estimated to be 443ms, far away
from the correct value close to 320ms. While you are only a tiny bit outside of
your SLO, the estimated 95th quantile looks much worse.

A summary would have had no problem calculating the correct percentile value
very accurately in both cases, at least if it uses an appropriate algorithm
(like the [one used by the Go instrumentation
library](http://dimacs.rutgers.edu/~graham/pubs/slides/bquant-long.pdf) – this
algorithm will yield very accurate results for narrow distributions as in our
example). Unfortunately, you cannot use a summary if you need to aggregate the
observations from a number of instances.

Luckily, due to your appropriate choice of bucket boundaries for the clasic
histogram, in this contrived example of very sharp spikes in the distribution
of observed values, the classic histogram was able to identify correctly if you
were within or outside of your SLO (although it was bad in telling you how far
away you were from breaching or keeping the SLO). However, the closer the
actual value of the quantile is to the SLO (or in other words, the value you
are actually most interested in), the more accurate the calculated value
becomes.

Let us now modify the experiment once more. In the new setup, the distributions
of request durations has a spike at 150ms, but it is not quite as sharp as
before and only comprises 90% of the observations. 10% of the observations are
evenly spread out in a long tail between 150ms and 450ms. With that
distribution, the 95th percentile happens to be exactly at our SLO of 300ms.
With the classic histogram, the calculated value would be accurate in this
(contrived) case, as the value of the 95th percentile happens to coincide with
one of the configured bucket boundaries. Even slightly different values would
still be accurate as the even distribution within the relevant buckets is
exactly what the interpolation algorithm for classic histograms assumes.

The error of the quantile reported by a summary gets more interesting here. In
the case of the Go instrumentation library, the error of the quantile in a
summary is configured in the dimension of φ. In our case we might have
configured 0.95±0.01, i.e. the calculated value will be between the 94th and
96th percentile. The 94th quantile with the distribution described above is
270ms, the 96th quantile is 330ms. The calculated value of the 95th percentile
reported by the summary can be anywhere in the interval between 270ms and
330ms, which unfortunately is all the difference between clearly within the SLO
vs. clearly outside the SLO.

The bottom line is: If you use a summary, you control the error in the
dimension of φ. If you use a histogram, you control the error in the dimension
of the observed value, via choosing the appropriate bucket layout in case of
the classic histogram (tough) or via choosing a bucket resolution in case of a
native histogram (easy). With a broad distribution, small changes in φ result
in large deviations in the observed value. With a sharp distribution, a small
interval of observed values covers a large interval of φ.

The rules of thumb are the following:

  1. If you have access to native histograms, use them with a resolution that
     matches your accuracy requirements. This combines the required accuracy
     with the ability to aggregate and to change parameters (percentile,
     sliding window) ad hoc via the PromQL expression.
  2. If you cannot use native histograms, but you need aggregations, you have
     to use classic histograms, which requires you to set appropriate bucket
     boundaries, covering the correct range of values and finding the right
     trade-off between the cost for the buckets and the required accuracy.
  3. Only if aggregation isn't needed, you can start thinking about summaries.
     The main advantage is that it gives you very accurate quantile estimation
     (in the dimension of φ) at relatively low overall cost. However, the
     additional requirement to pick the desired quantiles and sliding window at
     instrumentation time is another severe drawback of summaries.

## Visualization

While the pre-calculated quantiles of a summary can be visualized as any other
time series of floats, visualizing a histogram is more complex. The Prometheus
UI shows a graphical representation of a single histogram sample in the _Table_
view. However, in the _Graph_ view, it simply plots each component series of a
classic histogram or – in case of a native histogram – only the sum of
observations.

A very useful visualization of a histogram over time is a heatmap. The
Prometheus UI does not support heatmaps yet (see [tracking
issue](https://github.com/prometheus/prometheus/issues/15346)). However,
popular dashboarding tools like
[Perses](https://perses.dev/plugins/docs/heatmapchart/) or
[Grafana](https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/visualizations/heatmap/)
are able to render heatmaps based on Prometheus histograms. The resolution of
classic histograms is usually not high enough to create compelling heatmaps,
but the higher resolution feasible with native histograms enables very detailed
heatmaps.
