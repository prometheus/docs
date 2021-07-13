---
title: "Analyzing Prometheus Compaction Efficiency"
created_at: 2021-07-10
kind: article
author_name: Filip Petkovski
---

# Analysing Prometheus compaction efficiency with promtool

The amount of disk space used by Prometheus mostly on the amount of samples stored in the TSDB. The great thing about Prometheus is that the relationship between storage and amount of samples is linear, and on average you need to plan for 1-2 bytes of disk space per sample. A detailed explanation of how this number can be calculated for your individual case can be found in an [article](https://www.robustperception.io/how-much-disk-space-do-prometheus-blocks-use) on the Robust Perception blog.

On some occasions however, you might notice that the storage allocated by Prometheus exceeds this estimation and goes well above what the rule of thumb says it should be. As an illustration, we recently saw a case where a Prometheus instances aws using around 4.5 bytes per sample, twice as much than expected.

## The compaction process

Prometheus keeps all samples from the latest two hours of data in its memory. After the two hour period, samples currently held in memory are compacted into chunks and flushed onto disk. Each chunk contains samples from exactly one series and the maximum number of samples per chunk is 120. If a series contains more than 120 samples, Prometheus will create more than one chunk for that series. In other words, a single chunk always contains data from exactly one series, but the data from one series can be compacted into one or more chunks. 

An efficient compaction process would therefore create chunks with a number of samples as close as possible to the maximum count of 120. A chunk with less than 120 samples might, in absolute terms, use less space on disk than a chunk with exactly 120 samples. But in relative terms, a chunk with 120 samples will tend to have a better size per sample ratio than a chunk with less than 120 samples, leading to a reduction in the total amount of chunks as well as a reduction in the total disk space used by Prometheus.

## Visualizing the compaction efficiency

In order to help visualize how well Prometheus is compacting samples, we extended the `promtool tsdb analyze` command to plot a distribution of how full chunks are relative to their maximum capacity of 120 samples. Running the analysis on a TSDB block consuming the estimated 4.5 bytes per sample (instead of perfect 1.3 bytes) yields the following output.

```
Fullness: Amount of chunks
     10%: #############
     20%: ######
     30%: 
     40%: 
     50%: #####################################
     60%: ######
     70%: 
     80%: 
     90%: 
    100%: ###################################
```

We see that more that a large amount of chunks are just 50% filled out. There is also a significant amount which is less than 10% full. 

As a comparison, running the analysis on a well compacted TSDB block yields the following output:
```
Compaction analysis:
Fullness: Amount of chunks
     10%: #
     20%: 
     30%: 
     40%: ####
     50%: #
     60%: ##
     70%: 
     80%: 
     90%: 
    100%: ##########################################################################################
```

We immediatelly notice that most blocks have chunks at full capacity. The disk usage of this block is just 1.3 bytes per sample.

## Potential reasons for sub-optimal compaction

In the majority of cases, the compaction process is efficient and produces chunks with the ideal size of 1-2 bytes per sample. The efficiency can, however, become degraded when high CPU load is present while compaction is taking place. Prometheus assumes that samples are scraped at regular intervals, but a lack of available CPU can lead to drift in the samples' timestamps. This in turn would reduce the efficience of compacting those samples into chunks.

Another reason for inefficient compaction is high series churn. Each chunk produced by the compaction process contains samples from only one series. A large amount of series with just a few samples will therefore require more chunks of a larger size per sample rate. A good way to find out whether you have high churn in your Prometheus instance is described in [this](https://www.robustperception.io/finding-churning-targets-in-prometheus-with-scrape_series_added) blog post.
