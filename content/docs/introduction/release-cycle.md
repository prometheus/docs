---
title: Long-Term Support
sort_rank: 10
---

# Long Term Support

Prometheus LTS are selected releases of Prometheus that receive bugfixes for an
extended period of time.

Every 6 weeks, a new Prometheus minor release cycle begins. After those 6
weeks, minor releases generally no longer receive bugfixes. If a user is
impacted by a bug in a minor release, they often need to upgrade to the
latest Prometheus release.

Upgrading Prometheus should be straightforward thanks to our [API stability
guarantees][stab]. However,
there is a risk that new features and enhancements could also bring regressions,
requiring another upgrade.

Prometheus LTS only receive bug, security, and documentation fixes, but over a
time window of one year. The build toolchain will also be kept up-to-date. This
allows companies that rely on Prometheus to limit the upgrade risks while still
having a Prometheus server maintained by the community.

## List of LTS releases

<table class="table table-bordered downloads">
    <thead>
        <tr>
            <th>Release</th>
            <th>Date</th>
            <th>End of support</th>
        </tr>
    </thead>
    <tbody>
        <tr class="danger">
            <td>Prometheus 2.37</td><td>2022-07-14</td><td>2023-07-31</td>
        </tr>
        <tr class="success">
            <td>Prometheus 2.45</td><td>2023-06-23</td><td>2024-07-31</td>
        </tr>
        <tr class="success">
            <td>Prometheus 2.53</td><td>2024-07-01</td><td>2025-07-31</td>
        </tr>
    </tbody>
</table>

## Limitations of LTS support

Some features are excluded from LTS support:

- Things listed as unstable in our [API stability guarantees][stab].
- [Experimental features][fflag].
- OpenBSD support.

[stab]:https://prometheus.io/docs/prometheus/latest/stability/
[fflag]:https://prometheus.io/docs/prometheus/latest/feature_flags/
