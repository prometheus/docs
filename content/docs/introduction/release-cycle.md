---
title: Long-Term Support
sort_rank: 10
---

# Long Term Support

Prometheus LTS are selected releases of Prometheus which gets bugfixes for an
extended period of time.

Every 6 weeks, a new Prometheus minor release cycle is started. Past those 6
weeks, minor releases generally don't receive bugfixes anymore. If a user is
impacted by a bug in a minor release, very often they need to upgrade to the
latest Prometheus release.

Upgrading Prometheus should be straightforward thanks to our [API stability
guarantees][stab]. However,
there is a risk that new features and enhancements also bring regressions,
requiring to upgrade again.

Prometheus LTS only gets bug, security, and documentation fixes. The build
toolchain will also be kept up-to-date. This enables companies relying on
Prometheus to limit the risks of upgrades while having a Prometheus server still
maintained by the community.

The first Prometheus LTS release will be Prometheus v2.37. This version will be
released in July 2022 and will be supported until January 31 2023.

![A picture showing the LTS release cycle.](/static/lts-cycle.png)

## Limitations of LTS support

Some features are excluded from LTS support:

- Things listed as unstable in our [API stability guarantees][stab].
- [Experimental features][fflag].
- OpenBSD support.

[stab]:https://prometheus.io/docs/prometheus/latest/stability/>
[fflag]:https://prometheus.io/docs/prometheus/latest/feature_flags/
