"use client";

import { Button, Stack, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    Kapa?: {
      close?: () => void;
      open?: (options?: {
        mode?: "search" | "ai";
        query?: string;
        submit?: boolean;
      }) => void;
      render?: (options?: { onRender?: () => void }) => void;
      unmount?: () => void;
    };
  }
}

export default function KapaPageLauncher() {
  const [hasRendered, setHasRendered] = useState(false);

  const openAssistant = () => {
    if (!window.Kapa?.render) {
      return;
    }

    window.Kapa.render({
      onRender: () => {
        setHasRendered(true);
        window.Kapa?.open?.({ mode: "ai" });
      },
    });
  };

  useEffect(() => {
    let cancelled = false;

    const openWhenReady = () => {
      if (cancelled) {
        return;
      }

      if (!window.Kapa?.render) {
        window.setTimeout(openWhenReady, 100);
        return;
      }

      window.Kapa.render({
        onRender: () => {
          if (cancelled) {
            return;
          }

          setHasRendered(true);
          window.Kapa?.open?.({ mode: "ai" });
        },
      });
    };

    openWhenReady();

    return () => {
      cancelled = true;
      window.Kapa?.close?.();
      window.Kapa?.unmount?.();
    };
  }, []);

  return (
    <Stack gap="md" maw={640}>
      <Title order={1}>Ask AI</Title>
      <Text c="dimmed">
        This branch gives Kapa a dedicated route, then opens the assistant in a
        full-screen experience so the conversation gets most of the viewport.
      </Text>
      <Text c="dimmed">
        {hasRendered
          ? "If you close the assistant, use the button below to open it again."
          : "Loading the assistant..."}
      </Text>
      <Button w="fit-content" onClick={openAssistant}>
        Open Ask AI
      </Button>
    </Stack>
  );
}
