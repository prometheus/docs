---
title: Alerting
sort_rank: 5
---

# Alerting

We recommend that you read [My Philosophy on Alerting](https://docs.google.com/a/boxever.com/document/d/199PqyG3UsyXlwieHaqbGiWVa8eMWi8zzAn0YfcApr8Q/edit)
based on Rob Ewaschuk's observations at Google.

To summarize: keep alerting simple, alert on symptoms, have good consoles to
allow pinpointing causes, and avoid having pages where there is nothing to do.

## What to alert on

Aim to have as few alerts as possible, by alerting on symptoms that are
associated with end-user pain rather than trying to catch every possible way
that pain could be caused. Alerts should link to relevant consoles
and make it easy to figure out which component is at fault.

Allow for slack in alerting to accommodate small blips.

### Online serving systems

Typically alert on high latency and error rates as high up in the stack as possible.

Only page on latency at one point in a stack. If a lower-level component is
slower than it should be, but the overall user latency is fine, then there is
no need to page.

For error rates, page on user-visible errors. If there are errors further down
the stack that will cause such a failure, there is no need to page on them
separately. However, if some failures are not user-visible, but are otherwise
severe enough to require human involvement (for example, you are losing a lot of
money), add pages to be sent on those.

You may need alerts for different types of request if they have different
characteristics, or problems in a low-traffic type of request would be drowned
out by high-traffic requests.

### Offline processing

For offline processing systems, the key metric is how long data takes to get
through the system, so page if that gets high enough to cause user impact.

### Batch jobs

For batch jobs it makes sense to page if the batch job has not succeeded
recently enough, and this will cause user-visible problems.

This should generally be at least enough time for 2 full runs of the batch job.
For a job that runs every 4 hours and takes an hour, 10 hours would be a
reasonable threshold. If you cannot withstand a single run failing, run the
job more frequently, as a single failure should not require human intervention.

### Capacity

While not a problem causing immediate user impact, being close to capacity
often requires human intervention to avoid an outage in the near future.

### Metamonitoring

It is important to have confidence that monitoring is working. Accordingly, have
alerts to ensure that Prometheus servers, Alertmanagers, PushGateways, and
other monitoring infrastructure are available and running correctly.

As always, if it is possible to alert on symptoms rather than causes, this helps
to reduce noise. For example, a blackbox test that alerts are getting from
PushGateway to Prometheus to Alertmanager to email is better than individual
alerts on each.

Supplementing the whitebox monitoring of Prometheus with external blackbox
monitoring can catch problems that are otherwise invisible, and also serves as
a fallback in case internal systems completely fail.
