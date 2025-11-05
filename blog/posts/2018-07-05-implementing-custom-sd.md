---
title: Implementing Custom Service Discovery
created_at: 2018-07-05
kind: article
author_name: Callum Styan
---

Prometheus contains built in integrations for many service discovery (SD) systems such as Consul,
Kubernetes, and public cloud providers such as Azure. However, we can’t provide integration
implementations for every service discovery option out there. The Prometheus team is already stretched
thin supporting the current set of SD integrations, so maintaining an integration for every possible SD
option isn’t feasible. In many cases the current SD implementations have been contributed by people
outside the team and then not maintained or tested well. We want to commit to only providing direct
integration with service discovery mechanisms that we know we can maintain, and that work as intended.
For this reason, there is currently a moratorium on new SD integrations.

However, we know there is still a desire to be able to integrate with other SD mechanisms, such as
Docker Swarm. Recently a small code change plus an example was committed to the documentation
[directory](https://github.com/prometheus/prometheus/tree/main/documentation/examples/custom-sd)
within the Prometheus repository for implementing a custom service discovery integration without having
to merge it into the main Prometheus binary. The code change allows us to make use of the internal
Discovery Manager code to write another executable that interacts with a new SD mechanism and outputs
a file that is compatible with Prometheus' file\_sd. By co-locating Prometheus and our new executable
we can configure Prometheus to read the file\_sd-compatible output of our executable, and therefore
scrape targets from that service discovery mechanism. In the future this will enable us to move SD
integrations out of the main Prometheus binary, as well as to move stable SD integrations that make
use of the adapter into the Prometheus
[discovery](https://github.com/prometheus/prometheus/tree/main/discovery) package.

Integrations using file_sd, such as those that are implemented with the adapter code, are listed
[here](https://prometheus.io/docs/operating/integrations/#file-service-discovery).

Let’s take a look at the example code.

<!-- more -->

## Adapter
First we have the file
[adapter.go](https://github.com/prometheus/prometheus/blob/main/documentation/examples/custom-sd/adapter/adapter.go).
You can just copy this file for your custom SD implementation, but it's useful to understand what's
happening here.

    // Adapter runs an unknown service discovery implementation and converts its target groups
    // to JSON and writes to a file for file_sd.
    type Adapter struct {
        ctx     context.Context
        disc    discovery.Discoverer
        groups  map[string]*customSD
        manager *discovery.Manager
        output  string
        name    string
        logger  log.Logger
    }

    // Run starts a Discovery Manager and the custom service discovery implementation.
    func (a *Adapter) Run() {
        go a.manager.Run()
        a.manager.StartCustomProvider(a.ctx, a.name, a.disc)
        go a.runCustomSD(a.ctx)
    }


The adapter makes use of `discovery.Manager` to actually start our custom SD provider’s Run function in
a goroutine. Manager has a channel that our custom SD will send updates to. These updates contain the
SD targets. The groups field contains all the targets and labels our custom SD executable knows about
from our SD mechanism.

    type customSD struct {
        Targets []string          `json:"targets"`
        Labels  map[string]string `json:"labels"`
    }

This `customSD` struct exists mostly to help us convert the internal Prometheus `targetgroup.Group`
struct into JSON for the file\_sd format.

When running, the adapter will listen on a channel for updates from our custom SD implementation.
Upon receiving an update, it will parse the targetgroup.Groups into another `map[string]*customSD`,
and compare it with what’s stored in the `groups` field of Adapter. If the two are different, we assign
the new groups to the Adapter struct, and write them as JSON to the output file. Note that this
implementation assumes that each update sent by the SD implementation down the channel contains
the full list of all target groups the SD knows about.

## Custom SD Implementation

Now we want to actually use the Adapter to implement our own custom SD. A full working example is in
the same examples directory
[here](https://github.com/prometheus/prometheus/blob/main/documentation/examples/custom-sd/adapter-usage/main.go).

Here you can see that we’re importing the adapter code
`"github.com/prometheus/prometheus/documentation/examples/custom-sd/adapter"` as well as some other
Prometheus libraries. In order to write a custom SD we need an implementation of the Discoverer interface.

    // Discoverer provides information about target groups. It maintains a set
    // of sources from which TargetGroups can originate. Whenever a discovery provider
    // detects a potential change, it sends the TargetGroup through its channel.
    //
    // Discoverer does not know if an actual change happened.
    // It does guarantee that it sends the new TargetGroup whenever a change happens.
    //
    // Discoverers should initially send a full set of all discoverable TargetGroups.
    type Discoverer interface {
        // Run hands a channel to the discovery provider(consul,dns etc) through which it can send
        // updated target groups.
        // Must returns if the context gets canceled. It should not close the update
        // channel on returning.
        Run(ctx context.Context, up chan<- []*targetgroup.Group)
    }

We really just have to implement one function, `Run(ctx context.Context, up chan<- []*targetgroup.Group)`.
This is the function the manager within the Adapter code will call within a goroutine. The Run function
makes use of a context to know when to exit, and is passed a channel for sending it's updates of target groups.

Looking at the [Run](https://github.com/prometheus/prometheus/blob/main/documentation/examples/custom-sd/adapter-usage/main.go#L153-L211)
function within the provided example, we can see a few key things happening that we would need to do
in an implementation for another SD. We periodically make calls, in this case to Consul (for the sake
of this example, assume there isn’t already a built-in Consul SD implementation), and convert the
response to a set of `targetgroup.Group` structs. Because of the way Consul works, we have to first make
a call to get all known services, and then another call per service to get information about all the
backing instances.

Note the comment above the loop that’s calling out to Consul for each service:

    // Note that we treat errors when querying specific consul services as fatal for for this
    // iteration of the time.Tick loop. It's better to have some stale targets than an incomplete
    // list of targets simply because there may have been a timeout. If the service is actually
    // gone as far as consul is concerned, that will be picked up during the next iteration of
    // the outer loop.

With this we’re saying that if we can’t get information for all of the targets, it’s better to not
send any update at all than to send an incomplete update. We’d rather have a list of stale targets
for a small period of time and guard against false positives due to things like momentary network
issues, process restarts, or HTTP timeouts. If we do happen to get a response from Consul about every
target, we send all those targets on the channel. There is also a helper function `parseServiceNodes`
that takes the Consul response for an individual service and creates a target group from the backing
nodes with labels.

## Using the current example

Before starting to write your own custom SD implementation it’s probably a good idea to run the current
example after having a look at the code. For the sake of simplicity, I usually run both Consul and
Prometheus as Docker containers via docker-compose when working with the example code.

`docker-compose.yml`

    version: '2'
    services:
    consul:
        image: consul:latest
        container_name: consul
        ports:
        - 8300:8300
        - 8500:8500
        volumes:
        - ${PWD}/consul.json:/consul/config/consul.json
    prometheus:
        image: prom/prometheus:latest
        container_name: prometheus
        volumes:
        - ./prometheus.yml:/etc/prometheus/prometheus.yml
        ports:
        - 9090:9090

`consul.json`

    {
    "service": {
        "name": "prometheus",
        "port": 9090,
        "checks": [
        {
            "id": "metrics",
            "name": "Prometheus Server Metrics",
            "http": "http://prometheus:9090/metrics",
            "interval": "10s"
        }
        ]

    }
    }

If we start both containers via docker-compose and then run the example main.go, we’ll query the Consul
HTTP API at localhost:8500, and the file_sd compatible file will be written as custom_sd.json. We could
configure Prometheus to pick up this file via the file_sd config:

    scrape_configs:
      - job_name: "custom-sd"
        scrape_interval: "15s"
        file_sd_configs:
        - files:
          - /path/to/custom_sd.json
