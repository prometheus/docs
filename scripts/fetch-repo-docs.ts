import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import docsConfig from "../docs-config";
import { GithubMarkdownSource } from "../src/docs-config-types";
import {
  DocsCollection,
  AllRepoVersions,
  DocMetadata,
} from "@/docs-collection-types";
import matter from "gray-matter";
import { octokit } from "./githubClient";
import { compareFullVersion, filterUnique, majorMinor } from "./utils";

const OUTDIR = "./generated";

const docsCollection: DocsCollection = {};
const allRepoVersions: AllRepoVersions = {};

// Find all files (.md and others) recursively in a directory.
const findFiles = (dir: string): string[] => {
  let results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findFiles(fullPath));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }

  return results;
};

const syncRepo = (owner: string, repo: string, repoDir: string) => {
  console.log(`Syncing ${repo} repo to ${repoDir}...`);
  if (!fs.existsSync(repoDir)) {
    execSync(
      `git clone --bare --filter=blob:none https://github.com/${owner}/${repo}.git ${repoDir}`
    );
    execSync(`git -C ${repoDir} config core.sparseCheckout true`);
  } else {
    execSync(`git -C ${repoDir} fetch --prune --quiet`);
  }
};

const checkoutVersionDocs = (
  owner: string,
  repo: string,
  repoDir: string,
  version: string,
  workingTreeBase: string,
  repoDocsDir: string
) => {
  const workingTree = path.resolve(
    `${workingTreeBase}/${owner}/${repo}/${version}`
  );
  const checkoutConfig = `${repoDir}/worktrees/${version}/info/sparse-checkout`;
  const branch = `release-${version}`;

  console.log(
    `Checking out ${branch} of ${owner}/${repo} from ${repoDir} into ${workingTree}...`
  );

  if (!fs.existsSync(checkoutConfig) || !fs.existsSync(workingTree)) {
    console.log("Creating new worktree...");
    // Just a safety check before running rm -rf.
    // TODO: Maybe remove this.
    if (workingTree.length > 1) {
      execSync(`rm -rf ${workingTree}`);
    }
    execSync(
      `cd ${repoDir} && git worktree prune && git worktree add --no-checkout ${workingTree} ${branch}`
    );
    if (!fs.existsSync(path.dirname(checkoutConfig))) {
      fs.mkdirSync(path.dirname(checkoutConfig), { recursive: true });
    }
    fs.writeFileSync(checkoutConfig, `/${repoDocsDir}\n`);
  } else {
    console.log("Worktree already exists...");
  }

  execSync(`git -C ${workingTree} reset --hard --quiet`);
  execSync(`git -C ${workingTree} clean --force`);
};

const fetchRepoDocs = async ({
  owner,
  repo,
  repoDocsDir,
  minNumVersions,
  slugPrefix,
}: GithubMarkdownSource) => {
  console.log(`Fetching releases and repo docs for ${owner}/${repo}...`);

  // Clone a bare repo with sparse checkout so we can get the docs at specific
  // versions from it later on.
  const repoCheckoutDir = `${OUTDIR}/repos/${owner}/${repo}.git`;
  syncRepo(owner, repo, repoCheckoutDir);

  // List all GitHub releases for the repo.
  const iterator = octokit.paginate.iterator(octokit.rest.repos.listReleases, {
    owner,
    repo,
    per_page: 100,
  });

  const allReleaseTags: string[] = [];

  for await (const { data: releases } of iterator) {
    allReleaseTags.push(...releases.map((r) => r.tag_name));
    // For the Prometheus repo for efficieny-reasons, stop once we have found at least
    // one release starting with "v1.".
    // Note: releases are sorted by date, so this works ok.
    // TODO: Do we even still want to show the latest v1 release?
    if (
      owner === "prometheus" &&
      repo === "prometheus" &&
      releases.find((release) => release.tag_name.startsWith("v1."))
    ) {
      break;
    }
  }
  // We still need to sort the releases by version number, as e.g. "2.53.4"
  // was released after "3.2.1"..
  allReleaseTags.sort(compareFullVersion).reverse();

  // Get all <major>.<minor> versions, regardless of the patch version.
  const allVersions = allReleaseTags
    .filter((tag) => tag.startsWith("v")) // Ignore prehistoric release tags like "0.1.0"
    .map((tag) => majorMinor(tag))
    .filter(filterUnique); // Remove dupes (e.g. "3.4.0" and "3.4.1" both become "3.4")

  // First, get the last 10 versions, regardless of the major version.
  const recentVersions = allVersions.slice(0, minNumVersions);

  // Then, ensure we include at least one release for each major version.
  const groupedByMajor = Object.groupBy(
    allVersions,
    (version) => version.split(".")[0]
  );
  for (const major in groupedByMajor) {
    const latestInMajor = groupedByMajor[major]![0];
    if (!recentVersions.includes(latestInMajor)) {
      recentVersions.push(latestInMajor);
    }
  }

  const latestTag = allReleaseTags.find((tag) => !tag.includes("-"));
  if (!latestTag) {
    throw new Error(`No latest version found for ${owner}/${repo}.`);
  }
  const latestVersion = majorMinor(latestTag);

  // Store metadata about the repo and its versions.
  if (!allRepoVersions[owner]) {
    allRepoVersions[owner] = {};
  }
  allRepoVersions[owner][repo] = {
    versions: recentVersions,
    latestVersion,
    ltsVersions: (owner === "prometheus" && docsConfig.ltsVersions[repo]) || [],
  };

  console.log(
    `Found ${allReleaseTags.length} releases, ${allVersions.length} major/minor versions, ${recentVersions.length} recent versions, and the latest version ${latestVersion} for ${owner}/${repo}.`
  );

  // For each recent version, check out the corresponding commit and
  // produce a directory containing its docs, then add it to the metadata.
  for (const version of recentVersions) {
    checkoutVersionDocs(
      owner,
      repo,
      repoCheckoutDir,
      version,
      `${OUTDIR}/repo-docs`,
      repoDocsDir
    );
    const docsDir = `${OUTDIR}/repo-docs/${owner}/${repo}/${version}/${repoDocsDir}`;

    // Store metadata about Markdown page files, copy non-Markdown
    // assets to the docs assets directory.
    const assetsRoot = `/repo-docs-assets/${owner}/${repo}/${version}`;
    for (const file of findFiles(docsDir)) {
      const filePath = path.relative(docsDir, file);

      if (
        owner === "prometheus" &&
        ["prometheus", "alertmanager"].includes(repo) &&
        filePath === "index.md"
      ) {
        // Skip the index.md file in the external repo, as it is not a real or conformant page.
        console.log("Skipping Prometheus index.md file:", filePath);
        continue;
      }

      if (file.endsWith(".md")) {
        console.log("Found Markdown file:", filePath);

        const {
          data: {
            title,
            nav_title: navTitle,
            sort_rank: sortRank,
            hide_in_nav: hideInNav,
          },
        } = matter(fs.readFileSync(file, "utf-8"));

        if (!title) {
          throw new Error(`Missing title in ${file}`);
        }
        if (!sortRank) {
          // Docs in https://github.com/prometheus/prometheus/tree/main/docs/command-line
          // are currently missing sort_rank 😤
          if (!filePath.includes("command-line")) {
            throw new Error(`Missing sort_rank in ${file}`);
          }
        }

        const slug = path.join(
          slugPrefix,
          version,
          filePath.replace(/(\/index)*\.md$/, "")
        );
        const newDoc: DocMetadata = {
          type: "repo-doc",
          slug,
          filePath: file,
          owner,
          repo,
          version,
          slugPrefix,
          latestVersion,
          versionRoot: path.join(slugPrefix, version),
          assetsRoot,
          title,
          navTitle,
          sortRank: sortRank ?? 0,
          hideInNav,
          children: [],
        };

        docsCollection[slug] = newDoc;

        if (version === latestVersion) {
          const latestSlug = path.join(
            slugPrefix,
            "latest",
            filePath.replace(/(\/index)*\.md$/, "")
          );
          // Also add the latest version to the collection with
          // "latest" as the version in the slug.
          docsCollection[latestSlug] = { ...newDoc, slug: latestSlug };
        }
      } else {
        console.log("Found non-Markdown asset file:", filePath);
        const destDir = `${OUTDIR}/${assetsRoot}/${path.dirname(filePath)}`;
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(file, `${destDir}/${path.basename(filePath)}`);
      }
    }
  }
};

for (const sourceConfig of docsConfig.githubMarkdownSources) {
  await fetchRepoDocs(sourceConfig);
}

for (const sourceConfig of docsConfig.localMarkdownSources) {
  const { docsDir, slugPrefix } = sourceConfig;
  console.log(`Integrating local docs from ${docsDir}...`);
  for (const file of findFiles(docsDir)) {
    if (!file.endsWith(".md")) {
      throw new Error(
        `Found non-Markdown file ${file} in local docs dir, please put assets into public/.`
      );
    }

    const filePath = path.relative(docsDir, file);
    const {
      data: {
        title,
        nav_title: navTitle,
        sort_rank: sortRank,
        nav_icon: navIcon,
        hide_in_nav: hideInNav,
      },
    } = matter(fs.readFileSync(file, "utf-8"));
    if (!title) {
      throw new Error(`Missing title in ${file}`);
    }
    if (!sortRank) {
      // A number of guides in https://github.com/prometheus/docs/tree/main/content/docs/guides
      // are currently missing sort_rank 😤
      if (!filePath.includes("guides")) {
        throw new Error(`Missing sort_rank in ${file}`);
      }
    }

    if (file.endsWith(".md")) {
      console.log("Found Markdown file:", filePath);
      const slug = path.join(
        slugPrefix,
        filePath.replace(/(\/index)*\.md$/, "")
      );
      docsCollection[slug] = {
        type: "local-doc",
        slug,
        filePath: file,
        title,
        navTitle,
        sortRank: sortRank ?? 0,
        navIcon,
        hideInNav,
        children: [],
      };
    }

    // Don't need to care about assets for local docs here, local doc authors
    // should store them in public/ and link to them there.
  }
}

// Write out the docs collection metadata object to a JSON file.
const docsCollectionFile = `${OUTDIR}/docs-collection.json`;
const allRepoVersionsFile = `${OUTDIR}/repo-versions.json`;
fs.writeFileSync(docsCollectionFile, JSON.stringify(docsCollection, null, 2));
fs.writeFileSync(allRepoVersionsFile, JSON.stringify(allRepoVersions, null, 2));
