---
title: Alerting overview
sort_rank: 1
nav_icon: sliders
---

# Alerting Overview

Alerting with Prometheus is separated into two parts. Alerting rules in
Prometheus servers send alerts to an Alertmanager. The Alertmanager then
manages those alerts, including silencing, inhibition, aggregation and sending
out notifications via methods such as email, PagerDuty and HipChat.

**WARNING: The Alertmanager is still considered to be very experimental.**

The main steps to setting up alerting and notifications are:

* Setup and configure the Alertmanager
* Configure Prometheus to talk to the Alertmanager with the `-alertmanager.url` flag
* Create alerting rules in Prometheus
