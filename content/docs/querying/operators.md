---
title: Operators
sort_rank: 2
---

# Operators

## Binary operators

Prometheus's query language supports basic logical and arithmetic operators.
For operations between two instant vectors, the [matching behavior](#vector-matching)
can be modified.

### Arithmetic binary operators
The following binary arithmetic operators exist in Prometheus:

* `+` (addition)
* `-` (subtraction)
* `*` (multiplication)
* `/` (division)
* `%` (modulo)

Binary arithmetic operators are defined between scalar/scalar, vector/scalar,
and vector/vector value pairs.

**Between two scalars**, the behavior is obvious: they evaluate to another
scalar that is the result of the operator applied to both scalar operands.

**Between an instant vector and a scalar**, the operator is applied to the
value of every data sample in the vector. E.g. if a time series instant vector
is multiplied by 2, the result is another vector in which every sample value of
the original vector is multiplied by 2.

**Between two instant vectors**, a binary arithmetic operator is applied to
each entry in the left-hand-side vector and its [matching element](#vector-matching)
in the right hand vector. The result is propagated into the result vector and the metric
name is dropped. Entries for which no matching entry in the right-hand vector can be
found are not part of the result.

### Comparison/filter binary operators

The following binary comparison/filter operators exist in Prometheus:

* `==` (equal)
* `!=` (not-equal)
* `>` (greater-than)
* `<` (less-than)
* `>=` (greater-or-equal)
* `<=` (less-or-equal)

Comparison/filters operators are defined between scalar/scalar, vector/scalar,
and vector/vector value pairs.

**Between two scalars**, these operators result in another scalar that is
either `0` (`false`) or `1` (`true`), depending on the comparison result.

**Between an instant vector and a scalar**, these operators are applied to the
value of every data sample in the vector, and vector elements between which the
comparison result is `false` get dropped from the result vector.

**Between two instant vectors**, these operators behave as a filter, applied to
matching entries. Vector elements for which the expression is not true or
which do not find a match on the other side of the expression get dropped from the
result, while the others are propagated into a result vector with their original
(left-hand-side) metric names and label values.

### Logical/set binary operators

These logical/set binary operators are only defined between instant vectors:

* `and` (intersection)
* `or` (union)

`vector1 and vector2` results in a vector consisting of the elements of
`vector1` for which there are elements in `vector2` with exactly matching
label sets. Other elements are dropped. The metric name and values are carried
over from the left-hand-side vector.

`vector1 or vector2` results in a vector that contains all original elements
(label sets + values) of `vector1` and additionally all elements of `vector2`
which do not have matching label sets in `vector1`.

## Vector matching

Operations between vectors attempt to find a matching element in the right-hand-side
vector for each entry in the left-hand side. There are two basic types of
matching behavior:

**One-to-one** finds a unique pair of entries from each side of the operation.
In the default case, that is an operation following the format `vector1 <operator> vector2`.
Two entries match if they have the exact same set of labels and corresponding values.
The `on` keyword allows reducing the set of considered labels to a provided list:

    <vector expr> <bin-op> on(<label list>) <vector expr>

Example input:

    method:http_errors:rate5m{source="internal", method="get", code="500"}  24
    method:http_errors:rate5m{source="external", method="get", code="404"}  30
    method:http_errors:rate5m{source="internal", method="put", code="501"}  3
    method:http_errors:rate5m{source="internal", method="post", code="500"} 6
    method:http_errors:rate5m{source="external", method="post", code="404"} 21

    method:http_requests:rate5m{method="get"}  600
    method:http_requests:rate5m{method="del"}  34
    method:http_requests:rate5m{method="post"} 120

Example query:

    method:http_errors:rate5m{code="500"} / on(method) method:http_requests:rate5m

This returns a result vector containing the fraction of HTTP requests with status code
of 500 for each method, as measured over the last 5 minutes. Without `on(method)` there
would have been no match as the metrics do not share the same set of labels.
The entries with methods `put` and `del` have no match and will not show up in the result:

    {method="get"}  0.04            //  24 / 600
    {method="post"} 0.1             //  12 / 120

**Many-to-one** and **one-to-many** matchings refer to the case where each vector element on
the "one"-side can match with multiple elements on the "many"-side. This has to
be explicitly requested using the `group_left` or `group_right` modifier, where
left/right determines which vector has the higher cardinality.

    <vector expr> <bin-op> on(<label list>) group_left(<label list>) <vector expr>
    <vector expr> <bin-op> on(<label list>) group_right(<label list>) <vector expr>

The label list provided with the group modifier contains additional labels from the "many"-side
to be included in the result metrics. A label can only appear in one of the lists. Every time
series of the result vector must be uniquely identifiable by the labels from both lists combined.

_Grouping modifiers can only be used for [comparison/filtering](#comparison-/-filter-binary-operators)
and [arithmetic](#arithmetic-binary-operators) operations as `and` and `or` operations
match with all possible entries in the right vector by default._

Example query:

    method:http_errors:rate5m / on(method) group_left(code,source) method:http_requests:rate5m

In this case the left vector contains more than one entry per `method` label value. Thus,
we indicate this using `group_left`. To ensure that the result vector entries are unique, additional
labels have to be provided. Either `code` or `source` satisfy this requirement, but both
can be added for a more detailed result. The elements from the right side
are now matched with multiple elements with the same `method` label on the left:

    {source="internal", method="get", code="500"}  0.04            //  24 / 600
    {source="external", method="get", code="404"}  0.05            //  30 / 600
    {source="internal", method="post", code="500"} 0.1             //  12 / 120
    {source="external", method="post", code="404"} 0.175           //  21 / 120

_Many-to-one and one-to-many matching are advanced use cases that should be carefully considered.
Often a proper use of `on(<labels>)` provides the desired outcome._


## Aggregation operators

Prometheus supports the following built-in aggregation operators that can be
used to aggregate the elements of a single instant vector, resulting in a new
vector of fewer elements with aggregated values:

* `sum` (calculate sum over dimensions)
* `min` (select minimum over dimensions)
* `max` (select maximum over dimensions)
* `avg` (calculate the average over dimensions)
* `stddev` (calculate population standard deviation over dimensions)
* `stdvar` (calculate population standard variance over dimensions)
* `count` (count number of elements in the vector)

These operators can either be used to aggregate over **all** label dimensions
or preserve distinct dimensions by including a `by`-clause.

    <aggr-op>(<vector expression>) [by (<label list>)] [keep_common]

By default, labels that are not listed in the `by` clause will be dropped from
the result vector, even if their label values are identical between all
elements of the vector. The `keep_common` clause allows to keep those extra
labels (labels that are identical between elements, but not in the `by`
clause).

Until Prometheus 0.14.0, the `keep_common` keyword was called `keeping_extra`.
The latter is still supported, but is deprecated and will be removed at some
point.

Example:

If the metric `http_requests_total` had time series that fan out by
`application`, `instance`, and `group` labels, we could calculate the total
number of seen HTTP requests per application and group over all instances via:

    sum(http_requests_total) by (application, group)

If we are just interested in the total of HTTP requests we have seen in **all**
applications, we could simply write:

    sum(http_requests_total)
