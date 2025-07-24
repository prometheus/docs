---
title: UTF-8 in Prometheus
---

## Introduction

Versions of Prometheus before 3.0 required that metric and label names adhere to
a strict set of character requirements. With Prometheus 3.0, all UTF-8 strings
are valid names, but there are some manual changes needed for other parts of the
ecosystem to introduce names with any UTF-8 characters.

There may also be circumstances where users want to enforce the legacy character
set, perhaps for compatibility with an older Prometheus or other scraper that
does not yet support UTF-8.

This document guides you through the UTF-8 transition details.

## Go Instrumentation

Currently, metrics created by the official Prometheus [client_golang
library](https://github.com/prometheus/client_golang) accept UTF-8 names by
default.

Previously, documentation recommended that users override the value of
`model.NameValidationScheme` to select legacy validation by default. This
boolean is now deprecated and should always be set to UTF8Validation. Legacy
validation enforcement, if desired, should be done by individual implementations
calling the appropriate validation APIs and is no longer a library feature.

### Instrumenting in other languages

Other client libraries may not yet support UTF-8 and may require special
handling or configuration. Check the documentation for the library you are using.

## Configuring Name Validation during Scraping

By default, Prometheus 3.0 accepts all UTF-8 strings as valid metric and label
names. It is possible to override this behavior for scraped targets and reject
names that do not conform to the legacy character set.

This option can be set in the Prometheus YAML file on a global basis:

```yaml
global:
  metric_name_validation_scheme: legacy
```

or on a per-scrape config basis:

```yaml
scrape_configs:
  - job_name: prometheus
    metric_name_validation_scheme: legacy
```

Scrape config settings override the global setting.

### Scrape Content Negotiation for UTF-8 escaping

At scrape time, the scraping system **must** pass `escaping=allow-utf-8` in the
Accept header in order to be served UTF-8 names. If scrape target does not see
this header, it will automatically convert UTF-8 names to legacy-compatible
using underscore replacement.

Prometheus and compatible scraping systems can also request a specific escaping
method if desired by setting the `escaping` header to a different value.

* `underscores`: The default: convert legacy-invalid characters to underscores.
* `dots`: similar to UnderscoreEscaping, except that dots are converted to
  `_dot_` and pre-existing underscores are converted to `__`. This allows for
  round-tripping of simple metric names that also contain dots.
* `values`: This mode prepends the name with `U__` and replaces all invalid
  characters with the unicode value, surrounded by underscores. Single
  underscores are replaced with double underscores. This mode allows for full
  round-tripping of UTF-8 names with a legacy Prometheus.

Announcing UTF-8 support in content negotiation indicates that Prometheus is
*capable* of receiving UTF-8 characters, but does not require that metric names
contain previously-unsupported characters. Nor does an Accept header announcing
support for UTF-8 require that the metrics producer disable name translation on
their end. The choice of exact name translation strategy is up to the metrics
producer. The requirement is that when Prometheus requests an escaping scheme
other than allow-utf-8, the producer convert the names in the manner requested.

### Remote Write 2.0

Remote Write 2.0 automatically accepts all UTF-8 names in Prometheus 3.0. There
is no way to enforce the legacy character set validation with Remote Write 2.0.

## OTLP Metrics

OTLP receiver in Prometheus 3.0 still normalizes all names to Prometheus format
by default. You can change this in `otlp` section of the Prometheus
configuration as follows:


    otlp:
      # Ingest OTLP data keeping UTF-8 characters in metric/label names.
      translation_strategy: NoUTF8EscapingWithSuffixes


See [OpenTelemetry guide](/docs/guides/opentelemetry) for more details.


## Querying


Querying for metrics with UTF-8 names will require a slightly different syntax
in PromQL.

The classic query syntax will still work for legacy-compatible names:

`my_metric{}`

But UTF-8 names must be quoted **and** moved into the braces:

`{"my.metric"}`

Label names must also be quoted if they contain legacy-incompatible characters:

`{"metric.name", "my.label.name"="bar"}`

The metric name can appear anywhere inside the braces, but style prefers that it
be the first term.
