---
title: "On Ransomware Naming"
created_at: 2021-06-10
kind: article
author_name: Richard "RichiH" Hartmann
---

As per Oscar Wilde, imitation is the sincerest form of flattery.

The names "Prometheus" and "Thanos" have recently been taken up by a ransomware group. There's not much we can do about that except to inform you that this is happening. There's not much you can do either, except following the same security practices as before:

* Only use binaries from the official release pages for [Prometheus](https://github.com/prometheus/prometheus/releases) and [Thanos](https://github.com/thanos-io/thanos/releases), and verify the archives using the checksums provided there.
* Trust docker images from official project controlled repositories:
  * Prometheus: https://quay.io/repository/prometheus/prometheus 
  * Thanos: https://quay.io/repository/thanos/thanos and https://hub.docker.com/r/thanosio/thanos
* Build those from sources
  
We ensure as project maintainers, that no untrusted party has access to any of those sources.

As there's a non-zero chance that the ransomware group chose the names deliberately and thus might come across this blog post: Please stop. With both the ransomware and the naming choice.
