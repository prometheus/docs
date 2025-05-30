---
title: Console templates
sort_rank: 3
---

Console templates allow for creation of arbitrary consoles using the [Go
templating language](http://golang.org/pkg/text/template/). These are served
from the Prometheus server.

Console templates are the most powerful way to create templates that can be
easily managed in source control. There is a learning curve though, so users new
to this style of monitoring should try out
[Grafana](/docs/visualization/grafana/) first.

## Getting started

Prometheus comes with an example set of consoles to get you going. These can be
found at `/consoles/index.html.example` on a running Prometheus and will
display Node Exporter consoles if Prometheus is scraping Node Exporters with a
`job="node"` label.

The example consoles have 5 parts:

1. A navigation bar on top
1. A menu on the left
1. Time controls on the bottom
1. The main content in the center, usually graphs
1. A table on the right

The navigation bar is for links to other systems, such as other Prometheis
<sup>[1](/docs/introduction/faq/#what-is-the-plural-of-prometheus)</sup>,
documentation, and whatever else makes sense to you. The menu is for navigation
inside the same Prometheus server, which is very useful to be able to quickly
open a console in another tab to correlate information. Both are configured in
`console_libraries/menu.lib`.

The time controls allow changing of the duration and range of the graphs.
Console URLs can be shared and will show the same graphs for others.

The main content is usually graphs. There is a configurable JavaScript graphing
library provided that will handle requesting data from Prometheus, and rendering
it via [Rickshaw](https://shutterstock.github.io/rickshaw/).

Finally, the table on the right can be used to display statistics in a more
compact form than graphs.

## Example Console

This is a basic console. It shows the number of tasks, how many of them are up,
the average CPU usage, and the average memory usage in the right-hand-side
table. The main content has a queries-per-second graph.

```
{{template "head" .}}

{{template "prom_right_table_head"}}
<tr>
  <th>MyJob</th>
  <th>{{ template "prom_query_drilldown" (args "sum(up{job='myjob'})") }}
      / {{ template "prom_query_drilldown" (args "count(up{job='myjob'})") }}
  </th>
</tr>
<tr>
  <td>CPU</td>
  <td>{{ template "prom_query_drilldown" (args
      "avg by(job)(rate(process_cpu_seconds_total{job='myjob'}[5m]))"
      "s/s" "humanizeNoSmallPrefix") }}
  </td>
</tr>
<tr>
  <td>Memory</td>
  <td>{{ template "prom_query_drilldown" (args
       "avg by(job)(process_resident_memory_bytes{job='myjob'})"
       "B" "humanize1024") }}
  </td>
</tr>
{{template "prom_right_table_tail"}}


{{template "prom_content_head" .}}
<h1>MyJob</h1>

<h3>Queries</h3>
<div id="queryGraph"></div>
<script>
new PromConsole.Graph({
  node: document.querySelector("#queryGraph"),
  expr: "sum(rate(http_query_count{job='myjob'}[5m]))",
  name: "Queries",
  yAxisFormatter: PromConsole.NumberFormatter.humanizeNoSmallPrefix,
  yHoverFormatter: PromConsole.NumberFormatter.humanizeNoSmallPrefix,
  yUnits: "/s",
  yTitle: "Queries"
})
</script>

{{template "prom_content_tail" .}}

{{template "tail"}}
```

The `prom_right_table_head` and `prom_right_table_tail` templates contain the
right-hand-side table. This is optional.

`prom_query_drilldown` is a template that will evaluate the expression passed to it, format it,
and link to the expression in the [expression browser](/docs/visualization/browser/). The first
argument is the expression. The second argument is the unit to use. The third
argument is how to format the output. Only the first argument is required.

Valid output formats for the third argument to `prom_query_drilldown`:

* Not specified: Default Go display output.
* `humanize`: Display the result using [metric prefixes](http://en.wikipedia.org/wiki/Metric_prefix).
* `humanizeNoSmallPrefix`: For absolute values greater than 1, display the
  result using [metric prefixes](http://en.wikipedia.org/wiki/Metric_prefix). For
  absolute values less than 1, display 3 significant digits. This is useful
  to avoid units such as milliqueries per second that can be produced by
  `humanize`.
* `humanize1024`: Display the humanized result using a base of 1024 rather than 1000.
  This is usually used with `B` as the second argument to produce units such as `KiB` and `MiB`.
* `printf.3g`: Display 3 significant digits.

Custom formats can be defined. See
[prom.lib](https://github.com/prometheus/prometheus/blob/main/console_libraries/prom.lib) for examples.

## Graph Library

The graph library is invoked as:

```
<div id="queryGraph"></div>
<script>
new PromConsole.Graph({
  node: document.querySelector("#queryGraph"),
  expr: "sum(rate(http_query_count{job='myjob'}[5m]))"
})
</script>
```

The `head` template loads the required Javascript and CSS.

Parameters to the graph library:

| Name          | Description
| ------------- | -------------
| expr          | Required. Expression to graph. Can be a list.
| node          | Required. DOM node to render into.
| duration      | Optional. Duration of the graph. Defaults to 1 hour.
| endTime       | Optional. Unixtime the graph ends at. Defaults to now.
| width         | Optional. Width of the graph, excluding titles. Defaults to auto-detection.
| height        | Optional. Height of the graph, excluding titles and legends. Defaults to 200 pixels.
| min           | Optional. Minimum x-axis value. Defaults to lowest data value.
| max           | Optional. Maximum y-axis value. Defaults to highest data value.
| renderer      | Optional. Type of graph. Options are `line` and `area` (stacked graph). Defaults to `line`.
| name          | Optional. Title of plots in legend and hover detail. If passed a string, `[[ label ]]` will be substituted with the label value. If passed a function, it will be passed a map of labels and should return the name as a string. Can be a list.
| xTitle        | Optional. Title of the x-axis. Defaults to `Time`.
| yUnits        | Optional. Units of the y-axis. Defaults to empty.
| yTitle        | Optional. Title of the y-axis. Defaults to empty.
| yAxisFormatter | Optional. Number formatter for the y-axis. Defaults to `PromConsole.NumberFormatter.humanize`.
| yHoverFormatter | Optional. Number formatter for the hover detail. Defaults to `PromConsole.NumberFormatter.humanizeExact`.
| colorScheme   | Optional. Color scheme to be used by the plots. Can be either a list of hex color codes or one of the [color scheme names](https://github.com/shutterstock/rickshaw/blob/master/src/js/Rickshaw.Fixtures.Color.js) supported by Rickshaw. Defaults to `'colorwheel'`.

If both `expr` and `name` are lists, they must be of the same length. The name
will be applied to the plots for the corresponding expression.

Valid options for the `yAxisFormatter` and `yHoverFormatter`:

* `PromConsole.NumberFormatter.humanize`: Format using [metric prefixes](http://en.wikipedia.org/wiki/Metric_prefix).
* `PromConsole.NumberFormatter.humanizeNoSmallPrefix`: For absolute values
  greater than 1, format using using [metric prefixes](http://en.wikipedia.org/wiki/Metric_prefix).
  For absolute values less than 1, format with 3 significant digits. This is
  useful to avoid units such as milliqueries per second that can be produced by
  `PromConsole.NumberFormatter.humanize`.
* `PromConsole.NumberFormatter.humanize1024`: Format the humanized result using a base of 1024 rather than 1000.
