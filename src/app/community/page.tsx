import PromMarkdown from "@/components/PromMarkdown";
import TOC from "@/components/TOC";
import { Box, Group, Title } from "@mantine/core";
import { readFileSync } from "fs";

export default function CommunityPage() {
  const content = readFileSync(
    `${process.cwd()}/src/app/community/community.md`,
    "utf-8"
  );

  return (
    <Group wrap="nowrap" align="flex-start" pos="relative">
      <Box
        pos="sticky"
        top={0}
        w="fit-content"
        className="markdown-content"
        data-pagefind-body
      >
        <Title order={1}>Community</Title>
        <PromMarkdown>{content}</PromMarkdown>
      </Box>
      <TOC
        scrollSpyOptions={{
          selector: "h2, h3, h4, h5, h6",
        }}
        visibleFrom="sm"
      />
    </Group>
  );
}
