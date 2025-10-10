import { DocsConfig } from "./src/docs-config-types";

export default {
  siteUrl: "https://prometheus.io",

  // Docs to load from repo-local files.
  localMarkdownSources: [
    {
      docsDir: "docs",
      slugPrefix: "",
    },
  ],

  // Sources for docs to load from external repos (Prometheus, Alertmanager).
  githubMarkdownSources: [
    {
      owner: "prometheus",
      repo: "prometheus",
      repoDocsDir: "docs",
      slugPrefix: "prometheus",
      minNumVersions: 10,
    },
    {
      owner: "prometheus",
      repo: "alertmanager",
      repoDocsDir: "docs",
      slugPrefix: "alerting",
      minNumVersions: 8,
    },
  ],

  // Long-term support versions configuration.
  ltsVersions: {
    prometheus: ["3.5"],
  },

  // Repositories for the downloads page. The order in this file is the
  // order in which the repos are displayed on the downloads page.
  downloads: {
    owner: "prometheus",
    repos: [
      "prometheus",
      "alertmanager",
      "blackbox_exporter",
      "consul_exporter",
      "graphite_exporter",
      "memcached_exporter",
      "mysqld_exporter",
      "node_exporter",
      "promlens",
      "pushgateway",
      "statsd_exporter",
    ],
  },
} satisfies DocsConfig;
