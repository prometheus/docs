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
      wrap="nowrap"
      gap="xs"
    >
      <Box flex="0 1 40%" maw="40%">
        {currentPage.prev && (
          <Button
            w="100%"
            component={Link}
            href={`/docs/${currentPage.prev.slug}/`}
            variant="outline"
            color="var(--mantine-color-text)"
            justify="space-between"
            h={80}
            leftSection={<IconArrowLeft stroke={1.5} />}
            ta="right"
            bd="1px solid var(--mantine-color-gray-5)"
          >
            <Stack align="flex-end" gap={5}>
              <Text size="sm" fw={700}>
                Previous
              </Text>
              <Text
                size="sm"
                style={{
                  whiteSpace: "normal",
                }}
              >
                {currentPage.prev.navTitle ?? currentPage.prev.title}
              </Text>
            </Stack>
          </Button>
        )}
      </Box>
      <Button
        flex="0 1 40%"
        maw="40%"
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
        h={80}
        leftSection={<IconPencil size={18} stroke={1.5} />}
        fw="normal"
        visibleFrom="xs"
      >
        <Text inherit hiddenFrom="md">
          Edit
        </Text>
        <Text inherit visibleFrom="md">
          Edit this page
        </Text>
      </Button>
      <Box flex="0 1 40%" maw="40%" ta="right">
        {currentPage.next && (
          <Button
            w="100%"
            component={Link}
            href={`/docs/${currentPage.next.slug}/`}
            variant="outline"
            color="var(--mantine-color-text)"
            justify="space-between"
            h={80}
            rightSection={<IconArrowRight stroke={1.5} />}
            ta="left"
            bd="1px solid var(--mantine-color-gray-5)"
          >
            <Stack gap={5}>
              <Text size="sm" fw={700}>
                Next
              </Text>
              <Text
                size="sm"
                style={{
                  whiteSpace: "normal",
                }}
              >
                {currentPage.next.navTitle ?? currentPage.next.title}
              </Text>
            </Stack>
          </Button>
        )}
      </Box>
    </Group>
  );
}
