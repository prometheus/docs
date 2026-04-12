import Script from "next/script";
import docsConfig from "../../docs-config";

export default function KapaWidget() {
  if (!docsConfig.kapa) {
    return null;
  }

  const { websiteId, projectName, projectColor, projectLogoPath } =
    docsConfig.kapa;
  const projectLogoUrl = new URL(
    projectLogoPath,
    docsConfig.siteUrl,
  ).toString();

  return (
    <Script
      id="kapa-widget"
      strategy="afterInteractive"
      src="https://widget.kapa.ai/kapa-widget.bundle.js"
      data-website-id={websiteId}
      data-project-name={projectName}
      data-project-color={projectColor}
      data-project-logo={projectLogoUrl}
      data-button-hide="true"
    />
  );
}
