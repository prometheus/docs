---
title: Console templates
sort_rank: 3
---

# Console templates

The Console templates allow for creation of arbitrary consoles using the [Go
templating langauge](http://golang.org/pkg/text/template/). These are served
from the Prometheus server.

Console templates are the most powerful way to create templates that can be easily managed in source control, there is a learning curve though so 
users new to this style of monitoring should try out [PromDash](../promdash/) first.

## Getting started

Prometheus comes with an example set of consoles to get you going, these can be found at `/consoles/index.html.example` on a running Prometheus
and will let you see Node Exporter consoles if your node exporters have a `job="node"` label.

Consoles have 5 parts:

1. A navigation bar on top
1. A menu on the left
1. Time controls on the bottom
1. The main content in the center, usually graphs
1. A table on the right

The navigation bar is for links to other systems, such as other Prometheuses, documentation and whatever else makes sense to you.
The menu is for navigation inside the Prometheus, it's very useful to be able to quickly open a console in another tab to correlate information.
Both are configured in `console_libraries/menu.lib`.

The time controls allow changing of the duration and range of the graphs. Console URLs can be shared with others, they'll see the same graphs.

The main content is usually graphs. There's a configurable Javascript graphing
library provided that'll handle requesting data from Prometheus, and rendering
it via [Rickshaw](http://code.shutterstock.com/rickshaw/).

Finally, the table on the right can be used to display statistics in a more
compact form than graphs.
