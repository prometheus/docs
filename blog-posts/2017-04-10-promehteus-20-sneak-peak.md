---
title: Sneak Peak of Prometheus 2.0
created_at: 2017-04-10
kind: article
author_name: Fabian Reinartz
---

In July 2016 Prometheus reached a big milestone with its 1.0 release. Since then, plenty of new features like new service discovery integrations and our experimental remote APIs have been added.
We also realized that new developments in the infrastructure space, in particular [Kubernetes](https://kubernetes.io), allowed monitored environments to become significantly more dynamic. Unsurprisingly, this also brings new challenges to Prometheus and we identified performance bottlenecks in its storage layer.

Over the past few months we have been designing and implementing a new storage concept that addresses those bottlenecks and shows considerable performance improvements overall. It also paves the way to add features such as hot backups.

The changes are so fundamental that it will trigger a new major release: Prometheus 2.0.
Important features and changes beyond the storage are planned before its stable release. However, today we are releasing an early alpha of Prometheus 2.0 to kick off the stabilization process of the new storage.

<!-- more -->

[Release tarballs](https://github.com/prometheus/prometheus/releases/tag/v2.0.0-alpha.0) and [Docker containers](https://quay.io/repository/prometheus/prometheus?tab=tags) are now available.
If you are interested in the new mechanics of the storage, make sure to read [the deep-dive blog post](https://fabxc.org/blog/2017-04-10-writing-a-tsdb/) looking under the hood.

This version does not work with old storage data and should not replace existing production deployments. To run it, the data directory must be empty and all existing storage flags except for `-storage.local.retention` have to be removed.

For example; before:

```
./prometheus -storage.local.retention=200h -storage.local.memory-chunks=1000000 -storage.local.max-chunks-to-persist=500000 -storage.local.chunk-encoding=2 -config.file=/etc/prometheus.yaml
```

after:

```
./prometheus -storage.local.retention=200h -config.file=/etc/prometheus.yaml
```

This is a very early version and crashes, data corruption, and bugs in general should be expected. Help us move towards a stable release by submitting them to [our issue tracker](https://github.com/prometheus/prometheus/issues).

The experimental remote storage APIs are disabled in this alpha release. Scraping targets exposing timestamps, such as federated Prometheus servers, does not yet work. The storage format is breaking and will break again between subsequent alpha releases. We plan to document an upgrade path from 1.0 to 2.0 once we are approaching a stable release.
