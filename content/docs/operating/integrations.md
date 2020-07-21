---
title: Integrations
sort_rank: 5
---

# Integrations

In addition to [client libraries](/docs/instrumenting/clientlibs/) and
[exporters and related libraries](/docs/instrumenting/exporters/), there are
numerous other generic integration points in Prometheus. This page lists some
of the integrations with these.


Not all integrations are listed here, due to overlapping functionality or still
being in development. The [exporter default
port](https://github.com/prometheus/prometheus/wiki/Default-port-allocations)
wiki page also happens to include a few non-exporter integrations that fit in
these categories.

## File Service Discovery

For service discovery mechanisms not natively supported by Prometheus,
[file-based service discovery](/docs/operating/configuration/#%3Cfile_sd_config%3E) provides an interface for integrating.

 * [Kuma](https://github.com/Kong/kuma/tree/master/app/kuma-prometheus-sd)
 * [Lightsail](https://github.com/n888/prometheus-lightsail-sd)
 * [Packet](https://github.com/packethost/prometheus-packet-sd)
 * [Scaleway](https://github.com/scaleway/prometheus-scw-sd)

## Remote Endpoints and Storage

The [remote write](/docs/operating/configuration/#remote_write) and [remote read](/docs/operating/configuration/#remote_read)
features of Prometheus allow transparently sending and receiving samples. This
is primarily intended for long term storage. It is recommended that you perform
careful evaluation of any solution in this space to confirm it can handle your
data volumes.

  * [AppOptics](https://github.com/solarwinds/prometheus2appoptics): write
  * [Azure Data Explorer](https://github.com/cosh/PrometheusToAdx): read and write
  * [Azure Event Hubs](https://github.com/bryanklewis/prometheus-eventhubs-adapter): write
  * [Chronix](https://github.com/ChronixDB/chronix.ingester): write
  * [Cortex](https://github.com/cortexproject/cortex): read and write
  * [CrateDB](https://github.com/crate/crate_adapter): read and write
  * [Elasticsearch](https://www.elastic.co/guide/en/beats/metricbeat/master/metricbeat-metricset-prometheus-remote_write.html): write
  * [Gnocchi](https://gnocchi.xyz/prometheus.html): write
  * [Google Cloud Spanner](https://github.com/google/truestreet): read and write
  * [Graphite](https://github.com/prometheus/prometheus/tree/master/documentation/examples/remote_storage/remote_storage_adapter): write
  * [InfluxDB](https://docs.influxdata.com/influxdb/latest/supported_protocols/prometheus): read and write
  * [IRONdb](https://github.com/circonus-labs/irondb-prometheus-adapter): read and write
  * [Kafka](https://github.com/Telefonica/prometheus-kafka-adapter): write
  * [M3DB](https://m3db.github.io/m3/integrations/prometheus): read and write
  * [MetricFire](https://www.hostedgraphite.com/docs/prometheus/prometheus.html): read and write
  * [OpenTSDB](https://github.com/prometheus/prometheus/tree/master/documentation/examples/remote_storage/remote_storage_adapter): write
  * [PostgreSQL/TimescaleDB](https://github.com/timescale/prometheus-postgresql-adapter): read and write
  * [QuasarDB](https://doc.quasardb.net/master/user-guide/integration/prometheus.html): read and write
  * [SignalFx](https://github.com/signalfx/metricproxy#prometheus): write
  * [Splunk](https://github.com/kebe7jun/ropee): read and write
  * [TiKV](https://github.com/bragfoo/TiPrometheus): read and write
  * [Thanos](https://github.com/thanos-io/thanos): read and write
  * [VictoriaMetrics](https://github.com/VictoriaMetrics/VictoriaMetrics): write
  * [Wavefront](https://github.com/wavefrontHQ/prometheus-storage-adapter): write

## Alertmanager Webhook Receiver

For notification mechanisms not natively supported by the Alertmanager, the
[webhook receiver](/docs/alerting/configuration/#webhook_config) allows for integration.

  * [alertmanager-webhook-logger](https://github.com/tomtom-international/alertmanager-webhook-logger): logs alerts
  * [Alertsnitch](https://gitlab.com/yakshaving.art/alertsnitch): saves alerts to a MySQL database
  * [AWS SNS](https://github.com/DataReply/alertmanager-sns-forwarder)
  * [DingTalk](https://github.com/timonwong/prometheus-webhook-dingtalk)
  * [GELF](https://github.com/b-com-software-basis/alertmanager2gelf)
  * [IRC Bot](https://github.com/multimfi/bot)
  * [JIRAlert](https://github.com/free/jiralert)
  * [Phabricator / Maniphest](https://github.com/knyar/phalerts)
  * [prom2teams](https://github.com/idealista/prom2teams): forwards notifications to Microsoft Teams
  * [Rocket.Chat](https://rocket.chat/docs/administrator-guides/integrations/prometheus/)
  * [ServiceNow](https://github.com/FXinnovation/alertmanager-webhook-servicenow)
  * [Signal](https://github.com/dgl/alertmanager-webhook-signald)
  * [SMS](https://github.com/messagebird/sachet): supports [multiple providers](https://github.com/messagebird/sachet/blob/master/examples/config.yaml)
  * [SNMP traps](https://github.com/maxwo/snmp_notifier)
  * [Squadcast](https://support.squadcast.com/docs/prometheus)
  * [Telegram bot](https://github.com/inCaller/prometheus_bot)
  * [XMPP Bot](https://github.com/jelmer/prometheus-xmpp-alerts)
  * [Zoom](https://github.com/Code2Life/nodess-apps/tree/master/src/zoom-alert-2.0)

## Management

Prometheus does not include configuration management functionality, allowing
you to integrate it with your existing systems or build on top of it.

  * [Prometheus Operator](https://github.com/coreos/prometheus-operator): Manages Prometheus on top of Kubernetes
  * [Promgen](https://github.com/line/promgen): Web UI and configuration generator for Prometheus and Alertmanager

## Other

  * [karma](https://github.com/prymitive/karma): alert dashboard
  * [PushProx](https://github.com/RobustPerception/PushProx): Proxy to transverse NAT and similar network setups
  * [Promregator](https://github.com/promregator/promregator): discovery and scraping for Cloud Foundry applications
