import { getPageMetadata } from "@/page-metadata";
import { Title } from "@mantine/core";
import { Metadata } from "next";

export const metadata: Metadata = getPageMetadata({
  pageTitle: "Alertmanager Routing Tree Editor",
  pageDescription:
    "A routing tree editor and visualizer for Alertmanager routing configurations.",
  pagePath: "/webtools/alerting/routing-tree-editor/",
});

export default function RoutingTreeEditorPage() {
  return (
    <>
      <Title order={1}>Alertmanager Routing Tree Editor</Title>
      <iframe
        src="/webtools/routing-tree-editor.html"
        width="100%"
        height={1000}
        style={{
          border: "none",
        }}
      />
    </>
  );
}
