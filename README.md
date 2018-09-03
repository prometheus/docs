# Prometheus Documentation

This repository contains both the content and the static-site generator code for the
Prometheus documentation site.

## Contributing Changes

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for general instructions for new Prometheus contributors.

The main documentation contents of this website are located in the [`content/docs`](content/docs) directory.

Documentation concerning the Prometheus server is [maintained in the Prometheus server repository](https://github.com/prometheus/prometheus/tree/master/docs) and cloned into the website at build time.

As a guideline, please keep the documentation generally applicable and avoid use-case-specific changes.

## Prerequisites

You need to have a working Ruby environment set up (including [bundler](https://bundler.io/))
and then install the necessary gems:

```bash
cd docs
make bundle
```

## Building

To generate the static site, run:

```bash
make build
```

The resulting static site will be stored in the `output` directory.

Optionally, you can use an API token to avoid rate limits on the API. You can get an API token from https://github.com/settings/tokens/new.
```bash
export GITHUB_AUTHENTICATION='-u user:token'
```

## Development Server

To run a local server that displays the generated site, run:

```bash
# Rebuild the site whenever relevant files change:
make guard
# Start the local development server in a separate shell:
make serve
```

You should now be able to view the generated site at
[http://localhost:3000/](http://localhost:3000).

## License

Apache License 2.0, see [LICENSE](LICENSE).
