---
title: Alertmanager
sort_rank: 2
nav_icon: sliders
---

# Alertmanager

The Alertmanager handles alerts sent by client applications such as the 
Prometheus server. It takes care of deduplicating, grouping, and routing
them to the correct receiver integration such as email, PagerDuty, or OpsGenie.
It also takes care of silencing and inhibition of alerts.

The following describes the core concepts the Alertmanager implements. Consult
the [configuration documentation](../configuration) to learn how to use them
in more detail.

## Grouping

Grouping categorizes alerts of similar nature into a single notification. This
is especially useful during larger outages when many systems fail at once and
hundreds to thousands of alerts may be firing simultaneously.

**Example:** Dozens or hundreds of instances of a service are running in your
cluster when a network partition occurs. Half of your service instances
can no longer reach the database.
Alerting rules in Prometheus were configured to send an alert for each service
instance if it cannot communicate with the database. As a result hundreds of
alerts are sent to Alertmanager.

As a user one only wants to get a single page while still being able to see
exactly which service instances were affected. Thus one can configure
Alertmanager to group alerts by their cluster and alertname so it sends a
single compact notification.

Grouping of alerts, timing for the grouped notifications, and the receivers
of those notificiations are configured by a routing tree in the configuration
file.
 
## Inhibition

Inhibition is a concept of suppressing notifications for certain alerts if
certain other alerts are already firing.

**Example:** An alert is firing that informs that an entire cluster is not
reachable. Alertmanager can be configured to mute all other alerts concerning
this cluster if that particular alert is firing.
This prevents notifications for hundreds or thousands of firing alerts that
are unrelated to the actual issue.

Inhibitions are configured through the Alertmanager's configuration file.

## Silences

Silences are a straightforward way to simply mute alerts for a given time.
A silence is configured based on matchers, just as the routing tree. Incoming
alerts are checked whether they match all the equality or regular expression
matchers of an active silence.
If they do, no notifications will be send out for that alert.

Silences are configured in the web interface of the Alertmanager.
