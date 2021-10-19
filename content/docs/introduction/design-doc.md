---
title: Design Documents
sort_rank: 7
---

# Design documents

When contributing large changes or features to the Prometheus ecosystem, design
documents are written by individuals or groups. Those documents are proposed for
review and approval to the community.

This page is a list of the design documents we know of. If you create a new
design document, or some documents are not listed, please open a [pull
request](https://github.com/prometheus/docs/) to add it to this list.

Design docs do not always reflect exactly what has been implemented, and
implementation details might have changed since a feature was merged. Design
docs are not considered documentation and can not define a standard.

If you want to pick a design doc in `TODO` or implement a proposed design doc,
please reach out to the [developers mailing list](/community) first to make sure
no one else has picked that task already, and the design doc is approved and
still relevant.

| Document | Initial date | Status | Pull requests |
| -------- | ------------ | ------ | ------------- |
| [Secure Alertmanager cluster traffic](https://github.com/prometheus/alertmanager/blob/master/doc/design/secure-cluster-traffic.md) | 2019‑02‑21 | Approved | [alertmanager#2237](https://github.com/prometheus/alertmanager/pull/2237) |
| TSDB Head Improvements ([part1](https://docs.google.com/document/d/184urkLQnM7rqLmGvS66I15jU2pyPk_qwd8v_qDlXczo/edit) - [part 2](https://docs.google.com/document/d/1pnEsxB0CDLOxQipGw_vhkJpoDZfZPs_KjqCriumDAXQ/edit)) | 2019‑12‑09 | Partially implemented | |
| [Persist Retroactive Rules](https://docs.google.com/document/d/16s_-RxYwQYcb4G4mvpmjPolEbD24o54a1LPqJ538Vhc/edit) | 2020‑06‑12 | Partially implemented | [#7675](https://github.com/prometheus/prometheus/pull/7675) |
| [topk/bottomk aggregation over time](https://docs.google.com/document/d/1uSbD3T2beM-iX4-Hp7V074bzBRiRNlqUdcWP6JTDQSs/edit) | 2020‑09‑30 | Implemented | [#8121](https://github.com/prometheus/prometheus/pull/8121) [#8425](https://github.com/prometheus/prometheus/pull/8425) |
| [http\_sd\_configs](https://docs.google.com/document/d/1tVeuzjpU4-TiYPNWJXKmcyIuZF6A2tUq270RbBT5zho/edit) | 2021‑02‑26 | Under review | [#8839](https://github.com/prometheus/prometheus/pull/8839) |
| [prometheus/client\_java & micrometer](https://docs.google.com/document/d/1vROky2aIw3kAllfi95gwDJy5P2DyWnCihsjPXGpLwwo/edit) | 2021‑02‑26 | Under review | |
| [First-class network monitoring support in the Prometheus & Grafana ecosystem](https://docs.google.com/document/d/1oEpjiWfTHF352NCAOGolwij3EIkrprCkdQmaQMpjg4M/edit) | 2021‑02‑25 | Under review | |
| [Configuration handling in exporters and Prometheus 3.x](https://docs.google.com/document/d/1BK_Gc3ixoWyxr9F5qGC07HEcfDPtb6z96mfqoGyz52Y/edit) | 2021‑03‑29 | Under review | |
| [Prometheus Agent](https://docs.google.com/document/d/1cCcoFgjDFwU2n823tKuMvrIhzHty4UDyn0IcfUHiyyI/edit) | 2021‑01‑27 | Approved | [#8785](https://github.com/prometheus/prometheus/pull/8785) |
| [Sparse high-resolution histograms](https://docs.google.com/document/d/1cLNv3aufPZb3fNfaJgdaRBZsInZKKIHo9E6HinJVbpM/edit) | 2021‑02‑10 | Approved | |
| [Prometheus timezones support](https://docs.google.com/document/d/1xfw1Lb1GIRZB_-4iFVGkgwnpwuBemWfxYqFdBm7APsE/edit) | 2021‑05‑29 | Proposed | |
| [Moving to goreleaser](https://docs.google.com/document/d/16LOT2wK-jntlU-EFADfaEF3YbKH81U9Zl_PvSu4qVwo/edit) | 2021‑06‑05 | Proposed |
| [Alertmanager Log Receiver](https://docs.google.com/document/d/1Oevu2stHVGAupzmc9C7_wW5nTb_CJ6Ut72viXfve6zI/edit) | 2021‑06‑10 | Proposed |
| [Extra HTTP parameters in the blackbox exporter](https://docs.google.com/document/d/1VwqXi2TOb5KXaZY6Iio7411x64pJao3GusX8MqYsJ2g/edit) | 2021‑06‑23 | Proposed | |
| [Transactional remote-write](https://tsdb.co/txn-rw-design) | 2021-08-09 | Under review | |
| [Metadata](https://docs.google.com/document/d/1XiZePSjwU4X5iaIgCIvLzljJzl8lRAdvputuborUcaQ/edit) | | TODO | |
| OpenMetrics transition | | TODO | |
| Semantics of muting in Alertmanager | | TODO | |
| Extrapolation in range selectors (xrange) | | TODO | |
| Serverless, MQTT, and IoT use cases in the Prometheus ecosystem | | TODO | |
| Static arithmetic for timestamps and durations | | TODO | |

# Problem statements and exploratory documents

Sometimes we're looking even further into potential futures. The documents in
this section are largely exploratory. They should be taken as informing our
collective thoughts, not as anything concrete or specific.

| Document | Initial date |
| -------- | ------------ |
| [Prometheus is not feature complete](https://docs.google.com/document/d/1lEP7pGYM2-5GT9fAIDqrOecG86VRU8-1qAV8b6xZ29Q) | 2020-05 |
| [Thoughts about timestamps and durations in PromQL]() | 2020-10 |
| [Prometheus, OpenMetrics & OTLP](https://docs.google.com/document/d/1hn-u6WKLHxIsqYT1_u6eh94lyQeXrFaAouMshJcQFXs) | 2021-03 |
| [Prometheus Sparse Histograms and PromQL](https://docs.google.com/document/d/1ch6ru8GKg03N02jRjYriurt-CZqUVY09evPg6yKTA1s/edit) | 2021-10 |
