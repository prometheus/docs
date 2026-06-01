---
title: Labels
sort_rank: 2
---

The label conventions presented in this document are not required
for using Prometheus, but can serve as both a style-guide and a collection of
best practices. Individual organizations may want to approach some of these
practices, e.g. naming conventions, differently.

## Labels

Prometheus labels can come from both the target itself and from
[relabeling in discovery](https://prometheus.io/docs/prometheus/latest/configuration/configuration/#scrape_config).

By default Prometheus configures two primary discovery target labels.

- `job`
  - The `job` label is a default target label set by the scrape configs and is used
    to identify metrics scraped by the same scrape config.
  - Stripping the `job` label is a valid action in certain, explicit aggregation use
    cases (e.g metrics across multiple `job` values, etc)
  - If not specified in PromQL expressions, they will match unrelated metrics
    with the same name. This is especially true in a multi system or multi tenant
    installation.

- `instance`
  - The `instance` label will include the `ip:port` what was scraped, identifying
    the target instance.

WARNING: Stripping the `instance` label will not impact PromQL expressions from being evaluated, but it will make it challenging to debug metric scrape issues.

 
WARNING: When using `without`, be careful not to strip out the `job` or `instance` labels unintentionally.

### General Labelling Advice

Use labels to differentiate the characteristics of the thing that is being measured:

- `api_http_requests_total` - differentiate request types: `operation="create|update|delete"`
- `api_request_duration_seconds` - differentiate request stages: `stage="extract|transform|load"`

Do not put the label names in the metric name, as this introduces redundancy
and will cause confusion if the respective labels are aggregated away.

CAUTION: Remember that every unique combination of key-value label
pairs represents a new time series, which can dramatically increase the amount
of data stored. Do not use labels to store dimensions with high cardinality
(many different label values), such as user IDs, email addresses, or other
unbounded sets of values.
