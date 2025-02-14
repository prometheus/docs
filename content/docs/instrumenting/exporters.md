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

   * [Aerospike exporter](https://github.com/aerospike/aerospike-prometheus-exporter)
   * [AWS RDS exporter](https://github.com/qonto/prometheus-rds-exporter)
   * [ClickHouse exporter](https://github.com/f1yegor/clickhouse_exporter)
   * [Consul exporter](https://github.com/prometheus/consul_exporter) (**official**)
   * [Couchbase exporter](https://github.com/couchbase/couchbase-exporter)
   * [CouchDB exporter](https://github.com/gesellix/couchdb-exporter)
   * [Druid Exporter](https://github.com/opstree/druid-exporter)
   * [Elasticsearch exporter](https://github.com/prometheus-community/elasticsearch_exporter)
   * [EventStore exporter](https://github.com/marcinbudny/eventstore_exporter)
   * [IoTDB exporter](https://github.com/fagnercarvalho/prometheus-iotdb-exporter)
   * [KDB+ exporter](https://github.com/KxSystems/prometheus-kdb-exporter)
   * [Memcached exporter](https://github.com/prometheus/memcached_exporter) (**official**)
   * [MongoDB exporter](https://github.com/percona/mongodb_exporter)
   * [MongoDB query exporter](https://github.com/raffis/mongodb-query-exporter)
   * [MongoDB Node.js Driver exporter](https://github.com/christiangalsterer/mongodb-driver-prometheus-exporter)
   * [MSSQL server exporter](https://github.com/awaragi/prometheus-mssql-exporter)
   * [MySQL router exporter](https://github.com/rluisr/mysqlrouter_exporter)
   * [MySQL server exporter](https://github.com/prometheus/mysqld_exporter) (**official**)
   * [OpenTSDB Exporter](https://github.com/cloudflare/opentsdb_exporter)
   * [Oracle DB Exporter](https://github.com/iamseth/oracledb_exporter)
   * [PgBouncer exporter](https://github.com/prometheus-community/pgbouncer_exporter)
   * [PostgreSQL exporter](https://github.com/prometheus-community/postgres_exporter)
   * [Presto exporter](https://github.com/yahoojapan/presto_exporter)
   * [ProxySQL exporter](https://github.com/percona/proxysql_exporter)
   * [RavenDB exporter](https://github.com/marcinbudny/ravendb_exporter)
   * [Redis exporter](https://github.com/oliver006/redis_exporter)
   * [RethinkDB exporter](https://github.com/oliver006/rethinkdb_exporter)
   * [SQL exporter](https://github.com/burningalchemist/sql_exporter)
   * [Tarantool metric library](https://github.com/tarantool/metrics)
   * [Twemproxy](https://github.com/stuartnelson3/twemproxy_exporter)

### Hardware related
   * [apcupsd exporter](https://github.com/mdlayher/apcupsd_exporter)
   * [BIG-IP exporter](https://github.com/ExpressenAB/bigip_exporter)
   * [Bosch Sensortec BMP/BME exporter](https://github.com/David-Igou/bsbmp-exporter)
   * [Collins exporter](https://github.com/soundcloud/collins_exporter)
   * [Dell Hardware OMSA exporter](https://github.com/galexrt/dellhw_exporter)
   * [Disk usage exporter](https://github.com/dundee/disk_usage_exporter)
   * [Fortigate exporter](https://github.com/bluecmd/fortigate_exporter)
   * [IBM Z HMC exporter](https://github.com/zhmcclient/zhmc-prometheus-exporter)
   * [IoT Edison exporter](https://github.com/roman-vynar/edison_exporter)
   * [InfiniBand exporter](https://github.com/treydock/infiniband_exporter)
   * [IPMI exporter](https://github.com/soundcloud/ipmi_exporter)
   * [knxd exporter](https://github.com/RichiH/knxd_exporter)
   * [Modbus exporter](https://github.com/RichiH/modbus_exporter)
   * [Netgear Cable Modem Exporter](https://github.com/ickymettle/netgear_cm_exporter)
   * [Netgear Router exporter](https://github.com/DRuggeri/netgear_exporter)
   * [Network UPS Tools (NUT) exporter](https://github.com/DRuggeri/nut_exporter)
   * [Node/system metrics exporter](https://github.com/prometheus/node_exporter) (**official**)
   * [NVIDIA GPU exporter](https://github.com/mindprince/nvidia_gpu_prometheus_exporter)
   * [ProSAFE exporter](https://github.com/dalance/prosafe_exporter)
   * [SmartRAID exporter](https://gitlab.com/calestyo/prometheus-smartraid-exporter)
   * [Waveplus Radon Sensor Exporter](https://github.com/jeremybz/waveplus_exporter)
   * [Weathergoose Climate Monitor Exporter](https://github.com/branttaylor/watchdog-prometheus-exporter)
   * [Windows exporter](https://github.com/prometheus-community/windows_exporter)
   * [Intel® Optane™ Persistent Memory Controller Exporter](https://github.com/intel/ipmctl-exporter)

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
   * [MQTT2Prometheus](https://github.com/hikhvar/mqtt2prometheus)
   * [RabbitMQ exporter](https://github.com/kbudde/rabbitmq_exporter)
   * [RabbitMQ Management Plugin exporter](https://github.com/deadtrickster/prometheus_rabbitmq_exporter)
   * [RocketMQ exporter](https://github.com/apache/rocketmq-exporter)
   * [Solace exporter](https://github.com/solacecommunity/solace-prometheus-exporter)

### Storage
   * [Ceph exporter](https://github.com/digitalocean/ceph_exporter)
   * [Ceph RADOSGW exporter](https://github.com/blemmenes/radosgw_usage_exporter)
   * [Gluster exporter](https://github.com/ofesseler/gluster_exporter)
   * [GPFS exporter](https://github.com/treydock/gpfs_exporter)
   * [Hadoop HDFS FSImage exporter](https://github.com/marcelmay/hadoop-hdfs-fsimage-exporter)
   * [HPE CSI info metrics provider](https://scod.hpedev.io/csi_driver/metrics.html)
   * [HPE storage array exporter](https://hpe-storage.github.io/array-exporter/)
   * [Lustre exporter](https://github.com/HewlettPackard/lustre_exporter)
   * [NetApp E-Series exporter](https://github.com/treydock/eseries_exporter)
   * [Pure Storage exporter](https://github.com/PureStorage-OpenConnect/pure-exporter)
   * [ScaleIO exporter](https://github.com/syepes/sio2prom)
   * [Tivoli Storage Manager/IBM Spectrum Protect exporter](https://github.com/treydock/tsm_exporter)

### HTTP
   * [Apache exporter](https://github.com/Lusitaniae/apache_exporter)
   * [HAProxy exporter](https://github.com/prometheus/haproxy_exporter) (**official**)
   * [Nginx metric library](https://github.com/knyar/nginx-lua-prometheus)
   * [Nginx VTS exporter](https://github.com/sysulq/nginx-vts-exporter)
   * [Passenger exporter](https://github.com/stuartnelson3/passenger_exporter)
   * [Squid exporter](https://github.com/boynux/squid-exporter)
   * [Tinyproxy exporter](https://github.com/gmm42/tinyproxy_exporter)
   * [Varnish exporter](https://github.com/jonnenauha/prometheus_varnish_exporter)
   * [WebDriver exporter](https://github.com/mattbostock/webdriver_exporter)

### APIs
   * [AWS ECS exporter](https://github.com/slok/ecs-exporter)
   * [AWS Health exporter](https://github.com/Jimdo/aws-health-exporter)
   * [AWS SQS exporter](https://github.com/jmal98/sqs_exporter)
   * [Azure Health exporter](https://github.com/FXinnovation/azure-health-exporter)
   * [BigBlueButton](https://github.com/greenstatic/bigbluebutton-exporter)
   * [Cloudflare exporter](https://gitlab.com/gitlab-org/cloudflare_exporter)
   * [Cryptowat exporter](https://github.com/nbarrientos/cryptowat_exporter)
   * [DigitalOcean exporter](https://github.com/metalmatze/digitalocean_exporter)
   * [Docker Cloud exporter](https://github.com/infinityworks/docker-cloud-exporter)
   * [Docker Hub exporter](https://github.com/infinityworks/docker-hub-exporter)
   * [Fastly exporter](https://github.com/peterbourgon/fastly-exporter)
   * [GitHub exporter](https://github.com/githubexporter/github-exporter)
   * [Gmail exporter](https://github.com/jamesread/prometheus-gmail-exporter/)
   * [GraphQL exporter](https://github.com/ricardbejarano/graphql_exporter)
   * [InstaClustr exporter](https://github.com/fcgravalos/instaclustr_exporter)
   * [Mozilla Observatory exporter](https://github.com/Jimdo/observatory-exporter)
   * [OpenWeatherMap exporter](https://github.com/RichiH/openweathermap_exporter)
   * [Pagespeed exporter](https://github.com/foomo/pagespeed_exporter)
   * [Rancher exporter](https://github.com/infinityworks/prometheus-rancher-exporter)
   * [Speedtest exporter](https://github.com/nlamirault/speedtest_exporter)
   * [Tankerkönig API Exporter](https://github.com/lukasmalkmus/tankerkoenig_exporter)

### Logging
   * [Fluentd exporter](https://github.com/V3ckt0r/fluentd_exporter)
   * [Google's mtail log data extractor](https://github.com/google/mtail)
   * [Grok exporter](https://github.com/fstab/grok_exporter)

### FinOps
   * [AWS Cost Exporter](https://github.com/electrolux-oss/aws-cost-exporter)
   * [Azure Cost Exporter](https://github.com/electrolux-oss/azure-cost-exporter)
   * [Kubernetes Cost Exporter](https://github.com/electrolux-oss/kubernetes-cost-exporter)

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
   * [Huawei Cloudeye exporter](https://github.com/huaweicloud/cloudeye-exporter)
   * [InfluxDB exporter](https://github.com/prometheus/influxdb_exporter) (**official**)
   * [ITM exporter](https://github.com/rafal-szypulka/itm_exporter)
   * [Java GC exporter](https://github.com/loyispa/jgc_exporter)
   * [JavaMelody exporter](https://github.com/fschlag/javamelody-prometheus-exporter)
   * [JMX exporter](https://github.com/prometheus/jmx_exporter) (**official**)
   * [Munin exporter](https://github.com/pvdh/munin_exporter)
   * [Nagios / Naemon exporter](https://github.com/Griesbacher/Iapetos)
   * [Neptune Apex exporter](https://github.com/dl-romero/neptune_exporter)
   * [New Relic exporter](https://github.com/mrf/newrelic_exporter)
   * [NRPE exporter](https://github.com/robustperception/nrpe_exporter)
   * [Osquery exporter](https://github.com/zwopir/osquery_exporter)
   * [OTC CloudEye exporter](https://github.com/tiagoReichert/otc-cloudeye-prometheus-exporter)
   * [Pingdom exporter](https://github.com/giantswarm/prometheus-pingdom-exporter)
   * [Promitor (Azure Monitor)](https://promitor.io)
   * [scollector exporter](https://github.com/tgulacsi/prometheus_scollector)
   * [Sensu exporter](https://github.com/reachlin/sensu_exporter)
   * [site24x7_exporter](https://github.com/svenstaro/site24x7_exporter)
   * [SNMP exporter](https://github.com/prometheus/snmp_exporter) (**official**)
   * [StatsD exporter](https://github.com/prometheus/statsd_exporter) (**official**)
   * [TencentCloud monitor exporter](https://github.com/tencentyun/tencentcloud-exporter)
   * [ThousandEyes exporter](https://github.com/sapcc/1000eyes_exporter)
   * [StatusPage exporter](https://github.com/sergeyshevch/statuspage-exporter)

### Miscellaneous

   * [ACT Fibernet Exporter](https://git.captnemo.in/nemo/prometheus-act-exporter)
   * [BIND exporter](https://github.com/prometheus-community/bind_exporter)
   * [BIND query exporter](https://github.com/DRuggeri/bind_query_exporter)
   * [Bitcoind exporter](https://github.com/LePetitBloc/bitcoind-exporter)
   * [Blackbox exporter](https://github.com/prometheus/blackbox_exporter) (**official**)
   * [Bungeecord exporter](https://github.com/weihao/bungeecord-prometheus-exporter)
   * [BOSH exporter](https://github.com/cloudfoundry-community/bosh_exporter)
   * [cAdvisor](https://github.com/google/cadvisor)
   * [Cachet exporter](https://github.com/ContaAzul/cachet_exporter)
   * [ccache exporter](https://github.com/virtualtam/ccache_exporter)
   * [c-lightning exporter](https://github.com/lightningd/plugins/tree/master/prometheus)
   * [DHCPD leases exporter](https://github.com/DRuggeri/dhcpd_leases_exporter)
   * [Dovecot exporter](https://github.com/kumina/dovecot_exporter)
   * [Dnsmasq exporter](https://github.com/google/dnsmasq_exporter)
   * [eBPF exporter](https://github.com/cloudflare/ebpf_exporter)
   * [eBPF network traffic exporter](https://github.com/kasd/texporter)
   * [Ethereum Client exporter](https://github.com/31z4/ethereum-prometheus-exporter)
   * [File statistics exporter](https://github.com/michael-doubez/filestat_exporter)
   * [JFrog Artifactory Exporter](https://github.com/peimanja/artifactory_exporter)
   * [Hostapd Exporter](https://github.com/Fundacio-i2CAT/hostapd_prometheus_exporter)
   * [IBM Security Verify Access / Security Access Manager Exporter](https://gitlab.com/zeblawson/isva-prometheus-exporter)
   * [IPsec exporter](https://github.com/torilabs/ipsec-prometheus-exporter)
   * [IRCd exporter](https://github.com/dgl/ircd_exporter)
   * [Linux HA ClusterLabs exporter](https://github.com/ClusterLabs/ha_cluster_exporter)
   * [JMeter plugin](https://github.com/johrstrom/jmeter-prometheus-plugin)
   * [JSON exporter](https://github.com/prometheus-community/json_exporter)
   * [Kannel exporter](https://github.com/apostvav/kannel_exporter)
   * [Kemp LoadBalancer exporter](https://github.com/giantswarm/prometheus-kemp-exporter)
   * [Kibana Exporter](https://github.com/pjhampton/kibana-prometheus-exporter)
   * [kube-state-metrics](https://github.com/kubernetes/kube-state-metrics)
   * [Locust Exporter](https://github.com/ContainerSolutions/locust_exporter)
   * [Meteor JS web framework exporter](https://atmospherejs.com/sevki/prometheus-exporter)
   * [Minecraft exporter module](https://github.com/Baughn/PrometheusIntegration)
   * [Minecraft exporter](https://github.com/dirien/minecraft-prometheus-exporter)
   * [Nomad exporter](https://gitlab.com/yakshaving.art/nomad-exporter)
   * [nftables exporter](https://github.com/Intrinsec/nftables_exporter)
   * [OpenStack exporter](https://github.com/openstack-exporter/openstack-exporter)
   * [OpenStack blackbox exporter](https://github.com/infraly/openstack_client_exporter)
   * [oVirt exporter](https://github.com/czerwonk/ovirt_exporter)
   * [Pact Broker exporter](https://github.com/ContainerSolutions/pactbroker_exporter)
   * [PHP-FPM exporter](https://github.com/bakins/php-fpm-exporter)
   * [PowerDNS exporter](https://github.com/ledgr/powerdns_exporter)
   * [Podman exporter](https://github.com/containers/prometheus-podman-exporter)
   * [Prefect2 exporter](https://github.com/pathfinder177/prefect2-prometheus-exporter)
   * [Process exporter](https://github.com/ncabatoff/process-exporter)
   * [rTorrent exporter](https://github.com/mdlayher/rtorrent_exporter)
   * [Rundeck exporter](https://github.com/phsmith/rundeck_exporter)
   * [SABnzbd exporter](https://github.com/msroest/sabnzbd_exporter)
   * [SAML exporter](https://github.com/DoodleScheduling/saml-exporter)
   * [Script exporter](https://github.com/adhocteam/script_exporter)
   * [Shield exporter](https://github.com/cloudfoundry-community/shield_exporter)
   * [Smokeping prober](https://github.com/SuperQ/smokeping_prober)
   * [SMTP/Maildir MDA blackbox prober](https://github.com/cherti/mailexporter)
   * [SoftEther exporter](https://github.com/dalance/softether_exporter)
   * [SSH exporter](https://github.com/treydock/ssh_exporter)
   * [Teamspeak3 exporter](https://github.com/hikhvar/ts3exporter)
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

   * [Ansible Automation Platform Automation Controller (AWX)](https://docs.ansible.com/automation-controller/latest/html/administration/metrics.html)
   * [App Connect Enterprise](https://github.com/ot4i/ace-docker)
   * [Ballerina](https://ballerina.io/)
   * [BFE](https://github.com/baidu/bfe)
   * [Caddy](https://caddyserver.com/docs/metrics) (**direct**)
   * [Ceph](https://docs.ceph.com/en/latest/mgr/prometheus/)
   * [CockroachDB](https://www.cockroachlabs.com/docs/stable/monitoring-and-alerting.html#prometheus-endpoint)
   * [Collectd](https://collectd.org/wiki/index.php/Plugin:Write_Prometheus)
   * [Concourse](https://concourse-ci.org/)
   * [CRG Roller Derby Scoreboard](https://github.com/rollerderby/scoreboard) (**direct**)
   * [Diffusion](https://docs.pushtechnology.com/docs/latest/manual/html/administratorguide/systemmanagement/r_statistics.html)
   * [Docker Daemon](https://docs.docker.com/engine/reference/commandline/dockerd/#daemon-metrics)
   * [Doorman](https://github.com/youtube/doorman) (**direct**)
   * [Dovecot](https://doc.dovecot.org/configuration_manual/stats/openmetrics/)
   * [Envoy](https://www.envoyproxy.io/docs/envoy/latest/operations/admin.html#get--stats?format=prometheus)
   * [Etcd](https://github.com/coreos/etcd) (**direct**)
   * [Flink](https://github.com/apache/flink)
   * [FreeBSD Kernel](https://www.freebsd.org/cgi/man.cgi?query=prometheus_sysctl_exporter&apropos=0&sektion=8&manpath=FreeBSD+12-current&arch=default&format=html)
   * [GitLab](https://docs.gitlab.com/ee/administration/monitoring/prometheus/gitlab_metrics.html)
   * [Grafana](https://grafana.com/docs/grafana/latest/administration/view-server/internal-metrics/)
   * [JavaMelody](https://github.com/javamelody/javamelody/wiki/UserGuideAdvanced#exposing-metrics-to-prometheus)
   * [Kong](https://github.com/Kong/kong-plugin-prometheus)
   * [Kubernetes](https://github.com/kubernetes/kubernetes) (**direct**)
   * [LavinMQ](https://lavinmq.com/)
   * [Linkerd](https://github.com/BuoyantIO/linkerd)
   * [mgmt](https://github.com/purpleidea/mgmt/blob/master/docs/prometheus.md)
   * [MidoNet](https://github.com/midonet/midonet)
   * [midonet-kubernetes](https://github.com/midonet/midonet-kubernetes) (**direct**)
   * [MinIO](https://docs.minio.io/docs/how-to-monitor-minio-using-prometheus.html)
   * [PATROL with Monitoring Studio X](https://www.sentrysoftware.com/library/swsyx/prometheus/exposing-patrol-parameters-in-prometheus.html)
   * [Netdata](https://github.com/firehol/netdata)
   * [OpenZiti](https://openziti.github.io)
   * [Pomerium](https://pomerium.com/reference/#metrics-address)
   * [Pretix](https://pretix.eu/)
   * [Quobyte](https://www.quobyte.com/) (**direct**)
   * [RabbitMQ](https://rabbitmq.com/prometheus.html)
   * [RobustIRC](http://robustirc.net/)
   * [ScyllaDB](http://github.com/scylladb/scylla)
   * [Skipper](https://github.com/zalando/skipper)
   * [SkyDNS](https://github.com/skynetservices/skydns) (**direct**)
   * [Telegraf](https://github.com/influxdata/telegraf/tree/master/plugins/outputs/prometheus_client)
   * [Traefik](https://github.com/containous/traefik)
   * [Vector](https://vector.dev)
   * [VerneMQ](https://github.com/vernemq/vernemq)
   * [Flux](https://github.com/fluxcd/flux2)
   * [Xandikos](https://www.xandikos.org/) (**direct**)
   * [Zipkin](https://github.com/openzipkin/zipkin/tree/master/zipkin-server#metrics)

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
