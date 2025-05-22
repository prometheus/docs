import docsConfig from "../docs-config";

export const getPageMetadata = ({
  pageTitle,
  pageDescription,
  pagePath,
}: {
  pageTitle?: string;
  pageDescription?: string;
  pagePath?: string;
}) => {
  const title = pageTitle
    ? `${pageTitle} | Prometheus`
    : "Prometheus - Monitoring system & time series database";
  const description =
    pageDescription ||
    "An open-source monitoring system with a dimensional data model, flexible query language, efficient time series database and modern alerting approach.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pagePath ? `${docsConfig.siteUrl}${pagePath}` : undefined,
      // TODO: add image.
    },
  };
};
