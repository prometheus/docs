---
title: Basic auth
---

# Securing Prometheus API and UI endpoints using basic auth

Prometheus does not directly support [basic authentication](https://en.wikipedia.org/wiki/Basic_access_authentication) (aka "basic auth") for connections to the Prometheus [expression browser](/docs/visualization/browser) and [HTTP API](/docs/prometheus/latest/querying/api). If you'd like to enforce basic auth for those connections, we recommend using Prometheus in conjunction with a [reverse proxy](https://www.nginx.com/resources/glossary/reverse-proxy-server/) and applying authentication at the proxy layer. You can use any reverse proxy you like with Prometheus, but in this guide we'll provide an [nginx example](#nginx-example).

NOTE: Although basic auth connections *to* Prometheus instances are not supported, basic auth is supported for connections *from* Prometheus instances to [scrape targets](../prometheus/latest/configuration/configuration/#<scrape_config>).

## nginx example

Let's say that you want to run a Prometheus instance behind an [nginx](https://www.nginx.com/) server running on `localhost:12321`, and for all Prometheus endpoints to be available via the `/prometheus` endpoint. The full URL for Prometheus' `/metrics` endpoint would thus be:

```
http://localhost:12321/prometheus/metrics
```

Let's also say that you want to require a username and password from all users accessing the Prometheus instance. For this example, use `admin` as the username and choose any password you'd like.

First, create a `.htpasswd` file to store the username/password using the [`htpasswd`](https://httpd.apache.org/docs/2.4/programs/htpasswd.html) tool and store it in the `/etc/nginx` directory:

```bash
mkdir -p /etc/nginx
htpasswd -c /etc/nginx/.htpasswd admin
```

NOTE: This example uses `/etc/nginx` as the location of the nginx configuration files, including the `.htpasswd` file, but this will vary based on the installation. Other [common nginx config directories](http://nginx.org/en/docs/beginners_guide.html) include `/usr/local/nginx/conf` and `/usr/local/etc/nginx`.

## nginx configuration

Below is an example [`nginx.conf`](https://www.nginx.com/resources/wiki/start/topics/examples/full/) configuration file (stored at `/etc/nginx/.htpasswd`). With this configuration, nginx will enforce basic auth for all connections to the `/prometheus` endpoint (which proxies to Prometheus):

```conf
http {
    server {
        listen 12321;

        location /prometheus {
            auth_basic           "Prometheus";
            auth_basic_user_file /etc/nginx/.htpasswd;

            proxy_pass           http://localhost:9090/;
        }
    }
}

events {}
```

Start nginx using the configuration from above:

```bash
nginx -c /etc/nginx/nginx.conf
```

## Prometheus configuration

When running Prometheus behind the nginx proxy, you'll need to set the external URL to `http://localhost:12321/prometheus` and the route prefix to `/`:

```bash
prometheus \
  --config.file=/path/to/prometheus.yml \
  --web.external-url=http://localhost:12321/prometheus \
  --web.route-prefix="/"
```

## Testing

You can use cURL to interact with your local nginx/Prometheus setup. Try this request:

```bash
curl --head http://localhost:12321/prometheus/graph
```

This will return a `401 Unauthorized` response because you've failed to supply a valid username and password. The response will also contain a `WWW-Authenticate: Basic realm="Prometheus"` header supplied by nginx, indicating that the `Prometheus` basic auth realm, specified by the `auth_basic` parameter for nginx, is enforced.

To successfully access Prometheus endpoints using basic auth, for example the `/metrics` endpoint, supply the proper username using the `-u` flag and supply the password when prompted:

```bash
curl -u admin http://localhost:12321/prometheus/metrics
Enter host password for user 'admin':
```

That should return Prometheus metrics output, which should look something like this:

```
# HELP go_gc_duration_seconds A summary of the GC invocation durations.
# TYPE go_gc_duration_seconds summary
go_gc_duration_seconds{quantile="0"} 0.0001343
go_gc_duration_seconds{quantile="0.25"} 0.0002032
go_gc_duration_seconds{quantile="0.5"} 0.0004485
...
```

## Summary

In this guide, you stored a username and password in a `.htpasswd` file, configured nginx to use the credentials in that file to authenticate users accessing Prometheus' HTTP endpoints, started up nginx, and configured Prometheus for reverse proxying.
