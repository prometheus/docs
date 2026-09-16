export type DocRoute = {
  slug?: string;
  navTitle?: string;
  sortRank?: number;
  redirectTo?: string;
};

// Routes are keyed by their path relative to the configured documentation root.
// External routes use :version so the same information architecture applies to
// both numbered releases and the "latest" alias.
export const localDocRoutes: Record<string, DocRoute> = {
  "introduction/index.md": { slug: "get-started", navTitle: "Get Started", sortRank: 1 },
  "introduction/overview.md": { slug: "get-started/what-is-prometheus", navTitle: "What is Prometheus?", sortRank: 1 },
  "introduction/first_steps.md": { slug: "get-started/quickstart", navTitle: "Prometheus quickstart", sortRank: 2 },
  "introduction/comparison.md": { slug: "get-started/comparison", navTitle: "Comparison to alternatives", sortRank: 3 },
  "introduction/faq.md": { slug: "get-started/faq", navTitle: "Frequently asked questions", sortRank: 4 },
  "introduction/glossary.md": { slug: "get-started/glossary", sortRank: 5 },

  "concepts/index.md": { slug: "concepts", sortRank: 2 },
  "concepts/data_model.md": { slug: "concepts/data-model", sortRank: 1 },
  "concepts/metric_types.md": { slug: "concepts/metric-types", sortRank: 2 },
  "concepts/jobs_instances.md": { slug: "concepts/jobs-and-instances", sortRank: 3 },

  "prometheus/index.md": { slug: "running-prometheus", navTitle: "Running Prometheus", sortRank: 3 },
  "querying/index.md": { slug: "querying", sortRank: 4 },

  "instrumenting/index.md": { slug: "instrument-your-code", navTitle: "Instrument Your Code", sortRank: 5 },
  "instrumenting/clientlibs.md": { slug: "instrument-your-code/client-libraries", sortRank: 1 },
  "instrumenting/writing_clientlibs.md": { slug: "instrument-your-code/writing-client-libraries", sortRank: 2 },
  "instrumenting/pushing.md": { slug: "instrument-your-code/pushing-metrics", sortRank: 3 },
  "instrumenting/exporters.md": { slug: "instrument-your-code/exporters-and-integrations", sortRank: 4 },
  "instrumenting/writing_exporters.md": { slug: "instrument-your-code/writing-exporters", sortRank: 5 },
  "guides/multi-target-exporter.md": { slug: "instrument-your-code/multi-target-exporter", navTitle: "Use the multi-target exporter pattern", sortRank: 6 },
  "instrumenting/exposition_formats.md": { slug: "instrument-your-code/exposition-formats", sortRank: 7 },
  "guides/utf8.md": { slug: "instrument-your-code/adopt-utf-8", navTitle: "Adopt UTF-8 metric and label names", sortRank: 8 },
  "instrumenting/escaping_schemes.md": { slug: "instrument-your-code/utf-8-escaping-schemes", sortRank: 9 },
  "instrumenting/content_negotiation.md": { slug: "instrument-your-code/content-negotiation", sortRank: 10 },
  "guides/open_metrics_2_0_migration.md": { slug: "instrument-your-code/openmetrics-2-migration", navTitle: "Migrate client libraries to OpenMetrics 2.0", sortRank: 11 },

  "visualization/index.md": { slug: "visualization", sortRank: 6 },
  "visualization/browser.md": { slug: "visualization/expression-browser", sortRank: 1 },
  "visualization/grafana.md": { slug: "visualization/grafana", sortRank: 2 },
  "visualization/perses.md": { slug: "visualization/perses", sortRank: 3 },
  "visualization/consoles.md": { slug: "visualization/console-templates", sortRank: 4 },

  "operating/index.md": { slug: "operate-in-production", navTitle: "Operate in Production", sortRank: 7 },
  "operating/security.md": { slug: "operate-in-production/security", sortRank: 1 },
  "operating/integrations.md": { slug: "operate-in-production/integrations", sortRank: 2 },
  "guides/basic-auth.md": { slug: "operate-in-production/basic-authentication", sortRank: 3 },
  "guides/tls-encryption.md": { slug: "operate-in-production/tls-encryption", sortRank: 4 },
  "practices/remote_write.md": { slug: "operate-in-production/remote-write-tuning", sortRank: 5 },
  "guides/query-log.md": { slug: "operate-in-production/query-logging", sortRank: 6 },
  "guides/dockerswarm.md": { slug: "operate-in-production/docker-swarm-service-discovery", sortRank: 7 },
  "guides/file-sd.md": { slug: "operate-in-production/file-based-service-discovery", sortRank: 8 },

  "alerting/index.md": { slug: "alertmanager", navTitle: "Alertmanager", sortRank: 8 },

  "practices/index.md": { slug: "best-practices", navTitle: "Best Practices", sortRank: 9 },
  "practices/naming.md": { slug: "best-practices/metric-and-label-naming", sortRank: 1 },
  "practices/consoles.md": { slug: "best-practices/consoles-and-dashboards", sortRank: 2 },
  "practices/instrumentation.md": { slug: "best-practices/instrumentation", sortRank: 3 },
  "practices/histograms.md": { slug: "best-practices/histograms-and-summaries", sortRank: 4 },
  "practices/alerting.md": { slug: "best-practices/alerting", sortRank: 5 },
  "practices/rules.md": { slug: "best-practices/recording-rules", sortRank: 6 },
  "practices/pushing.md": { slug: "best-practices/when-to-use-the-pushgateway", sortRank: 7 },
  "practices/the_zen.md": { slug: "best-practices/zen", sortRank: 8 },

  "guides/index.md": { slug: "guides", sortRank: 10 },
  "guides/opentelemetry.md": { slug: "guides/opentelemetry-backend", navTitle: "Use Prometheus as an OpenTelemetry backend", sortRank: 1 },
  "guides/cadvisor.md": { slug: "guides/cadvisor", navTitle: "Monitor containers with cAdvisor", sortRank: 2 },
  "guides/node-exporter.md": { slug: "guides/node-exporter", navTitle: "Monitor Linux hosts with Node Exporter", sortRank: 3 },
  "tutorials/understanding_metric_types.md": { slug: "guides/understand-metric-types", navTitle: "Understand metric types", sortRank: 4 },
  "guides/go-application.md": { slug: "guides/go-application", navTitle: "Instrument a Go application", sortRank: 5 },
  "tutorials/visualizing_metrics_using_grafana.md": { slug: "guides/visualize-metrics-with-grafana", navTitle: "Visualize metrics with Grafana", sortRank: 6 },
  "tutorials/alerting_based_on_metrics.md": { slug: "guides/alert-based-on-metrics", navTitle: "Alert based on metrics", sortRank: 7 },
  "tutorials/index.md": { redirectTo: "guides" },
  "tutorials/getting_started.md": { redirectTo: "get-started/quickstart" },
  "tutorials/instrumenting_http_server_in_go.md": { redirectTo: "guides/go-application" },

  "specs/index.md": { slug: "specifications", navTitle: "Specifications", sortRank: 11 },
  "specs/native_histograms.md": { slug: "specifications/native-histograms", sortRank: 1 },
  "specs/om/index.md": { slug: "specifications/openmetrics", navTitle: "OpenMetrics", sortRank: 2 },
  "specs/om/open_metrics_spec.md": { slug: "specifications/openmetrics/1.0", navTitle: "1.0", sortRank: 1 },
  "specs/om/open_metrics_spec_2_0.md": { slug: "specifications/openmetrics/2.0", navTitle: "2.0", sortRank: 2 },
  "specs/prw/index.md": { slug: "specifications/remote-write", navTitle: "Remote Write", sortRank: 3 },
  "specs/prw/remote_write_spec.md": { slug: "specifications/remote-write/1.0", navTitle: "1.0", sortRank: 1 },
  "specs/prw/remote_write_spec_2_0.md": { slug: "specifications/remote-write/2.0", navTitle: "2.0", sortRank: 2 },

  "introduction/roadmap.md": { slug: "about-the-project/roadmap", sortRank: 1 },
  "introduction/design-doc.md": { slug: "about-the-project/design-documents", sortRank: 2 },
  "guides/contributing.md": { slug: "about-the-project/contributing", navTitle: "Contributing guide", sortRank: 3 },
  "introduction/release-cycle.md": { slug: "about-the-project/long-term-support", navTitle: "Long-term support", sortRank: 4 },
  "introduction/media.md": { slug: "about-the-project/media", sortRank: 5 },
  "about-the-project/index.md": { slug: "about-the-project", navTitle: "About the Project", sortRank: 12 },
};

export const githubDocRoutes: Record<string, Record<string, DocRoute>> = {
  prometheus: {
    "getting_started.md": { redirectTo: "get-started/quickstart" },
    "installation.md": { slug: "running-prometheus/:version/installation", sortRank: 1 },
    "configuration/index.md": { slug: "running-prometheus/:version/configuration", navTitle: "Configuration reference", sortRank: 2 },
    "configuration/configuration.md": { slug: "running-prometheus/:version/configuration/reference", navTitle: "Configuration", sortRank: 1 },
    "configuration/recording_rules.md": { slug: "running-prometheus/:version/configuration/recording-rules", sortRank: 2 },
    "configuration/alerting_rules.md": { slug: "running-prometheus/:version/configuration/alerting-rules", sortRank: 3 },
    "configuration/template_examples.md": { slug: "running-prometheus/:version/configuration/template-examples", sortRank: 4 },
    "configuration/template_reference.md": { slug: "running-prometheus/:version/configuration/template-reference", sortRank: 5 },
    "configuration/unit_testing_rules.md": { slug: "running-prometheus/:version/configuration/unit-testing-rules", sortRank: 6 },
    "configuration/promtool.md": { slug: "running-prometheus/:version/configuration/promtool-http", navTitle: "HTTP configuration for promtool", sortRank: 7 },
    "configuration/https.md": { slug: "running-prometheus/:version/configuration/https-authentication", navTitle: "HTTPS and authentication", sortRank: 8 },
    "prometheus_agent.md": { slug: "running-prometheus/:version/agent-mode", navTitle: "Agent mode", sortRank: 3 },
    "storage.md": { slug: "running-prometheus/:version/storage", sortRank: 4 },
    "federation.md": { slug: "running-prometheus/:version/federation", sortRank: 5 },
    "migration.md": { slug: "running-prometheus/:version/migration", sortRank: 6 },
    "feature_flags.md": { slug: "running-prometheus/:version/feature-flags", sortRank: 7 },
    "command-line/index.md": { slug: "running-prometheus/:version/command-line", sortRank: 8 },
    "command-line/prometheus.md": { slug: "running-prometheus/:version/command-line/prometheus", navTitle: "Prometheus", sortRank: 1 },
    "command-line/promtool.md": { slug: "running-prometheus/:version/command-line/promtool", sortRank: 2 },
    "stability.md": { slug: "running-prometheus/:version/api-stability", navTitle: "API stability", sortRank: 9 },

    "querying/index.md": { redirectTo: "querying" },
    "querying/basics.md": { slug: "querying/:version/basics", sortRank: 1 },
    "querying/operators.md": { slug: "querying/:version/operators", sortRank: 2 },
    "querying/functions.md": { slug: "querying/:version/functions", sortRank: 3 },
    "querying/examples.md": { slug: "querying/:version/examples", sortRank: 4 },
    "querying/api.md": { slug: "querying/:version/http-api", navTitle: "HTTP API", sortRank: 5 },
    "querying/remote_read_api.md": { slug: "querying/:version/remote-read-api", sortRank: 6 },

    "http_sd.md": { slug: "operate-in-production/:version/http-service-discovery", sortRank: 9 },
    "management_api.md": { slug: "operate-in-production/:version/management-api", sortRank: 10 },
  },
  alertmanager: {
    "overview.md": { slug: "alertmanager/:version/overview", navTitle: "Alerting overview", sortRank: 1 },
    "alertmanager.md": { slug: "alertmanager/:version/alertmanager", sortRank: 2 },
    "configuration.md": { slug: "alertmanager/:version/configuration", sortRank: 3 },
    "integrations.md": { slug: "alertmanager/:version/notification-integrations", sortRank: 4 },
    "clients.md": { slug: "alertmanager/:version/notification-integrations", sortRank: 4 },
    "notifications.md": { slug: "alertmanager/:version/notification-template-reference", sortRank: 5 },
    "notification_examples.md": { slug: "alertmanager/:version/notification-template-examples", sortRank: 6 },
    "alerts_api.md": { slug: "alertmanager/:version/alerts-api", sortRank: 7 },
    "management_api.md": { slug: "alertmanager/:version/management-api", sortRank: 8 },
    "high_availability.md": { slug: "alertmanager/:version/high-availability", sortRank: 9 },
    "https.md": { slug: "alertmanager/:version/https-authentication", navTitle: "HTTPS and authentication", sortRank: 10 },
  },
};

export function materializeRoute(route: DocRoute, version?: string): string | undefined {
  return route.slug?.replace(":version", version ?? "");
}

export function canonicalizeDocPath(url: string): string {
  const match = url.match(/^([^?#]*)(.*)$/);
  const pathname = match?.[1] ?? url;
  const suffix = match?.[2] ?? "";
  const oldSlug = pathname.replace(/^\/docs\//, "").replace(/\/$/, "");
  const external = oldSlug.match(/^(prometheus|alerting)\/([^/]+)\/(.+)$/);

  let route: DocRoute | undefined;
  let version: string | undefined;
  if (external) {
    const [, oldPrefix, routeVersion, sourceSlug] = external;
    const repo = oldPrefix === "alerting" ? "alertmanager" : "prometheus";
    route =
      githubDocRoutes[repo]?.[`${sourceSlug}.md`] ??
      githubDocRoutes[repo]?.[`${sourceSlug}/index.md`];
    version = routeVersion;
  } else {
    route =
      localDocRoutes[`${oldSlug}.md`] ??
      localDocRoutes[`${oldSlug}/index.md`];
  }

  const canonicalSlug =
    route?.redirectTo ?? (route && materializeRoute(route, version));
  return canonicalSlug ? `/docs/${canonicalSlug}/${suffix}` : url;
}
