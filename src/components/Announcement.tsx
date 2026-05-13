"use client";

import { Anchor, Box, Group } from "@mantine/core";
import { IconExternalLink, IconSpeakerphone } from "@tabler/icons-react";
import { Announcement as AnnouncementType } from "@/docs-config-types";
import Markdown, { Components } from "react-markdown";

export { ANNOUNCEMENT_HEIGHT_PX } from "./announcement-utils";

const components: Components = {
  p: ({ children }) => <span>{children}</span>,
  a: ({ href, children }) => (
    <Anchor
      href={href}
      target="_blank"
      c="orange.1"
      fw={500}
      fz="inherit"
      style={{ textDecoration: "none" }}
    >
      <span>
        {children}&nbsp;
        <IconExternalLink size="0.9em" style={{ marginBottom: -1.5 }} />
      </span>
    </Anchor>
  ),
};

function AnnouncementText({ text }: { text: string }) {
  return (
    <Markdown
      allowedElements={["p", "a", "strong", "em"]}
      unwrapDisallowed
      components={components}
    >
      {text}
    </Markdown>
  );
}

export default function Announcement({
  announcement,
}: {
  announcement: AnnouncementType;
}) {
  return (
    <div
      style={{
        height: 40,
        backgroundColor: "#e6522c",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 16px",
        fontSize: "var(--mantine-font-size-sm)",
        fontWeight: 500,
      }}
    >
      <Group gap="xs" wrap="nowrap" align="center">
        <IconSpeakerphone size="1.1em" style={{ flexShrink: 0 }} />
        {announcement.mobileText ? (
          <>
            <Box visibleFrom="sm">
              <AnnouncementText text={announcement.text} />
            </Box>
            <Box hiddenFrom="sm">
              <AnnouncementText text={announcement.mobileText} />
            </Box>
          </>
        ) : (
          <AnnouncementText text={announcement.text} />
        )}
      </Group>
    </div>
  );
}
