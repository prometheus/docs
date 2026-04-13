"use client";

import { useComputedColorScheme } from "@mantine/core";
import Script from "next/script";
import { useEffect } from "react";
import docsConfig from "../../docs-config";

export default function KapaWidget() {
  const colorScheme = useComputedColorScheme("light");

  // Sync the resolved Mantine color scheme to a data-theme attribute on <html>
  // so that the Kapa widget can detect theme changes. Kapa only watches
  // class, data-theme, data-color-mode, and data-bs-theme.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", colorScheme);
  }, [colorScheme]);

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
      data-color-scheme-selector="[data-theme='dark']"
    />
  );
}
