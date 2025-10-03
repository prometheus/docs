import PromMarkdown from "@/components/PromMarkdown";
import TOC from "@/components/TOC";
import { getPageMetadata } from "@/page-metadata";
import { Box, Group, Title } from "@mantine/core";
import { readFileSync } from "fs";
import { Metadata } from "next";

export const metadata: Metadata = getPageMetadata({
  pageTitle: "Governance",
  pageDescription:
    "Project governance rules for the Prometheus monitoring system and time series database.",
  pagePath: "/governance/",
});

export default function CommunityPage() {
  const content = readFileSync(
    `${process.cwd()}/src/app/governance/governance.md`,
    "utf-8"
  );

  return (
    <Group wrap="nowrap" align="flex-start" pos="relative" gap="xl">
      <Box pos="sticky" top={0} w="fit-content" data-pagefind-body>
        <PromMarkdown>{content}</PromMarkdown>
      </Box>
      <TOC />
    </Group>
  );
}
