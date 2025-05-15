import TOC from "@/components/TOC";
import { Box, Group, Mark, Title } from "@mantine/core";
import { readFileSync } from "fs";
import Markdown from "react-markdown";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";

export default function CommunityPage() {
  const content = readFileSync(
    `${process.cwd()}/src/app/community/community.md`,
    "utf-8"
  );

  return (
    <>
      <Group wrap="nowrap" align="flex-start" pos="relative">
        <Box pos="sticky" top={0} w="fit-content" className="markdown-content">
          <Title order={1}>Community</Title>
          <Markdown
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
            ]}
          >
            {content}
          </Markdown>
        </Box>
        <TOC
          scrollSpyOptions={{
            selector: "h2, h3, h4, h5, h6",
          }}
          visibleFrom="sm"
        />
      </Group>
    </>
  );
}
