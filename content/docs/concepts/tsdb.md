---
title: TSDB
sort_rank: 5
---

A times series is a series of **samples**. Each sample is a two-tuple consisting of a timestamp and a value:

Example time series: the weather in Austin, TX.

```
[
    (June 15th 2018 1:00 pm, 20.0 C),
    (June 15th 2018 1:05 pm, 20.2 C),
    (June 15th 2018 1:10 pm, 20.1 C),
    ...
]
```

Element | Precision | Data type
:-------|:----------|:---------
Timestamp | Millisecond | [int64](https://golang.org/pkg/builtin/#int64)
Value | Depends on the use case | [float64](https://golang.org/pkg/builtin/#float64)

## Storage problem

* Millions of separate time series; each series can have millions of samples
* Once stored, the ever-expanding data needs to be easily queryable
* Two dimensions: (1) time series; (2) time range
* Selecting "for" and "against," e.g. `weather{place != "Austin"}` or `weather{place =~ "au.*"}` (regular expression)

The code for TSDB is largely in the `github.com/prometheus/prometheus/tsdb` library for Go. GoDoc: https://godoc.org/github.com/prometheus/prometheus/tsdb.

## Storage mechanics

* Each time series is stored separately
* Compression model taken from Facebook's [Gorilla paper](http://www.vldb.org/pvldb/vol8/p1816-teller.pdf). Gorilla is an in-memory time series database.
  * Timestamps and values are stored separately
  * Samples are stored in chunks of roughly 120 samples. Instead of going directly to a sample you find the proper chunk and *then* drill down to get the sample.

## Internals

[Separate GitHub repo](https://github.com/prometheus/tsdb)

[GoDoc](https://godoc.org/github.com/prometheus/prometheus/tsdb) (not listed under https://godoc.org/github.com/prometheus/prometheus due to separate repo)

You can instantiate a [`DB`](https://godoc.org/github.com/prometheus/tsdb#DB) by specifying a directory in [options](https://godoc.org/github.com/prometheus/tsdb#Options)

which enables you to create an [`Appender`](https://godoc.org/github.com/prometheus/tsdb#Appender). With an `Appender` you can add samples to a time series

## More info

* [Writing a Time Series Database from Scratch](https://fabxc.org/tsdb/)
