import Script from "next/script";
import docsConfig from "../../docs-config";

export type KapaWidgetVariant = "drawer" | "modal" | "page";

type KapaWidgetProps = {
  variant: KapaWidgetVariant;
};

const WEBSITE_ID = "80cbacc9-0b84-48aa-bfb8-0002270176bf";
const PROJECT_NAME = "Prometheus";
const PROJECT_COLOR = "#D86444";
const ASK_AI_TRIGGER_SELECTOR = "[data-kapa-trigger='ask-ai']";
const PROJECT_LOGO_URL = new URL(
  "/assets/prometheus-logo.svg",
  docsConfig.siteUrl,
).toString();

export default function KapaWidget({ variant }: KapaWidgetProps) {
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
      data-website-id={WEBSITE_ID}
      data-project-name={PROJECT_NAME}
      data-project-color={PROJECT_COLOR}
      data-project-logo={PROJECT_LOGO_URL}
      data-button-hide="true"
      {...triggerProps}
      {...variantProps}
    />
  );
}
