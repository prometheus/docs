import { DocsConfig } from "./src/docs-config-types";

export default {
  siteUrl: "https://prometheus.io",

  announcement: {
    text: "Join [PromCon EU 2026](https://promcon.io/2026-munich/), the Prometheus users conference, on October 7–8, 2026 in Munich. The [Call for Speakers](https://sessionize.com/promcon-eu-2026/) is open until July 19, 2026.",
    mobileText: "[PromCon EU 2026](https://promcon.io/2026-munich/) — Oct 7–8, Munich. [CFP](https://sessionize.com/promcon-eu-2026/) open until July 19.",
    startDate: "2026-07-17",
    endDate: "2026-10-08",
  },

  kapa: {
    websiteId: "3a0017cf-dd4b-4884-96fb-1bbe1b621d1e",
    projectName: "Prometheus",
    projectColor: "#D86444",
    projectLogoPath: "/assets/prometheus-logo.svg",
    mcpServerUrl: "https://prometheus.mcp.kapa.ai",
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

  // Single pages to fetch from external repos (not versioned).
  githubSinglePageSources: [
    {
      owner: "prometheus",
      repo: "governance",
      branch: "main",
      filePath: "GOVERNANCE.md",
      outputPath: "governance/GOVERNANCE.md",
    },
  ],

  // Long-term support versions configuration.
  ltsVersions: {
    prometheus: ["3.5", "3.13"],
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
