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
    (docMeta.version === docMeta.latestVersion &&
      !docMeta.slug.startsWith(docMeta.versionRoot));

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
            if (href.startsWith(docsConfig.siteUrl)) {
              // Remove the "https://prometheus.io" from links that start with it.
              return href.slice(docsConfig.siteUrl.length);
            } else if (href.startsWith("/") && docMeta.type === "repo-doc") {
              // Turn "/<path>" into e.g. "https://github.com/prometheus/prometheus/blob/release-3.3/<path>"
              return `https://github.com/${docMeta.owner}/${docMeta.repo}/blob/release-${docMeta.version}${href}`;
            } else if (href.includes(".md") && !isAbsoluteUrl(href)) {
              // Turn relative links like "d.md" in "docs/a/b/c.md" into full paths like "/docs/a/b/d/".
              return resolveRelativeUrl(`/docs/${docMeta.slug}`, href);
            }
            return href;
          }}
          normalizeImgSrc={(src: string | Blob | undefined) => {
            // Leave anything alone that doesn't look like a normal relative URL.
            if (
              src &&
              typeof src === "string" &&
              !isAbsoluteUrl(src) &&
              docMeta.type === "repo-doc"
            ) {
              return `${docMeta.assetsRoot}/${src}`;
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
