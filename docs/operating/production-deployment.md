---
title: Production Deployment Guide
sort_rank: 1
---

# Production Deployment Guide

This guide provides comprehensive recommendations for deploying Prometheus in production environments. It covers hardware requirements, high availability patterns, configuration best practices, and operational considerations for running Prometheus at scale.

## Hardware and Infrastructure Requirements

### Server Specifications

**Memory Requirements**
- **Minimum**: 4GB RAM for small deployments (< 10k active series)
- **Recommended**: 16-32GB RAM for medium deployments (10k-100k active series)
- **Large Scale**: 64GB+ RAM for large deployments (100k+ active series)

**CPU Requirements**
- **Minimum**: 2 CPU cores
- **Recommended**: 4-8 CPU cores for most production workloads
- **Large Scale**: 16+ CPU cores for high-cardinality environments

**Storage Requirements**
- **SSD strongly recommended** for data directory
- **Disk space calculation**: `retention_days * daily_ingestion_rate * compression_ratio`
  - Typical compression ratio: 1.5-3x
  - Example: 30 days * 1GB/day * 2 = 60GB storage needed
- **Separate disk** for WAL (Write-Ahead Log) recommended for high-throughput deployments

### Network Considerations

```yaml
# Recommended firewall rules
ingress:
  - port: 9090    # Prometheus web UI and API
    protocol: TCP
    sources: ["monitoring-subnet", "admin-subnet"]
  
  - port: 9091    # Pushgateway (if used)
    protocol: TCP
    sources: ["application-subnets"]

egress:
  - port: 80/443  # Scraping HTTP/HTTPS targets
    protocol: TCP
    destinations: ["0.0.0.0/0"]
  
  - port: 9100    # Node exporter
    protocol: TCP
    destinations: ["infrastructure-subnets"]
```

## High Availability Deployment Patterns

### Active-Active Configuration

Deploy multiple identical Prometheus instances scraping the same targets:

```yaml
# prometheus-1.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    replica: 'prometheus-1'
    cluster: 'production'

scrape_configs:
  - job_name: 'application-servers'
    static_configs:
      - targets: ['app1:8080', 'app2:8080', 'app3:8080']
```

```yaml
# prometheus-2.yml  
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    replica: 'prometheus-2'
    cluster: 'production'

scrape_configs:
  - job_name: 'application-servers'
    static_configs:
      - targets: ['app1:8080', 'app2:8080', 'app3:8080']
```

**Benefits:**
- No single point of failure
- Load distribution for queries
- Natural data redundancy

**Considerations:**
- Requires deduplication in query layer (Thanos, Cortex, or VictoriaMetrics)
- Double storage requirements
- Alert rule evaluation happens on both instances

### Federation for Hierarchical Scaling

```yaml
# Global Prometheus configuration
scrape_configs:
  - job_name: 'prometheus-federation'
    scrape_interval: 15s
    honor_labels: true
    metrics_path: '/federate'
    params:
      'match[]':
        - '{job=~"prometheus|node|kubernetes-.*"}'
        - 'up'
        - 'prometheus_build_info'
    static_configs:
      - targets:
        - 'prometheus-region-us-east:9090'
        - 'prometheus-region-us-west:9090'
        - 'prometheus-region-eu:9090'
```

## Production Configuration Best Practices

### Storage Configuration

```yaml
# Command line flags for storage optimization
--storage.tsdb.path=/prometheus/data
--storage.tsdb.retention.time=30d
--storage.tsdb.retention.size=100GB
--storage.tsdb.wal-compression
--storage.tsdb.no-lockfile
--web.enable-lifecycle
--web.enable-admin-api
```

### Memory Optimization

```yaml
# Limit memory usage and optimize for large deployments
--storage.tsdb.head-chunks-write-queue-size=10000
--query.max-concurrency=20
--query.timeout=2m
--query.max-samples=50000000
```

### Sample Configuration File

```yaml
# /etc/prometheus/prometheus.yml
global:
  scrape_interval: 30s
  scrape_timeout: 10s
  evaluation_interval: 30s
  external_labels:
    environment: 'production'
    datacenter: 'us-east-1'

rule_files:
  - "/etc/prometheus/rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager-1:9093
          - alertmanager-2:9093
      timeout: 10s

scrape_configs:
  # Prometheus itself
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
    scrape_interval: 30s
    metrics_path: /metrics

  # Node exporter for system metrics
  - job_name: 'node-exporter'
    static_configs:
      - targets: 
          - 'node1:9100'
          - 'node2:9100'
          - 'node3:9100'
    scrape_interval: 30s

  # Application metrics
  - job_name: 'application'
    static_configs:
      - targets:
          - 'app1:8080'
          - 'app2:8080'
    scrape_interval: 15s
    metrics_path: /metrics
    scrape_timeout: 10s

# Remote write for long-term storage (optional)
remote_write:
  - url: "https://remote-storage-endpoint/api/v1/write"
    queue_config:
      capacity: 2500
      max_shards: 200
      min_shards: 1
      max_samples_per_send: 500
      batch_send_deadline: 5s
```

## Container Deployment

### **Official Deployment Examples**

For production-ready deployment configurations, we recommend using the official examples that are maintained and tested:

**📁 Prometheus Examples Repository**
- **Location**: [prometheus/prometheus/documentation/examples](https://github.com/prometheus/prometheus/tree/main/documentation/examples)
- **Maintained**: Versioned with Prometheus releases
- **Tested**: Validated configurations for various deployment scenarios

### **Docker Configuration**

**📋 Basic Docker Setup Example**

```dockerfile
# Example Dockerfile for production Prometheus
FROM prom/prometheus:latest

# Copy configuration
COPY prometheus.yml /etc/prometheus/
COPY rules/ /etc/prometheus/rules/

# Set proper ownership
USER root
RUN chown -R prometheus:prometheus /etc/prometheus/
USER prometheus

# Expose metrics port
EXPOSE 9090

# Use proper entrypoint with production flags
ENTRYPOINT ["/bin/prometheus", \
  "--config.file=/etc/prometheus/prometheus.yml", \
  "--storage.tsdb.path=/prometheus", \
  "--storage.tsdb.retention.time=30d", \
  "--storage.tsdb.wal-compression", \
  "--web.console.libraries=/etc/prometheus/console_libraries", \
  "--web.console.templates=/etc/prometheus/consoles", \
  "--web.enable-lifecycle", \
  "--web.external-url=https://prometheus.company.com"]
```

### **Kubernetes Deployment**

**📋 Recommended Approach**: Use official Helm charts or kustomize examples

**Official Resources**:
- **Prometheus Community Helm Chart**: [prometheus-community/helm-charts](https://github.com/prometheus-community/helm-charts/tree/main/charts/prometheus)
- **Prometheus Operator**: [prometheus-operator/prometheus-operator](https://github.com/prometheus-operator/prometheus-operator)
- **Official Examples**: [prometheus/prometheus examples](https://github.com/prometheus/prometheus/tree/main/documentation/examples)

**📝 Key Kubernetes Considerations**:
- Use StatefulSets for data persistence
- Configure proper resource requests and limits
- Set up horizontal pod autoscaling carefully
- Use persistent volumes for data storage
- Configure proper security contexts
- Set up monitoring and alerting for the Kubernetes deployment itself

**Example Resource Requirements**:
```yaml
# Example resource configuration - adjust for your needs
resources:
  requests:
    memory: "2Gi"
    cpu: "500m"
  limits:
    memory: "4Gi"
    cpu: "2"
```

### **High Availability with Helm**

For production HA deployments, consider the prometheus-community Helm chart with these key configurations:

```bash
# Example Helm installation with HA configuration
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install with custom values for HA
helm install prometheus prometheus-community/prometheus \
  --set server.replicaCount=2 \
  --set server.persistentVolume.size=100Gi \
  --set server.retention=30d \
  --namespace monitoring \
  --create-namespace
```

**📋 Important**: Always customize the values.yaml file for your specific requirements. See the [official chart documentation](https://github.com/prometheus-community/helm-charts/tree/main/charts/prometheus) for all available options.

## Security Hardening

### Authentication and Authorization

```yaml
# Basic auth configuration
basic_auth_users:
  admin: $2a$10$hYoOolb6tZyZQkEJ8T8jIuJ6U.4FK/8e8cDatYQ8F5U0QKa.4QKyC  # admin
  readonly: $2a$10$ZoOJlGqEEzOz5T8uFX5c8elZeT3cxBE8XuqD8qJ2z9F5x8c4U6Ty6   # readonly

# TLS configuration
tls_server_config:
  cert_file: /etc/prometheus/tls/server.crt
  key_file: /etc/prometheus/tls/server.key
  client_ca_file: /etc/prometheus/tls/ca.crt
  client_auth_type: RequireAndVerifyClientCert
```

### Network Security

```bash
# Firewall rules using iptables
# Allow Prometheus web interface from monitoring subnet only
iptables -A INPUT -p tcp --dport 9090 -s 10.0.1.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 9090 -j DROP

# Allow scraping from Prometheus to targets
iptables -A OUTPUT -p tcp --dport 9100 -d 10.0.0.0/16 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 8080 -d 10.0.0.0/16 -j ACCEPT
```

## Monitoring Prometheus Performance

Essential metrics to monitor for Prometheus health:

```promql
# Memory usage
prometheus_tsdb_head_samples_appended_total
prometheus_engine_query_duration_seconds
prometheus_tsdb_symbol_table_size_bytes

# Storage metrics
prometheus_tsdb_blocks_loaded
prometheus_tsdb_compactions_total
prometheus_tsdb_head_series

# Query performance
prometheus_query_duration_seconds
prometheus_engine_queries_concurrent_max
```

## Backup and Disaster Recovery

### Snapshot-based Backup

```bash
#!/bin/bash
# backup-prometheus.sh

PROMETHEUS_URL="http://localhost:9090"
BACKUP_DIR="/backup/prometheus"
DATE=$(date +%Y%m%d_%H%M%S)

# Create snapshot
curl -XPOST $PROMETHEUS_URL/api/v1/admin/tsdb/snapshot

# Get snapshot name
SNAPSHOT=$(ls -t /prometheus/snapshots/ | head -1)

# Copy snapshot to backup location
mkdir -p $BACKUP_DIR/$DATE
cp -r /prometheus/snapshots/$SNAPSHOT $BACKUP_DIR/$DATE/

# Compress backup
tar -czf $BACKUP_DIR/prometheus_backup_$DATE.tar.gz -C $BACKUP_DIR/$DATE .

# Clean up old backups (keep 30 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/prometheus_backup_$DATE.tar.gz"
```

### Recovery Procedure

```bash
#!/bin/bash
# restore-prometheus.sh

BACKUP_FILE="$1"
PROMETHEUS_DATA_DIR="/prometheus"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# Stop Prometheus
systemctl stop prometheus

# Backup current data
mv $PROMETHEUS_DATA_DIR $PROMETHEUS_DATA_DIR.backup.$(date +%s)

# Extract backup
mkdir -p $PROMETHEUS_DATA_DIR
tar -xzf $BACKUP_FILE -C $PROMETHEUS_DATA_DIR

# Set proper permissions
chown -R prometheus:prometheus $PROMETHEUS_DATA_DIR

# Start Prometheus
systemctl start prometheus

echo "Recovery completed from $BACKUP_FILE"
```

## Performance Tuning

### Memory Optimization

```bash
# JVM-style memory flags for Go garbage collection
export GOGC=100          # Default garbage collection target
export GOMEMLIMIT=8GiB   # Set memory limit (Go 1.19+)

# Start Prometheus with memory optimizations
prometheus \
  --storage.tsdb.head-chunks-write-queue-size=10000 \
  --query.max-concurrency=20 \
  --storage.tsdb.min-block-duration=2h \
  --storage.tsdb.max-block-duration=2h
```

### Storage Optimization

```yaml
# Reduce cardinality by dropping unnecessary labels
metric_relabel_configs:
  - source_labels: [__name__]
    regex: 'go_.*'
    action: drop
  - source_labels: [instance]
    regex: '(.*):[0-9]+'
    target_label: instance
    replacement: '${1}'
```

## Troubleshooting Common Issues

### High Memory Usage

```promql
# Check for high cardinality series
topk(10, count by (__name__)({__name__=~".+"}))

# Identify sources of cardinality
prometheus_tsdb_symbol_table_size_bytes
prometheus_tsdb_head_series
```

### Slow Queries

```promql
# Monitor query performance
rate(prometheus_engine_query_duration_seconds_sum[5m]) / 
rate(prometheus_engine_query_duration_seconds_count[5m])

# Check for expensive queries
prometheus_engine_queries_concurrent_max
```

### Storage Issues

```bash
# Check disk space
df -h /prometheus

# Monitor WAL size
du -sh /prometheus/wal/

# Check for corrupted blocks
prometheus_tsdb_blocks_loaded vs expected blocks
```

## Next Steps

After deploying Prometheus in production:

1. Set up [monitoring of Prometheus itself](monitoring-prometheus/)
2. Configure [alerting rules](../practices/alerting.md)
3. Implement [backup procedures](backup-recovery/)
4. Review [security configurations](security.md)
5. Plan for [scaling and performance tuning](performance-tuning/)

---

**Additional Resources:**
- [Prometheus Configuration Reference](https://prometheus.io/docs/prometheus/latest/configuration/configuration/)
- [Storage Documentation](https://prometheus.io/docs/prometheus/latest/storage/)
- [Best Practices](../practices/) 