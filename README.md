# Prometheus landing page and documentation website

This repository contains both the content and the static-site generator code for the Prometheus documentation site and associated landing pages.

This is a [Next.js](https://nextjs.org)-based website with some custom code to integrate documentation from other repositories and fetch information about available Prometheus component downloads from GitHub.

## Contributing Changes

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for general instructions for new Prometheus contributors.

The documentation hosted on this website is pulled together from multiple repositories:

* The main documentation contents are located in the [`docs`](docs) directory of this repository.
* Documentation concerning the Prometheus server is [maintained in the Prometheus server repository](https://github.com/prometheus/prometheus/tree/main/docs) and cloned into the website at build time.
* Documentation concerning the Alertmanager server is [maintained in the Alertmanager server repository](https://github.com/prometheus/alertmanager/tree/main/docs) and cloned into the website at build time.

As a guideline, please keep the documentation generally applicable and avoid use-case-specific changes.

For guidelines around Markdown formatting and available frontmatter fields and features, please see the [Markdown guide](markdown-guide.md).

## Building and running the website

### Prerequisites

You'll need to have the following installed on your system:

* [Node.js](https://nodejs.org/en/download/)
* [NPM](https://www.npmjs.com/get-npm)

### Environment variables

To bypass anonymous user rate limits while downloading documentation from the other repositories, as well as fetching information about available downloads from the GitHub API, the pre-build scripts require a GitHub access token with read access to the repositories (no write access is required). You can create a personal access token in your GitHub account settings (https://github.com/settings/tokens/new).

Create a `.env` file in the root of the repository and add the following environment variable:

```env
GITHUB_TOKEN=<your_github_token>
```

### Installing npm dependencies

To install all required [npm](https://www.npmjs.com/) package dependencies, run:

```bash
npm install
```

### Building the website

To build the website, run:

```bash
npm run build-all
```

This cleans any previous build artifacts, fetches the latest documentation from the Prometheus and Alertmanager repositories, fetches information about available downloads (for the Download page), builds the website, and then indexes it (for the built-in [Pagefind](https://pagefind.app/)-based search functionality).

The final output is a static website in the `out` directory.

You can also run each of these build steps separately:

* `npm run clean` - Cleans any build output and generated files from previous runs.
* `npm run fetch-repo-docs` - Fetches the latest documentation from the Prometheus and Alertmanager repositories.
* `npm run fetch-downloads-info` - Fetches information about available downloads (for the Download page).
* `npm run build` - Builds the website. When using `npm`, this automatically also runs the `postbuild` script, which generates [Pagefind](https://pagefind.app/) search indexes. If you are using `pnpm`, you will either need to run `npm run postbuild` manually, or set the [`enablePrePostScripts` option](https://pnpm.io/cli/run#pnpm-workspaceyaml-settings) in your `pnpm-workspace.yaml` file.

### Serving the static build output

To serve the static build output, run:

```bash
npx serve out
```

This will start a web server on port 3000. You can access the website at [http://localhost:3000](http://localhost:3000).

### Running the website in development mode

To run the website in development mode, run:

```bash
npm run dev
```

This will start a web server on port 3000. You can access the website at [http://localhost:3000](http://localhost:3000).

The website will automatically reload when you make changes to the source files.

**NOTE:** Site search is not available in development mode, as it requires building a [Pagefind](https://pagefind.app/) index on the static build output and then loading the generated `/pagefind/pagefind.js` file. This only happens when building the app for production via `npm run build` (part of `npm run build-all`).

## Configuration

You can configure some high-level settings for the documentation website in the [`docs-config.ts`](docs-config.ts) file in the root of the repository. This file configures:

* The base URL of the website.
* Which repositories to fetch documentation from.
* Which repositories to fetch download information from.
* Information about LTS (long-term-support) versions.

## Automatic Deployment

This site is automatically deployed using [Netlify](https://www.netlify.com/).

If you have the prerequisite access rights, you can view the Netlify settings here:

* GitHub webhook notifying Netlify of branch changes: https://github.com/prometheus/docs/settings/hooks
* Netlify project: https://app.netlify.com/sites/prometheus-docs

Changes to the `main` branch are deployed to the main site at https://prometheus.io.

Netlify also creates preview deploys for every pull request. To view these for a PR where all checks have passed:

1. In the CI section of the PR, click on "Show all checks".
2. On the "deploy/netlify" entry, click on "Details" to view the preview site for the PR.

You may have to wait a while for the "deploy/netlify" check to appear after creating or updating the PR, even if the other checks have already passed.

## License

Apache License 2.0, see [LICENSE](LICENSE).
