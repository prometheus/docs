---
 title: Prometheus 2.0 Alpha.3 with New Rule Format
 created_at: 2017-06-22
 kind: article
 author_name: Goutham Veeramachaneni
---

Today we release the third alpha version of Prometheus 2.0. Aside from a variety of bug fixes in the new storage layer, it contains a few planned breaking changes.

## Flag Changes

First, we moved to a new flag library, which uses the more common double-dash `--` prefix for flags instead of the single dash Prometheus used so far. Deployments have to be adapted accordingly.
Additionally, some flags were removed with this alpha. The full list since Prometheus 1.0.0 is:

* `web.telemetry-path`
* All `storage.remote.*` flags
* All `storage.local.*` flags
* `query.staleness-delta`
* `alertmanager.url`

<!-- more -->

## Recording Rules changes

Alerting and recording rules are one of the critical features of Prometheus. But they also come with a few design issues and missing features, namely:

* All rules ran with the same interval. We could have some heavy rules that are better off being run at a 10-minute interval and some rules that could be run at 15-second intervals.

* All rules were evaluated concurrently, which is actually Prometheus’ oldest [open bug](https://github.com/prometheus/prometheus/blob/main/rules/manager.go#L267). This has a couple of issues, the obvious one being that the load spikes every eval interval if you have a lot of rules. The other being that rules that depend on each other might be fed outdated data. For example:

```
instance:network_bytes:rate1m = sum by(instance) (rate(network_bytes_total[1m]))

ALERT HighNetworkTraffic
  IF instance:network_bytes:rate1m > 10e6
  FOR 5m
```


Here we are alerting over `instance:network_bytes:rate1m`, but `instance:network_bytes:rate1m` is itself being generated by another rule. We can get expected results only if the alert `HighNetworkTraffic` is run after the current value for `instance:network_bytes:rate1m` gets recorded.

* Rules and alerts required users to learn yet another DSL.

To solve the issues above, grouping of rules has been [proposed long back](https://github.com/prometheus/prometheus/issues/1095) but has only recently been implemented [as a part of Prometheus 2.0](https://github.com/prometheus/prometheus/pull/2842). As part of this implementation we have also moved the rules to the well-known YAML format, which also makes it easier to generate alerting rules based on common patterns in users’ environments.

Here’s how the new format looks:

```yaml
groups:
- name: my-group-name
  interval: 30s   # defaults to global interval
  rules:
  - record: instance:errors:rate5m
    expr: rate(errors_total[5m])
  - record: instance:requests:rate5m
    expr: rate(requests_total[5m])
  - alert: HighErrors
    # Expressions remain PromQL as before and can be spread over
    # multiple lines via YAML’s multi-line strings.
    expr: |
      sum without(instance) (instance:errors:rate5m)
      /
      sum without(instance) (instance:requests:rate5m)
    for: 5m
    labels:
      severity: critical
    annotations:
      description: "stuff's happening with {{ $labels.service }}"
```

The rules in each group are executed sequentially and you can have an evaluation interval per group.

As this change is breaking, we are going to release it with the 2.0 release and have added a command to promtool for the migration: `promtool update rules <filenames>`
The converted files have the `.yml` suffix appended and the `rule_files` clause in your Prometheus configuration has to be adapted.


Help us moving towards the Prometheus 2.0 stable release by testing this new alpha version! You can report bugs on our [issue tracker](https://github.com/prometheus/prometheus/issues) and provide general feedback via our [community channels](https://prometheus.io/community/).
