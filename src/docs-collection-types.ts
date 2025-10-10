export type LocalDocMetadata = {
  type: "local-doc";
};

// TODO: Rename "repo-doc" (and variants) to "external-doc" everywhere.
export type RepoDocMetadata = {
  type: "repo-doc";

  // These fields are shared for the whole repo, could be factored out.
  owner: string;
  repo: string;
  version: string;
  slugPrefix: string;
  latestVersion: string;
  versionRoot: string;
  assetsRoot: string;
};

export type DocMetadata = (LocalDocMetadata | RepoDocMetadata) & {
  slug: string;
  filePath: string;
  title: string;
  navIcon?: string;
  navTitle?: string;
  sortRank: number;
  hideInNav?: boolean;

  // These fields are only populated during "npm run dev" / "npm run build"
  // in docs-collection.ts, as they require run-time object references to the other
  // docs in the collection.
  parent?: DocMetadata;
  children: DocMetadata[];
  prev?: DocMetadata;
  next?: DocMetadata;
};

export type DocsCollection = {
  // "slug" is the path without the leading "/docs/" prefix, so e.g. "introduction/overview"
  // or "prometheus/latest/getting_started".
  [slug: string]: DocMetadata;
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
