export type DocsConfig = {
  siteUrl: string;
  localMarkdownSources: LocalMarkdownSource[];
  githubMarkdownSources: GithubMarkdownSource[];
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

export type LTSConfig = {
  [repo: string]: string[];
};

export type DownloadConfig = {
  owner: string;
  repos: string[];
};
