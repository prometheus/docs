---
title: "Uncached I/O in Prometheus"
created_at: 2026-03-05
kind: article
author_name: "Ayoub Mrini (@machine424)"
---

Do you find yourself constantly looking up the difference between `container_memory_usage_bytes`, `container_memory_working_set_bytes`, and `container_memory_rss`? Pick the wrong one and your memory limits lie to you, your benchmarks mislead you, and your container gets OOMKilled.

You're not alone. There is even a [9-year-old Kubernetes issue](https://github.com/kubernetes/kubernetes/issues/43916) that captures the frustration of users.

The explanation is simple: RAM is not used in just one way. One of the easiest things to miss is the [page cache](https://en.wikipedia.org/wiki/Page_cache) semantics. For some containers, memory taken by page caching can make up most of the reported usage, even though that memory is largely reclaimable, creating surprising differences between those metrics.

<!-- more -->

> NOTE: The feature discussed here currently only supports Linux.

Prometheus writes a lot of data to disk. It is, after all, a database. But not every write benefits from sitting in the page cache. Compaction writes are the clearest example: once a block is written, only a fraction of that data is likely to be queried again soon, and since there is no way to predict which fraction, caching it all offers little return. The [use-uncached-io](https://prometheus.io/docs/prometheus/latest/feature_flags/#use-uncached-io) feature flag was built to address exactly this.

Bypassing the cache for those writes reduces Prometheus's page cache footprint, making its memory usage more predictable and easier to reason about. It also relieves pressure on that shared cache, lowering the risk of evicting hot data that queries and other reads actually depend on. A potential bonus is reduced CPU overhead from cache allocations and evictions. The hard constraint throughout was to avoid any measurable regression in CPU or disk I/O.

The flag was introduced in Prometheus `v3.5.0` and currently only supports Linux. Under the hood, it uses direct I/O, which requires proper filesystem support and a kernel `v2.4.10` or newer, though you should be fine, as that version shipped nearly 25 years ago.

If direct I/O helps here, why was it not done earlier, and why is it not used everywhere it would help? Because direct I/O comes with strict alignment requirements. Unlike buffered I/O, you cannot simply write any chunk of memory to any position in a file. The file offset, the memory buffer address, and the transfer size must all be aligned to the logical sector size of the underlying storage device, typically 512 or 4096 bytes.

To satisfy those constraints, a [`bufio.Writer`](https://pkg.go.dev/bufio#Writer)-like writer, [`directIOWriter`](https://github.com/prometheus/prometheus/blob/ac12e30f99df9d2f68025f0238c0aef95146e94b/tsdb/fileutil/direct_io_writer.go#L46), was implemented. On Linux kernels `v6.1` or newer, Prometheus retrieves the exact alignment values via [statx](https://man7.org/linux/man-pages/man2/statx.2.html); on older kernels, conservative defaults are used.

The `directIOWriter` currently covers chunk writes during compaction only, but that alone accounts for a substantial portion of Prometheus's I/O. The results are tangible: benchmarks show a 20–50% reduction in page cache usage, as measured by `container_memory_cache`.

[![benchmark1](/assets/blog/2026-03-05/benchmark1.png)](/assets/blog/2026-03-05/benchmark1.png)
<center><code>container_memory_cache</code> over time, baseline (top) vs. <code>use-uncached-io</code> (bottom)</center>

[![benchmark2](/assets/blog/2026-03-05/benchmark2.png)](/assets/blog/2026-03-05/benchmark2.png)
<center>Memory metrics breakdown, baseline vs. <code>use-uncached-io</code></center>

The work is not done yet, and contributions are welcome. Here are a few areas that could help move the feature closer to General Availability:

### Covering more write paths

Direct I/O is currently limited to chunk writes during compaction. Index files and WAL writes are natural next candidates, although they would require some additional work.

### Building more confidence around `directIOWriter`

All existing TSDB tests can be run against the `directIOWriter` using a dedicated build tag: `go test --tags=forcedirectio ./tsdb/`. More tests covering edge cases for the writer itself would be welcome, and there is even an idea of formally verifying that it never violates alignment requirements.

### Experimenting with `RWF_DONTCACHE`

Introduced in Linux kernel `v6.14`, `RWF_DONTCACHE` enables uncached buffered I/O, where data still goes through the page cache but the corresponding pages are dropped afterwards. It would be worth benchmarking whether this delivers similar benefits without direct I/O's alignment constraints.

### Support beyond Linux

Support is currently Linux-only. Contributions to extend it to other operating systems are welcome.


For more details, see the [proposal](https://github.com/prometheus/proposals/blob/main/proposals/0045-direct-io.md) and the [PR](https://github.com/prometheus/prometheus/pull/15365) that introduced the feature.
