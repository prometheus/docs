"use client";

import {
  docsCollection,
  allRepoVersions,
  getDocsRoots,
} from "@/docs-collection";
import { DocMetadata } from "@/docs-collection-types";
import { Box, Select, NavLink } from "@mantine/core";
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
  IconTag,
} from "@tabler/icons-react";

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
      if (!currentPage) {
        throw new Error(`Current page not found: ${currentPageSlug}`);
      }

      const currentPageVersion =
        currentPage.type === "repo-doc" &&
        fc.type === "repo-doc" &&
        currentPage.owner === fc.owner &&
        currentPage.repo === fc.repo
          ? currentPage.version
          : null;

      const shownChildren = doc.children.filter((child) => {
        if (child.hideInNav) {
          return false;
        }

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
          label={doc.navTitle ?? doc.title}
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
                    router.push(`/docs/${newPageNode.slug}/`);
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
        label={doc.navTitle ?? doc.title}
        href={`/docs/${doc.slug}/`}
        style={{ borderRadius: 2.5 }}
      />
    );
  });
}

export default function LeftNav() {
  const router = useRouter();
  const pageSlug = usePathname()
    .replace(/^\/docs\//, "")
    .replace(/\/$/, "");

  return buildRecursiveNav(getDocsRoots(), pageSlug, router);
}
