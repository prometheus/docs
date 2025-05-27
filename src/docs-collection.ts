import docsCollectionJson from "../generated/docs-collection.json";
import allRepoVersionsJson from "../generated/repo-versions.json";
import {
  DocsCollection,
  AllRepoVersions,
  DocMetadata,
} from "./docs-collection-types";

export const docsCollection = docsCollectionJson as DocsCollection;

export const getDocsRoots = () =>
  Object.values(docsCollection)
    .filter((doc) => !doc.parent)
    .sort((a, b) => {
      return a.sortRank - b.sortRank;
    });

// Add parent / child references to the docs collection.
const populateParentChildReferences = (docs: DocsCollection) => {
  // Sort paths by depth (number of slashes).
  const sortedPaths = Object.keys(docs)
    .map((path) => {
      // Remove any final "/index" segments from paths that represent directories.
      return path.replace(/\/index$/, "");
    })
    .sort((a, b) => a.split("/").length - b.split("/").length);

  // For each path, go up the tree by successively removing path segments
  // until we find a parent in the docs collection.
  for (const path of sortedPaths) {
    const doc = docs[path];

    const segments = path.split("/");
    if (segments.length === 1) {
      continue; // Top-level, no parent
    }

    let parentPath = segments.slice(0, -1).join("/");
    let parentNode: DocMetadata | undefined = undefined;

    while (parentPath && !parentNode) {
      parentNode = docs[parentPath];
      if (parentNode) {
        parentNode.children.push(doc);
        doc.parent = parentNode;
        break;
      } else if (parentPath.includes("/")) {
        // Keep removing segments until we find a parent or run out of segments
        parentPath = parentPath.split("/").slice(0, -1).join("/");
      } else {
        // No more segments to remove
        break;
      }
    }
  }

  // Sort the children of each doc by their sortRank. All the other places in
  // the code (nav, etc.) can rely on this sorting, so they don't have to sort anymore.
  for (const doc of Object.values(docs)) {
    doc.children.sort((a, b) => a.sortRank - b.sortRank);
  }
};

// Build the prev / next references for each doc in two steps:
//
// * Build a sorted list of all leaf nodes (= actual documents, not directories)
//   via depth-first traversal of the docs tree, no matter how deep they are in
//   the hierarchy.
// * For each node, find a suitable next/prev node in the sorted leaf nodes by
//   going backwards/forwards in the list from the current node, skipping over
//   any nodes that are not suitable (different version, etc.).
//
// This is complicated by the fact that we have to skip over certain docs when building
// the references:
//
// * Within versioned repo docs, we only want to interlink docs of the same version.
// * When we transition from unversioned local docs to versioned repo docs, we always
//   want to jump to the latest version of the repo docs (and since there are two
//   copies of the latest version, one with "latest" in the slug, the other with
//   "<major>.<minor>" in the slug, we always only want to select the "latest" slug).
// * Any version of a repo doc should link to its surrounding non-versioned
//   local docs (in a one-way fashion only).
const populatePrevNextReferences = (docRoots: DocMetadata[]) => {
  const leafNodes: DocMetadata[] = [];

  function dfs(doc: DocMetadata) {
    if (!doc.children || doc.children.length === 0) {
      leafNodes.push(doc);
    } else {
      for (const child of doc.children) {
        dfs(child);
      }
    }
  }

  for (const root of docRoots) {
    dfs(root);
  }

  // Helper to skip over docs that shouldn't be linked to the current one.
  const shouldSkip = (a: DocMetadata, b: DocMetadata) => {
    // When we're transitioning from unversioned local docs to versioned repo docs,
    // we need to skip over anything that is not the "latest" version of the repo docs.
    if (a.type !== "repo-doc" && b.type === "repo-doc") {
      return !(
        b.version === b.latestVersion && !b.slug.startsWith(b.versionRoot)
      );
    }
    return (
      a.type === "repo-doc" &&
      b.type === "repo-doc" &&
      a.owner === b.owner &&
      a.repo === b.repo &&
      (a.version !== b.version ||
        // a is latest, but b starts with the version root
        (a.version === a.latestVersion && b.slug.startsWith(b.versionRoot)))
    );
  };

  for (let i = 0; i < leafNodes.length; i++) {
    const current = leafNodes[i];

    if (i > 0) {
      let pIdx = i - 1;
      while (pIdx > 0 && shouldSkip(current, leafNodes[pIdx])) {
        pIdx--;
      }
      current.prev = leafNodes[pIdx];
    }

    if (i < leafNodes.length - 1) {
      let nIdx = i + 1;
      while (nIdx < leafNodes.length && shouldSkip(current, leafNodes[nIdx])) {
        nIdx++;
      }
      current.next = leafNodes[nIdx];
    }
  }
};

// Add parent / child references, sort children, and add prev / next references.
let docsPopulated = false;
if (!docsPopulated) {
  docsPopulated = true;
  populateParentChildReferences(docsCollection);
  populatePrevNextReferences(getDocsRoots());
}

export const allRepoVersions = allRepoVersionsJson as AllRepoVersions;
