---
title: Documenting exporters
sort_rank: 100
---

Exporter documentation should live in the exporter's own repository. This keeps
the docs close to the code and release process, while still making them
available on prometheus.io.

## Source layout

Put user-facing documentation in a top-level `docs/` directory in the exporter
repository:

```text
docs/
  README.md
  getting-started.md
  configuration.md
```

Use `docs/README.md` as the index page. GitHub renders this file when browsing
the `docs/` directory, and prometheus.io publishes it as the exporter landing
page.

## Frontmatter

Every Markdown page must include frontmatter with a `title` and `sort_rank`:

```yaml
---
title: Getting started
sort_rank: 1
---
```

Use `nav_title` when the sidebar label should be shorter than the page title.
Use `hide_in_nav: true` only for pages that should be addressable directly but
not shown in the sidebar.

Keep the page's `# Heading` in the Markdown body. Unlike the Prometheus server
and Alertmanager docs, exporter docs are rendered on prometheus.io exactly as
they appear on GitHub, so the heading remains useful in both places.

## Links and assets

Use relative links with the `.md` extension when linking between pages in the
same exporter repository:

```markdown
See [configuration](configuration.md) for all flags and options.
```

Store images and other documentation assets under `docs/` next to the Markdown
files that reference them. Relative image links are copied and rewritten by the
website build.

## Releases

The website pulls exporter docs from the latest stable GitHub release tag. Docs
merged into an exporter repository appear on prometheus.io after the exporter
cuts a release containing those files.
