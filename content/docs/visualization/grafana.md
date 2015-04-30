---
title: Grafana
sort_rank: 7
---

# Grafana support for Prometheus
There is early support for querying Prometheus servers from [Grafana](http://grafana.org/).
The Grafana data source for Prometheus currently lives in the
[grafana-plugins](https://github.com/grafana/grafana-plugins) repository.

The following shows an example Grafana dashboard which queries Prometheus for data:

[![Grafana screenshot](/assets/grafana_prometheus.png)](/assets/grafana_prometheus.png)

## Installing
For general Grafana installation instructions, see the [official Grafana
documentation](http://docs.grafana.org/installation/).

To use the Prometheus data source with Grafana, copy the
`datasources/prometheus` directory from the `grafana-plugins` repository to
the `public/app/plugins/datasource` directory of your Grafana server.

For example, on Linux, installing Grafana and the Prometheus data source could
look like this:

```bash-lang
# Download and unpack Grafana from binary tar (adjust version as appropriate).
curl -L -O https://grafanarel.s3.amazonaws.com/builds/grafana-2.0.2.linux-x64.tar.gz
tar zxf grafana-2.0.2.linux-x64.tar.gz

# Copy the Prometheus datasource from 'grafana-plugins' into Grafana.
git clone https://github.com/grafana/grafana-plugins.git
cp -a grafana-plugins/datasources/prometheus grafana-2.0.2/public/app/plugins/datasource/

# Start Grafana.
cd grafana-2.0.2/
./bin/grafana-server web
```

## Using
By default, Grafana will be listening on
[http://localhost:3000](http://localhost:3000). The default login is "admin" /
"admin".

### Creating a Prometheus data source
To create a Prometheus data source:

1. Click on the Grafana logo to open the sidebar menu.
2. Click on "Data Sources" in the sidebar.
3. Click on "Add New".
4. Select "Prometheus" as the type.
5. Set the appropriate Prometheus server URL (for example, `http://localhost:9090/`)
6. Adjust other data source settings as desired (for example, turning the proxy access off).
7. Click "Add" to save the new data source.

The following shows an example data source configuration:

[![Data source configuration](/assets/grafana_configuring_datasource.png)](/assets/grafana_configuring_datasource.png)

### Creating a Prometheus graph
Follow the standard way of adding a new Grafana graph. Then:

1. Click the graph title, then click "Edit".
2. Under the "Metrics" tab, select your Prometheus data source (bottom right).
3. Enter any Prometheus expression into the "Query" field, while using the "Metric" field to lookup metrics via autocompletion.
4. To format the legend names of time series, use the "Legend format" input in a
similar way to PromDash. For example, to show only the `method` and `status`
labels of a returned query result, separated by a dash, you could use the
legend format string `{{method}} - {{status}}`.
5. Tune other graph settings until you have a working graph.

The following shows an example Prometheus graph configuration:
[![Prometheus graph creation](/assets/grafana_qps_graph.png)](/assets/grafana_qps_graph.png)
