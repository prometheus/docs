---
title: TLS encryption
sort_rank: 1
---

# Securing Prometheus API and UI endpoints using TLS encryption

Prometheus does not directly support [Transport Layer Security](https://en.wikipedia.org/wiki/Transport_Layer_Security) (TLS) encryption for connections to Prometheus instances (i.e. to the expression browser or [HTTP API](../../prometheus/latest/querying/api)). If you would like to enforce TLS for those connections, we recommend using Prometheus in conjunction with a [reverse proxy](https://www.nginx.com/resources/glossary/reverse-proxy-server/) and applying TLS at the proxy layer. You can use any reverse proxy you like with Prometheus, but in this guide we'll provide an [nginx example](#nginx-example).

NOTE: Although TLS connections *to* Prometheus instances are not supported, TLS is supported for connections *from* Prometheus instances to [scrape targets](../prometheus/latest/configuration/configuration/#<tls_config>).

## nginx example

Let's say that you want to run a Prometheus instance behind an [nginx](https://www.nginx.com/) server available at the `example.com` domain (which you own), and for all Prometheus endpoints to be available via the `/prometheus` endpoint. The full URL for Prometheus' `/metrics` endpoint would thus be:

```
https://example.com/prometheus/metrics
```

Let's also say that you've generated the following using [OpenSSL](https://www.digitalocean.com/community/tutorials/openssl-essentials-working-with-ssl-certificates-private-keys-and-csrs) or an analogous tool:

* an SSL certificate at `/root/certs/example.com/example.com.crt`
* an SSL key at `/root/certs/example.com/example.com.key`

You can generate a self-signed certificate and private key using this command:

```bash
mkdir -p /root/certs/example.com && cd /root/certs/example.com
openssl req \
  -x509 \
  -newkey rsa:4096 \
  -nodes \
  -keyout example.com.key \
  -out example.com.crt
```

Fill out the appropriate information at the prompts, and make sure to enter `example.com` at the `Common Name` prompt.

## nginx configuration

Below is an example [`nginx.conf`](https://www.nginx.com/resources/wiki/start/topics/examples/full/) configuration file. With this configuration, nginx will:

* enforce TLS encryption using your provided certificate and key
* proxy all connections to the `/prometheus` endpoint to a Prometheus server running on the same host (while removing the `/prometheus` from the URL)

```conf
http {
    server {
        listen              443 ssl;
        server_name         example.com;
        ssl_certificate     /root/certs/example.com/example.com.crt;
        ssl_certificate_key /root/certs/example.com/example.com.key;

        location /prometheus {
            proxy_pass http://localhost:9090/;
        }
    }
}

events {}
```

Start nginx as root (since nginx will need to bind to port 443):

```bash
sudo nginx -c /usr/local/etc/nginx/nginx.conf
```

NOTE: This example uses `/usr/local/etc/nginx` as the location of the nginx configuration file, but this will vary based on the installation. Other [common nginx config directories](http://nginx.org/en/docs/beginners_guide.html) include `/usr/local/nginx/conf` and `/etc/nginx`.

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

You can then use cURL to interact with your local nginx/Prometheus setup:

```bash
curl --cacert /root/certs/example.com/example.com.crt \
  https://example.com/prometheus/api/v1/label/job/values
```

You can connect to the nginx server without specifying certs using the `--insecure` or `-k` flag:

```bash
curl -k https://example.com/prometheus/api/v1/label/job/values
```
