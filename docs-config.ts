import { DocsConfig } from "./src/docs-config-types";

export default {
  siteUrl: "https://prometheus.io",

  announcement: {
    text: "Take the [Prometheus User Survey (Edition 03.2026)](https://forms.gle/uuEsawKm7u9wCT4T8) and help the community prioritize future development!",
    mobileText:
      "[Prometheus User Survey (Edition 03.2026)](https://forms.gle/uuEsawKm7u9wCT4T8)",
    startDate: "2026-03-24",
    endDate: "2026-04-07",
  },

  kapa: {
    websiteId: "80cbacc9-0b84-48aa-bfb8-0002270176bf",
    projectName: "Prometheus",
    projectColor: "#D86444",
    projectLogoPath: "/assets/prometheus-logo.svg",
  },

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
