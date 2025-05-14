import { MarkdownAsync } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import fs from "fs/promises";
// import { CodeHighlight } from "@mantine/code-highlight";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeConfigLinker from "@/rehypeConfigLinker";
import rehypeShiki from "@shikijs/rehype";
import { IconAlertCircle, IconInfoCircle, IconLink } from "@tabler/icons-react";
import { docsCollection } from "@/docs-collection";
import {
  Alert,
  Blockquote,
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
import rehypeRaw from "rehype-raw";
import { Children } from "react";

// TODO: Move to global config.
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const slug = (await params).slug;
  const docMeta = docsCollection[slug.join("/")];
  return {
    title: `${docMeta.title} | Prometheus`,
    // description: docMeta.description,
    openGraph: {
      title: `${docMeta.title} | Prometheus`,
      // description: docMeta.description,
      url: `${SITE_URL}/docs/${slug.join("/")}`,
    },
  };
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
        // "rehypeRaw" is required for raw HTML in some old Markdown files to work.
        // See https://github.com/remarkjs/react-markdown?tab=readme-ov-file#appendix-a-html-in-markdown
        rehypeRaw,
        // Add "id" attributes to headings so links can point to them.
        rehypeSlug,
        // Add "<a>" tags with a link symbol to headings to link to themselves.
        () =>
          rehypeAutolinkHeadings({
            properties: {
              className: ["header-auto-link"],
            },
            behavior: "prepend",
            // Don't link top-level page headings (h1).
            test: (el) => el.tagName !== "h1",
          }),
        // Highlight code blocks with Shiki.
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
        // Custom plugin: On the configuration page, link from placeholders like
        // <string> or <scrape_config> in code blocks to their corresponding type
        // definitions in the same file.
        //
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

          // For local docs, keep links as is. If they're wrong, they should
          // be fixed in the local Markdown files, not here.
          const href = props.href;
          if (!href || docMeta.type === "local-doc") {
            return <a {...rest}>{children}</a>;
          }

          // For external repo docs, do some postprocessing on the hrefs to make
          // sure they point to the right place.
          let normalizedHref = href;
          if (href.startsWith(SITE_URL)) {
            // Remove the "https://prometheus.io" from links that start with it.
            normalizedHref = href.slice(SITE_URL.length);
          } else if (href.startsWith("/")) {
            // Turn "/<path>" into e.g. "https://github.com/prometheus/prometheus/blob/release-3.3/<path>"
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
        p: (props) => {
          const { children, node: _node, ...rest } = props;
          // The React children can either be an array or a single element, and
          // each element can be a string or something else. The Children.toArray()
          // method from React helps us convert either situation into an array.
          const arrayChildren = Children.toArray(children);
          const fc = arrayChildren[0];
          if (fc && typeof fc === "string") {
            // Paragraphs that start with "TIP:", "NOTE:", "CAUTION:", or "TODO:"
            // are rendered as blockquotes with an icon.
            const alertRegex = new RegExp(
              /^(TIP|NOTE|CAUTION|TODO): (.*)$/,
              "s"
            );
            const match = fc.match(alertRegex);

            if (match) {
              const alertType = match[1];
              const alertText = match[2];
              return (
                <Blockquote
                  py="lg"
                  my="xl"
                  color={alertType === "CAUTION" ? "yellow" : "blue"}
                  icon={
                    alertType === "CAUTION" ? (
                      <IconAlertCircle size={30} />
                    ) : (
                      <IconInfoCircle size={30} />
                    )
                  }
                >
                  <strong>{alertType}</strong>: {alertText}
                  {arrayChildren.slice(1)}
                </Blockquote>
              );
            }
          }
          return <p {...rest}>{children}</p>;
        },
        img: (props) => {
          const { src, node: _node, ...rest } = props;
          if (
            !src ||
            typeof src !== "string" ||
            isAbsoluteUrl(src) ||
            docMeta.type === "local-doc"
          ) {
            let srcUrl = src;
            if (typeof srcUrl === "string") {
              // Remove the "https://prometheus.io" from links that start with it.
              // TODO: Fix this in the old Markdown files instead.
              srcUrl = srcUrl.replace(/^\/assets\//, "/assets/docs/");
            }
            // eslint-disable-next-line jsx-a11y/alt-text
            return <img {...rest} src={srcUrl} />;
          }

          // eslint-disable-next-line jsx-a11y/alt-text
          return <img {...rest} src={`${docMeta.assetsRoot}/${src}`} />;
        },
        pre: (props) => {
          const { children, node, ...rest } = props;
          const firstChild = node?.children[0];
          if (
            !firstChild ||
            firstChild?.type !== "element" ||
            firstChild?.tagName !== "code"
          ) {
            return <pre {...rest}>{children}</pre>;
          }

          return (
            <pre
              {...rest}
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
              {children}
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
