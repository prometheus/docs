"use client";

import {
  ScrollAreaAutosize,
  ScrollAreaAutosizeProps,
  TableOfContents,
  TableOfContentsProps,
  Text,
} from "@mantine/core";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function TOC(
  props: TableOfContentsProps & { wrapperProps?: ScrollAreaAutosizeProps }
) {
  const reinitializeTOCRef = useRef(() => {});
  const path = usePathname();

  useEffect(() => {
    reinitializeTOCRef.current();
  }, [path]);

  return (
    <ScrollAreaAutosize
      mah="calc(100vh - var(--header-height) - var(--header-to-content-margin))"
      type="never"
      pos="sticky"
      top="calc(var(--header-height) + var(--header-to-content-margin))"
      flex="0 0 auto"
      visibleFrom="md"
      {...props.wrapperProps}
    >
      <Text mb="sm" c="dimmed" fw={600} fz="sm">
        On this page
      </Text>
      <TableOfContents
        reinitializeRef={reinitializeTOCRef}
        maw={300}
        pr="xs"
        size="sm"
        c="dimmed"
        minDepthToOffset={2}
        depthOffset={30}
        variant="light"
        getControlProps={({ active, data }) => ({
          component: "a",
          href: `#${data.id}`,
          children: data.value,
          style: {
            borderLeft: "1px solid",
            borderLeftColor: active
              ? "var(--mantine-color-primary-filled)"
              : "light-dark(var(--mantine-color-gray-3), var(--mantine-color-gray-7))",
          },
        })}
        scrollSpyOptions={{
          selector: "h2, h3, h4, h5, h6",
        }}
        radius={0}
        {...props}
      />
    </ScrollAreaAutosize>
  );
}
