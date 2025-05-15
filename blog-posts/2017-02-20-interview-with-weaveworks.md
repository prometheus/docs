---
title: Interview with Weaveworks
created_at: 2017-02-20
kind: article
author_name: Brian Brazil
---

*Continuing our series of interviews with users of Prometheus, Tom Wilkie from
Weaveworks talks about how they choose Prometheus and are now building on it.*


## Can you tell us about Weaveworks?

[Weaveworks](https://www.weave.works/) offers [Weave
Cloud](https://www.weave.works/solution/cloud/), a service which
"operationalizes" microservices through a combination of open source projects
and software as a service.

Weave Cloud consists of: 

  * Visualisation with [Weave Scope](https://github.com/weaveworks/scope)
  * Continuous Deployment with [Weave Flux](https://github.com/weaveworks/flux) 
  * Networking with [Weave Net](https://github.com/weaveworks/weave), the container SDN 
  * [Monitoring with Weave Cortex](https://www.weave.works/guides/cloud-guide-part-3-monitor-prometheus-monitoring/), our open source, distributed Prometheus-as-a-Service.

You can try Weave Cloud [free for 60 days](https://cloud.weave.works/signup).
For the latest on our products check out our [blog](https://www.weave.works/blog/), [Twitter](https://twitter.com/weaveworks), or [Slack](https://weave-community.slack.com/) ([invite](https://weaveworks.github.io/community-slack/)).

## What was your pre-Prometheus monitoring experience?

Weave Cloud was a clean-slate implementation, and as such there was no previous
monitoring system. In previous lives the team had used the typical tools such
as Munin and Nagios. Weave Cloud started life as a multitenant, hosted
version of Scope. Scope includes basic monitoring for things like CPU and
memory usage, so I guess you could say we used that. But we needed something
to monitor Scope itself...

## Why did you decide to look at Prometheus?

We've got a bunch of ex-Google SRE on staff, so there was plenty of experience
with Borgmon, and an ex-SoundClouder with experience of Prometheus. We built
the service on Kubernetes and were looking for something that would "fit" with
its dynamically scheduled nature - so Prometheus was a no-brainer. We've even
written a series of blog posts of which [why Prometheus and Kubernetes work together
so well](https://www.weave.works/prometheus-kubernetes-perfect-match/) is the first.

## How did you transition?

When we started with Prometheus the Kubernetes service discovery was still just
a PR and as such there were few docs. We ran a custom build for a while and
kinda just muddled along, working it out for ourselves. Eventually we gave a
talk at the [London Prometheus meetup](https://www.meetup.com/Prometheus-London/) on [our experience](http://www.slideshare.net/weaveworks/kubernetes-and-prometheus) and published a
[series](https://www.weave.works/prometheus-kubernetes-deploying/) of [blog](https://www.weave.works/prometheus-and-kubernetes-monitoring-your-applications/) [posts](https://www.weave.works/monitoring-kubernetes-infrastructure/). 

We've tried pretty much every different option for running Prometheus. We
started off building our own container images with embedded config, running
them all together in a single Pod alongside Grafana and Alert Manager. We used
ephemeral, in-Pod storage for time series data. We then broke this up into
different Pods so we didn't have to restart Prometheus (and lose history)
whenever we changed our dashboards. More recently we've moved to using
upstream images and storing the config in a Kubernetes config map - which gets
updated by our CI system whenever we change it. We use a small sidecar
container in the Prometheus Pod to watch the config file and ping Prometheus
when it changes. This means we don't have to restart Prometheus very often,
can get away without doing anything fancy for storage, and don't lose history.

Still the problem of periodically losing Prometheus history haunted us, and the
available solutions such as Kubernetes volumes or periodic S3 backups all had
their downsides. Along with our fantastic experience using Prometheus to
monitor the Scope service, this motivated us to build a cloud-native,
distributed version of Prometheus - one which could be upgraded, shuffled
around and survive host failures without losing history. And that’s how Weave
Cortex was born.

## What improvements have you seen since switching?

Ignoring Cortex for a second, we were particularly excited to see the
introduction of the HA Alert Manager; although mainly because it was one of the
[first non-Weaveworks projects to use Weave Mesh](https://www.weave.works/weave-mesh-prometheus-alertmanager/), 
our gossip and coordination layer.

I was also particularly keen on the version two Kubernetes service discovery
changes by Fabian - this solved an acute problem we were having with monitoring
our Consul Pods, where we needed to scrape multiple ports on the same Pod.

And I'd be remiss if I didn't mention the remote write feature (something I
worked on myself). With this, Prometheus forms a key component of Weave Cortex
itself, scraping targets and sending samples to us.

## What do you think the future holds for Weaveworks and Prometheus?

For me the immediate future is Weave Cortex, Weaveworks' Prometheus as a
Service. We use it extensively internally, and are starting to achieve pretty
good query performance out of it. It's running in production with real users
right now, and shortly we'll be introducing support for alerting and achieve
feature parity with upstream Prometheus. From there we'll enter a beta
programme of stabilization before general availability in the middle of the
year.

As part of Cortex, we've developed an intelligent Prometheus expression
browser, with autocompletion for PromQL and Jupyter-esque notebooks. We're
looking forward to getting this in front of more people and eventually open
sourcing it.

I've also got a little side project called
[Loki](https://github.com/weaveworks-experiments/loki), which brings Prometheus
service discovery and scraping to OpenTracing, and makes distributed tracing
easy and robust. I'll be giving a [talk about this at KubeCon/CNCFCon
Berlin](https://cloudnativeeu2017.sched.com/event/9Tbt/loki-an-opensource-zipkin-prometheus-mashup-written-in-go-tom-wilkie-software-engineer)
at the end of March.
