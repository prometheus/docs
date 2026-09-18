import assert from "node:assert/strict";
import { test } from "node:test";
import { generateLTSTable, getActiveLTSVersions } from "./utils";

const config = {
  prometheus: [
    { version: "2.53", releaseDate: "2024-06-16", endDate: "2025-07-31" },
    { version: "3.5", releaseDate: "2025-07-14", endDate: "2026-07-31" },
    { version: "3.13", releaseDate: "2026-07-01", endDate: "2027-07-31" },
  ],
};

test("LTS support includes the entire end date in UTC", () => {
  const stableVersions = ["2.53", "3.5", "3.13"];
  assert.deepEqual(
    getActiveLTSVersions(config, "prometheus", stableVersions, new Date("2026-07-31T23:59:59.999Z")),
    ["3.5", "3.13"]
  );
  assert.deepEqual(
    getActiveLTSVersions(config, "prometheus", stableVersions, new Date("2026-08-01T00:00:00Z")),
    ["3.13"]
  );
});

test("upcoming LTS versions require a stable release", () => {
  assert.deepEqual(
    getActiveLTSVersions(config, "prometheus", ["2.53", "3.5"], new Date("2026-06-01T00:00:00Z")),
    ["3.5"]
  );
  assert.deepEqual(
    getActiveLTSVersions(config, "prometheus", [], new Date("2026-06-01T00:00:00Z")),
    []
  );
});

test("repositories without LTS configuration have no active LTS versions", () => {
  assert.deepEqual(getActiveLTSVersions(config, "alertmanager", ["0.31"]), []);
});

test("the LTS table includes expired, supported, and upcoming releases", () => {
  const table = generateLTSTable(
    [...config.prometheus, { version: "TBD", releaseDate: "2027-06", endDate: "2028-07-31" }],
    ["3.5"],
    new Date("2026-06-01T00:00:00Z")
  );
  assert.match(table, /\| Prometheus 2\.53 \| 2024-06-16 \| 2025-07-31 \| End of life \|/);
  assert.match(table, /\| \*\*Prometheus 3\.5\*\* \| \*\*2025-07-14\*\* \| \*\*2026-07-31\*\* \| \*\*Supported\*\* \|/);
  assert.match(table, /\| Prometheus 3\.13 \| 2026-07-01 \| 2027-07-31 \| Upcoming \|/);
  assert.match(table, /\| TBD \| 2027-06 \| 2028-07-31 \| Upcoming \|/);
});
