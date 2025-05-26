import { Group, Box, Button, Text, Stack } from "@mantine/core";
import Link from "next/link";
import { IconArrowRight, IconArrowLeft, IconPencil } from "@tabler/icons-react";
import { DocMetadata } from "@/docs-collection-types";

export default function PrevNextEditButtons({
  currentPage,
}: {
  currentPage: DocMetadata;
}) {
  return (
    <Group
      component="nav"
      aria-label="pagination"
      justify="space-between"
      mt="xl"
    >
      <Box flex="1" miw={0}>
        {currentPage.prev && (
          <Button
            component={Link}
            href={`/docs/${currentPage.prev.slug}/`}
            variant="outline"
            color="var(--mantine-color-text)"
            justify="space-between"
            w="100%"
            h={80}
            leftSection={<IconArrowLeft stroke={1.5} />}
            ta="right"
            bd="1px solid var(--mantine-color-gray-5)"
          >
            <Stack align="flex-end" gap={5}>
              <Text size="sm" fw={700}>
                Previous
              </Text>
              <Text size="sm" style={{ whiteSpace: "normal" }}>
                {currentPage.prev.title}
              </Text>
            </Stack>
          </Button>
        )}
      </Box>
      <Button
        flex="1"
        miw={0}
        component="a"
        href={
          currentPage.type === "local-doc"
            ? `https://github.com/prometheus/docs/blob/main/docs/${currentPage.slug}.md`
            : `https://github.com/${currentPage.owner}/${
                currentPage.repo
              }/blob/main/docs/${currentPage.slug
                .split("/")
                .slice(currentPage.slugPrefix.split("/").length + 1)
                .join("/")}.md`
        }
        target="_blank"
        variant="subtle"
        color="var(--mantine-color-text)"
        w="100%"
        h={80}
        leftSection={<IconPencil size={18} stroke={1.5} />}
        fw="normal"
      >
        Edit this page
      </Button>
      <Box flex="1" miw={0}>
        {currentPage.next && (
          <Button
            component={Link}
            href={`/docs/${currentPage.next.slug}/`}
            variant="outline"
            color="var(--mantine-color-text)"
            justify="space-between"
            w="100%"
            h={80}
            rightSection={<IconArrowRight stroke={1.5} />}
            ta="left"
            bd="1px solid var(--mantine-color-gray-5)"
          >
            <Stack align="flex-start" gap={5}>
              <Text size="sm" fw={700}>
                Next
              </Text>
              <Text size="sm" style={{ whiteSpace: "normal" }}>
                {currentPage.next.title}
              </Text>
            </Stack>
          </Button>
        )}
      </Box>
    </Group>
  );
}
