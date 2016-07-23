---
title: Pull doesn't scale - or does it?
created_at: 2016-07-23
kind: article
author_name: Julius Volz
---

Let's talk about one particularly hard-to-kill myth again. Whenever there is a
discussion about monitoring systems and Prometheus's pull-based metrics
collection approach comes up, someone inevitably chimes in about how a
pull-based approach just “fundamentally doesn't scale”. When asked why they
think this is the case, they either respond with vague fears or cite reasons
which only apply to systems that are fundamentally different from Prometheus
in other ways. In fact, having worked with pull-based monitoring at the largest
scales, this claim runs counter to our own operational experience.

We already have an FAQ entry about
[why Prometheus chooses pull over push](/docs/introduction/faq/#why-do-you-pull-rather-than-push?),
but it does not focus specifically on scaling aspects. Let's have a closer look
at the usual misconceptions around this claim and analyze whether and how they
would apply to Prometheus.

## Prometheus is not Nagios

When people think of a monitoring system that actively pulls, they often think
of Nagios. Nagios has a reputation of not scaling well, in part due to spawning
subprocesses for active checks that can run arbitrary actions on the Nagios
host in order to determine the health of a certain host or service. This sort
of check architecture indeed does not scale well, as the central Nagios host
quickly gets overwhelmed. As a result, people usually configure checks to only
be executed every couple of minutes, or they run into more serious problems.

However, Prometheus takes a fundamentally different approach altogether.
Instead of executing check scripts, it only collects time series data from a
set of instrumented targets over the network. For each target, the Prometheus
server simply fetches the current state of all metrics of that target over HTTP
and has no other execution overhead that would be pull-related. This brings us
to the next point:

## It doesn't matter who initiates the connection

For scaling purposes, it doesn't matter who initiates the TCP connection over
which metrics are then transferred. Either way you do it, the effort for
establishing a connection is small compared to the metrics payload and other
required work.

But a push-based approach could use UDP and avoid connection establishment
altogether, you say! True, but the TCP/HTTP overhead in Prometheus is still
negligible compared to the other work that the Prometheus server has to do to
ingest data (especially persisting time series data on disk). To put some
numbers behind this: a single beefy Prometheus server can easily store millions
of time series, with a record of 800,000 incoming samples per second (as
measured with real production metrics data at SoundCloud). This allows you to
monitor over 10,000 machines from a single Prometheus server. The scaling
bottleneck here has never been related to pulling metrics, but usually to the
speed at which the Prometheus server can ingest the data into memory and then
sustainably persist it on disk/SSD.

Also, although networks are pretty reliable these days, using a
TCP-based pull approach makes doubly sure that metrics data arrives reliably,
or that the monitoring system at least knows immediately when the metrics
transfer fails due to a broken network.

## Prometheus is not an event-based system

Some monitoring systems are event-based. That is, they report each individual
event (an HTTP request, an exception, you name it) to a central monitoring
system immediately as it happens. This central system then either aggregates
the events into metrics (StatsD is one example of this) or stores events
individually for later processing (the ELK stack is an example of that). In
such a system, pulling would be problematic indeed: the instrumented service
would have to buffer events between pulls, and the pulls would have to happen
incredibly frequently in order to simulate the same “liveness” of the
push-based approach and not overwhelm event buffers.

However, again, Prometheus is not an event-based monitoring system. You do not
send raw events to Prometheus, nor can it store them. Prometheus is in the
business of collecting aggregated time series data. That means that it's only
interested in regularly collecting the current *state* of a given set of
metrics, not the underlying events that led to the generation of those metrics.
For example, an instrumented service would not send a message about each HTTP
request to Prometheus as it is handled, but would simply count up those
requests in memory.  This can happen hundreds of thousands of times per second
without causing any monitoring traffic. Prometheus then simply asks the service
instance every 15 or 30 seconds (or whatever you configure) about the current
counter value and stores that value together with the scrape timestamp as a
sample. Other metric types, such as gauges, histograms, and summaries, are
handled similarly. The resulting monitoring traffic is low, and the pull-based
approach also does not create problems in this case.

## But now my monitoring needs to know about my service instances!

With a pull-based approach, your monitoring system needs to know which service
instances exist and how to connect to them. Often people are worried about the
extra configuration this requires on the side of the monitoring system.

We would argue that you cannot escape this configuration effort for
serious monitoring setups in any case: if your monitoring system doesn't know
what the world *should* look like and which monitored service instances
*should* be there, how would it be able to tell when an instance just never
reports in, is down due to an outage, or really is no longer meant to exist?
This is only acceptable if you never care about the health of individual
instances at all, like when you only run ephemeral workers where it is
sufficient for a large-enough number of them to report in some result. Most
environments are not exclusively like that.

If the monitoring system needs to know the desired state of the world anyway,
then a push-based approach actually requires *more* configuration in total. Not
only does your monitoring system need to know what service instances should
exist, but your service instances now also need to know how to reach your
monitoring system. This is not only more required configuration, it also makes
your monitoring setup less flexible. Now you cannot just run a copy of
production monitoring on your laptop, as you can with pull. Now you cannot just
get metrics from some other tool or inspect metrics endpoints manually, as you
can with pull. Now you cannot just run two Prometheus servers to get high
availability, as you can with pull.  Now you cannot change the endpoint under
which your production monitoring is reachable without reconfiguring all of your
metrics sources.

On a practical front, Prometheus makes it easy to configure the desired state
of the world with its built-in support for a wide variety of service discovery
mechanisms for cloud providers and container-scheduling systems: Consul,
Marathon, Kubernetes, EC2, DNS-based SD, Azure, Zookeeper Serversets, and more.
Prometheus also allows you to plug in your own custom mechanism if needed.

## Accidentally DDoS-ing your monitoring

Whether you use a pull-based or a push-based approach, any time-series database
will fall over if you send it more samples than it can handle. However, we have
made the experience that it's slightly more likely for a push-based approach to
accidentally bring down your monitoring. If the control over what metrics get
ingested from which instances is not centralized (in your monitoring system),
then you run into the danger of experimental or rogue jobs suddenly pushing
lots of garbage data into your production monitoring and bringing it down.
There are still plenty of ways how this can happen with a pull-based approach
(which only controls where to pull metrics from, but not the size and nature of
the metrics payloads), but the risk is lower and such incidents can be
fixed at a central point.

## Real-world proof

Besides the fact that Prometheus is already being used to monitor very large
setups in the real world (like using it to [monitor millions of machines at
DigitalOcean](http://promcon.io/talks/scaling_to_a_million_machines_with_prometheus/)),
there are other prominent examples of pull-based monitoring being used
successfully in the largest possible environments. Prometheus was inspired by
Google's Borgmon, which was (and partially still is) used within Google to
monitor all its critical production services using a pull-based approach. Any
scaling issues we encountered with Borgmon at Google were not due its pull
approach either. If a pull-based approach scales to a global environment with
many tens of datacenters and hundreds of thousands of machines, you can hardly say
that pull doesn't scale.

## But there are other problems with pull!

There are indeed setups that are hard to monitor with a pull-based approach.
A prominent example is when you have many endpoints scattered around the
world which are not directly reachable due to firewalls or complicated
networking setups, and where it's infeasible to run a Prometheus server
directly in each of the network segments. This is not quite the environment for
which Prometheus was built, although workarounds are often possible ([via the
Pushgateway or restructuring your setup](/docs/practices/pushing/)). In any
case, these remaining concerns about pull-based monitoring are usually not
scaling-related, but concern some other operational difficulty that pulling
poses in certain environments.

## All good then?

We know that the debate about pulling versus pushing is a religious one and as
such will probably never die out. However, we hope that this article addresses the
most common concerns that people have about a pull-based monitoring approach.
With Prometheus and other pull-based systems being used successfully in very
large environments and the pull aspect never posing a bottleneck in reality,
the result should be clear: the “pull doesn't scale” argument is not a real
concern.
