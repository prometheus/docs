---
title: Visualizing metrics using Grafana
sort_rank: 4
---

In this tutorial we will create a simple dashboard using [Grafana](https://github.com/grafana/grafana) to visualize the `myapp_processed_ops_total` metric from [Instrument a Go application](../guides/go-application.md). Run that application and configure Prometheus to scrape `localhost:2112` as described there before continuing.

If you are wondering why one should use a tool like Grafana when one can query and see the graphs using Prometheus, the answer is that the graph that we see when we run queries on Prometheus is to run ad-hoc queries.
Grafana and [Console Templates](https://prometheus.io/docs/visualization/consoles/) are two recommended ways of creating graphs.


## Installing and Setting up Grafana.

Install and Run Grafana by following the steps from [here](https://grafana.com/docs/grafana/latest/installation/requirements/#supported-operating-systems) for your operating system.

Once Grafana is installed and run, navigate to [http://localhost:3000](http://localhost:3000) in your browser. Use the default credentials, username as `admin` and password as `admin` to log in and setup new credentials.


## Adding Prometheus as a Data Source in Grafana.
Let's add a datasource to Grafana by clicking on the gear icon in the side bar and select `Data Sources`
> ⚙ > Data Sources

In the Data Sources screen you can see that Grafana supports multiple data sources like Graphite, PostgreSQL etc. Select Prometheus to set it up.

Enter the URL as [http://localhost:9090](http://localhost:9090) under the HTTP section and click on `Save and Test`.

<iframe width="560" height="315" src="https://www.youtube.com/embed/QT66dU_h9lo" frameborder="0" allowfullscreen></iframe>

## Creating our first dashboard.

Now we have successfully added Prometheus as a data source. Next we will create our first dashboard for the `myapp_processed_ops_total` metric from the Go application. Its counter increases automatically while the application is running.

1. Click on the `+` icon in the side bar and select `Dashboard`.
2. In the next screen, Click on the `Add new panel` button.
3. In the `Query` tab type the PromQL query `myapp_processed_ops_total`.
4. Wait for Prometheus to scrape the application, then refresh the graph to verify that the counter increases.
5. In the right hand section under `Panel Options` set the `Title` as `Processed Operations`.
6. Click on the Save Icon in the right corner to Save the dashboard.
