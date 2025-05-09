import { DocsConfig } from "./src/docs-config-types";

export default {
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
    prometheus: ["2.53"],
  },
} satisfies DocsConfig;
