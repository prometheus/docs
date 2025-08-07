---
title: Monitoring Prometheus
sort_rank: 2
---

# Monitoring Prometheus

Meta-monitoring (monitoring your monitoring system) is critical for production reliability. This guide covers essential metrics, alerting rules, and dashboards for monitoring Prometheus infrastructure health.

## Essential Prometheus Metrics

### Memory and Performance Metrics

```promql
# Memory usage by component
prometheus_tsdb_head_samples_appended_total
prometheus_tsdb_symbol_table_size_bytes
prometheus_engine_query_duration_seconds

# Active series and cardinality
prometheus_tsdb_head_series
prometheus_tsdb_head_chunks

# Storage utilization
prometheus_tsdb_blocks_loaded
prometheus_tsdb_compactions_total
prometheus_tsdb_compactions_failed_total
```

### Query Performance Monitoring

```promql
# Query latency percentiles
histogram_quantile(0.95, 
  rate(prometheus_engine_query_duration_seconds_bucket[5m])
)

# Concurrent queries
prometheus_engine_queries_concurrent_max
prometheus_engine_queries

# Slow queries (>30s)
increase(prometheus_engine_query_duration_seconds_bucket{le="30"}[5m])
```

### Ingestion and Scraping Health

```promql
# Samples ingested per second
rate(prometheus_tsdb_head_samples_appended_total[5m])

# Failed scrapes
up == 0

# Scrape duration
prometheus_target_scrapes_exceeded_sample_limit_total
prometheus_target_scrape_duration_seconds
```

### Storage Health

```promql
# WAL disk usage
prometheus_tsdb_wal_fsync_duration_seconds
prometheus_tsdb_wal_corruptions_total

# Compaction metrics
rate(prometheus_tsdb_compactions_total[5m])
prometheus_tsdb_compactions_failed_total

# Block loading issues
prometheus_tsdb_blocks_loaded
prometheus_tsdb_head_truncations_failed_total
```

## Critical Alerting Rules

### **Prometheus Monitoring Mixins**

Instead of maintaining alerting rules inline (which can become outdated), we recommend using the official Prometheus monitoring mixins that are maintained alongside the codebase:

**📋 Official Prometheus Monitoring Mixin**
- **Repository**: [prometheus/prometheus](https://github.com/prometheus/prometheus/tree/main/documentation/prometheus-mixin)
- **Maintained**: Versioned with Prometheus releases
- **Coverage**: Production-ready alerts for Prometheus infrastructure health
- **Installation**: Follow the mixin documentation for your environment

**Key Alert Categories Covered**:
- Prometheus instance health and availability
- High memory usage and resource constraints  
- Query performance and latency issues
- Storage and WAL-related problems
- Target scraping failures and connectivity

**🔗 Additional Community Mixins**:
- [monitoring-mixins/prometheus-mixin](https://monitoring.mixins.dev/prometheus/) - Community-maintained alerts
- [grafana/jsonnet-libs](https://github.com/grafana/jsonnet-libs) - Grafana Labs mixins

### **Example Custom Alerting Rules**

For organizations needing custom alerts beyond the mixins, here are example patterns. **Note**: These are templates that should be adapted and tested for your specific environment:

```yaml
# Example: Custom capacity planning alerts
# ⚠️  Disclaimer: Test thoroughly in your environment before production use
groups:
- name: prometheus.capacity.examples
  rules:
  - alert: PrometheusHighMemoryUsageCustom
    expr: |
      (
        process_resident_memory_bytes{job="prometheus"} / 
        (1024^3)  # Convert to GB
      ) > 8  # Adjust threshold for your deployment
    for: 15m
    labels:
      severity: warning
    annotations:
      summary: "Prometheus {{ $labels.instance }} memory usage is high"
      description: "Memory usage is {{ $value }}GB, consider scaling or optimization."

  - alert: PrometheusIngestionRateIncreasing
    expr: |
      predict_linear(
        rate(prometheus_tsdb_head_samples_appended_total[1h])[4h:], 
        24*3600
      ) > 50000  # Adjust based on your capacity
    for: 30m
    labels:
      severity: warning
    annotations:
      summary: "Prometheus ingestion rate trending high"
      description: "Predicted to exceed 50k samples/sec within 24 hours."
```

**📝 Important Notes**:
- These are **example templates** - adapt thresholds for your environment
- Test thoroughly before deploying to production
- Consider contributing improvements back to the official mixins

## Monitoring Dashboard

### Grafana Dashboard JSON

```json
{
  "dashboard": {
    "title": "Prometheus Overview",
    "panels": [
      {
        "title": "Prometheus Instances Status",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"prometheus\"}",
            "legendFormat": "{{ instance }}"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "process_resident_memory_bytes{job=\"prometheus\"}",
            "legendFormat": "RSS Memory - {{ instance }}"
          },
          {
            "expr": "process_virtual_memory_bytes{job=\"prometheus\"}",
            "legendFormat": "Virtual Memory - {{ instance }}"
          }
        ]
      },
      {
        "title": "Query Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(prometheus_engine_query_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(prometheus_engine_query_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "title": "Active Series",
        "type": "graph",
        "targets": [
          {
            "expr": "prometheus_tsdb_head_series",
            "legendFormat": "{{ instance }}"
          }
        ]
      },
      {
        "title": "Ingestion Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(prometheus_tsdb_head_samples_appended_total[5m])",
            "legendFormat": "Samples/sec - {{ instance }}"
          }
        ]
      },
      {
        "title": "Storage Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "prometheus_tsdb_blocks_loaded",
            "legendFormat": "Blocks Loaded - {{ instance }}"
          }
        ]
      }
    ]
  }
}
```

## Health Check Endpoints

### **Example HTTP Health Checks**

The following are example scripts for monitoring Prometheus health endpoints. **⚠️ Disclaimer**: These are templates that should be tested and adapted for your specific environment - no CI validates these scripts.

```bash
#!/bin/bash
# example-prometheus-health-check.sh
# ⚠️  Test thoroughly in your environment before production use

PROMETHEUS_URL="http://localhost:9090"

# Basic health check
echo "=== Basic Health Check ==="
curl -s "$PROMETHEUS_URL/-/healthy" || echo "Health check failed"

# Readiness check  
echo "=== Readiness Check ==="
curl -s "$PROMETHEUS_URL/-/ready" || echo "Readiness check failed"

# Configuration reload status
echo "=== Configuration Status ==="
CONFIG_STATUS=$(curl -s "$PROMETHEUS_URL/api/v1/status/config" | jq '.status')
echo "Config reload status: $CONFIG_STATUS"

# Target status
echo "=== Target Status ==="
UP_TARGETS=$(curl -s "$PROMETHEUS_URL/api/v1/targets" | jq '.data.activeTargets | map(select(.health == "up")) | length')
TOTAL_TARGETS=$(curl -s "$PROMETHEUS_URL/api/v1/targets" | jq '.data.activeTargets | length')
echo "Healthy targets: $UP_TARGETS/$TOTAL_TARGETS"

# Runtime information
echo "=== Runtime Information ==="
curl -s "$PROMETHEUS_URL/api/v1/status/runtimeinfo" | jq '.'
```

**📝 Usage Notes**:
- Requires `curl` and `jq` to be installed
- Adjust `PROMETHEUS_URL` for your deployment
- Consider adding authentication headers if Prometheus is secured
- Test timeout and error handling for your environment

### Kubernetes Health Checks

```yaml
# Kubernetes probes for Prometheus StatefulSet
livenessProbe:
  httpGet:
    path: /-/healthy
    port: 9090
  initialDelaySeconds: 30
  periodSeconds: 15
  timeoutSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /-/ready
    port: 9090
  initialDelaySeconds: 30
  periodSeconds: 5
  timeoutSeconds: 5
  failureThreshold: 3
```

## Performance Monitoring Queries

### Memory Analysis

```promql
# Top metrics by memory usage
topk(10, 
  prometheus_tsdb_symbol_table_size_bytes + 
  prometheus_tsdb_head_chunks_bytes
)

# Memory usage by component
sum by (job) (process_resident_memory_bytes{job="prometheus"})

# Memory growth rate
increase(process_resident_memory_bytes{job="prometheus"}[1h])
```

### Query Analysis

```promql
# Most expensive queries by duration
topk(10, 
  rate(prometheus_engine_query_duration_seconds_sum[5m]) / 
  rate(prometheus_engine_query_duration_seconds_count[5m])
)

# Query concurrency
prometheus_engine_queries_concurrent_max

# Failed queries
rate(prometheus_engine_queries_total{result="error"}[5m])
```

### Storage Analysis

```promql
# WAL size growth
increase(prometheus_tsdb_wal_segment_current[1h])

# Compaction duration
prometheus_tsdb_compaction_duration_seconds

# Block size distribution
histogram_quantile(0.95, prometheus_tsdb_compaction_chunk_size_bytes_bucket)
```

## Automated Monitoring Scripts

### Daily Health Report

```bash
#!/bin/bash
# daily-prometheus-report.sh

PROMETHEUS_URL="http://localhost:9090"
REPORT_DATE=$(date +%Y-%m-%d)
REPORT_FILE="/var/log/prometheus/daily-report-$REPORT_DATE.txt"

echo "Prometheus Daily Health Report - $REPORT_DATE" > $REPORT_FILE
echo "================================================" >> $REPORT_FILE

# Instance status
echo "Instance Status:" >> $REPORT_FILE
curl -s "$PROMETHEUS_URL/api/v1/query?query=up{job=\"prometheus\"}" | \
  jq -r '.data.result[] | "\(.metric.instance): \(.value[1])"' >> $REPORT_FILE

# Memory usage
echo -e "\nMemory Usage (GB):" >> $REPORT_FILE
curl -s "$PROMETHEUS_URL/api/v1/query?query=process_resident_memory_bytes{job=\"prometheus\"}/1024/1024/1024" | \
  jq -r '.data.result[] | "\(.metric.instance): \(.value[1])"' >> $REPORT_FILE

# Active series
echo -e "\nActive Series:" >> $REPORT_FILE
curl -s "$PROMETHEUS_URL/api/v1/query?query=prometheus_tsdb_head_series" | \
  jq -r '.data.result[] | "\(.metric.instance): \(.value[1])"' >> $REPORT_FILE

# Query performance
echo -e "\nQuery Performance (95th percentile, seconds):" >> $REPORT_FILE
curl -s "$PROMETHEUS_URL/api/v1/query?query=histogram_quantile(0.95, rate(prometheus_engine_query_duration_seconds_bucket[24h]))" | \
  jq -r '.data.result[] | "\(.metric.instance): \(.value[1])"' >> $REPORT_FILE

# Failed scrapes
echo -e "\nFailed Scrapes:" >> $REPORT_FILE
curl -s "$PROMETHEUS_URL/api/v1/query?query=count by (job) (up == 0)" | \
  jq -r '.data.result[] | "\(.metric.job): \(.value[1])"' >> $REPORT_FILE

echo "Report generated: $REPORT_FILE"
```

### Capacity Planning Script

```bash
#!/bin/bash
# capacity-planning.sh

PROMETHEUS_URL="http://localhost:9090"

echo "Prometheus Capacity Planning Report"
echo "=================================="

# Current metrics
CURRENT_SERIES=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=prometheus_tsdb_head_series" | jq '.data.result[0].value[1] | tonumber')
CURRENT_MEMORY=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=process_resident_memory_bytes{job=\"prometheus\"}" | jq '.data.result[0].value[1] | tonumber')
INGESTION_RATE=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=rate(prometheus_tsdb_head_samples_appended_total[1h])" | jq '.data.result[0].value[1] | tonumber')

echo "Current active series: $CURRENT_SERIES"
echo "Current memory usage: $(echo "$CURRENT_MEMORY / 1024 / 1024 / 1024" | bc) GB"
echo "Current ingestion rate: $(echo "$INGESTION_RATE" | bc) samples/sec"

# Projected growth (30 days)
PROJECTED_SERIES=$(echo "$CURRENT_SERIES * 1.1" | bc)  # 10% growth
PROJECTED_MEMORY=$(echo "$CURRENT_MEMORY * 1.1" | bc)

echo -e "\nProjected in 30 days (10% growth):"
echo "Projected series: $PROJECTED_SERIES"
echo "Projected memory: $(echo "$PROJECTED_MEMORY / 1024 / 1024 / 1024" | bc) GB"

# Recommendations
if (( $(echo "$CURRENT_SERIES > 500000" | bc -l) )); then
    echo -e "\nRecommendation: Consider horizontal scaling or series optimization"
fi

if (( $(echo "$CURRENT_MEMORY > 8589934592" | bc -l) )); then  # 8GB
    echo -e "\nRecommendation: Monitor memory usage closely, consider memory optimization"
fi
```

## Log Analysis

### Important Log Patterns

```bash
# Monitor Prometheus logs for issues
tail -f /var/log/prometheus/prometheus.log | grep -E "(error|warn|panic|fatal)"

# Common error patterns to watch for:
# - "out of memory"
# - "too many open files"
# - "context deadline exceeded"
# - "compaction failed"
# - "WAL corruption"
```

### Log Aggregation Query (if using Loki)

```logql
# Prometheus error analysis
{job="prometheus"} |= "error" | json | line_format "{{ .level }}: {{ .msg }}"

# Memory pressure indicators
{job="prometheus"} |~ "memory|OOM|out of memory"

# Query performance issues
{job="prometheus"} |~ "slow|timeout|deadline exceeded"
```

## Troubleshooting Playbook

### High Memory Usage

1. **Check active series**: `prometheus_tsdb_head_series`
2. **Identify high-cardinality metrics**: Use cardinality analysis queries
3. **Review scrape configurations**: Look for unnecessary labels
4. **Consider series dropping**: Use `metric_relabel_configs`

### Slow Queries

1. **Enable query logging**: `--query.log_file` flag
2. **Analyze query patterns**: Review most expensive queries
3. **Optimize query structure**: Use recording rules for complex queries
4. **Increase query timeout**: `--query.timeout` if appropriate

### Storage Issues

1. **Check disk space**: Monitor filesystem usage
2. **Review retention settings**: Adjust retention time/size
3. **Monitor compaction**: Check for failed compactions
4. **WAL monitoring**: Watch WAL size growth

## Integration with External Monitoring

### Exporting Metrics to Another Prometheus

```yaml
# Remote write configuration for meta-monitoring
remote_write:
  - url: "http://meta-prometheus:9090/api/v1/write"
    queue_config:
      capacity: 10000
      max_samples_per_send: 1000
    write_relabel_configs:
      - source_labels: [__name__]
        regex: "prometheus_.*"
        action: keep
```

### Alertmanager Integration

```yaml
# Alertmanager configuration for Prometheus alerts
route:
  group_by: ['alertname', 'instance']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'prometheus-alerts'
  routes:
  - match:
      severity: critical
    receiver: 'prometheus-critical'

receivers:
- name: 'prometheus-alerts'
  slack_configs:
  - api_url: 'YOUR_SLACK_WEBHOOK'
    channel: '#prometheus-alerts'
    
- name: 'prometheus-critical'
  pagerduty_configs:
  - service_key: 'YOUR_PAGERDUTY_KEY'
```

---

This monitoring setup ensures your Prometheus infrastructure remains healthy and performant. Regular monitoring of these metrics and alerts will help you maintain reliable monitoring for your production environments. 