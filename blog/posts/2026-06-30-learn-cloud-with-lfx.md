---
title: "Learning Cloud-Native Engineering Beyond Tutorials Through LFX"
created_at: 2026-06-30
kind: article
author_name: "Uzochukwu Winnie (@wineshuga)"
---

I joined the LFX mentorship expecting to spend three months writing documentation. A few weeks later, I was deploying OpenTelemetry Collectors across AWS EC2 instances, debugging networking problems between machines, and trying to understand why a pipeline that looked healthy wasn't sending metrics.

I went from having zero knowledge about observability to building and troubleshooting systems. This made the LFX Mentorship one of the most effective and exciting learning experiences I've had in engineering. I was exposed to how systems behave in reality. That difference is what makes it one of the most effective ways to grow into cloud-native engineering.

<!-- more -->

## No expertise needed

A few months before joining the LFX mentorship, I was a Frontend Developer exploring backend engineering. My first encounter with observability was curiosity leading me to articles about traces and metrics. For years, I looked forward to contributing and joining an active Open Source community. So when I came across this mentorship with Prometheus on improving the documentation for Prometheus and OpenTelemetry Interoperability, I thought this was a perfect opportunity to contribute.

I expected my contributions to focus solely on improving or creating documentation for both tools. Documentation was part of the experience. I contributed to OpenTelemetry documentation, and my [pull requests](https://github.com/open-telemetry/opentelemetry.io/pull/9570) were merged. That gave me direct exposure to how large CNCF projects review, refine, and maintain technical documentation at scale, but that was only the surface. Before long, my work had expanded beyond documentation. To properly document real systems, I first had to understand them. This led me to deploy and troubleshoot the systems I was writing about.

## The system deployed

The deployment I made during the mentorship looked like this:

- Django applications running on multiple EC2 instances.
- OpenTelemetry Collectors deployed alongside each application.
- A dedicated EC2 instance running Prometheus as a metrics backend.
- Metrics exported in Prometheus format from all instances into Prometheus.
Every component introduced another opportunity for failure. Most failures were silent: missing metrics, broken pipelines, or unreachable services that still appeared “healthy.” 

## The big challenge 

The hardest debugging experiences were not tied to a single tool like OpenTelemetry or Prometheus. They came from interactions between components.
Problems ranged from:
- EC2 instances unable to communicate due to networking constraints.
- Collectors running but not exporting data.
- Pipelines silently dropping telemetry.
- Local setups behaving correctly, while AWS deployments failed
At some point, debugging stopped being about individual services and became about understanding system behavior. I wrote about one of those debugging experiences in more detail [[here]](https://uzochukwuwinnie.com/articles/lfx-mentorship-4-setting-up-multi-vm-observability-infrastructure-on-aws-with-terraform). At this point, I knew I wasn’t going back to be a Frontend Engineer.

## Learning without a playbook 

A defining aspect of the LFX Mentorship model is autonomy. Mentors provide direction and feedback, but they do not solve problems for you. In my case, feedback and guidance from Tiffany Hrabusa, Arthur Sens, and Victoria Nduka were just as valuable as the technical work because they shared the reasoning behind engineering decisions, not just the decisions themselves. Understanding why a solution was preferred often mattered more than the solution itself.

At first, the lack of detailed guidance felt uncomfortable and scary. Over time, I came to appreciate how much it contributed to my technical growth and confidence.

My mentors and I would discuss problems and explore different approaches to achieve our goal. We worked as a team, and that gave me the space to grow while still taking ownership of my work. During the development of the blueprint, for example, one of my mentors generously gave me access to a platform where I could test an idea we had. While it allowed me to validate the approach, it also came with a major limitation: I couldn't automate deployment, and the environment had a time limit. During our next meeting, we discussed this challenge together and came up with an alternative approach that ultimately proved successful.

This kind of guidance is all I could ever wish for. I was challenged to think independently while being reassured that I wasn't solving problems alone.

## What changed through this experience

By the end of the mentorship, the most important shift was not tool-specific knowledge. It was how systems are perceived. Looking back, that change was far more valuable than learning any single technology because it fundamentally changed how I approach engineering problems. It made the experience far more impactful than I had expected when I first joined the program. I also gained a more realistic understanding of observability itself as pipelines that must be designed to survive failure.

## Outcomes

Beyond learning, the mentorship produced tangible outcomes.

The improvements I made to the OpenTelemetry documentation were merged. I also completed documentation on [Prometheus and OpenTelemetry interoperability using the Prometheus metrics format](https://github.com/open-telemetry/opentelemetry.io/issues/9650), and developed a [blueprint proposal](https://github.com/open-telemetry/sig-end-user/issues/339) for deploying observability systems in non-Kubernetes environments.

Another outcome is that I now understand how open source communities organize themselves. If I wanted to join a Prometheus Working Group or an OpenTelemetry SIG, I know how to get involved and contribute effectively.

Perhaps the most valuable outcome is the network I’m beginning to build. Through this mentorship, I’ve started forming relationships with experienced engineers, and I’ve come to realize that building genuine connections is one of the best ways to grow in this industry.

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

If you're looking to grow beyond tutorials and learn in a real engineering environment, I highly recommend applying for the [LFX Mentorship Program](https://docs.linuxfoundation.org/lfx/mentorship/mentee-guide/introduction). You can also check out the [other mentorship programs supported by CNCF](https://github.com/cncf/mentoring/tree/main/programs).

If you're working in cloud-native systems or exploring similar challenges, I'm always happy to connect on LinkedIn: [[link]](https://linkedin.com/in/uzochukwu-winnie).
