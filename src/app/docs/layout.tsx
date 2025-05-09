"use client";

import { docsCollection, allRepoVersions } from "@/docs-collection";
import {
  DocsCollection,
  LocalDocMetadata,
  RepoDocMetadata,
} from "@/docs-collection-types";
import {
  Container,
  Group,
  Box,
  List,
  ListItem,
  Text,
  Select,
  NavLink,
  Alert,
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
  IconVersions,
  IconTag,
} from "@tabler/icons-react";
import { ReactElement } from "react";

const iconMap: Record<string, React.ComponentType<any>> = {
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

export function NavIcon({
  iconName,
  ...props
}: { iconName: string } & IconProps) {
  const Icon = iconMap[iconName];
  return Icon ? (
    <Icon {...props} color="var(--mantine-primary-color-4)" />
  ) : (
    <span>?</span>
  );
}

type DocsTree =
  | {
      type: "directory";
      path: string;
      document: LocalDocMetadata | RepoDocMetadata;
      children: DocsTree[];
    }
  | {
      type: "document";
      path: string;
      document: LocalDocMetadata | RepoDocMetadata;
    };

function buildDocsTree(docs: DocsCollection): DocsTree[] {
  // Remove any final /index segments from paths.
  const paths = Object.keys(docs).map((path) => {
    return path.replace(/\/index$/, "");
  });

  // Normalize and sort paths by depth
  const sortedPaths = paths.sort(
    (a, b) => a.split("/").length - b.split("/").length
  );

  const pathTrees = new Map<string, DocsTree>();

  for (const path of sortedPaths) {
    const isDoc = !sortedPaths.some((p) => p.startsWith(`${path}/`));
    const node: DocsTree = isDoc
      ? { type: "document", path, document: docs[path] }
      : {
          type: "directory",
          path,
          document: docs[`${path}/index`],
          children: [],
        };

    pathTrees.set(path, node);

    const segments = path.split("/").filter(Boolean);
    if (segments.length === 1) {
      continue; // Top-level, no parent
    }

    // Try to find a parent by removing trailing segments until a match is found
    let parentPath = segments.slice(0, -1).join("/");
    let parentNode: DocsTree | undefined = undefined;

    while (parentPath && !parentNode) {
      parentNode = pathTrees.get(parentPath);
      if (parentNode && parentNode.type === "directory") {
        parentNode.children.push(node);
        break;
      } else if (parentPath.includes("/")) {
        // Keep removing segments until we find a parent or run out of segments
        parentPath = parentPath.split("/").slice(0, -1).join("/");
      } else {
        // No more segments to remove
        break;
      }
    }
  }
  // console.log("Path map", pathMap);

  // Return only top-level nodes
  return Array.from(pathTrees.values()).filter((node) => {
    const segments = node.path.split("/").filter(Boolean);
    return segments.length === 1;
  });
}

// Return a navigation tree UI for the DocsTree.
function buildRecursiveNav(
  docsTree: DocsTree[],
  currentPageSlug: string,
  router: ReturnType<typeof useRouter>,
  level = 0
) {
  return docsTree
    .sort((a, b) => a.document.sortRank - b.document.sortRank)
    .map((node) => {
      if (node.type === "directory") {
        const fc = node.children[0];
        const repoVersions =
          fc && fc.document.type === "repo-doc"
            ? allRepoVersions[fc.document.owner][fc.document.repo]
            : null;

        const currentPage = docsCollection[currentPageSlug];
        const currentPageVersion =
          currentPage.type === "repo-doc" &&
          fc.document.type === "repo-doc" &&
          currentPage.owner === fc.document.owner &&
          currentPage.repo === fc.document.repo
            ? currentPage.version
            : null;

        const shownChildren = node.children.filter((child) => {
          // Always show unversioned local docs in the nav.
          if (child.document.type === "local-doc") {
            return true;
          }

          // Always show latest version docs if we're not looking at a different version of the same repo.
          if (
            !currentPageVersion &&
            child.document.version === repoVersions?.latestVersion
          ) {
            if (child.path.startsWith(child.document.versionRoot)) {
              // Don't show "3.4", even if it is the latest.
              return false;
            } else {
              // Show "latest".
              return true;
            }
          }

          // If we're looking at a specific version and it's not the latest version,
          // show all children with that same version.
          if (child.document.version === currentPageVersion) {
            if (currentPageVersion !== repoVersions?.latestVersion) {
              return true;
            } else {
              if (child.path.startsWith(child.document.versionRoot)) {
                return false;
              } else {
                return true;
              }
            }
          }
        });

        // If the latest version (3.3) is selected, only show nav items for "latest". Otherwise,
        // show nav items for the selected version (3.3).
        //
        // currentPageVersion === repoVersions?.latestVersion && child.path.startsWith(currentPage.versionRoot.replace)

        const navIcon =
          node.document.type === "local-doc" && node.document.navIcon;

        return (
          <NavLink
            key={node.path}
            href="#required-for-focus"
            label={node.document.title}
            childrenOffset={level === 0 ? 28 : 14}
            leftSection={
              navIcon ? (
                <NavIcon iconName={navIcon} size={16} stroke={1.8} />
              ) : undefined
            }
            ff={level === 0 ? "var(--font-inter)" : undefined}
            fw={level === 0 ? 500 : undefined}
            c={level === 0 ? "black" : "gray.7"}
            style={{ borderRadius: 2.5 }}
            // style={
            //   level === 1
            //     ? { borderLeft: "1px solid var(--mantine-color-gray-3)" }
            //     : {}
            // }
          >
            {level === 0 && repoVersions && (
              <Select
                w="100%"
                size="sm"
                my="xs"
                leftSection={<IconTag size={16} />}
                // placeholder="Pick version"
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
                  const newPageNode = node.children
                    .filter(
                      (child) =>
                        child.document.type === "repo-doc" &&
                        child.document.version === version
                    )
                    .sort(
                      (a, b) => a.document.sortRank - b.document.sortRank
                    )[0];
                  if (newPageNode) {
                    router.push(`/docs/${newPageNode.path}`);
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
          </NavLink>
        );
      }

      const active = currentPageSlug === node.path;

      return (
        <NavLink
          active={active}
          variant="light"
          component={Link}
          key={node.path}
          label={node.document.title}
          href={`/docs/${node.path}`}
          style={{ borderRadius: 2.5 }}
          c={active ? undefined : "gray.7"}
          // style={
          //   level === 1
          //     ? { borderLeft: "1px solid var(--mantine-color-gray-3)" }
          //     : {}
          // }
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
  const docsTree = buildDocsTree(docsCollection);
  const pageSlug = usePathname().replace(/^\/docs\//, "");
  const currentPage = docsCollection[pageSlug];

  let alert: ReactElement | null = null;
  if (currentPage.type === "repo-doc") {
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

  return (
    <Container size="lg">
      <Group wrap="nowrap" align="flex-start" gap={80}>
        <Box w={250} flex="0 0 auto" mih={300}>
          {buildRecursiveNav(docsTree, pageSlug, router)}
        </Box>
        <Box miw={0}>
          {alert}
          {children}
        </Box>
      </Group>
    </Container>
  );
}
