import docsConfig from "../../docs-config";

export type KapaConfig = {
  websiteId: string;
  projectName: string;
  projectColor: string;
  projectLogoUrl: string;
};

export const getKapaConfig = (): KapaConfig | null => {
  const websiteId = process.env.KAPA_WEBSITE_ID;
  const projectName = process.env.KAPA_PROJECT_NAME;
  const projectColor = process.env.KAPA_PROJECT_COLOR;

  if (!websiteId || !projectName || !projectColor) {
    return null;
  }

  return {
    websiteId,
    projectName,
    projectColor,
    projectLogoUrl: new URL(
      "/assets/prometheus-logo.svg",
      docsConfig.siteUrl,
    ).toString(),
  };
};

export const isKapaConfigured = (): boolean => getKapaConfig() !== null;
