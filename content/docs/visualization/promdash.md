---
title: PromDash
sort_rank: 2
---

# PromDash

## Overview

PromDash is a browser-based dashboard builder for Prometheus. It is a
[Rails](http://rubyonrails.org/) application and stores its dashboard metadata
in a configurable SQL backend.

[![PromDash screenshot](/assets/promdash_event_processor.png)](/assets/promdash_event_processor.png)

For installing and running PromDash, see the
[README.md](https://github.com/prometheus/promdash/blob/master/README.md) for
more information. The instructions below assume that you have a running
PromDash installation.

## Registering a Prometheus server
Before you can graph data from a Prometheus server, you need to register it
with PromDash. Under the "Servers" tab, click "New Server" and enter the name
and URL of your Prometheus server. The URL needs to be in the form
`http://<host>:<port>/` - note the trailing slash. Click "Create Server". This
server is now available for selection when configuring Prometheus graphs in a
dashboard.

## Creating a dashboard
To create a new dashboard, go to the "Dashboards" tab and click "New
Dashboard". Enter a name and click "Create Dashboard". The dashboard name is
now visible in the dashboards listing.

## Configuring a dashboard

A PromDash dashboard consists of a number of widgets which are arranged in
columns. Currently, two types of widgets are supported: Prometheus graphs and
arbitrary iframes (including some special support for auto-adjusting URL
parameters in Graphite graph links).

### Global settings
The menu bar at the top of a dashboard lets you configure global options which
have an effect on the dashboard as a whole:

* **Time range**: Either use the `+` or `-` buttons to increase or decrease the
  global graph time range or type in a duration string of the form
  `<number>[smhdwy]`.
* **Time window**: Either use the `<<` or `>>` buttons to shift the global
  graph time window backwards or forwards in time, or click on the input to
  select a specific date/time as the end of the graph range.
* **Manual refresh**: The manual refresh button lets you trigger a refresh and
  redraw of all graphs on the dashboard.
* **Automatic refresh rate**: This lets you set a periodic refresh interval.
* **Dashboard settings menu**:
  * **Columns**: Choose the number of columns in which to display the
    dashboard's widgets.
  * **Aspect ratio**: For each widget, this sets an aspect ratio which will be
    automatically maintained across resizes.
  * **Theme**: Choose a light or dark look for you dashboard.
  * **Color Scheme**: Allows you to select the color scheme for lines in your
    graphs.
  * **Resolution**: A slider that selects the resolution with which to load
    data from Prometheus.
  * **Show annotation tags**: Select whether to show the UI for editing tags
    that specify which annotations to load and display in graphs. See the
    [Annotations](#annotations) section.
  * **Show template variables**: Select whether to show the UI for editing
    global template variables for the dashboard. See the [Using template
    variables](#using-template-variables) section.
  * **Encode entire dashboard in URL**: Select whether to continuously update the
    browser URL as changes to the dashboard are made. The browser URL will then
    always reflect the current contents and state of the dashboard and may be
    sent around to exactly recreate the dashboard in the state when the link
    was generated.
* **Fullscreen mode**: This displays the entire dashboard in fullscreen/TV
  mode, without any global menus. You may exit fullscreen mode by pressing
  "Escape".
* **Save Changes**: This saves any changes to either the global dashboard
  settings or the settings of individual widgets. Without saving, any changes
  made to the dashboard are lost when reloading the page.

## Adding Prometheus graphs
To add a Prometheus graph, click the "Add Graph" button on the dashboard.

To configure the graph, move the mouse over its widget area until a
menu bar appears in the top left corner.

### Datasources
To configure which data to display, select the `Datasources` menu tab. It
allows you to set one or multiple expressions to be graphed, along with the
Prometheus server they should be queried from. The supported expressions are
any standard [Prometheus expression language
expressions](https://github.com/prometheus/prometheus/wiki/Expression-Language).

For each expression, you can select a graph axis to map the resulting data on,
as well as a format string that specifies how the returned time series labels
should be reflected in the legend. See later sections on how to add axes and
format strings.

### Time options
The time options let you configure a custom range and time window per graph.
Note, however, that these are reset to the global time settings once the global
ones are changed again.

### Graph and axis settings
The graph and axis settings allow you to configure a title for your graph, as
well as the preferred line interpolation and query resolution. Furthermore,
you may add a second axis and configure various options for each axis (stacked
vs. lines, axis scales, etc.).

### Palette settings
The palette settings allow you to select a color scheme for drawing the lines
and filled areas in graphs. If set, this overrides the global setting as long
as the global setting remains unchanged.

### Legend settings
The legend settings menu tab allows you to configure when to show the legend on
a graph, as well as defining how it should be formatted.

By default, each time series will be displayed with their full name (metric name
plus all label names and values) in the legend. If you have many time series or
time series with many labels, this can quickly lead to unusably long legends.

The `Legend format` builder allows you to create a list of format strings which
you can then assign to expressions in the `Datasources` tab. Each format string
allows you to customize how results returned from an expression should be
displayed in the legend. For each time series, the legend will show an
interpolated version of the given format string. To reference specific label
values in the format string, use double curly braces: `{{label-name}}`. For
example: `{{host}} - cluster {{cluster}}`.

### Link to graph
The "Link to this graph" menu tab allows you to generate a link to a specific
graph. This link will show the graph in a single-widget fullscreen view as it
was configured when the link was generated. Subsequent changes to the
underlying graph will not affect the linked version of the graph.

## Adding inline frames
You can add arbitrary iframes as widgets to a PromDash dashboard by clicking
the "Add Frame" button. You will be prompted to enter a URL to display, which
may later be configured via the "Frame Source" menu tab. Similarly to
Prometheus graph widgets, frame widgets allow you to configure a title and
generate a link to the frame.

### Automatic Graphite graph URL adjustment
PromDash has limited support for parsing and rewriting links to Graphite graph
URLs. If you want to embed a Graphite graph via a PromDash frame, enable the
option "this is a graphite graph" under the "Frame options" menu tab. PromDash
will then automatically resize the Graphite graph to fit its widget by
dynamically rewriting the frame URL. It will also add time controls which act
similarly to those found in Prometheus graph widgets.

## Using template variables
Template variables allow you to make generalized dashboards in which you set
only certain variables each time you display them. For example, if you were
interested in building a dashboard that shows statistics for a host, you
would not want to build a separate dashboard for each host. Instead, PromDash
lets you define the dashboard once and then create global template variables
for the changing parts of your dashboard. In the case of the host dashboard,
you might create a template variable called `host` and then let the user set
this variable to the name of the host which they are currently interested in.
The value of the variable value may then be inserted into relevant text input
fields in a widget's settings.

A variable is interpolated into a text input field by enclosing it with a set
of two curly braces: `{{variable-name}}`. The text inputs that support template
variable interpolation are:

* The widget title.
* The expression input fields in a Prometheus graph.
* The URL input of an iframe widget.
* Annotation tag input fields.

In the example of a host dashboard, we could interpolate the `host` variable
into each widget's Prometheus expressions, like:

    cpu_time_ns{host="{{host}}"}

...and set the title to:

    CPU time for {{host}} in nanoseconds

Besides creating and setting variables via the user interface, you may set
existing variables or even define new ones via the URL:

    http://<promdash-url>/<dashboard-name>#!?var.<var1>=<val1>&var.<var2>=<val2>

In the example of the host dashboard, the URL could look like this:

    http://promdash.somedomain.int/hoststats#!?var.host=myhost

## Annotations

PromDash allows you to load timestamped annotations from an external service
and display them in graphs as vertical lines:

[![Annotation screenshot](/assets/annotations_example.png)](/assets/annotations_example.png)

### Configuring annotations

This section assumes that you already have a working annotation server. For
details on building one, see the [Annotations API](#annotations-api) section below.

The URL that PromDash should query for annotations is set
via the `ANNOTATIONS_URL` environment variable.

To enable annotations on a dashboard, first select "Display annotation tags" in
the global dashboard settings. Each input can hold an arbitrary number of
comma-separated tags that will be used to query your designated annotations
server. Once you have added your tags you can hide the annotation list by
un-checking annotations setting in the global dashboard settings.

Hovering over an annotation on a graph will display the annotation's message:

[![Annotation global config screenshot](/assets/annotations_hover.png)](/assets/annotations_hover.png)

### Annotations API

Although we do not distribute a publicly available annotations server yet, it
is easy to build one.

The URL from which PromDash fetches annotations has the following format:

    ${ANNOTATIONS_URL}?range=3600&tags[]=chef&tags[]=prometheus&until=1423491311.424

The parameters have the following meaning:

- `${ANNOTATIONS_URL}`: this is the configured `${ANNOTATIONS_URL}` environment
  variable.
- `until`: This is the graph's end time as a Unix timestamp in seconds.
- `range`: This is the graph's range (stretching back from the end time) in seconds.
- `tags[]`: This is a list of the tags for which annotations should be loaded.

Each tag input on your dashboard represents a separate query. For example, if
you have three tag inputs, three requests will be made to your annotations
server.

The `until` and `range` parameters define the time window displayed by the
graph. Annotations that are returned to PromDash that do not fall within this
window will not be rendered.

The JSON payload returned from the annotations server needs to conform to this
schema:

```javascript
{
  posts: [
    {
      created_at: 111232553, // UNIX timestamp
      message: "annotation message here"
    },
    // ... more tags
  ]
}
```

All returned annotation tags will be rendered on every graph. There currently
is no support for rendering specific tags on only a subset of graphs.

## Embedding a dashboard
PromDash has support for embedding dashboards into other pages via iframes. To
get an embeddable view for a PromDash dashboard, add `embed` to the URL of a
dashboard as the first path element:

    http://<promdash-url>/embed/<dashboard-name>

This view shows the dashboard's graphs in a carousel-view, one graph at a time.
It omits the menu structure, the dashboard title, and global controls.

In the example of the host dashboard, the embeddable URL could look like this:

    http://promdash.somedomain.int/embed/hoststats#!?var.host=myhost

## Pushing dashboard representations as JSON via HTTP

It's possible to retrieve and update the content of existing PromDash
dashboards via the JSON format over HTTP. For example, this allows you to
manage the authoritative version of your dashboard content in source control,
while still using PromDash for the display.

### Getting a dashboard's JSON representation

    curl http://<promdash-url>/<dashboard-slug>.json > dashboard.json

### Updating a dashboard's JSON representation

    curl -H 'Content-Type: application/json' -X PUT -d @dashboard.json http://<promdash-url>/<dashboard-slug>.json

### Specifying servers by URL

Any occurrences of `serverID` in the JSON format may now be optionally replaced
by a `serverURL` property, specifying a server by its URL instead of by its
internal database ID. A `serverURL` property needs to match the URL of an
existing configured server in PromDash exactly - otherwise a `422 Unprocessable
Entity` HTTP error is returned.

Be aware that if you GET the JSON representation of a dashboard, it will always
show `serverID` fields, and never `serverURL`, since any uploaded JSON
containing `serverURL`s is transformed immediately to `serverID`s before being
saved server-side.

## TODOs

Add documention about:

* `fullscreen` / `fullscreenTitle` URL parameters
* document the dashboard JSON format
