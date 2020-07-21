---
title: Docker Swarm
sort_rank: 1
---

# Docker Swarm

Prometheus can discover targets in a [Docker Swarm][swarm] cluster, as of
vw.20.0. This guide demonstrates how to use that service discovery mechanism.

## Docker Swarm service discovery architecture

The [Docker Swarm service discovery][swarmsd] contains 3 different roles: nodes, services,
and tasks.

The first role, **nodes**, represents the hosts that are part of the Swarm. It
can be used to automatically monitor the Docker daemons or the Node Exporters
who run on the Swarm hosts.

The second one, **services**, will discover the services deployed in the
swarm. This could be used if you only want to scrape one of the targets at the
same time, as it would used the load balanced IP address. Each port will be
discovered individually. Services with multiple ports would be mapped to
multiple targets in Prometheus, and service that do not expose ports won't be
discovered.

The third role, **tasks**, represents any individual container deployed in the
swarm. Each service is be mapped by one or multiple containers.

**Note**: The rest of this post assumes that you have a Swarm running.

## Monitoring Docker daemons

Let's dive into the service discovery itself.

Docker itself, as a daemon, exposes [metrics][dockermetrics] that can be
ingested by a Prometheus server.

You can enable them by editing `/etc/docker/daemon.json` and setting the
following properties:

```json
{
  "metrics-addr" : "0.0.0.0:9323",
  "experimental" : true
}
```

Instead of `0.0.0.0`, you can set the IP of the Docker Swarm node.

A restart of the daemon is required to take the new configuration into account.

The [Docker documentation][dockermetrics] contains more info about this.

Then, you can configure Prometheus to scrape the Docker daemon, by providing the
following `prometheus.yml` file:


```yaml
scrape_configs:
  # Make Prometheus scrape itself for metrics.
  - job_name: 'prometheus'
    static_configs:
    - targets: ['localhost:9090']

  # Create a job for Docker daemons.
  - job_name: 'docker'
    dockerswarm_sd_configs:
      - host: unix:///var/run/docker.sock
        role: nodes
    relabel_configs:
      # Fetch metrics on port 9323.
      - source_labels: [__meta_dockerswarm_node_address]
        target_label: __address__
        replacement: $1:9323
      # Set hostname as instance label
      - source_labels: [__meta_dockerswarm_node_hostname]
        target_label: instance
```

**Note**: for the nodes role, you can also use the `port` parameter of
`dockerswarm_sd_configs`. However, using `relabel_configs` is recommended as it
enables Prometheus to reuse the same API calls across identical Docker Swarm
configurations.

## Monitoring Containers

Let's now deploy a service in our Swarm. We will deploy [cadvisor][cad], which
exposes container resources metrics:

```shell
docker service create --name cadvisor -l prometheus-job=cadvisor \
    --mode=global --publish target=8080,mode=host \
    --mount type=bind,src=/var/run/docker.sock,dst=/var/run/docker.sock,ro \
    --mount type=bind,src=/,dst=/rootfs,ro \
    --mount type=bind,src=/var/run,dst=/var/run \
    --mount type=bind,src=/sys,dst=/sys,ro \
    --mount type=bind,src=/var/lib/docker,dst=/var/lib/docker,ro \
    google/cadvisor -docker_only
```

This is a minimal `prometheus.yml` file to monitor it:

```yaml
scrape_configs:
  # Make Prometheus scrape itself for metrics.
  - job_name: 'prometheus'
    static_configs:
    - targets: ['localhost:9090']

  # Create a job for Docker Swarm containers.
  - job_name: 'dockerswarm'
    dockerswarm_sd_configs:
      - host: unix:///var/run/docker.sock
        role: tasks
    relabel_configs:
      # Only keep containers that should be running.
      - source_labels: [__meta_dockerswarm_task_desired_state]
        regex: running
        action: keep
      # Only keep containers that have a `prometheus-job` label.
      - source_labels: [__meta_dockerswarm_service_label_prometheus_job]
        regex: .+
        action: keep
      # Use the task labels that are prefixed by `prometheus-`.
      - regex: __meta_dockerswarm_service_label_prometheus_(.+)
        action: labelmap
        replacement: $1
```

Let's analyze each part of the [relabel configuration][rela].


```yaml
- source_labels: [__meta_dockerswarm_task_desired_state]
  regex: running
  action: keep
```

Docker Swarm exposes the desired [state of the tasks][state] over the API. In
out example, we only **keep** the targets that should be running. It prevents
monitoring tasks that should be shut down.

```yaml
- source_labels: [__meta_dockerswarm_service_label_prometheus_job]
  regex: .+
  action: keep
```

When we deployed our cadvisor, we have added a label `prometheus-job=cadvisor`.
As Prometheus fetches the tasks labels, we can instruct it to **only** keep the
targets which have a `prometheus-job` label.


```yaml
- regex: __meta_dockerswarm_service_label_prometheus_(.+)
  action: labelmap
  replacement: $1
```

That last part takes all the labels prefixed by `prometheus` and turns them into
targets labels. In our exemple, it sets `job=cadvisor` on the cadvisor
containers.

## Discovered labels

The [Prometheus Documentation][swarmsd] contains the full list of labels, but
here are other relabel configs that you might find useful.

### Scraping metrics via a certain network only

```yaml
- source_labels: [__meta_dockerswarm_network_name]
  regex: ingress
  action: keep
```

### Scraping global tasks only

Global tasks run on every daemon.

```yaml
- source_labels: [__meta_dockerswarm_service_mode]
  regex: global
  action: keep
- source_labels: [__meta_dockerswarm_task_port_publish_mode]
  regex: host
  action: keep
```

We only se

### Adding a docker_node label to the job

```yaml
- source_labels: [__meta_dockerswarm_node_hostname]
  target_label: docker_node
```

## Connecting to the Docker Swarm

The above `dockerswarm_sd_configs` entries have a field host:

```yaml
host: unix:///var/run/docker.sock
```

That is using the Docker socket. Prometheus offers [additional configuration
options][swarmsd] to connect to Swarm using HTTP and HTTPS, if you prefer that
over the unix socket.

## Conclusion

There are many discovery labels you can play with to better determine which
targets to monitor and how, for the tasks, there is more than 25 labels
available. Don't hesitate to look at the "Service Discovery" page of your
Prometheus server (under the "Status" menu) to see all the discovered labels.

The Discovery did not make any assumption about your Swarm stack, in such a way
that given proper configuration, this should be pluggable to any existing stack.

[state]:https://docs.docker.com/engine/swarm/how-swarm-mode-works/swarm-task-states/
[rela]:https://prometheus.io/docs/prometheus/latest/configuration/configuration/#relabel_config
[swarmissue]:https://github.com/prometheus/prometheus/issues/1766
[team]:https://prometheus.io/governance/
[disc]:https://github.com/prometheus/prometheus/blob/master/discovery/README.md
[consul]:https://prometheus.io/docs/prometheus/latest/configuration/configuration/#consul_sd_config
[swarm]:https://docs.docker.com/engine/swarm/
[swarmsd]:https://prometheus.io/docs/prometheus/2.20/configuration/configuration/#dockerswarm_sd_config
[k8s]:https://prometheus.io/docs/prometheus/latest/configuration/configuration/#kubernetes_sd_config
[ec2]:https://prometheus.io/docs/prometheus/latest/configuration/configuration/#ec3_sd_config
[file_sd]:https://prometheus.io/docs/prometheus/latest/configuration/configuration/#file_sd_config
[gce]:https://prometheus.io/docs/prometheus/latest/configuration/configuration/#gce_sd_config
[azure]:https://prometheus.io/docs/prometheus/latest/configuration/configuration/#azure_sd_config
[os]:https://prometheus.io/docs/prometheus/latest/configuration/configuration/#openstack_sd_config
[dockermetrics]:https://docs.docker.com/config/daemon/prometheus/
[cad]:https://github.com/google/cadvisor
