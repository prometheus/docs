export type DocsConfig = {
  localMarkdownSources: LocalMarkdownSource[];
  githubMarkdownSources: GithubMarkdownSource[];
  ltsVersions: LTSConfig;
  downloads: DownloadConfig;
};

export type GithubMarkdownSource = {
  owner: string;
  repo: string;
  repoDocsDir: string;
  slugPrefix: string;
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
