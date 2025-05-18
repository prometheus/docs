"use client";

import {
  docsCollection,
  allRepoVersions,
  getDocsRoots,
} from "@/docs-collection";
import { DocMetadata } from "@/docs-collection-types";
import {
  Group,
  Box,
  Select,
  NavLink,
  Alert,
  ScrollAreaAutosize,
  Button,
  Popover,
  Text,
  ScrollArea,
  Stack,
  Divider,
} from "@mantine/core";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconFlask,
  IconServer,
  IconCode,
  IconThumbUp,
  IconBell,
  IconBook,
  IconSettings,
  IconHandFingerRight,
  IconChartLine,
  IconMap,
  IconFileDescription,
  IconProps,
  IconInfoCircle,
  IconTag,
  IconMenu2,
  IconArrowRight,
  IconArrowLeft,
  IconPencil,
} from "@tabler/icons-react";
import { ReactElement, useEffect, useRef } from "react";
import TOC from "@/components/TOC";

const iconMap: Record<string, React.ComponentType<IconProps>> = {
  flask: IconFlask,
  server: IconServer,
  code: IconCode,
  "thumb-up": IconThumbUp,
  bell: IconBell,
  book: IconBook,
  settings: IconSettings,
  "hand-finger-right": IconHandFingerRight,
  "chart-line": IconChartLine,
  map: IconMap,
  "file-description": IconFileDescription,
};

function NavIcon({ iconName, ...props }: { iconName: string } & IconProps) {
  const Icon = iconMap[iconName];
  if (!Icon) {
    throw new Error(`Unknown icon name: ${iconName}`);
  }
  return <Icon {...props} color="var(--mantine-color-gray-6)" />;
}

// Return a navigation tree UI for the DocsTree.
function buildRecursiveNav(
  docsTree: DocMetadata[],
  currentPageSlug: string,
  router: ReturnType<typeof useRouter>,
  level = 0
) {
  return docsTree.map((doc) => {
    if (doc.children.length > 0) {
      // Node is a "directory".
      const fc = doc.children[0];
      const repoVersions =
        fc && fc.type === "repo-doc"
          ? allRepoVersions[fc.owner][fc.repo]
          : null;

      const currentPage = docsCollection[currentPageSlug];
      const currentPageVersion =
        currentPage.type === "repo-doc" &&
        fc.type === "repo-doc" &&
        currentPage.owner === fc.owner &&
        currentPage.repo === fc.repo
          ? currentPage.version
          : null;

      const shownChildren = doc.children.filter((child) => {
        // Always show unversioned local docs in the nav.
        if (child.type === "local-doc") {
          return true;
        }

        // Always show latest version docs if we're not looking at a different version of the same repo.
        if (
          !currentPageVersion &&
          child.version === repoVersions?.latestVersion
        ) {
          if (child.slug.startsWith(child.versionRoot)) {
            // Don't show "3.4", even if it is the latest.
            return false;
          } else {
            // Show "latest".
            return true;
          }
        }

        // If we're looking at a specific version and it's not the latest version,
        // show all children with that same version.
        if (child.version === currentPageVersion) {
          if (currentPageVersion !== repoVersions?.latestVersion) {
            return true;
          } else {
            if (child.slug.startsWith(child.versionRoot)) {
              return false;
            } else {
              return true;
            }
          }
        }
      });

      const navIcon = doc.type === "local-doc" && doc.navIcon;
      const active = currentPageSlug.startsWith(doc.slug);

      return (
        <NavLink
          defaultOpened={active || undefined}
          key={doc.slug}
          href="#required-for-focus"
          label={doc.title}
          // We offset the children, but we do it manually via a mix of margin and padding
          // to position the left-hand-side border on the first level correctly.
          childrenOffset={0}
          leftSection={
            navIcon ? (
              <NavIcon iconName={navIcon} size={16} stroke={1.8} />
            ) : undefined
          }
          ff={level === 0 ? "var(--font-inter)" : undefined}
          fw={level === 0 ? 500 : undefined}
          style={{ borderRadius: 2.5 }}
        >
          <Box
            ml={level === 0 ? 19 : 12}
            pl={level === 0 ? 9 : 2}
            style={
              level === 0
                ? {
                    borderLeft:
                      "1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-gray-7))",
                  }
                : undefined
            }
          >
            {level === 0 && repoVersions && (
              <Select
                py="xs"
                size="sm"
                leftSection={<IconTag size={16} />}
                title="Select version"
                value={currentPageVersion || repoVersions.latestVersion}
                data={repoVersions.versions.map((version) => ({
                  value: version,
                  label:
                    version === repoVersions.latestVersion
                      ? `${version} (latest)`
                      : repoVersions.ltsVersions.includes(version)
                      ? `${version} (LTS)`
                      : version,
                }))}
                onChange={(version) => {
                  const newPageNode = doc.children.filter(
                    (child) =>
                      child.type === "repo-doc" && child.version === version
                  )[0];
                  if (newPageNode) {
                    router.push(`/docs/${newPageNode.slug}`);
                  }
                }}
              />
            )}
            {buildRecursiveNav(
              shownChildren,
              currentPageSlug,
              router,
              level + 1
            )}
          </Box>
        </NavLink>
      );
    }

    const active = currentPageSlug === doc.slug;

    // Node is a "file" (document).
    return (
      <NavLink
        active={active}
        variant="light"
        component={Link}
        key={doc.slug}
        label={doc.title}
        href={`/docs/${doc.slug}`}
        style={{ borderRadius: 2.5 }}
      />
    );
  });
}

function compareVersions(a: string, b: string): number {
  const [majorA, minorA] = a.split(".").map(Number);
  const [majorB, minorB] = b.split(".").map(Number);

  if (majorA !== majorB) {
    return Math.sign(majorA - majorB);
  }
  return Math.sign(minorA - minorB);
}

export default function DocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pageSlug = usePathname().replace(/^\/docs\//, "");
  const currentPage = docsCollection[pageSlug];
  const reinitializeTOCRef = useRef(() => {});

  useEffect(() => {
    reinitializeTOCRef.current();
  }, [pageSlug]);

  let alert: ReactElement | null = null;
  if (currentPage.type === "repo-doc") {
    // TODO: Clean this up, the version could theoretically appear in the path
    // in unintended places as well.
    const latestSlug = pageSlug.replace(currentPage.version, "latest");

    switch (compareVersions(currentPage.version, currentPage.latestVersion)) {
      case -1:
        alert = (
          <Alert
            icon={<IconInfoCircle size={16} />}
            title="Outdated version"
            color="yellow"
            mb="xl"
          >
            This page documents version {currentPage.version}, which is
            outdated. Check out the{" "}
            <Link href={`/docs/${latestSlug}`}>latest stable version.</Link>
          </Alert>
        );
        break;
      case 1:
        alert = (
          <Alert
            icon={<IconInfoCircle size={16} />}
            title="Pre-release version"
            color="yellow"
            mb="xl"
          >
            This page documents a pre-release version ({currentPage.version}).
            Check out the{" "}
            <Link href={`/docs/${latestSlug}`}>latest stable version</Link> (
            {currentPage.latestVersion}).
          </Alert>
        );
        break;
    }
  }

  // TODO: Handle hideInNav.
  const nav = buildRecursiveNav(getDocsRoots(), pageSlug, router);

  return (
    <>
      {/* The mobile main nav */}
      <Popover position="bottom" withArrow shadow="md">
        <Popover.Target>
          <Button
            hiddenFrom="sm"
            variant="outline"
            color="gray"
            mb="lg"
            leftSection={<IconMenu2 />}
          >
            Show nav
          </Button>
        </Popover.Target>
        <Popover.Dropdown mah="calc(100vh - var(--header-height))">
          <ScrollAreaAutosize
            mah="calc(80vh - var(--header-height))"
            type="never"
          >
            {nav}
          </ScrollAreaAutosize>
        </Popover.Dropdown>
      </Popover>
      <Group wrap="nowrap" align="flex-start" gap={50}>
        {/* The left-hand side main docs nav */}
        <Box
          component="nav"
          w={250}
          flex="0 0 auto"
          h="calc(100vh - var(--header-height) - var(--header-to-content-margin))"
          pos="sticky"
          top="calc(var(--header-height) + var(--header-to-content-margin))"
          visibleFrom="sm"
          style={{
            borderInlineEnd:
              "1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-gray-7))",
          }}
        >
          <ScrollArea
            h="calc(100vh - var(--header-height) - var(--header-to-content-margin))"
            type="never"
          >
            <Box px="xs">{nav}</Box>
          </ScrollArea>
        </Box>

        {/* The main docs page content */}
        <Box miw={0} className="markdown-content">
          {alert}
          {children}

          {/* Previous / next sibling page navigation */}
          <Divider my="xl" />
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
                  href={`/docs/${currentPage.prev.slug}`}
                  variant="outline"
                  color="gray"
                  w="100%"
                  h={80}
                  leftSection={<IconArrowLeft />}
                >
                  <Stack align="flex-start" gap={5}>
                    <Text size="sm" c="dimmed">
                      Previous
                    </Text>
                    <Text size="sm" fw={700}>
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
              color="gray"
              w="100%"
              h={80}
              leftSection={<IconPencil size={18} />}
            >
              Edit this page
            </Button>
            <Box flex="1" miw={0}>
              {currentPage.next && (
                <Button
                  component={Link}
                  href={`/docs/${currentPage.next.slug}`}
                  variant="outline"
                  color="gray"
                  w="100%"
                  h={80}
                  rightSection={<IconArrowRight />}
                >
                  <Stack align="flex-start" gap={5}>
                    <Text size="sm" c="dimmed">
                      Next
                    </Text>
                    <Text size="sm" fw={700}>
                      {currentPage.next.title}
                    </Text>
                  </Stack>
                </Button>
              )}
            </Box>
          </Group>
        </Box>

        {/* The right-hand-side table of contents for headings
              within the current document */}
        <Box
          w="fit-content"
          maw={230}
          flex="0 0 auto"
          pos="sticky"
          top="calc(var(--header-height) + var(--header-to-content-margin))"
          visibleFrom="md"
        >
          <Text mb="sm" c="dimmed" fw={600} fz="sm">
            On this page
          </Text>
          <ScrollAreaAutosize
            mah="calc(100vh - var(--header-height))"
            type="never"
          >
            <TOC
              reinitializeRef={reinitializeTOCRef}
              scrollSpyOptions={{
                selector:
                  ".markdown-content :is(h2, h3), .markdown-content h1:not(:first-of-type)",
              }}
            />
          </ScrollAreaAutosize>
        </Box>
      </Group>
    </>
  );
}
