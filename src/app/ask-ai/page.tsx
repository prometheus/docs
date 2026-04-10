import { getPageMetadata } from "@/page-metadata";
import KapaPageLauncher from "@/components/KapaPageLauncher";

export const metadata = getPageMetadata({
  pageTitle: "Ask AI",
  pageDescription: "Chat with the Prometheus documentation using Kapa.ai.",
  pagePath: "/ask-ai/",
});

export default function AskAiPage() {
  return <KapaPageLauncher />;
}
