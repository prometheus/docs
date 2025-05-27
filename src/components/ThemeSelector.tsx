"use client";

import {
  rem,
  ActionIcon,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { IconBrightnessFilled, IconSun, IconMoon } from "@tabler/icons-react";
import { FC } from "react";

export const ThemeSelector: FC = () => {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });
  const iconProps = {
    style: { width: rem(20), height: rem(20), display: "block" },
    stroke: 1.5,
  };
  return (
    <ActionIcon
      suppressHydrationWarning
      color="gray"
      variant="subtle"
      title={`Switch to ${
        computedColorScheme === "light"
          ? "dark"
          : computedColorScheme === "dark"
          ? "browser-preferred"
          : "light"
      } theme`}
      aria-label={`Switch to ${
        computedColorScheme === "light"
          ? "dark"
          : computedColorScheme === "dark"
          ? "browser-preferred"
          : "light"
      } theme`}
      size={32}
      onClick={() =>
        setColorScheme(
          computedColorScheme === "light"
            ? "dark"
            : computedColorScheme === "dark"
            ? "auto"
            : "light"
        )
      }
    >
      {computedColorScheme === "light" ? (
        <IconSun {...iconProps} />
      ) : computedColorScheme === "dark" ? (
        <IconMoon {...iconProps} />
      ) : (
        <IconBrightnessFilled {...iconProps} />
      )}
    </ActionIcon>
  );
};
