import docsCollectionJson from "../generated/docs-collection.json";
import allRepoVersionsJson from "../generated/repo-versions.json";
import { DocsCollection, AllRepoVersions } from "./docs-collection-types";

export const docsCollection = docsCollectionJson as DocsCollection;
export const allRepoVersions = allRepoVersionsJson as AllRepoVersions;
