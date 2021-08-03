---
title: When to use the Pushgateway
sort_rank: 7
---

# When to use the Pushgateway

The Pushgateway is an intermediary service which allows you to push metrics
from jobs which cannot be scraped. For details, see [Pushing metrics](/docs/instrumenting/pushing/).

## Should I be using the Pushgateway?

**We only recommend using the Pushgateway in certain limited cases.** There are
several pitfalls when blindly using the Pushgateway instead of Prometheus's
usual pull model for general metrics collection:

* When monitoring multiple instances through a single Pushgateway, the
  Pushgateway becomes both a single point of failure and a potential
  bottleneck.
* You lose Prometheus's automatic instance health monitoring via the `up`
  metric (generated on every scrape).
* The Pushgateway never forgets series pushed to it and will expose them to
  Prometheus forever unless those series are manually deleted via the
  Pushgateway's API.

The latter point is especially relevant when multiple instances of a job
differentiate their metrics in the Pushgateway via an `instance` label or
similar. Metrics for an instance will then remain in the Pushgateway even if
the originating instance is renamed or removed. This is because the lifecycle
of the Pushgateway as a metrics cache is fundamentally separate from the
lifecycle of the processes that push metrics to it. Contrast this to
Prometheus's usual pull-style monitoring: when an instance disappears
(intentional or not), its metrics will automatically disappear along with it.
When using the Pushgateway, this is not the case, and you would now have to
delete any stale metrics manually or automate this lifecycle synchronization
yourself.

**Usually, the only valid use case for the Pushgateway is for capturing the
outcome of a service-level batch job**.  A "service-level" batch job is one
which is not semantically related to a specific machine or job instance (for
example, a batch job that deletes a number of users for an entire service).
Such a job's metrics should not include a machine or instance label to decouple
the lifecycle of specific machines or instances from the pushed metrics. This
decreases the burden for managing stale metrics in the Pushgateway. See also
the [best practices for monitoring batch jobs](/docs/practices/instrumentation/#batch-jobs).

## Alternative strategies

If an inbound firewall or NAT is preventing you from pulling metrics from
targets, consider moving the Prometheus server behind the network barrier as
well. We generally recommend running Prometheus servers on the same network as
the monitored instances.  Otherwise, consider [PushProx](https://github.com/RobustPerception/PushProx),
which allows Prometheus to traverse a firewall or NAT.

For batch jobs that are related to a machine (such as automatic
security update cronjobs or configuration management client runs), expose the
resulting metrics using the [Node Exporter's](https://github.com/prometheus/node_exporter)
[textfile collector](https://github.com/prometheus/node_exporter#textfile-collector) instead of the Pushgateway.
