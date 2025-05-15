import Markdown, { MarkdownAsync } from "react-markdown";
import { getAllPostParams, getPost, getPostFileContent } from "@/blog-helpers";
import {
  Anchor,
  Blockquote,
  Box,
  em,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
  Title,
  TitleProps,
} from "@mantine/core";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeShiki from "@shikijs/rehype";
import { IconAlertCircle, IconInfoCircle, IconLink } from "@tabler/icons-react";
import { Children } from "react";
import dayjs from "dayjs";

export async function generateStaticParams() {
  return getAllPostParams();
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

export default async function BlogPostPage({
  params,
}: {
  params: { year: string; month: string; day: string; slug: string };
}) {
  const { frontmatter, content } = getPost(params);

  return (
    <Box className="markdown-content">
      <Title order={2} mt={0} mb="xs">
        {frontmatter.title}
      </Title>
      <Text size="sm" c="dimmed" mb="xl">
        {dayjs(frontmatter.created_at).format("MMMM D, YYYY")} by{" "}
        {frontmatter.author_name}
      </Text>
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
              // or `theme` for a single theme
              themes: {
                light: "github-light",
                dark: "vitesse-dark",
              },
            },
          ],
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

            return (
              <Anchor c="var(--secondary-link-color)" {...rest}>
                {children}
              </Anchor>
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
        {content}
      </MarkdownAsync>
    </Box>
  );
}
