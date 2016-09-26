---
title: Interview with Incopro
created_at: 2016-09-28
kind: article
author_name: Brian Brazil
---

*Continuing our series of interviews with users of Prometheus, Incopro talks
about how they went from Zabbix and Monit to Prometheus.*

## Can you tell us about yourself and what Incorpo does?

[Incopro](http://www.incopro.co.uk/) is a brand protection company. It uses
technology, combined with IP and investigation expertise, to deliver effective
and targeted protection to businesses looking to protect their IP assets
online. Its Talisman brand protection system is used by many of the largest
global brands to track and assess infringement issues across marketplaces,
websites, social media, app stores and more. Incopro’s expert analyst team use
the Talisman technology and a range of language skills (including Japanese,
Korean, Arabic, Russian, Mandarin, Cantonese, Punjabi etc.) to deliver
prioritised enforcement against commercial scale infringements. Incopro was
founded by a law firm and operates from its own central London HQ. The
company's use of technology to deliver scalable enforcement was recognised by
the Financial Times newspaper as the most innovative development in IP in 2015.

My name is Akos Veres, Operations Engineer at Incopro, I had the task of
setting up the proper monitoring solution for our company, as well as help with
day to day operations in the short term. I became the only Ops at the company
so everything falls under my jurisdiction.


## What was your pre-Prometheus monitoring experience?

There wasn’t a real solution, especially no alerting in place.
[Zabbix](http://www.zabbix.com/) and [Monit](https://mmonit.com/) have been
used to some extent, when things started to get out of control. As the company
grew bigger a new solution was needed and Prometheus was found back in December
2015.

## How did you transition?

At first we tried to mimic the old monitoring system, which was a good learning
curve, to get the same kind of alerts we were getting from Zabbix, this
involved using the
[blackbox_exporter](https://github.com/prometheus/blackbox_exporter) and some
metrics from [node_exporter](https://github.com/prometheus/node_exporter). At
that time, as far as I remember, Pushover was not available, thus the alerting
was not possible and we didn’t want to transition to anything else. Other
useful metrics showed up on our dashboards, which included our scrapers. We
could finally visualize how much data are we collecting, troubleshooting
improved a lot, and we could speed up our whole collection time based on these
valuable metrics. Although during this time we were using the
[Pushgateway](https://github.com/prometheus/pushgateway/) way too much, we
managed to make the data valuable for us.

![The state of the system](/assets/blog/2016-09-28/devops-dashboard.PNG)

## What improvements have you seen since switching?

After the whole alerting was switched over to Prometheus+Alertmanager and we
tossed Zabbix out, we never looked back. Beside the previously mentioned
scraping problems, Prometheus helped us realise which servers were over- or
underused, having ~150 barebone servers across the world makes it hard to
realize where are you over or underperforming. The Grafana dashboards were
being watched by management and questions were being raised based on the
metrics collected. Development and code has been refined to make things
smoother for us and our customers. The Ops team had an easier job of getting
alerts, especially after rules have been properly understood, nights were
easier to get by as we were sure we would be alerted if something went wrong.
We were finally able to monitor our whole infrastructure, Cassandra,
Elasticsearch, MySQL, RabbitMQ, collection and analysis servers, proxies,
frontend and other backend servers. The best way to tell how big of an impact
Prometheus had on our business is to mention how fast some of our team members
notice if new data is not showing up on our dashboards.

![Metrics from one of the 4 cassandra datacenters](/assets/blog/2016-09-28/cassandra-dashboard.PNG)

## What do you think the future holds for Incorpo and Prometheus?

Making Prometheus scale or at least having multiple instances is helping us
being more robust. The Alertmanager’s HA solution is definitely a welcome
addition. The toughest job for us is to realize which metrics are the most
important for us. Developers will need to output their metrics in the
Prometheus way, which has not started, but the Ops team is pushing for these
changes. We are going to be transitioning to Docker-based dynamically
distributed instances, monitoring these will going to be essential and
Prometheus is going to be the proper tool for it, as mentioned even at PromCon,
it was designed for the dynamic world. As business grows so will the teams, and
educating people about the use of Prometheus is going to be a high priority
soon. Even our brand enforcement analysts could use the metrics provided
through Prometheus to showcase their efficiency. We had discussions on
outputting data from Prometheus to our clients so they know which markets are
we watching for them and how efficient are we.

