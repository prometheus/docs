---
title: Exporters
sort_rank: 6
nav_icon: package
---

Exporters expose metrics from systems that cannot be instrumented directly with
Prometheus client libraries. The exporter documentation in this section is
maintained in each exporter's own repository and pulled into this website from
the latest stable release.

The broader catalog of available exporters and integrations is listed in
[Exporters and integrations](/docs/instrumenting/exporters/).

## Documented exporters

* [PostgreSQL exporter](/docs/exporters/postgres/) (coming from
  [prometheus-community/postgres_exporter](https://github.com/prometheus-community/postgres_exporter))

## Adding exporter documentation

Exporter maintainers can add website documentation by adding a `docs/` directory
to the exporter repository and following the
[exporter documentation contract](/docs/exporters/documenting-exporters/).
