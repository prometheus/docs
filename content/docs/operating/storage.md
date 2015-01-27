---
title: Storage
nav_icon: database
---

# Storage

Prometheus stores its time series data under the directory specified by the flag
`storage.local.path`. If you suspect problems caused by corruption in the
database, or you simply want to erase the existing database, you can easily
start fresh by deleting the contents of this directory:

   1. Stop Prometheus.
   1. `rm -r <storage path>/*`
   1. Start Prometheus.
