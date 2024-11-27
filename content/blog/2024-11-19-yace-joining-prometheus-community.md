---
title: YACE is joining Prometheus Community
created_at: 2024-11-19
kind: article
author_name: Thomas Peitz (@thomaspeitz)
---

[Yet Another Cloudwatch Exporter](https://github.com/prometheus-community/yet-another-cloudwatch-exporter) (YACE) has officially joined the Prometheus community! This move will make it more accessible to users and open new opportunities for contributors to enhance and maintain the project. There's also a blog post from [Cristian Greco's point of view](https://grafana.com/blog/2024/11/19/yace-moves-to-prometheus-community/).

## The early days

When I first started YACE, I had no idea it would grow to this scale. At the time, I was working with [Invision AG](https://www.ivx.com) (not to be confused with the design app), a company focused on workforce management software. They fully supported me in open-sourcing the tool, and with the help of my teammate [Kai Forsthövel](https://github.com/kforsthoevel), YACE was brought to life.

Our first commit was back in 2018, with one of our primary goals being to make CloudWatch metrics easy to scale and automatically detect what to measure, all while keeping the user experience simple and intuitive. InVision AG was scaling their infrastructure up and down due to machine learning workloads and we needed something that detects new infrastructure easily. This focus on simplicity has remained a core priority. From that point on, YACE began to find its audience.

## Yace Gains Momentum

As YACE expanded, so did the support around it. One pivotal moment was when [Cristian Greco](https://github.com/cristiangreco) from Grafana Labs reached out. I was feeling overwhelmed and hardly keeping up when Cristian stepped in, simply asking where he could help. He quickly became the main releaser and led Grafana Labs' contributions to YACE, a turning point that made a huge impact on the project. Along with an incredible community of contributors from all over the world, they elevated YACE beyond what I could have achieved alone, shaping it into a truly global tool. YACE is no longer just my project or Invision's—it belongs to the community.


## Gratitude and Future Vision

I am immensely grateful to every developer, tester, and user who has contributed to YACE's success. This journey has shown me the power of community and open source collaboration. But we're not done yet.

It's time to take Yace even further—into the heart of the Prometheus ecosystem. Making Yace as the official Amazon CloudWatch exporter for Prometheus will make it easier and more accessible for everyone. With ongoing support from Grafana Labs and my commitment to refining the user experience, we'll ensure YACE becomes an intuitive tool that anyone can use effortlessly.

## Try out YACE on your own

Try out **[YACE (Yet Another CloudWatch Exporter)](https://github.com/prometheus-community/yet-another-cloudwatch-exporter)** by following our step-by-step [Installation Guide](https://github.com/prometheus-community/yet-another-cloudwatch-exporter/blob/master/docs/installation.md).

You can explore various configuration examples [here](https://github.com/prometheus-community/yet-another-cloudwatch-exporter/tree/master/examples) to get started with monitoring specific AWS services.

Our goal is to enable easy auto-discovery across all AWS services, making it simple to monitor any dynamic infrastructure.
