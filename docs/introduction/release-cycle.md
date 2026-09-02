---
title: Long-term support
sort_rank: 10
---

Prometheus LTS are selected releases of Prometheus that receive selected bug
fixes for an extended period of one year.

Every 6 weeks, a new Prometheus minor release cycle begins. After those 6
weeks, minor releases generally no longer receive bug fixes. If a user is
impacted by a bug in a minor release, they often need to upgrade to the
latest Prometheus release.

Upgrading Prometheus should be straightforward thanks to our [API stability
guarantees][stab]. However,
there is a risk that new features and enhancements could also bring regressions,
requiring another upgrade.

Prometheus LTS version will only receive fixes for selected issues with high
severity, i.e. a CVSS rating of 7.0 or higher. Additional changes for bug fixes
or documentation fixes might be added. The build toolchain will also be kept
up-to-date. This is **a best effort commitment by the community**, contributions are
welcome.
Support periods of two subsequent LTS version should overlap by at least one
month.
This allows users that rely on Prometheus to limit the upgrade risks while still
having a Prometheus server maintained by the community.

## List of LTS releases

| Release             | Date           | End of support | Status        |
| ------------------- | -------------- | -------------- | ------------- |
| Prometheus 2.37     | 2022-07-14     | 2023-07-31     | End of life   |
| Prometheus 2.45     | 2023-06-23     | 2024-07-31     | End of life   |
| Prometheus 2.53     | 2024-06-16     | 2025-07-31     | End of life   |
| Prometheus 3.5      | 2025-07-14     | 2026-07-31     | End of life   |
| **Prometheus 3.13** | **2026-07-01** | **2027-07-31** | **Supported** |
| TBD                 | 2027-06        | 2028-07-31     | Upcoming      |

## Limitations of LTS support

Some features are excluded from LTS support:

- Unstable features as listed in our [API stability guarantees][stab].
- [Experimental features][fflag].
- OpenBSD support.

[stab]:https://prometheus.io/docs/prometheus/latest/stability/
[fflag]:https://prometheus.io/docs/prometheus/latest/feature_flags/
