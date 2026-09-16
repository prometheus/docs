import fs from "fs/promises";
import { docsCollection } from "@/docs-collection";
import PromMarkdown, { isAbsoluteUrl } from "@/components/PromMarkdown";
import docsConfig from "../../../../docs-config";
import { getPageMetadata } from "@/page-metadata";
import VersionWarning from "./VersionWarning";
import { Divider, Title } from "@mantine/core";
import PrevNextEditButtons from "./PrevNextEditButtons";
import path from "path";
import { DocMetadata } from "@/docs-collection-types";
import { compareMajorMinor } from "../../../../scripts/utils";
import {
  canonicalizeDocPath,
  githubDocRoutes,
  localDocRoutes,
  materializeRoute,
} from "../../../../docs-routes";

// Next.js uses this function at build time to figure out which
// docs pages it should statically generate.
export async function generateStaticParams() {
  const params = Object.keys(docsCollection).map((slug: string) => ({
    slug: slug.split("/").concat(""),
  }));
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const slugArray = (await params).slug;
  const slug = slugArray.join("/");

  const docMeta = docsCollection[slug];
  if (!docMeta) {
    throw new Error(`Page not found for slug: ${slug}`);
  }

  return getPageMetadata({
    pageTitle: docMeta.title,
    pageDescription: `Prometheus project documentation for ${docMeta.title}`,
    pagePath: `/docs/${slug}/`,
  });
}

function resolveRelativeUrl(currentPath: string, relativeUrl: string): string {
  const [pathAndQuery, hash = ""] = relativeUrl.split("#");
  const [relativePath, query = ""] = pathAndQuery.split("?");

  const baseDir = currentPath.endsWith("/")
    ? currentPath
    : path.posix.dirname(currentPath) + "/";

  const resolvedPath = path.posix.resolve(
    baseDir,
    relativePath.replace(/\.md$/, "/")
  );

  return resolvedPath + (query ? `?${query}` : "") + (hash ? `#${hash}` : "");
}

function resolveDocSourceUrl(doc: DocMetadata, relativeUrl: string): string {
  const [pathAndQuery, hash = ""] = relativeUrl.split("#");
  const [relativePath, query = ""] = pathAndQuery.split("?");
  const targetSourcePath = path.posix.normalize(
    path.posix.join(path.posix.dirname(doc.sourcePath), relativePath)
  );
  const route =
    doc.type === "local-doc"
      ? localDocRoutes[targetSourcePath.replace(/^docs\//, "")]
      : githubDocRoutes[doc.repo]?.[targetSourcePath];
  const targetSlug =
    route?.redirectTo ??
    (route &&
      materializeRoute(
        route,
        doc.type === "repo-doc" ? doc.routeVersion : undefined
      ));

  if (targetSlug && docsCollection[targetSlug]) {
    return (
      `/docs/${targetSlug}/` +
      (query ? `?${query}` : "") +
      (hash ? `#${hash}` : "")
    );
  }

  if (targetSlug) {
    return `/docs/${targetSlug.split("/")[0]}/`;
  }

  if (doc.type === "repo-doc") {
    const repoPath = path.posix.normalize(
      path.posix.join("docs", path.posix.dirname(doc.sourcePath), relativePath)
    );
    return (
      `https://github.com/${doc.owner}/${doc.repo}/blob/release-${doc.version}/${repoPath}` +
      (query ? `?${query}` : "") +
      (hash ? `#${hash}` : "")
    );
  }

  return resolveRelativeUrl(`/docs/${doc.slug}`, relativeUrl);
}

function pagefindBreadcrumbsTitle(currentPage: DocMetadata) {
  const titles: string[] = [];
  for (let node = currentPage; node; node = node.parent!) {
    titles.unshift(node.navTitle ?? node.title);
  }
  return titles.join(" > ");
}

export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const slugArray = (await params).slug;
  const slug = slugArray.join("/");

  const docMeta = docsCollection[slug];
  if (!docMeta) {
    throw new Error(`Page not found for slug: ${slug}`);
  }

  const markdown = await fs.readFile(docMeta.filePath, "utf-8");

  const pagefindShouldIndex =
    docMeta.type === "local-doc" ||
    docMeta.routeVersion === "latest";

  // The Markdown format was changed in Prometheus >3.4 and Alertmanager >0.28
  // to not include the H1 title in the Markdown content itself, so we need to
  // externally render the title using the frontmatter `title` field instead..
  const useFrontmatterTitle =
    docMeta.type === "local-doc" ||
    (docMeta.type === "repo-doc" &&
      docMeta.owner === "prometheus" &&
      ((docMeta.repo === "prometheus" &&
        compareMajorMinor(docMeta.version, "3.4") === 1) ||
        (docMeta.repo === "alertmanager" &&
          compareMajorMinor(docMeta.version, "0.28") === 1)));

  return (
    <>
      <VersionWarning currentPage={docMeta} />
      <div
        {...{
          "data-pagefind-body": pagefindShouldIndex ? "true" : undefined,
          "data-pagefind-meta": `breadcrumbs:${pagefindBreadcrumbsTitle(
            docMeta
          )}`,
        }}
      >
        {useFrontmatterTitle && <Title order={1}>{docMeta.title}</Title>}
        <PromMarkdown
          normalizeHref={(href: string | undefined) => {
            if (!href) {
              return href;
            }

            // Do some postprocessing on the hrefs to make sure they point to the right place.
            const siteRelativeHref = href.startsWith(docsConfig.siteUrl)
              ? href.slice(docsConfig.siteUrl.length)
              : href;
            if (siteRelativeHref.startsWith("/docs/")) {
              return canonicalizeDocPath(siteRelativeHref);
            } else if (
              siteRelativeHref.startsWith("/") &&
              docMeta.type === "repo-doc"
            ) {
              // Turn "/<path>" into e.g. "https://github.com/prometheus/prometheus/blob/release-3.3/<path>"
              return `https://github.com/${docMeta.owner}/${docMeta.repo}/blob/release-${docMeta.version}${siteRelativeHref}`;
            } else if (
              siteRelativeHref.includes(".md") &&
              !isAbsoluteUrl(siteRelativeHref)
            ) {
              // Turn relative links like "d.md" in "docs/a/b/c.md" into full paths like "/docs/a/b/d/".
              return resolveDocSourceUrl(docMeta, siteRelativeHref);
            }
            return siteRelativeHref;
          }}
          normalizeImgSrc={(src: string | Blob | undefined) => {
            // Leave anything alone that doesn't look like a normal relative URL.
            if (
              src &&
              typeof src === "string" &&
              !isAbsoluteUrl(src) &&
              docMeta.type === "repo-doc"
            ) {
              return `${docMeta.assetsRoot}/${path.posix.normalize(
                path.posix.join(path.posix.dirname(docMeta.sourcePath), src)
              )}`;
            }

            return src;
          }}
        >
          {markdown}
        </PromMarkdown>
      </div>
      <Divider my="xl" />
      <PrevNextEditButtons currentPage={docMeta} />
    </>
  );
}
