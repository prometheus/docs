"use client";

import TOC from "@/components/TOC";
import { downloadsMetadata } from "@/downloads-metadata";
import {
  Anchor,
  Badge,
  Box,
  Card,
  Group,
  Select,
  Stack,
  Table,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Title,
} from "@mantine/core";
import { IconBrandGithub } from "@tabler/icons-react";
import Link from "next/link";
import React, { useState } from "react";

export default function DownloadPage() {
  const [os, setOs] = useState("popular");
  const [arch, setArch] = useState("popular");

  const osList =
    os === "all"
      ? downloadsMetadata.operatingSystems
      : os === "popular"
      ? ["linux", "windows", "darwin"]
      : [os];

  const archList =
    arch === "all"
      ? downloadsMetadata.architectures
      : arch === "popular"
      ? ["amd64", "arm64"]
      : [arch];

  return (
    <>
      <Title order={1}>Download</Title>

      <Group wrap="nowrap" align="flex-start">
        <Box>
          <p>
            We provide precompiled binaries and{" "}
            <Anchor href="https://hub.docker.com/r/prom/" target="_blank">
              Docker images
            </Anchor>{" "}
            for most officially maintained Prometheus components. If a component
            is not listed here, check the respective repository on Github for
            further instructions.
          </p>

          <p>
            There is also a constantly growing number of independently
            maintained exporters listed at{" "}
            <Link href="/docs/instrumenting/exporters/">
              Exporters and integrations
            </Link>
            .
          </p>
        </Box>
        <TOC
          scrollSpyOptions={{
            selector: "h2",
          }}
        />
      </Group>

      <Stack mt="xl" gap="md">
        <Group>
          <Select
            label="Operating System"
            placeholder="Select OS"
            maxDropdownHeight={300}
            data={[
              { group: "Group", items: ["all", "popular"] },
              {
                group: "Specific",
                items: downloadsMetadata.operatingSystems,
              },
            ]}
            value={os}
            onChange={(value) => {
              console.log(value);
              setOs(value || "all");
            }}
          />
          <Select
            label="Architecture"
            placeholder="Select Architecture"
            maxDropdownHeight={300}
            data={[
              { group: "Group", items: ["all", "popular"] },
              { group: "Specific", items: downloadsMetadata.architectures },
            ]}
            value={arch}
            onChange={(value) => {
              setArch(value || "all");
            }}
          />
        </Group>

        {downloadsMetadata.repos.map((repo) => (
          // "overflow: unset" is needed, since otherwise "overflow: hidden"
          // on the Card breaks the scroll-margin-top of the Title / h2, and
          // the title ends up under the sticky header.
          <Card key={repo.name} withBorder style={{ overflow: "unset" }}>
            <Title order={2} mt={0} mb="xs" id={repo.name}>
              {repo.name}
            </Title>
            <Group justify="space-between" mb="xs" align="flex-end">
              {repo.description}
              <Anchor href={repo.url} target="_blank">
                <Group gap={5} align="center">
                  <IconBrandGithub size="1em" /> {repo.fullName}
                </Group>
              </Anchor>
            </Group>
            <Table withColumnBorders withRowBorders withTableBorder fz="sm">
              {repo.releases.map((release) => (
                <React.Fragment key={release.id}>
                  <TableThead>
                    <TableTr>
                      <TableTd colSpan={5}>
                        <Group justify="space-between" align="center">
                          <Group gap="xs">
                            <strong>{release.name}</strong>
                            {release.prerelease ? (
                              <Badge size="sm" color="yellow">
                                Pre-release
                              </Badge>
                            ) : release.ltsRelease ? (
                              <Badge size="sm" color="blue">
                                LTS
                              </Badge>
                            ) : (
                              <Badge size="sm" color="green">
                                Latest
                              </Badge>
                            )}
                          </Group>
                          <a href={release.url}>Release notes</a>
                        </Group>
                      </TableTd>
                    </TableTr>
                    <TableTr>
                      <TableTh>File name</TableTh>
                      <TableTh>OS</TableTh>
                      <TableTh>Arch</TableTh>
                      <TableTh>Size</TableTh>
                      <TableTh>SHA256 Checksum</TableTh>
                    </TableTr>
                  </TableThead>
                  {release.binaries
                    .filter(
                      (b) =>
                        osList.includes(b.os) &&
                        archList.includes(b.arch) &&
                        (b.arch === "amd64" ||
                          (b.os === "darwin" && b.arch === "arm64"))
                    )
                    .map((binary) => (
                      <TableTr key={binary.name}>
                        <TableTd>
                          <a className="download" href={binary.url}>
                            {binary.name}
                          </a>
                        </TableTd>
                        <TableTd>{binary.os}</TableTd>
                        <TableTd>{binary.arch}</TableTd>
                        <TableTd>
                          {(binary.sizeBytes / 1024 / 1024).toFixed(2)} MiB
                        </TableTd>
                        <TableTd fz="xs">{binary.checksum}</TableTd>
                      </TableTr>
                    ))}
                </React.Fragment>
              ))}
            </Table>
          </Card>
        ))}
      </Stack>
    </>
  );
}
