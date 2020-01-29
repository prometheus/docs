---
title: Custom Alertmanager Templates
created_at: 2016-03-03
kind: article
author_name: Fabian Reinartz
---

The Alertmanager handles alerts sent by Prometheus servers and sends
notifications about them to different receivers based on their labels.

A receiver can be one of many different integrations such as PagerDuty, Slack,
email, or a custom integration via the generic webhook interface (for example [JIRA](https://github.com/fabxc/jiralerts)).

## Templates

The messages sent to receivers are constructed via templates.
Alertmanager comes with default templates but also allows defining custom
ones.

In this blog post, we will walk through a simple customization of Slack
notifications.

We use this simple Alertmanager configuration that sends all alerts to Slack:

```yaml
global:
  slack_api_url: '<slack_webhook_url>'

route:
  receiver: 'slack-notifications'
  # All alerts in a notification have the same value for these labels.
  group_by: [alertname, datacenter, app]

receivers:
- name: 'slack-notifications'
  slack_configs:
  - channel: '#alerts'
```

By default, a Slack message sent by Alertmanager looks like this:

![](/assets/blog/2016-03-03/slack_alert_before.png)

It shows us that there is one firing alert, followed by the label values of
the alert grouping (alertname, datacenter, app) and further label values the
alerts have in common (critical).

<!-- more -->

## Customize

If you have alerts, you should also have documentation on how to handle them –
a runbook. A good approach to that is having a wiki that has a section for
each app you are running with a page for each alert.

Suppose we have such a wiki running at `https://internal.myorg.net/wiki/alerts`.
Now we want links to these runbooks shown in our Slack messages.

In our template, we need access to the "alertname" and the "app" label. Since
these are labels we group alerts by, they are available in the `GroupLabels`
map of our templating data.

We can directly add custom templating to our Alertmanager's [Slack configuration](/docs/alerting/configuration/#slack-receiver-slack_config)
that is used for the `text` section of our Slack message.
The [templating language](https://godoc.org/text/template) is the one provided
by the Go programming language.

```yaml
global:
  slack_api_url: '<slack_webhook_url>'

route:
- receiver: 'slack-notifications'
  group_by: [alertname, datacenter, app]

receivers:
- name: 'slack-notifications'
  slack_configs:
  - channel: '#alerts'
    # Template for the text field in Slack messages.
    text: 'https://internal.myorg.net/wiki/alerts/{{ .GroupLabels.app }}/{{ .GroupLabels.alertname }}'
```

We reload our Alertmanager by sending a `SIGHUP` or restart it to load the
changed configuration. Done.

Our Slack notifications now look like this:

![](/assets/blog/2016-03-03/slack_alert_after.png)

### Template files

Alternatively, we can also provide a file containing named templates, which
are then loaded by Alertmanager. This is especially helpful for more complex
templates that span many lines.

We create a file `/etc/alertmanager/templates/myorg.tmpl` and create a
template in it named "slack.myorg.text":

```
{{ define "slack.myorg.text" }}https://internal.myorg.net/wiki/alerts/{{ .GroupLabels.app }}/{{ .GroupLabels.alertname }}{{ end}}
```

Our configuration now loads the template with the given name for the "text"
field and we provide a path to our custom template file:

```yaml
global:
  slack_api_url: '<slack_webhook_url>'

route:
- receiver: 'slack-notifications'
  group_by: [alertname, datacenter, app]

receivers:
- name: 'slack-notifications'
  slack_configs:
  - channel: '#alerts'
    text: '{{ template "slack.myorg.text" . }}'

templates:
- '/etc/alertmanager/templates/myorg.tmpl'
```

We reload our Alertmanager by sending a `SIGHUP` or restart it to load the
changed configuration and the new template file. Done.

To test and iterate on your Prometheus Alertmanager notification templates for Slack you can use the following [tool](https://juliusv.com/promslack/).
