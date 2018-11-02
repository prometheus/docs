---
title: Understanding and using the proxy exporter pattern
---

# Understanding and using the proxy exporter pattern

Exporters that follow the proxy exporter pattern are those who get their target from the Prometheus GET request and scrape these targets while running on a different machine via a network. In this guide, we will:

* describe the proxy exporter pattern and why it is used,
* run the [blackbox](https://github.com/prometheus/blackbox_exporter) exporter as an example of the pattern,
* let the blackbox exporter run basic metric queries against the Prometheus [website](https://prometheus.io),
* configure a custom query module for the blackbox exporter,
* examine a popular pattern of configuring Prometheus to scrape exporters using relabeling.

## The proxy exporter pattern?

Any exporter receives requests from Prometheus and answers them with data forwarded from other systems. So technically every [exporter](/docs/instrumenting/exporters/) is a [proxy](https://en.wikipedia.org/wiki/Proxy_server). But by proxy exporter pattern we refer to a specific design, in which:

* the exporter will get the target’s metrics via a network protocol.
* the exporter does not have to run on the machine the metrics are taken from.
* the exporter gets the targets and a query config string as parameters of Prometheus’ GET request.
* the exporter subsequently starts the scrape after getting Prometheus’ GET requests and once it is done with scraping.

This pattern is only used for certain exporters, namely the [blackbox](https://github.com/prometheus/blackbox_exporter) and the [SNMP exporter](https://github.com/prometheus/snmp_exporter).

The reason is that we either can’t run the exporter on the targets, e.g. network gear speaking SNMP, or that we are explicitly interested in the distance, e.g. latency and reachability of a website from a specific point outside of our network.

## Running proxy exporters

Proxy exporters are flexible regarding their environment and can be run in many ways. As regular programs, in containers, as background services, on baremetal, virtual machines. Because they are queried and do query over network they do need appropriate open ports. Otherwise they are frugal.

Now let’s try it out for yourself!

Use [Docker](https://www.docker.com/) to start a blackbox exporter container running by running this in a terminal:

```bash
docker run -p 9115:9115 prom/blackbox-exporter
```

You should see a few log lines and if everything went well the last one should report `msg="Listening on address"` as seen here:

```
level=info ts=2018-10-17T15:41:35.4997596Z caller=main.go:324 msg="Listening on address" address=:9115
```

## Basic querying of proxy exporters

There are two ways of querying:

1. Querying the exporter itself. It has its own metrics, usually available at `/metrics`.
1. Querying the exporter to scrape another target. Usually available at a "descriptive" endpoint, e.g. `/probe`.

You can manually try the first query type with curl in another terminal. If you don’t have curl, you can also copy the part between the `'` into a browser’s address bar:

<a name="query-exporter"></a>

```bash
curl 'localhost:9115/metrics'
```

The response should be something like this:

```
# HELP blackbox_exporter_build_info A metric with a constant '1' value labeled by version, revision, branch, and goversion from which blackbox_exporter was built.
# TYPE blackbox_exporter_build_info gauge
blackbox_exporter_build_info{branch="HEAD",goversion="go1.10",revision="4a22506cf0cf139d9b2f9cde099f0012d9fcabde",version="0.12.0"} 1
# HELP go_gc_duration_seconds A summary of the GC invocation durations.
# TYPE go_gc_duration_seconds summary
go_gc_duration_seconds{quantile="0"} 0
go_gc_duration_seconds{quantile="0.25"} 0
go_gc_duration_seconds{quantile="0.5"} 0
go_gc_duration_seconds{quantile="0.75"} 0
go_gc_duration_seconds{quantile="1"} 0
go_gc_duration_seconds_sum 0
go_gc_duration_seconds_count 0
# HELP go_goroutines Number of goroutines that currently exist.
# TYPE go_goroutines gauge
go_goroutines 9
# HELP go_info Information about the Go environment.
# TYPE go_info gauge
go_info{version="go1.10"} 1
# HELP go_memstats_alloc_bytes Number of bytes allocated and still in use.
# TYPE go_memstats_alloc_bytes gauge
go_memstats_alloc_bytes 882904
# HELP go_memstats_alloc_bytes_total Total number of bytes allocated, even if freed.
# TYPE go_memstats_alloc_bytes_total counter
go_memstats_alloc_bytes_total 882904
# HELP go_memstats_buck_hash_sys_bytes Number of bytes used by the profiling bucket hash table.
# TYPE go_memstats_buck_hash_sys_bytes gauge
go_memstats_buck_hash_sys_bytes 1.444128e+06
# HELP go_memstats_frees_total Total number of frees.
# TYPE go_memstats_frees_total counter
go_memstats_frees_total 253
# HELP go_memstats_gc_cpu_fraction The fraction of this program's available CPU time used by the GC since the program started.
# TYPE go_memstats_gc_cpu_fraction gauge
go_memstats_gc_cpu_fraction 0
# HELP go_memstats_gc_sys_bytes Number of bytes used for garbage collection system metadata.
# TYPE go_memstats_gc_sys_bytes gauge
go_memstats_gc_sys_bytes 169984
# HELP go_memstats_heap_alloc_bytes Number of heap bytes allocated and still in use.
# TYPE go_memstats_heap_alloc_bytes gauge
go_memstats_heap_alloc_bytes 882904
# HELP go_memstats_heap_idle_bytes Number of heap bytes waiting to be used.
# TYPE go_memstats_heap_idle_bytes gauge
go_memstats_heap_idle_bytes 630784
# HELP go_memstats_heap_inuse_bytes Number of heap bytes that are in use.
# TYPE go_memstats_heap_inuse_bytes gauge
go_memstats_heap_inuse_bytes 2.023424e+06
# HELP go_memstats_heap_objects Number of allocated objects.
# TYPE go_memstats_heap_objects gauge
go_memstats_heap_objects 6849
# HELP go_memstats_heap_released_bytes Number of heap bytes released to OS.
# TYPE go_memstats_heap_released_bytes gauge
go_memstats_heap_released_bytes 0
# HELP go_memstats_heap_sys_bytes Number of heap bytes obtained from system.
# TYPE go_memstats_heap_sys_bytes gauge
go_memstats_heap_sys_bytes 2.654208e+06
# HELP go_memstats_last_gc_time_seconds Number of seconds since 1970 of last garbage collection.
# TYPE go_memstats_last_gc_time_seconds gauge
go_memstats_last_gc_time_seconds 0
# HELP go_memstats_lookups_total Total number of pointer lookups.
# TYPE go_memstats_lookups_total counter
go_memstats_lookups_total 11
# HELP go_memstats_mallocs_total Total number of mallocs.
# TYPE go_memstats_mallocs_total counter
go_memstats_mallocs_total 7102
# HELP go_memstats_mcache_inuse_bytes Number of bytes in use by mcache structures.
# TYPE go_memstats_mcache_inuse_bytes gauge
go_memstats_mcache_inuse_bytes 6944
# HELP go_memstats_mcache_sys_bytes Number of bytes used for mcache structures obtained from system.
# TYPE go_memstats_mcache_sys_bytes gauge
go_memstats_mcache_sys_bytes 16384
# HELP go_memstats_mspan_inuse_bytes Number of bytes in use by mspan structures.
# TYPE go_memstats_mspan_inuse_bytes gauge
go_memstats_mspan_inuse_bytes 30856
# HELP go_memstats_mspan_sys_bytes Number of bytes used for mspan structures obtained from system.
# TYPE go_memstats_mspan_sys_bytes gauge
go_memstats_mspan_sys_bytes 32768
# HELP go_memstats_next_gc_bytes Number of heap bytes when next garbage collection will take place.
# TYPE go_memstats_next_gc_bytes gauge
go_memstats_next_gc_bytes 4.473924e+06
# HELP go_memstats_other_sys_bytes Number of bytes used for other system allocations.
# TYPE go_memstats_other_sys_bytes gauge
go_memstats_other_sys_bytes 796632
# HELP go_memstats_stack_inuse_bytes Number of bytes in use by the stack allocator.
# TYPE go_memstats_stack_inuse_bytes gauge
go_memstats_stack_inuse_bytes 491520
# HELP go_memstats_stack_sys_bytes Number of bytes obtained from system for stack allocator.
# TYPE go_memstats_stack_sys_bytes gauge
go_memstats_stack_sys_bytes 491520
# HELP go_memstats_sys_bytes Number of bytes obtained from system.
# TYPE go_memstats_sys_bytes gauge
go_memstats_sys_bytes 5.605624e+06
# HELP go_threads Number of OS threads created.
# TYPE go_threads gauge
go_threads 9
# HELP process_cpu_seconds_total Total user and system CPU time spent in seconds.
# TYPE process_cpu_seconds_total counter
process_cpu_seconds_total 0.05
# HELP process_max_fds Maximum number of open file descriptors.
# TYPE process_max_fds gauge
process_max_fds 1.048576e+06
# HELP process_open_fds Number of open file descriptors.
# TYPE process_open_fds gauge
process_open_fds 7
# HELP process_resident_memory_bytes Resident memory size in bytes.
# TYPE process_resident_memory_bytes gauge
process_resident_memory_bytes 7.8848e+06
# HELP process_start_time_seconds Start time of the process since unix epoch in seconds.
# TYPE process_start_time_seconds gauge
process_start_time_seconds 1.54115492874e+09
# HELP process_virtual_memory_bytes Virtual memory size in bytes.
# TYPE process_virtual_memory_bytes gauge
process_virtual_memory_bytes 1.5609856e+07
```

Those are metrics in the Prometheus [format](/docs/instrumenting/exposition_formats/#text-format-example). They come from the exporter’s [instrumentation](/docs/practices/instrumentation/) and tell us about the state of the exporter itself while it is running. This is called whitebox monitoring and very useful in daily ops practice. If you are curious, try out our guide on how to [instrument your own applications](https://prometheus.io/docs/guides/go-application/).

For the second type of querying we need to provide a target and module as parameters in the HTTP GET Request. The target is a URI or IP and the module must defined in the exporter’s configuration. The blackbox exporter container comes with a meaningful default configuration.  
We will use the target `prometheus.io` and the predefined module `http_2xx`. It tells the exporter to make a GET request like a browser would if you go to `prometheus.io` and to expect a [200 OK](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes#2xx_Success) response.

You can now tell your blackbox exporter to query `prometheus.io` in the terminal with curl:

```bash
curl 'localhost:9115/probe?target=prometheus.io&module=http_2xx'
```

This will return a lot of metrics:

```
# HELP probe_dns_lookup_time_seconds Returns the time taken for probe dns lookup in seconds
# TYPE probe_dns_lookup_time_seconds gauge
probe_dns_lookup_time_seconds 0.061087943
# HELP probe_duration_seconds Returns how long the probe took to complete in seconds
# TYPE probe_duration_seconds gauge
probe_duration_seconds 0.065580871
# HELP probe_failed_due_to_regex Indicates if probe failed due to regex
# TYPE probe_failed_due_to_regex gauge
probe_failed_due_to_regex 0
# HELP probe_http_content_length Length of http content response
# TYPE probe_http_content_length gauge
probe_http_content_length 0
# HELP probe_http_duration_seconds Duration of http request by phase, summed over all redirects
# TYPE probe_http_duration_seconds gauge
probe_http_duration_seconds{phase="connect"} 0
probe_http_duration_seconds{phase="processing"} 0
probe_http_duration_seconds{phase="resolve"} 0.061087943
probe_http_duration_seconds{phase="tls"} 0
probe_http_duration_seconds{phase="transfer"} 0
# HELP probe_http_redirects The number of redirects
# TYPE probe_http_redirects gauge
probe_http_redirects 0
# HELP probe_http_ssl Indicates if SSL was used for the final redirect
# TYPE probe_http_ssl gauge
probe_http_ssl 0
# HELP probe_http_status_code Response HTTP status code
# TYPE probe_http_status_code gauge
probe_http_status_code 0
# HELP probe_http_version Returns the version of HTTP of the probe response
# TYPE probe_http_version gauge
probe_http_version 0
# HELP probe_ip_protocol Specifies whether probe ip protocol is IP4 or IP6
# TYPE probe_ip_protocol gauge
probe_ip_protocol 6
# HELP probe_success Displays whether or not the probe was a success
# TYPE probe_success gauge
probe_success 0
```

Unfortunately almost all with the value `0`. The last one a very disheartening `probe_success 0`. This means the prober could not sucessfully reach `prometheus.io`.  
The reason is hidden in the metric `probe_ip_protocol` with the value `6`. By default the prober uses [IPv6](https://en.wikipedia.org/wiki/IPv6) until told otherwise. Unfortunately the Docker daemon blocks IPv6 until told otherwise. Hence our blackbox exporter running in a Docker container can’t connect via IPv6.

We could now either tell Docker to allow IPv6 or the blackbox exporter to use IPv4. In the real world both can make sense and as so often the answer to the question "what is to be done?" is "it depends". Because this is an exporter guide we will change the exporter and take the oportunity to configure a custom module.

## Configuring modules

The modules are predefined in a file inside the docker container called `config.yml` which is a copy of [blackbox.yml](https://github.com/prometheus/blackbox_exporter/blob/master/blackbox.yml) in the github repo.

We will copy this file, [adapt](https://github.com/prometheus/blackbox_exporter/blob/master/CONFIGURATION.md) it to our own needs and tell the exporter to use our config file instead of the one included in the container.  

First download the file using curl or your browser:

```bash
curl -o blackbox.yml https://raw.githubusercontent.com/prometheus/blackbox_exporter/master/blackbox.yml
```

Opened in an editor the first few lines look like this:

```yaml
modules:
  http_2xx:
    prober: http
    http:
  http_post_2xx:
    prober: http
    http:
      method: POST
```

[Yaml](https://en.wikipedia.org/wiki/YAML) uses whitespace indentation to express hierarchy, so you can recognise that two `modules` named `http_2xx` and `http_post_2xx` are defined, and that they both have a prober `http` and for one the method value is specifically set to `POST`.  
We will now change the module `http_2xx` by setting the `preferred_ip_protocol` of the prober `http` explicitly to the string `ip4`.

```yaml
modules:
  http_2xx:
    prober: http
    http:
      preferred_ip_protocol: "ip4"
  http_post_2xx:
    prober: http
    http:
      method: POST
```

If you want to know more about the available probers and options check out the [documentation](https://github.com/prometheus/blackbox_exporter/blob/master/CONFIGURATION.md).

Now we need to tell the blackbox exporter to use our freshly changed file. We can do that with the flag `--config.file="blackbox.yml"`. But because we are using Docker, we first must make this file [available](https://docs.docker.com/storage/bind-mounts/) inside the container using the `--mount` command.  

NOTE: If you are using macOS you first need to allow the Docker daemon to access the directory in which your `blackbox.yml` is. You can do that by clicking on the little Docker whale in menu bar and then on `Preferences`->`File Sharing`->`+`. Afterwards press `Apply & Restart`.

First you stop the old container by changing into its terminal and press `ctrl+c`.
Make sure you are in the directory containing your `blackbox.yml`.
Then you run this command. Don’t be intimidated, it is long, but we explain it:

<a name="run-exporter"></a>

```bash
docker \
  run -p 9115:9115 \
  --mount type=bind,source="$(pwd)"/blackbox.yml,target=/blackbox.yml,readonly \
  prom/blackbox-exporter \
  --config.file="/blackbox.yml"
```

With this command, you told `docker` to:

1. `run` a container with the port `9115` outside the container mapped to the port `9115` inside of the container.
1. `mount` from your current directory (`$(pwd)` stands for *p*rint *w*orking *d*irectory) the file `blackbox.yml` into `/blackbox.yml` in `readonly` mode.
1. use the image `prom/blackbox-exporter` from [Docker hub](https://hub.docker.com/r/prom/blackbox-exporter/).
1. run the blackbox-exporter with the flag `--config.file` telling it to use `/blackbox.yml` as config file.

If everything is correct, you should see something like this:

```
level=info ts=2018-10-19T12:40:51.650462756Z caller=main.go:213 msg="Starting blackbox_exporter" version="(version=0.12.0, branch=HEAD, revision=4a22506cf0cf139d9b2f9cde099f0012d9fcabde)"
level=info ts=2018-10-19T12:40:51.653357722Z caller=main.go:220 msg="Loaded config file"
level=info ts=2018-10-19T12:40:51.65349635Z caller=main.go:324 msg="Listening on address" address=:9115
```

Now we can try our new IPv4-using module `http_2xx` in a terminal:

```bash
curl "localhost:9115/probe?target=prometheus.io&module=http_2xx"
```

Which should return Prometheus metrics like this:

```
# HELP probe_dns_lookup_time_seconds Returns the time taken for probe dns lookup in seconds
# TYPE probe_dns_lookup_time_seconds gauge
probe_dns_lookup_time_seconds 0.060584416
# HELP probe_duration_seconds Returns how long the probe took to complete in seconds
# TYPE probe_duration_seconds gauge
probe_duration_seconds 0.37071774
# HELP probe_failed_due_to_regex Indicates if probe failed due to regex
# TYPE probe_failed_due_to_regex gauge
probe_failed_due_to_regex 0
# HELP probe_http_content_length Length of http content response
# TYPE probe_http_content_length gauge
probe_http_content_length -1
# HELP probe_http_duration_seconds Duration of http request by phase, summed over all redirects
# TYPE probe_http_duration_seconds gauge
probe_http_duration_seconds{phase="connect"} 0.041410336000000006
probe_http_duration_seconds{phase="processing"} 0.19369339
probe_http_duration_seconds{phase="resolve"} 0.062867198
probe_http_duration_seconds{phase="tls"} 0.092468257
probe_http_duration_seconds{phase="transfer"} 0.000145375
# HELP probe_http_redirects The number of redirects
# TYPE probe_http_redirects gauge
probe_http_redirects 1
# HELP probe_http_ssl Indicates if SSL was used for the final redirect
# TYPE probe_http_ssl gauge
probe_http_ssl 1
# HELP probe_http_status_code Response HTTP status code
# TYPE probe_http_status_code gauge
probe_http_status_code 200
# HELP probe_http_version Returns the version of HTTP of the probe response
# TYPE probe_http_version gauge
probe_http_version 1.1
# HELP probe_ip_protocol Specifies whether probe ip protocol is IP4 or IP6
# TYPE probe_ip_protocol gauge
probe_ip_protocol 4
# HELP probe_ssl_earliest_cert_expiry Returns earliest SSL cert expiry in unixtime
# TYPE probe_ssl_earliest_cert_expiry gauge
probe_ssl_earliest_cert_expiry 1.552175999e+09
# HELP probe_success Displays whether or not the probe was a success
# TYPE probe_success gauge
probe_success 1
```

We can see that the probe was successful and get many useful metrics, like latency by phase, status code, ssl status or cert expiry in [epoch](https://en.wikipedia.org/wiki/Unix_time).  
The blackbox exporter also offers a tiny web interface at [localhost:9115](http://localhost:9115) for you to check out the last few probes, the loaded config and debug information. It even offers a direct link to probe `prometheus.io`. Handy if you are wondering why something does not work.

## Querying proxy exporters with Prometheus

So far, so good. Congratulate yourself. The blackbox exporter works and you can manually tell it to query a remote target. We are almost there. We now need to tell Prometheus to do the queries for us.  

Below you find a minimal prometheus config. It is telling Prometheus to scrape the exporter itself as we did [before](#query-exporter) using `curl "localhost:9115/metrics"`:

NOTE: If you use Docker for Mac or Docker for Windows, you can’t use `localhost:9115` in the last line, but must use `host.docker.internal:9115`. This has to do with the virtual machines used to implement Docker on those operating systems. You should not use this in production.

`prometheus.yml` for Linux:

```yaml
scrape_configs:

- job_name: blackbox-exporter-metrics
  scrape_interval: 5s
  metrics_path: /metrics
  static_configs:
    - targets:
      - localhost:9115
```

`prometheus.yml` for macOS and Windows:

```yaml
scrape_configs:

- job_name: blackbox-exporter-metrics
  scrape_interval: 5s
  metrics_path: /metrics
  static_configs:
    - targets:
      - host.docker.internal:9115
```

Now run a Prometheus container and tell it to mount our config file from above:

<a name=run-prometheus></a>

```bash
docker \
  run -p 9090:9090 \
  --mount type=bind,source="$(pwd)"/prometheus.yml,target=/prometheus.yml,readonly \
  prom/prometheus \
  --config.file="/prometheus.yml"
```

This command works similarly to [running the blackbox exporter using a config file](#run-exporter).

If everything worked, you should be able to go to [localhost:9090/targets](http://localhost:9090/targets) and see under `blackbox-exporter-metrics` an endpoint with the state `UP` in green. If you get a red `DOWN` make sure that the blackbox exporter you started [above](run-exporter) is still running. If you see nothing or a yellow `UNKNOWN` you are really fast and need to give it a few more seconds before reloading your browser’s tab.

To tell Prometheus to query `"localhost:9115/probe?target=prometheus.io&module=http_2xx"` we set the `metrics_path` to `/probe` and the parameters under `params:` in the Prometheus config file.

<a name="prometheus-config"></a>

```yaml
scrape_configs:

- job_name: 'blackbox'
  scrape_interval: 5s
  metrics_path: /probe
  params:
    module: [http_2xx]
    target: [prometheus.io]
  static_configs:
    - targets:
      - localhost:9115   # for Windows and macOS replace with - host.docker.internal:9115
```

After saving the config file switch to the terminal with your Prometheus docker container and stop it by pressing `ctrl+C` and start it again to reload the configuration by using the existing [command](#run-prometheus).

The terminal should return the message `"Server is ready to receive web requests."` and after a few seconds you should start to see colourful graphs in [your Prometheus](http://localhost:9090/graph?g0.range_input=5m&g0.stacked=0&g0.expr=probe_http_duration_seconds&g0.tab=0).

This works, but it has a few disadvantages:

1. The actual targets are up in the param config, which is very unusual and hard to understand later.
1. The `instance` label has the value of the blackbox exporter’s address which is technically true, but not what we are interested in.
1. We can’t see which URL we probed. This is unpractical and will also mix up different metrics into one if we probe several URLs.

To fix this, we will use [relabeling](/docs/prometheus/latest/configuration/configuration/#<relabel_config>).
Relabeling is very powerful for advanced usecases because behind the scenes many things in Prometheus are configured with internal labels.
The details are worthy of a [talk](https://www.youtube.com/watch?v=b5-SvvZ7AwI) on its own. For now is suffices if you understand this:

* All labels starting with `__` are dropped after the scrape. Most internal labels start with `__`.
* You can set internal labels that are called `__param_<name>`. Those set URL parameter with the key `<name>` for the scrape request.
* There is an internal label `__address__` which is set by the `targets` under `static_configs` and whose value is the hostname for the scrape request. By default it is later used to set the value for the label `instance`, which is attached to each metric and tells you were the metrics came from.

Don’t worry if you are confused now, we will go through our new config step by step’

```yaml
scrape_configs:

- job_name: 'blackbox'
  scrape_interval: 5s
  metrics_path: /probe
  params:
    module: [http_2xx]
  static_configs:
      - targets:
        - http://prometheus.io    # Target to probe with http.
        - https://prometheus.io   # Target to probe with https.
        - http://example.com:8080 # Target to probe with http on port 8080.
  relabel_configs:
    - source_labels: [__address__]
      target_label: __param_target
    - source_labels: [__param_target]
      target_label: instance
    - target_label: __address__
      replacement: localhost:9115  # The blackbox exporter’s real hostname:port. For Windows and macOS replace with - host.docker.internal:9115
```

So what is new compared to the [last config](#prometheus-config)?

 1. `params` does not include `target` anymore.
 1. We add the actual targets under `static configs:` `targets`. We use several to because we can do that now.
 1. `relabel_configs` contains the new relabeling rules.
 1. We take the values from the label `__address__` (which contain the values from `targets`) and write them to a new label `__param_target` which will add a parameter `target` to Prometheus request.
 1. We take the values from the label `__param_target` and create a label instance with the values.
 1. We write the value `localhost:9115` to the the label `__address__`. This will be used as the hostname and port for the Prometheus scrape requests.

This way we can have the actual targets there, get them as `instance` label values while letting Prometheus make a request against the blackbox exporter.

Often people combine these with a specific service discovery. Check out the [configuration documentation](/docs/prometheus/latest/configuration/configuration) for more information. Using them is no problem, as these write into the `__address__` label just like `targets` defined under `static_configs`.

That is it. Restart the Prometheus docker container and look at your [metrics](http://localhost:9090/graph).

# Summary

In this guide, you learned how the proxy exporter pattern works and how to run a blackbox exporter with a customised module and to configure Prometheus using relabeling to scrape metrics with prober labels.
