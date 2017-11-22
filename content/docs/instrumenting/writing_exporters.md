---
title: Writing exporters
sort_rank: 5
---

# Writing exporters

When directly instrumenting your own code, the general rules of how to
instrument code with a Prometheus client library can be followed quite
directly. When taking metrics from another monitoring or instrumentation
system, things tend not to be so black and white.

This document contains things you should consider when writing an exporter or
custom collector. The theory covered will also be of interest to those doing
direct instrumentation.

If you are writing an exporter and are unclear on anything here, contact us on
IRC (#prometheus on Freenode) or the [mailing list](/community).

## Maintainability and purity

The main decision you need to make when writing an exporter is how much work
you’re willing to put in to get perfect metrics out of it.

If the system in question has only a handful of metrics that rarely change,
then getting everything perfect is an easy choice (e.g. the [haproxy
exporter](https://github.com/prometheus/haproxy_exporter)).

If on the other hand the system has hundreds of metrics that change
continuously with new versions, if you try to get things perfect then you’ve
signed yourself up for a lot of ongoing work. The [mysql
exporter](https://github.com/prometheus/mysqld_exporter) is on this end of the
spectrum.

The [node exporter](https://github.com/prometheus/node_exporter) is a mix,
varying by module. For mdadm we have to hand-parse a file and come up with our
own metrics, so we may as well get the metrics right while we’re at it. For
meminfo on the other hand, the results vary across kernel versions so we end up
doing just enough of a transform to create valid metrics.

## Configuration

When working with applications, you should aim for an exporter that requires no
custom configuration by the user beyond telling it where the application is.
You may also need to offer the ability to filter out certain metrics if they
may be too granular and expensive on large setups (e.g. the haproxy exporter
allows filtering of per-server stats). Similarly there may be expensive metrics
that are disabled by default.

When working with monitoring systems, frameworks and protocols things are not
so simple.

In the best case the system in question has a similar enough data model to
Prometheus that you can automatically determine how to transform metrics. This
is the case for Cloudwatch, SNMP and Collectd. At most we need the ability to
let the user select which metrics they want to pull out.

In the more common case metrics from the system are completely non-standard,
depending on how the user is using it and what the underlying application is.
In that case the user has to tell us how to transform the metrics. The JMX
exporter is the worst offender here, with the graphite and statsd exporters
also requiring configuration to extract labels.

Providing something that produces some output out of the box and a selection of
example configurations is advised. When writing configurations for such
exporters, this document should be kept in mind.

YAML is the standard Prometheus configuration format.

## Metrics

### Naming

Follow the [best practices on metric naming](/docs/practices/naming).

Generally metric names should allow someone who’s familiar with Prometheus but
not a particular system to make a good guess as to what a metric means.  A
metric named `http_requests_total` is not extremely useful - are these being
measured as they come in, in some filter or when they get to the user’s code?
And `requests_total` is even worse, what type of requests?

To put it another way with direct instrumentation, a given metric should exist
within exactly one file. Accordingly within exporters and collectors, a metric
should apply to exactly one subsystem and be named accordingly.

Metric names should never be procedurally generated, except when writing a
custom collector or exporter.

Metric names for applications should generally be prefixed by the exporter
name, e.g. `haproxy_up`.

Metrics must use base units (e.g. seconds, bytes) and leave converting them to
something more readable to the graphing software. No matter what units you end
up using, the units in the metric name must match the units in use. Similarly
expose ratios, not percentages (though a counter for each of the two components
of the ratio is better).

Metric names should not include the labels that they’re exported with (e.g.
`by_type`) as that won’t make sense if the label is aggregated away.

The one exception is when you’re exporting the same data with different labels
via multiple metrics, in which case that’s usually the sanest way to
distinguish them. For direct instrumentation this should only come up when
exporting a single metric with all the labels would have too high a
cardinality.

Prometheus metrics and label names are written in `snake_case`. Converting
`camelCase` to `snake_case` is desirable, though doing so automatically
doesn’t always produce nice results for things like `myTCPExample` or `isNaN`
so sometimes it’s best to leave them as-is.

Exposed metrics should not contain colons, these are for users to use when
aggregating.

Only `[a-zA-Z0-9:_]` are valid in metric names, any other characters should be
sanitized to an underscore.

The `_sum`, `_count`, `_bucket` and `_total` suffixes are used by Summaries,
Histograms and Counters. Unless you’re producing one of those, avoid these
suffixes.

`_total` is a convention for counters, you should use it if you’re using the
COUNTER type.

The `process_` and `scrape_` prefixes are reserved. It’s okay to add your own
prefix on to these if they follow the [matching
semantics](https://docs.google.com/document/d/1Q0MXWdwp1mdXCzNRak6bW5LLVylVRXhdi7_21Sg15xQ/edit).
E.g. Prometheus has `scrape_duration_seconds` for how long a scrape took, it’s
good practice to have e.g. `jmx_scrape_duration_seconds` saying how long the
JMX collector took to do its thing. For process stats where you have access to
the pid, both Go and Python offer collectors that’ll handle this for you (see
the [haproxy exporter](https://github.com/prometheus/haproxy_exporter) for an
example).

When you have a successful request count and a failed request count, the best
way to expose this is as one metric for total requests and another metric for
failed requests. This makes it easy to calculate the failure ratio. Do not use
one metric with a failed/success label. Similarly with hit/miss for caches,
it’s better to have one metric for total and another for hits.

Consider the likelihood that someone using monitoring will do a code or web
search for the metric name. If the names are very well established and unlikely
to be used outside of the realm of people used to those names (e.g. SNMP and
network engineers) then leaving them as-is may be a good idea. This logic
doesn’t apply for e.g. MySQL as non-DBAs can be expected to be poking around
the metrics. A `HELP` string with the original name can provide most of the
same benefits as using the original names.

### Labels

Read the [general
advice](/docs/practices/instrumentation/#things-to-watch-out-for) on labels.

Avoid `type` as a label name, it’s too generic and meaningless. You should also
try where possible to avoid names that are likely to clash with target labels,
such as `region`, `zone`, `cluster`, `availability_zone`, `az`, `datacenter`,
`dc`, `owner`, `customer`, `stage`, `service`, `environment` and `env` - though
if that’s what the application calls something it’s best not to cause confusion
by renaming it.

Avoid the temptation to put things into one metric just because they share a
prefix. Unless you’re sure something makes sense as one metric, multiple
metrics is safer.

The label `le` has special meaning for Histograms, and `quantile` for
Summaries. Avoid these labels generally.

Read/write and send/receive are best as separate metrics, rather than as a
label. This is usually because you care about only one of them at a time, and
it’s easier to use them that way.

The rule of thumb is that one metric should make sense when summed or averaged.
There is one other case that comes up with exporters, and that’s where the data
is fundamentally tabular and doing otherwise would require users to do regexes
on metric names to be usable. Consider the voltage sensors on your
motherboard, while doing math across them is meaningless, it makes sense to
have them in one metric rather than having one metric per sensor. All values
within a metrics should (almost) always have the same unit (consider if fan
speeds were mixed in with the voltages, and you had no way to automatically
separate them).

Don’t do this:

<pre>
my_metric{label=a} 1
my_metric{label=b} 6
<b>my_metric{label=total} 7</b>
</pre>

or this:

<pre>
my_metric{label=a} 1
my_metric{label=b} 6
<b>my_metric{} 7</b>
</pre>

The former breaks people who do a `sum()` over your metric, and the latter
breaks sum and also is quite difficult to work with. Some client libraries
(e.g. Go) will actively try to stop you doing the latter in a custom collector,
and all client libraries should stop you from doing the former with direct
instrumentation. Never do either of these, rely on Prometheus aggregation
instead.

If your monitoring exposes a total like this, drop the total. If you have to
keep it around for some reason (e.g. the total includes things not counted
individually), use different metric names.

Instrumentation labels should be minimal, every extra label is one more that
users need to consider when writing their PromQL. Accordingly, avoid having
instrumentation labels which could be removed without affecting uniqueness of
time series. Additional information around a metric can be added via an info
metric, see below around how to handle version numbers.

However there are cases where it is expected that virtually all users of a
metric will want the additional information a non-unique label could add, so an
info metric is not the right tradeoff. For example the mysqld_exporter's
`mysqld_perf_schema_events_statements_total`'s `digest` label is a hash of the
full query pattern and is sufficient for uniqueness. However it is of little
use without the human readable `digest_text` label, which for long queries will
contain only the start of the query pattern and is thus not unique. Thus we end
up with both the `digest_text` for humans and the `digest` label for
uniqueness.

### Target labels, not static scraped labels

If you ever find yourself wanting to apply the same label to all of your
metrics, stop.

There’s generally two cases where this comes up.

The first is some label it’d be useful to have on the metrics that are about,
such as the version number of the software. Use the approach described at
[https://www.robustperception.io/how-to-have-labels-for-machine-roles/](http://www.robustperception.io/how-to-have-labels-for-machine-roles/)
instead.

The other case are what are really target labels. These are things like region,
cluster names, and so on, that come from your infrastructure setup rather than
the application itself. It’s not for an application to say where it fits in
your label taxonomy, that’s for the person running the Prometheus server to
configure and different people monitoring the same application may give it
different names.

Accordingly these labels belong up in the scrape configs of Prometheus via
whatever service discovery you’re using. It’s okay to apply the concept of
machine roles here as well, as it’s likely useful information for at least some
of the people scraping it.

### Types

You should try to match up the types of your metrics to Prometheus types. This
usually means counters and gauges. The `_count` and `_sum` of summaries are
also relatively common, and on occasion you’ll see quantiles. Histograms are
rare, if you come across one remember that the exposition format exposes
cumulative values.

Often it won’t be obvious what the type of a metric is (especially if you’re
automatically processing a set of metrics), use `UNTYPED` in that case. In
general `UNTYPED` is a safe default.

Counters can’t go down, so if you’ve a counter type coming from another
instrumentation system that has a way to decrement it (e.g. Dropwizard metrics)
that’s not a counter - it’s a gauge. `UNTYPED` is probably the best type to use
there, as `GAUGE` would be misleading if it were being used as a counter.

### Help strings

When you’re transforming metrics it’s useful for users to be able to track back
to what the original was, and what rules were in play that caused that
transform. Putting in the name of the collector/exporter, the id of any rule
that was applied and the name/details of the original metric into the help
string will greatly aid users.

Prometheus doesn’t like one metric having different help strings. If you’re
making one metric from many others, choose one of them to put in the help
string.

For examples of this, the SNMP exporter uses the OID and the JMX exporter puts
in a sample mBean name. The [haproxy
exporter](https://github.com/prometheus/haproxy_exporter) has hand-written
strings. The [node exporter](https://github.com/prometheus/node_exporter) has a
wide variety of examples.

### Drop less useful statistics

Some instrumentation systems expose 1m/5m/15m rates, average rates since
application start (called `mean` in dropwizard metrics for example), minimums,
maximums and standard deviations.

These should all be dropped, as they’re not very useful and add clutter.
Prometheus can calculate rates itself, and usually more accurately (these are
usually exponentially decaying averages). You don’t know what time the min/max
were calculated over, and the stddev is statistically useless (expose sum of
squares, `_sum` and `_count` if you ever need to calculate it).

Quantiles have related issues, you may choose to drop them or put them in a
Summary.

### Dotted strings

Many monitoring systems don’t have labels, instead doing things like
`my.class.path.mymetric.labelvalue1.labelvalue2.labelvalue3`.

The graphite and statsd exporters share a way of doing this with a small
configuration language. Other exporters should implement the same. It’s
currently implemented only in Go, and would benefit from being factored out
into a separate library.

## Collectors

When implementing the collector for your exporter, you should never use the
usual direct instrumentation approach and then update the metrics on each
scrape.

Rather create new metrics each time. In Go this is done with
[MustNewConstMetric](https://godoc.org/github.com/prometheus/client_golang/prometheus#MustNewConstMetric)
in your `Update()` method. For Python see
[https://github.com/prometheus/client_python#custom-collectors](https://github.com/prometheus/client_python#custom-collectors)
and for Java generate a `List<MetricFamilySamples>` in your collect method -
see
[StandardExports.java](https://github.com/prometheus/client_java/blob/master/simpleclient_hotspot/src/main/java/io/prometheus/client/hotspot/StandardExports.java)
for an example.

The reason for this is firstly that two scrapes could happen at the same time,
and direct instrumentation uses what are effectively (file-level) global
variables so you’ll get race conditions. The second reason is that if a label
value disappears, it’ll still be exported.

Instrumenting your exporter itself via direct instrumentation is fine, e.g.
total bytes transferred or calls performed by the exporter across all scrapes.
For exporters such as the blackbox exporter and snmp exporter which aren’t tied
to a single target, these should only be exposed on a vanilla `/metrics` call -
not on a scrape of a particular target.

### Metrics about the scrape itself

Sometimes you’d like to export metrics that are about the scrape, like how long
it took or how many records you processed.

These should be exposed as gauges (as they’re about an event, the scrape) and
the metric name prefixed by the exporter name e.g.
`jmx_scrape_duration_seconds`. Usually the `_exporter` is excluded (and if the
exporter also makes sense to use as just a collector, definitely exclude it).

### Machine and process metrics

Many systems (e.g. elasticsearch) expose machine metrics such a CPU, memory and
filesystem information. As the node exporter provides these in the Prometheus
ecosystem, such metrics should be dropped.

In the Java world, many instrumentation frameworks expose process-level and
JVM-level stats such as CPU and GC. The Java client and JMX exporter already
include these in the preferred form via
[DefaultExports.java](https://github.com/prometheus/client_java/blob/master/simpleclient_hotspot/src/main/java/io/prometheus/client/hotspot/DefaultExports.java),
so these should be dropped.

Similarly with other languages.

## Deployment

Each exporter should monitor exactly one instance application, preferably
sitting right beside it on the same machine. That means for every haproxy you
run, you run a `haproxy_exporter` process. For every machine with a mesos
slave, you run the mesos exporter on it (and another one for the master if a
machine has both).

The theory behind this is that for direct instrumentation this is what you’d be
doing, and we’re trying to get as close to that as we can in other layouts.
This means that all service discovery is done in Prometheus, not in exporters.
This also has the benefit that Prometheus has the target information it needs
to allow users probe your service with the blackbox exporter.

There are two exceptions:

The first is where running beside the application your monitoring is completely
nonsensical. SNMP, blackbox and IPMI are the main examples of this. IPMI and
SNMP as the devices are effectively black boxes that it’s impossible to run
code on (though if you could run a node exporter on them instead that’d be
better), and blackbox as if you’re monitoring something like a DNS name there’s
nothing to run on. In this case Prometheus should still do service discovery,
and pass on the target to be scraped. See the blackbox and SNMP exporters for
examples.

Note that it is only currently possible to write this type of exporter with the
Go, Python and Java client libraries.

The other is where you’re pulling some stats out of a random instance of a
system and don’t care which one you’re talking to. Consider a set of MySQL
slaves you wanted to run some business queries against the data to then export.
Having an exporter that uses your usual load balancing approach to talk to one
slave is the sanest approach.

This doesn’t apply when you’re monitoring a system with master-election, in
that case you should monitor each instance individually and deal with the
masterness in Prometheus.  This is as there isn’t always exactly one master,
and changing what a target is underneath Prometheus’s feet will cause oddities.

### Scheduling

Metrics should only be pulled from the application when Prometheus scrapes
them, exporters should not perform scrapes based on their own timers. That is,
all scrapes should be synchronous.

Accordingly you should not set timestamps on the metric you expose, let
Prometheus take care of that. If you think you need timestamps, then you
probably need the pushgateway (without timestamps) instead.

If a metric is particularly expensive to retrieve (i.e. takes more than a
minute), it is acceptable to cache it. This should be noted in the `HELP`
string.

The default scrape timeout for Prometheus is 10 seconds. If your exporter can
be expected to exceed this, you should explicitly call this out in your user
docs.

### Pushes

Some applications and monitoring systems only push metrics e.g. statsd,
graphite and collectd.

There’s two considerations here.

Firstly, when do you expire metrics? Collected and things talking to Graphite
both export regularly, and when they stop we want to stop exposing the metrics.
Collected includes an expiry time so we use that, Graphite doesn’t so it’s a
flag on the exporter.

Statsd is a bit different, as it’s dealing with events rather than metrics. The
best model is to run one exporter beside each application and restart them when
the application restarts so that state is cleared.

The second is that these sort of systems tend to allow your users to send
either deltas or raw counters. You should rely on the raw counters as far as
possible, as that’s the general Prometheus model.

For service-level metrics (e.g. service-level batch jobs) you should have your
exporter push into the push gateway and exit after the event rather than
handling the state yourself. For instance-level batch metrics, there is no
clear pattern yet - options are either to abuse the node exporter’s textfile
collector, rely on in-memory state (probably best if you don’t need to persist
over a reboot) or implement similar functionality to the textfile collector.

### Failed scrapes

There are currently two patterns for failed scrapes where the application
you’re talking to doesn’t respond or has other problems.

The first is to return a 5xx error.

The seconds is to have an `myexporter_up` (e.g. `haproxy_up`) variable that’s
0/1 depending on whether the scrape worked.

The latter is better where there’s still some useful metrics you can get even
with a failed scrape, such as the haproxy exporter providing process stats. The
former is a tad easier for users to deal with, as `up` works in the usual way
(though you can’t distinguish between the exporter being down and the
application being down).

### Landing page

It’s nicer for users if visiting `http://yourexporter/` has a simple html page
with the name of the exporter, and a link to the `/metrics`.

### Port numbers

A user may have many exporters and Prometheus components on the same machine,
so to make that easier each has a unique port number.

[https://github.com/prometheus/prometheus/wiki/Default-port-allocations](https://github.com/prometheus/prometheus/wiki/Default-port-allocations)
is where we track them, this is publicly editable.

Feel free to grab the next free port number when developing your exporter,
preferably before publicly announcing it. If you’re not ready to release yet,
putting your username and WIP is fine.

This is a registry to make our users’ lives a little easier, not a commitment
to develop particular exporters. For exporters for internal applications we
recommend using ports outside of the range of default port allocations.

## Announcing

Once you’re ready to announce your exporter to the world, send an email to the
mailing list and send a PR to add it to [the list of available
exporters](https://github.com/prometheus/docs/blob/master/content/docs/instrumenting/exporters.md).
