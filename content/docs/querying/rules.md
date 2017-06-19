---
title: Recording rules
sort_rank: 6
---

# Defining recording rules

## Configuring rules
Prometheus supports two types of rules which may be configured and then
evaluated at regular intervals: recording rules and [alerting
rules](../../alerting/rules). To include rules in Prometheus, create a file
containing the necessary rule statements and have Prometheus load the file via
the `rule_files` field in the [Prometheus configuration](/docs/operating/configuration).

The rule files can be reloaded at runtime by sending `SIGHUP` to the Prometheus
process. The changes are only applied if all rule files are well-formatted.

## Syntax-checking rules
To quickly check whether a rule file is syntactically correct without starting
a Prometheus server, install and run Prometheus's `promtool` command-line
utility tool:

```bash
go get github.com/prometheus/prometheus/cmd/promtool
promtool check-rules /path/to/example.rules.yaml
```

When the file is syntactically valid, the checker prints a textual
representation of the parsed rules to standard output and then exits with
a `0` return status.

If there are any syntax errors, it prints an error message to standard error
and exits with a `1` return status. On invalid input arguments the exit status
is `2`.

## Recording rules
Recording rules allow you to precompute frequently needed or computationally
expensive expressions and save their result as a new set of time series.
Querying the precomputed result will then often be much faster than executing
the original expression every time it is needed. This is especially useful for
dashboards, which need to query the same expression repeatedly every time they
refresh.

### Rule Groups
You can group several rules into one group where the rules in one group are evaluated sequentially. You can also specify the evaluation interval of each group.

To add a new recording rule:

```yaml
groups:
- name: prom-core
  rules:
  - record: <new time series name>
    expr: <expression to record>
    labels:
      <label-ovverides>
```

Some examples:
```
  # Saving the per-job HTTP in-progress request count as a new set of time series:
  - record: job:http_inprogress_requests:sum
    expr: sum(http_inprogress_requests) by (job)
   
  # Drop or rewrite labels in the result time series:
  - record: new_time_series
    expr:  old_time_series
    labels:
      label_to_change: new_value
      label_to_drop: ""
```

Recording rules are evaluated at the interval specified in the rule-group or by the
`evaluation_interval` field in the Prometheus configuration. During each
evaluation cycle, the right-hand-side expression of the rule statement is
evaluated at the current instant in time and the resulting sample vector is
stored as a new set of time series with the current timestamp and a new metric
name (and perhaps an overridden set of labels).