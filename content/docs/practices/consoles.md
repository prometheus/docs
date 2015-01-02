---
title: Consoles and dashboards
sort_rank: 3
---

## Consoles and dashboards

It can be tempting to display as much data as possible on a dashboard, especially
when a system like Prometheus offers the ability to have such rich
instrumentation of your applications. This can lead to consoles that are
impenetrable due to having too much information, that even an expert in the
system would have difficulty drawing meaning from. Hundreds of graphs on a
single page isn't unheard of, nor is a hundred plots on a single graph

Instead of trying to represent every piece of data you have, for operational
consoles think of what are the most likely failure modes and how you'd use the
consoles to differentiate them. Take advantage of the structure of your
services. For example if you've a big tree of services in an online serving
system, latency in some lower service is a typical problem. You could have one
big page with every service's information, a better approach is one page per
service that includes the latency and errors it sees for each service it talks
to. You can then start at the top and work your way down to the problem
service.

We've found the following guidelines very effective:

* Have no more than 5 graphs on a console.
* Have no more than 5 plots (lines) on each graph. You can get away with more if it's a stacked/area graph.
* If using console templates, try to avoid more than 20-30 entries on the table on the right

If you find yourself exceeding these then you should demote the visibility of
less important information, possibly splitting out some subsystems to a new console.
For example you could graph aggregated rather than broken-down data, move
things to the right hand table or even remove it completely if it's rarely
useful - you can always look at it in the [expression browser](../../visualization/browser/)!

Finally, it is difficult for a set of consoles to serve more than one master.
What you want to know when oncall (what's broken?) tends to be very different
from what you want when developing features (how many people hit corner
case X?). In such cases, two seperate sets of consoles can be useful.
