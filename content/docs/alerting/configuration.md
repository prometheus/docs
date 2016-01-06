---
title: Configuration
sort_rank: 3
nav_icon: sliders
---

# Configuration

Alertmanager is configured via command-line flags and a configuration file.
While the command-line flags configure immutable system parameters, the
configuration file defines inhibition rules, notification routing and
notification receivers.

To view all available command-line flags, run `alertmanager -h`.

Alertmanager can reload its configuration at runtime. If the new configuration
is not well-formed, the changes will not be applied.
A configuration reload is triggered by sending a `SIGHUP` to the process.

## Configuration file

To specify which configuration file to load, use the `-config.file` flag.

The file is written in [YAML format](http://en.wikipedia.org/wiki/YAML),
defined by the scheme described below.
Brackets indicate that a parameter is optional. For non-list parameters the
value is set to the specified default.

Generic placeholders are defined as follows:

* `<duration>`: a duration matching the regular expression `[0-9]+[smhdwy]`
* `<labelname>`: a string matching the regular expression `[a-zA-Z_][a-zA-Z0-9_]*`
* `<labelvalue>`: a string of unicode characters
* `<filename>`: a valid path in the current working directory
* `<boolean>`: a boolean that can take the values `true` or `false`
* `<string>`: a regular string
* `<tmpl_string>`: a string which is template-expanded before usage

The other placeholders are specified separately.

A valid example file can be found [here](https://github.com/prometheus/alertmanager/blob/master/doc/examples/simple.yml).

The global configuration specifies parameters that are valid in all other
configuration contexts. They also serve as defaults for other configuration
sections.


```
global:
  # ResolveTimeout is the time after which an alert is declared resolved
  # if it has not been updated.
  [ resolve_timeout: <duration> | default = 5m ]

  # The default SMTP From header field.
  [ smtp_from: <tmpl_string> ]
  # The default SMTP smarthost used for sending emails.
  [ smtp_smarthost: <tmpl_string> ]

  # The API URL to use for Slack notifications.
  [ slack_api_url: <string> ]

  # The API URL to use self-hosted Hipchat Server.
  [ hipchat_url: <string> | default = "https://api.hipchat.com/" ]

  # The Auth Token for Hipchat notifications.
  [ hipchat_auth_token: <string> ]

  [ pagerduty_url: <string> | default = "https://events.pagerduty.com/generic/2010-04-15/create_event.json" ]
  [ opsgenie_api_host: <string> | default = "https://api.opsgenie.com/" ]

# Files from which custom notification template definitions are read.
# The last component may use a wildcard matcher, e.g. 'templates/*.tmpl'.
templates:
  [ - <filepath> ... ]

# The root node of the routing tree.
route: <route>

# A list of notification receivers.
receivers:
  - <receiver> ...

# A list of inhibition rules.
inhibit_rules:
  [ - <inhibit_rule> ... ]
```


## Route `<route>`

A route block defines a node in a routing tree and its children. Its optional
configuration parameters are inherited from its parent node if not set.

Every alert enters the routing tree at the configured top-level route, which
must match all alerts (i.e. not have any configured matchers).
It then traverses the child nodes. If `continue` is set to false, it stops
after the first matching child. If `continue` is true on a matching node, the
alert will continue matching against subsequent siblings.
If an alert does not match any children of a node (no matching child nodes, or
none exist), the alert is handled based on the configuration paramters of the
current node.


```
[ receiver: <string> ]
[ group_by: '[' <labelname>, ... ']' ]

# Whether an alert should continue matching subsequent sibling nodes.
[ continue: <boolean> | default = false ]

# A set of equality matchers an alert has to fulfill to match the node.
match:
  [ <labelname>: <labelvalue>, ... ]

# A set of regex-matchers an alert has to fulfill to match the node.
match_re:
  [ <labelname>: <regex>, ... ]

# How long to initially wait to send a notification for a group
# of alerts. Allows to wait for an inhibiting alert to arrive or collect
# more initial alerts for the same group. (Usually ~0s to few minutes.)
[ group_wait: <duration> ]

# How long to wait before sending notification about new alerts that are
# in are added to a group of alerts for which an initial notification
# has already been sent. (Usually ~5min or more.)
[ group_interval: <duration> ]

# How long to wait before sending a notification again if it has already
# been sent successfully for an alert. (Usually ~3h or more).
[ repeat_interval: <duration> ]

# Zero or more child routes.
routes:
  [ - <route> ... ]
```

### Example

```
# The root route with all parameters, which are inherited by the child
# routes if they are not overwritten.
route:
  receiver: 'default-receiver'
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  group_by: [cluster, alertname]
  # All alerts that do not match the following child routes
  # will remain at the root node and be dispatched to 'default-receiver'.
  routes:
  # All alerts with service=mysql or service=cassandra
  # are dispatched to the database pager.
  - receiver: 'database-pager'
    group_wait: 10s
    match_re:
      service: mysql|cassandra
  # All alerts with the team=frontend label match this sub-route.
  # They are grouped by product and environment rather than cluster
  # and alertname.
  - receiver: 'frontend-pager'
    group_by: [product, environment]
    match:
      team: frontend
```



## Inhibit rule `<inhibit_rule>`

An inhibition rule is a rule that mutes an alert matching a set of matchers
under the condition that an alert exists that matches another set of matchers.
Both alerts must have a set of equal labels.

```
# Matchers that have to be fulfilled in the alerts to be muted.
target_match:
  [ <labelname>: <labelvalue>, ... ]
target_match_re:
  [ <labelname>: <regex>, ... ]

# Matchers for which one or more alerts have to exist for the
# inhibition to take effect.
source_match:
  [ <labelname>: <labelvalue>, ... ]
source_match_re:
  [ <labelname>: <regex>, ... ]

# Labels that must have an equal value in the source and target
# alert for the inhibition to take effect.
[ equal: '[' <labelname>, ... ']' ]

```


## Receiver `<receiver>`

Receiver is a named configuration of one or more notification integrations.

__Other receiver implementations available in version 0.0.4 of Alertmanager
are not implemented yet. We are gladly accepting any contributions to add them
to the new implementation.__

```
# The unique name of the receiver.
name: <string>

# Configurations for several notification integrations.
email_configs:
  [ - <email_config>, ... ]
pagerduty_configs:
  [ - <pagerduty_config>, ... ]
slack_config:
  [ - <slack_config>, ... ]
hipchat_configs:
  [ - <hipchat_config>, ... ]
opsgenie_configs:
  [ - <opsgenie_config>, ... ]
webhook_configs:
  [ - <webhook_config>, ... ]
```


## Email receiver `<email_config>`

```
# Whether or not to notify about resolved alerts.
[ send_resolved: <boolean> | default = false ]

# The email address to send notifications to.
to: <string>
# The sender address.
[ from: <email> | default = global.smtp_from ]
# The SMTP host through which emails are sent.
[ smarthost: <string> | default = global.smtp_smarthost ]

# The HTML body of the email notification.
[ html: <tmpl_string> | default = '{{ template "email.default.html" . }}' ] 

# Further headers email header key/value pairs. Overrides any headers
# previously set by the notification implementation.
[ headers: { <string>: <tmpl_string>, ... } ]
```

## PagerDuty receiver `<pagerduty_config>`

PagerDuty notifications are sent via the [PagerDuty API](https://developer.pagerduty.com/documentation/integration/events).

```
# Whether or not to notify about resolved alerts.
[ send_resolved: <boolean> | default = true ]

# The PagerDuty service key.
service_key: <tmpl_string>
# The URL to send API requests to
[ url: <string> | default = global.pagerduty_url ]

# The client identification of the Alertmanager.
[ client:  <tmpl_string> | default = '{{ template "pagerduty.default.client" . }}' ]
# A backlink to the sender of the notification.
[ client_url:  <tmpl_string> | default = '{{ template "pagerduty.default.clientURL" . }}' ]

# A description of the incident.
[ description: <tmpl_string> | default = '{{ template "pagerduty.default.description" .}}' ]

# A set of arbitrary key/value pairs that provide further detail
# about the incident.
[ details: { <string>: <tmpl_string>, ... } | default = {
  firing:       '{{ template "pagerduty.default.instances" .Alerts.Firing }}'
  resolved:     '{{ template "pagerduty.default.instances" .Alerts.Resolved }}'
  num_firing:   '{{ .Alerts.Firing | len }}'
  num_resolved: '{{ .Alerts.Resolved | len }}'
} ]
```


## Slack receiver `<slack_config>`

Slack notifications are sent via [Slack webhooks](https://api.slack.com/incoming-webhooks).

```
# Whether or not to notify about resolved alerts.
[ send_resolved: <boolean> | default = true ]

# The Slack webhook URL.
[ api_url: <string> | default = global.slack_api_url ]

# The channel or user to send notifications to.
channel: <tmpl_string>

# API request data as defined by the Slack webhook API.
[ color: <tmpl_string> | default = '{{ if eq .Status "firing" }}danger{{ else }}good{{ end }}' ]
[ username: <tmpl_string> | default = '{{ template "slack.default.username" . }}'
[ title: <tmpl_string> | default = '{{ template "slack.default.title" . }}' ]
[ title_link: <tmpl_string> | default = '{{ template "slack.default.titlelink" . }}' ]
[ pretext: <tmpl_string> | default = '{{ template "slack.default.pretext" . }}' ]
[ text: <tmpl_string> | default = '{{ template "slack.default.text" . }}' ]
[ fallback: <tmpl_string> | default = '{{ template "slack.default.fallback" . }}' ]
```


## Hipchat receiver `<hipchat_config>`

Hipchat notifications are sent via [Hipchat Room Notification API](https://www.hipchat.com/docs/apiv2/method/send_room_notification).

```
# Whether or not to notify about resolved alerts.
[ send_resolved: <boolean> | default = false ]

# The Hipchat URL.
[ api_url: <string> | default = global.hipchat_url ]

# The Auth Token from Hipchat.
[ auth_token: <string> | default = global.hipchat_auth_token ]

# Room ID.
room_id: <string>

# API request data as defined by the Hipchat API.
[ from: <string> | default = '{{ template "hipchat.default.from" . }}' ]
[ notify: <bool> | default = false ]
[ message: <string> | default = '{{ template "hipchat.default.message" . }}' ]
[ message_format: <string> | default = 'text' ]
[ color: <string> | default = '{{ if eq .Status "firing" }}danger{{ else }}good{{ end }}' ]
```


## OpsGenie receiver `<opsgenie_config>`

OpsGenie notifications are sent via the [OpsGenie API](https://www.opsgenie.com/docs/web-api/alert-api).

```
# Whether or not to notify about resolved alerts.
[ send_resolved: <boolean> | default = true ]

# The API key to use when talking to the OpsGenie API.
api_key: <string>

# The host to send OpsGenie API requests to.
[ api_host: <string> | default = global.opsgenie_api_host ]

# A description of the incident.
[ description: <tmpl_string> | default = '{{ template "opsgenie.default.description" . }}' ]
# A backlink to the sender of the notification.
[ source: <tmpl_string> | default = '{{ template "opsgenie.default.source" . }}' ]

# A set of arbitrary key/value pairs that provide further detail
# about the incident.
[ details: { <string>: <tmpl_string>, ... } ]
```


## Webhook receiver `<webhook config>`

The webhook receiver allows configuring a generic receiver. The Alertmanager
will send HTTP POST requests in the following JSON format to the configured
endpoint:

```
{
  "version": "2",
  "status": "<resolved|firing>",
  "alerts": [
    {
      "labels": <object>,
      "annotations": <object>,
      "startsAt": "<rfc3339>",
      "endsAt": "<rfc3339>"
    },
    ...
  ]
}
```

```
# Whether or not to notify about resolved alerts.
[ send_resolved: <boolean> | default = true ]

# The endpoint to send HTTP POST requests to.
url: <string>
```
