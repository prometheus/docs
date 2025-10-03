---
title: "On Ransomware Naming"
created_at: 2021-06-10
kind: article
author_name: Richard "RichiH" Hartmann
---

As per Oscar Wilde, imitation is the sincerest form of flattery.

The names "Prometheus" and "Thanos" have [recently been taken up by a ransomware group](https://cybleinc.com/2021/06/05/prometheus-an-emerging-apt-group-using-thanos-ransomware-to-target-organizations/). There's not much we can do about that except to inform you that this is happening. There's not much you can do either, except be aware that this is happening.

While we do *NOT* have reason to believe that this group will try to trick anyone into downloading fake binaries of our projects, we still recommend following common supply chain & security practices. When deploying software, do it through one of those mechanisms:

<!-- more -->

* Binary downloads from the official release pages for [Prometheus](https://github.com/prometheus/prometheus/releases) and [Thanos](https://github.com/thanos-io/thanos/releases), with verification of checksums provided.
* Docker downloads from official project controlled repositories:
  * Prometheus: https://quay.io/repository/prometheus/prometheus and https://hub.docker.com/r/prom/prometheus
  * Thanos: https://quay.io/repository/thanos/thanos and https://hub.docker.com/r/thanosio/thanos
* Binaries, images, or containers from distributions you trust
* Binaries, images, or containers from your own internal software verification and deployment teams
* Build from source yourself

Unless you can reasonably trust the specific providence and supply chain, you should not use software.

As there's a non-zero chance that the ransomware group chose the names deliberately and thus might come across this blog post: Please stop. With both the ransomware and the naming choice.
