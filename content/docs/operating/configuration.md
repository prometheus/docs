---
title: Configuration
nav_icon: sliders
---

# Configuration

Prometheus is configured via command-line flags and a configuration file. While
the command-line flags configure general system parameters (such as storage
locations, amount of data to keep on disk and in memory, etc.), the
configuration file defines everything related to scraping [jobs and their
instances](/docs/concepts/jobs_instances/), as well as which [rule files to
load](/docs/querying/rules/#configuring-rules).

To view all available command-line flags, run Prometheus with the `-h` option.

To specify which configuration file to load, use the `-config.file` flag.
A configuration file is written in ASCII protocol buffer form, and every
available option is explained in detail in the protocol buffer schema
definition at
https://github.com/prometheus/prometheus/blob/master/config/config.proto.

Below is an example configuration which explains the most common options with
some comments:

```
# Global settings and defaults.
global {
  # By default, scrape targets every 30 seconds.
  scrape_interval: "30s"
  # By default, evaluate alerting and recording rules every 30 seconds.
  evaluation_interval: "30s"
  # Add the label service="api" to all time series scraped by this Prometheus.
  labels {
    label {
      name: "service"
      value: "api"
    }
  }
  # Load two files that define recording or alerting rules.
  rule_file: "prometheus_base.rules"
  rule_file: "api_service.rules"
}

# Monitor Prometheus itself.
job {
  # This job will be named "prometheus", so a job="prometheus" label will be
  # added to all time series scraped from it.
  name: "prometheus"
  # Scrape this job every 15s, overriding the global default.
  scrape_interval: "15s"
  # Configure a group of static HTTP targets
  target_group {
    target: "http://localhost:9090/metrics"
  }
}

# Monitor a set of a API servers.
job {
  # This job will be named "api-server", so a job="api-server" label will be
  # added to all time series scraped from it.
  name: "api-server"
  # Discover targets for this job via service discovery (DNS-SD). The sd_name
  # provided here needs to resolve to a DNS SRV record containing a set of
  # IP:PORT pairs.
  sd_name: "telemetry.server.prod.api.srv.my-domain.org"
  # The SRV records do not have information about the endpoint to scrape, so it
  # needs to be configured separately when discovering targets dynamically.
  metrics_path: "/metrics"
}
```
