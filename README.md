# Prometheus Documentation [![Build Status](https://travis-ci.org/prometheus/docs.svg?branch=master)](https://travis-ci.org/prometheus/docs)

This repository contains both the content and the static-site generator code for the
Prometheus documentation site.

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
bundle exec nanoc
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
