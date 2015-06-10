---
title: Exporters and third-party integrations
sort_rank: 3
---

# Exporters and third-party integrations

There are a number of libraries and servers which help in exporting existing
metrics from third-party systems as Prometheus metrics. This is useful for
cases where it is not feasible to instrument a given system with Prometheus
metrics directly (for example, HAProxy or Linux system stats).

## Official third-party exporters

These exporters are maintained as part of the official
[Prometheus GitHub organization](https://github.com/prometheus):

   * [Node/system metrics exporter](https://github.com/prometheus/node_exporter)
   * [Graphite exporter](https://github.com/prometheus/graphite_exporter)
   * [Collectd exporter](https://github.com/prometheus/collectd_exporter)
   * [JMX exporter](https://github.com/prometheus/jmx_exporter)
   * [HAProxy exporter](https://github.com/prometheus/haproxy_exporter)
   * [StatsD bridge](https://github.com/prometheus/statsd_bridge)
   * [AWS CloudWatch exporter](https://github.com/prometheus/cloudwatch_exporter)
   * [Hystrix metrics publisher](https://github.com/prometheus/hystrix)
   * [Mesos task exporter](https://github.com/prometheus/mesos_exporter)
   * [Consul exporter](https://github.com/prometheus/consul_exporter)
   * [MySQL server exporter](https://github.com/prometheus/mysqld_exporter)

The [JMX exporter](https://github.com/prometheus/jmx_exporter) can export from a
wide variety of JVM-based applications, for example [Kafka](http://kafka.apache.org/) and
[Cassandra](http://cassandra.apache.org/).

## Unofficial third-party exporters

There are also a number of exporters which are externally contributed and
maintained. Note that these may have not been vetted for best practices by the
Prometheus core team yet:

   * [RethinkDB exporter](https://github.com/oliver006/rethinkdb_exporter)
   * [Redis exporter](https://github.com/oliver006/redis_exporter)
   * [scollector exporter](https://github.com/tgulacsi/prometheus_scollector)
   * [MongoDB exporter](https://github.com/dcu/mongodb_exporter)
   * [CouchDB exporter](https://github.com/gesellix/couchdb-exporter)
   * [Django exporter](https://github.com/korfuri/django-prometheus)
   * [Google's mtail log data extractor](https://github.com/google/mtail)
   * [Minecraft exporter module](https://github.com/Baughn/PrometheusIntegration)
   * [Meteor JS web framework exporter](https://atmospherejs.com/sevki/prometheus-exporter)
   * [Memcached exporter](https://github.com/Snapbug/memcache_exporter)
   * [New Relic exporter](https://github.com/jfindley/newrelic_exporter)

## Directly instrumentated software

Some third-party software already exposes Prometheus metrics natively, so no
separate exporters are needed:

   * [cAdvisor](https://github.com/google/cadvisor)
   * [Kubernetes](https://github.com/GoogleCloudPlatform/kubernetes)
   * [Kubernetes-Mesos](https://github.com/mesosphere/kubernetes-mesos)
   * [Etcd](https://github.com/coreos/etcd)
   * [gokit](https://github.com/peterbourgon/gokit)
   * [go-metrics instrumentation library](https://github.com/armon/go-metrics)
   * [RobustIRC](http://robustirc.net/)
