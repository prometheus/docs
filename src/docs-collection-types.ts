export type LocalDocMetadata = {
  type: "local-doc";
  filePath: string;
  content: string;

  // Frontmatter fields - maybe put them in a separate type?
  title: string;
  navIcon?: string;
  sortRank: number;
  hideInNav?: boolean;
};

// TODO: Rename "repo-doc" (and variants) to "external-doc" everywhere.
export type RepoDocMetadata = {
  type: "repo-doc";
  filePath: string;
  content: string;

  owner: string;
  repo: string;
  version: string;
  slugPrefix: string; // Shared for the whole repo, could be factored out.
  latestVersion: string; // Shared for the whole repo, could be factored out.
  versionRoot: string; // Shared for the whole repo, could be factored out.
  assetsRoot: string; // Shared for the whole repo, could be factored out.

  // Frontmatter fields - maybe put them in a separate type?
  title: string;
  navTitle?: string;
  sortRank: number;
};

export type DocsCollection = {
  [slug: string]: LocalDocMetadata | RepoDocMetadata;
};

export type RepoVersions = {
  versions: string[];
  latestVersion: string;
  ltsVersions: string[];
};

export type AllRepoVersions = {
  [owner: string]: {
    [repo: string]: RepoVersions;
  };
};
