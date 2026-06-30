---
title: "Learning Cloud-Native Engineering Beyond Tutorials Through LFX"
created_at: 2026-06-30
kind: article
author_name: "Uzochukwu Winnie (@wineshuga)"
---

I joined the Prometheus mentorship expecting to spend three months writing documentation. A few weeks later, I was deploying OpenTelemetry Collectors across EC2 instances, debugging networking problems between machines, and trying to understand why a pipeline that looked healthy wasn't sending a single metric.

That shift from documenting systems to building and troubleshooting them made the LFX Mentorship one of the most effective and exciting learning experiences I've had in cloud-native engineering.

Most people don’t struggle to learn cloud-native tools because they're inaccessible. They struggle because tutorials stop at the easiest possible version of reality.

The LFX Mentorship exposes systems as they behave in reality, not as they are presented in tutorials.  That difference is what makes it one of the most effective ways to grow into cloud-native engineering.

<!-- more -->

## The work changed quickly

I worked with Prometheus on improving the Documentation for Prometheus and OpenTelemetry Interoperability. I assumed my contributions would be solely to improve or create documentation for both tools.
Documentation was part of the experience. I contributed to OpenTelemetry documentation, and my [pull requests](https://github.com/open-telemetry/opentelemetry.io/pull/9570) were merged. That gave me direct exposure to how large CNCF projects review, refine, and maintain technical documentation at scale.

But that was only the surface. Before long, my work had expanded beyond documentation into deploying and troubleshooting the systems I was writing about.

In addition to writing about OpenTelemetry and Prometheus, I was deploying them across AWS infrastructure and learning how they behave under real network and deployment constraints. These were things I’d never done before, and it was wonderful to be involved in this way.

This is different from how cloud-native systems are usually learned. Most learning environments are designed to eliminate failure. And this leads to junior developers facing unexpected challenges in production.

## Why tutorials fail at this level

Local environments and guided tutorials often hide the hardest parts of distributed systems:
assuming every service can reach every other service
- debugging communication across multiple machines
- configuration drift caused by manual changes
- partial failures where some components work, and others don't
- infrastructure inconsistencies between environments

The deployment I made during the mentorship looked like this: 

- Django applications running on multiple EC2 instances
- OpenTelemetry Collectors deployed alongside each application
- A dedicated EC2 instance running Prometheus as a metrics backend
- Metrics exported in Prometheus format from all instances into Prometheus

Every component introduced another opportunity for failure. Most failures were silent: missing metrics, broken pipelines, or unreachable services that still appeared “healthy.” That is not something tutorials prepare you for. This is what a mentorship like LFX exposes you to.

## Where the system actually broke 

The hardest debugging experiences were not tied to a single tool like OpenTelemetry or Prometheus. They came from interactions between components.

Problems ranged from:
- EC2 instances unable to communicate due to networking constraints.
- Collectors running but not exporting data.
- Pipelines silently dropping telemetry.
- Local setups behaving correctly, while AWS deployments failed
At some point, debugging stopped being about individual services and became about understanding system behavior. I wrote about one of those debugging experiences in more detail [[here]](https://uzochukwuwinnie.com/articles/lfx-mentorship-4-setting-up-multi-vm-observability-infrastructure-on-aws-with-terraform). That shift, I believe, is the point where someone stops being a tool user and starts becoming a systems engineer.

## Learning without a playbook 

A defining aspect of the LFX Mentorship model is autonomy. Mentors provide direction and feedback, but they do not solve problems for you. In my case, feedback and guidance from Tiffany Hrabusa, Arthur Sens, and Victoria Nduka were just as valuable as the technical work because they shared the reasoning behind engineering decisions, not just the decisions themselves. Understanding why a solution was preferred often mattered more than the solution itself. 

At first, the lack of detailed guidance felt uncomfortable and scary. Over time, I found it beneficial for my skill and knowledge growth.

Instead of learning how to follow instructions, I learned how to:
- break down unclear problems
- make architectural decisions
- debug across system boundaries
- validate assumptions in real environments
This structure is what makes the learning curve steep but also real.

## What changed through this experience
By the end of the mentorship, the most important shift was not tool-specific knowledge. It was how systems are perceived. Looking back, that change was far more valuable than learning any single technology because it fundamentally changed how I approach engineering problems. It made the experience far more impactful than I had expected when I first joined the program. I also gained a more realistic understanding of observability itself as pipelines that must be designed to survive failure.

## Outcomes
Beyond learning, the work produced tangible contributions:
- Documentation improvements to OpenTelemetry were merged
- Work was completed, [clarifying Prometheus and OpenTelemetry interoperability](https://github.com/open-telemetry/opentelemetry.io/issues/9650) using the Prometheus metrics format
- A [blueprint proposal](https://github.com/open-telemetry/sig-end-user/issues/339) was developed for deploying observability systems in non-Kubernetes environments

The last point is particularly important because while Kubernetes dominates much of the cloud-native conversation, many teams still operate workloads on virtual machines. Expanding documentation for these environments helps make observability practices accessible beyond Kubernetes-first deployments.

## Why programs like LFX matter
The value of structured open-source mentorship is not just exposure to tools. It is exposure to reality.
Specifically, it provides:
- production-style environments instead of controlled labs
- real system failures instead of isolated examples
- architectural thinking instead of tool usage
- autonomy instead of guided execution
This combination is difficult to replicate through self-learning alone. Most importantly, it forces engineers to deal with the parts of systems that are usually abstracted away in early learning stages.

## Final thoughts
The LFX Mentorship gave me more than exposure to cloud-native tools. It changed how I think about building, debugging, and operating distributed systems. Contributing to open source, learning from experienced maintainers and mentors, and working through real production-style challenges made it one of the most valuable learning experiences in my career.

If you're looking to grow beyond tutorials and learn in a real engineering environment, I highly recommend applying for a mentorship like this one.

If you're working in cloud-native systems or exploring similar challenges, I'm always happy to connect on LinkedIn: [[link]](https://linkedin.com/in/uzochukwu-winnie).
