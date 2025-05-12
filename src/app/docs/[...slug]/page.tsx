import { MarkdownAsync } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import fs from "fs/promises";
// import { CodeHighlight } from "@mantine/code-highlight";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeConfigLinker from "@/rehypeConfigLinker";
import rehypeShiki from "@shikijs/rehype";
import { IconLink } from "@tabler/icons-react";
import { docsCollection } from "@/docs-collection";
import {
  em,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Title,
  TitleProps,
} from "@mantine/core";

const SITE_URL = "https://prometheus.io";

function isAbsoluteUrl(url: string) {
  try {
    new URL(url); // will succeed for absolute URLs
    return true;
  } catch {
    return false;
  }
}

// Next.js uses this function at build time to figure out which
// docs pages it should statically generate.
export async function generateStaticParams() {
  const params = Object.keys(docsCollection).map((slug: string) => ({
    slug: slug.split("/"),
  }));
  return params;
}

const h = (order: 1 | 2 | 3 | 4 | 5 | 6) => {
  const HeadingComponent = (props: TitleProps) => (
    <Title order={order} id={props.id}>
      {props.children}
    </Title>
  );
  HeadingComponent.displayName = `Heading${order}`;
  return HeadingComponent;
};

export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const slug = (await params).slug;
  console.log("Building docs page", slug.join("/"));

  const docMeta = docsCollection[slug.join("/")];
  // TODO: Use the content from the meta json.
  const markdown = await fs.readFile(docMeta.filePath, "utf-8");

  return (
    <MarkdownAsync
      remarkPlugins={[remarkFrontmatter, remarkGfm]}
      rehypePlugins={[
        rehypeSlug,
        () =>
          rehypeAutolinkHeadings({
            properties: {
              className: ["header-auto-link"],
            },
            behavior: "prepend",
            // Don't link top-level page headings (h1).
            test: (el) => el.tagName !== "h1",
          }),
        [
          rehypeShiki,
          {
            // or `theme` for a single theme
            themes: {
              light: "github-light",
              dark: "vitesse-dark",
            },
          },
        ],

        // Important: this has to run after rehypeSlug, since it
        // relies on the headers to already have IDs.
        rehypeConfigLinker,
      ]}
      components={{
        a: (props) => {
          // Replace header auto-links with a custom link icon.
          const { children, node: _node, ...rest } = props;
          if (rest.className === "header-auto-link") {
            return (
              <a {...rest}>
                <IconLink size={em(14)} />
              </a>
            );
          }

          // For local docs, keep links as is.
          const href = props.href;
          if (!href || docMeta.type === "local-doc") {
            return <a {...rest}>{children}</a>;
          }

          // For external docs, do some postprocessing on the hrefs to make
          // sure they point to the right place.
          let normalizedHref = href;
          if (href.startsWith(SITE_URL)) {
            // Remove the "https://prometheus.io" from links that start with it.
            normalizedHref = href.slice(SITE_URL.length);
          } else if (href.startsWith("/")) {
            // Turn "/<path>" into e.g. "https://github.com/prometheus/prometheus/blob/release-3.3.0/<path>"
            normalizedHref = `https://github.com/prometheus/prometheus/blob/release-${docMeta.version}${href}`;
          } else if (href.includes(".md") && !isAbsoluteUrl(href)) {
            // Turn "foo/bar/baz.md" into "foo/bar/baz" for relative links between Markdown pages.
            normalizedHref = `${href.replace(/\.md($|#)/, "$1")}`;
          }

          return (
            <a {...rest} href={normalizedHref}>
              {children}
            </a>
          );
        },
        img: (props) => {
          const { src, node: _node, ...rest } = props;
          if (
            !src ||
            typeof src !== "string" ||
            isAbsoluteUrl(src) ||
            docMeta.type === "local-doc"
          ) {
            // eslint-disable-next-line jsx-a11y/alt-text
            return <img {...rest} src={src} />;
          }

          // eslint-disable-next-line jsx-a11y/alt-text
          return <img {...rest} src={`${docMeta.assetsRoot}/${src}`} />;
        },
        pre: (props) => {
          const firstChild = props.node?.children[0];
          if (
            !firstChild ||
            firstChild?.type !== "element" ||
            firstChild?.tagName !== "code"
          ) {
            return <pre>{props.children}</pre>;
          }

          return (
            <pre
              style={{
                fontSize: 14,
                backgroundColor:
                  "light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))",
                lineHeight: 1.7,
                display: "block",
                padding: "1em",
                borderRadius: "0.5em",
                overflow: "auto",
              }}
            >
              {props.children}
            </pre>
          );
        },
        h1: h(1),
        h2: h(2),
        h3: h(3),
        h4: h(4),
        h5: h(5),
        h6: h(6),
        table: (props) => (
          <Table withColumnBorders withTableBorder highlightOnHover>
            {props.children}
          </Table>
        ),
        th: TableTh,
        td: TableTd,
        tr: TableTr,
        thead: TableThead,
        tbody: TableTbody,
        // For <pre> tags that contain <code> tags, we need to extract the content
        // of the <code> tag and pass it to a <CodeHighlight> Mantine component. If it's
        // a <pre> tag that doesn't contain a <code> tag, we just render it as is.
        // pre: (props) => {
        //   const firstChild = props.node?.children[0];
        //   if (
        //     firstChild?.type === "element" &&
        //     firstChild?.tagName === "code"
        //   ) {
        //     const contentElement = firstChild.children[0];
        //     if (contentElement.type !== "text") {
        //       throw new Error("Code content is not text");
        //     }
        //     const content = contentElement.value;
        //     const language = firstChild.properties?.className?.[0]?.replace(
        //       "language-",
        //       ""
        //     );

        //     return (
        //       <CodeHighlight code={content} language={language || "yaml"} />
        //     );
        //   } else {
        //     return <pre {...props} />;
        //   }
        // },
      }}
    >
      {markdown}
    </MarkdownAsync>
  );
}
