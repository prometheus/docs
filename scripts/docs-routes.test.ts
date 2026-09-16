import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { canonicalizeDocPath, githubDocRoutes, localDocRoutes, materializeRoute } from "../docs-routes";
import { shownNavChildren } from "../src/docs-navigation";
import { DocMetadata } from "../src/docs-collection-types";

test("exporter and service discovery pages have task-appropriate parents", () => {
  assert.equal(localDocRoutes["guides/multi-target-exporter.md"].slug, "guides/multi-target-exporter");
  assert.equal(
    materializeRoute(githubDocRoutes.prometheus["http_sd.md"], "latest"),
    "running-prometheus/latest/configuration/http-service-discovery"
  );
  assert.equal(githubDocRoutes.prometheus["http_sd.md"].navTitle, "HTTP service discovery endpoint");
});

test("versioned getting started pages remain accessible outside the menu", () => {
  const route = githubDocRoutes.prometheus["getting_started.md"];
  assert.equal(route.hideInNav, true);
  assert.equal(
    canonicalizeDocPath("/docs/prometheus/2.55/getting_started/?source=old#example"),
    "/docs/running-prometheus/2.55/getting-started/?source=old#example"
  );
});

test("mixed sections show local pages and only the selected release", () => {
  const local = { type: "local-doc", slug: "operate-in-production/security" } as DocMetadata;
  const repo = (slug: string, routeVersion: string, hideInNav = false) => ({
    type: "repo-doc", owner: "prometheus", repo: "prometheus", slug, routeVersion, hideInNav,
  }) as DocMetadata;
  const latest = repo("operate-in-production/latest/management-api", "latest");
  const older = repo("operate-in-production/2.55/management-api", "2.55");
  const hidden = repo("running-prometheus/latest/getting-started", "latest", true);
  const children = [local, latest, older, hidden];

  assert.deepEqual(shownNavChildren(children, local), [local, latest]);
  assert.deepEqual(shownNavChildren(children, older), [local, older]);
  assert.deepEqual(shownNavChildren(children, latest), [local, latest]);
});

test("moved and legacy routes redirect without self-redirects", () => {
  const rules = readFileSync("public/_redirects", "utf8").split("\n")
    .filter((line) => line.startsWith("/docs/"))
    .map((line) => line.trim().split(/\s+/));
  const redirects = new Map(rules.map(([from, to]) => [from, to]));
  assert.equal(redirects.get("/docs/prometheus/:version/getting_started/"), "/docs/running-prometheus/:version/getting-started/");
  assert.equal(redirects.get("/docs/prometheus/:version/http_sd/"), "/docs/running-prometheus/:version/configuration/http-service-discovery/");
  assert.equal(redirects.get("/docs/operate-in-production/:version/http-service-discovery/"), "/docs/running-prometheus/:version/configuration/http-service-discovery/");
  assert.equal(redirects.get("/docs/instrument-your-code/multi-target-exporter/"), "/docs/guides/multi-target-exporter/");
  assert.equal(redirects.get("/docs/guides/basic-auth/"), "/docs/operate-in-production/basic-authentication/");
  for (const [from, to] of redirects) {
    assert.notEqual(from, to, `Self-redirect at ${from}`);
  }
});

test("the Grafana and alerting walkthroughs use the maintained Go example", () => {
  const grafana = readFileSync("docs/tutorials/visualizing_metrics_using_grafana.md", "utf8");
  const alerting = readFileSync("docs/tutorials/alerting_based_on_metrics.md", "utf8");
  for (const tutorial of [grafana, alerting]) {
    assert.match(tutorial, /\.\.\/guides\/go-application\.md/);
    assert.match(tutorial, /myapp_processed_ops_total/);
    assert.doesNotMatch(tutorial, /ping_request_count|instrumenting_http_server_in_go/);
  }
  assert.match(alerting, /targets: \["localhost:2112"\]/);
  assert.match(alerting, /expr: myapp_processed_ops_total > 5/);
});
