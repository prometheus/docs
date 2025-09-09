---
title: When (not) to use varbit chunks
created_at: 2016-05-08
kind: article
author_name: Björn “Beorn” Rabenstein
---

The embedded time series database (TSDB) of the Prometheus server organizes the
raw sample data of each time series in chunks of constant 1024 bytes size. In
addition to the raw sample data, a chunk contains some meta-data, which allows
the selection of a different encoding for each chunk. The most fundamental
distinction is the encoding version. You select the version for newly created
chunks via the command line flag `-storage.local.chunk-encoding-version`. Up to
now, there were only two supported versions: 0 for the original delta encoding,
and 1 for the improved double-delta encoding. With release
[0.18.0](https://github.com/prometheus/prometheus/releases/tag/0.18.0), we
added version 2, which is another variety of double-delta encoding. We call it
_varbit encoding_ because it involves a variable bit-width per sample within
the chunk. While version 1 is superior to version 0 in almost every aspect,
there is a real trade-off between version 1 and 2. This blog post will help you
to make that decision. Version 1 remains the default encoding, so if you want
to try out version 2 after reading this article, you have to select it
explicitly via the command line flag. There is no harm in switching back and
forth, but note that existing chunks will not change their encoding version
once they have been created. However, these chunks will gradually be phased out
according to the configured retention time and will thus be replaced by chunks
with the encoding specified in the command-line flag.

<!-- more -->

## What is varbit encoding?

From the beginning, we designed the chunked sample storage for easy addition of
new encodings. When Facebook published a
[paper on their in-memory TSDB Gorilla](http://www.vldb.org/pvldb/vol8/p1816-teller.pdf),
we were intrigued by a number of similarities between the independently
developed approaches of Gorilla and Prometheus. However, there were also many
fundamental differences, which we studied in detail, wondering if we could get
some inspiration from Gorilla to improve Prometheus.

On the rare occasion of a free weekend ahead of me, I decided to give it a
try. In a coding spree, I implemented what would later (after a considerable
amount of testing and debugging) become the varbit encoding.

In a future blog post, I will describe the technical details of the
encoding. For now, you only need to know a few characteristics for your
decision between the new varbit encoding and the traditional double-delta
encoding. (I will call the latter just “double-delta encoding” from now on but
note that the varbit encoding also uses double deltas, just in a different
way.)

## What are the advantages of varbit encoding?

In short: It offers a way better compression ratio. While the double-delta
encoding needs about 3.3 bytes per sample for real-life data sets, the varbit
encoding went as far down as 1.28 bytes per sample on a typical large
production server at SoundCloud. That's almost three times more space efficient
(and even slightly better than the 1.37 bytes per sample reported for Gorilla –
but take that with a grain of salt as the typical data set at SoundCloud might
look different from the typical data set at Facebook).

Now think of the implications: Three times more samples in RAM, three times
more samples on disk, only a third of disk ops, and since disk ops are
currently the bottleneck for ingestion speed, it will also allow ingestion to
be three times faster. In fact, the recently reported new ingestion record of
800,000 samples per second was only possible with varbit chunks – and with an
SSD, obviously. With spinning disks, the bottleneck is reached far earlier, and
thus the 3x gain matters even more.

All of this sounds too good to be true…

## So where is the catch?

For one, the varbit encoding is more complex. The computational cost to encode
and decode values is therefore somewhat increased, which fundamentally affects
everything that writes or reads sample data. Luckily, it is only a proportional
increase of something that usually contributes only a small part to the total
cost of an operation.

Another property of the varbit encoding is potentially way more relevant:
samples in varbit chunks can only be accessed sequentially, while samples in
double-delta encoded chunks are randomly accessible by index. Since writes in
Prometheus are append-only, the different access patterns only affect reading
of sample data. The practical impact depends heavily on the nature of the
originating PromQL query.

A pretty harmless case is the retrieval of all samples within a time
interval. This happens when evaluating a range selector or rendering a
dashboard with a resolution similar to the scrape frequency. The Prometheus
storage engine needs to find the starting point of the interval. With
double-delta chunks, it can perform a binary search, while it has to scan
sequentially through a varbit chunk. However, once the starting point is found,
all remaining samples in the interval need to be decoded sequentially anyway,
which is only slightly more expensive with the varbit encoding.

The trade-off is different for retrieving a small number of non-adjacent
samples from a chunk, or for plainly retrieving a single sample in a so-called
instant query. Potentially, the storage engine has to iterate through a lot of
samples to find the few samples to be returned. Fortunately, the most common
source of instant queries are rule evaluations referring to the latest sample
in each involved time series. Not completely by coincidence, I recently
improved the retrieval of the latest sample of a time series. Essentially, the
last sample added to a time series is cached now. A query that needs only the
most recent sample of a time series doesn't even hit the chunk layer anymore,
and the chunk encoding is irrelevant in that case.

Even if an instant query refers to a sample in the past and therefore has to
hit the chunk layer, most likely other parts of the query, like the index
lookup, will dominate the total query time. But there are real-life queries
where the sequential access pattern required by varbit chunks will start to
matter a lot.

## What is the worst-case query for varbit chunks?

The worst case for varbit chunks is if you need just one sample from somewhere
in the middle of _each_ chunk of a very long time series. Unfortunately, there
is a real use-case for that. Let's assume a time series compresses nicely
enough to make each chunk last for about eight hours. That's about three chunks
a day, or about 100 chunks a month. If you have a dashboard that displays the
time series in question for the last month with a resolution of 100 data
points, the dashboard will execute a query that retrieves a single sample from
100 different chunks. Even then, the differences between chunk encodings will
be dominated by other parts of the query execution time. Depending on
circumstances, my guess would be that the query might take 50ms with
double-delta encoding and 100ms with varbit encoding.

However, if your dashboard query doesn't only touch a single time series but
aggregates over thousands of time series, the number of chunks to access
multiplies accordingly, and the overhead of the sequential scan will become
dominant. (Such queries are frowned upon, and we usually recommend to use a
[recording rule](https://prometheus.io/docs/prometheus/latest/configuration/recording_rules/#recording-rules)
for queries of that kind that are used frequently, e.g. in a dashboard.)  But
with the double-delta encoding, the query time might still have been
acceptable, let's say around one second. After the switch to varbit encoding,
the same query might last tens of seconds, which is clearly not what you want
for a dashboard.

## What are the rules of thumb?

To put it as simply as possible: If you are neither limited on disk capacity
nor on disk ops, don't worry and stick with the default of the classical
double-delta encoding.

However, if you would like a longer retention time or if you are currently
bottle-necked on disk ops, I invite you to play with the new varbit
encoding. Start your Prometheus server with
`-storage.local.chunk-encoding-version=2` and wait for a while until you have
enough new chunks with varbit encoding to vet the effects. If you see queries
that are becoming unacceptably slow, check if you can use
[recording rules](https://prometheus.io/docs/prometheus/latest/configuration/recording_rules/#recording-rules)
to speed them up. Most likely, those queries will gain a lot from that even
with the old double-delta encoding.

If you are interested in how the varbit encoding works behind the scenes, stay
tuned for another blog post in the not too distant future.
