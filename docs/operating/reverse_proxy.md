---
title: Reverse proxy
sort_rank: 6
---

Prometheus is often exposed through a reverse proxy (for example nginx, Caddy,
or Envoy) for TLS termination, authentication, or path-based routing. This page
collects practical proxy settings; adjust them for your environment.

## General HTTP proxying

Forward the original host and scheme so generated links and redirects stay
correct when Prometheus is not reached directly:

```nginx
proxy_set_header Host              $host;
proxy_set_header X-Real-IP         $remote_addr;
proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

Use `proxy_pass` to the Prometheus listen address (for example
`http://127.0.0.1:9090`). If the proxy and Prometheus run on the same host,
binding Prometheus to localhost and proxying only on the public interface reduces
exposure.

See also [Security](/docs/operating/security/) for CSRF and CORS considerations
when administrative API paths are reachable through the proxy.

## Live notifications (Server-Sent Events)

The UI endpoint `/api/v1/notifications/live` uses
[Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events).
Many proxies buffer responses by default, which breaks the stream and produces
**Real-time notifications interrupted** in the Prometheus UI.

Configure a dedicated `location` for that path with buffering disabled and a
long read timeout, for example:

```nginx
location = /api/v1/notifications/live {
    proxy_pass         http://127.0.0.1:9090;
    proxy_http_version 1.1;
    proxy_set_header   Connection "";
    proxy_buffering    off;
    proxy_cache        off;
    proxy_read_timeout 600s;
    proxy_send_timeout 600s;
    gzip               off;

    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Keep the general `location /` block for the rest of the UI and API. Test live
notifications after deploying proxy changes.

## Related documentation

- [HTTP API](/docs/prometheus/latest/querying/api/) — includes live notifications
- [Security](/docs/operating/security/) — authentication and API exposure
