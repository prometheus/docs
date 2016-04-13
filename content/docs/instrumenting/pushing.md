---
title: Pushing metrics
sort_rank: 3
---

# Pushing metrics

Occasionally you will need to monitor components which cannot be scraped. They
might live behind a firewall, or they might be too short-lived to expose data
reliably via the pull model. The
[Prometheus Pushgateway](https://github.com/prometheus/pushgateway) allows you to push
time series from these components to an intermediary job which Prometheus can
scrape. Combined with Prometheus's simple text-based exposition format, this
makes it easy to instrument even shell scripts without a client library.

 * For more information on using the Pushgateway and use from a Unix shell, see the project's
[README.md](https://github.com/prometheus/pushgateway/blob/master/README.md).

 * For use from Java see the
[PushGateway](http://prometheus.github.io/client_java/io/prometheus/client/exporter/PushGateway.html)
class.

 * For use from Go see the [Push](http://godoc.org/github.com/prometheus/client_golang/prometheus#Push) and [PushAdd](http://godoc.org/github.com/prometheus/client_golang/prometheus#PushAdd) functions.

 * For use from Python see [Exporting to a Pushgateway](https://github.com/prometheus/client_python#exporting-to-a-pushgateway).

 * For use from Ruby see the [Pushgateway documentation](https://github.com/prometheus/client_ruby#pushgateway).

## Java batch job example

This example illustrates how to instrument a batch job and alert on it not having succeeded recently.

If using Maven, add the following to `pom.xml`:

```
        <dependency>
            <groupId>io.prometheus</groupId>
            <artifactId>simpleclient</artifactId>
            <version>0.0.10</version>
        </dependency>
        <dependency>
            <groupId>io.prometheus</groupId>
            <artifactId>simpleclient_pushgateway</artifactId>
            <version>0.0.10</version>
        </dependency>
```


Instrument your batch job's code:

```java
import io.prometheus.client.CollectorRegistry;
import io.prometheus.client.Gauge;
import io.prometheus.client.exporter.PushGateway;

void executeBatchJob() throws Exception {
 CollectorRegistry registry = new CollectorRegistry();
 Gauge duration = Gauge.build()
     .name("my_batch_job_duration_seconds")
     .help("Duration of my batch job in seconds.")
     .register(registry);
 Gauge.Timer durationTimer = duration.startTimer();
 try {
   // Your code here.

   // This is only added to the registry after success,
   // so that a previous success in the Pushgateway is not overwritten on failure.
   Gauge lastSuccess = Gauge.build()
       .name("my_batch_job_last_success_unixtime")
       .help("Last time my batch job succeeded, in unixtime.")
       .register(registry);
   lastSuccess.setToCurrentTime();
 } finally {
   durationTimer.setDuration();
   PushGateway pg = new PushGateway("127.0.0.1:9091");
   pg.pushAdd(registry, "my_batch_job");
 }
}
```

Set up a Pushgateway and update the host and port in the above code if needed.

Set up an alert to fire if the job has not run recently. Add the following to
the rules of a Prometheus server that is scraping the Pushgateway:

```
ALERT MyBatchJobNotCompleted
  IF min(time() - my_batch_job_last_success_unixtime{job="my_batch_job"}) > 60 * 60
  FOR 5m
  WITH { severity="page" }
  SUMMARY "MyBatchJob has not completed successfully in over an hour"
```
