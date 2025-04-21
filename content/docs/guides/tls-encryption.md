---
title: TLS encryption
sort_rank: 1
---

# Securing Prometheus API and UI endpoints using TLS encryption

Prometheus supports [Transport Layer Security](https://en.wikipedia.org/wiki/Transport_Layer_Security) (TLS) encryption for connections to Prometheus instances (i.e. to the expression browser or [HTTP API](../../prometheus/latest/querying/api)). If you would like to enforce TLS for those connections, you would need to create a specific web configuration file.

NOTE: This guide is about TLS connections *to* Prometheus instances. TLS is also supported for connections *from* Prometheus instances to [scrape targets](../../prometheus/latest/configuration/configuration/#tls_config).

## Pre-requisites

Let's say that you already have a Prometheus instance up and running, and you
want to adapt it. We will not cover the initial Prometheus setup in this guide.

Let's say that you want to run a Prometheus instance served with TLS, available at the `example.com` domain (which you own).

Let's also say that you've generated the following using [OpenSSL](https://www.digitalocean.com/community/tutorials/openssl-essentials-working-with-ssl-certificates-private-keys-and-csrs) or an analogous tool:

* an SSL certificate at `/home/prometheus/certs/example.com/example.com.crt`
* an SSL key at `/home/prometheus/certs/example.com/example.com.key`

You can generate a self-signed certificate and private key using this command:

```bash
mkdir -p /home/prometheus/certs/example.com && cd /home/prometheus/certs/certs/example.com
openssl req \
  -x509 \
  -newkey rsa:4096 \
  -nodes \
  -keyout example.com.key \
  -out example.com.crt
```

Fill out the appropriate information at the prompts, and make sure to enter `example.com` at the `Common Name` prompt.

## Prometheus configuration

Below is an example [`web-config.yml`](https://prometheus.io/docs/prometheus/latest/configuration/https/) configuration file. With this configuration, Prometheus will serve all its endpoints behind TLS.

```yaml
tls_server_config:
  cert_file: /home/prometheus/certs/example.com/example.com.crt
  key_file: /home/prometheus/certs/example.com/example.com.key
```

To make Prometheus use this config, you will need to call it with the flag
`--web.config.file`.


```bash
prometheus \
  --config.file=/path/to/prometheus.yml \
  --web.config.file=/path/to/web-config.yml \
  --web.external-url=https://example.com/
```

The `--web.external-url=` flag is optional here.

## Testing

If you'd like to test out TLS locally using the `example.com` domain, you can add an entry to your `/etc/hosts` file that re-routes `example.com` to `localhost`:

```
127.0.0.1     example.com
```

You can then use cURL to interact with your local Prometheus setup:

```bash
curl --cacert /home/prometheus/certs/example.com/example.com.crt \
  https://example.com/api/v1/label/job/values
```

You can connect to the Prometheus server without specifying certs using the `--insecure` or `-k` flag:

```bash
curl -k https://example.com/api/v1/label/job/values
```
