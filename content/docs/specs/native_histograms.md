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

Due to the pervasive nature of the changes related to native histograms, the
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
summaries](../../practices/histograms/). (TODO: And a blog post or maybe even a
series of them.) For the latter, there is Carrie
Edward's [Developer’s Guide to Prometheus Native
Histograms](https://docs.google.com/document/d/1VhtB_cGnuO2q_zqEMgtoaLDvJ_kFSXRXoE0Wo74JlSY/edit).

While formal specifications are supposed to happen in their respective context
(e.g. OpenMetrics changes will be specified in the general OpenMetrics
specification), some parts of this document take the shape of a specification.
In those parts, the key words “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL
NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “MAY”, and “OPTIONAL” are used as
described in [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119).

This document still contains a lot of TODOs. In most cases, they are not just
referring to incompleteness of this doc but more importantly to incomplete
implementation or open questions. For now, this is essentially a living
document that will receive updates as implementations and specifications catch
up.

## Introduction

The core idea of native histograms is to treat histograms as first class
citizens in the Prometheus data model. Elevating histograms to a “native”
sample type is the fundamental prerequisite for the key properties listed
below, which explains the choice of the name _native histograms_.

Prior to the introduction of native histograms, all Prometheus sample values
have been 64-bit floating point values (short _float64_ or just _float_). These
floats can directly represent _gauges_ or _counters_. The Prometheus metric
types _summary_ and (the classic version of) _histogram_, as they exist in
exposition formats, are broken down into float components upon ingestion: A
_sum_ and a _count_ component for both types, a number of _quantile_ samples
for a summary and a number of _bucket_ samples for a (classic) histogram.

With native histograms, a new structured sample type is introduced. A single
sample represents the previously known _sum_ and _count_ plus a dynamic set of
buckets. This is not limited to ingestion, but PromQL expressions may also
return the new sample type where previously it was only possible to return
float samples.

Native histograms have the following key properties:

1. A sparse bucket representation, allowing (near) zero cost for empty buckets.
2. Coverage of the full float64 range of values.
3. No configuration of bucket boundaries during instrumentation.
4. Dynamic resolution picked according to simple configuration parameters.
5. Sophisticated exponential bucketing schemas, ensuring mergeability between
   all histograms using those schemas.
6. An efficient data representation for both exposition and storage.

These key properties are fully realized with standard bucketing schemas. There
are other schemas with different trade-offs that might only feature a subset of
these properties. See the [Schema section](#schema) below for details

Compared to the previously existing “classic” histograms, native histograms
(with standard bucketing schemas) allow a higher bucket resolution across
arbitrary ranges of observed values at a lower storage and query cost with very
little to no configuration required. Even partitioning histograms by labels is
now much more affordable.

Because the sparse representation (property 1 in the list above) is so crucial
for many of the other benefits of native histograms, _sparse histograms_ was
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
  is the inaugural talk about the new approach that led to native histograms.
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

- A __native histogram__ is an instance of the new complex sample type
  representing a full histogram that this document is about. Where the context
  is sufficiently clear, it is often just called a _histogram_ below.
- A __classic histogram__ is an instance of the older sample type representing
  a histogram with fixed buckets, formerly just called a _histogram_. It exists
  as such in the exposition formats, but is broken into a number of float
  samples upon ingestion into Prometheus.
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
- A (possibly empty) list of _custom values_.
- _Exemplars_.

### Flavors

Any native histogram has a specific flavor along each of two independent
dimensions:

1. Counter vs. gauge: Usually, a histogram is “counter like”, i.e. each of its
   buckets acts as a counter of observations. However, there are also “gauge
   like” histograms where each bucket is a gauge, representing arbitrary
   distributions at a point in time. The concept of a gauge histogram was
   previously introduced for classic histograms by
   [OpenMetrics](https://github.com/OpenObservability/OpenMetrics/blob/main/specification/OpenMetrics.md#gaugehistogram).
2. Integer vs. floating point (short: float): The obvious use case of
   histograms is to count observations, resulting in integer numbers of
   observations ≥ 0 within each bucket, including the _zero bucket_, and for
   the total _count_ of observations, represented as unsigned 64-bit integers
   (short: uint64). However, there are specific use cases leading to a
   “weighted” or “scaled” histogram, where all of these values are represented
   as 64-bit floating point numbers (short: float64). Note that the _sum_ of
   observations is a float64 in either case.

Float histograms are occasionally used in direct instrumentation for “weighted”
observations, for example to count the number of seconds an observed value was
falling into different buckets of a histogram. The far more common use case for
float histograms is within PromQL, though. PromQL generally only acts on float
values, so the PromQL engine converts every histogram retrieved from the TSDB
to a float histogram first, and any histogram stored back into TSDB via
recording rules is a float histogram. If such a histogram is effectively an
integer histogram (because the value of all non-_sum_ fields can be represented
precisely as uint64), a TSDB implementation MAY convert them back to integer
histograms to increase storage efficiency. (As of Prometheus v3.00, the TSDB
implementation within Prometheus is not utilizing this option.) Note, however,
that the most common PromQL function applied to a counter histogram is `rate`,
which generally produces non-integer numbers, so that results of recording
rules will commonly be float histograms with non-integer values anyway.

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
histogram in a protobuf-exposition format results directly in a data size
reduction approaching 8x for histograms with many buckets. This is particularly
relevant as the overwhelming majority of histograms exposed by instrumented
targets are integer histograms.

For similar reasons, the representation of integer histograms in RAM and on
disk is generally more efficient than that of float histograms. This is less
relevant than the benefits in the exposition format, though. For one,
Prometheus uses Gorilla-style XOR encoding for floats, which reduces their
size, albeit not as much as the double-delta encoding used for integers. More
importantly, an implementation could always decide to internally use an integer
representation for histogram fields that are effectively integer values (see
above). (Historical note: Prometheus v1 used exactly this approach to improve
the compression of float samples, and Prometheus v3 might very well adopt this
approach again in the future.)

In a counter histogram, the total _count_ of observation and the counts in the
buckets individually behave like Prometheus counters, i.e. they only go down
upon a counter reset. However, the _sum_ of observation may decrease as a
consequence of the observation of negative values. PromQL implementations MUST
detect counter resets based on the whole histogram (see the [counter reset
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

- The positive bucket that contains `MaxFloat64` (according to the boundary
  formulas above) has an upper inclusive limit of `MaxFloat64` (rather than the
  limit calculated by the formulas above, which would overflow float64).
- The next positive bucket (index _i_+1 relative to the bucket from the
  previous item) has a lower exclusive limit of `MaxFloat64` and an upper
  inclusive limit of `+Inf`. (It could be called a _positive overflow bucket_.)
- The negative bucket that contains `MinFloat64` (according to the boundary
  formulas above) has a lower inclusive limit of `MinFloat64` (rather than the
  limit calculated by the formulas above, which would underflow float64).
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
represent a classic histogram as a native histogram. It can also be used if
the exponential bucketing featured by the standard schemas is a bad match for
the distribution to be represented by the histogram. Histograms with different
custom bucket boundaries are generally not mergeable with each other.
Therefore, schema -53 SHOULD only be used as an informed decision in specific
use cases. (TODO: NHCB aren't fully merged into main as of now (2024-11-03).
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
the previous bucket in the list. The first bucket in each list contains an
absolute population (which can also be seen as a delta relative to zero).

To map buckets in the lists to the indices as defined in the previous section,
there are two lists of so-called _spans_, one for the positive buckets and one
for the negative buckets.

Each span consists of a pair of numbers, a signed 32-bit integer (short: int32)
called _offset_ and an unsigned 32-bit integer (short: uint32) called _length_.
Only the first span in each list can have a negative offset. It defines the
index of the first bucket in its corresponding bucket list. (Note that for
NHCBs, the index is always positive, see the [custom values
section](#custom-values) below for details.) The length defines the number of
consecutive buckets the bucket list starts with. The offsets of the following
spans define the number of excluded (and thus unpopulated buckets). The lengths
define the number of consecutive buckets in the list following the excluded
buckets.

The sum of all length values in each span list MUST be equal to the length of
the corresponding bucket list.

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

#### Examples

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
standard schemas above. They are counted in a dedicated bucket called the _zero
bucket_.

The number of observations in the zero bucket is tracked by a single uint64
(for integer histograms) or float64 (for float histograms).

The zero bucket has an additional parameter called the _zero threshold_, which
is a float64 ≥ 0. If the threshold is set to zero, only observations of exactly
zero go into the zero bucket, which is the case described above. If the
threshold has a positive value, all observations within the closed interval
[-threshold, +threshold] go to the zero bucket rather than a regular bucket.
This has two use cases:

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
boundary. For the first custom value (at position zero in the list), there is
no preceding value, in which case the lower boundary is considered to be
`-Inf`. Therefore, the custom bucket with index zero counts all observations
between `-Inf` and the first custom value. In the common case that only
positive observations are expected, the custom bucket with index zero SHOULD
have an upper boundary of zero to clearly mark if there have been any
observations at zero or below. (If there are indeed only positive observations,
the custom bucket with index zero will stay unpopulated and therefore will
never be represented explicitly. The only cost is the additional zero element
at the beginning of the custom values list.)

The last custom value MUST NOT be `+Inf`. Observations greater than the last
custom value go into an overflow bucket with an upper boundary of `+Inf`. This
overflow bucket is added with an index equal to the length of the custom
values list.

### Exemplars

A native histogram sample can have zero, one, or more exemplars. They work in
the same way as conventional exemplars, but they are organized in a list (as
there can be more than one), and they MUST have a timestamp.

Exemplars exposed as part of a classic histogram MAY be used by native
histograms, if they have a timestamp.

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
the sum of all buckets (negative, positive, and zero buckets), and the
difference is the number of `NaN` observations. (For an integer histogram
without any `NaN` observations, the sum of all buckets is equal to the count of
observations. Within the usual floating point precision limits, the same is
true for a float histogram without any `NaN` observations.)

An observation of `+Inf` or `-Inf` increments the count of observations and
increments a bucket chosen in the following way:
- With a standard schema, a `+Inf` observation increments the
  _positive overflow bucket_ as described above.
- With a standard schema, a `-Inf` observation increments the
  _negative overflow bucket_ as described above.
- With schema -53 (custom buckets), a `+Inf` observation increments the
  bucket with an index equal to the length of the custom values list.
- With schema -53 (custom buckets), a `-Inf` observation increments the
  bucket with index zero.

### OpenTelemetry interoperability

Prometheus (Prom) native histograms with a standard schema can be
easily mapped into an OpenTelemetry (OTel) exponential histogram and vice
versa, as detailed in the following.

The Prom _schema_ is equal to the _scale_ in OTel, with the restriction that
OTel allows lower values than -4 and higher values than +8. As described above,
Prom has reserved more schema numbers to extend its range, should it ever by
required in practice.

The index is offset by one, i.e. a Prom bucket with index _n_ has index _n-1_
for OTel.

OTel has a dense rather than a sparse representation of buckets. One might see
OTel as “Prom with only one span”.

The Prom _zero bucket_ is called _zero count_ in OTel. (Prom also uses _zero
count_ to name the field storing the count of observations in the zero bucket).
Both work the same, including the existence of a _zero threshold_. Note that
OTel implies a threshold of zero if none is given.

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
Prometheus protobuf format to support native histograms. (An additional
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
- The fields for the sum and the count of observations and the
  `created_timestamp` are shared between classic and native histograms and keep
  working in the same way for both.
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
  bucket) in case of integer histograms. The latter leads to smaller numbers,
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
  timestamped exemplars provided for classic buckets (as at most one exemplar
  per bucket in the `Exemplar` field of the `Bucket` message).
- The number and distribution of native histogram exemplars SHOULD fit the use
  case at hand. Generally, the exemplar payload SHOULD NOT be much larger than
  the remaining part of the `Histogram` message, and the exemplars SHOULD fall
  into different buckets and cover the whole spread of buckets approximately
  evenly. (This is generally preferred over an exemplar distribution that
  proportionally represents the distribution of observations, as the latter
  will rarely yield exemplars from the long tail of a distribution, which are
  often the most interesting exemplars to look at.)

### OpenMetrics

Currently (2024-11-03), OpenMetrics does not support native histograms.

Adding support to the protobuf version of OpenMetrics is relatively
straightforward due to its similarity to the classic Prometheus protobuf
format. A [proposal in the form of a
PR](https://github.com/OpenObservability/OpenMetrics/pull/256) is under review.

Adding support to the text version of OpenMetrics is harder, but also highly
desirable because there are many situations where the generation of protobuf is
infeasible. A text format has to make a trade-off between readability for
humans and efficient handling by machines (encoding, transport, decoding). Work
on it is in progress. See the [design
doc](https://github.com/prometheus/proposals/blob/main/proposals/2024-01-29_native_histograms_text_format.md)
for more details.

(TODO: Update section as progress is made.)

## Instrumentation libraries

The [protobuf specification](#classic-prometheus-formats) enables low-level
creation of metrics exposition including native histograms using the language
specific bindings created by the protobuf compiler. However, for direct code
instrumentation, an instrumentation library is needed.

Currently (2024-11-03), there are two official Prometheus instrumentation
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

The actual instrumentation API for histograms does not change for native
histograms. Both classic histograms and native histograms receive observations
in the same way (with subtle differences concerning exemplars, see next
paragraph). Instrumentation libraries can even maintain a classic and a native
version of the same histogram and expose them in parallel so that the scraper
can choose which version to ingest (see the section about [exposition
formats](#exposition-formats) for details). The user chooses whether to expose
classic and/or native histograms via configuration settings.

Exemplars for classic histograms are usually tracked by storing and exposing
the most recent exemplar for each bucket. As long as classic buckets are
defined, an instrumentation library MAY expose the same exemplars for the
native version of the same histogram, as long as each exemplar has a timestamp.
(In fact, a scraper MAY use the exemplars provided with the classic version of
the histogram even if it is otherwise only ingesting the native version, see
details in the [exposition formats](#exposition-formats) section.) However, a
native histogram MAY be assigned any number of exemplars, and an
instrumentation library SHOULD use this liberty to meet the best practices for
exemplars as described in the [exposition formats](#exposition-formats)
section.

An instrumentation library SHOULD offer the following configuration parameters
for native histograms following standard schemas. Names are
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

### Limiting the bucket count

Buckets of native histograms are created dynamically when they are populated
for the first time. An unexpectedly broad distribution of observed values can
lead to an unexpectedly high number of buckets, requiring more memory than
anticipated. If the distribution of observed values can be manipulated from the
outside, this could even be used as a DoS attack vector via exhausting all the
memory available to the program. Therefore, an instrumentation library SHOULD
offer a bucket limitation strategy. It MAY set one by default, depending on the
typical use cases the library is used for. (TODO: Maybe we should say that a
strategy SHOULD be set by default. The Go library is currently not limiting the
buckets by default, and no issues have been reported with that so far.)

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
   the scraping interval. Additionally, frequent counter resets might lead to
   less efficient storage in the TSDB (see the [TSDB section](#tsdb) for
   details). A `NativeHistogramMinResetDuration` of one hour is a value that
   should work well in most situations.
2. If not enough time has passed since the last reset (or if
   `NativeHistogramMinResetDuration` is set to zero, which is the default
   value), no reset is performed. Instead, the zero threshold is increased to
   merge buckets close to zero into the zero bucket, reducing the number of
   buckets in that way. The increase of the threshold is limited by
   `NativeHistogramMaxZeroThreshold`. If this value is already reached (or it
   is set to zero, which is the default), nothing happens in this step.
3. If the number of buckets still exceeds the limit, the resolution of the
   histogram is reduced by converting it to the next lower schema, i.e. by
   merging neighboring buckets, thereby doubling the width of the buckets. This
   is repeated until the bucket count is within the configured limit or schema
   -4 is reached.
   
If step 2 or 3 have changed the histogram, a reset will be performed once
`NativeHistogramMinResetDuration` has passed since the last reset, not only to
remove the buckets but also to return to the initial values for the zero
threshold and the bucket resolution. Note that this is treated like a reset for
other reasons in all aspects, including updating the so-called [created
timestamp](#created-timestamp-handling).

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
to set this resolution during instrumentation already. However, this strategy
might be worth the resource overhead within the instrumented program in
specific cases where a reasonable resolution cannot be assumed at
instrumentation time, and the scraper should have the flexibility to pick the
desired resolution at scrape time.

### Partitioning by labels

While partitioning of a classic histogram with many buckets by labels has to be
done judiciously, the situation is more relaxed with native histograms.
Partitioning a native histograms still creates a multiplicity of individual
histograms. However, the resulting partitioned histograms will often populate
fewer buckets each than the original unpartitioned histogram. (For example, if
a histogram tracking the duration of HTTP requests is partitioned by HTTP
status code, the individual histogram tracking requests responded by status
code 404 might have a very sharp bucket distribution around the typical
duration it takes to identify an unknown path, populating only a few buckets.)
The total number of populated buckets for all partitioned histograms will still
go up, but by a smaller factor than the number of partitioned histograms. (For
example, if adding labels to an already quite heavy classic histogram results
in 100 labeled histograms, the total cost will go up by a factor of 100. In
case of a native histogram, the cost for the single histogram might already be
lower if the classic histogram featured a high resolution. After partitioning,
the total number of populated buckets in the labeled native histograms will be
signifcantly smaller than 100 times the number of buckets in the original
native histogram.)

### NHCB

Currently (2024-11-03), instrumentation libraries offer no way to directly
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

### Fine-tuning content negotiation

With Prometheus v2.49 and later, it is possible to fine-tune the scrape
protocol negotiation globally or per scrape config via the `scrape_protocols`
config setting. It is a list defining the content negotiation priorities. Its
default value depends on the `--enable-feature=native-histograms` flag. If the
flag is set, it is `[ PrometheusProto, OpenMetricsText1.0.0,
OpenMetricsText0.0.1, PrometheusText0.0.4 ]`, otherwise the first element,
`PrometheusProto` is removed from the list, resulting in `[
OpenMetricsText1.0.0, OpenMetricsText0.0.1, PrometheusText0.0.4 ]`. These
default values result in the behavior described above, i.e. protobuf is unused
without the `--enable-feature=native-histograms` flag, while it is the first
priority with the flag set.

The setting can be used to configure protobuf scrapes without ingesting native
histograms or enforce a non-protobuf format for certain targets even with the
`--enable-feature=native-histograms` flag set. As long as the classic
Prometheus protobuf format (`PrometheusProto` in the configured list) is the
only format supporting native histograms, both the feature flag and negotiation
of protobuf is required to actually ingest native histograms.

(TODO: Update this section once native histograms are a stable feature or native
histograms are supported by other formats.)

NOTE: Switching the used exposition format between text-based and
protobuf-based has some non-obvious implications. Most importantly, certain
implementation details result in the counter-intuitive effect that scraping
with a text-based format is generally much less resource demanding than
scraping with a protobuf-based format (see [tracking
issue](https://github.com/prometheus/prometheus/issues/14668) for details).
Even more subtle is the effect on the formatting of label values for `quantile`
labels (used in summaries) and `le` labels (used in classic histograms). This
problem only affects v2 of the Prometheus server (v3 has consistent formatting
under all circumstances) and is not directly related to native histograms, but
might show up in the same context because enabling native histograms requires
the protobuf exposition format. See details in the [documentation for the
`native-histograms` feature
flag](https://prometheus.io/docs/prometheus/2.55/feature_flags/#native-histograms)
for v2.55.

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
   resolution of a histogram with a standard schema is repeatedly
   reduced (by doubling the width of the buckets, i.e. decreasing the schema)
   until the limit is reached. In case an NHCB exceeds the limit, or in the rare
   case that the limit cannot be satisfied even with schema -4, the scrape
   fails.
2. The `native_histogram_min_bucket_factor` sets a lower inclusive limit for
   the growth factor from bucket to bucket. This setting is only relevant for
   standard schemas and has no effect on NHCBs. Again, if the limit
   is exceeded, the resolution of the histogram is repeatedly reduced (by
   doubling the width of the buckets, i.e. decreasing the schema) until the
   limit is reached. However, once schema -4 is reached, the scrape will still
   succeed, even if a higher growth factor has been specified.

Both settings accept zero as a valid value, which implies “no limit”. In case
of the bucket limit, this means that the number of buckets are indeed not
checked at all. In the case of the bucket factor, Prometheus will still ensure
that a standard schema will not exceed the capabilities of the used
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
details below](#compatibility-between-histograms)). Storing other histograms
regularly aggregated with the low resolution histograms at higher resolution
might not be of much use.

### Scraping both classic and native histograms

As described [above](#exposition-formats), a histogram exposed by an
instrumented program might contain both a classic and a native histograms, and
some parts are even shared (like the count and sum of observations). This
section explains which parts will be scraped by Prometheus, and how to control
the behavior.

Without the `--enable-feature=native-histograms` flag, Prometheus will
completely ignore the native histogram parts during scraping. (TODO: Update
once the feature flag has been no-op'd.) With the flag set, Prometheus will
prefer the native histogram parts over the classic histogram parts, even if
both are exposed for the same histogram. Prometheus will still scrape the
classic histogram parts for histograms with no native histogram data.

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

### Integer histograms vs. float histograms

The TSDB stores integer histograms and float histograms differently. Generally,
integer histograms are expected to compress better, so a TSDB implementation
MAY store a float histogram as an integer histogram if all bucket counts and
the count of observations have an integer value within the int64 range so that
the conversion to an integer histogram creates a numerically precise
representation of the original float histogram. (Note that the Prometheus TSDB
is not utilizing this option yet.)

### Encoding

Native histograms require two new chunk encodings (Go type `chunkenc.Encoding`)
in the TSDB: `chunkenc.EncHistogram` (string representation `histogram`,
numerical value 2) for integer histograms, and `chunkenc.EncFloatHistogram`
(string representation `floathistogram`, numerical value 3) for float
histograms.

Similarly, there are two new record types for the WAL and the in-memory
snapshot (Go type `record.Type`): `record.HistogramSamples` (string
representation `histogram_samples`, numerical value 9) for integer histograms,
and `record.FloatHistogramSamples` (string representation
`float_histogram_samples`, numerical value 10) for float histograms. For
backwards compatibility reasons, there are two more histogram record types:
`record.HistogramSamplesLegacy` (`histogram_samples_legacy`, 7) and
`record.FloatHistogramSamplesLegacy` (`float_histogram_samples_legacy`, 8).
They were used prior to the introduction of custom values needed for NHCB. They
are supported so that reading old WALs is still possible.

Prometheus identifies time series just by their labels. Whether a sample in a
series is a float (and as such a counter or a gauge) or a histogram (no matter
what flavor) does not contribute to the series's identity. Therefore, a series
MAY contain a mix of samples of different types and flavors. Changes of the
sample type within a time series are expected to be very rare in practice. They
usually happen after changes in the instrumentation of a target (in the rare
case that the same metric name is used for e.g. a gauge float prior to the
change and a counter histogram after the change) or after a change of a
recording rule (e.g. where the old version of a rule created a gauge float and
the new version of the rule now creates a gauge histogram while retaining its
name). Frequent changes of the sample type are usually the consequence of a
misconfiguration (e.g. two different recording rules creating different sample
types feeding into the same series). Therefore, a TSDB implementation MUST
handle a change in sample type, but it MAY do so in a relatively inefficient
way. When the Prometheus TSDB encounters a sample type that cannot be written
to the currently used chunk, it closes that chunk and starts a new one with the
appropriate encoding. (A time series that switches sample types back and forth
for each sample will lead to a new chunk for each sample, which is indeed very
inefficient.)

Histogram chunks use a number of custom encodings for numerical values, in
order to reduce the data size by encoding common values in fewer bits than less
common values. The details of each custom encoding are described in the [low
level chunk format
documentation](https://github.com/prometheus/prometheus/blob/main/tsdb/docs/format/chunks.md)
(and ultimately in the code linked from there). The following three encodings
are used for a number of different fields and are therefore named here for
later reference:

- _varbit-int_ is a variable bitwidth encoding for signed integers. It uses
  between 1 bit and 9 bytes. Numbers closer to zero need fewer bits. This is
  similar to the timestamp encoding in chunks for float samples, but with a
  different bucketing of the various bit lengths, optimized for the value
  distribution commonly encountered in native histograms.
- _varbit-uint_ is a similar encoding, but for unsigned integers.
- _varbit-xor_ is a variable bitwidth encoding for a sequence of floats. It is
  based on XOR'ing the current and the previous float value in the sequence. It
  uses between 1 bit and 77 bits per float. This is exactly the same encoding
  the TSDB already uses for float samples.

Histogram chunks start as usual with the number of samples in the chunk (as a
uint16), followed by one byte describing if the histogram is a gauge histogram
or a counter histogram and providing counter reset information for the latter.
See the [corresponding section](#counter-reset-considerations) below for
details. This is followed by the so called chunk layout, which contains the
following information, _shared by all histograms in the chunk_:

- The threshold of the zero bucket, using a custom encoding that encodes common
  values (zero or certain powers of two) in just one byte, but requires 9 bytes
  for arbitrary values.
- The schema, encoded as varbit-int.
- The positive spans, encoded as the number of spans (varbit-uint), followed by
  the length (varbit-uint) and the offset (varbit-int) of each span in a
  repeated sequence.
- The negative spans in the same way.
- Only for schema -53 (NHCB) the custom values, encoded as the number of custom
  values (varbit-uint), followed by the custom values in a repeated sequence,
  using a custom encoding.

The chunk layout is followed by a repeated sequence of sample data. The sample
data is different for integer histograms and float histograms. For an integer
histogram, the data of each sample contains the following:

- The timestamp, encoded as varbit-int, with an absolute value in the 1st
  sample, a delta between the 1st and 2nd sample for the 2nd sample, and a
  “delta of deltas” for any further samples (i.e. the same “double delta”
  encoding used for timestamps in conventional float chunks, just with a
  different bit bucketing for the varbit-int encoding).
- The count of observations, encoded as varbit-uint for the 1st sample and as
  varbit-int for any further samples, using the same “delta of deltas” approach
  as for timestamps.
- The zero bucket population, encoded as varbit-uint for the 1st sample and as
  varbit-int for any further samples, using the same “delta of deltas” approach
  as for timestamps.
- The sum of observations, encoded as a float64 for the 1st sample and as
  varbit-xor for any further samples (XOR'ing between the current and previous
  sample).
- The bucket populations of the positive buckets, each as a delta to the
  previous bucket (or as the absolute population in the 1st bucket), encoded as
  varbit-int, using the same “delta of deltas” approach as for timestamps. (In
  other words, the “double delta” encoding is applied to values that are
  already deltas on their own, which is the reason why this is sometimes called
  “triple delta“ encoding.)
- The bucket populations of the negative buckets in the same way.

The sample data of a float histogram has the following differences:

- The count of observations and the zero bucket populations are floats now and
  therefore encoded in the same way as the sum of observations (float64 in the
  1st sample, varbit-xor for any further samples).
- The bucket population are not only floats now, but also absolute population
  counts rather than deltas between buckets. In the 1st sample, all bucket
  populations are represented as plain float64's, while they are encoded as
  varbit-xor for all further samples, XOR'ing corresponding buckets from the
  current and the previous sample.

The following events trigger cutting a new chunk (for the reasons described in
parentheses):

- A change of sample type between integer histogram and float histogram
  (because both require different chunk encodings altogether).
- A change of sample type between gauge histogram and counter histogram
  (because the leading byte has to denote the different type).
- A counter reset for a counter histogram (to be stored in the leading byte as
  counter reset information, see details below).
- A schema change (which means we need a new chunk layout, and a chunk can only
  have one chunk layout).
- A change of the zero threshold (which changes the chunk layout, see above).
- A change of the custom values (which changes the chunk layout, see above).
- A staleness marker is followed by a regular sample (which does not strictly
  require a new chunk, but it can be assumed that most histograms will change
  so much when they go away and come back that cutting a new chunk is the best
  option).
- The chunk size limit is exceeded (see [details below](#chunk-size-limit)).

Differences in the spans would also change the chunk layout, but they are
reconciled by adding (explicitly represented) unpopulated buckets as needed so
that all histograms in a chunk share the same span structure. This is
straightforward if a bucket disappears, because the missing bucket is simply
added to the new histogram as an unpopulated bucket while the histogram is
appended to the chunk. However, disappearance of a formerly populated bucket
constitutes a counter reset (see [below](#counter-reset-considerations)), so
this case can only happen for gauge histograms (which do not feature counter
resets). The far more common case is that buckets exist in a newly appended
histogram that did not exist in the previously appended histograms. In this
case, these buckets have to be added as explicitly unpopulated buckets to all
previously appended histograms. This requires a complete re-encoding of the
entire chunk. (There is some optimization potential in only re-encoding the
affected parts. Implementing this would be quite complicated. So far, the
performance impact of the full re-encoding did not stick out as problematic.)

### Staleness markers

NOTE: To understand the following section, it is important to recall how
staleness markers work in the TSDB. Staleness markers in float series are
represented by one specific bit pattern among the many that can be used to
represent the `NaN` value. This very specific float value is called “special
stale `NaN` value” in the following section. It is (almost certainly) never
returned by the usual arithmetic float operations and as such different from a
“naturally occurring” `NaN` value, including those discussed in [Special cases
of observed values](#special-cases-of-observed-values). In fact, the special
stale `NaN` value is never returned directly when querying the TSDB, but it is
handled internally before it reaches the caller.

To mark staleness in histogram series, the usual special stale `NaN` value
could be used. However, this would require cutting a new chunk, just for the
purpose of marking the series as stale, because a float value following a
histogram value has to be stored in a different chunk (see above). Therefore,
there is also a histogram version of a stale marker where the field for the sum
of observations is set to the special stale `NaN` value. In this case, all
other fields are ignored, which enables setting them to values suitable for
efficient storage (as the histogram version of a stale marker is essentially
just a storage optimization). This works for both float and integer histograms
(as the sum field is a float value even in an integer histogram), and the
appropriate version can be used to avoid cutting a new chunk. All version of a
stale marker (float, integer histogram, float histogram) MUST be treated as
equivalent by the TSDB.

### Chunk size limit

The size of float chunks is limited to 1024 bytes. The same size limitation is
generally used for histogram chunks, too. However, individual histograms can
become very large if they have many buckets, so blindly enforcing the size
limit could lead to chunks with very few histograms. (In the most extreme case,
a single histogram could even take more than 1024 bytes so that the size limit
could not be enforced at all.) With very few histograms per chunk, the
compression ratio becomes worse. Therefore, a minimum number of 10 histograms
per chunks has to be reached before the size limit of 1024 bytes kicks in. This
implies that histogram chunks can be much larger than 1024 bytes.

Requiring a minimum of 10 histograms per chunk is an initial, very simplistic
approach, which might be improved in the future to find a better trade-off
between chunk size and compression ratio.

### Counter reset considerations

Generally, Prometheus considers a counter to have reset whenever its value
drops from one sample to the next (but see also the [next section about the
created timestamp](#created-timestamp-handling)). The situation is more complex
when detecting a counter reset between two histogram samples.

First of all, gauge histograms and counter histograms are explicitly different
(whereas Prometheus generally treats all float samples equally after ingestion,
no matter if they were ingested as a gauge or a counter metric). Counter resets
do not apply to gauge histograms.

If a gauge histogram is followed by a counter histogram in a time series, a
counter reset is assumed to have happened, because a change from gauge to
counter is considered equivalent to the gauge being deleted and the counter
being newly created from zero.

The most common case is a counter histogram being followed by another counter
histogram. In this case, a possible counter reset is detected by the following
procedure:

If the two histograms differ in schema or in the zero bucket width, these
changes could be part of a compatible resolution reduction (which happens
regularly to [reduce the bucket count of a
histogram](#limit-the-bucket-count)). Both of the following is true for a
compatible resolution reduction:

- If the schema has changed, its number has decreased from one standard
  exponential schema to another standard schema.
- If the zero bucket width has changed, any populated regular bucket in the first
  histogram is either completely included in the zero bucket of the second
  histogram or not at all (i.e. no partial overlap of old regular buckets with
  the new zero bucket).
  
If any of the conditions are not met, the change is not a compatible resolution
reduction. Because such a change is only possible by resetting or newly 
creating a histogram, it is considered a counter reset and the detection
procedure is concluded.

If both conditions are met, the first histogram has to be converted so that its
schema and zero bucket width matches those of the second histogram. This
happens in the same way as [previously described](#limit-the-bucket-count):
Neighboring buckets are merged to reduce the schema, and regular buckets are
merged with the zero bucket to increase the width of the zero bucket.

At this point in the procedure, both histograms have the same schema and zero
bucket width, either because this was the case from the beginning, or because
the first histogram was converted accordingly. (Note that NHCBs do not use the
zero bucket. Their zero bucket widths and population counts are considered
equal for the sake of this procedure.) In this situation, any of the following
constitutes a counter reset:

- A drop in the count of observations (but notably _not_ a drop in the sum of
  observations).
- A drop in the population count of any bucket, including the zero bucket. This
  includes the case where a populated bucket disappears, because a
  non-represented bucket is equivalent to a bucket with a population of zero.
- Any change of the custom values. This only applies for schemas that use
  custom values (currently schema -53, i.e. NHCB). (TODO: In principle, there
  could be a concept of compatible bucket changes in NHCBs, too, but such a
  concept is not implemented yet.)

If none of the above is the case, there is no counter reset.

As this whole procedure is relatively involved, the counter reset detection
preferably happens once during ingestion, with the result being persisted for
later use. Counter reset detection during ingestion has to happen anyway
because a counter reset is one of the triggers to cut a new chunk.

Cutting a new chunk after a counter reset aims to improve the compression
ratio. A counter reset sets all bucket populations to zero, so there are fewer
buckets to represent. A chunk, however, has to represent the superset of all
buckets of all histograms in the chunk, so cutting a new chunk enables a
simpler set of buckets for the new chunk.

This in turn implies that there will never be a counter reset after the first
sample in a chunk. Therefore, the only counter reset information that has to be
persisted is that of the 1st histogram in a chunk. This happens in the
so-called _histogram flags_, a single byte stored directly after the the number
of samples in the chunk. This byte is currently only used for the counter reset
information, but it may be used for other flags in the future. The counter
reset information uses the first two bits. The four possible bit patterns are
represented as Go constants of type `CounterResetHeader` in the `chunkenc`
package. Their names and meanings are the following:

- `GaugeType` (bit pattern `11`): The chunk contains gauge histograms.
  Counter resets are irrelevant for gauge histograms.
- `CounterReset` (bit pattern `10`): A counter reset happened between the last
  histogram of the previous chunk and the 1st histogram of this chunk. (It is
  likely that the counter reset was actually the reason why the new chunk was
  cut.)
- `NotCounterReset` (bit pattern `01`): No counter reset happened between the
  last histogram of the previous chunk and the 1st histogram of this chunk.
  (This commonly happens if a new chunk is cut because the previous chunk hit
  the size limit.)
- `UnknownCounterReset` (bit pattern `00`): It is unknown if there was a
  counter reset between the last histogram of the previous chunk and the 1st
  histogram of this chunk.
  
`UnknownCounterReset` is always a safe choice. It does not prevent counter
reset detection, but merely requires that the counter reset detection procedure
has to be performed (again) whenever counter reset information is needed.

The counter reset information is propagated to the caller when querying the
TSDB (in the Go code as a field of type `CounterResetHint` in the Go types
`Histogram` and `FloatHistogram`, using enumerated constants with the same
names as the bit pattern constants above).

For gauge histogram, the `CounterResetHint` is always `GaugeType`. Any other
`CounterResetHint` value implies that the histogram in question is a counter
histogram. In this way, queriers (including the PromQL engine, see
[below](#promql)) obtain the information if a histogram is a gauge or a counter
(which is notably different from float samples).

As long as counter histograms are returned in order from a single chunk, the
`CounterResetHint` for the 2nd and following histograms in a chunk is set to
`NotCounterReset`. (Overlapping blocks and out-of-order ingestion may lead to
histogram sequences coming from multiple chunks, which requires special
treatment, see below.)

When returning the 1st histogram from a counter histogram chunk, the
`CounterResetHint` MUST be set to `UnknownCounterReset` _unless_ the TSDB
implementation can ensure that the previously returned histogram was indeed the
same histogram that was used as the preceding histogram to detect the counter
reset at ingestion time. Only in the latter case, the counter reset information
from the chunk MAY be used directly as the `CounterResetHint` of the returned
histogram.

This precaution is needed because there are various ways how chunks might get
removed or inserted (e.g. deletion via tombstones or adding blocks for
backfilling). A counter reset, while attributed to one sample, is in fact
happening _between_ the marked sample and the preceding sample. Removing the
preceding sample or inserting another sample in between the two samples
invalidates the previously performed counter reset detection.

TODO: Currently, the Prometheus TSDB has no means of ensuring that the
preceding chunk is still the same chunk as during ingestion. Therefore,
Prometheus currently returns `UnknownCounterReset` for _all_ 1st histograms
from a counter histogram chunk. See [tracking
issue](https://github.com/prometheus/prometheus/issues/15346) for efforts to
change that.

As already implied above, the querier MUST perform the counter reset detection
procedure (again), if the `CounterResetHint` is set to `UnknownCounterReset`.

Special caution has to be applied when processing overlapping blocks or
out-of-order samples (for querying or during compaction). Both overdetection
and underdetection of counter resets may happen in these cases, as illustrated
by the following examples:

- _Example for underdetection:_ One chunk contains samples ABC, without counter
  resets. Another chunk contains samples DEF, again without counter resets. The
  chunks are overlapping and refer to the same series. When querying them
  together, the temporal order of samples turns out to be ADBECF. There might
  now very well be a counter reset between some or even all of those samples.
  This is in fact likely if the two samples are actually from unrelated series
  and got merged into the same series by accident. However, even accidental
  merges like this have to be handled correctly by the TSDB. If the overlapping
  chunks are compacted into a new chunk, a new counter reset detection has to
  happen, catching the new counter resets. If querying the overlapping chunks
  directly (without prior compaction), a `CounterResetHint` of
  `UnknownCounterReset` has to be set for each sample that comes from a
  different chunk than the previously returned sample, which mandates a counter
  reset detection by the querier (utilizing the safe fallback described above).
- _Example for overdetection:_ There is a sequence of samples ABCD with a
  counter reset happening between B and C. However, the initial ingestion
  missed B and C so that only A and D were ingested, with a counter reset
  detected between A and D. Later, B and C are ingested (via out-of-order
  ingestion or as separate chunks later added to the TSDB as a separate block),
  with a counter reset detected between B and C. In this case, each sample goes
  into its own chunk, so when assembling all the chunks, they do not even
  overlap. However, when returning the counter reset hints according to the
  rules above, both C and D will be returned to the querier with a
  `CounterResetHint` of `CounterReset`, although there is now no counter reset
  between C and D. Similar to the situation in the previous example, a new
  counter reset detection has to be performed between A and B, and another one
  between C and D. Or both B and D have to be returned with a
  `CounterResetHint` of `UnknownCounterReset`.
  
In summary, whenever the TSDB cannot safely establish that a counter reset
detection between two samples has happened upon ingestion, it either has to
perform another counter reset detection or it has to return a
`CounterResetHint` of `UnknownCounterReset` for the second sample.

Note that there is the possiblity of counter resets that are not detected by
the procedure described above, namely if the counts in the reset histogram have
increased quickly enough so that the 1st sample after the counter reset has no
counts that have decreased compared to the last sample prior to the counter
reset. (This is also a problem for float counters, where it is actually more
likely to happen.) With the mechanisms explained above, it is possible to store
a counter reset even in this case, provided that the counter reset was detected
by other means. However, due to the complications caused by insertion and
removal of chunks, out-of-order samples, and overlapping blocks (as explained
above), this information MAY get lost if a second round of counter reset
detection is required. (TODO: Currently, this information is reliably lost, see
TODO above.) A better way to safely mark a counter reset is via created
timestamps (see next section).

### Created timestamp handling

OpenMetrics introduced so-called created timestamps for counters, summaries,
and classic counter histograms. (The term is probably short for “created-at
timstamp”. The more appropriate term might have been “creation timestamp” or
“reset timestamp”, but the term “created timestamp” is firmly established by
now.)

The created timestamp provides the most recent time the metric was created or
reset. A [design
doc](https://github.com/prometheus/proposals/blob/main/proposals/2023-06-13_created-timestamp.md)
describes how Prometheus handles created timestamps.

Created timestamps are also useful for native histograms. In the same way a
synthetic zero sample is inserted for float counters, a zero value of a
histogram sample is inserted for counter histograms. A zero value of a
histogram has no populated buckets, and the sum of observations, the count of
observations, and the zero bucket population are all zero. Schema, zero bucket
width, custom values, and the float vs. integer flavor of the histogram SHOULD
match the sample that directly follows the synthetic zero sample (to not
trigger the detection of a spurious counter reset).

The counter reset information of the synthetic zero sample is always set to
`CounterReset`. (TODO: Currently, Prometheus probably sets it to
`UnknownCounterReset` for the first sample of a series, which is not wrong, but
I think setting it to `CounterReset` makes more sense.)

### Exemplars

Exemplars for native histograms are attached to the histogram sample as a
whole, not to individual buckets. (See also the [exposition formats
section](#exposition-formats).) Therefore, it is allowed (and in fact the
common case) that a single native histogram sample comes with multiple
exemplars attached.

Exemplars may or may not change from one scrape to the next. Scrapers SHOULD
detect unchanged exemplars to avoid storing many duplicate exemplars. Duplicate
detection is potentially expensive, though, given that a single sample might
have many exemplars, of which any subset could be repeated exemplars from the
last scrape. The TSDB MAY rely on the assumption that any new exemplar has a
more recent timestamp than any of the previously exposed exemplars. (Remember
that exemplars of native histograms MUST have a timestamp.) Duplicate detection
is then possible in an efficient way:

1. The exemplars of a newly ingested native histogram are sorted by the
   following fields: first timestamp, then value, then labels.
2. The exemplars are appended to the exemplar storage in the sorted order.
3. The append fails for exemplars that would be sorted before or are equal to
   the last successfully appended exemplar (which might be from the previous
   scrape for the same metric).
4. The append succeeds for exemplars that would be sorted after the last
   successfully appendend exemplar.

Exemplars are only counted as out of order if all exemplars of an ingested
histogram would be sorted before the last successfully appended exemplar. This
does not detect out-of-order exemplars that are mixed with newer exemplars or
with a duplicate of the last successfully appended exemplar, which is
considered acceptable.

## PromQL

This section describes how PromQL handles native histograms. It focuses on
general concepts rather than every single detail of individual operations. For
the latter, refer to the PromQL documentation about
[operators](https://prometheus.io/docs/prometheus/latest/querying/operators/)
and
[functions](https://prometheus.io/docs/prometheus/latest/querying/functions/).

TODO: The Prometheus PromQL implementation is currently lagging behind what's
described in this section. This is not called out separately further down for
all cases. See [tracking
issue](https://github.com/prometheus/prometheus/issues/13934) for details.

### Annotations

The introduction of native histograms creates certain situations where a PromQL
expression returns unexpected results, most commonly the case where some or all
elements in the output vector are unexpectedly missing. To help users detect
and understand those situations, operations acting on native histograms often use
annotations. Annotations can have warn and info level and describe possible
issues encountered during the evaluation. Warn level is used to mark situations
that are most likely an actual problem the user has to act on. Info level is
used for situations that might also be deliberate, but are still unusual enough
to flag them.

### Integer histograms vs. float histograms

PromQL always acts on float histograms. Native histograms that are stored as
integer histograms are automatically converted to float histograms when
retrieved from the TSDB.

### Compatibility between histograms

When an operator or function acts on two or more native histograms, the
histograms involved need to have the same schema and zero bucket width. Within
certain limits, histograms can be converted on the fly to meet these
compatibility criteria:

- An NHCB (schema -53) is only ever compatible with other NHCBs that also MUST
  have the exact same custom values. (In principle, there are possible
  differences in custom values that could be reconciled, but PromQL doesn't yet
  consider those.)
- Histograms with standard schemas can always be converted to the
  smallest (i.e. lowest resolution) common schema by decreasing the resolution
  of the histograms with greater schemas (i.e. higher resolution). This happens
  in the usual way by merging neighboring buckets into the larger buckets of
  the smaller schema.
- Different zero bucket widths are handled by expanding the smaller zero
  buckets, merging any populated regular bucket into the expanded zero bucket
  as appropriate. If the greatest common width happens to end up in the middle
  of any populated bucket, it is further expanded to coincide with the bucket
  boundary of that bucket. (See more details in the [zero bucket section
  above](#zero-bucket).)

If incompatibility prevents an operation, a warn-level annotation is added to
the result.

### Counter resets

Counter resets are defined as described [above](#counter-reset-considerations).
Counter reset hints returned from the TSDB MAY be taken into account to avoid
explicit counter reset detection and to correctly process counter resets that
are not detectable by the usual procedure. (This implies that these counter
resets are only taken into account on a best effort basis. However, the same is
true for the TSDB itself, see above.) A notable difference to the counter reset
handling for classic histograms and summaries is that a decrease of the sum of
observations does _not_ constitute a counter reset by itself. (For example,
calculating the rate of a native histogram will still work correctly even if
the histogram has observed negative values.)

Note that the counter reset hints of counter histograms returned by sub-queries
MUST NOT be taken into account to avoid explicit counter reset detection,
unless the PromQL engine can safely detect that consecutive counter histograms
returned from the sub-query are also consecutive in the TSDB. (TODO: This is
not implemented yet.)

### Gauge histograms vs. counter histograms

Via the counter reset hint returned from the TSDB, PromQL is aware if a native
histogram is a gauge or a counter histogram. To mirror PromQL's treatment of
float samples (where it cannot reliably distinguish between float counters and
gauges), functions that act on counters will still process gauge histograms,
and vice versa, but a warn-level annotation is returned with the result. Note
that explicit counter reset detection has to be performed on a gauge histogram
in that case, treating it as if it were a counter histogram.

### Interpolation within a bucket

When estimating quantiles or fractions, PromQL has to apply interpolation
within a bucket. In classic histograms, this interpolation happens in a linear
fashion. It is based on the assumption that observations are equally
distributed within the bucket. In reality, this assumption might be far off.
(For example, an API endpoint might respond to almost all request with a
latency of 110ms. The median latency and maybe even the 90th percentile latency
would then be close to 110ms. If a classic histogram has bucket boundaries at
100ms and 200ms, it would see most observations in that range and estimate the
median at 150ms and the 90th percentile at 190ms.) The worst case is an
estimation at one end of a bucket where the actual value is at the other end of
the bucket. Therefore, the maximum possible error is the whole width of a
bucket. Not doing any interpolation and using some fixed midpoint within a
bucket (for example the arithmetic mean or even the harmonic mean) would
minimize the maximum possible error (which would then be half of the bucket
width in case of the arithmetic mean), but in practice, the linear
interpolation yields an error that is lower on average. Since the interpolation
has worked well over many years of classic histogram usage, interpolation is
also applied for native histograms.

For NHCBs, PromQL applies the same interpolation method as for classic
histograms to keep results consistent. (The main use case for NHCBs is a
drop-in replacement for classic histograms.) However, for standard exponential
schemas, linear interpolation can be seen as a misfit. While exponential
schemas primarily intend to minimize the relative error of quantile
estimations, they also benefit from a balanced usage of buckets, at least over
certain ranges of observed values. The basic assumption is that for most
practically occurring destributions, the density of observations tends to be
higher for smaller observed values. Therefore, PromQL uses exponential
extrapolation for the standard schemas, which models the assumption
that dividing a bucket into two when increasing the schema number by one (i.e.
doubling the resolution) will on average see similar populations in both new
buckets. A more detailed explanation can be found in the [PR implementing the
interpolation method](https://github.com/prometheus/prometheus/pull/14677).

A special case is interpolation within the zero bucket. The zero bucket breaks
the exponential bucketing schema. Therefore, linear interpolation is applied
within the zero bucket. Furthermore, if all populated regular buckets of a
histogram are positive, it is assumed that all observations in the zero bucket
are also positive, i.e. the interpolation is done between zero and the upper
bound of the zero bucket. In the case of a histogram where all populated
regular buckets are negative, the situation is mirrored, i.e. the interpolation
within the zero bucket is done between the lower bond of the zero bucket and
zero.

### Mixed series

As already discussed above, neither the sample type nor the flavor of a native
histogram is part of the identity of a series. Therefore, one and the same
series might contain a mix of different sample types and flavors.

A mix of counter histograms and gauge histograms doesn't prevent any PromQL
operation, but a warn-level annotation is returned with the result if some of
the input samples have an inappropriate flavor (see
[above](#gauge-histograms-vs-counter-histograms)).

A mix of float samples and histogram samples is more problematic. Many
functions that operate on range vectors will remove elements from the result
where the input elements contain a mix of floats and histograms. If this
happens, a warn-level annotation is added to the result. Concrete examples can
be found [below](#functions).

### Unary minus and negative histograms

The unary minus can be used on native histograms. It returns a histogram where
all bucket populations and the count and the sum of observations have their
sign inverted. Everything else stays the same, including the counter reset
hint. Note, however, that explicit counter reset detection will be thrown off
by the inverted signs. (TODO: Maybe we should mark all negative histograms as
gauges?) Negative histograms do not really make sense on their own and are only
supposed to act as intermediate results inside other expressions.

### Binary operators

Most binary operators do not work between two histograms or between a histogram
and a float or between a histogram and a scalar. If an operator processes such
an impossible combination, the corresponding element is removed from the output
vector and an info-level annotation is added to the result. (This situation is
somewhat similar to label matching, where the sample type plays a role similar
to a label. Therefore, such a mismatch might be known and deliberate, which is
the reason why the level of the annotation is only info.)

The following describes all the operations that actually _do_ work.

Addition (`+`) and subtraction (`-`) work between two compatible histograms.
These operators add or subtract all matching bucket populations and the count
and the sum of observations. Missing buckets are assumed to be empty and
treated accordingly. Subtraction might result in negative histograms, see
[notes above](#unary-minus-and-negative-histograms). Generally, both operands
should be gauges. Adding and subtracting counter histograms requires caution,
but PromQL allows it. Adding a gauge histogram and a counter histogram results
in a gauge histogram. Adding two counter histograms with contradicting counter
reset hints triggers a warn-level annotation. (TODO: The latter not yet
implemented. Also, subtraction doesn't check/modify counter reset hints yet.
This should be documented in detail in the PromQL docs.)

Multiplication (`*`) works between a float sample or a scalar on the one side
and a histogram on the other side, in any order. It multiplies all bucket
populations and the count and the sum of observations by the float (sample or
scalar). This will lead to “scaled” and sometimes even negative histograms,
which is usually only useful as intermediate results inside other expressions
(see also [notes above](#unary-minus-and-negative-histograms)). Multiplication
works for both counter histograms and gauge histograms, and their flavor is left
unchanged by the operation.

Division (`/`) works between a histogram on the left hand side and a float
sample or a scalar on the right hand side. It is equivalent to multiplication
with the inverse of the float (sample or scalar). Division by zero results in a
histogram with no regular buckets and the zero bucket population and the count
and sum of observations all set to `+Inf`, `-Inf`, or `NaN`, depending on their
values in the input histogram (positive, negative, or zero/`NaN`,
respectively).

Equality (`==`) and inequality (`!=`) work between two histograms, both in
their filtering version as well as with the `bool` modifier. They compare the
schema, the custom values, the zero threshold, all bucket populations, and the
sum and count of observations. Whether the histograms have counter or gauge
flavor is irrelevant for the comparison. (A counter histogram could be equal to
a gauge histogram.)

The logical/set binary operators (`and`, `or`, `unless`) work as expected even
if histogram samples are involved. They only check for the existence of a
vector element and don't change their behavior depending on the sample type or
flavor of an element (float or histogram, counter or gauge).

The “trim” operators `>/` and `</` were introduced specifically for native
histograms. They only work for a histogram on the left hand side and a float
sample or a scalar on the right hand side. (They do not work for float samples
or scalars on _both_ sides. An info-level annotation is returned in this case.)
These operators remove observations from the histogram that are greater or
smaller than the float value on the right side, respectively, and return the
resulting histogram. The removal is only precise if the threshold coincides
with a bucket boundary. Otherwise, interpolation within the affected buckets
has to be used, as described [above](#interpolation-within-a-bucket). The
counter vs. gauge flavor of the histogram is preserved. (TODO: These operators
are not yet implemented and might also change in detail, see [tracking
issue](https://github.com/prometheus/prometheus/issues/14651).)

### Aggregation operators

The following aggregation operators work in the same way with float and
histogram samples (for the reason stated in parentheses):

- `group` (The result of this aggregation does not depend on the sample values.)
- `count` (The result of this aggregation does not depend on the sample values.)
- `count_values` (The text representation as produced by the Go
  `FloatHistogram.String` method is used as the value of histograms.)
- `limitk` (The sampled elements are returned unchanged.)
- `limit_ratio` (The sampled elements are returned unchanged.)

The `sum` aggregation operator work with native histograms by summing up the
histogram to be aggregated (in the same way as described for the `+` operator
above). The `avg` aggregation operator works in the same way, but divides the
sum by the number of aggregated histogram (in the same way as described for the
`/` operator above). Both aggregation operators remove elements from the output
vector that would require the aggregation of float samples with histogram
samples. Such a removal is flagged by a warn-level annotation.

All other aggregation operators do _not_ work with native histograms.
Histograms in the input vector are simply ignored, and an info-level annotation
is added for each ignored histogram.

### Functions

The following functions operate on range vectors of native histograms by
applying the usual float operation individually to matching buckets (including
the zero bucket) and the sum and count of observations, resulting in a new
native histogram:

- `delta()` (For gauge histograms.)
- `increase()` (For counter histograms.)
- `rate()` (For counter histograms.)
- `idelta()` (For gauge histograms.)
- `irate()` (For counter histograms.)

TODO: `idelta` and `irate` are not yet implemented for histograms.

These functions SHOULD be applied to either gauge histograms or counter
histograms as noted above. However, they all work with both flavors, but if at
least one histogram of an unsuitable flavor is contained in the range vector, a
warn-level annotation is added to the result.

All these functions return no result for series that contain a mix of float
samples and histogram samples within the range. A warn-level annotation is
added for each output element missing for that reason.

All these functions return gauge histograms as results.

TODO: Preventing [extrapolation below
zero](https://github.com/prometheus/prometheus/blob/034d2b24bcae90fce3ac337b4ddd399bd2ff4bc4/promql/functions.go#L153-L159)
is currently not yet implemented (and might actually not make sense) for native
histograms. This may lead to slightly different results when comparing classic
histograms with equivalent NHCBs.

`avg_over_time()` and `sum_over_time()` work with native histograms in a way
that corresponds to the respective aggregation operators. In particular, if a
series contains a mix of float samples and histogram samples within the range,
the corresponding result is removed entirely from the output vector. Such a
removal is flagged by a warn-level annotation.

The `changes()` and the `resets()` function work with native histogram samples
in the same way as with float samples. They even work with a mix of float
samples and histogram samples within the same series. In this case, a change
from a float sample to a histogram sample and vice versa counts as a change for
`changes()` and as a reset for `resets()`. A change in flavor from counter
histogram to gauge histogram and vice versa does not count as a change for
`changes()`. `resets()` SHOULD only be applied to counter floats and counter
histograms, but the function still works with gauge histograms, applying
explicit counter reset detection in this case. Furthermore, a change from
counter histogram to gauge histogram and vice versa is counted as a reset.
(TODO: Not implemented yet.)

The `histogram_quantile()` function has a very special role as it is the only
function that treats a specific “magic” label specially, namely the `le` label
used by classic histograms. `histogram_quantile()` also works for native
histograms in a similar way, but without the special role of the `le` label.
The function keeps treating float samples in the known way, while it uses the
new “native” way for native histogram samples.

An example for a typical query for classic histograms (including `rate` and
aggregation):

```
histogram_quantile(0.9, sum by (job, le) (rate(http_request_duration_seconds_bucket[10m])))
```

This is the corresponding query for a native histograms:
```
histogram_quantile(0.9, sum by (job) (rate(http_request_duration_seconds[10m])))
```

As with classic histograms, an estimation of the maximum and minimum
observation in a histogram can be performed using 1 and 0, respectively, as the
first parameter of `histogram_quantile`. However, native histograms with
standard schemas enable much more useful results, not only because of the
usually higher resolution of native histograms, but even more so because native
histograms with standard schemas sustain the same resolution across the whole
range of float64 numbers. With a classic histogram, the odds are that the
maximum observation is in the +Inf bucket, so that the estimation simply
returns the upper limit of the last bucket before the +Inf bucket. Similarly,
the minimum observation will often be in the lowest bucket.

`histogram_quantile` treats observations of value `NaN` (which SHOULD NOT
happen, see [above](#special-cases-of-observed-values)) effectively as
observations of `+Inf`. This follows the rationale that `NaN` is never less
than any value that `histogram_quantile` returns and is consistent with how
classic histograms usually treat `NaN` observations (which end up in the `+Inf`
bucket in most implementations). (TODO: The correct implementation of this
behavior still needs to be verified by tests.)

The following functions have been introduced specifically for native
histograms:

- `histogram_avg()`
- `histogram_count()`
- `histogram_fraction()`
- `histogram_sum()`
- `histogram_stddev()`
- `histogram_stdvar()`

All these functions silently ignore float samples as input. Each function
returns a vector of float samples.

`histogram_count()` and `histogram_sum()` return the count of observations or the sum of
observations, respectively, that are contained in a native histogram. As they are normal
functions, their result cannot be used in a range selector. Instead of using
sub-queries, the recommended way to calculate a rate of the count or the sum of
observations is to first rate the histogram and then apply `histogram_count()`
or `histogram_sum()` to the result. For example, the following query calculates
the rate of observations (in this case corresponding to “requests per second”)
from a native histogram:
```
histogram_count(rate(http_request_duration_seconds[10m]))
```

Note that the special counter reset detection for native histograms doesn't
apply when using a sub-query on the result of `histogram_sum()`, i.e. negative
observations may result in spurious counter resets.

`histogram_avg()` returns the arithmetic average of the observed values
in a native histogram. (This is notably different from applying the `avg`
aggregation operator to a number of native histograms. The latter returns an
averaged histogram.)

Similarly, `histogram_stddev()` and `histogram_stdvar()` return the estimated
standard deviation or standard variance, respectively, of the observations in a
native histogram. For this estimation, all observations in a bucket are assumed to
have the value of the geometric mean of the bucket boundaries.

`histogram_fraction(lower, upper, histogram)` returns the estimated fraction of
observations in `histogram` between the provided boundaries, the scalar values
`lower` and `upper`. The error of the estimation depends on the resolution of
the underlying native histogram and how closely the provided boundaries are
aligned with the bucket boundaries in the histogram. `+Inf` and `-Inf` are
valid boundary values and useful to estimate the fraction of all observations
above or below a certain value. However, observations of value `NaN` are always
considered to be outside of the specified boundaries (even `+Inf` and `-Inf`).
(TODO: Verify the correct implementation of this behavior with tests.) Whether
the provided boundaries are inclusive or exclusive is only relevant if the
provided boundaries are precisely aligned with bucket boundaries in the
underlying native histogram. In this case, the behavior depends on the precise
definition of the schema of the histogram.

The following functions do not interact directly with sample values and
therefore work with native histogram samples in the same way as they work with
float samples: (TODO: Still need to verify that this is true for all of the
functions below. Need to update the documentation for some of them.)

- `absent()`
- `absent_over_time()`
- `count_over_time()`
- `info()`
- `label_join()`
- `label_replace()`
- `last_over_time()`
- `present_over_time()`
- `sort_by_label()`
- `sort_by_label_desc()`
- `timestamp()`

All remaining functions not mentioned in this section do _not_ work with native
histograms. Histogram elements in the input vector are silently ignored. (TODO:
Make sure this is the case, rather than treating histogram samples as floats
with value 0.) For `deriv()`, `double_exponential_smoothing()`,
`predict_linear()`, and all the `<aggregation>_over_time()` functions not
mentioned before, native histogram samples are removed from the input range
vector. In case any series contains a mix of float samples and histogram
samples within the range, the removal of histograms is flagged by an info-level
annotation.

### Recording rules

Recording rules MAY result in native histogram values. They are stored back
into the TSDB as during normal ingestion, including whether the histogram is a
gauge histogram or a counter histogram. In the latter case, a counter reset
explicitly marked by the counter reset hint is also stored, while a new counter
reset detection is initiated during ingestion otherwise.

TSDB implementations MAY convert the float histograms created by recording
rules to integer histograms if this conversion precisely represents all the
float values in the original histogram.

### Alerting rules

Alerts work as usual with native histograms. However, it is RECOMMENDED to
avoid native histograms as output values for alerts. If native histogram
samples are used in templates, they are [rendered in their simple text
form](#template-expansion) (as producted by the Go `FloatHistogram.String`
method), which is hard to read for humans.

### Testing framework

The PromQL testing framework has been extended so that both PromQL unit tests
as well as rules unit tests via `promtool` can include native histograms. The
histogram sample notation is complex and explained in the [documentation for
rules unit
testing](https://prometheus.io/docs/prometheus/latest/configuration/unit_testing_rules/#series).

There is an alternative `load` command called `load_with_nhcb`, which converts
classic histograms to NHCBs and loads both the float series of the classic
histogram as well as the NHCB series resulting from the conversion.

Not specific to native histograms, but very useful in their context, are the
`eval_info` and `eval_warn` keywords that expect the evaluation to result in at
least one info-level annotation or at least one warn-level annotation,
respectively. It is currently neither possible to test for the presence of
annotations of both levels nor to test for specific annotations.

### Optimizations

As usual, PromQL implementations MAY apply any optimizations they see fit as
long as the behavior stays the same. Decoding native histograms can be quite
expensive with the potentially many buckets. Similarly, deep-copying a
histogram sample within the PromQL engine is much more expensive than copying a
simple float sample. This creates a huge potential for optimization compared to
a naive approach of always decoding everything and always copying everything.

Prometheus currently tries to avoid needless copies (TODO: but a proper CoW
like approach still has to be implemented, as it would be much cleaner and less
bug prone) and skips decoding of the buckets for special cases where only the
sum and count of observations is required.

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

For standard schemas, positive buckets are “open left”, negative buckets are
“open right”, and the zero bucket (with a negative left boundary and a positive
right boundary) is “closed both”. For NHCBs, all buckets are “open left”
(mirroring the behavior of classic histograms). Future schemas might utilize
different boundary rules.

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
`request_duration_seconds` will be represented by these metadata endpoints
only as `request_duration_seconds` (and not `request_duration_seconds_sum`,
`request_duration_seconds_count`, or `request_duration_seconds_bucket`). A
native histogram `request_duration_seconds` will also be represented under this
name. Even in the case where `request_duration_seconds` is ingested as both a
classic and a native histogram, there will be no collision as the metadata
returned is actually the same (most notably the returned `type` will be
`histogram`). In other words, there is currently no way of distinguishing
native from classic histograms via the metadata endpoints alone. An additional
look-up via the `series` endpoint is required. There are no plans to change
this, as the existing metadata endpoints are anyway severely limited (no
historical information, no metadata for metrics created by rules, limited
ability to handle conflicting metadata between different targets). There are
plans, though, to improve metadata handling in Prometheus in general. Those
efforts will also take into account how to support native histograms properly.
(TODO: Update as progress is made.)

## Prometheus UI

This section describes the rendering of histograms by Prometheus's own UI. This
MAY be used as a guideline for third party graphing frontends.

In the _Table_ view, a histogram data point is rendered graphically as a bar
graph together with a textual representation of all the buckets with their
lower and upper limit and the count and sum of observations. Each bar in the
bar graph represents a bucket. The position of each bar on the _x_ axis is
determined by the lower and upper limit of the corresponding bucket. The area
of each bar is proportional to the population of the corresponding bucket
(which is a core principle of rendering histograms in general).

The graphical histogram allows a choice between an exponential and a linear _x_
axis. The former is the default. It is a good fit for the standard schemas.
(TODO: Consider linear as a default for non-exponential schemas.) Conveniently,
all regular buckets of an exponential schema have the same width on an
exponential _x_ axis. This means that the _y_ axis can display actual bucket
populations without violating the above principle that the _area_ (not the
height) of a bar is representative for the bucket population. The zero bucket
is an exception to that. Technically, it has an infinite width. Prometheus
simply renders it with the same width as the regular exponential buckets (which
in turn means that the _x_ axis is not strictly exponential around the zero
point). (TODO: How to do the rendering for non-exponential schemas.)

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
intervals. (This is generated by the `FloatHistogram.String` method in Go.) As
native histograms can have a lot of buckets and bucket boundaries tend to have
boundaries with a lot of decimal places, the representation isn't necessarily
very readable. Use native histograms in template expansion judiciously.

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
native histograms are a stable feature.

It might appear tempting to convert classic histograms to NHCBs while sending
or receiving them. However, this does not overcome the known consistency
problems classic histograms suffer from when transmitted via remote write.
Instead, classic histograms SHOULD be converted to NHCBs during scraping.
Similarly, explicit OTel histograms SHOULD be converted to NHCBs during [OTLP
ingestion](#otlp) already. (TODO: See [tracking
issue](https://github.com/prometheus/prometheus/issues/15022).)

TODO: A remaining possible problem with remote write is what to do if multiple
exemplars originally ingested for the same native histogram are sent in
different remote-write requests.

## Federation

Federation of native histograms works as expected, provided the federation
scrape uses the protobuf format. A federation via OpenMetrics text format will
be possible, at least in principle, once native histograms are supported in
that format, but federation via protobuf is preferred for efficiency reasons
anyway.

TODO: Clarify state of federation of NHCBs. Update once OM supports NH.

## OTLP

The OTLP receiver built into Prometheus converts incoming OTel exponential
histograms to Prometheus native histograms utilizing the compatibility
described [above](#opentelemetry-interoperability). The resolution of a
histogram using a schema (“scale” in OTel lingo) greater than 8 will be reduced
to match schema 8. (In the unlikely case that a schema smaller than -4 is used,
the ingestion will fail.)

Explicit OTel histograms are the equivalent of Prometheus's classic histograms.
Prometheus therefore converts them to classic histograms by default, but
optionally offers direct conversion to NHCBs. (TODO: Not implemented yet, see
[tracking issue](https://github.com/prometheus/prometheus/issues/15022).)

TODO: Is the OTLP receiver documented anywhere? Link the documentation here.

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
histograms. Commands not mentioned explicitly do not directly interact with
native histograms and require no changes.

The `promtool query ...` commands work with native histograms. See the [query
API documentation](instant-and-range-queries) to learn about the output format.
A new command `promtool query analyze` was specifically added to analyze
classic and native histogram usage patterns returned by the query API.

The rules unit testing via `promtool test rules` works with native histograms,
using the format described [above](#testing-framework). 

`promtool tsdb analyze` and `promtool tsdb list` work normally with native
histograms. The `--extended` output of the former has specific sections for
histogram chunks.

`promtool tsdb dump` uses the usual text representation of native histograms
(as produced by the Go method `FloatHistogram.String`).

`promtool tsdb create-blocks-from rules` works with rules that emit native
histograms.

The `promtool promql ...` commands support all the PromQL features added for
native histograms.

While `promtool tsdb bench write` could in principle include native histograms,
such a support is not planned at the moment.

The following commands depend on the OpenMetrics text format and
therefore cannot support native histograms as long as there is no native
histogram support in OpenMetrics:

- `promtool check metrics`
- `promtool push metrics`
- `promtool tsdb dump-openmetrics`
- `promtool tsdb create-blocks-from openmetrics`

TODO: Update as progress is made. See [tracking
issue](https://github.com/prometheus/prometheus/issues/12146).

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
   there are tricky edge cases, which make it hard to perform a reliable
   auto-conversion.
2. Classic and native histograms cannot be aggregated with each other. A change
   from classic to native histograms at a certain point in time makes it hard
   to create dashboards that work across the transition point, and range
   vectors that contain the transition point will inevitably be incomplete
   (i.e. a range vector selecting classic histograms will only contain data
   points in the earlier part of the range, and a range vector selecting native
   histograms will only contain data points in the later part of the range).
3. A classic histogram might be tailored to have bucket boundaries precisely at
   the points of interest. Native histograms with a standard schema can have a
   high resolution, but do not allow to set bucket boundaries at arbitrary
   values. In those cases, the user experience with native histograms might
   actually be worse.
   
To address (3), it is of course possible to not migrate the classic histogram
in question and leave things as they are. Another option is to leave the
instrumentation the same but convert classic histograms to NHCBs upon
ingestion. This leverages the increased storage performance of native
histograms, but still requires to address (1) and (2) in the same way as for a
full migration to native histograms (see next paragraphs).

The conservative way of addressing (1) and (2) is to allow a long transition
period, which comes at the cost of collecting and storing classic and native
histograms in parallel for a while.

The first step is to update the instrumentation to expose classic and native
histograms in parallel. (This step can be skipped if the plan is to stick with
classic histogram in the instrumentation and simply convert them to NHCBs
during scraping.)

Then configure Prometheus to scrape both classic and native histograms, see
section about [scraping both classic and native
histograms](#scraping-both-classic-and-native-histograms) above. (If needed,
also [activate the conversion of classic histograms to
NHCB](#scraping-classic-histograms-as-nhcbs).)

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
parallel, can be quite long to minimize the necessity to implement tricky
switch-overs. For example, once classic and native histograms have been
collected in parallel for a month, any dashboard not looking farther back than
a month can simply be switched over from a classic histogram query to a native
histogram query without any consideration about the right switch-over.

Once there is confidence that all queries have been migrated correctly,
configure Prometheus to only scrape native histograms (which is the “normal”
setting). (It is also possible to incrementally remove classic histograms with
relabel rules in the scrape config.) If everything still works, it is time to
remove classic histograms from the instrumentation.

The Grafana Mimir documentation contains [a detailed migration
guide](https://grafana.com/docs/mimir/next/send/native-histograms/#migrate-from-classic-histograms)
following the same philosophy as described in this section.
