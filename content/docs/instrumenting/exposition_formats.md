---
title: Exposition formats
sort_rank: 2
---

# Exposition formats

Prometheus implements two different transfer formats which clients may use to
expose metrics to a Prometheus server: a simple text-based format and a more
efficient and robust protocol-buffer format. Prometheus servers and clients
use [content negotation](http://en.wikipedia.org/wiki/Content_negotiation)
to establish the actual format to use. A server will prefer receiving the
protocol-buffer format, and will fall back to the text-based format if the
client does not support the former.

For details on each format, see the [Client Data Exposition Format](https://docs.google.com/document/d/1ZjyKiKxZV83VI9ZKAXRGKaUKK2BIWCT7oiGBKDBpjEY/edit?usp=sharing) document.
