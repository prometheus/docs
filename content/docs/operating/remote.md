---
title: Remote Storage
sort_rank: 3
---

# Remote Storage APIs

CAUTION: Remote Storage APIs are experimental: breaking changes to their
configuration & specification are likely in future releases.

The Remote Storage APIs allow a Prometheus server to send samples and queries
to remote storage systems.  There are separate APIs for writes are reads.  
Configuration of these integrations is done in the
[config file](configuration.md#`<remote_write>`).

## Use Cases

There are different use cases for the Remote Storage APIs.  They are most
commonly used to send data to long term storage.

### Long Term Storage

Samples can be sent to a remote storage system for long term storage and better
durability than a single Prometheus server can offer. TODO

### Datasource Integration

TODO ...

## Known Implementations

The following implementations are know of at this time:

### Cortex

[Cortex](https://github.com/weaveworks/cortex) is an open source, distributed
Prometheus-API-compatible monitoring system which stores data in Amazon DynamoDB
and S3.  Using the remote read and write APIs, Prometheus can send samples and
queries to Cortex.

### InfluxDB

### OpenTSDB

### SQL
