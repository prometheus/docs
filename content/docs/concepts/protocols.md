---
title: Data protocols
sort_rank: 2
---

# Data protocols

Prometheus has supports several methods of ingesting data.
Its primary ingestion method is pull-based scraping of a text-encoded [exposition format](../instrumenting/exposition_formats.md).
This document covers the protocol behavior around the payload rather than the details of the payload itself.

## HTTP

Prometheus only supports ingestion over HTTP, including of protobuf-based formats.
Previous versions of Prometheus supported GRPC but this has been removed.

## List of ingestion methods

* Scrape in native Prometheus text format
* Scrape in Prometheus Proto format over HTTP (metrics.proto)
* Scrape in OpenMetrics text format
* Push via RemoteWrite in Remote Write protobuf format over HTTP (remote.proto)

yes it looks like these are different protos that do not overlap


## Content Negotiation

Prometheus uses the Accept header to determine what exposition text format to send to clients.
If a header fails validation, a metrics source will fall back to the oldest format, Prometheus text format version 0.0.4.

Prometheus text format is: "text/plain" and either version=0.0.4 or version=1.0.0 and then maybe escaping

can also be application/vnd.google.protobuf;proto=io.prometheus.client.MetricFamily;encoding=delimited for proto? I think so, HTTP scraping

OpenMetrics is application/openmetrics-text and 0.0.1 or 1.0.0, also escaping.

## Timeouts

What are the relevant timeouts?

## Text Formats

Talk about how text formats are very similar but not the same

### Prometheus Format

quoting differences with open metrics

### OpenMetrics Format

type/unit, anything else?  maybe need to diff

## Prometheus Protobuf Format

## Remote write

this is proto-based over HTTP