import rehypeConfigLinker from "@/rehypeConfigLinker";
import {
  em,
  Anchor,
  Blockquote,
  Table,
  TableTh,
  TableTd,
  TableTr,
  TableThead,
  TableTbody,
  Title,
  TitleProps,
} from "@mantine/core";
import rehypeShiki from "@shikijs/rehype";
import {
  IconLink,
  IconAlertCircle,
  IconInfoCircle,
  IconExternalLink,
} from "@tabler/icons-react";
import Link from "next/link";
import { Children, HTMLAttributes, PropsWithChildren } from "react";
import { MarkdownAsync } from "react-markdown";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import docsConfig from "../../docs-config";

export function isAbsoluteUrl(url: string) {
  try {
    new URL(url); // will succeed for absolute URLs
    return true;
  } catch {
    return false;
  }
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

export default async function PromMarkdown({
  children,
  normalizeHref = (href: string | undefined) => href,
  normalizeImgSrc = (src: string | Blob | undefined) => src,
}: PropsWithChildren<{
  normalizeHref?: (href: string | undefined) => string | undefined;
  normalizeImgSrc?: (
    src: string | Blob | undefined
  ) => string | Blob | undefined;
}>) {
  if (typeof children !== "string") {
    throw new Error("PromMarkdown only accepts string children");
  }

  return (
    <div className="markdown-content">
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
              behavior: "append",
              // Don't link top-level page headings (h1).
              test: (el) => el.tagName !== "h1",
            }),
          // Highlight code blocks with Shiki.
          [
            rehypeShiki,
            {
              theme: "github-light",
            },
          ],
          // Custom plugin: On the configuration page, link from placeholders like
          // <string> or <scrape_config> in code blocks to their corresponding type
          // definitions in the same file.
          //
          // Important: this has to run after rehypeSlug, since it
          // relies on the headers to already have IDs.
          //
          // TODO: Only run this on the "Configuration" page, like in the old site?
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

            const href = normalizeHref(rest.href);
            const isExternalLink =
              isAbsoluteUrl(href || "") &&
              !href?.startsWith(`${docsConfig.siteUrl}/`);

            if (!isExternalLink) {
              return (
                <Anchor
                  inherit
                  c="var(--secondary-link-color)"
                  component={Link}
                  {...rest}
                  href={href || ""}
                >
                  {children}
                </Anchor>
              );
            }

            const firstChild = Children.toArray(children)[0];

            return (
              <Anchor
                inherit
                c="var(--secondary-link-color)"
                {...rest}
                href={href}
                target="_blank"
                rel="noopener"
              >
                {/* Only add the icon if the first child is a string. This is to avoid
                breaking the layout of other components like image links etc. */}
                {typeof firstChild === "string" && firstChild.trim() !== "" ? (
                  // <Group> with display: "inline-flex" somehow breaks link underlining,
                  // so going for this manual solution instead.
                  <span>
                    {children}&nbsp;
                    <IconExternalLink
                      size="0.9em"
                      style={{ marginBottom: -1.5 }}
                    />
                  </span>
                ) : (
                  children
                )}
              </Anchor>
            );
          },
          p: (props) => {
            const { children, node: _node, ...rest } = props;

            // The React children can either be an array or a single element, and
            // each element can be a string or something else. The Children.toArray()
            // method from React helps us convert either situation into a predictable array.
            const arrayChildren = Children.toArray(children);
            const fc = arrayChildren[0];
            if (fc && typeof fc === "string") {
              // Render paragraphs that start with "TIP:", "NOTE:", "CAUTION:", or "TODO:"
              // as blockquotes with an appropriate icon.
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
            // eslint-disable-next-line jsx-a11y/alt-text
            return <img {...rest} src={normalizeImgSrc(src)} />;
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
        {children}
      </MarkdownAsync>
    </div>
  );
}
