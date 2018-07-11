---
title: Slack notifications
---

# Setting up Slack notifications

The Prometheus [AlertManager](../../alerting/overview) can be used to post notifications to a variety of targets, including [Slack](https://slack.com) channels. This guide walks you through adding a [webhook](https://api.slack.com/incoming-webhooks) to an existing Slack app, configuring [Alertmanager](#alertmanager) to post to the webhook, and finally configuring [Prometheus](#prometheus) to send messages to Alertmanager.

## Scenario

Let's say that you've created a Slack app and a channel on that app called `#ops`. To set up Prometheus/Alertmanager notifications to that channel, you first need to create an incoming [webhook](https://api.slack.com/incoming-webhooks) for the app. Navigate to the webhooks page associated with your app, which is located at:

```
https://<your-slack-app>.slack.com/apps/A0F7XDUAZ-incoming-webhooks
```

Click on **Add Configuration** to add a new webhook. Under **Post to Channel**, select the channel for which you'd like to create the webhook (or click **Create a new channel** if it doesn't already exist). When you click **Create** you'll be brought to a success page that provides you with a webhook URL with this basic format:

```
https://hooks.slack.com/services/.../.../...
```

This webhook URL is the unique "address" to which the Prometheus Alertmanager will send notifications. Make sure to save this URL as you'll need it when [configuring AlertManager](#alertmanager).

CAUTION: Make sure to always **keep your Slack webhook URLs secret**. Webhooks don't require an API key or any authentication information, instead relying on the obscurity of the URL to provide security.

### Alertmanager

The Prometheus [Alertmanager](/docs/alerting/alertmanager) is responsible for sending notifications to your Slack channel (Prometheus instances don't send those messages directly). 

To install Alertmanager, first copy the proper [download URL](/download#alertmanager) and then download and untar the tarball:

```bash
wget https://github.com/prometheus/alertmanager/releases/download/v*/alertmanager-*.*-amd64.tar.gz
tar xvf alertmanager-*.*-amd64.tar.gz && cd alertmanager-*.*-amd64
```

Here's an example config file (at `./alertmanager.yml`):


[config](/docs/alerting/configuration/)

```yaml
route:
- receiver: slack_ops_channel

receivers:
- name: slack_ops_channel
  slack_configs:
  - api_url: https://hooks.slack.com/services/.../.../...
    channel: '#ops'
    text: 'This is a test!'
```


Alternatively, you can set the Slack URL as a `global` parameter:

```yaml
global:
  slack_api_url: https://hooks.slack.com/services/...

receivers:
- name: slack_ops_channel
  slack_configs:
  - channel: '#ops'
```

Now you can run Alertmanager, specifying the configuration file you created above:

```bash
./alertmanager --config.file=./alertmanager.yml
```


### Prometheus

To install Prometheus, first copy the proper [download URL](/download#prometheus) and then download and untar the tarball:

```bash
wget https://github.com/prometheus/alertmanager/releases/download/v*/prometheus-*.*-amd64.tar.gz
tar xvf prometheus-*.*-amd64.tar.gz && cd prometheus-*.*-amd64
```

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

```yaml
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

## Notifications from templates

[notification template examples](/docs/alerting/notification_examples)

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
