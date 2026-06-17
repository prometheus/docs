// Types for the machine-readable download.json served at the site root.
// The per-release shape intentionally mirrors Go's
// https://go.dev/dl/?mode=json (version.json) so that tooling can consume it
// in a familiar way, with Prometheus-specific "latest" and "lts" flags added.
// The top level is keyed by repository name, exposing every repository shown
// on the downloads page.

export type DownloadJSON = {
  [repo: string]: DownloadRelease[];
};

export type DownloadRelease = {
  version: string;
  // stable is true for non-prerelease versions.
  stable: boolean;
  // latest is true for the most recent stable release of the repository.
  latest: boolean;
  // lts is true for long-term support releases.
  lts: boolean;
  files: DownloadFile[];
};

export type DownloadFile = {
  url: string;
  os: string;
  arch: string;
  version: string;
  sha256: string;
  size: number;
  kind: string;
};
