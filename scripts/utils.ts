import { compare } from "semver";
import { LTSConfig } from "../src/docs-config-types";

// Only stable, published versions still within their support period are active LTS.
export const getActiveLTSVersions = (
  config: LTSConfig,
  repo: string,
  stableVersions: string[],
  now = new Date()
): string[] => {
  const today = now.toISOString().slice(0, 10);
  return (config[repo] ?? [])
    .filter(
      ({ version, endDate }) => stableVersions.includes(version) && today <= endDate
    )
    .map(({ version }) => version);
};

export const generateLTSTable = (
  versions: LTSConfig[string],
  activeVersions: string[],
  now = new Date()
): string => {
  const today = now.toISOString().slice(0, 10);
  const rows = versions.map(({ version, releaseDate, endDate }) => {
    const supported = today <= endDate && activeVersions.includes(version);
    const status = today > endDate
      ? "End of life"
      : supported ? "Supported" : "Upcoming";
    const cells = [
      version === "TBD" ? "TBD" : `Prometheus ${version}`,
      releaseDate,
      endDate,
      status,
    ];
    return `| ${cells.map((cell) => supported ? `**${cell}**` : cell).join(" | ")} |`;
  });
  return [
    "| Release | Date | End of support | Status |",
    "| --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
};

// Takes a full Prometheus tag / version string and returns the major and minor version.
// "v3.4.0-rc.0" -> "3.4"
export const majorMinor = (version: string) => {
  return version.replace(/^v/, "").split(".").slice(0, 2).join(".");
};

export const compareFullVersion = (a: string, b: string) => {
  return compare(a.replace(/^v/, ""), b.replace(/^v/, ""));
};

// Compares two "<major>.<minor>" version strings., e.g. "3.4" vs "3.5".
export const compareMajorMinor = (a: string, b: string) => {
  const [aMajor, aMinor] = a.split(".").map(Number);
  const [bMajor, bMinor] = b.split(".").map(Number);
  if (aMajor === bMajor) {
    return aMinor === bMinor ? 0 : aMinor > bMinor ? 1 : -1;
  }
  return aMajor > bMajor ? 1 : -1;
};

export function filterUnique(value: string, index: number, array: string[]) {
  return array.indexOf(value) === index;
}
