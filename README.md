# Prometheus Documentation

This repository contains both the content and the static-site generator code for the
Prometheus documentation site.

## Contributing Changes

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for general instructions for new Prometheus contributors.

The main documentation contents of this website are located in the [`content/docs`](content/docs) directory.

Documentation concerning the Prometheus server is [maintained in the Prometheus server repository](https://github.com/prometheus/prometheus/tree/master/docs) and cloned into the website at build time.

As a guideline, please keep the documentation generally applicable and avoid use-case-specific changes.

## Prerequisites

You need to have a working Ruby environment set up and then install the
necessary gems:

```bash
cd docs
bundle
```

## Building

To generate the static site, run:

```bash
make build
```

The resulting static site will be stored in the `output` directory.

## Development Server

To run a local server that displays the generated site, run:

```bash
# Rebuild the site whenever relevant files change:
bundle exec guard
# Start the local development server:
bundle exec nanoc view
```

You should now be able to view the generated site at
[http://localhost:3000/](http://localhost:3000).

## License

Apache License 2.0, see [LICENSE](LICENSE).
