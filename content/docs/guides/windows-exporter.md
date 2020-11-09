---
title: Monitoring Windows host metrics with Windows Exporter
---

# Monitoring Windows host metrics with Windows Exporter

The Prometheus [**Windows Exporter**](https://github.com/prometheus-community/windows_exporter) exposes a wide variety of hardware- and kernel-related metrics.

In this guide, you will:

* Start up a Windows Exporter on Windows host.
* Start up a Prometheus instance on `localhost` that's configured to scrape metrics from the running Windows Exporter

NOTE: While the Prometheus Windows Exporter is for *windows systems, there is the [Node exporter](https://github.com/prometheus/node_exporter) for Linux that serves an analogous purpose.

## Installing and running the Windows Exporter

The Prometheus Windows Exporter is availabe in various formats [via github](https://github.com/prometheus-community/windows_exporter/releases). Once you've downloaded it from Github releases, then run it:

```bash
wget https://github.com/prometheus-community/windows_exporter/releases/download/v0.15.0/windows_exporter-0.15.0-386.msi
./windows_exporter-0.15.0-386.msi
```

You should get prompted so accept all questions so Windows Exporter is now running and exposing metrics on port 9182:


## Windows Exporter metrics

Once the Windows Exporter is installed and running, you can verify that metrics are being exported by cURLing the `/metrics` endpoint:

```bash
curl http://localhost:9182/metrics
```

You should see output like this:

```
# HELP go_gc_duration_seconds A summary of the GC invocation durations.
# TYPE go_gc_duration_seconds summary
go_gc_duration_seconds{quantile="0"} 0
go_gc_duration_seconds{quantile="0.25"} 0
# etc.
```

Success! The Windows Exporter is now exposing metrics that Prometheus can scrape, including a wide variety of system metrics further down in the output (prefixed with `wmi_`). To view those metrics (along with help and type information):

```bash
curl http://localhost:9182/metrics | grep "^wmi_"
```

## Configuring your Prometheus instances

Your Prometheus instance needs to be properly configured in order to access Windows Exporter metrics. The following [`prometheus.yml`](../../prometheus/latest/configuration/configuration/) example configuration file will tell the Prometheus instance to scrape, and how frequently, from the Windows Exporter via (say) `192.168.1.4:9182`:

<a id="config"></a>

```yaml
global:
  scrape_interval: 15s

scrape_configs:
- job_name: windows clients
  static_configs:
  - targets: ['192.168.1.4:9182']   # windowshost ipaddress goes here
```

Continue with [next steps here](node-exporter/#configuring-your-prometheus-instances).
