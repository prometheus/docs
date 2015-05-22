---
title: Installing
sort_rank: 2
---

# Installing

## Using pre-compiled binaries

We provide precompiled binaries for released versions for most Prometheus
components. These may be found under the "Releases" tab of the respective
GitHub repositories. For example, for the main Prometheus server, binary
releases are available at
[https://github.com/prometheus/prometheus/releases](https://github.com/prometheus/prometheus/releases).

Debian and RPM packages are being worked on.

## From source

For building Prometheus from source, see the relevant [`README.md`
section](https://github.com/prometheus/prometheus/blob/master/README.md#use-make).

Note that this documentation (as published on
[prometheus.io](http://prometheus.io)) refers to the latest production
release. The head of the
[prometheus/docs](https://github.com/prometheus/docs) GitHub
repository refers to the (possibly not yet released) head of the
[prometheus/prometheus](https://github.com/prometheus/prometheus) (and
other) repositories.

## Using Docker

All Prometheus services are available as Docker images under the
[prom](https://registry.hub.docker.com/repos/prom/) organization.

Running Prometheus on Docker is as simple as
 `docker run -p 9090:9090 prom/prometheus`. This starts Prometheus with
a sample configuration and exposes it on port 9090.

The Prometheus image uses a volume to store the actual metrics. For
production deployments it is highly recommended to use the
[Data Volume Container](https://docs.docker.com/userguide/dockervolumes/#creating-and-mounting-a-data-volume-container)
pattern to ease managing the data on Prometheus upgrades.

To provide your own configuration, there are several options. Here are
two examples.

### Volumes & bind-mount

Bind-mount your prometheus.conf from the host by running:

```
docker run -p 9090:9090 -v /tmp/prometheus.conf:/etc/prometheus/prometheus.conf \
       prom/prometheus
```

Or use an additional volume for the config:

```
docker run -p 9090:9090 -v /prometheus-data \
       prom/prometheus -config.file=/prometheus-data/prometheus.conf
```

### Custom image

To avoid managing a file on the host and bind-mount it, the
configuration can be baked into the image. This works well if the
configuration itself is rather static and the same across all
environments.

For this, create a new directory with a Prometheus configuration and a
Dockerfile like this:

```
FROM prom/prometheus
ADD prometheus.conf /etc/prometheus/
```

Now build and run it:

```
docker build -t my-prometheus .
docker run -p 9090:9090 my-prometheus
```

A more advanced option is to render the config dynamically on start
with some tooling or even have a daemon update it periodically.
