import { Alert } from "@mantine/core";
import Link from "next/link";
import { IconInfoCircle } from "@tabler/icons-react";
import { DocMetadata } from "@/docs-collection-types";

function compareVersions(a: string, b: string): number {
  const [majorA, minorA] = a.split(".").map(Number);
  const [majorB, minorB] = b.split(".").map(Number);

  if (majorA !== majorB) {
    return Math.sign(majorA - majorB);
  }
  return Math.sign(minorA - minorB);
}

export default function VersionWarning({
  currentPage,
}: {
  currentPage: DocMetadata;
}) {
  if (currentPage.type === "repo-doc") {
    // TODO: Clean this up, the version could theoretically appear in the path
    // in unintended places as well.
    const latestSlug = currentPage.slug.replace(currentPage.version, "latest");

    switch (compareVersions(currentPage.version, currentPage.latestVersion)) {
      case -1:
        return (
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
      case 1:
        return (
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
    }
  }

  return null;
}
