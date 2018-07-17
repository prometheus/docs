---
title: Basic auth
---

# Securing Prometheus API and UI endpoints using basic auth

Prometheus does not directly support [basic authentication](https://en.wikipedia.org/wiki/Basic_access_authentication) (aka "basic auth") for connections to Prometheus instances (i.e. to the expression browser or [HTTP API](../../prometheus/latest/querying/api)). If you would like to enforce basic auth for those connections, we recommend using Prometheus in conjunction with a [reverse proxy](https://www.nginx.com/resources/glossary/reverse-proxy-server/) and applying authentication at the proxy layer. You can use any reverse proxy you like with Prometheus, but in this guide we'll provide an [nginx example](#nginx-example).

NOTE: Although basic auth connections *to* Prometheus instances are not supported, TLS is supported for connections *from* Prometheus instances to [scrape targets](../prometheus/latest/configuration/configuration/#<scrape_config>).

## nginx example

Let's say that you want to run a Prometheus instance behind an [nginx](https://www.nginx.com/) server available at the `example.com` domain (which you own), and for all Prometheus endpoints to be available via the `/prometheus` endpoint. The full URL for Prometheus' `/metrics` endpoint would thus be:

```
https://example.com/prometheus/metrics
```

Let's also say that you want to require a username and password from all users accessing the Prometheus [expression browser](/docs/visualization/browser). For this example, use `admin` as the username and choose any password you'd like.

First, create a `.htpasswd` file to store the username/password using the [`htpasswd`](https://httpd.apache.org/docs/2.4/programs/htpasswd.html) tool:

```bash
sudo htpasswd -c /usr/local/etc/nginx/.htpasswd admin
```

The `sudo` is necessary to attach the appropriate permissions to the file. If you do not create the password file using `sudo`, nginx will reject it. You'll be prompted to enter your desired password for the `admin` username twice.

NOTE: This example uses `/usr/local/etc/nginx` as the location of the nginx configuration files, including the `.htpasswd` file, but this will vary based on the installation. Other [common nginx config directories](http://nginx.org/en/docs/beginners_guide.html) include `/usr/local/nginx/conf` and `/etc/nginx`.

## nginx configuration

Below is an example [`nginx.conf`](https://www.nginx.com/resources/wiki/start/topics/examples/full/) configuration file. With this configuration, nginx will enforce basic auth for all connections to the `/prometheus` endpoint (which proxies to Prometheus):

```conf
http {
    server {
        listen              80;
        server_name         example.com;

        location /prometheus {
            auth_basic           "Prometheus";
            auth_basic_user_file /usr/local/etc/nginx/.htpasswd;

            proxy_pass           http://localhost:9090/;
        }
    }
}

events {}
```

Start nginx as root (since nginx will need to bind to port 443):

```bash
sudo nginx -c /usr/local/etc/nginx/nginx.conf
```

## Prometheus configuration

When running Prometheus behind the nginx proxy, you'll need to set the external URL to `http://example.com/prometheus` and the route prefix to `/`:

```bash
prometheus \
  --config.file=/path/to/prometheus.yml \
  --web.external-url=http://example.com/prometheus \
  --web.route-prefix="/"
```

## Testing

If you'd like to test out the nginx proxy locally using the `example.com` domain, you can add an entry to your `/etc/hosts` file that re-routes `example.com` to `localhost`:

```
127.0.0.1     example.com
```

You can then use cURL to interact with your local nginx/Prometheus setup. The following request will return a `401 Unauthorized` response, because you've failed to supply a valid username and password, and also bear a `WWW-Authenticate: Basic realm="Prometheus"` header:

```bash
curl --head http://localhost/prometheus/metrics
```

To access Prometheus endpoints using basic auth, for example the `/metrics` endpoint, supply the proper username and password using the `-u` flag:

```bash
curl -u admin:<password> http://localhost/prometheus/metrics
```

## Summary

In this guide, you stored a username and password in a `.htpasswd` file, configured nginx to use the credentials in that file to authenticate users accessing Prometheus' HTTP endpoints, started up nginx, and configured Prometheus for reverse proxying.
