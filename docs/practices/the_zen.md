---
title: The Zen of Prometheus
sort_rank: 9
---

# The Zen of Prometheus

**The Zen of Prometheus** is beginner friendly set of core values and guidelines for instrumenting your applications and writing idiomatic alerts using Prometheus.
This is a document that's intended to maintained by the Prometheus community. Feel free to [contribute](https://github.com/prometheus/docs).

## Instrument first, ask questions later

During development you will never know what questions you need to ask later. Software needs good instrumentation, it's not optional. A metric without labels is cheap. Use them generously, but be mindful of [cardinality](#cardinality-matters) when adding labels.

The first and most important rule—if you have to remember only one thing, remember this one. Instrument all the things.

## Measure what users care about

Do your users care if your database servers are down? Do they care about your CPU saturation? Yes, but not directly—they care about what they experience. They care about whether they can access the page they requested and whether their results are fresh. Think in terms of latencies and availability. Let your [SLO](https://landing.google.com/sre/sre-book/chapters/service-level-objectives/)s guide your instrumentation and [alerting](#if-you-can-graph-it-you-can-alert-on-it).

[RED](https://grafana.com/blog/2018/08/02/the-red-method-how-to-instrument-your-services/), [USE](http://www.brendangregg.com/usemethod.html) and [The Four Golden Signals](https://landing.google.com/sre/sre-book/chapters/monitoring-distributed-systems/#xref_monitoring_golden-signals) are known frameworks to get you started.

You should still measure internal metrics like database availability and CPU saturation—use them for troubleshooting and capacity planning.

    Use causal metrics to answer why something is broken.

## Labels are the new hierarchies

**Labels are the new hierarchies**, yet more powerful and flexible. Labels are what make Prometheus strong. Using labels, one can group and aggregate measurements afterwards. Slice and dice using Labels. Remember [Instrument first, ask questions later](#instrument-first-ask-questions-later), provide much context as possible.

However, you have to *use labels with care*. The reasons will explain in subsequent rules.

## Avoid missing metrics

Time series that are not present until something happens are difficult to deal with. To avoid this, export 0 for any time series you know may exist in advance. Initialize your metrics with zero values to prevent broken dashboards and misfiring alerts. For a more detailed explanation, check out [Existential issues with metrics](https://www.robustperception.io/existential-issues-with-metrics).

Remember, labels create time series, so initialize your metrics with the labels you expect to use—your client libraries cannot know what labels you will have.

## Cardinality Matters

Every unique set of labels creates a new time series. Use labels with care and watch out what you put into them. Avoid cardinality explosions; unbounded labels will blow up Prometheus. Keep in mind that labels are multiplicative across dimensions.

    Prometheus performance almost always comes down to one thing: label cardinality.

Always remember that [Cardinality is key](https://www.robustperception.io/cardinality-is-key).

## Naming is hard

One of the hardest problems in computer science. A metric name should have a single meaning within a job. Metrics with the same name in different jobs should represent the same thing (like `process_cpu_seconds_total`).

*Respect conventions over preferences*. Conventions are no one's favorite, yet conventions are everyone's favorite. See the documentation on [Naming](https://prometheus.io/docs/practices/naming/) for the nitty-gritty details.

---

## Counters rule and gauges suck

If you can express something as a counter, use a counter and derive what you need later. Counters are powerful; you can use `rate()` and `increase()` to get rates, deltas, and more. Remember [Instrument first, ask questions later](#instrument-first-ask-questions-later).

Of course, gauges have their place. Use them for values that go up and down (like temperature, queue depth, or concurrent connections). But if something only ever increases, make it a counter.

Don't add metrics for aggregations; PromQL can do it for you.

## First the rate, then aggregate

Be aware of [counter resets](https://www.robustperception.io/how-does-a-prometheus-counter-work).
    As stated in [Rate then sum, never sum then rate](https://www.robustperception.io/rate-then-sum-never-sum-then-rate).
    As a rule of thumb, the only mathematical operations you can safely directly apply to a counter's values are `rate`, `irate`, `increase`, and `resets`. Anything else will cause you problems.

## If you can log it, you can have a metric for it

    Logs and metrics complement each other: metrics give the insight that something isn't working as expected and logs give you the "what is happening".

Whenever you handle an error (either by returning it or logging it), consider whether you can increment a counter and alert on elevated error rates. Spread counters liberally. Remember, a metric without labels is cheap.

## One does not simply use Histograms

Histograms are powerful.

With classic histograms, creating a correct bucket layout is an art. To ensure usefulness of your observations and correctness of your alerts, you have to come up with a meaningful bucket layout. This conflicts with [Instrument first, ask questions later](#instrument-first-ask-questions-later) because you need to have an idea about your latencies before you even measure. Let your [SLO](https://www.youtube.com/watch?v=X99X-VDzxnw)s guide your bucket layout; create boundaries to match your SLO.

Classic histograms underneath are just counters with labels, where bucket boundaries are used as labels. Be cautious when adding additional labels to your histograms. Remember, *labels are multiplicative* and [Cardinality Matters](#cardinality-matters).

[Native histograms](https://prometheus.io/docs/specs/native_histograms/) solve the bucket layout problem. They require no predefined boundaries, adjust resolution dynamically, and use sparse representation where empty buckets cost nothing. If your client library supports them (currently Go and Java), prefer native histograms for new instrumentation.

---

## If you can graph it, you can alert on it

You can't look at dashboards 24/7. Prometheus unifies metrics, dashboarding, and alerting. PromQL is the core of every Prometheus alert, and a PromQL query is the source of any graph on a dashboard. Use it.

## If you run it, then you should put an alert on it

Always have an alert, *at least*, on presence and healthiness of your targets. You can't rely on things you can't observe or take action on.

Avoid missing and unhealthy targets. Prometheus generates the `up` metric automatically for each target. Use it.

## Alerts should be urgent, important, actionable, and real

[Alerts should be urgent, important, actionable, and real](https://www.robustperception.io/when-to-alert-with-prometheus). As plain as it goes.

And don't over alert, alert-fatigue is real.

## Symptom-based alerts for paging, cause-based for troubleshooting

Similar to [Measure what users care about](#measure-what-users-care-about), alert on what *really* matters. It doesn't matter if your CPU is saturated, as long as your users don't notice. Let your [SLO](https://www.youtube.com/watch?v=X99X-VDzxnw)s guide your alerting.
For more context [My Philosophy on Alerting](https://docs.google.com/document/d/199PqyG3UsyXlwieHaqbGiWVa8eMWi8zzAn0YfcApr8Q/edit).

## Please five more minutes

Prometheus alerting rules let you specify a `for` duration that determines how long a condition must be true before the alert fires. If you don't specify it, a single failed scrape could cause an alert to fire. You need tolerance. As a rule of thumb, use at least 5 minutes unless you have a specific reason to do otherwise. For more information, check out [Setting Thresholds on Alerts](https://www.robustperception.io/setting-thresholds-on-alerts).

## Context is king

Preserve common and useful labels for your alerts. They are most useful for routing and silencing.

---

The inspiration behind the idea comes from [The Zen of Go](https://the-zen-of-go.netlify.app), [Go Proverbs](https://go-proverbs.github.io/) and [The Zen of Python](https://zen-of-python.info/).

    *Thank you very much all others that contributed with their invaluable ideas.*
    The initial rules are gathered from several sources from the community, such as [Prometheus Proverbs](https://www.youtube.com/watch?v=TwH3KXKbJqM) by [Björn Rabenstein](https://github.com/beorn7), [Best Practices and Beastly Pitfalls](https://www.youtube.com/watch?v=_MNYuTNfTb4) by [Julius Volz](https://github.com/juliusv), [Patterns for Instrumenting Your Go Services](https://www.youtube.com/watch?v=LU6D5cNeHks) by [Bartek Plotka](https://github.com/bwplotka) and [Kemal Akkoyun](https://github.com/kakkoyun), [Instrumenting Applications and Alerting with Prometheus](https://www.youtube.com/watch?v=sHKWD8XnmmY) by [Simon Pasquier](https://github.com/simonpasquier) and [Robust Perception Blog](https://www.robustperception.io/blog) by [Brian Brazil](https://github.com/brian-brazil).

## Further resources

Following these conventions enables you to benefit from community tooling:

- [Monitoring Mixins](https://monitoring.mixins.dev/) - Reusable dashboards and alerts for common services
