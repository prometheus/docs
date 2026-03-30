"use client";

import mermaid from "mermaid";
import { useEffect, useId, useState } from "react";

function initializeMermaid() {
  const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: isDarkMode ? "dark" : "default",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
    class: {
      hideEmptyMembersBox: true,
    },
    themeVariables: isDarkMode
      ? {
          lineColor: "#aeb6c0",
          primaryTextColor: "#f5f7fa",
          secondaryTextColor: "#f5f7fa",
          tertiaryTextColor: "#f5f7fa",
          textColor: "#f5f7fa",
          noteTextColor: "#f5f7fa",
        }
      : {
          lineColor: "#4b5563",
          textColor: "#111827",
        },
  });
}

export default function Mermaid({ chart }: { chart: string }) {
  const elementId = useId().replace(/:/g, "");
  const [svg, setSvg] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function renderChart() {
      initializeMermaid();

      try {
        const { svg: renderedSvg } = await mermaid.render(
          `mermaid-${elementId}`,
          chart
        );
        if (!cancelled) {
          setSvg(renderedSvg);
          setFailed(false);
        }
      } catch {
        if (!cancelled) {
          setFailed(true);
        }
      }
    }

    void renderChart();

    return () => {
      cancelled = true;
    };
  }, [chart, elementId]);

  if (failed) {
    return (
      <pre>
        <code>{chart}</code>
      </pre>
    );
  }

  return (
    <div
      aria-label="Mermaid diagram"
      className="mermaid-diagram"
      dangerouslySetInnerHTML={{ __html: svg }}
      role="img"
    />
  );
}
