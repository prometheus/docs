---
title: Introducing the Prometheus Conformance Program
created_at: 2021-05-03
kind: article
author_name: Richard "RichiH" Hartmann
---

Prometheus is the standard for metric monitoring in the cloud native space and beyond. To ensure interoperability, to protect users from suprises, and to enable more parallel innovation, the Prometheus project is introducing the [Prometheus Conformance Program](https://github.com/cncf/prometheus-conformance) with the help of [CNCF](https://www.cncf.io/) to certify component compliance and Prometheus compatibility.

The CNCF Governing Board is expected to formally review and approve the program during their next meeting. We invite the wider community to help improve our tests in this ramp-up phase.

With the help of our [extensive and expanding test suite](https://github.com/prometheus/compliance), projects and vendors can determine the compliance to our specifications and compatibility within the Prometheus ecosystem.

<!-- more -->

At launch, we are offering compliance tests for three components:

* PromQL (needs manual interpretation, somewhat complete)
* Remote Read-Write (fully automated, WIP)
* OpenMetrics (partially automatic, somewhat complete, will need questionnaire)

We plan to add more components. Tests for Prometheus Remote Read or our data storage/TSDB are likely as next additions. We explicitly invite everyone to extend and improve existing tests, and to submit new ones.

The Prometheus Conformance Program works as follows:

For every component, there will be a mark "foo YYYY-MM compliant", e.g. "OpenMetrics 2021-05 compliant", "PromQL 2021-05 compliant", and "Prometheus Remote Write 2021-05 compliant". Any project or vendor can submit their compliance documentation. Upon reaching 100%, the mark will be granted.

For any complete software, there will be a mark "Prometheus x.y compatible", e.g. "Prometheus 2.26 compatible". Relevant component compliance scores are multiplied. Upon reaching 100%, the mark will be granted.

As an example, the Prometheus Agent supports both OpenMetrics and Prometheus Remote Write, but not PromQL. As such, only compliance scores for OpenMetrics and Prometheus Remote Write are multiplied.

Both compliant and compatible marks are valid for 2 minor releases or 12 weeks, whichever is longer.
