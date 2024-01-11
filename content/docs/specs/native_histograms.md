---
title: Native Histograms [EXPERIMENTAL]
sort_rank: 6
---

# Native Histograms

Native histograms were introduced as an experimental feature in November 2022.
They are a concept that touches almost every part of the Prometheus stack. The
first version of the Prometheus server supporting native histograms was
v2.40.0. The support had to be enabled via a feature flag
`--enable-feature=native-histograms`. (TODO: This is still the case with the
current release v2.55 and v3.00. Update this section with the stable release,
once it has happened.)

Due to the pervasive nature of the native-histogram related changes, the
documentation of those changes and explanation of the underlying concepts are
widely distributed over various channels (like the documentation of affected
Prometheus components, doc comments in source code, sometimes the source code
itself, design docs, conference talks, …). This document intends to gather all
these pieces of information and present them concisely in a unified context.
This document prefers to link existing detailed documentation rather than
restating it, but it contains enough information to be comprehensible without
referring to other sources. With all that said, it should be noted that this
document is neither suitable as an introduction for beginners nor does it focus
on the needs of developers. For the former, the plan is to provide an updated
version of the [Best Practices article on histograms and
summaries](../../practices/histograms/). For the latter, there is Carrie
Edward's [Developer’s Guide to Prometheus Native
Histograms](https://docs.google.com/document/d/1VhtB_cGnuO2q_zqEMgtoaLDvJ_kFSXRXoE0Wo74JlSY/edit).

While formal specifications are supposed to happen in their respective context
(e.g. OpenMetrics changes will be specified in the general OpenMetrics
specification), some parts of this document take the shape of a specification.
In those parts, the key words “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL
NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “MAY”, and “OPTIONAL” are used as
described in [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119).

The keyword TODO may refer to either of the following:

- Incomplete parts of this document.
- Incomplete implementation of intended native-histogram related changes.

## Introduction

The core idea of native histograms is to treat histograms as first class
citizens in the Prometheus data model. This approach unlocks the features
described in the following, which is the reason why they are called _native
histograms_.

Previously, all Prometheus sample values had been 64-bit floating point values
(short _float64_ or just _float_). These floats can directly represent _gauges_
or _counters_. The Prometheus metric types _summary_ and _histogram_, as they
exist in exposition formats, are broken down into float components upon
ingestion: A _sum_ and a _count_ component for both types, a number of
_quantile_ samples for a summary and a number of _bucket_ samples for a
histogram.

With native histograms, a new structured sample type is introduced. A single
sample represents the previously known _sum_ and _count_ plus a dynamic set of
buckets.

Native histograms have the following key properties:
1. A sparse bucket representation, allowing (near) zero cost for empty buckets.
2. Coverage of the full float64 range of values.
3. No configuration of bucket boundaries during instrumentation.
4. Dynamic resolution picked according to simple configuration parameters.
5. A sophisticated exponential bucketing schema, ensuring mergeability between
   all histograms.
6. An efficient data representation for both exposition and storage.

Compared to the previously existing “classic” histograms, native histograms
allow a higher bucket resolution across arbitrary ranges of observed values at
a lower storage and query cost with very little to no configuration required.
Even partitioning histograms by labels is now much more affordable.

Because the sparse representation (property 1 in the list above) is so crucial
for many of the other benefits of native histograms that_sparse histograms_ was
a common name for _native histograms_ early during the design process. However,
other key properties like the exponential bucketing schema or the dynamic
nature of the buckets are also very important, but not caught at all in the
term _sparse histograms_.

### Design docs

These are the design docs that guided the development of native histograms.
Some details are obsolete now, but they describe rather well the underlying
concepts and how they evolved.

- [Sparse high-resolution histograms for
  Prometheus](https://docs.google.com/document/d/1cLNv3aufPZb3fNfaJgdaRBZsInZKKIHo9E6HinJVbpM/edit),
  the original design doc.
- [Prometheus Sparse Histograms and
  PromQL](https://docs.google.com/document/d/1ch6ru8GKg03N02jRjYriurt-CZqUVY09evPg6yKTA1s/edit),
  more an exploratory document than a proper design doc about the handling of
  native histograms in PromQL.

### Conference talks

A more approachable way of learning about native histograms is to watch
conference talks, of which a selection is presented below. As an introduction,
it might make sense to watch these talks and then return to this document to
learn about all the details and technicalities.

- [Secret History of Prometheus
  Histograms](https://fosdem.org/2020/schedule/event/histograms/) about the
  classic histograms and why Prometheus kept them for so long.
- [Prometheus Histograms – Past, Present, and
  Future](https://promcon.io/2019-munich/talks/prometheus-histograms-past-present-and-future/)
  is the inaugural talk about the new approach that lead to native histograms.
- [Better Histograms for
  Prometheus](https://www.youtube.com/watch?v=HG7uzON-IDM) explains why the
  concepts work out in practice.
- [Native Histograms in
  Prometheus](https://promcon.io/2022-munich/talks/native-histograms-in-prometheus/)
  presents and explains native histograms after the actual implementation.
- [PromQL for Native
  Histograms](https://promcon.io/2022-munich/talks/promql-for-native-histograms/)
  explains the usage of native histograms in PromQL.
- [Prometheus Native Histograms in
  Production](https://www.youtube.com/watch?v=TgINvIK9SYc) provides an analysis
  of performance and resource consumption.
- [Using OpenTelemetry’s Exponential Histograms in
  Prometheus](https://www.youtube.com/watch?v=W2_TpDcess8) covers the
  interoperability with the OpenTelemetry.

## Glossary

- A __native histogram__ is the new complex sample type representing a full
  histogram that this document is about.
- A __classic histogram__ is the older sample type representing a histogram
  with fixed buckets, formerly just called a _histogram_. It exists as such in
  the exposition formats, but is broken into a number of float samples upon
  ingestion into Prometheus.
- __Sparse histogram__ is an older, now deprecated name for _native
  histogram_. This name might still be found occasionally in older
  documentation. __Sparse buckets__ remains a meaningful term for the buckets
  of a native histogram.

## Data model

This section describes the data model of native histograms in general. It
avoids implementation specifics as far as possible. This includes terminology.
For example, a _list_ described in this section will become a _repeated
message_ in a protobuf implementation and (most likely) a _slice_ in a Go
implementation.

### General structure

Similar to a classic histogram, a native histogram has a field for the _count_
of observations and a field for the _sum_ of observations. In addition, it
contains the following components, which are described in detail in dedicated
sections below:

- A _schema_ to identify the method of determining the boundaries of any given
  bucket with an index _i_.
- A sparse representation of indexed buckets, mirrored for positive and
  negative observations.
- A _zero bucket_ to count observations close to zero.
- A list of _custom values_.
- _Exemplars_.

### Flavors

Any native histogram has a specific flavor along each of two independent
dimensions:

1. Counter vs. gauge: Usually, a histogram is “counter like”, i.e. each of its
   buckets acts as a counter of observations. However, there are also “gauge
   like” histograms where each bucket is a gauge, representing arbitrary
   distributions at a point in time. The concept was previously introduced for
   classic histograms by
   [OpenMetrics](https://github.com/OpenObservability/OpenMetrics/blob/main/specification/OpenMetrics.md#gaugehistogram).
2. Integer vs. floating point (short: float): The obvious use case of
   histograms is to count observations, resulting in positive integer numbers
   of observations within each bucket, including the _zero bucket_, and for the
   total _count_ of observations, represented as unsigned 64-bit integers
   (short: uint64). However, there are specific use cases leading to a
   “weighted” or “scaled” histogram, where all of these values are represented
   as 64-bit floating point numbers (short: float64). Note that the _sum_ of
   observations is a float64 in either case.

Float histograms are occasionally used in direct instrumentation for “weighted”
observations, for example to count the number of seconds an observed value was
falling into different buckets of a histogram. The for more common use case for
float histograms is within PromQL, though. PromQL generally only acts on float
values, so the PromQL engine converts every histogram retrieved from the TSDB
to a float histogram first, and any histogram stored back into TSDB via
recording rules is a float histogram. If such a histogram is effectively an
integer histogram (because all non-_sum_ fields are float numbers that
represent integer values), a TSDB implementation MAY convert them back to
integer histograms to increase storage efficiency. (As of Prometheus v2.51, the
TSDB implementation within Prometheus is not utilizing this option.) Note,
however, that the most common PromQL function applied to a counter histogram is
`rate`, which generally produces non-integer numbers, so that results of
recording rules will commonly be float histograms with non-integer values
anyway.

Treating native histograms explicitly as integer histograms vs. float histogram
is a notable deviation from the treatment of conventional simple numeric
samples, which are always treated as floats throughout the whole stack for the
sake of simplicity.

The main reason for the more involved treatment of histograms is the easy
efficiency gains in protobuf-based exposition formats. Protobuf uses varint
encoding for integers, which reduces the data size for small integer values
without requiring an additional compression layer. This benefit is amplified by
the [delta encoding of integer buckets](#buckets), which generally results in
smaller integer values. Floats, in contrast, always require 8 bytes in
protobuf. In practice, many integers in an integer histogram will fit in 1
byte, and most will fit in 2 bytes, so that the explicit presence of integer
histogram in a protobuf-exposition format will directly result in a data size
reduction approaching 8x for histograms with many buckets. This is particularly
relevant as the overwhelming majority of histograms exposed by instrumented
targets are integer histograms.

For similar reasons, representing integer histograms in RAM and on disk is
generally more efficient than float histograms. This is less relevant than the
benefits in the exposition format, though. For one, Prometheus uses
Gorilla-style XOR encoding for floats, which reduces their size, albeit not as
much as the double-delta encoding used for integers. More importantly, an
implementation could always decide to internally use an integer representation
for histogram fields that are effectively integer values (see above).
(Historical note: Prometheus v1 used exactly this approach to improve the
compression of float samples, and Prometheus v2 might very well adopt this
approach again in the future.)

In a counter histogram, the total _count_ of observation and the counts in the
buckets individually behave as Prometheus counters, i.e. they only go down upon
a counter reset. However, the _sum_ of observation may decrease as a
consequence of the observation of negative values. PromQL implementations MUST
detect counter resets based on the whole histogram (see [counter reset
considerations section](#counter-reset-considerations) below for details).
(Note that this always has been a problem for the _sum_ component of classic
histograms and summaries, too. The approach so far was to accept that counter
reset detection silently breaks for _sum_ in those cases. Fortunately, negative
observations are a very rare use case for Prometheus histograms and summaries.)

### Schema

The _schema_ is a signed integer value with a size of 8 bits (short: int8). It
defines the way bucket boundaries are calculated. The currently valid values
are -53 and the range between and including -4 and +8. More schemas may be
added in the future. -53 is a schema for so-called _custom bucket boundaries_
or short _custom buckets_, while the other schema numbers represent the
different standard exponential schemas (short: _standard schemas_).

The standard schemas are mergeable with each other and are RECOMMENDED for
general use cases. Larger schema numbers correspond to higher resolutions.
Schema _n_ has half the resolution of schema _n_+1, which implies that a
histogram with schema _n_+1 can be converted into a histogram with schema _n_
by merging neighboring buckets.

For any standard schema _n_, the boundaries of a bucket with index _i_
calculated as follows (using Python syntax):

- The upper inclusive limit of a positive bucket:
  `(2**2**-n)**i`
- The lower exclusive limit of a positive bucket:
  `(2**2**-n)**(i-1)`
- The lower inclusive limit of a negative bucket:
  `-((2**2**-n)**i)`
- The upper exclusive limit of a negative bucket:
  `-((2**2**-n)**(i-1))`

_i_ is an integer number that may be negative.

There are exceptions to the rules above concerning the largest and smallest
finite values representable as a float64 (called `MaxFloat64` and `MinFloat64`
in the following) and the positive and negative infinity values (`+Inf` and
`-Inf`):

- The positive bucket that contains `MaxFloat64` has an upper inclusive limit
  of `MaxFloat64`.
- The next positive bucket (index _i_+1 relative to the bucket from the
  previous item) has a lower exclusive limit of `MaxFloat64` and an upper
  inclusive limit of `+Inf`. (It could be called a _positive overflow bucket_.)
- The negative bucket that contains `MinFloat64` has a lower inclusive limit
  of `MinFloat64`.
- The next negative bucket (index _i_+1 relative to the bucket from the
  previous item) has an upper exclusive limit of `MinFloat64` and an lower
  inclusive limit of `-Inf`. (It could be called a _negative overflow bucket_.)
- Buckets beyond the `+Inf` and `-Inf` buckets described above MUST NOT be used.
  
There are more exceptions for values close to zero, see the [zero bucket
section](#zero-bucket) below.

The current limits of -4 for the lowest resolution and 8 for the highest
resolution have been chosen based on practical usefulness. Should a practical
need arise for even lower or higher resolution, an extension of the range will
be considered. However, a schema greater than 52 does not make sense as the
growth factor from one bucket to the next would then be smaller than the
difference between representable float64 numbers. Likewise, a schema smaller
than -9 does not make sense either, as the growth factor would then exceed the
largest float representable as float64. Therefore, the schema numbers between
(and including) -9 and +52 are reserved for future standard schemas (following
the formulas for bucket boundaries above) and MUST NOT be used for any other
schemas.

For schema -53, the bucket boundaries are set explicitly via _custom values_,
described in detail in the [custom values section](#custom-values) below. This
results in a native histogram with custom bucket boundaries (or short _custom
buckets_, often further abbreviated to NHCB). Such a histogram can be used to
represent a classic histogram as a native histogram. It could also be used if
the exponential bucketing featured by the standard schemas is a bad match for
the distribution to be represented by the histogram. Histograms with different
custom bucket boundaries are generally not mergeable with each other.
Therefore, schema -53 SHOULD only be used as an informed decision in specific
use cases. (TODO: NHCB aren't fully merged into main as of now (2024-07-18).
They are worked into this document as far as possible already. This information
might not yet be relevant for released Prometheus versions.)

### Buckets

For standard schemas, buckets are represented as two lists, one for positive
buckets and one for negative buckets. For custom buckets (schema -53), only the
positive bucket list is used, but repurposed for all buckets.

Any unpopulated buckets MAY be excluded from the lists. (Which is the reason
why the buckets are often called _sparse buckets_.)

For float histograms, the elements of the lists are float64 and
represent the bucket population directly.

For integer histograms, the elements of the lists are signed 64-bit integers
(short: int64), and each element represents the bucket population as a delta to
the previous bucket in the list. The first bucket in the list contains an
absolute population (i.e. a delta relative to zero).

To map buckets in the lists to the indices as defined in the previous section,
there are two lists of so-called _spans_, one for the positive buckets and one
for the negative buckets.

Each span consists of a pair of numbers, a signed 32-bit integer (short: int32)
called _offset_ and an unsigned 32-bit integer (short: uint32) called _length_.
Only the first span in each list can have a negative offset. It defines the
index of the first bucket in its corresponding bucket list. The length defines
the number of consecutive buckets the bucket list starts with. The offsets of
the following spans define the number of excluded (and thus unpopulated
buckets). The lengths define the number of consecutive buckets in the list
following the excluded buckets.

The sum of all lengths in each span list MUST be equal to the length of the
corresponding bucket list.

Empty spans (with a length of zero) are valid and MAY be used, although they
are generally not useful and they SHOULD be eliminated by adding their offset
to the offset of the following span. Similarly, spans that are not the first
span in a list MAY have an offset of zero, although those offsets SHOULD be
eliminated by adding their length to the previous span. Both cases are allowed
so that producers of native histograms MAY pick whatever representation has the
best resource trade-offs at that moment. For example, if a histogram is
processed through various stages, it might be most efficient to only eliminate
redundant spans after the last processing stage.

In a similar spirit, there are situation where excluding every unpopulated
bucket from the bucket list is most efficient, but in other situations, it
might be better to reduce the number of spans by representing small numbers of
unpopulated buckets explicitly.

Note that future high resolution schemas might require offsets that are too
large to be represented with an int32. An extension of the data model will be
required in that case. (The current standard schema with the highest resolution
is schema 8, for which the bucket that contains `MaxFloat64` has index 262144,
and thus the `+Inf` overflow bucket has index 262145, while the largest number
representable with int32 is 2147483647. The highest standard schema that would
still work with int32 offsets would be schema 20, corresponding to a growth
factor from bucket to bucket of only ~1.000000661.)

#### Example

An integer histogram has the following positive buckets (index→population):

`-2→3, -1→5, 0→0, 1→0, 2→1, 3→0, 4→3, 5→2`

They could be represented in this way:

- Positive bucket list: `[3, 2, -4, 2, -1]`
- Positive span list: `[[-2, 2], [2,1], [1,2]]`

The second and third span could be merged into one if the single unpopulated
bucket with index 3 is represented explicitly, leading to the following result:

- Positive bucket list: `[3, 2, -4, -1, 3, -1]`
- Positive span list: `[[-2, 2], [2,4]]`

Or merge all the spans into one by representing all unpopulated buckets above
explicitly:

- Positive bucket list: `[3, 2, -5, 0, 1, -1, 3, -1]`
- Positive span list: `[[-2, 8]]`

### Zero bucket

Observations of exactly zero do not fit into any bucket as defined by the
standard schemas above. They go to a dedicated bucket called the _zero bucket_.

The number of observations in the zero bucket is tracked by a single uint64
(for integer histograms) or float64 (for float histograms).

The zero bucket has an additional parameter called the _zero threshold_, which
is a float64 ≥ 0. If the threshold is set to zero, only observations of exactly
zero go to the zero bucket, which is the case described above. If the threshold
has a positive value, all observations within the closed interval [-threshold,
+threshold] go to the zero bucket rather than a regular bucket. This has two
use cases:

- Noisy observations close to zero tend to populate a high number of buckets.
  Those observations might happen due to numerical inaccuracies or if the
  source of the observations are actual physical measurements. A zero bucket
  with a relatively small threshold redirects those observations into a single
  bucket.
- If the user is more interested in the long tail of a distribution, far away
  from zero, a relatively large threshold of the zero bucket helps to avoid
  many high resolution buckets for a range that is not of interest.

The threshold of the zero bucket SHOULD coincide with a boundary of a regular
bucket, which avoids the complication of the zero bucket overlapping with parts
of a regular bucket. However, if such an overlap is happening, the observations
that are counted in the regular bucket overlapping with the zero bucket MUST be
outside of the [-threshold, +threshold] interval.

To merge histograms with the same zero threshold, the two zero buckets are
simply added. If the zero thresholds in the source histograms are different,
however, the largest threshold in any of the source histograms is chosen. If
that threshold happens to be within any populated bucket in the other source
histograms, the threshold is increased until one of the following is true for
each source histogram:

- The new threshold coincides with the boundary of a populated bucket.
- The new threshold is not within any populated bucket.

Then the source zero buckets and any source buckets now inside the new
threshold are added up to yield the population of the new zero bucket.

The zero bucket is not used if the schema is -53 (custom buckets).

### Custom values

The list of custom values is unused for standard schemas. It is used by
non-standard schemas in a custom way in case there is need to store additional
data.

The only currently defined schema for which custom values are used is -53
(custom buckets). The remaining part of this section describes the usage of the
custom values in more detail for this specific case.

The custom values represent the upper inclusive boundaries of the custom
buckets. They are sorted in ascending fashion. The custom buckets themselves
are stored using the positive bucket list and the positive span list, although
their boundaries, as determined via the custom values, can be negative. The
index of each of those “positive” buckets defines the zero-based position of
their upper boundary within the custom values list.

The lower exclusive boundary is defined by the custom value preceding the upper
boundary. For the first custom value (at position zero in the lest), there is
no preceding value, in which case the lower boundary is considered to be
`-Inf`. Therefore, the custom bucket with index zero counts all observations
between `-Inf` and the first custom value. In the common case that only
positive observations are expected, the custom bucket with index zero SHOULD
have an upper boundary of zero to clearly mark if there have been any
observations at zero or below. (If there are indeed only positive observations,
the custom bucket with index zero will stay unpopulated and therefore will
never be represented explicitly. The only cost is the additional zero element
at the beginning of the custom values list.)

The last custom value MUST not be `+Inf`. Observations greater than the last
custom value go into an overflow bucket with an upper boundary of `+Inf`. This
overflow bucket is added with an index equal to the length of the custom
values list.

### Exemplars

A native histogram sample can have zero, one, or more exemplars. They work in
the same way as conventional exemplars, but they are organized in a list (as
there can be more than one), and they MUST have a timestamp.

Exemplars from classic histograms MAY be used by native histograms

### Special cases of observed values

Instrumented code SHOULD avoid observing values of `NaN` and `±Inf` because
they make limited sense in the context of a histogram. However, those values
MUST still be handled properly, as described in the following.

The sum of observations is calculated as usual by adding the observation to the
sum of observations, following normal floating point arithmetic. (For example,
an observation of `NaN` will set the sum to `NaN`. An observation of `+Inf`
will set the sum to `+Inf`, unless it is already `NaN` or `-Inf`, in which case
the sum is set to `NaN`.)

An observation of `NaN` goes into no bucket, but increments the count of
observations. This implies that the count of observations can be greater than
the sum of all buckets, and the difference is the number of `NaN` observations.

An observation of `+Inf` or `-Inf` increments the count of observations and
increments a bucket chosen in the following way:
- With a standard exponential schema, a `+Inf` observation increments the
  _positive overflow bucket_ as described above.
- With a standard exponential schema, a `-Inf` observation increments the
  _negative overflow bucket_ as described above.
- With schema -53 (custom buckets), a `+Inf` observation increments the
  bucket with an index equal to the length of the custom values list.
- With schema -53 (custom buckets), a `-Inf` observation increments the
  bucket with index zero.

### OpenTelemetry interoperability

Prometheus (Prom) native histograms with a standard exponential schema can be
easily mapped into an OpenTelemetry (OTel) exponential histogram and vice
versa, as detailed in the following.

The Prom _schema_ is equal to the _scale_ in OTel, with the restriction that
OTel allows lower values than -4 and higher values than +8. As described above,
Prom has reserved more schema numbers to extend its range, should it ever by
required in practice.

The index is offset by one, i.e. a Prom bucket with index _n_ has index _n-1_
for OTel.

OTel has a dense rather than a sparse representation of buckets. One might see
OTel as “Prometheus with only one span”.

The Prom _zero bucket_ is called _zero count_ for OTel, but works the same,
including the existence of a _zero threshold_. Note that OTel implies a
threshold of zero if none is given.

(TODO: The OTel spec reads: “When zero_threshold is unset or 0, this bucket
stores values that cannot be expressed using the standard exponential formula
as well as values that have been rounded to zero.” Double-check if this really
creates the same behavior. If there are problems close to zero, we could make
Prom's spec more precise. If OTel counts NaN in the zero bucket, we have to add
a note here.)

OTel exponential histograms only support standard exponential bucketing schemas
(as the name suggests). Therefore, NHCBs (or native histograms with other future
bucketing schemas) cannot be cleanly converted to OTel exponential histograms.
However, conversion to a conventional OTel histogram with fixed buckets is
still possible.

OTel histograms of any kind have optional fields for the minimum and maximum
value observed in the histogram. These fields have no equivalent concept in
Prometheus because counter histograms accumulate data over a long and
unpredictable timespan and can be scraped at any time, so that tracking a
minimum and maximum value is either infeasible or of limited use. Note, though,
that native histograms enable a fairly accurate estimation of the maximum and
minimum observation during arbitrary timespans, see the [PromQL
section](#promql).

## Exposition formats

Metrics exposition in the classic Prometheus use case is dominated by strings
because all the metric names, label names, and label values take much more
space than the float64 sample values, even if the latter are represented in a
potentially more verbose text form. This was one of the reasons why abandoning
protobuf-based exposition seemed advantageous in the past.

In contrast, a native histogram, following the data model described above,
consists of a lot more numerical data. This amplifies the advantages of a
protobuf based format. Therefore, the previously abandoned protobuf-based
exposition was revived to efficiently expose and scrape native histograms.

### Classic Prometheus formats

At the time native histograms were conceived, OpenMetrics adoption was still
lacking, and in particular, the protobuf version of OpenMetrics had no known
applications at all. Therefore, the initial approach was to extend the classic
Prometheus protobuf formatx to support native histograms. (An additional
practical consideration was that the [Go instrumentation
library](https://github.com/prometheus/client_golang) was still using the
classic protobuf spec as its internal data model, simplifying the initial
development.)

The classic Prometheus text form was not extended for native histograms, and
such an extension is not planned. (See also the [OpenMetrics](#open-metrics)
section below.)

There is a proto2 and a proto3 version of the protobuf specification, which
both create the same wire format:

- [proto2](https://github.com/prometheus/client_model/blob/master/io/prometheus/client/metrics.proto)
- [proto3](https://github.com/prometheus/prometheus/blob/main/prompb/io/prometheus/client/metrics.proto)

These files have comprehensive comments, which should enable an easy mapping
from the proto spec to the data model described above.

Here are relevant parts from the proto3 file:

```protobuf
// [...]

message Histogram {
  uint64 sample_count       = 1;
  double sample_count_float = 4; // Overrides sample_count if > 0.
  double sample_sum         = 2;
  // Buckets for the classic histogram.
  repeated Bucket bucket = 3 [(gogoproto.nullable) = false]; // Ordered in increasing order of upper_bound, +Inf bucket is optional.

  google.protobuf.Timestamp created_timestamp = 15;

  // Everything below here is for native histograms (also known as sparse histograms).
  // Native histograms are an experimental feature without stability guarantees.

  // schema defines the bucket schema. Currently, valid numbers are -4 <= n <= 8.
  // They are all for base-2 bucket schemas, where 1 is a bucket boundary in each case, and
  // then each power of two is divided into 2^n logarithmic buckets.
  // Or in other words, each bucket boundary is the previous boundary times 2^(2^-n).
  // In the future, more bucket schemas may be added using numbers < -4 or > 8.
  sint32 schema           = 5;
  double zero_threshold   = 6; // Breadth of the zero bucket.
  uint64 zero_count       = 7; // Count in zero bucket.
  double zero_count_float = 8; // Overrides sb_zero_count if > 0.

  // Negative buckets for the native histogram.
  repeated BucketSpan negative_span = 9 [(gogoproto.nullable) = false];
  // Use either "negative_delta" or "negative_count", the former for
  // regular histograms with integer counts, the latter for float
  // histograms.
  repeated sint64 negative_delta = 10; // Count delta of each bucket compared to previous one (or to zero for 1st bucket).
  repeated double negative_count = 11; // Absolute count of each bucket.

  // Positive buckets for the native histogram.
  // Use a no-op span (offset 0, length 0) for a native histogram without any
  // observations yet and with a zero_threshold of 0. Otherwise, it would be
  // indistinguishable from a classic histogram.
  repeated BucketSpan positive_span = 12 [(gogoproto.nullable) = false];
  // Use either "positive_delta" or "positive_count", the former for
  // regular histograms with integer counts, the latter for float
  // histograms.
  repeated sint64 positive_delta = 13; // Count delta of each bucket compared to previous one (or to zero for 1st bucket).
  repeated double positive_count = 14; // Absolute count of each bucket.

  // Only used for native histograms. These exemplars MUST have a timestamp.
  repeated Exemplar exemplars = 16;
}

message Bucket {
  uint64   cumulative_count       = 1; // Cumulative in increasing order.
  double   cumulative_count_float = 4; // Overrides cumulative_count if > 0.
  double   upper_bound            = 2; // Inclusive.
  Exemplar exemplar               = 3;
}

// A BucketSpan defines a number of consecutive buckets in a native
// histogram with their offset. Logically, it would be more
// straightforward to include the bucket counts in the Span. However,
// the protobuf representation is more compact in the way the data is
// structured here (with all the buckets in a single array separate
// from the Spans).
message BucketSpan {
  sint32 offset = 1; // Gap to previous span, or starting point for 1st span (which can be negative).
  uint32 length = 2; // Length of consecutive buckets.
}


// A BucketSpan defines a number of consecutive buckets in a native
// histogram with their offset. Logically, it would be more
// straightforward to include the bucket counts in the Span. However,
// the protobuf representation is more compact in the way the data is
// structured here (with all the buckets in a single array separate
// from the Spans).
message BucketSpan {
  sint32 offset = 1; // Gap to previous span, or starting point for 1st span (which can be negative).
  uint32 length = 2; // Length of consecutive buckets.
}

// [...]
```

(TODO: The above does not yet contain the custom values needed for NHCBs. Update
once merged into main.)

Note the following:

- Both native histograms and classic histograms are encoded by the same
  `Histogram` proto message, i.e. the existing `Histogram` message got extended
  with fields for native histograms.
- The fields for the sum and the count of observations are shared between
  classic and native histograms.
- The format originally did not support classic float histograms. While
  extending the format for native histograms, support for classic float
  histograms was added as a byproduct (see fields `sample_count_float`,
  `cumulative_count_float`).
- The `Bucket` field and the `Bucket` message are used for the buckets of a
  classic histogram. It is perfectly possible to create a `Histogram` message
  that represents both a classic and a native version of the same histogram.
  Parsers have the freedom to pick either or both versions (see also the
  [scrape configuration section](#scrape-configuration)).
- The bucket population is encoded as absolute numbers in case of float
  histograms, and as deltas to the previous bucket (or to zero for the first
  bucket) in case of integer histograms. The latter leads to smaler numbers,
  which encode to a smaller message size because protobuf uses varint encoding
  for the `sint64` type.
- A native histogram that has received no observations yet and a classic
  histogram that has no buckets configured would look exactly the same as a
  protobuf message. Therefore, a `Histogram` message that is meant to be parsed
  as a native histogram MUST contain a “no-op span”, i.e. a `BucketSpan` with
  `offset` and `length` set to 0, in the repeated `positive_span` field.
- Any number of exemplars for native histograms MAY be added in the repeated
  `Exemplar` field of the `Histogram` message, but each one MUST have a
  timestamp. If there are no examplars provided in this way, a parser MAY use
  exemplars provided for classic buckets (as at most one exemplar per bucket in
  the `Exemplar` field of the `Bucket` message).
- The number and distribution of native histogram exemplars SHOULD fit the use
  case at hand. Generally, the exemplar payload SHOULD NOT be much larger than
  the remaining part of the `Histogram` message, and the exemplars SHOULD fall
  into different buckets and cover the whole spread of buckets approximately
  evenly. (This is generally preferred over an exemplar distribution that
  proportionally represents the distribution of observations, as the latter
  will rarely yield exemplars from the long tail of a distribution, which are
  often the most interesting exemplars to look at.)

### OpenMetrics

Currently (2024-07-17), OpenMetrics does not support native histograms.

Adding support to the protobuf version of OpenMetrics is relatively
straightforward due to its similarity to the classic Prometheus protobuf
format. A [proposal in the form of a
PR](https://github.com/OpenObservability/OpenMetrics/pull/256) is under review.

Adding support to the text version of OpenMetrics is harder, but also highly
desirable because there are many situations where the generation of protobuf is
infeasible. A text format has to make a trade-off between readability for
humans and efficient handling by machines (encoding, transport, decoding). Work
on it is in progress. See the [proposal for native histogram text
format](https://github.com/prometheus/proposals/pull/32) for more details.

(TODO: Update section as progress is made.)

## Instrumentation libraries

The [protobuf specification](#classic-prometheus-formats) enables low-level
creation of metrics exposition including native histograms in the usual
protobuf way. However, for actual instrumentation of code, an instrumentation
library is needed.

Currently (2024-07-17), there are two official Prometheus instrumentation
libraries supporting native histograms:

- Go: [source](https://github.com/prometheus/client_golang) –
  [documentation](https://pkg.go.dev/github.com/prometheus/client_golang/prometheus)
- Java: [source](https://github.com/prometheus/client_java) –
  [documentation](https://prometheus.github.io/client_java/)
  
Adding native histogram support to other instrumentation libraries is
relatively easy if the library already supports protobuf exposition. For purely
text based libraries, the completion of a [text based exposition
format](#openmetrics) is a prerequisite. (TODO: Update this as needed.)

This section does not cover details of how to use individual instrumentation
libraries (see the documentation linked above for that) but focuses on the
common usage patterns and also provides general guidelines how to implement
native histogram support as part of an instrumentation library. The already
existing [Go implementation](https://github.com/prometheus/client_golang) is
used for examples. The sections about the [data model](#data-model) and the
[exposition formats](#exposition-formats) are highly relevant for the
implementation of instrumentation libraries (but not restated in this
section!).

An instrumentation library SHOULD offer the following configuration parameters
for native histograms following standard exponential schemas. Names are
examples from the Go library – they have to be adjusted to the idiomatic style
in other languages. The value in parentheses is the default value that the
library SHOULD offer.

- `NativeHistogramBucketFactor` (1.1): A float greater than one to determine
  the initial resolution. The library picks a starting schema that results in a
  growth of the bucket width from one bucket to the next by a factor not larger
  than the provided value. See table below for example values.
- `NativeHistogramZeroThreshold` (2<sup>-128</sup>): A float of value zero or
  greater to set the initial threshold for the zero bucket.

The resolution is set via a growth factor rather than providing the schema
directly because most users will not know the mathematics behind the schema
numbers. The notion of an upper limit for the growth factor from bucket to
bucket is understandable without knowing about the internal workings of native
histograms. The following table lists an example factor for each valid schema.

| `NativeHistogramBucketFactor` | resulting schema |
|-------------------------------|------------------|
|             65536             |    -4            |
|               256             |    -3            |
|                16             |    -2            |
|                 4             |    -1            |
|                 2             |     0            |
|                 1.5           |     1            |
|                 1.2           |     2            |
|                 1.1           |     3            |
|                 1.05          |     4            |
|                 1.03          |     5            |
|                 1.02          |     6            |
|                 1.01          |     7            |
|                 1.005         |     8            |

### Limit the bucket count

Buckets of native histograms are created dynamically when they are populated
for the first time. An unexpectedly broad distribution of observed values can
lead to an unexpectedly high number of buckets, requiring more memory than
anticipated. If the distribution of observed values can be manipulated from the
outside, this could even be used as a DoS attack vector via exhausting all the
memory available to the program. Therefore, an instrumentation library SHOULD
offer a bucket limitation strategy. It MAY set one by default, depending on the
typical use cases the library is used for. (TODO: Maybe we should say that a
strategy SHOULD be set by default. The Go library is currently not limiting the
buckets by default, and no issues have been reported with that.)

The following describes the bucket limitation strategy implemented by the Go
instrumentation library. Other libraries MAY follow this example, but other
strategies might be feasible as well, depending on the typical usage pattern of
the library.

The strategy is defined by three parameters: an unsigned integer
`NativeHistogramMaxBucketNumber`, a duration `NativeHistogramMinResetDuration`,
and a float `NativeHistogramMaxZeroThreshold`. If
`NativeHistogramMaxBucketNumber` is zero (which is the default), buckets are
not limited at all, and the other two parameters are ignored. If
`NativeHistogramMaxBucketNumber` is set to a positive value, the library
attempts to keep the bucket count of each histogram to the provided value. A
typical value for the limit is 160, which is also the default value used by
OTel exponential histograms in a similar strategy. (Note that partitioning by
labels will create a number of histograms. The limit applies to each of them
individually, not to all of them in aggregate.) If the limit would be exceeded,
a number of remedies are applied in order until the number of buckets is within
the limit again:

1. If at least `NativeHistogramMinResetDuration` has passed since the last
   reset of the histogram (which includes the creation of the histogram), the
   whole histogram is reset, i.e. all buckets are deleted and the sum and count
   of observations as well as the zero bucket are set to zero. Prometheus
   handles this as a normal counter reset, which means that some observations
   will be lost between scrapes, so resetting should happen rarely compared to
   the scraping interval. A `NativeHistogramMinResetDuration` of one hour is a
   value that should work well in most situations.
2. If not enough time has passed since the last reset (or if
   `NativeHistogramMinResetDuration` is set to zero, which is the default
   value), so reset is performed. Instead, the zero threshold is increased to
   merge buckets close to zero into the zero bucket, reducing the number of
   buckets in that way. The increase of the threshold is limited by
   `NativeHistogramMaxZeroThreshold`. If this value is already reached (or it
   is set to zero, which is the default), nothing happens in this step.
3. If the number of buckets still exceeds the limit, the resolution of the
   histogram is reduced by converting it to the next lower schema, i.e. by
   doubling the width of the buckets. This is repeated until the bucket count
   is within the configured limit or schema -4 is reached.
   
If step 2 or 3 have changed the histogram, a reset will be performed once
`NativeHistogramMinResetDuration` has passed since the last reset, not only to
remove the buckets but also to return to the initial values for the zero
threshold and the bucket resolution.

It is tempting to set a very low `NativeHistogramBucketFactor` (e.g. 1.005)
together with a reasonable `NativeHistogramMaxBucketNumber` (e.g. 160). In this
way, each histogram always has the highest possible resolution that is
affordable within the given bucket count “budget”. (This is the default
strategy used by the OTel exponential histogram. It starts with an even higher
schema (20), which is currently not even available in Prometheus native
histograms.) However, this strategy is generally _not_ recommended for the
Prometheus use case. The resolution will be reduced quite often after creation
and after each reset as observations come in. This creates churn both in the
instrumented program as well as in the TSDB, which is particularly problematic
for the latter. All of this effort is mostly in vain because the typical
queries involving histograms require many histograms to get merged, during
which the lowest common resolution is used so that the user ends up with a
lower resolution anyway. The TSDB can be protected against the churn by
limiting the resolution upon ingestion (see
[below](#limit-bucket-count-and-resolution)), but if a reasonably low
resolution will be enforced upon ingestion anyway, it is more straightforward
to set this resolution during instrumentation already. This strategy might be
worth the resource overhead within the instrumented program in specific cases
where a reasonable resolution cannot be assumed at instrumentation time, and
the scraper should have the flexibility to pick the desired resolution at
scrape time.

### Partitioning by labels

While partitioning of a classic histogram with many buckets by labels has to be
done judiciously, the situation is more relaxed with native histograms.
Partitioning a native histograms still creates a multiplicity of individual
histograms. However, the resulting partitioned histograms will often populate
fewer buckets each than the original unpartitioned histogram. (For example, if
a histogram tracking the duration of HTTP requests is partitioned by HTTP
status code, the individual histogram tracking requests responded by status
code 404 might have a very sharp bucket distribution around the typical
duration it takes to identify an unknown path, population only a few buckets.)
The total numbef of populated buckets for all partitioned histograms will still
go up, but by a smaller factor than the number of partitioned histograms. (For
example, if adding labels to an already quite heavy classic histogram,
resulting in 100 labeled histograms, the total cost will go up by a factor
of 100. In case of a native histogram, the cost for the single histogram might
already be lower if the classic histogram featured a high resolution. After
partitioning, the total number of populated buckets in the labeled native
histograms will be signifcantly smaller than 100 times the number of buckets in
the original native histogram.)

### NHCB

Currently (2024-07-17), instrumentation libraries offer no way to directly
configure native histograms with custom bucket boundaries (NHCBs). The use case
for NHCBs is to allow native-histogram enabled scrapers to convert classic
histograms to NHCBs upon ingestion (see [next section](#scrape-configuration)).
However, there are valid use cases where custom buckets are desirable directly
during instrumentation. In those cases, the current approach is to instrument
with a classic histogram and configure the scraper to convert it to an NHCB
upon ingestion. However, a more direct treatment of NHCBs in instrumentation
libraries might happen in the future.

## Scrape configuration

To enable the Prometheus server to scrape native histograms, the feature flag
`--enable-feature=native-histograms` is required. This flag also changes the
content negotiation to prefer the classic protobuf-based exposition format over
the OpenMetrics text format. (TODO: This behavior will change once native
histograms are a stable feature.)

### Finetuning content negotiation

With Prometheus v2.49 and later, it is possible to finetune the scrape protocol
negotiation globally or per scrape config via the `scrape_protocols` config
setting. It is a list defining the content negotiation priorities. Its default
value depends on the `--enable-feature=native-histograms` flag. If the flage is
set, it is `[ PrometheusProto, OpenMetricsText1.0.0, OpenMetricsText0.0.1,
PrometheusText0.0.4 ]`, otherwise `[ OpenMetricsText1.0.0,
OpenMetricsText0.0.1, PrometheusText0.0.4 ]`. This results in the behavior
described above, i.e. protobuf is unused without the
`--enable-feature=native-histograms` flag, while it is the first priority with
the flag set.

The setting can be used to configure protobuf scrapes without ingesting native
histograms or enforce a non-protobuf format for certain targets even with the
`--enable-feature=native-histograms` flag set. As long as the classic
Prometheus protobuf format (`PrometheusProto` in the configured list) is the
only format supporting native histograms, both the feature flag and negotiation
of protobuf is required to actually ingest native histograms.

(TODO: Update this section once native histograms are a stable feature or native
histograms are supported by other formats.)

NOTE: Switching the used exposition format between text-based and
protobuf-based might have surprising effects on the formatting of label values
for `quantile` labels (used in summaries) and `le` labels (used in classic
histograms). This is not a problem for native histograms, but might show up in
the same context because enabling native histograms requires the protobuf
exposition format. See details in the [documentation for the
`native-histograms` feature
flag](https://prometheus.io/docs/prometheus/latest/feature_flags/#native-histograms).
(TODO: Normalization should become the default in v3. Update this as appropriate.)

### Limiting bucket count and resolution

While [instrumentation libraries](#instrumentation-libraries) SHOULD offer
configuration options to limit the resolution and bucket count of a native
histogram, there is still a need to enforce those limits upon ingestion. Users
might be unable to change the instrumentation of a given program, or a program
might be deliberately instrumented with high-resolution histograms to give
different scrapers the option to reduce the resolution as they see fit.

The Prometheus scrape config offers two settings to address this need:

1. The `native_histogram_bucket_limit` sets an upper inclusive limit for the
   number of buckets in an individual histogram. If the limit is exceeded, the
   resolution of a histogram with a standard exponential schema is repeatedly
   reduced (by doubling the width of the buckets, i.e. decreasing the schema)
   until the limit is reached. In case an NHCB exceeds the limit, or in the rare
   case that the limit cannot be satisfied even with schema -4, the scrape
   fails.
2. The `native_histogram_min_bucket_factor` sets a lower inclusive limit for
   the growth factor from bucket to bucket. This setting is only relevant for
   standard exponential schemas and has no effect on NHCBs. Again, if the limit
   is exceeded, the resolution of the histogram is repeatedly reduced (by
   doubling the width of the buckets, i.e. decreasing the schema) until the
   limit is reached. However, once schema -4 is reached, the scrape will still
   succeed, even if a higher growth factor has been specified.

Both settings accept zero as a valid value, which implies “no limit”. In case
of the bucket limit, this means that the number of buckets are indeed not
checked at all. In the case of the bucket factor, Prometheus will still ensure
that a standard exponential schema will not exceed the capabilities of the used
storage backend. (TODO: This currently means the schema is at most +8, which is
also the limit we allow in the exposition format. OTel allows higher
exponential schemas, and Prometheus might therefore allow them in ingestion
paths, too, but reduce the schema to +8 upon ingestion, or to whatever limit
the current implementation requires. See
https://github.com/prometheus/prometheus/issues/14168 for final clarification.)

If both settings have a non-zero values, the schema is decreased sufficiently
to satisfy both limits.

Note that the bucket factor set during
[instrumentation](#instrumentation-libraries) is an upper limit (exposed bucket
growth factor ≤ configured value), while the bucket factor set in the
scrape config is a lower limit (ingested bucket growth factor ≥ configured
value). The schemas resulting from certain limits are therefore slightly
different. Some examples:

| `native_histogram_min_bucket_factor` | resulting max schema |
|--------------------------------------|------------------|
|             65536                    |    -4            |
|               256                    |    -3            |
|                16                    |    -2            |
|                 4                    |    -1            |
|                 2                    |     0            |
|                 1.4                  |     1            |
|                 1.1                  |     2            |
|                 1.09                 |     3            |
|                 1.04                 |     4            |
|                 1.02                 |     5            |
|                 1.01                 |     6            |
|                 1.005                |     7            |
|                 1.002                |     8            |

General considerations about setting the limits:
`native_histogram_bucket_limit` is suitable to set a hard limit for the cost of
an individual histogram. The same cannot be accomplished by
`native_histogram_min_bucket_factor` because histograms can have many buckets
even with a low resolution if the distribution of observations is sufficiently
broad. `native_histogram_min_bucket_factor` is well suited to avoid needless
overall resource costs. For example, if the use case at hand only requires a
certain resolution, setting a corresponding
`native_histogram_min_bucket_factor` for all histograms might free up enough
resources to accept a very high bucket count on a few histograms with broad
distributions of observed values. Another example is the case where some
histograms have low resolution for some reason (maybe already on the
instrumentation side). If aggregations regularly include those low resolution
histograms, the outcome will have that same low resolution (see the [PromQL
details below](#promql)). Storing other histograms regularly aggregated with
the low resolution histograms at higher resolution might not be of much use.

### Scraping both classic and native histograms

As described [above](#exposition-formats), a histogram exposed by an
instrumented program might contain both a classic and a native histograms, and
some parts are even shared (like the count and sum of observations). This
section explains which parts will be scraped by Prometheus, and how to control
the behavior.

Without the `--enable-feature=native-histograms` flag, Prometheus will
completely ignore the native histogram parts during scraping. (TODO: Update
once the feature flag has been no-op'd.) With the flag set, Prometheus will
prefer the native histogram parts over the classic histogram parts, even if both are exposed for
the same histogram. Prometheus will still scrape the classic histogram parts
for histograms with no native histogram data.

In situations like [migration scenarios](#migration-considerations), it might
be desired to scrape both versions, classic and native, for the same histogram,
provided both versions are exposed by the instrumented program. To enable this
behavior, there is a boolean setting `always_scrape_classic_histograms` in the
scrape config. It defaults to false, but if set to true, both versions of each
histogram will be scraped and ingested, provided there is at least one classic
bucket and at least one native bucket span (which might be a no-op span). This
will not cause any conflicts in the TSDB because classic histograms are
ingested as a number of suffixed series, while native histograms are ingested
as just one series with their unmodified name. (Example: A histogram called
`rpc_latency_seconds` results in a native histogram series named
`rpc_latency_seconds` and in a number of series for the classic part, namely
`rpc_latency_seconds_sum`, `rpc_latency_seconds_count`, and a number of
`rpc_latency_seconds_bucket` series with different `le` labels.)

### Scraping classic histograms as NHCBs

The aforementioned NHCB is capable of modeling a classic histogram as a native
histogram. Prometheus can be configured to ingest classic histograms as NHCBs
rather than classic histograms. (TODO: Explain how to do that once it is merged.)

NHCBs have the same issue with limited mergeability as classic histograms, but
they are generally much less expensive to store.

## TSDB

NOTE: This section provides a high level overview of storing native histograms
in the TSDB and also explains some important individual aspects that might be
easy to miss. It is not meant to explain implementation details, define on-disk
formats, or guide through the code base. There is a [detailed documentation of
the various storage
formats](https://github.com/prometheus/prometheus/tree/main/tsdb/docs/format)
and of course the usual generated GoDoc, with the [tsdb
package](https://pkg.go.dev/github.com/prometheus/prometheus/tsdb) and the
[storage package](https://pkg.go.dev/github.com/prometheus/prometheus/storage)
as suitable starting points. A helpful resource is also the aforementioned
[Developer’s Guide to Prometheus Native
Histograms](https://docs.google.com/document/d/1VhtB_cGnuO2q_zqEMgtoaLDvJ_kFSXRXoE0Wo74JlSY/edit).

The TSDB stores integer histograms and float histograms differently. Generally,
integer histograms are expected to compress better, so a TSDB implementation
MAY store a float histogram as an integer histogram if all numerical values are
in fact integer and within the int64 rage so that the representation as an
integer histogram is a numerically precise representation of the original float
histogram. (Note that the Prometheus TSDB is not utilizing this option yet.)

// Chunk types, WAL records

// Mixed series.
// Staleness. Equivalence with float.

// When to cut a new chunk. (counter reset, not-staleness after staleness
// marker, schema change, zero bucket change, mixed series, reached limit, ???)
// note special handling of gauge histograms
// OOO , overlapping blocks

### Counter reset considerations

// counter reset hint
// special case at beginning of a chunk
// disappearing bucket
// gague histogram never has counter resets
// created-at handling

### Exemplars

## PromQL

// always float (but MAY re-convert to int for storage, remote-write)
// merging
// counter reset handling
// including for _sum_

// interpolation behavior, including zero bucket and NHCB handling, resulting
// errors, including in the zero bucket (where error has to be absolute)

// Give some example queries, with difference to classic histograms
// How to calculate max/min with histogram_quantile (and my it works now)

### Recording rules

### Alerting rules

### Testing framework

## Prometheus query API

The [query API
documentation](https://prometheus.io/docs/prometheus/latest/querying/api/#native-histograms)
includes native histogram support. This section focuses on the parts relevant
for native histograms and provides a bit of context not part of the API
documentation.

### Instant and range queries

To return native histograms in the JSON response of instant (`query` endpoint)
and range (`query_range` endpoint) queries, both the `vector` and `matrix`
result type needs an extension by a new key.

The `vector` result type gets a new key `histogram` at the same level as the
existing `value` key. Both these keys are mutually exclusive, i.e. each element
in a `vector` has either a `value` key (for a float result) or a `histogram`
key (for a histogram result). The value of the `histogram` key is structured
similarly to the value of the `value` key (a two-element array), with the
difference that the string representing the float sample value is replaced by a
specific histogram object described below.

The `matrix` result type gets a new key `histograms` at the same level as the
existing `values` key. These keys are _not_ mutually exclusive. A series may
contain both float values and histogram values, but for a given timestamp,
there must be only one sample, either a float or a histogram. The value of the
`histograms` key is structured similarly to the value of the `values` key (an
array of _n_ two-element arrays), with the difference that the strings
representing float sample values are replaced by specific histogram objects
described below.

Note that a better naming of the keys would be `float`/`histogram` and
`floats`/`histograms` because both float values and histogram values are
values. The current naming has historical reasons. (In the past, there was only
one value type, namely floats, so calling the keys simply `value` and `values`
was the obvious choice.) The intention here is to not break existing consumers
that do not know about native histograms.

The histogram object mentioned above has the following structure:


```
{
  "count": "<count_of_observations>",
  "sum": "<sum_of_observations>",
  "buckets": [ [ <boundary_rule>, "<left_boundary>", "<right_boundary>", "<count_in_bucket>" ], ... ]
}
```

`count` and `sum` directly correspond to the histogram fields of the same name.
Each bucket is represented explicitly with its boundaries and count, including
the zero bucket. Spans and the schema are therefore not part of the response,
and the structure of the histogram object does not depend on the used schema.

The `<boundary_rule>` placeholder is an integer between 0 and 3 with the
following meaning:

* 0: “open left” (left boundary is exclusive, right boundary in inclusive)
* 1: “open right” (left boundary is inclusive, right boundary in exclusive)
* 2: “open both” (both boundaries are exclusive)
* 3: “closed both” (both boundaries are inclusive)

For standard exponential schemas, positive buckets are “open left”, negative
buckets are “open right”, and the zero bucket (with a negative left boundary
and a positive right boundary) is “closed both”. For NHCBs, all buckets are
“open left” (mirroring the behavior of classic histograms). Future schemas
might utilize different boundary rules.

### Metadata

For the `series` endpoint, series containing native histograms are included in
the same way as conventional series containing only floats. The endpoint does
not provide any information what sample types are included (and in fact, _any_
series may contain either or both sample types). Note in particular that a
histogram exposed by a target under the name `request_duration_seconds` will
lead to a series called `request_duration_seconds` if it is exposed and
ingested as a native histogram, but if it is exposed and ingested as a classic
histogram, it will lead to a set of series called
`request_duration_seconds_sum`, `request_duration_seconds_count`, and
`request_duration_seconds_bucket`. If the histogram is [ingested as _both_ a
native histogram and a classic
histogram](#scraping-both-classic-and-native-histograms), all of the series
names above will be returned by the `series` endpoint.

The target and metric metadata (endpoints `targets/metadata` and `metadata`)
work a bit differently, as they are acting on the original name as exposed by
the target. This means that a classic histogram called
`request_duration_seconds` will only be represented by these metadata endpoints
as `request_duration_seconds` (and not `request_duration_seconds_sum`,
`request_duration_seconds_count`, or `request_duration_seconds_bucket`). A
native histogram `request_duration_seconds` will also be represented under this
name. Even in the case where `request_duration_seconds` is ingested as both a
classic and a native histogram, there will not be a collision as the metadata
returned is actually the same (most notably the returned `type` will be
`histogram`). In other words, there is currently no way of distinguishing
native from classic histograms via the metadata endpoints alone. An additional
look-up via the `series` endpoint is required. There are no plans to change
this, as the existing metadata endpoints are anyway severely limited (no
historical information, no metadata for metrics created by rules, limited
ability to handle conflicting metadata between different targets). There are
plans, though, to improve metadata handling in Prometheus in general. Those
efforts will also take into account how to support native histograms properly.

## Prometheus UI

This section describes the rendering of histograms Prometheus's own UI. This
MAY be used as a guideline for external graphing frontends (like Perses or
Grafana).

In the _Table_ view, a histogram data point is rendered graphically as a bar
graph together with a textual representation of all the buckets with their
lower and upper limit and the count and sum of observations. Each bar in the
bar graph represents a bucket. The position of each bar on the _x_ axis is
determined by the lower and upper limit of the corresponding bucket. The area
of each bar is proportional to the population of the corresponding bucket
(which is a core principle of rendering histograms in general).

The graphical histogram allows a choice between an exponential and a linear
exponential _x_ axis. The latter is the default. It is a good fit for the
standard exponential schemas. (TODO: Consider linear as a default for
non-exponential schemas.) Conveniently, all regular buckets of an exponential
schema have the same width on an exponential _x_ axis. This means that the _y_
axis can display actual bucket populations without violating the above
principle that the _area_ (not the height) of a bar is representative for the
bucket population. The zero bucket is an exception to that. Technically, it has
an infinite width. Prometheus simply renders it with the same width as the
regular exponential buckets (which in turn means that the _x_ axis is not
strictly exponential around the zero point). (TODO: How to do the rendering for
non-exponential schemas.)

With a linear _x_ axis, the buckets generally have varying width. Therefore,
the _y_ axis displays the bucket population divided by its width. The
Prometheus UI does not render values on the _y_ axis as they would be hard to
interpret for humans anyway. The population can still be inspected in the text
representation.

In the _Graph_ view, Prometheus displays a heatmap (TODO: not yet, see below),
which could be seen as a series of histograms over time, rotated by 90 degrees
and encoding the bucket population as a color rather than the height of a bar.
The typical query to render a counter-like histogram as a heatmap would be a
`rate` query. A heatmap is an extremely powerful representation that allows
humans to easily spot characteristics of distributions as they change over
time.

TODO: Heatmaps are not implemented yet. Instead, the UI plots just the sum of
observations as a conventional graph. See [tracking
issue](https://github.com/prometheus/prometheus/issues/11268). The same issue
also discusses how to deal with the rendering of range vectors in the _Table_
view.

## Template expansion

Native histograms work in template expansion. They are rendered in a text
representation inspired by the mathematical notation of open and closed
intervals. As native histograms can have a lot of buckets and bucket boundaries
tend to have boundaries with a lot of decimal places, the representation isn't
necessarily very readable. Use native histograms in template expansion
judiciously.

Example for the text representation of a float histogram:

```
{count:3493.3, sum:2.349209324e+06, [-22.62741699796952,-16):1000, [-16,-11.31370849898476):123400, [-4,-2.82842712474619):3, [-2.82842712474619,-2):3.1, [-0.01,0.01]:5.5, (0.35355339059327373,0.5]:1, (1,1.414213562373095]:3.3, (1.414213562373095,2]:4.2, (2,2.82842712474619]:0.1}
```

## Remote write & read

The [protobuf specs for remote write &
read](https://github.com/prometheus/prometheus/blob/main/prompb) were extended
for native histograms as an experimental feature. Receivers not capable of
processing native histograms will simply ignore the newly added fields.
Nevertheless, Prometheus has to be configured to send native histograms via
remote write (by setting the `send_native_histograms` remote write config
setting to true).

In [remote write v2](https://prometheus.io/docs/specs/remote_write_spec_2_0/),
native histograms became an official feature.

(TODO: Is there more to say? I'm not a remote write & read specialist. Does
remote read really work?)
(TODO: What are the plans to auto-convert classic histograms to NHCBs in remote-write?)

## Federation

Federation of native histograms works as expected, provided the federation
scrape uses the protobuf format. A federation via OpenMetrics text format will
be possible, at least in principle, once native histograms are supported in
that format, but federation via protobuf is preferred for efficiency reasons
anyway.

(TODO: Clarify state of federation of NHCBs.)

## OTLP

The OTLP receiver built into Prometheus will convert incoming OTel exponential
histograms to Prometheus native histograms utilizing the compatibility
described [above](#opentelemetry-interoperability). The resolution of a
histogram using a schema (“scale” in OTel lingo) greater than 8 will be reduced
to match schema 8. (In the unlikely case that a schema smaller than -4 is used,
the ingestion will fail.)

(TODO: Is the OTLP receiver documented anywhere? Link the documentation here.)

## Pushgateway

Native histogram support has been gradually added to the
[Pushgateway](https://github.com/prometheus/pushgateway). Full support was
reached in v1.9. The Pushgateway always has been based on the classic protobuf
format as its internal data model, which made the necessary changes easy
(mostly UI concerns). Combined histograms (with classic and native buckets) can
be pushed and will be exposed as such via the `/metrics` endpoint. (However,
the query API, which can be used to query the pushed metrics as JSON, will only
be able to return one kind of buckets and will prefer native buckets if
present.)

## `promtool` 

This section describes `promtool` commands added or changed to support native
histograms.

## `prom2json`

[`prom2json`](https://github.com/prometheus/prom2json) is a small tool that
scrapes a Prometheus `/metrics` endpoint, converts the metrics to a bespoke
JSON format, which it dumps to stdout. This is convenient for further
processing with tools handling JSON, for example `jq`.

`prom2json` v1.4 added support for native histograms. If a histogram in the
exposition contains at least one bucket span, `prom2json` will replace the
usual classic bucket in the JSON output with the buckets of the native
histogram, following a format inspired by the [Prometheus query
API](#prometheus-query-api).

## Migration considerations

When migrating from classic to native histograms, there are three important
sources of issues to consider:

1. Querying native histograms works differently from querying classic
   histograms. In most cases, the changes are minimal and straightforward, but
   there are tricky edge cases, which make it hard to perform some kind of
   auto-conversion reliably.
2. Classic and native histograms cannot be aggregated with each other. A change
   from classic to native histograms at a certain point in time makes it hard
   to create dashboards that work across the transition point, and range vectors
   that contain the transition point will inevitably be incomplete (i.e. a
   range vector selecting classic histograms will only contain data points in
   the earlier part of the range, and a range vector selecting native histograms will only
   contain data points in the later part of the range).
3. A classic histogram might be tailored to have bucket boundaries precisely at
   points of interest. Native histograms with a standard exponential bucketing
   schema can have a high resolution, but do not allow to set bucket boundaries
   at arbitrary values. In those cases, the user experience with native
   histograms might actually be worse.
   
To address (3), it is of course possible to not migrate the classic histogram
in question and leave things as they are. Another option is to leave the
instrumentation the same but convert the classic histogram to an NHCB upon
ingestion. This leverages the increased storage performance of native
histograms, but still requires to address (1) and (2) in the same way as for a
full migration to native histograms (see next paragraphs).

The conservative way of addressing (1) and (2) is to allow a long transition
period, which comes at the cost of collecting and storing classic and native
histograms in parallel for a while.

The first step is to update the instrumentation to expose classic and native
histograms in parallel.

Then configure Prometheus to scrape both classic and native histograms, see
section about [scraping both classic and native
histograms](#scraping-both-classic-and-native-histograms) above.

The existing queries involving classic histograms will continue to work, but
from now on, users can start working with native histograms and start to change
queries in dashboards, alerts, recording rules,… As already mentioned above, it
is important to pay attention to queries with longer range vectors like
`histogram_quantile(0.9, rate(rpc_duration_seconds[1d]))`. This query
calculates the 90th percentile latency over the last day. Hoewever, if native
histograms haven't been collected for at least one day, the query will only
cover that shorter period. Thus, the query should only be used once native
histograms have been collected for at least 1d. For a dashboard that displays
the daily 90th percentile latency over the last month, it is tempting to craft
a query that correctly switches from classic to native histograms at the right
moment. While that is in principle possible, it is tricky. If feasible, the
transition period during which classic and native histograms are collected in
parallel, can be quite long to minimize the necessity to implemen tricky
switch-overs. For example, once classic and native histograms have been
collected in parallel for a month, any dashboard not looking farther back than
a month can simply be switched over from a classic histogram query to a native
histogram query without any consideration about the right switch-over.

Once there is confidence that all queries have been migrated correctly,
configure Prometheus to only scrape native histograms (which is the “normal”
setting). If everything still works, it is time to remove classic histograms
from the instrumentation.

The Grafana Mimir documentation contains [a detailed migration
guide](https://grafana.com/docs/mimir/next/send/native-histograms/#migrate-from-classic-histograms)
following the same philosophy as described in this section.
