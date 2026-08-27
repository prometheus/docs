import PromMarkdown, { isAbsoluteUrl } from "@/components/PromMarkdown";
import TOC from "@/components/TOC";
import { getPageMetadata } from "@/page-metadata";
import { Box, Group } from "@mantine/core";
import { readFileSync } from "fs";
import { Metadata } from "next";

export const metadata: Metadata = getPageMetadata({
  pageTitle: "Governance",
  pageDescription:
    "Project governance rules for the Prometheus monitoring system and time series database.",
  pagePath: "/governance/",
});

const GITHUB_BASE =
  "https://github.com/prometheus/governance/blob/main";

// Rewrite relative links (e.g. ./ROLES.md) to point to the governance
// repository on GitHub, since those files are not hosted on this site.
const normalizeHref = (href: string | undefined) => {
  if (!href || isAbsoluteUrl(href) || href.startsWith("#")) {
    return href;
  }
  const cleaned = href.startsWith("./") ? href.slice(2) : href;
  return `${GITHUB_BASE}/${cleaned}`;
};

export default function GovernancePage() {
  const content = readFileSync(
    `${process.cwd()}/generated/governance/GOVERNANCE.md`,
    "utf-8"
  );

  return (
    <Group wrap="nowrap" align="flex-start" pos="relative" gap="xl">
      <Box pos="sticky" top={0} w="fit-content" data-pagefind-body>
        <PromMarkdown normalizeHref={normalizeHref}>{content}</PromMarkdown>
      </Box>
      <TOC />
    </Group>
  );
}
