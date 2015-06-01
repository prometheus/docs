---
title: Alertmanager
sort_rank: 2
nav_icon: sliders
---

# Alertmanager

The Alertmanager receives alerts from one or more Prometheus servers.
It manages those alerts, including silencing, inhibition, aggregation and
sending out notifications via methods such as email, PagerDuty and HipChat.

**WARNING: The Alertmanager is still considered to be very experimental.**

## Configuration

The Alertmanager is configured via command-line flags and a configuration file.

The configuration file is an ASCII protocol buffer. To specify which
configuration file to load, use the `-config.file` flag.

```
./alertmanager -config.file alertmanager.conf
```

To send all alerts to email, set the `-notification.smtp.smarthost` flag to
an SMTP smarthost (such as a [Postfix null client](http://www.postfix.org/STANDARD_CONFIGURATION_README.html#null_client)) 
and use the following configuration:

```
notification_config {
  name: "alertmanager_test"
  email_config {
    email: "test@example.org"
  }
}

aggregation_rule {
  notification_config_name: "alertmanager_test"
}
```

### Filtering

An aggregation rule can be made to apply to only some alerts using a filter.

For example, to apply a rule only to alerts with a `severity` label with the value `page`:

```
aggregation_rule {
  filter {
    name_re: "severity"
    value_re: "page"
  }
  notification_config_name: "alertmanager_test"
}
```

Multiple filters can be provided.

### Repeat Rate
By default an aggregation rule will repeat notifications every 2 hours. This can be changed using `repeat_rate_seconds`.

```
aggregation_rule {
  repeat_rate_seconds: 3600
  notification_config_name: "alertmanager_test"
}
```

### Notifications

The Alertmanager has support for a growing number of notification methods.
Multiple notifications methods of one or more types can be used in the same
notification config.

The `send_resolved` field can be used with all notification methods to enable or disable
sending notifications that an alert has stopped firing.

#### Email

The `-notification.smtp.smarthost` flag must be set to an SMTP smarthost.
The `-notification.smtp.sender` flag may be set to change the default From address.

```
notification_config {
  name: "alertmanager_email"
  email_config {
    email: "test@example.org"
  }
  email_config {
    email: "foo@example.org"
  }
}
```

Plain and CRAM-MD5 SMTP authentication methods are supported.
The `SMTP_AUTH_USERNAME`, `SMTP_AUTH_SECRET`, `SMTP_AUTH_PASSWORD` and
`SMTP_AUTH_IDENTITY` environment variables are used to configure them.

#### PagerDuty

The Alertmanager integrates as a [Generic API
Service](https://support.pagerduty.com/hc/en-us/articles/202830340-Creating-a-Generic-API-Service)
with PagerDuty.

```
notification_config {
  name: "alertmanager_pagerduty"
  pagerduty_config {
    service_key: "supersecretapikey"
  }
}
```

#### Pushover
```
notification_config {
  name: "alertmanager_pushover"
  pushover_config {
    token: "mypushovertoken"
    user_key: "mypushoverkey"
  }
}
```

#### HipChat
```
notification_config {
  name: "alertmanager_hipchat"
  hipchat_config {
    auth_token: "hipchatauthtoken"
    room_id: 123456
  }
}
```

#### Slack
```
notification_config {
  name: "alertmanager_slack"
  slack_config {
    webhook_url: "webhookurl"
    channel: "channelname"
  }
}
```

#### Flowdock

```
notification_config {
  name: "alertmanager_flowdock"
  flowdock_config {
    api_token: "4c7234902348234902384234234cdb59"
    from_address: "aliaswithgravatar@example.com"
    tag: "monitoring"
  }
}
```

#### Generic Webhook

The Alertmanager supports sending notifications as JSON to arbitrary
URLs. This could be used to perform automated actions when an
alert fires or integrate with a system that the Alertmanager does not support.

```
notification_config {
  name: "alertmanager_webhook"
  webhook_config {
    url: "http://example.org/my/hook"
  }
}
```

An example of JSON message it sends is below.

```json
{
   "version": "1",
   "status": "firing",
   "alert": [
      {
         "summary": "summary",
         "description": "description",
         "labels": {
            "alertname": "TestAlert"
         },
         "payload": {
            "activeSince": "2015-06-01T12:55:47.356+01:00",
            "alertingRule": "ALERT TestAlert IF absent(metric_name) FOR 0y WITH ",
            "generatorURL": "http://localhost:9090/graph#%5B%7B%22expr%22%3A%22absent%28metric_name%29%22%2C%22tab%22%3A0%7D%5D",
            "value": "1"
         }
      }
   ]
}
```

This format is subject to change.
