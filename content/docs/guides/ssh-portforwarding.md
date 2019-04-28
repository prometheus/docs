---
title: SSH port forwarding
---

# Securing Prometheus API and UI endpoints using SSH port forwarding

If you consider your metrics non-public information, you should obviously protect your prometheus instance
from unauthorized access.

Quote from [offical Prometheus Documentation](/docs/operating/security/#authentication-authorization-and-encryption):
> Prometheus and its components do not provide any server-side authentication, authorisation or encryption.

Prometheus does not directly support any authentication for connections to the
Prometheus [expression browser](/docs/visualization/browser) and [HTTP API](/docs/prometheus/latest/querying/api). If
you'd like to enforce encryption and authentication for those connections, you may use the "SSH port forwarding"
technique and  also set up a local firewall (aka packet filter) to deny any other incoming connections but SSH.

Alternatively, you may want to take a look at the [Ngnix-Reverse-Proxy Basic-Auth Guide](/docs/guides/basic-auth).

For the "SSH port forwarding" approch described here you may use any operating system, but in this guide we'll
provide an example for linux (debian 9 prometheus host and kubuntu 18 on local laptop).

For more details on SSH port forwarding, see <https://www.ssh.com/ssh/tunneling/example> for example.

Also think about [hardening your SSH](https://medium.com/@jasonrigden/hardening-ssh-1bcb99cd4cef); at
least `apt install fail2ban` with `[sshd] enabled = true`.


## Setup "SSH port forwarding" for Prometheus in 5 steps

### 1.) Create id_rsa

If you already have your id_rsa in place ( `cat ~/.ssh/id_rsa` ), skip this step.

To create a new keypair, run `ssh-keygen` on your local machine, logged in with your standard user account:

```
user@localhost:~$ ssh-keygen 
Generating public/private rsa key pair.
Enter file in which to save the key (/home/user/.ssh/id_rsa): 
Enter passphrase (empty for no passphrase): [type a new password or just hit "enter" for an empty passphrase]
Enter same passphrase again: [type new password again]
Your identification has been saved in /home/user/.ssh/id_rsa.
Your public key has been saved in /home/user/.ssh/id_rsa.pub.
The key fingerprint is:
SHA256:UEWZWFqZlP+DWcJd3xz73PsAeXfBHuvpl4xJg2ohCKI user@localhost
The key's randomart image is:
+---[RSA 2048]----+
|        .***     |
|       ..o*   ...|
|      . .  o . *=|
| . .   .    +.+.B|
|. . . . S   +*.+=|
|E    . . . .o=+.*|
|        . o . *+o|
|         o   o.=.|
|        .      .+|
+----[SHA256]-----+
user@localhost:~$
```

On Windows you might
use [Putty](https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html): See <https://www.ssh.com/ssh/putty/windows/puttygen>

### 2.) Create new user on prometheus host

In order to create a new unprivileged user as root on your prometheus host run:

```
root@prometheus:~# adduser prometheus-tunnel
Adding user `prometheus-tunnel' ...
Adding new group `prometheus-tunnel' (1002) ...
Adding new user `prometheus-tunnel' (1002) with group `prometheus-tunnel' ...
Creating home directory `/home/prometheus-tunnel' ...
Copying files from `/etc/skel' ...
Enter new UNIX password: [type a unique strong password]
Retype new UNIX password: [type the unique strong password again]
passwd: password updated successfully
Changing the user information for prometheus-tunnel
Enter the new value, or press ENTER for the default
        Full Name []: 
        Room Number []: 
        Work Phone []: 
        Home Phone []: 
        Other []: 
Is the information correct? [Y/n]
root@prometheus:~#
```

Set a strong password! You won't need to type it very often. We will use your id_rsa key instead.

As root on your prometheus host you can also always reset the password for the user if you need to:
    
```
root@prometheus:~# passwd prometheus-tunnel
Enter new UNIX password: [new strong unique password]
Retype new UNIX password: [new strong unique password]
passwd: password updated successfully
root@prometheus:~# 
```

### 3.) Upload your id_rsa to the prometheus host

Upload your (new) public key to your machine in your data center.

Replace `203.0.113.1` with the IP or DNS name of your prometheus host:

```
user@localhost:~$ ssh-copy-id -i ~/.ssh/id_rsa prometheus-tunnel@203.0.113.1
/usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "/home/user/.ssh/id_rsa.pub"
/usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed
/usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys
prometheus-tunnel@203.0.113.1's password: [type the unique strong password you just set in the previous step]
Number of key(s) added: 1
Now try logging into the machine, with: "ssh 'prometheus-tunnel@203.0.113.1'"
and check to make sure that only the key(s) you wanted were added.
user@localhost:~$ ssh prometheus-tunnel@203.0.113.1
Enter passphrase for key '/home/user/.ssh/id_rsa':
[...]
prometheus-tunnel@prometheus:~$ 
```

See also <https://www.ssh.com/ssh/copy-id>

You can also always upload more public id_rsa keys from other users by adding their keys
to `/home/prometheus-tunnel/.ssh/authorized_keys` if you want to enable access to your prometheus instance for them.

### 4.) Setup UFW on prometheus host

In order to set up a firewall (aka packet filter) on your prometheus host run as root:

```
root@prometheus:~# apt install ufw
[...]
root@prometheus:~# ufw allow ssh
Rules updated
Rules updated (v6)
root@prometheus:~# ufw enable
Command may disrupt existing ssh connections. Proceed with operation (y|n)? y
Firewall is active and enabled on system startup
root@prometheus:~#
```

This will block all incoming traffic to your prometheus host, expect connections to the SSH port 22/tcp.

Make sure you do not need any other ports for crucial access to your host. Your SSH may be configured to be on a
non-standart port. You may be using a hosted service where access to port 80 or 443 may be indispensable. Do not
lock out yourself!

### 5.) Open tunnel to prometheus host

#### Start prometheus

As user on your prometheus host in
the [appropriate directory](/docs/prometheus/latest/getting_started#starting-prometheus) run:

```
prometheus@prometheus:~/prometheus-2.9.0-rc.0.linux-amd64$ ./prometheus --config.file=prometheus.yml \
--web.external-url=http://localhost:8080/ \
--web.route-prefix="/"
```

#### Open the tunnel

With your standard user account on your local machine run:

```
user@localhost:~$ ssh -i ~/.ssh/id_rsa -L 8080:localhost:9090 prometheus-tunnel@203.0.113.1
Enter passphrase for key '/home/user/.ssh/id_rsa': [the passphrase for your rsa-secret-key]
Linux prometheus 4.15.[...]
prometheus-tunnel@prometheus:~$
```

You may choose a different port than 8080; if you use a port below 1024, you have to run the ssh command as root on
your local machine.

On Windows you might use
[Putty](https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html): See
<https://blog.devolutions.net/2017/4/how-to-configure-an-ssh-tunnel-on-putty>

#### Test connection

In your favorite webbrowser on your local machine go to:

<http://localhost:8080/>

NOTE: Even if we don't use HTTPS, the traffic to your prometheus host will be encrypted by the SSH tunnel.

#### Test API

You can use cURL to interact with your Prometheus setup. Try this request:

```bash
curl --head http://localhost:8080/graph/
```

That should return Prometheus metrics output which should look something like this:

```
# HELP go_gc_duration_seconds A summary of the GC invocation durations.
# TYPE go_gc_duration_seconds summary
go_gc_duration_seconds{quantile="0"} 0.0001343
go_gc_duration_seconds{quantile="0.25"} 0.0002032
go_gc_duration_seconds{quantile="0.5"} 0.0004485
[...]
```

## Problems

### Connection timeout / Enable SSH keep alive

If you experience occasionally disconnects due to timeouts on your tunnel: On your local machine, as root,
edit `/etc/ssh/ssh_config` to make sure it contains the line `ServerAliveInterval 120`. Or read the documenation of
your SSH Client Software for other operating systems or SSH client software.

### Known Issue: CSRF/XSS vulnerabilities

You need to secure your browser with an apporiate plugin
like [NoScript for Firefox](https://addons.mozilla.org/de/firefox/addon/noscript/) or other
measures (disconnect your local host from any other network traffic?) from issuing any requests that may
trigger any CSRF/XSS vulnerabilitiy! Prometheus *is* vulnerable to those kind of attacks!

Also see [Security / Authentication, Authorization, and Encryption](/docs/operating/security#authentication-authorization-and-encryption)

## Summary

In this guide we set up a secure tunnel from your local machine to your new prometheus host in your data center
and block all other incoming traffic to that host to protect it from unauthorized access.
