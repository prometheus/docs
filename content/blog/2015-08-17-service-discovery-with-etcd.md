---
title: Custom service discovery with etcd
created_at: 2015-08-17
kind: article
author_name: Fabian Reinartz
---

In a [previous post](/blog/2015/06/01/advanced-service-discovery/) we
introduced numerous new ways of doing service discovery in Prometheus.
Since then a lot has happened. We improved the internal implementation and
received fantastic contributions from our community, adding support for
service discovery with Kubernetes and Marathon. They will become available
with the release of version 0.16.

We also touched on the topic of [custom service discovery](/blog/2015/06/01/advanced-service-discovery/#custom-service-discovery).

Not every type of service discovery is generic enough to be directly included
in Prometheus. Chances are your organisation has a proprietary
system in place and you just have to make it work with Prometheus.
This does not mean that you cannot enjoy the benefits of automatically
discovering new monitoring targets.

In this post we will implement a small utility program that connects a custom
service discovery approach based on [etcd](https://coreos.com/etcd/), the
highly consistent distributed key-value store, to Prometheus.

<!-- more -->

## Targets in etcd and Prometheus

Our fictional service discovery system stores services and their
instances under a well-defined key schema:

```
/services/<service_name>/<instance_id> = <instance_address>
```

Prometheus should now automatically add and remove targets for all existing
services as they come and go.
We can integrate with Prometheus's file-based service discovery, which
monitors a set of files that describe targets as lists of target groups in
JSON format.

A single target group consists of a list of addresses associated with a set of
labels. Those labels are attached to all time series retrieved from those
targets.
One example target group extracted from our service discovery in etcd could
look like this:

```
{
  "targets": ["10.0.33.1:54423", "10.0.34.12:32535"],
  "labels": {
    "job": "node_exporter"
  }
}
```

## The program

What we need is a small program that connects to the etcd cluster and performs
a lookup of all services found in the `/services` path and writes them out into
a file of target groups.

Let's get started with some plumbing. Our tool has two flags: the etcd server
to connect to and the file to which the target groups are written. Internally,
the services are represented as a map from service names to instances.
Instances are a map from the instance identifier in the etcd path to its
address.

```
const servicesPrefix = "/services"

type (
  instances map[string]string
  services  map[string]instances
)

var (
  etcdServer = flag.String("server", "http://127.0.0.1:4001", "etcd server to connect to")
  targetFile = flag.String("target-file", "tgroups.json", "the file that contains the target groups")
)
```

Our `main` function parses the flags and initializes our object holding the
current services. We then connect to the etcd server and do a recursive read
of the `/services` path.
We receive the subtree for the given path as a result and call `srvs.handle`,
which recursively performs the `srvs.update` method for each node in the
subtree. The `update` method modifies the state of our `srvs` object to be
aligned with the state of our subtree in etcd.
Finally, we call `srvs.persist` which transforms the `srvs` object into a list
of target groups and writes them out to the file specified by the
`-target-file` flag.

```
func main() {
  flag.Parse()

  var (
    client  = etcd.NewClient([]string{*etcdServer})
    srvs    = services{}
  )

  // Retrieve the subtree of the /services path.
  res, err := client.Get(servicesPrefix, false, true)
  if err != nil {
    log.Fatalf("Error on initial retrieval: %s", err)
  }
  srvs.handle(res.Node, srvs.update)
  srvs.persist()
}
```

Let's assume we have this as a working implementation. We could now run this
tool every 30 seconds to have a mostly accurate view of the current targets in
our service discovery.

But can we do better?

The answer is _yes_. etcd provides watches, which let us listen for updates on
any path and its sub-paths. With that, we are informed about changes
immediately and can apply them immediately. We also don't have to work through
the whole `/services` subtree again and again, which can become important for
a large number of services and instances.

We extend our `main` function as follows:

```
func main() {
  // ...

  updates := make(chan *etcd.Response)

  // Start recursively watching for updates.
  go func() {
    _, err := client.Watch(servicesPrefix, 0, true, updates, nil)
    if err != nil {
      log.Errorln(err)
    }
  }()

  // Apply updates sent on the channel.
  for res := range updates {
    log.Infoln(res.Action, res.Node.Key, res.Node.Value)

    handler := srvs.update
    if res.Action == "delete" {
      handler = srvs.delete
    }
    srvs.handle(res.Node, handler)
    srvs.persist()
  }
}
```

We start a goroutine that recursively watches for changes to entries in
`/services`. It blocks forever and sends all changes to the `updates` channel.
We then read the updates from the channel and apply it as before. In case an
instance or entire service disappears however, we call `srvs.handle` using the
`srvs.delete` method instead.

We finish each update by another call to `srvs.persist` to write out the
changes to the file Prometheus is watching.

### Modification methods

So far so good – conceptually this works. What remains are the `update` and
`delete` handler methods as well as the `persist` method.

`update` and `delete` are invoked by the `handle` method which simply calls
them for each node in a subtree, given that the path is valid:

```
var pathPat = regexp.MustCompile(`/services/([^/]+)(?:/(\d+))?`)

func (srvs services) handle(node *etcd.Node, handler func(*etcd.Node)) {
  if pathPat.MatchString(node.Key) {
    handler(node)
  } else {
    log.Warnf("unhandled key %q", node.Key)
  }

  if node.Dir {
    for _, n := range node.Nodes {
      srvs.handle(n, handler)
    }
  }
}
```

#### `update`

The update methods alters the state of our `services` object
based on the node which was updated in etcd.

```
func (srvs services) update(node *etcd.Node) {
  match := pathPat.FindStringSubmatch(node.Key)
  // Creating a new job directory does not require any action.
  if match[2] == "" {
    return
  }
  srv := match[1]
  instanceID := match[2]

  // We received an update for an instance.
  insts, ok := srvs[srv]
  if !ok {
    insts = instances{}
    srvs[srv] = insts
  }
  insts[instanceID] = node.Value
}
```

#### `delete`

The delete methods removes instances or entire jobs from our `services`
object depending on which node was deleted from etcd.

```
func (srvs services) delete(node *etcd.Node) {
  match := pathPat.FindStringSubmatch(node.Key)
  srv := match[1]
  instanceID := match[2]

  // Deletion of an entire service.
  if instanceID == "" {
    delete(srvs, srv)
    return
  }

  // Delete a single instance from the service.
  delete(srvs[srv], instanceID)
}
```

#### `persist`

The persist method transforms the state of our `services` object into a list of `TargetGroup`s. It then writes this list into the `-target-file` in JSON
format.

```
type TargetGroup struct {
  Targets []string          `json:"targets,omitempty"`
  Labels  map[string]string `json:"labels,omitempty"`
}

func (srvs services) persist() {
  var tgroups []*TargetGroup
  // Write files for current services.
  for job, instances := range srvs {
    var targets []string
    for _, addr := range instances {
      targets = append(targets, addr)
    }

    tgroups = append(tgroups, &TargetGroup{
      Targets: targets,
      Labels:  map[string]string{"job": job},
    })
  }

  content, err := json.Marshal(tgroups)
  if err != nil {
    log.Errorln(err)
    return
  }

  f, err := create(*targetFile)
  if err != nil {
    log.Errorln(err)
    return
  }
  defer f.Close()

  if _, err := f.Write(content); err != nil {
    log.Errorln(err)
  }
}
```

## Taking it live

All done, so how do we run this?

We simply start our tool with a configured output file:

```
./etcd_sd -target-file /etc/prometheus/tgroups.json
```

Then we configure Prometheus with file based service discovery
using the same file. The simplest possible configuration looks like this:

```
scrape_configs:
- job_name: 'default' # Will be overwritten by job label of target groups.
  file_sd_configs:
  - names: ['/etc/prometheus/tgroups.json']
```

And that's it. Now our Prometheus stays in sync with services and their
instances entering and leaving our service discovery with etcd.

## Conclusion

If Prometheus does not ship with native support for the service discovery of
your organisation, don't despair. Using a small utility program you can easily
bridge the gap and profit from seamless updates to the monitored targets.
Thus, you can remove changes to the monitoring configuration from your
deployment equation.

A big thanks to our contributors [Jimmy Dyson](https://twitter.com/jimmidyson)
and [Robert Jacob](https://twitter.com/xperimental) for adding native support
for [Kubernetes](http://kubernetes.io/) and [Marathon](https://mesosphere.github.io/marathon/).
Also check out [Keegan C Smith's](https://twitter.com/keegan_csmith) take on [EC2 service discovery](https://github.com/keegancsmith/prometheus-ec2-discovery) based on files.

You can find the [full source of this blog post on GitHub](https://github.com/fabxc/prom_sd_example/tree/master/etcd_simple).

