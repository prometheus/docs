---
title: Slack notifications
---

# Setting up Slack notifications

The Prometheus [AlertManager](../../alerting/overview) can be used to post notifications to [Slack](https://slack.com) channels.

## Scenario

You've created a Slack app for your startup 

* https://hooks.slack.com/services/abc/123/def

CAUTION: You should make sure to always keep your Slack webhook URLs secret.

## Set up a Slack webhook

To set up an incoming webhook in Slack, go to the incoming webhooks page associated with your app, which is located at:

```
https://<your-slack-app>.slack.com/apps/A0F7XDUAZ-incoming-webhooks
```

Click on **Add Configuration** to add a new webhook. Under **Post to Channel**, select the channel for which you'd like to create the webhook (or click **create a new channel** if it doesn't already exist). When you click **Create** you'll be brought to a success page that provides you with a webhook URL with this basic format:

```
https://hooks.slack.com/services/.../.../...
```

This webhook URL is the unique "address" to which the Prometheus Alertmanager will send notifications. Make sure to save this URL as you'll need it when [configuring AlertManager](#alertmanager).

### Alertmanager

[Run](/docs/alerting/configuration/)


Here's an example config file:

```yaml
# alertmanager.yml
route:
- receiver: slack_ops_channel
  group_by: [cluster]

receivers:
- name: slack_ops_channel
  slack_configs:
  - api_url: https://hooks.slack.com/services/...
    channel: '#ops'
    text: ''
```

Alternative, you can set the Slack URL as a `global` parameter:

```yaml
# alertmanager.yml
global:
  slack_api_url: https://hooks.slack.com/services/...

receivers:
- name: slack_ops_channel
  slack_configs:
  - channel: '#ops'
```
### Prometheus

[Run](/docs/introduction/first_steps)

```yaml
rule_files:
- "slack_notifications.rules"

alerting:
  alertmanagers:
  - static_configs:
    - targets: ["localhost:9033"]
```


## Multiple Slack channels

```
route:
  routes:
  - match:
      severity: warning
    receiver: slack_warning_channel
  - match:
      serverity: severe
    receiver: slack_severe_channel

receivers:
- name: slack_warning_channel
  slack_configs:
  - channel: '#warning'
- name: slack_severe_channel
  slack_configs:
  - channel: '#dire-straits'
```

[Configurable parameters](/docs/alerting/configuration/#<slack_config>)

## Messages from templates


Alert:

```yaml
groups:
- name: main-web-service
  rules:
  - alert: ApplicationDown
    expr: up == 0
    for: 1m
    labels:
      severity: severe
    annotations:
      summary: 'Application {{ $labels.job }} down'
      description: 'Instance {{ $labels.instance }} of job {{ $labels.job }} has been down for more than 1 minute'
```

`slack-templates.tmpl`

```html
{{ define "slack.severe.title" }}
SEVERE: {{ .CommonAnnotations.summary }}
{{ end }}

{{ define "slack.severe.text" }}
The {{ .GroupLabels.app }} application
{{ end }}
```

Output:

* **Title** --- SEVERE: Application main_web_service down
* **Text** --- Instance main-web-service-5 of job main_web_service has been down for more than 1 minute

```yaml
receivers:
- name: slack_severe_channel
  slack_configs:
  - channel: '#dire-straits'
    title: '{{ template "slack.severe.title" }}'
    text: '{{ template "slack.severe.text" }}'

templates:
- '/etc/alertmanager/templates/slack-templates.tmpl'
```

NOTE: For more on Go templates, see the [official documentation](https://golang.org/pkg/text/template/) for the `text/template` package or [this blog post](https://blog.gopheracademy.com/advent-2017/using-go-templates/) from the [Gopher Academy blog](https://blog.gopheracademy.com).