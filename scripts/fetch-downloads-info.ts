import { octokit } from "./githubClient";
import { GetResponseDataTypeFromEndpointMethod } from "@octokit/types";
import * as fs from "fs";
import * as path from "path";
import docsConfig from "../docs-config";
import { Downloads, Release, Binary } from "@/downloads-metadata-types";
import { compareFullVersion, filterUnique, majorMinor } from "./utils";

const OUTDIR = "./generated";

const assetChecksums: { [releaseID: string]: { [fileName: string]: string } } =
  {};

type OctokitRelease = GetResponseDataTypeFromEndpointMethod<
  typeof octokit.rest.repos.listReleases
>[number];

const downloads: Downloads = {
  repos: [],
  operatingSystems: [],
  architectures: [],
  releases: [],
};

const getBinaries = (r: OctokitRelease) => {
  const binaries = r.assets
    .filter(
      (a) =>
        (a.name.endsWith(".tar.gz") || a.name.endsWith(".zip")) &&
        !a.name.includes("-web-ui-")
    )
    .map((a): Binary => {
      const baseName = a.name.replace(/(\.tar\.gz|\.zip)$/, "");
      const lastPart = baseName.split(".").slice(-1)[0];
      const [os, arch] = lastPart.split("-");

      return {
        name: a.name,
        checksum: assetChecksums[r.id][a.name],
        os,
        arch,
        url: a.browser_download_url,
        sizeBytes: a.size,
      };
    });

  const grouped = Object.groupBy(binaries, (b) => `${b.os}/${b.arch}`);

  // Within each group, sort by name and then return the last one.
  const sortedBinaries = Object.values(grouped).map((group) => {
    const sorted = group!.sort((a, b) => a.name.localeCompare(b.name));
    return sorted[sorted.length - 1];
  });

  return sortedBinaries;
};

for (const repoName of docsConfig.downloads.repos) {
  console.group(`Fetching downloads info for ${repoName}`);

  // Fetch repo base information.
  console.log(`Fetching repo info for ${repoName}`);
  const repoInfo = await octokit.rest.repos.get({
    owner: docsConfig.downloads.owner,
    repo: repoName,
  });

  // Fetch releases information for the repo.
  console.log(`Fetching releases info for ${repoName}`);
  const releases = (
    await octokit.rest.repos.listReleases({
      owner: docsConfig.downloads.owner,
      repo: repoName,
    })
  ).data;

  releases.sort((a, b) => compareFullVersion(a.tag_name, b.tag_name)).reverse();

  // Select the relevant stable, pre-release, and LTS versions to show.
  const preReleases: string[] = [];
  const stableReleases: string[] = [];
  const shownReleases: OctokitRelease[] = [];

  for (const r of releases) {
    if (r.draft) {
      // A read-only token shouldn't be able to see draft releases in the
      // first place, but let's make sure.
      continue;
    }

    const version = majorMinor(r.tag_name);

    if (r.prerelease) {
      if (!preReleases.includes(version) && stableReleases.length === 0) {
        shownReleases.push(r);
        preReleases.push(version);
      }
    } else if (
      docsConfig.ltsVersions[repoName]?.includes(version) &&
      !stableReleases.includes(version)
    ) {
      shownReleases.push(r);
      stableReleases.push(version);
    } else if (stableReleases.length === 0) {
      shownReleases.push(r);
      stableReleases.push(version);
    }
  }

  for (const r of shownReleases) {
    // Fetch and store checksums for each release.
    const checksumsFile = r.assets.find((a) => a.name === "sha256sums.txt");
    if (!checksumsFile) {
      console.warn(
        `No sha256sums.txt asset found for release ${r.tag_name} in ${repoName}`
      );
      continue;
    }
    const downloadURL = checksumsFile.browser_download_url;
    assetChecksums[r.id] = {};

    const response = await fetch(downloadURL);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch checksums for release ${r.tag_name} in ${repoName}: ${response.statusText}`
      );
    }

    const checksums = await response.text();
    for (const line of checksums.split("\n")) {
      const [checksum, fileName] = line.split(/\s+/);
      if (fileName) {
        assetChecksums[r.id][fileName] = checksum;
      }
    }
  }

  downloads.repos.push({
    name: repoInfo.data.name,
    fullName: repoInfo.data.full_name,
    description: repoInfo.data.description || "",
    url: repoInfo.data.html_url,
    releases: shownReleases.map(
      (r): Release => ({
        id: r.id,
        name: r.name || "",
        url: r.html_url,
        prerelease: r.prerelease,
        ltsRelease: docsConfig.ltsVersions[repoName]?.includes(
          majorMinor(r.tag_name)
        ),
        majorMinor: majorMinor(r.tag_name),
        binaries: getBinaries(r),
      })
    ),
  });

  console.groupEnd();
}

downloads.operatingSystems = downloads.repos
  .flatMap((repo) =>
    repo.releases
      .flatMap((release) => release.binaries)
      .flatMap((binary) => binary.os)
  )
  .filter(filterUnique)
  .sort();

downloads.architectures = downloads.repos
  .flatMap((repo) =>
    repo.releases
      .flatMap((release) => release.binaries)
      .flatMap((binary) => binary.arch)
  )
  .filter(filterUnique)
  .sort();

console.log(`Writing downloads metadata to ${OUTDIR}/downloads-metadata.json`);
fs.writeFileSync(
  path.join(OUTDIR, "downloads-metadata.json"),
  JSON.stringify(downloads, null, 2)
);
