import TOC from "@/components/TOC";
import { getPageMetadata } from "@/page-metadata";
import { Anchor, Box, Group, Title } from "@mantine/core";
import { Metadata } from "next";
import Link from "next/link";
import React from "react";
import DownloadsSelector from "./DownloadsSelector";

export const metadata: Metadata = getPageMetadata({
  pageTitle: "Download",
  pageDescription:
    "Downloads for the latest releases of the Prometheus monitoring system and its major ecosystem components.",
  pagePath: "/download/",
});

export default function DownloadPage() {
  return (
    <>
      <Title order={1}>Download</Title>

      <Group wrap="nowrap" align="flex-start" gap="xl">
        <Box>
          <p>
            We provide precompiled binaries and{" "}
            <Anchor
              c="var(--secondary-link-color)"
              href="https://hub.docker.com/r/prom/"
              target="_blank"
            >
              Docker images
            </Anchor>{" "}
            for most officially maintained Prometheus components. If a component
            is not listed here, check the respective repository on Github for
            further instructions.
          </p>

          <p>
            There is also a constantly growing number of independently
            maintained exporters listed at{" "}
            <Anchor
              c="var(--secondary-link-color)"
              component={Link}
              href="/docs/instrumenting/exporters/"
            >
              Exporters and integrations
            </Anchor>
            .
          </p>
        </Box>
        <TOC
          scrollSpyOptions={{
            selector: "h2",
          }}
        />
      </Group>

      <DownloadsSelector />
    </>
  );
}
