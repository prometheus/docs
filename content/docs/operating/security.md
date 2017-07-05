---
title: Security
sort_rank: 4
---

# Security Model

Prometheus is a sophisticated system with many components and many integrations
with other systems. It can be deployed in a variety of trusted and untrusted
environments.

This page describes the general security assumptions of Prometheus and the
attack vectors that some configurations may enable.

As with any complex systems it is not possible to guarantee that there are no
bugs. If you find a security bug, please file it in the issue tracker of the
relevant component.

### Prometheus

It is presumed that untrusted users have access to the Prometheus HTTP endpoint
and logs. They have access to all time series information contained in the
database, plus a variety of operational/debugging information.

It is also presumed that only trusted users have the ability to change the
command line, configuration file, rule files and other aspects of the runtime
environment of Prometheus and other components.

Which targets Prometheus scrapes, how often and with what other settings is
determined entirely via the configuration file. The administrator may
decide to use information from service discovery systems, which combined with
relabelling may grant some of this control to anyone who can modify data in
that service discovery system.

Scraped targets may be run by untrusted users. It should not by default be
possible for a target to expose data that impersonates a different target.  The
`honor_labels` option removes this protection, as can certain relabelling
setups.

At present the HTTP API grants the ability to reload configuration files,
shutdown the server, and delete time series. This will be [changed in Prometheus
2.0](https://github.com/prometheus/prometheus/issues/2173).

The remote read feature allows anyone with HTTP access to send queries to the
remote read endpoint. If for example the PromQL queries were ending up directly
run against a relational database, then anyone with the ability to send queries
to Prometheus (such as via Grafana) can run arbitrary SQL against that
database.

## Alertmanager

Any user with access to the Alertmanager HTTP endpoint has access to its data.
They can create and resolve alerts. They can create, modify and delete
silences.

Where notifications are sent to is determined by the configuration file. With
certain templating setups it is possible for notifications to end up at an
alert-defined destination. For example if notifications use an alert label as
the destination email address, anyone who can send alerts to the Alertmanager
can send notifications to any email address.

## Pushgateway

Any user with access to the Pushgateway HTTP endpoint can create, modify and
delete the metrics contained within. As the Pushgateway is usually scraped with
`honor_labels` enabled, this means anyone with access to the Pushgateway can
create any time series in Prometheus.

## Exporters

Exporters generally only talk to one configured instance with a preset set of
commands/requests, which cannot be expanded via their HTTP endpoint.

There are also exporters such as the SNMP and Blackbox exporters that take
their targets from URL parameters. Thus anyone with HTTP access to these
exporters can make them send requests to arbitrary endpoints. As they also
support client-side authentication, this could lead to a leak of secrets such
as HTTP Basic Auth passwords or SNMP community strings. Challenge-response
authentication mechanisms such as TLS are not affected by this.

## Client Libraries

Client libraries are intended to be included in users' applications.

If using a client-library-provided HTTP handler, it should not be possible for
malicious requests that reach that handler to cause issues beyond those
resulting from additional load and failed scrapes.

## Authentication/Authorisation/Encryption

Prometheus and its components do not provide any server-side
authentication, authorisation or encryption. If you require this, it is
recommended to use a reverse proxy.

Various Prometheus components support client-side authentication and
encryption. If TLS client support is offered, there is often also an option
called `insecure_skip_verify` which skips SSL verification.

## Secrets

Non-secret information or fields may be available via the HTTP API and/or logs.

In Prometheus, metadata retrieved from service discovery is not considered
secret. Throughout the Prometheus system, metrics are not considered secret.

Fields containing secrets in configuration files (marked explicitly as such in
the documentation) will not be exposed in logs or via the HTTP API. Secrets
should not be placed in other configuration fields, as it is common for
components to expose their configuration over their HTTP endpoint.

Secrets from other sources used by dependencies (e.g. the `AWS_SECRET_KEY`
environment variable as used by EC2 service discovery) may end up exposed due to
code outside of our control or due to functionality that happens to expose
wherever it is stored.

## Denial of Service

There are some mitigations in place for excess load or expensive queries.
However, if too many or too expensive queries/metrics are provided components
will fall over. It is more likely that a component will be accidentally taken
out by a trusted user than by malicious action.

It is the responsibility of the user to ensure they provide components with
sufficient resources including CPU, RAM, disk space, IOPS, file descriptors,
and bandwidth.

It is recommended to monitor all components for failure, and to have them
automatically restart on failure.

## Libraries

This document considers vanilla binaries built from the stock source code.
Information presented here does not apply if you modify Prometheus source code,
or use Prometheus internals (beyond the official client library APIs) in your
own code.

## Build Process

The build pipeline for Prometheus runs on third-party providers to which many
members of the Prometheus development team and the staff of those providers
have access. If you are concerned about the exact provenance of your binaries,
it is recommended to build them yourself rather than relying on the
pre-built binaries provided by the project.
