---
title: Storage
nav_icon: database
---

# Storage

Prometheus has a sophisticated local storage subsystem. For indexes,
it uses [LevelDB](https://github.com/google/leveldb). For the bulk
sample data, it has its own custom storage layer, which organizes
sample data in chunks of constant size (1024 bytes payload). These
chunks are then stored on disk in one file per time series.

## Memory usage

Prometheus keeps all the currently used chunks in memory. In addition,
it keeps the most recently used chunks in memory up to a threshold
configurable via the `storage.local.memory-chunks` flag. If you have a
lot of RAM available, you might want to increase it above the default
value of 1048576 (and vice versa, if you run into RAM problems, you
can try to decrease it). Note that the actual RAM usage of your server
will be much higher than what you would expect from multiplying
`storage.local.memory-chunks` by 1024 bytes. There is inevitable
overhead for managing the sample data in the storage layer. Also, your
server is doing many more things than just storing samples. The actual
overhead depends on your usage pattern. In extreme cases, Prometheus
has to keep more chunks in memory than configured because all those
chunks are in use at the same time. You have to experiment a bit. The
metrics `prometheus_local_storage_memory_chunks` and
`process_resident_memory_bytes`, exported by the Prometheus server,
will come in handy. As a rule of thumb, you should have at least three
times more RAM available than needed by the memory chunks alone.

LevelDB is essentially dealing with data on disk and relies on the
disk caches of the operating system for optimal performance. However,
it maintains in-memory caches, whose size you can configure for each
index via the following flags:

* `storage.local.index-cache-size.fingerprint-to-metric`
* `storage.local.index-cache-size.fingerprint-to-timerange`
* `storage.local.index-cache-size.label-name-to-label-values`
* `storage.local.index-cache-size.label-pair-to-fingerprints`

## Disk usage

Prometheus stores its on-disk time series data under the directory
specified by the flag `storage.local.path`. The default path is
`/tmp/metrics`, which is good to try something out quickly but most
likely not what you want for actual operations. The flag
`storage.local.retention` allows you to configure the retention time
for samples. Adjust it to your needs and your available disk space.

## Crash recovery

Prometheus saves chunks to disk as soon as possible after they are
complete. Incomplete chunks are saved to disk during regular
checkpoints. You can configure the checkpoint interval with the flag
`storage.local.checkpoint-interval`. Prometheus creates checkpoints
more frequently than that if too many time series are in a "dirty"
state, i.e. their current incomplete head chunk is not the one that is
contained in the most recent checkpoint. This limit is configurable
via the `storage.local.checkpoint-dirty-series-limit` flag.

Nevertheless, should your server crash, you might still lose data, and
your storage might be left in an inconsistent state. Therefore,
Prometheus performs a crash recovery after an unclean shutdown,
similar to an `fsck` run for a file system. Details about the crash
recovery are logged, so you can use it for forensics if required. Data
that cannot be recovered is moved to a directory called `orphaned`
(located under `storage.local.path`). Remember to delete that data if
you do not need it anymore.

The crash recovery usually takes less than a minute. Should it take much
longer, consult the log to find out what has gone wrong.

## Data corruption

If you suspect problems caused by corruption in the database, you can
enforce a crash recovery by starting the server with the flag
`storage.local.dirty`.

If that does not help, or if you simply want to erase the existing
database, you can easily start fresh by deleting the contents of the
storage directory:

   1. Stop Prometheus.
   1. `rm -r <storage path>/*`
   1. Start Prometheus.
