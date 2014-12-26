---
title: Instrumention
sort_rank: 3
---

# Instrumentation

This page gives guidelines for when you're adding instrumentation to your code.

## How to instrument

The short answer is to instrument everything. Every library, subsystem and
service should have at least a few metrics to give you a rough idea of how it's
performing.

Instrumentation should be an integral part of your code, instantiate the metric
classes in the same file you use them. This makes going from alert to console to code
easy when you're chasing an error.

### The three types of services

For monitoring purposes services can generally be broken down into three types,
online serving, offline processing and batch jobs. There is overlap between
them, but every service tends to fit well into one of these categories.

#### Online serving systems

An online serving system is one where someone is waiting on a response, for
example most database and http requests fall into this category.

The key metrics are queries performed, errors and latency. The number of
inprogress requests can also be useful.

Online serving systems should be monitored on both the client and server side,
as if the two sides see different things that's very useful information for debugging.
If a service has many clients, it's also not practical for it to track them
individally so they have to rely on their own stats.

Be consistent in whether you count queries when they start or when they end.
When they end is suggested, as it'll line up with the error and latency stats,
and tends to be easier to code.

#### Offline processing

For offline processing, noone is actively waiting for a response and batching
is common. There may also be multiple stages of processing.

For each stage track the items coming in, how many are in progress, the last
time you processed something, and how many items went out. If batching, you
should also track batches going in and out.

The last time you processed something is useful to detect if you've stalled,
but it's very localised information.  A better approach is to send a heartbeat
though the system, that is some dummy item that gets passed all the way through
and includes the timestamp when it was inserted. Each stage can export the most
recent heartbeat timestamp it has seen, letting you know how long items are
taking to propogate through the system. For systems that don't have quiet
periods where no processing occurs, an explicit heartbeat may not be needed.

#### Batch jobs

There's a very fuzzy line between offline processing and batch jobs, as offline
processing may be done in batch jobs. Batch jobs are distinguished by the
fact that they don't run continuously, which makes scraping them difficult.

The key metric of a batch job is the last time it succeeded. It's also useful to track
how long each major stage of the job took, the overall runtime and the last
time the job completed (successful or failed). These are all Gauges, and should
be pushed to a PushGateway. There are generally also some overall job-specific
statistics that it'd be useful to track, such as total number of records
processed.

For batch jobs that take more than a few minutes to run, it is useful to also
scrape them in the usual pull way. This lets you see the same metrics over time
as for other types of job such as resource usage and latency talking to other
systems. This can aid debugging if the job starts to get slow.

For batch jobs that run very often (say more often than every 15 minutes), you should
consider converting them into daemons and handling them as offline processing jobs.

### Subsystems

In addition the the three main types of services, systems have sub-parts that
it's also good to monitor.

#### Libraries

Libraries should provide aim instrumentation with no additional configuration
required by users.

Where the library is to access some resource outside of the process (e.g.
network, disk, IPC), that's an online serving system and you should track
overall query count, errors (if errors are possible) and latency at a minimum.

Depending on how heavy the library is, you should track internal errors and
latency within the library itself, and any general statistics you think may be
useful.

A library may be used by multiple independant parts of an application against
different resources, so take care to distinguish uses with labels where
appropriate. For example a database connection pool should distinguish based
on what database it's talking to, whereas there's no need to differentiate
between users of a DNS client library.

#### Logging

As a general rule, for every line of logging code you should also have a
counter that is incremented. If you find an interesting log message, you want
be able to see how often it has been happening and for how long.

If there's multiple closely related log messages in the same function (for example
different branches of an if or switch statement), it can sometimes make sense
to have them all increment the same one counter.

It's also generally useful to export the total number of info/error/warning
lines that were logged by the application as a whole, and check for significant
differences as part of your release process.

#### Failure

Failure should be handled similarly to logging, every time there's a failure a
counter should be incremented. Unlike logging, the error may also bubble up to a
more general error counter depending on how your code is strctured.

When reporting failure, you should generally have some other metric
representing total attempts. This makes the failure ratio easy to calculate.

#### Threadpools

For any sort of threadpool, the key metrics are the number of queued requests, the number of
threads in use, the total number of threads, the number of tasks processed and how long they took.
It's also useful to track how long things were waiting in the queue.

#### Caches

The key metrics for a cache are total queries, hits, overall latency and then
the query count, errors and latency of whatever online serving system the cache is in front of.

#### Collectors

When implementing a non-trivial custom Collector, it's advised to export a
Gauge for how long the collection took in seconds and another for the number of
errors encountered.

This is one of the two cases when it's okay to export a duration as a Gauge
rather than a Summary, the other being batch job durations. This is as both
represent information about that particular push/scrape, rather than
tracking multiple durations over time.

## Things to watch out for

There's some things to be aware of when doing monitoring generally, and also
with Prometheus-style monitoring in particular.

### Use labels

Very few monitoring systems have the notion of labels and a rules language to
take advantage of them, so it takes a bit of getting used to.

When you have multiple metrics that you want to add/average/sum, they should
usually be one metric with labels rather than multiple metrics.

For example rather `http_responses_500_total` and `http_resonses_403_total`
you should have one metric called `http_responses_total` with a `code` label
for the HTTP response code. You can then process the entire metric as one in
rules and graphs.

As a rule of thumb no part of a metric name should ever be procedurally
generated, you should use labels instead. The one exception is when proxying
from another monitoring/instrumentation system.

See also the [naming](../naming) section.

### Don't overuse labels

Each labelset is an additional timeseries that has RAM, CPU, disk and network
costs. Usually this is negligable in the grand scheme of things, however if you
have lots of metrics with hundreds of labelsets across hundreds of servers this
can add up quickly.

As a general guideline try to keep the cardinality of your metrics below 10,
and for metrics that exceed that, aim to limit them to a handful across your
whole system. The vast majority of your metrics should have no labels.

If you have a metric that has a cardinality over 100 or the potential to grow
that large, investigate alternate solutions such as reducing the number of
dimensions or moving the analysis away from monitoring and to a general purpose
processing system.

If you're unsure, start with no labels and add more
labels over time as concrete use cases arise.

### Counter vs Gauge vs Summary

It's important to know which of the three main metric types to use for a given
metric. There's a simple rule of thumb, if it can go down it's a Gauge. 

Counters can only go up (and reset, such as when a process restarts). They're
useful for accumulating the number of events, or the amount of something at
each event. For example the total number of HTTP requests, or the total amount
of bytes send in HTTP requests. Raw counters are rarely useful, use the
`rate()` function to get the rate at which they're incresing per second.

Gauges can be set, go up and go down. They're useful for snapshots of state,
such as in-progress requests, free/total memory or temperature. You should
never take a `rate()` of a Gauge.

Summaries are similar to having two Counters, they track the number of events
*and* the amount of something for each event, allowing you to calculate the
average amount per event (useful for latency, for example). In addition you can
also get quantiles of the amounts, but note that this isn't aggregatable.

### Timestamps, not time since

If you want to track the amount of time since something happened export the
unix timestamp at which it happened - not the time since it happened.

With the timestamp exported you can use `time() - my_timestamp_metric` to
calculate the time since the event, removing the need for update logic and
protecting you against the update logic getting stuck.

### Inner loops

In general the additional resource cost of instrumentation is far outweighed by
the benefits it brings to operations and development.

For code which is performance critical or called more than 100k times a second
inside a given process, you may wish to take some care as to how many metrics
you update.

A Java Simpleclient counter takes
[12-17ns](https://github.com/prometheus/client_java/blob/master/benchmark/README.md)
to increment depending on contention, other languages will have similar
performance. If that amount of time is significant for your inner loop, limit
the number of metrics you increment in the inner loop and avoid labels (or
cache the result of the label lookup, for example the return value of `With()`
in Go or `labels()` in Java) where possible.

Beware also of metrics updates involving time or durations, as getting the time
may involve a syscall. As with all matters involving performance critical code,
benchmarks are the best way to determine the impact of any given change.

### Avoid missing metrics

Time series that aren't present until something happens are difficult to deal with,
as the usual simple operations are no longer sufficient to correctly handle
them. To avoid this, export a 0 for any time series you know may exist in advance.

Most Prometheus client libraries (including Go and Java Simpleclient) will
automatically export a 0 for you for metrics with no labels.
