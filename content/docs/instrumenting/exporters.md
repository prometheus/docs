---
title: Exporters and integrations
sort_rank: 4
---

# Exporters and integrations

There are a number of libraries and servers which help in exporting existing
metrics from third-party systems as Prometheus metrics. This is useful for
cases where it is not feasible to instrument a given system with Prometheus
metrics directly (for example, HAProxy or Linux system stats).

## Third-party exporters

Some of these exporters are maintained as part of the official [Prometheus GitHub organization](https://github.com/prometheus),
those are marked as *official*, others are externally contributed and maintained.

We encourage the creation of more exporters but cannot
vet all of them for [best practices](https://prometheus.io/docs/instrumenting/writing_exporters/). Commonly, those exporters are
hosted outside of the Prometheus GitHub organization.

The [JMX exporter](https://github.com/prometheus/jmx_exporter) can export from a
wide variety of JVM-based applications, for example [Kafka](http://kafka.apache.org/) and
[Cassandra](http://cassandra.apache.org/).

### Databases
   * [Aerospike exporter](https://github.com/alicebob/asprom)
   * [ClickHouse exporter](https://github.com/f1yegor/clickhouse_exporter)
   * [Consul exporter](https://github.com/prometheus/consul_exporter) (**official**)
   * [CouchDB exporter](https://github.com/gesellix/couchdb-exporter)
   * [Memcached exporter](https://github.com/prometheus/memcached_exporter) (**official**)
   * [MongoDB exporter](https://github.com/dcu/mongodb_exporter)
   * [MySQL server exporter](https://github.com/prometheus/mysqld_exporter) (**official**)
   * [PgBouncer exporter](http://git.cbaines.net/prometheus-pgbouncer-exporter/about)
   * [PostgreSQL exporter](https://github.com/wrouesnel/postgres_exporter)
   * [ProxySQL exporter](https://github.com/percona/proxysql_exporter)
   * [Redis exporter](https://github.com/oliver006/redis_exporter)
   * [RethinkDB exporter](https://github.com/oliver006/rethinkdb_exporter)
   * [SQL query result set metrics exporter](https://github.com/chop-dbhi/prometheus-sql)

### Hardware related
   * [apcupsd exporter](https://github.com/mdlayher/apcupsd_exporter)
   * [IoT Edison exporter](https://github.com/roman-vynar/edison_exporter)
   * [IPMI exporter](https://github.com/lovoo/ipmi_exporter)
   * [knxd exporter](https://github.com/RichiH/knxd_exporter)
   * [Node/system metrics exporter](https://github.com/prometheus/node_exporter) (**official**)
   * [Ubiquiti UniFi exporter](https://github.com/mdlayher/unifi_exporter)

### Messaging systems
   * [NATS exporter](https://github.com/lovoo/nats_exporter)
   * [NSQ exporter](https://github.com/lovoo/nsq_exporter)
   * [RabbitMQ exporter](https://github.com/kbudde/rabbitmq_exporter)
   * [RabbitMQ Management Plugin exporter](https://github.com/deadtrickster/prometheus_rabbitmq_exporter)
   * [Mirth Connect exporter](https://github.com/vynca/mirth_exporter)
   * [Beanstalkd_exporter](https://github.com/messagebird/beanstalkd_exporter)

### Storage
   * [Ceph exporter](https://github.com/digitalocean/ceph_exporter)
   * [ScaleIO exporter](https://github.com/syepes/sio2prom)
   * [Gluster exporter](https://github.com/ofesseler/gluster_exporter)

### HTTP
   * [Apache exporter](https://github.com/neezgee/apache_exporter)
   * [HAProxy exporter](https://github.com/prometheus/haproxy_exporter) (**official**)
   * [Nginx metric library](https://github.com/knyar/nginx-lua-prometheus)
   * [Passenger exporter](https://github.com/stuartnelson3/passenger_exporter)
   * [Varnish exporter](https://github.com/jonnenauha/prometheus_varnish_exporter)
   * [WebDriver exporter](https://github.com/mattbostock/webdriver_exporter)

### APIs
   * [Cloudflare exporter](https://github.com/wehkamp/docker-prometheus-cloudflare-exporter)
   * [Docker Hub exporter](https://github.com/infinityworksltd/docker-hub-exporter)
   * [GitHub exporter](https://github.com/infinityworksltd/github-exporter)
   * [OpenWeatherMap exporter](https://github.com/RichiH/openweathermap_exporter)
   * [Rancher exporter](https://github.com/infinityworksltd/prometheus-rancher-exporter)
   * [Speedtest.net exporter](https://github.com/RichiH/speedtest_exporter)

### Logging
   * [Google's mtail log data extractor](https://github.com/google/mtail)
   * [Grok exporter](https://github.com/fstab/grok_exporter)

### Other monitoring systems
   * [AWS CloudWatch exporter](https://github.com/prometheus/cloudwatch_exporter) (**official**)
   * [Cloud Foundry Firehose exporter](https://github.com/cloudfoundry-community/firehose_exporter)
   * [Collectd exporter](https://github.com/prometheus/collectd_exporter) (**official**)
   * [Graphite exporter](https://github.com/prometheus/graphite_exporter) (**official**)
   * [Heka dashboard exporter](https://github.com/docker-infra/heka_exporter)
   * [Heka exporter](https://github.com/imgix/heka_exporter)
   * [InfluxDB exporter](https://github.com/prometheus/influxdb_exporter) (**official**)
   * [JMX exporter](https://github.com/prometheus/jmx_exporter) (**official**)
   * [Munin exporter](https://github.com/pvdh/munin_exporter)
   * [New Relic exporter](https://github.com/jfindley/newrelic_exporter)
   * [scollector exporter](https://github.com/tgulacsi/prometheus_scollector)
   * [SNMP exporter](https://github.com/prometheus/snmp_exporter) (**official**)
   * [StatsD exporter](https://github.com/prometheus/statsd_exporter) (**official**)

### Miscellaneous
   * [BIG-IP exporter](https://github.com/ExpressenAB/bigip_exporter)
   * [BIND exporter](https://github.com/digitalocean/bind_exporter)
   * [Blackbox exporter](https://github.com/prometheus/blackbox_exporter) (**official**)
   * [BOSH exporter](https://github.com/cloudfoundry-community/bosh_exporter)
   * [Jenkins exporter](https://github.com/lovoo/jenkins_exporter)
   * [Meteor JS web framework exporter](https://atmospherejs.com/sevki/prometheus-exporter)
   * [Minecraft exporter module](https://github.com/Baughn/PrometheusIntegration)
   * [PowerDNS exporter](https://github.com/janeczku/powerdns_exporter)
   * [Process exporter](https://github.com/ncabatoff/process-exporter)
   * [rTorrent exporter](https://github.com/mdlayher/rtorrent_exporter)
   * [Script exporter](https://github.com/adhocteam/script_exporter)
   * [SMTP/Maildir MDA blackbox prober](https://github.com/cherti/mailexporter)
   * [Xen exporter](https://github.com/lovoo/xenstats_exporter)

When implementing a new Prometheus exporter, please follow the
[guidelines on writing exporters](/docs/instrumenting/writing_exporters)
Please also consider consulting the [development mailing
list](https://groups.google.com/forum/#!forum/prometheus-developers).  We are
happy to give advice on how to make your exporter as useful and consistent as
possible.

## Directly instrumented software

Some third-party software already exposes Prometheus metrics natively, so no
separate exporters are needed:

   * [cAdvisor](https://github.com/google/cadvisor)
   * [Doorman](https://github.com/youtube/doorman)
   * [Etcd](https://github.com/coreos/etcd)
   * [Kubernetes-Mesos](https://github.com/mesosphere/kubernetes-mesos)
   * [Kubernetes](https://github.com/kubernetes/kubernetes)
   * [RobustIRC](http://robustirc.net/)
   * [Quobyte](https://www.quobyte.com/)
   * [SkyDNS](https://github.com/skynetservices/skydns)
   * [Weave Flux](http://weaveworks.github.io/flux/)

## Other third-party utilities

This section lists libraries and other utilities that help you instrument code
in a certain language. They are not Prometheus client libraries themselves but
make use of one of the normal Prometheus client libraries under the hood. As
for all independently maintained software, we cannot vet all of them for best
practices.

   * Clojure: [prometheus-clj](https://github.com/soundcloud/prometheus-clj)
   * Go: [go-metrics instrumentation library](https://github.com/armon/go-metrics)
   * Go: [gokit](https://github.com/peterbourgon/gokit)
   * Java/JVM: [Hystrix metrics publisher](https://github.com/soundcloud/prometheus-hystrix)
   * Python-Django: [django-prometheus](https://github.com/korfuri/django-prometheus)

