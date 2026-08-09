---
title: Running Prometheus behind a reverse proxy
nav_title: Reverse proxy
sort_rank: 12
---

Prometheus is often placed behind a reverse proxy (nginx, Caddy, Traefik,
Apache, etc.) for TLS termination, path prefixes, or access control. This guide
covers common settings that keep the UI and HTTP API working correctly.

NOTE: Reverse proxies do **not** replace network isolation. Treat Prometheus
HTTP endpoints as sensitive (see the [security model](/docs/operating/security/)).
Do not expose them on the public internet without authentication and careful
rate limiting.

## External URL

If the proxy serves Prometheus under a public hostname or URL prefix, set
[`--web.external-url`](https://prometheus.io/docs/prometheus/latest/command-line/prometheus/)
to that public base URL (including path prefix if any). This is used for
generated links, redirects, and the expression browser.

Example when the UI is at `https://monitoring.example.com/prometheus/`:

```bash
prometheus \
  --config.file=/etc/prometheus/prometheus.yml \
  --web.external-url=https://monitoring.example.com/prometheus/ \
  --web.route-prefix=/
```

When using a path prefix, also configure the proxy to strip or forward that
prefix consistently with `--web.route-prefix` (see Prometheus command-line docs
for the combination that matches your setup).

## Headers to forward

Proxies should pass through at least:

| Header | Purpose |
|--------|---------|
| `Host` | Original host as seen by clients (or the public hostname you intend Prometheus to see) |
| `X-Forwarded-Proto` | `https` when TLS is terminated at the proxy so redirects stay on HTTPS |
| `X-Forwarded-For` / `X-Real-IP` | Client IP for logs and any IP-based logic (optional but useful) |

Example **nginx** location (TLS terminated on nginx, Prometheus on localhost):

```nginx
location /prometheus/ {
  proxy_pass http://127.0.0.1:9090/;
  proxy_http_version 1.1;

  proxy_set_header Host              $host;
  proxy_set_header X-Real-IP         $remote_addr;
  proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

With this layout, a typical external URL is
`https://monitoring.example.com/prometheus/`.

Example **Caddy**:

```caddy
monitoring.example.com {
  handle_path /prometheus/* {
    reverse_proxy 127.0.0.1:9090
  }
}
```

(`handle_path` strips the `/prometheus` prefix before proxying; align
`--web.external-url` accordingly.)

## Web lifecycle and admin APIs

If you enable `--web.enable-lifecycle` or `--web.enable-admin-api`, the proxy
path to `/-/reload`, `/-/quit`, and `/api/*/admin/` becomes especially
sensitive. Prefer restricting those paths at the proxy (IP allowlist, mTLS, or
separate internal listener) rather than exposing them to every user who can
open the UI.

## Related

* [Security model](/docs/operating/security/)
* [TLS encryption for Prometheus endpoints](/docs/guides/tls-encryption/)
* [Basic auth](/docs/guides/basic-auth/)
