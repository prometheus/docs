import fs from "fs/promises";
// import { CodeHighlight } from "@mantine/code-highlight";
import { docsCollection } from "@/docs-collection";
import PromMarkdown, { isAbsoluteUrl } from "@/components/PromMarkdown";
import docsConfig from "../../../../docs-config";
import { getPageMetadata } from "@/page-metadata";

// Next.js uses this function at build time to figure out which
// docs pages it should statically generate.
export async function generateStaticParams() {
  const params = Object.keys(docsCollection).map((slug: string) => ({
    slug: slug.split("/"),
  }));
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const slug = (await params).slug;
  const docMeta = docsCollection[slug.join("/")];

  return getPageMetadata({
    pageTitle: docMeta.title,
    pageDescription: `Prometheus project documentation for ${docMeta.title}`,
    pagePath: `/docs/${slug.join("/")}`,
  });
}

export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const slug = (await params).slug;

  const docMeta = docsCollection[slug.join("/")];
  const markdown = await fs.readFile(docMeta.filePath, "utf-8");

  return (
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
          // Turn "foo/bar/baz.md" into "foo/bar/baz" for relative links between Markdown pages.
          return `${href.replace(/\.md($|#)/, "$1")}`;
        }

        return href;
      }}
      normalizeImgSrc={(src: string | Blob | undefined) => {
        // Leave anything alone that doesn't look like a normal relative URL.
        if (!src || typeof src !== "string" || isAbsoluteUrl(src)) {
          return src;
        }

        switch (docMeta.type) {
          case "local-doc":
            // TODO: Fix this in the old Markdown files instead?
            return src.replace(/^\/assets\//, "/assets/docs/");
          case "repo-doc":
            return `${docMeta.assetsRoot}/${src}`;
          default:
            throw new Error(`Unknown doc type`);
        }
      }}
    >
      {markdown}
    </PromMarkdown>
  );
}
