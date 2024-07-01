---
title: State of Service Discoveries in Prometheus
created_at: 2024-07-01
kind: article
author_name: The Prometheus Team
---

Prometheus has become the de-facto monitoring system in cloud-native environments. We could mention all the features that made this possible, but today we're here to talk about one: **Service Discovery**, also known as SD.

Cloud Native environments are dynamic environments where machines and containers come and go in the blink of an eye. It's just unrealistic for a human to continuously reconfigure its monitoring tool with the new addresses every time those environment changes. Alongside Prometheus' famous pull-based monitoring, several different Service Discovery integrations made Prometheus a flexible and powerful monitoring tool for modern infrastructure.

In Prometheus 2.0, we started with only 13 Service Discoveries. It included major cloud providers, e.g. Azure, EC2 and GCE, famous open source tools, e.g. Kubernetes and Consul, and more generic ones like DNS, File and Static configs. This list certainly grew as time passed, and, at the time of writing this blog post, **Prometheus now supports 29 different SDs**. We now support more cloud providers, like Hetzner and DigitalOcean, more open source tools, e.g. Docker, DockerSwarm and Nomad and we also added more generic purpose SDs like the HTTP SD.

The more Service Discoveries Prometheus supports, the more use cases it unlocks for our community. That's great and we love it, however, we can't ignore a few downsides we've noticed through time:

* Supporting a new service discovery doesn't end when we accept a Pull Request. We need to keep this code working with new changes made on the other side.
* Lack of infrastructure for end-to-end tests has been proven a big blocker when accepting new contributions since we can't guarantee that changes won't break existing behavior.
* Prometheus team members and maintainers can't learn all SDs and provide appropriate community support and/or meaningful and fast reviews in Pull Requests.
* Prometheus binary size is significantly increasing as new SDs are added.

The mentioned downsides are slowly becoming a burden to our team, up to a point where it is becoming an unhealthy and unsustainable situation.

## The Future of Service Discovery in Prometheus

TLDR; We'll remove all Service Discoveries from Prometheus, except File SD, DNS SD, HTTP SD and Static Config in Prometheus 3.0.

BUT WAIT! Yes, we agree it's an aggressive move! We're super happy to re-add all service discoveries again, so please keep reading to understand how we're doing it.

[With the exception of File and Static SD, Service Discovery in general has never been officially announced as stable](https://prometheus.io/docs/prometheus/latest/stability/#:~:text=Service%20discovery%20integrations%2C%20with%20the%20exception%20of%20static_configs%20and%20file_sd_configs). This means that in theory we have the authority to remove SDs when see a need for it without the need for a major version bump, i.e. Prometheus 3.0 is not a requirement for removing SDs. 

**We can't ignore the fact that most SDs have been around for *many years*, and suddenly removing them in a minor version bump would catch a lot of people by surprise!** We agree that such a move would bring more harm than benefits to our community.

Initially, Prometheus 3.0 main goals were:

* [Commitment to OpenTelemetry](https://prometheus.io/blog/2024/03/14/commitment-to-opentelemetry/).
* Stability of Native Histograms.
* Promotion of feature flags that have been battle-tested in many different environments.

With Service Discovery maintainership being brought up several times in the past few months, we decided to also remove all Service Discoveries with Prometheus 3.0, except for File SD, DNS SD, HTTP SD and Static Config.

As already mentioned, we're happy to re-add all of them, but we'll want to establish some pre-requisites before doing so.

## I want to contribute a Service Discovery for Prometheus, how can I do it?

Well, it depends.

All we want is to make sure the downsides mentioned above don't happen again, or at least that they are mitigated to a sustainable level. Yes, we want proper maintainership, yes we want tests, and yes we want community support, but it sounds unfair to treat a cloud provider with billions of dollars in revenue the same way as we treat a community-driven open source project.

Fundamentally, we accept 3 kinds of Service Discovery: Cloud Provider, Open Source tool and general purpose. New general-purpose service discoveries don't appear that often, 3 of them were already there with 2.0 and we've only added HTTP SD since then. Open Source tools and Cloud providers are the most problematic ones, so we've come up with the following prerequisites for them

### Cloud Providers

Before we accept a contribution adding a Cloud Provider Service Discovery, we require:

* Two individuals to officially become the related SD's maintainer. Their responsibilities are: reviewing PRs related to their SD and participating in discussions related to their SD. Ideally, such individuals work for the Cloud Provider in a role related to Prometheus or Open Source departments. We ask for 2 maintainers to avoid single points of failure.
* Sponsorship with infrastructure for end-to-end tests. We agree that service discovery tests don't need to run on every single PR, especially because it's super rare that a single PR touches all SDs, which means that cadence and how those tests will run is up to the new maintainers. 

### Open Source tools

* We require an individual to officially become the related SD's maintainer. Its responsibilities are: reviewing PRs related to their SD, and participating in discussions related to their SD. If the open-source tool is owned by a company, it would be nice if the maintainer works for that company, but it's not a hard requirement.
* We require tests! The new maintainer and the team can discuss what kind of tests would make us confident when accepting the new service discovery.

## My tool/cloud provider can't meet the requirements, what should I do?

// TODO: Talk about using HTTP SD for custom service discoveries.

## Can I avoid having my beloved SD removed in 3.0?

Yes! Starting today we're open to discussion about the requirements above! Prometheus 3.0 first release candidate is scheduled for [PromCon](https://promcon.io/2024-berlin/), happening on September 11-12. The stable release is scheduled for [KubeCon NA](https://events.linuxfoundation.org/kubecon-cloudnativecon-north-america/), happening on November 12-15. We're happy to discuss the requirements with stakeholders and, if they are met, we're happy to not remove them with Prometheus 3.0.

For interested folks, please send an email to [prometheus-team@googlegroups.com](mailto:prometheus-team@googlegroups.com) with the information:

* What service discovery do you want to add?
* What's your affiliation with the tool/cloud provider?
* Email of possible maintainers (please copy them in the email).
* Your planned strategy to ensure maintainability and support for the next years.