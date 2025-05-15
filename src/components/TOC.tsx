"use client";

import { TableOfContents, TableOfContentsProps } from "@mantine/core";

export default function TOC(props: TableOfContentsProps) {
  return (
    <TableOfContents
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
      radius={0}
      {...props}
    />
  );
}
