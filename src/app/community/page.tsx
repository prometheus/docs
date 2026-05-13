import PromMarkdown from "@/components/PromMarkdown";
import TOC from "@/components/TOC";
import { getPageMetadata } from "@/page-metadata";
import { Box, Group, Title } from "@mantine/core";
import { readFileSync } from "fs";
import { Metadata } from "next";

export const metadata: Metadata = getPageMetadata({
  pageTitle: "Community",
  pageDescription:
    "Community resources around the Prometheus monitoring system and time series database.",
  pagePath: "/community/",
});

export default function CommunityPage() {
  const content = readFileSync(
    `${process.cwd()}/src/app/community/community.md`,
    "utf-8"
  );

  return (
    <Group wrap="nowrap" align="flex-start" gap="xl">
      <Box data-pagefind-body>
        <Title order={1}>Community</Title>
        <PromMarkdown>{content}</PromMarkdown>
      </Box>
      <TOC />
    </Group>
  );
}
