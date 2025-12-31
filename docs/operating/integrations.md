---
title: Integrations
sort_rank: 5
---

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

 * [Kuma](https://github.com/kumahq/kuma/tree/master/app/kuma-prometheus-sd)
 * [Lightsail](https://github.com/n888/prometheus-lightsail-sd)
 * [Netbox](https://github.com/FlxPeters/netbox-prometheus-sd)
 * [Packet](https://github.com/packethost/prometheus-packet-sd)
 * [Scaleway](https://github.com/scaleway/prometheus-scw-sd)

## Remote Endpoints and Storage

The [remote write](/docs/operating/configuration/#remote_write) and [remote read](/docs/operating/configuration/#remote_read)
features of Prometheus allow transparently sending and receiving samples. This
is primarily intended for long term storage. It is recommended that you perform
careful evaluation of any solution in this space to confirm it can handle your
data volumes.

  * [AppOptics](https://github.com/solarwinds/prometheus2appoptics): write
  * [AWS Timestream](https://github.com/dpattmann/prometheus-timestream-adapter): read and write
  * [Azure Data Explorer](https://github.com/cosh/PrometheusToAdx): read and write
  * [Azure Event Hubs](https://github.com/bryanklewis/prometheus-eventhubs-adapter): write
  * [Chronix](https://github.com/ChronixDB/chronix.ingester): write
  * [Cortex](https://github.com/cortexproject/cortex): read and write
  * [CrateDB](https://github.com/crate/crate_adapter): read and write
  * [Elasticsearch](https://www.elastic.co/guide/en/beats/metricbeat/master/metricbeat-metricset-prometheus-remote_write.html): write
  * [Gnocchi](https://gnocchi.osci.io/prometheus.html): write
  * [Google BigQuery](https://github.com/KohlsTechnology/prometheus_bigquery_remote_storage_adapter): read and write
  * [Google Cloud Spanner](https://github.com/google/truestreet): read and write
  * [Grafana Mimir](https://github.com/grafana/mimir): read and write
  * [Graphite](https://github.com/prometheus/prometheus/tree/main/documentation/examples/remote_storage/remote_storage_adapter): write
  * [GreptimeDB](https://github.com/GreptimeTeam/greptimedb): read and write
  * [InfluxDB](https://docs.influxdata.com/influxdb/v1.8/supported_protocols/prometheus): read and write
  * [Instana](https://www.instana.com/docs/ecosystem/prometheus/#remote-write): write
  * [IRONdb](https://github.com/circonus-labs/irondb-prometheus-adapter): read and write
  * [Kafka](https://github.com/Telefonica/prometheus-kafka-adapter): write
  * [M3DB](https://m3db.io/docs/integrations/prometheus/): read and write
  * [Mezmo](https://docs.mezmo.com/telemetry-pipelines/prometheus-remote-write-pipeline-source): write
  * [New Relic](https://docs.newrelic.com/docs/set-or-remove-your-prometheus-remote-write-integration): write
  * [OpenTSDB](https://github.com/prometheus/prometheus/tree/main/documentation/examples/remote_storage/remote_storage_adapter): write
  * [QuasarDB](https://doc.quasardb.net/master/user-guide/integration/prometheus.html): read and write
  * [SignalFx](https://github.com/signalfx/metricproxy#prometheus): write
  * [Splunk](https://github.com/kebe7jun/ropee): read and write
  * [Sysdig Monitor](https://docs.sysdig.com/en/docs/installation/prometheus-remote-write/): write
  * [TiKV](https://github.com/bragfoo/TiPrometheus): read and write
  * [Thanos](https://github.com/thanos-io/thanos): read and write
  * [VictoriaMetrics](https://github.com/VictoriaMetrics/VictoriaMetrics): write
  * [Wavefront](https://github.com/wavefrontHQ/prometheus-storage-adapter): write

[Prom-migrator](https://github.com/timescale/promscale/tree/master/migration-tool/cmd/prom-migrator) is a tool for migrating data between remote storage systems.

## Alertmanager Webhook Receiver

For notification mechanisms not natively supported by the Alertmanager, the
[webhook receiver](/docs/alerting/configuration/#webhook_config) allows for integration.

  * [alertmanager-webhook-logger](https://github.com/tomtom-international/alertmanager-webhook-logger): logs alerts
  * [Alertsnitch](https://gitlab.com/yakshaving.art/alertsnitch): saves alerts to a MySQL database
  * [All Quiet](https://allquiet.app/integrations/inbound/prometheus): on-call & incident management
  * [Asana](https://gitlab.com/lupudu/alertmanager-asana-bridge)
  * [AWS SNS](https://github.com/DataReply/alertmanager-sns-forwarder)
  * [Better Uptime](https://docs.betteruptime.com/integrations/prometheus)
  * [Canopsis](https://git.canopsis.net/canopsis-connectors/connector-prometheus2canopsis)
  * [DingTalk](https://github.com/timonwong/prometheus-webhook-dingtalk)
  * [Discord](https://github.com/benjojo/alertmanager-discord)
  * [GitLab](https://docs.gitlab.com/ee/operations/metrics/alerts.html#external-prometheus-instances)
  * [Gotify](https://github.com/DRuggeri/alertmanager_gotify_bridge)
  * [GELF](https://github.com/b-com-software-basis/alertmanager2gelf)
  * [HeyOnCall](https://heyoncall.com/guides/prometheus-integration)
  * [Icinga2](https://github.com/vshn/signalilo)
  * [iLert](https://docs.ilert.com/integrations/prometheus)
  * [IRC Bot](https://github.com/multimfi/bot)
  * [JIRAlert](https://github.com/free/jiralert)
  * [Matrix](https://github.com/matrix-org/go-neb)
  * [Notion](https://github.com/cthtuf/alertmanager-to-notion): creates/updates record in a Notion database
  * [Phabricator / Maniphest](https://github.com/knyar/phalerts)
  * [prom2teams](https://github.com/idealista/prom2teams): forwards notifications to Microsoft Teams
  * [Ansible Tower](https://github.com/pja237/prom2tower): call Ansible Tower (AWX) API on alerts (launch jobs etc.)
  * [Signal](https://github.com/dgl/alertmanager-webhook-signald)
  * [SIGNL4](https://www.signl4.com/blog/portfolio_item/prometheus-alertmanager-mobile-alert-notification-duty-schedule-escalation)
  * [Simplepush](https://codeberg.org/stealth/alertpush)
  * [SMS](https://github.com/messagebird/sachet): supports [multiple providers](https://github.com/messagebird/sachet/blob/master/examples/config.yaml)
  * [SNMP traps](https://github.com/maxwo/snmp_notifier)
  * [Squadcast](https://support.squadcast.com/docs/prometheus)
  * [STOMP](https://github.com/thewillyhuman/alertmanager-stomp-forwarder)
  * [Telegram bot](https://github.com/inCaller/prometheus_bot)
  * [xMatters](https://github.com/xmatters/xm-labs-prometheus)
  * [XMPP Bot](https://github.com/jelmer/prometheus-xmpp-alerts)
  * [Zenduty](https://docs.zenduty.com/docs/prometheus/)
  * [Zoom](https://github.com/Code2Life/nodess-apps/tree/master/src/zoom-alert-2.0)

## Management

Prometheus does not include configuration management functionality, allowing
you to integrate it with your existing systems or build on top of it.

  * [Prometheus Operator](https://github.com/coreos/prometheus-operator): Manages Prometheus on top of Kubernetes
  * [Promgen](https://github.com/line/promgen): Web UI and configuration generator for Prometheus and Alertmanager

## Other

  * [Alert analysis](https://github.com/m0nikasingh/am2ch): Stores alerts into a ClickHouse database and provides alert analysis dashboards
  * [karma](https://github.com/prymitive/karma): alert dashboard
  * [PushProx](https://github.com/RobustPerception/PushProx): Proxy to transverse NAT and similar network setups
  * [Promdump](https://github.com/ihcsim/promdump): kubectl plugin to dump and restore data blocks
  * [Promregator](https://github.com/promregator/promregator): discovery and scraping for Cloud Foundry applications
  * [pint](https://github.com/cloudflare/pint): Prometheus rule linter
