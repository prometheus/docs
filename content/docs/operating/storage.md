---
title: Storage
nav_icon: database
sort_rank: 2
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

PromQL queries that involve a high number of time series will make heavy use of
the LevelDB backed indices. If you need to run queries of that kind, tweaking
the index cache sizes might be required. The following flags are relevant:

* `-storage.local.index-cache-size.label-name-to-label-values`: For regular
  expression matching.
* `-storage.local.index-cache-size.label-pair-to-fingerprints`: Increase the
  size if a large number of time series share the same label pair or name.
* `-storage.local.index-cache-size.fingerprint-to-metric` and
  `-storage.local.index-cache-size.fingerprint-to-timerange`: Increase the size
  if you have a large number of archived time series, i.e. series that have not
  received samples in a while but are still not old enough to be purged
  completely.

You have to experiment with the flag values to find out what helps. If a query
touches 100,000+ time series, hundreds of MiB might be reasonable. If you have
plenty of free memory available, using more of it for LevelDB cannot harm.

## Disk usage

Prometheus stores its on-disk time series data under the directory specified by
the flag `storage.local.path`. The default path is `./data` (relative to the
working directory), which is good to try something out quickly but most likely
not what you want for actual operations. The flag `storage.local.retention`
allows you to configure the retention time for samples. Adjust it to your needs
and your available disk space.

## Chunk encoding

Prometheus currently offers three different types of chunk encodings. The chunk
encoding for newly created chunks is determined by the
`-storage.local.chunk-encoding-version` flag. The valid values are 0, 1,
or 2.

Type 0 is the simple delta encoding implemented for Prometheus's first chunked
storage layer. Type 1 is the current default encoding, a double-delta encoding
with much better compression behavior than type 0. Both encodings feature a
fixed byte width per sample over the whole chunk, which allows fast random
access. While type 0 is the fastest encoding, the difference in encoding cost
compared to encoding 1 is tiny. Due to the better compression behavior of type
1, there is really no reason to select type 0 except compatibility with very
old Prometheus versions.

Type 2 is a variable bit-width encoding, i.e. each sample in the chunk can use
a different number of bits. Timestamps are double-delta encoded, too, but with
a slightly different algorithm. A number of different encoding schemes are
available for sample values. The choice is made per chunk based on the nature
of the sample values (constant, integer, regularly increasing, random…). Major
parts of the type 2 encoding are inspired by a paper published by Facebook
engineers:
[_Gorilla: A Fast, Scalable, In-Memory Time Series Database_](http://www.vldb.org/pvldb/vol8/p1816-teller.pdf).

With type 2, access within a chunk has to happen sequentially, and the encoding
and decoding cost is a bit higher. Overall, type 2 will cause more CPU usage
and increased query latency compared to type 1 but offers a much improved
compression ratio. The exact numbers depend heavily on the data set and the
kind of queries. Below are results from a typical production server with a
fairly expensive set of recording rules.

Chunk type | bytes per sample | cores | rule evaluation duration
:------:|:-----:|:----:|:----:
1 | 3.3 | 1.6 | 2.9s
2 | 1.3 | 2.4 | 4.9s

You can change the chunk encoding each time you start the server, so
experimenting with your own use case is encouraged. Take into account, however,
that only newly created chunks will use the newly selected chunk encoding, so
it will take a while until you see the effects.


## Settings for high numbers of time series

Prometheus can handle millions of time series. However, you have to adjust the
storage settings to handle much more than 100,000 active time
series. Essentially, you want to allow a certain number of chunks for each time
series to be kept in RAM. The default value for the
`storage.local.memory-chunks` flag (discussed above) is 1048576. Up to about
300,000 series, you still have three chunks available per series on
average. For more series, you should increase the `storage.local.memory-chunks`
value. Three times the number of series is a good first approximation. But keep
the implication for memory usage (see above) in mind.

If you have more active time series than configured memory chunks, Prometheus
will inevitably run into a sitation where it has to keep more chunks in memory
than configured. If the number of chunks goes more than 10% above the
configured limit, Prometheus will throttle ingestion of more samples (by
skipping scrapes and rule evaluations) until the configured value is exceeded
by less than 5%. _Throttled ingestion is really bad for various reasons. You
really do not want to be in that situation._

Equally important, especially if writing to a spinning disk, is raising the
value for the `storage.local.max-chunks-to-persist` flag. As a rule of thumb,
keep it around 50% of the `storage.local.memory-chunks`
value. `storage.local.max-chunks-to-persist` controls how many chunks can be
waiting to be written to your storage device, may it be spinning disk or SSD
(which contains neither a disk nor a drive motor but we will refer to it as
“disk“ for the sake of simplicity). If that number of waiting chunks is
exceeded, Prometheus will once more throttle sample ingestion until the number
has dropped to 95% of the configured value. Before that happens, Prometheus
will try to speed up persisting chunks. See the
[section about persistence pressure](#persistence-pressure-and-rushed-mode)
below.

The more chunks you can keep in memory per time series, the more write
operations can be batched, which is especially important for spinning
disks. Note that each active time series will have an incomplete head chunk,
which cannot be persisted yet. It is a chunk in memory, but not a “chunk to
persist” yet. If you have 1M active time series, you need 3M
`storage.local.memory-chunks` to have three chunks for each series
available. Only 2M of those can be persistable, so setting
`storage.local.max-chunks-to-persist` to more than 2M can easily lead to more
than 3M chunks in memory, despite the setting for
`storage.local.memory-chunks`, which again will lead to the dreaded throttling
of ingestion (but Prometheus will try its best to speed up persisting of chunks
before it happens).

The other drawback of a high value of chunks waiting for persistence is larger
checkpoints.

## Persistence pressure and “rushed mode”

Naively, Prometheus would all the time try to persist completed chunk to disk
as soon as possible. Such a strategy would lead to many tiny write operations,
using up most of the I/O bandwidth and keeping the server quite busy. Spinning
disks are more sensitive here, but even SSDs will not like it. Prometheus tries
instead to batch up write operations as much as possible, which works better if
it is allowed to use more memory. Setting the flags described above to values
that lead to full utilization of the available memory is therefore crucial for
high performance.

Prometheus will also sync series files after each write (with
`storage.local.series-sync-strategy=adaptive`, which is the default) and use
the disk bandwidth for more frequent checkpoints (based on the count of “dirty
series”, see [below](#crash-recovery)), both attempting to minimize data loss
in case of a crash.

But what to do if the number of chunks waiting for persistence grows too much?
Prometheus calculates a score for urgency to persist chunks, which depends on
the number of chunks waiting for persistence in relation to the
`storage.local.max-chunks-to-persist` value and on how much the number of
chunks in memory exceeds the `storage.local.memory-chunks` value (if at all,
and only if there is a minimum number of chunks waiting for persistence so that
faster persisting of chunks can help at all). The score is between 0 and 1,
where 1 corresponds to the highest unrgency. Depending on the score, Prometheus
will write to disk more frequently. Should the score ever pass the threshold
of 0.8, Prometheus enters “rushed mode” (which you can see in the logs). In
rushed mode, the following strategies are applied to speed up persisting chunks:

* Series files are not synced after write operations anymore (making better use
  of the OS's page cache at the price of an increased risk of losing data in
  case of a server crash – this behavior can be overridden with the flag
  `storage.local.series-sync-strategy`).
* Checkpoints are only created as often as configured via the
  `storage.local.checkpoint-interval` flag (freeing more disk bandwidth for
  persisting chunks at the price of more data loss in case of a crash and an
  increased time to run the subsequent crash recovery).
* Write operations to persist chunks are not throttled anymore and performed as
  fast as possible.

Prometheus leaves rushed mode once the score has dropped below 0.7.

## Settings for very long retention time

If you have set a very long retention time via the `storage.local.retention`
flag (more than a month), you might want to increase the flag value
`storage.local.series-file-shrink-ratio`.

Whenever Prometheus needs to cut off some chunks from the beginning of a series
file, it will simply rewrite the whole file. (Some file systems support “head
truncation”, which Prometheus currently does not use for several reasons.) To
not rewrite a very large series file to get rid of very few chunks, the rewrite
only happens if at least 10% of the chunks in the series file are removed. This
value can be changed via the mentioned `storage.local.series-file-shrink-ratio`
flag. If you have a lot of disk space but want to minimize rewrites (at the
cost of wasted disk space), increase the flag value to higher values, e.g. 0.3
for 30% of required chunk removal.

## Helpful metrics

Out of the metrics that Prometheus exposes about itself, the following are
particularly useful for tuning the flags above:

* `prometheus_local_storage_memory_series`: The current number of series held
  in memory.
* `prometheus_local_storage_memory_chunks`: The current number of chunks held
  in memory.
* `prometheus_local_storage_chunks_to_persist`: The number of memory chunks
  that still need to be persisted to disk.
* `prometheus_local_storage_persistence_urgency_score`: The urgency score as
  discussed [above](#persistence-pressure-and-rushed-mode).
* `prometheus_local_storage_rushed_mode` is 1 if Prometheus is in “rushed
  mode”, 0 otherwise.

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
