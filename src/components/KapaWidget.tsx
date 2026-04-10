import Script from "next/script";
import { getKapaConfig } from "./kapa-config";

export type KapaWidgetVariant = "drawer" | "modal" | "page";

type KapaWidgetProps = {
  variant: KapaWidgetVariant;
};

const ASK_AI_TRIGGER_SELECTOR = "[data-kapa-trigger='ask-ai']";

export default function KapaWidget({ variant }: KapaWidgetProps) {
  const config = getKapaConfig();

  if (!config) {
    return null;
  }

  const triggerProps =
    variant === "page"
      ? {}
      : {
          "data-modal-override-open-selector-ask-ai": ASK_AI_TRIGGER_SELECTOR,
        };

  const variantProps =
    variant === "drawer"
      ? {
          "data-view-mode": "sidebar",
        }
      : variant === "page"
        ? {
            "data-render-on-load": "false",
            "data-modal-full-screen": "true",
          }
        : {};

  return (
    <Script
      id="kapa-widget"
      strategy="afterInteractive"
      src="https://widget.kapa.ai/kapa-widget.bundle.js"
      data-website-id={config.websiteId}
      data-project-name={config.projectName}
      data-project-color={config.projectColor}
      data-project-logo={config.projectLogoUrl}
      data-button-hide="true"
      {...triggerProps}
      {...variantProps}
    />
  );
}
