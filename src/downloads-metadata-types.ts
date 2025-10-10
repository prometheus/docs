export type Downloads = {
  repos: Repo[];
  operatingSystems: string[];
  architectures: string[];
  releases: Release[];
};

export type Repo = {
  name: string;
  fullName: string;
  description: string;
  url: string;
  releases: Release[];
};

export type Release = {
  id: number;
  name: string;
  url: string;
  prerelease: boolean;
  ltsRelease: boolean;
  majorMinor: string;
  binaries: Binary[];
};

export type Binary = {
  name: string;
  checksum: string;
  os: string;
  arch: string;
  url: string;
  sizeBytes: number;
};
