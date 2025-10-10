---
title: Securing Prometheus API and UI endpoints using basic auth
nav_title: Basic auth
---

Prometheus supports [basic authentication](https://en.wikipedia.org/wiki/Basic_access_authentication) (aka "basic auth") for connections to the Prometheus [expression browser](/docs/visualization/browser) and [HTTP API](/docs/prometheus/latest/querying/api).

NOTE: This tutorial covers basic auth connections *to* Prometheus instances. Basic auth is also supported for connections *from* Prometheus instances to [scrape targets](/docs/prometheus/latest/configuration/configuration/#scrape_config).

## Hashing a password

Let's say that you want to require a username and password from all users accessing the Prometheus instance. For this example, use `admin` as the username and choose any password you'd like.

First, generate a [bcrypt](https://en.wikipedia.org/wiki/Bcrypt) hash of the password.
To generate a hashed password, we will use python3-bcrypt.

Let's install it by running `apt install python3-bcrypt`, assuming you are
running a debian-like distribution. Other alternatives exist to generate hashed
passwords; for testing you can also use [bcrypt generators on the
web](https://bcrypt-generator.com/).

Here is a python script which uses python3-bcrypt to prompt for a password and
hash it:

```python
import getpass
import bcrypt

password = getpass.getpass("password: ")
hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
print(hashed_password.decode())
```

Save that script as `gen-pass.py` and run it:

```shell
$ python3 gen-pass.py
```

That should prompt you for a password:

```
password:
$2b$12$hNf2lSsxfm0.i4a.1kVpSOVyBCfIB51VRjgBUyv6kdnyTlgWj81Ay
```

In this example, I used "test" as password.

Save that password somewhere, we will use it in the next steps!


## Creating web.yml

Let's create a web.yml file
([documentation](https://prometheus.io/docs/prometheus/latest/configuration/https/)),
with the following content:

```yaml
basic_auth_users:
    admin: $2b$12$hNf2lSsxfm0.i4a.1kVpSOVyBCfIB51VRjgBUyv6kdnyTlgWj81Ay
```

You can validate that file with `promtool check web-config web.yml`

```shell
$ promtool check web-config web.yml
web.yml SUCCESS
```

You can add multiple users to the file.

## Launching Prometheus

You can launch prometheus with the web configuration file as follows:

```shell
$ prometheus --web.config.file=web.yml
```

## Testing

You can use cURL to interact with your setup. Try this request:

```bash
curl --head http://localhost:9090/graph
```

This will return a `401 Unauthorized` response because you've failed to supply a valid username and password.

To successfully access Prometheus endpoints using basic auth, for example the `/metrics` endpoint, supply the proper username using the `-u` flag and supply the password when prompted:

```bash
curl -u admin http://localhost:9090/metrics
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

In this guide, you stored a username and a hashed password in a `web.yml` file, launched prometheus with the parameter required to use the credentials in that file to authenticate users accessing Prometheus' HTTP endpoints.
