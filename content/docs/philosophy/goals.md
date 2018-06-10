---
title: Goals and Non-Goals
sort_rank: 3
---

# Goals

## Resilience

First and foremost, Prometheus must be resilient in operation.


## Reliable alerting

As a monitoring system, Prometheus is being relied upon to alert humans that
they need to take action in order to prevent undesired system state.

Thus, its most important function is to keep the pipeline of ingestion, rule
evaluation, and alert notifications working.

The second most important function is to give humans context about these alerts
by allowing access to the most recent data Prometheus ingested

### Resulting design decisions and patterns

Note that this goal might result in widely different design decisions and thus
operational patterns for different parts of our ecosystem:

For Prometheus itself, this means running every instance as an island of data
completely detached from every other instance.

For Alertmanager on the other hand, it means the exact opposite: meshing all
instances closely together, sharing knowledge about alerts and their
notifications.

## Simple operation

Operation of Prometheus should be as simple and failure-tolerant as possible. We
try to put required complexity into earlier phases, going through them less
often and ideally still while under the control of a smaller subset of people.

One example of this would be the preference of statically linked binaries over
dynamically-built ones.

## Keep dependencies clear and limited

Any non-trivial system needs to integrate with other systems. To keep the
resulting complexity low, we will always try to have the fewest interfaces
possible and keep their resulting complexity as low as possible. This makes
understanding the system and thus working on and with it easier.

## Automation

Computers are good at doing the same thing over and over again, and quickly.
Humans tend to be better at creative tasks.

Prometheus will always strive to automate away all tasks whenever possible
through various means; some specific implementations would be service discovery,
label rewriting, and alert generation.


# Non-Goals

# Event handling

Prometheus is dealing with metrics. As such, it will never process and store
events.

The only exception in our ecosystem is Alertmanager which deals with individual
alerts and alert groups.

For ways to deal with events, see TODO patterns.

# Push-type system

Prometheus is, and always will be, a pull-type system. We strongly believe that
this makes operational sense in all but the very largest of scales.

For ways to integrate with push-type systems, see TODO patterns.
