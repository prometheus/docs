---
title: Interview with DigitalOcean
created_at: 2016-09-14
kind: article
author_name: Brian Brazil
---

*Next in our series of interviews with users of Prometheus, DigitalOcean talks
about how they use Prometheus. Carlos Amedee also talked about [the social
aspects of the rollout](https://www.youtube.com/watch?v=ieo3lGBHcy8) at PromCon
2016.*

## Can you tell us about yourself and what DigitalOcean does?

My name is Ian Hansen and I work on the platform metrics team.
[DigitalOcean](https://www.digitalocean.com/) provides simple cloud computing.
To date, we’ve created 20 million Droplets (SSD cloud servers) across 13
regions. We also recently released a new Block Storage product.

![DigitalOcean logo](/assets/blog/2016-09-14/DO_Logo_Horizontal_Blue-3db19536.png)

## What was your pre-Prometheus monitoring experience?

Before Prometheus, we were running [Graphite](https://graphiteapp.org/) and
[OpenTSDB](http://opentsdb.net/). Graphite was used for smaller-scale
applications and OpenTSDB was used for collecting metrics from all of our
physical servers via [Collectd](https://collectd.org/).
[Nagios](https://www.nagios.org/) would pull these databases to trigger alerts.
We do still use Graphite but we no longer run OpenTSDB.

## Why did you decide to look at Prometheus?

I was frustrated with OpenTSDB because I was responsible for keeping the
cluster online, but found it difficult to guard against metric storms.
Sometimes a team would launch a new (very chatty) service that would impact the
total capacity of the cluster and hurt my SLAs. 

We are able to blacklist/whitelist new metrics coming in to OpenTSDB, but
didn’t have a great way to guard against chatty services except for
organizational process (which was hard to change/enforce). Other teams were
frustrated with the query language and the visualization tools available at the
time. I was chatting with Julius Volz about push vs pull metric systems and was
sold in wanting to try Prometheus when I saw that I would really be in control
of my SLA when I get to determine what I’m pulling and how frequently. Plus, I
really really liked the query language.

## How did you transition?

We were gathering metrics via Collectd sending to OpenTSDB. Installing the
[Node Exporter](https://github.com/prometheus/node_exporter) in parallel with
our already running Collectd setup allowed us to start experimenting with
Prometheus. We also created a custom exporter to expose Droplet metrics. Soon,
we had feature parity with our OpenTSDB service and started turning off
Collectd and then turned off the OpenTSDB cluster.

People really liked Prometheus and the visualization tools that came with it.
Suddenly, my small metrics team had a backlog that we couldn’t get to fast
enough to make people happy, and instead of providing and maintaining
Prometheus for people’s services, we looked at creating tooling to make it as
easy as possible for other teams to run their own Prometheus servers and to
also run the common exporters we use at the company.

Some teams have started using Alertmanager, but we still have a concept of
pulling Prometheus from our existing monitoring tools.

## What improvements have you seen since switching?

We’ve improved our insights on hypervisor machines. The data we could get out
of Collectd and Node Exporter is about the same, but it’s much easier for our
team of golang developers to create a new custom exporter that exposes data
specific to the services we run on each hypervisor.

We’re exposing better application metrics. It’s easier to learn and teach how
to create a Prometheus metric that can be aggregated correctly later. With
Graphite it’s easy to create a metric that can’t be aggregated in a certain way
later because the dot-separated-name wasn’t structured right.

Creating alerts is much quicker and simpler than what we had before, plus in a
language that is familiar. This has empowered teams to create better alerting
for the services they know and understand because they can iterate quickly.

## What do you think the future holds for DigitalOcean and Prometheus?

We’re continuing to look at how to make collecting metrics as easy as possible
for teams at DigitalOcean. Right now teams are running their own Prometheus
servers for the things they care about, which allowed us to gain observability
we otherwise wouldn’t have had as quickly. But, not every team should have to
know how to run Prometheus. We’re looking at what we can do to make Prometheus
as automatic as possible so that teams can just concentrate on what queries and
alerts they want on their services and databases.

We also created [Vulcan](https://github.com/digitalocean/vulcan) so that we
have long-term data storage, while retaining the Prometheus Query Language that
we have built tooling around and trained people how to use.
