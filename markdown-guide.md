# Guide around Markdown features, formatting, and frontmatter fields

This document gives an overview of the Markdown features and formatting options available for the docs in this repository. It also provides information about the frontmatter fields that can be used to customize the behavior and appearance of the documentation pages.

## Markdown features

Generally, we use [GitHub Flavored Markdown](https://github.github.com/gfm/) for formatting and add some custom filters on top:

* Paragraphs that start with `TIP:`, `NOTE:`, `CAUTION:`, or `TODO:` are automatically converted to alert boxes with an appropriate icon and color.
* Code blocks are automatically highlighted using [Shiki](https://shiki.matsu.io/).
* On configuration pages like https://prometheus.io/docs/prometheus/latest/configuration/configuration/, any inline `<code>` element with a text pattern of `<placeholder>` (e.g. `<string>` or `<scrape_config>`) will be identified as a type definition, and references to those placeholders in code boxes will be linked to them.
* Links to images and other pages are normalized in various ways to point to the right locations, show external link icons, etc.

## Heading levels

For blog posts and documentation pages, please use headings in the following ways:

### For documentation pages

* Start the Markdown content with a single top-level heading (`# Heading`, `<h1>`) that reflects the page title (should usually be the same as the `title` frontmatter field).
* Use second-level headings (`## Heading`, `<h2>`) for the main sections of the page and use lower-level headings for subsections as appropriate.

### For blog posts

* **DO NOT use any top-level headings (`# Heading`, `<h1>`) in the Markdown content itself.** The final rendered page will include an automatic H1 heading based on the `title` frontmatter field.
* Use second-level headings (`## Heading`, `<h2>`) for the main sections of the blog post and use lower-level headings for subsections as appropriate.

### Links between pages

When linking *between* documentation pages, use the following rules:

* When linking between docs within the same repository:
  * Use either a full repo-rooted path (`/docs/concepts/data_model.md`) or a relative file path (`../guides/utf8.md`) in such a way that the link also works on GitHub.
  * Note: Keep the `.md` extension in the link.
* When linking between docs that live in different source repos:
  * Use absolute site URL paths that start with `/docs/...`, omit the `.md` extension, but end with a slash, e.g. `/docs/concepts/data_model/`.

## Frontmatter fields

The following frontmatter fields are available:

### For local and remote documentation pages

* `title`: The title of the page. This is displayed as the main heading on the page and as the HTML page title.
* `sort_rank`: The sort order of the page relative to its sibling pages in the same directory. Pages with a lower sort rank will appear first in the navigation menu. Should start at 1 and be incremented by 1 for each page.
* `nav_title` (OPTIONAL): The title to show in the navigation menu. If not set, the `title` field is used. This can be useful for showing a shorter title in the navigation menu, if necessary.
* `hide_in_nav` (OPTIONAL): If set to `true`, the page will not be included in the navigation menu but still be accessible via its URL.
* `nav_icon` (OPTIONAL): The [Tabler](https://tabler.io/icons) icon to be displayed in the navigation menu for this section. This is only used for the top-level section `index.md` Markdown files. Any new icons need to be added to the `iconMap` in [`src/app/docs/layout.tsx`](src/app/docs/layout.tsx).

### For blog posts

* `title`: The title of the blog post. This is displayed as the main heading on the page and as the HTML page title.
* `author_name`: The name of the author of the blog post.
* `created_at`: The date of the blog post in `YYYY-mm-dd` format.
