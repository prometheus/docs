import {
  Group,
  Box,
  ScrollArea,
} from "@mantine/core";
import TOC from "@/components/TOC";
import LeftNav from "./LeftNav";
import { AnchorScroller } from "@/components/AnchorScroller";
import DocsMobileNav from "./DocsMobileNav";

export default function DocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* The mobile main nav */}
      <DocsMobileNav />
      <Group wrap="nowrap" align="flex-start" gap={50}>
        {/* The left-hand side main docs nav */}
        <Box
          component="nav"
          w={250}
          flex="0 0 auto"
          h="calc(100vh - var(--header-height) - var(--header-to-content-margin))"
          pos="sticky"
          top="calc(var(--header-height) + var(--header-to-content-margin))"
          visibleFrom="sm"
          style={{
            borderInlineEnd:
              "1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-gray-7))",
          }}
          // Counter-act the padding of the Box inside which exists so
          // that the focus rings (e.g. when tab-ing) of the nav items are not cut off.
          mx="calc(var(--mantine-spacing-xs) * -1)"
        >
          <ScrollArea
            h="calc(100vh - var(--header-height) - var(--header-to-content-margin))"
            type="never"
          >
            <Box px="xs">
              <LeftNav />
            </Box>
          </ScrollArea>
        </Box>

        {/* The main docs page content */}
        <div style={{ minWidth: 0 }}>{children}</div>

        {/* The right-hand-side table of contents for headings
              within the current document */}
        <TOC
          maw={230}
          wrapperProps={{ visibleFrom: "lg" }}
          scrollSpyOptions={{
            selector:
              ".markdown-content :is(h2, h3), .markdown-content h1:not(:first-of-type)",
          }}
        />
      </Group>
      <AnchorScroller />
    </>
  );
}
