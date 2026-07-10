export type Announcement = {
  // Markdown text for the banner. Only inline elements are supported
  // (e.g. links, bold, italic). Block elements like headings are ignored.
  text: string;
  // Optional shorter Markdown text shown on mobile instead of `text`.
  mobileText?: string;
  // ISO 8601 date strings (e.g. "2026-03-24"). The banner is only shown
  // when the current date falls within [startDate, endDate] (inclusive).
  startDate?: string;
  endDate?: string;
};

export type KapaConfig = {
  websiteId: string;
  projectName: string;
  projectColor: string;
  projectLogoPath: string;
  mcpServerUrl?: string;
};

export type DocsConfig = {
  siteUrl: string;
  announcement?: Announcement;
  kapa?: KapaConfig;
  localMarkdownSources: LocalMarkdownSource[];
  githubMarkdownSources: GithubMarkdownSource[];
  githubSinglePageSources?: GithubSinglePageSource[];
  ltsVersions: LTSConfig;
  downloads: DownloadConfig;
};

export type GithubMarkdownSource = {
  owner: string;
  repo: string;
  // The directory in the repo where the docs are located.
  repoDocsDir: string;
  // The URL slug prefix to prepend for docs from this repo.
  slugPrefix: string;
  // The minimum number of versions to show for this repo.
  minNumVersions: number;
};

export type LocalMarkdownSource = {
  docsDir: string;
  slugPrefix: string;
};

export type GithubSinglePageSource = {
  owner: string;
  repo: string;
  // The branch to fetch from (e.g. "main").
  branch: string;
  // The path to the file in the repo (e.g. "GOVERNANCE.md").
  filePath: string;
  // The local output path relative to the generated directory
  // where the fetched file will be stored.
  outputPath: string;
};

export type LTSConfig = {
  [repo: string]: string[];
};

export type DownloadConfig = {
  owner: string;
  repos: string[];
};
