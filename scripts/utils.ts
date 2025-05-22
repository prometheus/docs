import { compare } from "semver";

// Takes a full Prometheus tag / version string and returns the major and minor version.
// "v3.4.0-rc.0" -> "3.4"
export const majorMinor = (version: string) => {
  return version.replace(/^v/, "").split(".").slice(0, 2).join(".");
};

export const compareFullVersion = (a: string, b: string) => {
  return compare(a.replace(/^v/, ""), b.replace(/^v/, ""));
};

export function filterUnique(value: string, index: number, array: string[]) {
  return array.indexOf(value) === index;
}
