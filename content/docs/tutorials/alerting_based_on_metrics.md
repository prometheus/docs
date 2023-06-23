---
title: Alerting based on metrics.
sort_rank: 5
---

# Alerting based on metrics 

In this tutorial we will create alerts on the `ping_request_count` metric that we instrumented earlier in the 
[Instrumenting HTTP server written in Go](./instrumenting_http_server_in_go/) tutorial.

For the sake of this tutorial we will alert when the `ping_request_count` metric is greater than 5, Checkout real world [best practices](../../practices/alerting) to learn more about alerting principles.

Download the latest release of Alertmanager for your operating system from [here](https://github.com/prometheus/alertmanager/releases)

Alertmanager supports various receivers like `email`, `webhook`, `pagerduty`, `slack` etc through which it can notify when an alert is firing. You can find the list of receivers and how to configure them [here](../../alerting/latest/configuration). We will use `webhook` as a receiver for this tutorial, head over to [webhook.site](https://webhook.site) and copy the webhook URL which we will use later to configure the Alertmanager.

First let's setup Alertmanager with webhook receiver.

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
    - targets:
       - localhost:9093
scrape_configs:
 - job_name: prometheus
   static_configs:
       - targets: ["localhost:9090"]
 - job_name: simple_server
   static_configs:
       - targets: ["localhost:8090"]
```

If you notice the `evaluation_interval`,`rule_files` and `alerting` sections are added to the Prometheus config, the `evaluation_interval` defines the intervals at which the rules are evaluated, `rule_files` accepts an array of yaml files that defines the rules and the `alerting` section defines the Alertmanager configuration. As mentioned in the beginning of this tutorial we will create a basic rule where we want to
raise an alert when the `ping_request_count` value is greater than 5.

> rules.yml

```yaml
groups:
 - name: Count greater than 5
   rules:
   - alert: CountGreaterThan5
     expr: ping_request_count > 5
     for: 10s
```

Now let's run Prometheus using the following command.

`prometheus --config.file=./prometheus.yml`

Open [http://localhost:9090/rules](http://localhost:9090/rules) in your browser to see the rules. Next run the instrumented ping server and visit the [http://localhost:8090/ping](http://localhost:8090/ping) endpoint and refresh the page atleast 6 times. You can check the ping count by navigating to [http://localhost:8090/metrics](http://localhost:8090/metrics) endpoint. To see the status of the alert visit [http://localhost:9090/alerts](http://localhost:9090/alerts). Once the condition `ping_request_count > 5` is true for more than 10s the `state` will become `FIRING`. Now if you navigate back to your `webhook.site` URL you will see the alert message.

<iframe width="560" height="315" src="https://www.youtube.com/embed/xaMXVrle98M" frameborder="0" allowfullscreen></iframe>

Similarly Alertmanager can be configured with other receivers to notify when an alert is firing.
