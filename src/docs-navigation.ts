import { DocMetadata } from "./docs-collection-types";

// Local and versioned pages can share a section. Show local pages and only the
// selected release of each repository (or its latest alias on local pages).
export function shownNavChildren(children: DocMetadata[], currentPage: DocMetadata) {
  return children.filter((child) => {
    if (child.hideInNav) {
      return false;
    }
    if (child.type === "local-doc") {
      return true;
    }

    const routeVersion =
      currentPage.type === "repo-doc" &&
      currentPage.owner === child.owner &&
      currentPage.repo === child.repo
        ? currentPage.routeVersion
        : "latest";
    return child.routeVersion === routeVersion;
  });
}
