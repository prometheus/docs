---
title: Interview with Canonical
created_at: 2016-11-16
kind: article
author_name: Brian Brazil
---

*Continuing our series of interviews with users of Prometheus, Canonical talks
about how they are transitioning to Prometheus.*

## Can you tell us about yourself and what Canonical does?

[Canonical](http://www.canonical.com/) is probably best known as the company
that sponsors Ubuntu Linux.  We also produce or contribute to a number of other
open-source projects including MAAS, Juju, and OpenStack, and provide
commercial support for these products.  Ubuntu powers the majority of OpenStack
deployments, with 55% of production clouds and [58% of large cloud
deployments](
https://www.openstack.org/assets/survey/April-2016-User-Survey-Report.pdf#page=47).

My group, BootStack, is our fully managed private cloud service.  We build and
operate OpenStack clouds for Canonical customers.

<!-- more -->

## What was your pre-Prometheus monitoring experience?

We’d used a combination of [Nagios](https://www.nagios.org/),
[Graphite](https://graphite.readthedocs.io/en/latest/)/[statsd](https://github.com/etsy/statsd),
and in-house [Django](https://www.djangoproject.com/) apps. These did not offer
us the level of flexibility and reporting that we need in both our internal and
customer cloud environments.

## Why did you decide to look at Prometheus?

We’d evaluated a few alternatives, including
[InfluxDB](https://github.com/influxdata/influxdb) and extending our use of
Graphite, but our first experiences with Prometheus proved it to have the
combination of simplicity and power that we were looking for.  We especially
appreciate the convenience of labels, the simple HTTP protocol, and the out of
box [timeseries alerting](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/). The
potential with Prometheus to replace 2 different tools (alerting and trending)
with one is particularly appealing.

Also, several of our staff have prior experience with Borgmon from their time
at Google which greatly added to our interest!

## How did you transition?

We are still in the process of transitioning, we expect this will take some
time due to the number of custom checks we currently use in our existing
systems that will need to be re-implemented in Prometheus.  The most useful
resource has been the [prometheus.io](https://prometheus.io/) site documentation.

It took us a while to choose an exporter.  We originally went with
[collectd](https://collectd.org/) but ran into limitations with this.  We’re
working on writing an
[openstack-exporter](https://github.com/CanonicalLtd/prometheus-openstack-exporter)
now and were a bit surprised to find there is no good, working, example how to
write exporter from scratch.

Some challenges we’ve run into are: No downsampling support, no long term
storage solution (yet), and we were surprised by the default 2 week retention
period. There's currently no tie-in with Juju, but [we’re working on it](
https://launchpad.net/prometheus-registration)!

## What improvements have you seen since switching?

Once we got the hang of exporters, we found they were very easy to write and
have given us very useful metrics.  For example we are developing an
openstack-exporter for our cloud environments.  We’ve also seen very quick
cross-team adoption from our DevOps and WebOps groups and developers.  We don’t
yet have alerting in place but expect to see a lot more to come once we get to
this phase of the transition.

## What do you think the future holds for Canonical and Prometheus?

We expect Prometheus to be a significant part of our monitoring and reporting
infrastructure, providing the metrics gathering and storage for numerous
current and future systems. We see it potentially replacing Nagios as for
alerting.
