---
title: Introducing Feature Flags
created_at: 2021-02-17
kind: article
author_name: Ganesh Vernekar
---

We have always made hard promises around stability and breaking changes following the SemVer model. That will remain to be the case.

As we want to be bolder in experimentation, we are planning to use feature flags more.

Starting with v2.25.0, we have introduced a new section called [disabled features](https://prometheus.io/docs/prometheus/latest/disabled_features/) which have the features hidden behind the `--enable-feature` flag. You can expect more and more features getting added to this section in the future releases.

The features in this list are considered experimental and comes with following considerations as long as they are still behind `--enable-feature`:

1. API specs may change if the feature has any API (web API, code interfaces, etc.).
2. The behavior of the feature may change.
3. They may break some assumption that you might have had about Prometheus.
    * For example the assumption that a query does not look ahead of the evaluation time for samples, which will be broken by `@` modifier and negative offset.
4. They may be unstable but we will try to keep them stable, of course.

<!-- more -->

These considerations allow us to be more bold with experimentation and to innovate more quickly. Once any feature gets widely used and is considered stable with respect to its API, behavior, and implementation, they may be moved from disabled features list and enabled by default . If we find any feature to be not worth it or broken, we may completely remove it. If enabling some feature is considered a big breaking change for Prometheus, it would stay disabled until the next major release.

Keep an eye out on this list on every release, and do try them out!
