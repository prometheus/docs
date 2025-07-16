# Markdown documentation formatting guide

This document gives an overview of the Markdown features and formatting options available for the docs in this repository. It also provides information about the frontmatter fields that can be used to customize the behavior and appearance of the documentation pages.

These documentation pages live in:

* General documentation: https://github.com/prometheus/docs/tree/main/docs
* Prometheus server documentation: https://github.com/prometheus/prometheus/tree/main/docs
* Alertmanager documentation: https://github.com/prometheus/alertmanager/tree/main/docs

## Markdown features

Generally, we use [GitHub Flavored Markdown](https://github.github.com/gfm/) for formatting with some custom filters on top:

* **Alert boxes:** Paragraphs that start with `TIP:`, `NOTE:`, `CAUTION:`, or `TODO:` are automatically converted to alert boxes with an appropriate icon and color.
* **Syntax highlighting:** Code blocks are automatically highlighted using [Shiki](https://shiki.matsu.io/).
* **Config placeholder definition linking:** On configuration pages like https://prometheus.io/docs/prometheus/latest/configuration/configuration/, any inline `<code>` element with a text pattern of `<placeholder>` (e.g. `<string>` or `<scrape_config>`) will be identified as a type definition, and references to those placeholders in code boxes will be linked to them.
* **Link normalization:** Links to images and other pages are normalized in various ways to point to the right locations, show external link icons, etc.

## Frontmatter fields

The following frontmatter fields are available:

### For documentation pages

| Field | Description |
|-------|-------------|
| `title` | The title of the page. This is displayed as the main heading on the page and as the HTML page title. |
| `nav_title` | (OPTIONAL) An alternate (usually shorter) title to show in the navigation menu and in the previous/next pagination buttons. If not set, the `title` field is used. |
| `sort_rank` | The sort order of the page relative to its sibling pages in the same directory. Pages with a lower sort rank will appear first in the navigation menu. Should start at 1 and be incremented by 1 for each page in the same directory. |
| `nav_icon` | (OPTIONAL) The [Tabler](https://tabler.io/icons) icon to be displayed in the navigation menu for this section. This is only used for the top-level section `index.md` Markdown files and doesn't have any effect when used in actual documentation pages. Any new icons need to be added to the `iconMap` in [`src/app/docs/layout.tsx`](src/app/docs/layout.tsx). |
| `hide_in_nav` | (OPTIONAL) If set to `true`, the page will not be included in the navigation menu but still be accessible via its URL. |

### For blog posts

| Field | Description |
|-------|-------------|
| `title` | The title of the blog post. This is displayed as the main heading on the page and as the HTML page title. |
| `author_name` | The name of the author of the blog post. |
| `created_at` | The date of the blog post in `YYYY-mm-dd` format. |

## Proper usage of heading levels

For both blog posts and documentation pages, please use headings in the following ways:

* **DO NOT use any top-level headings (`# Heading`, `<h1>`) in the Markdown content itself.** The final rendered page will already include an automatic H1 heading based on the `title` frontmatter field.
* Use second-level headings (`## Heading`, `<h2>`) for the main sections of the blog post and use lower-level headings for subsections as appropriate.

## Links between pages

When linking *between* documentation pages, use the following rules:

* When linking between docs within the same repository:
  * Use either a full repo-rooted path (`/docs/concepts/data_model.md`) or a relative file path (`../guides/utf8.md`) in such a way that the link also works on GitHub.
  * Note: Keep the `.md` extension in the link.
* When linking between docs that live in different source repos:
  * Use absolute Prometheus website URL paths that start with `/docs/...`, omit the `.md` extension, and end the link with a slash, e.g. `/docs/concepts/data_model/` (links without a trailing slash will still work, but will incur an additional redirect).
