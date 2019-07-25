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

We encourage the creation of more exporters but cannot vet all of them for
[best practices](/docs/instrumenting/writing_exporters/).
Commonly, those exporters are hosted outside of the Prometheus GitHub
organization.

The [exporter default
port](https://github.com/prometheus/prometheus/wiki/Default-port-allocations)
wiki page has become another catalog of exporters, and may include exporters
not listed here due to overlapping functionality or still being in development.

The [JMX exporter](https://github.com/prometheus/jmx_exporter) can export from a
wide variety of JVM-based applications, for example [Kafka](http://kafka.apache.org/) and
[Cassandra](http://cassandra.apache.org/).

### Databases
   * [Aerospike exporter](https://github.com/alicebob/asprom)
   * [ClickHouse exporter](https://github.com/f1yegor/clickhouse_exporter)
   * [Consul exporter](https://github.com/prometheus/consul_exporter) (**official**)
   * [Couchbase exporter](https://github.com/blakelead/couchbase_exporter)
   * [CouchDB exporter](https://github.com/gesellix/couchdb-exporter)
   * [ElasticSearch exporter](https://github.com/justwatchcom/elasticsearch_exporter)
   * [EventStore exporter](https://github.com/marcinbudny/eventstore_exporter)
   * [Memcached exporter](https://github.com/prometheus/memcached_exporter) (**official**)
   * [MongoDB exporter](https://github.com/dcu/mongodb_exporter)
   * [MSSQL server exporter](https://github.com/awaragi/prometheus-mssql-exporter)
   * [MySQL server exporter](https://github.com/prometheus/mysqld_exporter) (**official**)
   * [OpenTSDB Exporter](https://github.com/cloudflare/opentsdb_exporter)
   * [Oracle DB Exporter](https://github.com/iamseth/oracledb_exporter)
   * [PgBouncer exporter](http://git.cbaines.net/prometheus-pgbouncer-exporter/about)
   * [PostgreSQL exporter](https://github.com/wrouesnel/postgres_exporter)
   * [Presto exporter](https://github.com/yahoojapan/presto_exporter)
   * [ProxySQL exporter](https://github.com/percona/proxysql_exporter)
   * [RavenDB exporter](https://github.com/marcinbudny/ravendb_exporter)
   * [Redis exporter](https://github.com/oliver006/redis_exporter)
   * [RethinkDB exporter](https://github.com/oliver006/rethinkdb_exporter)
   * [SQL exporter](https://github.com/free/sql_exporter)
   * [Tarantool metric library](https://github.com/tarantool/prometheus)
   * [Twemproxy](https://github.com/stuartnelson3/twemproxy_exporter)

### Hardware related
   * [apcupsd exporter](https://github.com/mdlayher/apcupsd_exporter)
   * [BIG-IP exporter](https://github.com/ExpressenAB/bigip_exporter)
   * [Collins exporter](https://github.com/soundcloud/collins_exporter)
   * [Dell Hardware OMSA exporter](https://github.com/galexrt/dellhw_exporter)
   * [IBM Z HMC exporter](https://github.com/zhmcclient/zhmc-prometheus-exporter)
   * [IoT Edison exporter](https://github.com/roman-vynar/edison_exporter)
   * [IPMI exporter](https://github.com/soundcloud/ipmi_exporter)
   * [knxd exporter](https://github.com/RichiH/knxd_exporter)
   * [Netgear Cable Modem Exporter](https://github.com/ickymettle/netgear_cm_exporter)
   * [Netgear Router exporter](https://github.com/DRuggeri/netgear_exporter)
   * [Node/system metrics exporter](https://github.com/prometheus/node_exporter) (**official**)
   * [NVIDIA GPU exporter](https://github.com/mindprince/nvidia_gpu_prometheus_exporter)
   * [ProSAFE exporter](https://github.com/dalance/prosafe_exporter)
   * [Ubiquiti UniFi exporter](https://github.com/mdlayher/unifi_exporter)

### Issue trackers and continuous integration

   * [Bamboo exporter](https://github.com/AndreyVMarkelov/bamboo-prometheus-exporter)
   * [Bitbucket exporter](https://github.com/AndreyVMarkelov/prom-bitbucket-exporter)
   * [Confluence exporter](https://github.com/AndreyVMarkelov/prom-confluence-exporter)
   * [Jenkins exporter](https://github.com/lovoo/jenkins_exporter)
   * [JIRA exporter](https://github.com/AndreyVMarkelov/jira-prometheus-exporter)

### Messaging systems
   * [Beanstalkd exporter](https://github.com/messagebird/beanstalkd_exporter)
   * [EMQ exporter](https://github.com/nuvo/emq_exporter)
   * [Gearman exporter](https://github.com/bakins/gearman-exporter)
   * [IBM MQ exporter](https://github.com/ibm-messaging/mq-metric-samples/tree/master/cmd/mq_prometheus)
   * [Kafka exporter](https://github.com/danielqsj/kafka_exporter)
   * [NATS exporter](https://github.com/nats-io/prometheus-nats-exporter)
   * [NSQ exporter](https://github.com/lovoo/nsq_exporter)
   * [Mirth Connect exporter](https://github.com/vynca/mirth_exporter)
   * [MQTT blackbox exporter](https://github.com/inovex/mqtt_blackbox_exporter)
   * [RabbitMQ exporter](https://github.com/kbudde/rabbitmq_exporter)
   * [RabbitMQ Management Plugin exporter](https://github.com/deadtrickster/prometheus_rabbitmq_exporter)
   * [RocketMQ exporter](https://github.com/apache/rocketmq-exporter)

### Storage
   * [Ceph exporter](https://github.com/digitalocean/ceph_exporter)
   * [Ceph RADOSGW exporter](https://github.com/blemmenes/radosgw_usage_exporter)
   * [Gluster exporter](https://github.com/ofesseler/gluster_exporter)
   * [Hadoop HDFS FSImage exporter](https://github.com/marcelmay/hadoop-hdfs-fsimage-exporter)
   * [Lustre exporter](https://github.com/HewlettPackard/lustre_exporter)
   * [ScaleIO exporter](https://github.com/syepes/sio2prom)

### HTTP
   * [Apache exporter](https://github.com/Lusitaniae/apache_exporter)
   * [HAProxy exporter](https://github.com/prometheus/haproxy_exporter) (**official**)
   * [Nginx metric library](https://github.com/knyar/nginx-lua-prometheus)
   * [Nginx VTS exporter](https://github.com/hnlq715/nginx-vts-exporter)
   * [Passenger exporter](https://github.com/stuartnelson3/passenger_exporter)
   * [Squid exporter](https://github.com/boynux/squid-exporter)
   * [Tinyproxy exporter](https://github.com/igzivkov/tinyproxy_exporter)
   * [Varnish exporter](https://github.com/jonnenauha/prometheus_varnish_exporter)
   * [WebDriver exporter](https://github.com/mattbostock/webdriver_exporter)

### APIs
   * [AWS ECS exporter](https://github.com/slok/ecs-exporter)
   * [AWS Health exporter](https://github.com/Jimdo/aws-health-exporter)
   * [AWS SQS exporter](https://github.com/jmal98/sqs_exporter)
   * [Cloudflare exporter](https://github.com/wehkamp/docker-prometheus-cloudflare-exporter)
   * [DigitalOcean exporter](https://github.com/metalmatze/digitalocean_exporter)
   * [Docker Cloud exporter](https://github.com/infinityworksltd/docker-cloud-exporter)
   * [Docker Hub exporter](https://github.com/infinityworksltd/docker-hub-exporter)
   * [GitHub exporter](https://github.com/infinityworksltd/github-exporter)
   * [InstaClustr exporter](https://github.com/fcgravalos/instaclustr_exporter)
   * [Mozilla Observatory exporter](https://github.com/Jimdo/observatory-exporter)
   * [OpenWeatherMap exporter](https://github.com/RichiH/openweathermap_exporter)
   * [Pagespeed exporter](https://github.com/foomo/pagespeed_exporter)
   * [Rancher exporter](https://github.com/infinityworksltd/prometheus-rancher-exporter)
   * [Speedtest exporter](https://github.com/nlamirault/speedtest_exporter)

### Logging
   * [Fluentd exporter](https://github.com/V3ckt0r/fluentd_exporter)
   * [Google's mtail log data extractor](https://github.com/google/mtail)
   * [Grok exporter](https://github.com/fstab/grok_exporter)

### Other monitoring systems
   * [Akamai Cloudmonitor exporter](https://github.com/ExpressenAB/cloudmonitor_exporter)
   * [Alibaba Cloudmonitor exporter](https://github.com/aylei/aliyun-exporter)
   * [AWS CloudWatch exporter](https://github.com/prometheus/cloudwatch_exporter) (**official**)
   * [Azure Monitor exporter](https://github.com/RobustPerception/azure_metrics_exporter)
   * [Cloud Foundry Firehose exporter](https://github.com/cloudfoundry-community/firehose_exporter)
   * [Collectd exporter](https://github.com/prometheus/collectd_exporter) (**official**)
   * [Google Stackdriver exporter](https://github.com/frodenas/stackdriver_exporter)
   * [Graphite exporter](https://github.com/prometheus/graphite_exporter) (**official**)
   * [Heka dashboard exporter](https://github.com/docker-infra/heka_exporter)
   * [Heka exporter](https://github.com/imgix/heka_exporter)
   * [InfluxDB exporter](https://github.com/prometheus/influxdb_exporter) (**official**)
   * [JavaMelody exporter](https://github.com/fschlag/javamelody-prometheus-exporter)
   * [JMX exporter](https://github.com/prometheus/jmx_exporter) (**official**)
   * [Munin exporter](https://github.com/pvdh/munin_exporter)
   * [Nagios / Naemon exporter](https://github.com/Griesbacher/Iapetos)
   * [New Relic exporter](https://github.com/mrf/newrelic_exporter)
   * [NRPE exporter](https://github.com/robustperception/nrpe_exporter)
   * [Osquery exporter](https://github.com/zwopir/osquery_exporter)
   * [OTC CloudEye exporter](https://github.com/tiagoReichert/otc-cloudeye-prometheus-exporter)
   * [Pingdom exporter](https://github.com/giantswarm/prometheus-pingdom-exporter)
   * [scollector exporter](https://github.com/tgulacsi/prometheus_scollector)
   * [Sensu exporter](https://github.com/reachlin/sensu_exporter)
   * [SNMP exporter](https://github.com/prometheus/snmp_exporter) (**official**)
   * [StatsD exporter](https://github.com/prometheus/statsd_exporter) (**official**)
   * [TencentCloud monitor exporter](https://github.com/tencentyun/tencentcloud-exporter)

### Miscellaneous
   * [ACT Fibernet Exporter](https://git.captnemo.in/nemo/prometheus-act-exporter)
   * [BIND exporter](https://github.com/digitalocean/bind_exporter)
   * [Blackbox exporter](https://github.com/prometheus/blackbox_exporter) (**official**)
   * [BOSH exporter](https://github.com/cloudfoundry-community/bosh_exporter)
   * [cAdvisor](https://github.com/google/cadvisor)
   * [Cachet exporter](https://github.com/ContaAzul/cachet_exporter)
   * [ccache exporter](https://github.com/virtualtam/ccache_exporter)
   * [Dovecot exporter](https://github.com/kumina/dovecot_exporter)
   * [Dnsmasq exporter](https://github.com/google/dnsmasq_exporter)
   * [eBPF exporter](https://github.com/cloudflare/ebpf_exporter)
   * [Ethereum Client exporter](https://github.com/31z4/ethereum-prometheus-exporter)
   * [Hostapd Exporter](https://stash.i2cat.net/scm/~miguel_catalan/hostapd_prometheus_exporter.git)
   * [JMeter plugin](https://github.com/johrstrom/jmeter-prometheus-plugin)
   * [Kannel exporter](https://github.com/apostvav/kannel_exporter)
   * [Kemp LoadBalancer exporter](https://github.com/giantswarm/prometheus-kemp-exporter)
   * [Kibana Exporter](https://github.com/pjhampton/kibana-prometheus-exporter)
   * [kube-state-metrics](https://github.com/kubernetes/kube-state-metrics)
   * [Meteor JS web framework exporter](https://atmospherejs.com/sevki/prometheus-exporter)
   * [Minecraft exporter module](https://github.com/Baughn/PrometheusIntegration)
   * [OpenStack exporter](https://github.com/Linaro/openstack-exporter)
   * [oVirt exporter](https://github.com/czerwonk/ovirt_exporter)
   * [PHP-FPM exporter](https://github.com/bakins/php-fpm-exporter)
   * [PowerDNS exporter](https://github.com/ledgr/powerdns_exporter)
   * [Process exporter](https://github.com/ncabatoff/process-exporter)
   * [rTorrent exporter](https://github.com/mdlayher/rtorrent_exporter)
   * [SABnzbd exporter](https://github.com/msroest/sabnzbd_exporter)
   * [Script exporter](https://github.com/adhocteam/script_exporter)
   * [Shield exporter](https://github.com/cloudfoundry-community/shield_exporter)
   * [Smokeping prober](https://github.com/SuperQ/smokeping_prober)
   * [SMTP/Maildir MDA blackbox prober](https://github.com/cherti/mailexporter)
   * [SoftEther exporter](https://github.com/dalance/softether_exporter)
   * [Transmission exporter](https://github.com/metalmatze/transmission-exporter)
   * [Unbound exporter](https://github.com/kumina/unbound_exporter)
   * [WireGuard exporter](https://github.com/MindFlavor/prometheus_wireguard_exporter)
   * [Xen exporter](https://github.com/lovoo/xenstats_exporter)

When implementing a new Prometheus exporter, please follow the
[guidelines on writing exporters](/docs/instrumenting/writing_exporters)
Please also consider consulting the [development mailing
list](https://groups.google.com/forum/#!forum/prometheus-developers).  We are
happy to give advice on how to make your exporter as useful and consistent as
possible.

## Software exposing Prometheus metrics

Some third-party software exposes metrics in the Prometheus format, so no
separate exporters are needed:

   * [App Connect Enterprise](https://github.com/ot4i/ace-docker)
   * [Ballerina](https://ballerina.io/)
   * [Ceph](http://docs.ceph.com/docs/master/mgr/prometheus/)
   * [Collectd](https://collectd.org/wiki/index.php/Plugin:Write_Prometheus)
   * [Concourse](https://concourse-ci.org/)
   * [CRG Roller Derby Scoreboard](https://github.com/rollerderby/scoreboard) (**direct**)
   * [Docker Daemon](https://docs.docker.com/engine/reference/commandline/dockerd/#daemon-metrics)
   * [Doorman](https://github.com/youtube/doorman) (**direct**)
   * [Envoy](https://www.envoyproxy.io/docs/envoy/latest/operations/admin.html#get--stats?format=prometheus)
   * [Etcd](https://github.com/coreos/etcd) (**direct**)
   * [Flink](https://github.com/apache/flink)
   * [FreeBSD Kernel](https://www.freebsd.org/cgi/man.cgi?query=prometheus_sysctl_exporter&apropos=0&sektion=8&manpath=FreeBSD+12-current&arch=default&format=html)
   * [Grafana](http://docs.grafana.org/administration/metrics/)
   * [JavaMelody](https://github.com/javamelody/javamelody/wiki/UserGuideAdvanced#exposing-metrics-to-prometheus)
   * [Kong](https://github.com/Kong/kong-plugin-prometheus)
   * [Kubernetes](https://github.com/kubernetes/kubernetes) (**direct**)
   * [Linkerd](https://github.com/BuoyantIO/linkerd)
   * [mgmt](https://github.com/purpleidea/mgmt/blob/master/docs/prometheus.md)
   * [MidoNet](https://github.com/midonet/midonet)
   * [midonet-kubernetes](https://github.com/midonet/midonet-kubernetes) (**direct**)
   * [Minio](https://github.com/minio/minio)
   * [Netdata](https://github.com/firehol/netdata)
   * [Pretix](https://pretix.eu/)
   * [Quobyte](https://www.quobyte.com/) (**direct**)
   * [RobustIRC](http://robustirc.net/)
   * [ScyllaDB](http://github.com/scylladb/scylla)
   * [Skipper](https://github.com/zalando/skipper)
   * [SkyDNS](https://github.com/skynetservices/skydns) (**direct**)
   * [Telegraf](https://github.com/influxdata/telegraf/tree/master/plugins/outputs/prometheus_client)
   * [Traefik](https://github.com/containous/traefik)
   * [VerneMQ](https://github.com/vernemq/vernemq)
   * [Weave Flux](https://github.com/weaveworks/flux)

The software marked *direct* is also directly instrumented with a Prometheus client library.

## Other third-party utilities

This section lists libraries and other utilities that help you instrument code
in a certain language. They are not Prometheus client libraries themselves but
make use of one of the normal Prometheus client libraries under the hood. As
for all independently maintained software, we cannot vet all of them for best
practices.

   * Clojure: [iapetos](https://github.com/clj-commons/iapetos) 
   * Go: [go-metrics instrumentation library](https://github.com/armon/go-metrics)
   * Go: [gokit](https://github.com/peterbourgon/gokit)
   * Go: [prombolt](https://github.com/mdlayher/prombolt)
   * Java/JVM: [EclipseLink metrics collector](https://github.com/VitaNuova/eclipselinkexporter)
   * Java/JVM: [Hystrix metrics publisher](https://github.com/ahus1/prometheus-hystrix)
   * Java/JVM: [Jersey metrics collector](https://github.com/VitaNuova/jerseyexporter)
   * Java/JVM: [Micrometer Prometheus Registry](https://micrometer.io/docs/registry/prometheus)
   * Python-Django: [django-prometheus](https://github.com/korfuri/django-prometheus)
   * Node.js: [swagger-stats](https://github.com/slanatech/swagger-stats)
