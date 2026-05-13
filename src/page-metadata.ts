import { Metadata } from "next";
import docsConfig from "../docs-config";

export const getPageMetadata = ({
  pageTitle,
  pageDescription,
  pagePath,
}: {
  pageTitle?: string;
  pageDescription?: string;
  pagePath: string;
}): Metadata => {
  const title = pageTitle
    ? `${pageTitle} | Prometheus`
    : "Prometheus - Monitoring system & time series database";
  const description =
    pageDescription ||
    "An open-source monitoring system with a dimensional data model, flexible query language, efficient time series database and modern alerting approach.";

  const canonicalUrl = `${docsConfig.siteUrl}${pagePath}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      // TODO: add image.
    },
    // TODO: Add page-specific keywords here. For now, we're using the same static config as on the old site.
    keywords: [
      "prometheus",
      "monitoring",
      "monitoring system",
      "time series",
      "time series database",
      "alerting",
      "metrics",
      "telemetry",
    ],
    alternates: {
      canonical: canonicalUrl,
    },
  };
};
