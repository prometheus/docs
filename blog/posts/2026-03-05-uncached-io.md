---
title: "Uncached I/O in Prometheus"
created_at: 2026-03-05
kind: article
author_name: "Ayoub Mrini (@machine424)"
---

Do you find yourself constantly looking up the difference between `container_memory_usage_bytes`, `container_memory_working_set_bytes`, and `container_memory_rss`? It gets worse when you pick the wrong one to set a memory limit, interpret benchmark results, or debug an OOMKilled container.

You're not alone. There is even a [9-year-old Kubernetes issue](https://github.com/kubernetes/kubernetes/issues/43916) that captures the frustration of many others.

The explanation is simple: RAM is not used in just one way. One of the easiest things to miss is the page cache, and for some containers it can make up most of the memory usage, creating large gaps between those metrics.

<!-- more -->

The [use-uncached-io](https://prometheus.io/docs/prometheus/latest/feature_flags/#use-uncached-io) feature flag was built for exactly this. Prometheus is a database and it does a lot of disk writes, but not every write benefits from the page cache. Compaction writes are a good example, because once written, that data is unlikely to be read again soon.

Bypassing the cache for those writes reduces Prometheus's page cache footprint, which in turn makes its memory usage easier to understand. It also reduces pressure on the shared cache, lowering the risk of evicting data that queries and other reads actually need. If it also lowers CPU overhead from cache allocations and evictions, even better. The only hard requirement was to avoid any significant regression in CPU or disk I/O.

The flag was introduced in Prometheus `v3.5.0` and currently only supports Linux. Under the hood, it uses direct I/O, which requires proper filesystem support and a kernel `v2.4.10` or newer, though you should be fine, as that version shipped nearly 25 years ago.

If direct I/O helps here, why was it not done earlier, and why is it not used everywhere it would help? Because direct I/O comes with strict alignment requirements. Unlike buffered I/O, you cannot simply write any chunk of memory to any position in a file. The file offset, the memory buffer address, and the transfer size all need to be aligned to the logical sector size of the underlying storage device, for example 4096 bytes.

To deal with that, a [`bufio.Writer`](https://pkg.go.dev/bufio#Writer)-like writer, [`directIOWriter`](https://github.com/prometheus/prometheus/blob/ac12e30f99df9d2f68025f0238c0aef95146e94b/tsdb/fileutil/direct_io_writer.go#L46), was implemented. On kernels `v6.1` or newer, Prometheus gets the exact alignment values from [statx](https://man7.org/linux/man-pages/man2/statx.2.html); otherwise, conservative defaults are used.

The `directIOWriter` is currently limited to chunk writes, but that is already a substantial amount of I/O. Benchmarks show a 20-50% reduction in page cache usage, as measured by `container_memory_cache`.

[![benchmark1](/assets/blog/2026-03-05/benchmark1.png)](/assets/blog/2026-03-05/benchmark1.png)
<center><code>container_memory_cache</code> over time, baseline (top) vs. <code>use-uncached-io</code> (bottom)</center>

[![benchmark2](/assets/blog/2026-03-05/benchmark2.png)](/assets/blog/2026-03-05/benchmark2.png)
<center>Memory metrics breakdown, baseline vs. <code>use-uncached-io</code></center>

The work is not done yet, and contributions are welcome. Here are a few areas that could help move the feature closer to General Availability:

### Covering more write paths

Today, direct I/O is only used for chunk writes during compaction. Index files and WAL writes are also natural candidates, although they would need some additional work.

### Building more confidence around `directIOWriter`

All existing TSDB tests can be run against the `directIOWriter` using a dedicated build tag: `go test --tags=forcedirectio ./tsdb/`. More unit tests covering edge cases for the writer itself would still be welcome, and there is even an idea of formally verifying that it never violates the alignment requirements.

### Experimenting with `RWF_DONTCACHE`

Introduced in Linux kernel `v6.14`, `RWF_DONTCACHE` enables uncached buffered I/O, where data still goes through the page cache, but the corresponding pages are dropped afterwards. It would be worth benchmarking whether this can deliver similar benefits without direct I/O's alignment constraints.

### Support beyond Linux

Support is currently Linux-only. Contributions to extend it to other operating systems are welcome.


For more details, see the [proposal](https://github.com/prometheus/proposals/blob/main/proposals/0045-direct-io.md) and the [PR](https://github.com/prometheus/prometheus/pull/15365) that introduced the feature.
