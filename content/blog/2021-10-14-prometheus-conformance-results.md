---
title: "Prometheus Conformance Program: First round of results"
created_at: 2021-10-14
kind: article
author_name: Richard "RichiH" Hartmann
---

Today, we're launching the [Prometheus Conformance Program](/blog/2021/05/03/introducing-prometheus-conformance-program/) with the goal of ensuring interoperability between different projects and vendors in the Prometheus monitoring space. While the legal paperwork still needs to be finalized, we ran tests, and we consider the below our first round of results. As part of this launch [Julius Volz updated his PromQL test results](https://promlabs.com/blog/2021/10/14/promql-vendor-compatibility-round-three).

As a quick reminder: The program is called Prometheus **Conformance**, software can be **compliant** to specific tests, which result in a **compatibility** rating. The nomenclature might seem complex, but it allows us to speak about this topic without using endless word snakes.

# Preamble

## New Categories

We found that it's quite hard to reason about what needs to be applied to what software. To help sort my thoughts, we created [an overview](https://docs.google.com/document/d/1VGMme9RgpclqF4CF2woNmgFqq0J7nqHn-l72uNmAxhA), introducing four new categories we can put software into:

* Metrics Exposers
* Agents/Collectors
* Prometheus Storage Backends
* Full Prometheus Compatibility

## Call for Action

Feedback is very much welcome. Maybe counter-intuitively, we want the community, not just Prometheus-team, to shape this effort. To help with that, we will launch a WG Conformance within Prometheus. As with [WG Docs](https://docs.google.com/document/d/1k7_Ya7j5HrIgxXghTCj-26CuwPyGdAbHS0uQf0Ir2tw) and [WG Storage](https://docs.google.com/document/d/1HWL-NIfog3_pFxUny0kAHeoxd0grnqhCBcHVPZN4y3Y), those will be public and we actively invite participation.

As we [alluded to recently](https://www.youtube.com/watch?v=CBDZKjgRiew), the maintainer/adoption ratio of Prometheus is surprisingly, or shockingly, low. In different words, we hope that the economic incentives around Prometheus Compatibility will entice vendors to assign resources in building out the tests with us. If you always wanted to contribute to Prometheus during work time, this might be the way; and a way that will have you touch a lot of highly relevant aspects of Prometheus. There's a variety of ways to [get in touch](https://prometheus.io/community/) with us.

## Register for being tested

You can use the [same communication channels](https://prometheus.io/community/) to get in touch with us if you want to register for being tested. Once the paperwork is in place, we will hand contact information and contract operations over to CNCF.

# Test results

## Full Prometheus Compatibility

We know what tests we want to build out, but we are not there yet. As announced previously, it would be unfair to hold this against projects or vendors. As such, test shims are defined as being passed. The currently semi-manual nature of e.g. the [PromQL tests Julius ran this week](https://promlabs.com/blog/2021/10/14/promql-vendor-compatibility-round-three) mean that Julius tested sending data through Prometheus Remote Write in most cases as part of PromQL testing. We're reusing his results in more than one way here. This will be untangled soon, and more tests from different angles will keep ratcheting up the requirements and thus End User confidence.

It makes sense to look at projects and aaS offerings in two sets.

### Projects

#### Passing

* Cortex 1.10.0
* M3 1.3.0
* Promscale 0.6.2
* Thanos 0.23.1

#### Not passing

VictoriaMetrics 1.67.0 is not passing and [does not intend to pass](https://promlabs.com/blog/2021/10/14/promql-vendor-compatibility-round-three#victoriametrics). In the spirit of End User confidence, we decided to track their results while they position themselves as a drop-in replacement for Prometheus.

### aaS

#### Passing

* Chronosphere
* Grafana Cloud

#### Not passing

* Amazon Managed Service for Prometheus
* Google Cloud Managed Service for Prometheus
* New Relic
* Sysdig Monitor

NB: As Amazon Managed Service for Prometheus is based on Cortex just like Grafana Cloud, we expect them to pass after the next update cycle.

## Agent/Collector

### Passing

* Grafana Agent 0.19.0
* OpenTelemetry Collector 0.37.0
* Prometheus 2.30.3

### Not passing

* Telegraf 1.20.2
* Timber Vector 0.16.1
* VictoriaMetrics Agent 1.67.0

NB: We tested Vector 0.16.1 instead of 0.17.0 because there are no binary downloads for 0.17.0 and our test toolchain currently expects binaries.
