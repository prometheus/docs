---
title: Alerting based on metrics
sort_rank: 5
---

In this tutorial we will create alerts on the `myapp_processed_ops_total` metric from the
[Instrument a Go application](../guides/go-application.md) tutorial. Run that application on `localhost:2112` before continuing.

For the sake of this tutorial we will alert when the `myapp_processed_ops_total` metric is greater than 5. Check out real world [best practices](../practices/alerting.md) to learn more about alerting principles.

Download the latest release of Alertmanager for your operating system from [here](https://github.com/prometheus/alertmanager/releases).

Alertmanager supports various receivers like `email`, `webhook`, `pagerduty`, `slack` etc through which it can notify when an alert is firing. You can find the list of receivers and how to configure them [here](/docs/alerting/latest/configuration/). We will use `webhook` as a receiver for this tutorial, head over to [webhook.site](https://webhook.site) and copy the webhook URL which we will use later to configure the Alertmanager.

First let's setup Alertmanager with the webhook receiver.

> alertmanager.yml

```yaml
global:
  resolve_timeout: 5m
route:
  receiver: webhook_receiver
receivers:
    - name: webhook_receiver
      webhook_configs:
        - url: '<INSERT-YOUR-WEBHOOK>'
          send_resolved: false
```
Replace `<INSERT-YOUR-WEBHOOK>` with the webhook that we copied earlier in the alertmanager.yml file and run the Alertmanager using the following command.

`alertmanager --config.file=alertmanager.yml`

Once the Alertmanager is up and running navigate to [http://localhost:9093](http://localhost:9093) and you should be able to access it.

<iframe width="560" height="315" src="https://www.youtube.com/embed/RKXwHhQZ5RE" frameborder="0" allowfullscreen></iframe>

Now that we have configured the Alertmanager with webhook receiver let's add the rules to the Prometheus config.

> prometheus.yml

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 10s
rule_files:
  - rules.yml
alerting:
  alertmanagers:
    - static_configs:
        - targets: ["localhost:9093"]
scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ["localhost:9090"]
  - job_name: myapp
    static_configs:
      - targets: ["localhost:2112"]
```

Note that the `evaluation_interval`,`rule_files` and `alerting` sections were added to the Prometheus config. `evaluation_interval` defines the intervals at which the rules are evaluated, `rule_files` accepts an array of yaml files that defines the rules and the `alerting` section defines the Alertmanager configuration. As mentioned in the beginning of this tutorial we will create a basic rule where we want to
raise an alert when the `myapp_processed_ops_total` value is greater than 5.

> rules.yml

```yaml
groups:
  - name: Count greater than 5
    rules:
      - alert: CountGreaterThan5
        expr: myapp_processed_ops_total > 5
        for: 10s
```

Now let's run Prometheus using the following command.

`prometheus --config.file=./prometheus.yml`

Open [http://localhost:9090/rules](http://localhost:9090/rules) in your browser to see the rules. The Go application's counter increases automatically every two seconds; you can check its value at [http://localhost:2112/metrics](http://localhost:2112/metrics). To see the status of the alert visit [http://localhost:9090/alerts](http://localhost:9090/alerts). Once Prometheus has scraped a value of `myapp_processed_ops_total` greater than 5 for more than 10 seconds, the `state` will become `FIRING`. Now if you navigate back to your `webhook.site` URL you will see the alert message.

Similarly Alertmanager can be configured with other receivers to notify when an alert is firing.
