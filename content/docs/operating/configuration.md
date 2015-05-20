---
title: Configuration
nav_icon: sliders
---

# Configuration

Prometheus is configured via command-line flags and a configuration file. While
the command-line flags configure immutable system parameters (such as storage
locations, amount of data to keep on disk and in memory, etc.), the
configuration file defines everything related to scraping [jobs and their
instances](/docs/concepts/jobs_instances/), as well as which [rule files to
load](/docs/querying/rules/#configuring-rules).

To view all available command-line flags, run `prometheus -h`.


## Configuration file

To specify which configuration file to load, use the `-config.file` flag.
The configuration file (including rule files) can be reloaded at runtime by 
sending SIGHUP to the Prometheus process.

The file is written in [YAML format](http://en.wikipedia.org/wiki/YAML),
defined by the scheme described below.
Brackets indicate that a parameter is optional. For non-list parameters the
value is set to the specified default.

Generic placeholders are defined as follows:

* `<duration>`: a duration matching the regular expression `[0-9]+[smhdwy]`
* `<labelname>`: a string matching the regular expression `[a-zA-Z_][a-zA-Z0-9_]*`
* `<labelvalue>`: a string of unicode characters
* `<filename>`: a valid path in the current working directory

The other placeholders are specified separately.

A valid example file can be found [here](https://github.com/prometheus/prometheus/blob/fabxc/sd_yamlcfg/config/testdata/conf.good.yml).

The global configuration specifies parameters valid in all other configuration
contexts. They also serve as defaults for other configuration sections.


```
global:
  # How frequently to scrape targets by default.
  [ scrape_interval: <duration> | default = 1m ]

  # How long until a scrape request times out.
  [ scrape_timeout: <duration> | default = 10s ]

  # How frequently to evaluate rules by default.
  [ evaluation_interval: <duration> | default = 1m ]

  # The labels to add to any timeseries that this Prometheus instance scrapes.
  labels:
    [ <labelname>: <labelvalue> ... ]

# Rule files specifies a list of files from which rules are read.
rule_files:
  [ - <filepath> ... ]

# A list of scrape configurations.
scrape_configs:
  [ - <scrape_config> ... ]
```


### Scrape configurations `<scrape_config>`

The scrape config specifies a set of targets, which might dynamically change, and
parameters describing how to scrape them.
In the general case one scrape configuration specifies a single job. In advanced
configurations this might change.

Static targets can be configured via the `target_groups` parameter. The other
configs allow dynamic target discovery. Additionally, the `relabel_configs` allow
advanced modifications to any target belonging to the scrape config.

```
# The job name assigned to scraped metrics by default.
job_name: <name>

# How frequently to scrape targets from this job.
[ scrape_interval: <duration> | default = <global_config.scrape_interval> ] 

# Per-target timeout when scraping this job.
[ scrape_timeout: <duration> | default = <global_config.scrape_timeout> ]

# The HTTP resource path on which to fetch metrics from targets.
[ metrics_path: <path> | default = /metrics ]

# The URL scheme with which to fetch metrics from targets.
[ scheme: <scheme> | default = http ] 

# List of DNS service discovery configurations.
dns_sd_configs:
  [ - <dns_sd_config> ... ]

# List of Consul service discovery configurations.
consul_sd_configs:
  [ - <consul_sd_config> ... ]

# List of labeled target groups for this job.
target_groups:
  [ - <target_group> ... ]

# List of relabel configurations.
relabel_configs:
  [ - <relabel_config> ... ]
```

Where `<scheme>` may be `http` or `https` and `<path>` is a valid URL path.
`<job_name>` must be unique across all scrape configurations and adhere to the
regex `[a-zA-Z_][a-zA-Z0-9_-]`.


### Target groups `<target_group>`

Target Groups collect a group of targets and specify a common label set for them.
They are the canoncial way to specify static targets in a scrape config.

```
# The targets specified by the target group.
targets: 
  [ - '<host>' ]

# Labels assigned to all metrics scraped from the targets.
labels:
  [ <labelname>: <labelvalue> ... ]
```

Where `<host>` is a valid string consisting of a hostname or IP followed by a port 
number.


### DNS-SD configurations `<dns_sd_config>`

A DNS-SD configuration allows to specify a set of hosts for which DNS SRV records are
queried. The DNS servers to be contacted are read from `/etc/resolv.conf`.

The label `__meta_dns_srv_name` is attached to discovered targets with the queried
SRV name as its value.

```
# A list of host names to be queried.
names:
  [ - <host> ]

# The time after which the provided names are refreshed.
[ refresh_interval: <duration> | default = 30s ]
```

Where `<host>` is a valid hostname.


### Consul SD configurations `<consul_sd_config>`

Consul SD configurations allow to retrieve scrape targets from [Consul's](https://www.consul.io)
Catalog API. 

The following labels are attached to targets:

* `__meta_consul_node`: the node name defined for the target
* `__meta_consul_tags`: the list of tags of the target joined by the tag separator
* `__meta_consul_service`: the name of the service the target belongs to
* `__meta_consul_dc`: the datacenter string for the target

``` 
# The information to access the Consul API. It is to be defined
# as the Consul documentation requires.
server: <host>
[ token: <string> ]
[ datacenter: <string> ]
[ scheme: <string> ]
[ username: <string> ]
[ password: <string> ]

# A list of services for which targets are retrieved.
services:
  [ - <string> ]

# The string by which consul tags are joined into the tag label.
[ tag_separator: <string> | default = , ]
```


### Relabeling `<relabel_config>`

Relabeling is a powerful tool to dynamically rewrite the label set of a target before
its gets scraped. Multiple relabeling steps can be configured per scrape config. 
They are applied to the label set of each target in order of their configuration.

Initially, aside from the configured labels, the `job` label is set to the `job_name` value
of the surrounding scrape configuration. The `__address__` label is set to the `<host>:<port>`
value of the target.
After relabeling the `instance` label is set to the value of `__address__` by default if
it was not set during relabeling.

Additional labels prefixed with `__meta_` may be available for relabeling. They are set
by the service discovery mechanism that provided the target and vary between mechanisms.

Labels starting with `__` will be removed from the label set after relabeling is completed.

```
# The source labels select values from existing labels. Their content is concatenated
# by the configured separator and matched against the configured regular expression.
source_labels: '[' <labelname> [, ...] ']'

# Separator placed between concatenated source label values.
[ separator: <string> | default = ; ]

# Label to which the resulting value is written in a replace action.
# It is mandatory for replace actions.
[ target_label: <labelname> ]

# Regular expression against which the extracted value is matched.
regex: <regex>

# Replacement value against which a regex replace is performed if the
# regular expression matches.
[ replacement: <string> | default = '' ]

# Action to perform based on regex matching.
[ action: <relabel_action> | default = replace ]
```

Where  `<relabel_action> = drop | keep | replace` and `<regex>` is a valid
regular expression.
