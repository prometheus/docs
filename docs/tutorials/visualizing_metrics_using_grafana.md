---
title: Visualizing metrics using Grafana
sort_rank: 4
---

# Visualizing metrics.

In this tutorial we will create a simple dashboard using [Grafana](https://github.com/grafana/grafana) to visualize the `ping_request_count` metric that we instrumented in the [previous tutorial](./instrumenting_http_server_in_go.md).

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

Now we have successfully added Prometheus as a data source, Next we will create our first dashboard for the `ping_request_count` metric that we instrumented in the previous tutorial.

1. Click on the `+` icon in the side bar and select `Dashboard`.
2. In the next screen, Click on the `Add new panel` button.
3. In the `Query` tab type the PromQL query, in this case just type `ping_request_count`.
4. Access the `ping` endpoint few times and refresh the Graph to verify if it is working as expected.
4. In the right hand section under `Panel Options` set the `Title` as `Ping Request Count`.
5. Click on the Save Icon in the right corner to Save the dashboard.

<iframe width="560" height="315" src="https://www.youtube.com/embed/giVZHO6akRA" frameborder="0" allowfullscreen></iframe>

