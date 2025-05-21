---
title: Prometheus Metric and Label Name Escaping Schemes
sort_rank: 2
---

# Prometheus Metric and Label Name Escaping Schemes

## Abstract

This document specifies the different escaping schemes used by Prometheus for
metric and label names that contain characters outside the legacy character set.
These schemes are negotiated during scraping via the `escaping` parameter in the
Accept and Content-Type headers.

## Introduction

Prometheus supports multiple escaping schemes to handle metric and label names
that contain characters outside the legacy character set (a-zA-Z0-9_:). The
escaping scheme is negotiated during scraping and affects how metric producers
should format their metric names.

## Escaping Schemes

### No Escaping (allow-utf-8)

**Header Value**: `escaping=allow-utf-8`

**Behavior**:
- Metric and label names MUST be valid UTF-8 strings
- No character escaping is performed
- Because names are quoted in the exposition text formats, UTF-8 strings MUST
  be escaped using Go-style backslash escape codes for special characters,
  particularly quote and whitespace characters
- This scheme SHOULD only be used when both the producer and consumer support UTF-8 names

### Underscore Escaping (underscores)

**Header Value**: `escaping=underscores`

**Behavior**:
- Any character that is not in the legacy character set (a-zA-Z0-9_:) MUST be
  replaced with an underscore
- The first character MUST be either a letter, underscore, or colon
- Subsequent characters MUST be either letters, numbers, underscores, or colons
- Example: `metric.name/with/slashes` becomes `metric_name_with_slashes`

### Dots Escaping (dots)

**Header Value**: `escaping=dots`

**Behavior**:
- Dots (.) MUST be replaced with `_dot_`
- Existing underscores MUST be replaced with double underscores (`__`)
- Other non-legacy characters MUST be replaced with underscores
- Example: `metric.name.with.dots` becomes `metric_dot_name_dot_with_dot_dots`

### Value Encoding Escaping (values)

**Header Value**: `escaping=values`

**Behavior**:
- The name MUST be prefixed with `U__`
- Each character that is not part of the legacy character set (a-zA-Z0-9_:) MUST
  be replaced with its Unicode code point in hexadecimal, surrounded by
  underscores
- Single underscores MUST be replaced with double underscores
- Example: `metric.name` becomes `U__metric_2E_name` (where 2E is the hex Unicode code point for '.')

## Default Behavior

If no escaping scheme is specified in the Accept header, `underscores` escaping
SHOULD be used.

## Security Considerations

1. Metric producers MUST validate input names before applying escaping
2. The escaping scheme MUST be validated to prevent injection attacks
3. UTF-8 validation MUST be performed before applying any escaping scheme
4. The `allow-utf-8` scheme SHOULD only be used when both producer and consumer support UTF-8 names

