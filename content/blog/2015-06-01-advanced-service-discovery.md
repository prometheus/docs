---
title: Advanced Service Discovery in Prometheus 0.14.0
created_at: 2015-06-01
kind: article
author_name: Fabian Reinartz, Julius Volz
---

This week we released Prometheus v0.14.0 — a version with many long-awaited additions
and improvements.

On the user side, Prometheus now supports new service discovery mechanisms. In
addition to DNS-SRV records, it now supports [Consul](https://www.consul.io)
out of the box, and a file-based interface allows you to connect your own
discovery mechanisms. Over time, we plan to add other common service discovery
mechanisms to Prometheus.

Aside from many smaller fixes and improvements, you can now also reload your configuration during
runtime by sending a `SIGHUP` to the Prometheus process. For a full list of changes, check the
[changelog for this release](https://github.com/prometheus/prometheus/blob/main/CHANGELOG.md#0140--2015-06-01).

In this blog post, we will take a closer look at the built-in service discovery mechanisms and provide
some practical examples. As an additional resource, see
[Prometheus's configuration documentation](/docs/operating/configuration).

<!-- more -->

## Prometheus and targets

For a proper understanding of this blog post, we first need to take a look at how
Prometheus labels targets.

There are various places in the configuration file where target labels may be
set. They are applied in the following order, with later stages overwriting any
labels set by an earlier stage:

1. Global labels, which are assigned to every target scraped by the Prometheus instance.
2. The `job` label, which is configured as a default value for each scrape configuration.
3. Labels that are set per target group within a scrape configuration.
4. Advanced label manipulation via [_relabeling_](/docs/operating/configuration/#relabel_config).

Each stage overwrites any colliding labels from the earlier stages. Eventually, we have a flat
set of labels that describe a single target. Those labels are then attached to every time series that
is scraped from this target.

Note: Internally, even the address of a target is stored in a special
`__address__` label. This can be useful during advanced label manipulation
(relabeling), as we will see later. Labels starting with `__` do not appear in
the final time series.


## Scrape configurations and relabeling

Aside from moving from an ASCII protocol buffer format to YAML, a fundamental change to
Prometheus's configuration is the change from per-job configurations to more generalized scrape
configurations. While the two are almost equivalent for simple setups, scrape configurations
allow for greater flexibility in more advanced use cases.

Each scrape configuration defines a job name which serves as a default value for the
`job` label. The `job` label can then be redefined for entire target groups or individual targets.
For example, we can define two target groups, each of which defines targets for one job.
To scrape them with the same parameters, we can configure them as follows:

```
scrape_configs:
- job_name: 'overwritten-default'

  scrape_interval: 10s
  scrape_timeout:  5s

  target_groups:
  - targets: ['10.1.200.130:5051', '10.1.200.134:5051']
    labels:
      job: 'job1'

  - targets: ['10.1.200.130:6220', '10.1.200.134:6221']
    labels:
      job: 'job2'
```

Through a mechanism named [_relabeling_](http://prometheus.io/docs/operating/configuration/#relabel_config),
any label can be removed, created, or modified on a per-target level. This
enables fine-grained labeling that can also take into account metadata coming
from the service discovery. Relabeling is the last stage of label assignment
and overwrites any labels previously set.

Relabeling works as follows:

- A list of source labels is defined.
- For each target, the values of those labels are concatenated with a separator.
- A regular expression is matched against the resulting string.
- A new value based on those matches is assigned to another label.

Multiple relabeling rules can be defined for each scrape configuration. A simple one
that squashes two labels into one, looks as follows:

```
relabel_configs:
- source_labels: ['label_a', 'label_b']
  separator:     ';'
  regex:         '(.*);(.*)'
  replacement:   '${1}-${2}'
  target_label:  'label_c'
```

This rule transforms a target with the label set:

```
{
  "job": "job1",
  "label_a": "foo",
  "label_b": "bar"
}
```
...into a target with the label set:

```
{
  "job": "job1",
  "label_a": "foo",
  "label_b": "bar",
  "label_c": "foo-bar"
}
```

You could then also remove the source labels in an additional relabeling step.

You can read more about relabeling and how you can use it to filter targets in the
[configuration documentation](/docs/operating/configuration#relabel_config).

Over the next sections, we will see how you can leverage relabeling when using service discovery.


## Discovery with DNS-SRV records

Since the beginning, Prometheus has supported target discovery via DNS-SRV records.
The respective configuration looked like this:

```
job {
  name: "api-server"
  sd_name: "telemetry.eu-west.api.srv.example.org"
  metrics_path: "/metrics"
}
```

Prometheus 0.14.0 allows you to specify multiple SRV records to be queried in a
single scrape configuration, and also provides service-discovery-specific meta
information that is helpful during the relabeling phase.

When querying the DNS-SRV records, a label named `__meta_dns_name` is
attached to each target. Its value is set to the SRV record name for which it was
returned. If we have structured SRV record names like `telemetry.<zone>.<job>.srv.example.org`,
we can extract relevant labels from it those names:

```
scrape_configs:
- job_name: 'myjob'

  dns_sd_configs:
  - names:
    - 'telemetry.eu-west.api.srv.example.org'
    - 'telemetry.us-west.api.srv.example.org'
    - 'telemetry.eu-west.auth.srv.example.org'
    - 'telemetry.us-east.auth.srv.example.org'

  relabel_configs:
  - source_labels: ['__meta_dns_name']
    regex:         'telemetry\.(.+?)\..+?\.srv\.example\.org'
    target_label:  'zone'
    replacement:   '$1'
  - source_labels: ['__meta_dns_name']
    regex:         'telemetry\..+?\.(.+?)\.srv\.example\.org'
    target_label:  'job'
    replacement:   '$1'
```

This will attach the `zone` and `job` label to each target based on the SRV record
it came from.


## Discovery with Consul

Service discovery via Consul is now supported natively. It can be configured by defining
access parameters for our Consul agent and a list of Consul services for which we want
to query targets.

The tags of each Consul node are concatenated by a configurable separator and exposed
through the `__meta_consul_tags` label. Various other Consul-specific meta
labels are also provided.

Scraping all instances for a list of given services can be achieved with a simple
`consul_sd_config` and relabeling rules:

```
scrape_configs:
- job_name: 'overwritten-default'

  consul_sd_configs:
  - server:   '127.0.0.1:5361'
    services: ['auth', 'api', 'load-balancer', 'postgres']

  relabel_configs:
  - source_labels: ['__meta_consul_service']
    regex:         '(.*)'
    target_label:  'job'
    replacement:   '$1'
  - source_labels: ['__meta_consul_node']
    regex:         '(.*)'
    target_label:  'instance'
    replacement:   '$1'
  - source_labels: ['__meta_consul_tags']
    regex:         ',(production|canary),'
    target_label:  'group'
    replacement:   '$1'
```

This discovers the given services from the local Consul agent.
As a result, we get metrics for four jobs (`auth`, `api`, `load-balancer`, and `postgres`). If a node
has the `production` or `canary` Consul tag, a respective `group` label is assigned to the target.
Each target's `instance` label is set to the node name provided by Consul.

A full documentation of all configuration parameters for service discovery via Consul
can be found on the [Prometheus website](/docs/operating/configuration#relabel_config).


## Custom service discovery

Finally, we added a file-based interface to integrate your custom service discovery or other common mechanisms
that are not yet supported out of the box.

With this mechanism, Prometheus watches a set of directories or files which define target groups.
Whenever any of those files changes, a list of target groups is read from the files and scrape targets
are extracted.
It's now our job to write a small bridge program that runs as Prometheus's side-kick.
It retrieves changes from an arbitrary service discovery mechanism and writes the target information
to the watched files as lists of target groups.

These files can either be in YAML:

```
- targets: ['10.11.150.1:7870', '10.11.150.4:7870']
  labels:
    job: 'mysql'

- targets: ['10.11.122.11:6001', '10.11.122.15:6002']
  labels:
    job: 'postgres'
```

...or in JSON format:

```
[
  {
    "targets": ["10.11.150.1:7870", "10.11.150.4:7870"],
    "labels": {
      "job": "mysql"
    }
  },
  {
    "targets": ["10.11.122.11:6001", "10.11.122.15:6002"],
    "labels": {
      "job": "postgres"
    }
  }
]
```

We now configure Prometheus to watch the `tgroups/` directory in its working directory
for all `.json` files:

```
scrape_configs:
- job_name: 'overwritten-default'

  file_sd_configs:
  - names: ['tgroups/*.json']
```

What's missing now is a program that writes files to this directory. For the sake of this example,
let's assume we have all our instances for different jobs in a single denormalized MySQL table.
(Hint: you probably don't want to do service discovery this way.)

Every 30 seconds, we read all instances from the MySQL table and write the
resulting target groups into a JSON file. Note that we do not have to keep
state whether or not any targets or their labels have changed. Prometheus will
automatically detect changes and applies them to targets without interrupting
their scrape cycles.

```
import os, time, json

from itertools import groupby
from MySQLdb import connect


def refresh(cur):
    # Fetch all rows.
    cur.execute("SELECT address, job, zone FROM instances")

    tgs = []
    # Group all instances by their job and zone values.
    for key, vals in groupby(cur.fetchall(), key=lambda r: (r[1], r[2])):
        tgs.append({
            'labels': dict(zip(['job', 'zone'], key)),
            'targets': [t[0] for t in vals],
        })

    # Persist the target groups to disk as JSON file.
    with open('tgroups/target_groups.json.new', 'w') as f:
        json.dump(tgs, f)
        f.flush()
        os.fsync(f.fileno())

    os.rename('tgroups/target_groups.json.new', 'tgroups/target_groups.json')


if __name__ == '__main__':
    while True:
        with connect('localhost', 'root', '', 'test') as cur:
            refresh(cur)
        time.sleep(30)
```

While Prometheus will not apply any malformed changes to files, it is considered best practice to
update your files atomically via renaming, as we do in our example.
It is also recommended to split larger amounts of target groups into several files based on
logical grouping.


## Conclusion

With DNS-SRV records and Consul, two major service discovery methods are now
natively supported by Prometheus. We've seen that relabeling is a powerful
approach to make use of metadata provided by service discovery mechanisms.

Make sure to take a look at the new [configuration documentation](/docs/operating/configuration/)
to upgrade your Prometheus setup to the new release and find out about other configuration options,
such as basic HTTP authentication and target filtering via relabeling.

We provide a [migration tool](https://github.com/prometheus/migrate/releases) that upgrades
your existing configuration files to the new YAML format.
For smaller configurations we recommend a manual upgrade to get familiar with the new format and
to preserve comments.
