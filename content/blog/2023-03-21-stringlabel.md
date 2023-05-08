---
title: FAQ about Prometheus 2.43 String Labels Optimization
created_at: 2023-03-21
kind: article
author_name: Julien Pivotto (@roidelapluie)
---

Prometheus 2.43 has just been released, and it brings some exciting features and
enhancements. One of the significant improvements is the `stringlabels` release,
which uses a new data structure for labels. This blog post will answer some
frequently asked questions about the 2.43 release and the `stringlabels`
optimizations.

### What is the `stringlabels` release?

The `stringlabels` release is a Prometheus 2.43 version that uses a new data
structure for labels. It stores all the label/values in a single string,
resulting in a smaller heap size and some speedups in most cases. These
optimizations are not shipped in the default binaries and require compiling
Prometheus using the Go tag `stringlabels`.

### Why didn't you go for a feature flag that we can toggle?

We considered using a feature flag but it would have a memory overhead that was
not worth it. Therefore, we decided to provide a separate release with these
optimizations for those who are interested in testing and measuring the gains on
their production environment.

### When will these optimizations be generally available?

These optimizations will be available in the upcoming Prometheus 2.44 release
by default.

### How do I get the 2.43 release?

The [Prometheus 2.43 release](https://github.com/prometheus/prometheus/releases/tag/v2.43.0) is available on the official Prometheus GitHub
releases page, and users can download the binary files directly from there.
Additionally, Docker images are also available for those who prefer to use
containers.

The stringlabels optimization is not included in these default binaries. To use
this optimization, users will need to download the [2.43.0+stringlabels
release](https://github.com/prometheus/prometheus/releases/tag/v2.43.0%2Bstringlabels)
binary or the [Docker images tagged
v2.43.0-stringlabels](https://quay.io/repository/prometheus/prometheus?tab=tags) specifically.

### Why is the release `v2.43.0+stringlabels` and the Docker tag `v2.43.0-stringlabels`?

In semantic versioning, the plus sign (+) is used to denote build
metadata. Therefore, the Prometheus 2.43 release with the `stringlabels`
optimization is named `2.43.0+stringlabels` to signify that it includes the
experimental `stringlabels` feature. However, Docker tags do not allow the use of
the plus sign in their names. Hence, the plus sign has been replaced with a dash
(-) to make the Docker tag `v2.43.0-stringlabels`. This allows the Docker tag to
pass the semantic versioning checks of downstream projects such as the
Prometheus Operator.

### What are the other noticeable features in the Prometheus 2.43 release?

Apart from the `stringlabels` optimizations, the Prometheus 2.43 release
brings several new features and enhancements. Some of the significant additions
include:

* We added support for `scrape_config_files` to include scrape configs from
  different files. This makes it easier to manage and organize the configuration.
* The HTTP clients now includes two new config options: `no_proxy` to exclude
  URLs from proxied requests and `proxy_from_environment` to read proxies from
  env variables. These features make it easier to manage the HTTP client's
  behavior in different environments.

You can learn more about features and bugfixes in the
[full changelog](https://github.com/prometheus/prometheus/releases/tag/v2.43.0).
