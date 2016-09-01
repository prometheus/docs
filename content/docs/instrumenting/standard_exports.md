---
title: Standard Exports
sort_rank: 7
---

# Standard Exports

This document covers what exports and collectors Prometheus client libraries
should offer, with the aim of consistency across libraries, making the easy use
cases easy and making it easier to provide tooling and consoles for common use
cases.

In addition, client libraries are ENCOURAGED to also offer whatever makes sense
in terms of metrics for their language’s runtime (e.g. Garbage collection
stats).

These exports should have the prefix `process_`. If a language or runtime
doesn't expose one of the variables it'd just not export it. All memory values
in bytes, all times in unixtime/seconds.

## Should

| Metric name                     | Description                                            | Format  |
| ------------------------------- | ------------------------------------------------------ | ------- |
| `process_cpu_seconds_total`     | Total user and system CPU time spent in seconds.       | Seconds |
| `process_open_fds`              | Number of open file descriptors.                       | Integer |
| `process_max_fds`               | Maximum number of open file descriptors.               | Integer |
| `process_virtual_memory_bytes`  | Virtual memory size in bytes.                          | bytes   |
| `process_resident_memory_bytes` | Resident memory size in bytes.                         | bytes   |
| `process_heap_bytes`            | Process heap size in bytes.                            | bytes   |
| `process_start_time_seconds`    | Start time of the process since unix epoch in seconds. | Seconds |

## May

TODO: IDK the names of GC ones...
