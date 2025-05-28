import { useMantineColorScheme, rem, ActionIcon } from "@mantine/core";
import { IconBrightnessFilled, IconSun, IconMoon } from "@tabler/icons-react";
import { FC } from "react";

export const ThemeSelector: FC = () => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
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
        colorScheme === "light"
          ? "dark"
          : colorScheme === "dark"
          ? "browser-preferred"
          : "light"
      } theme`}
      aria-label={`Switch to ${
        colorScheme === "light"
          ? "dark"
          : colorScheme === "dark"
          ? "browser-preferred"
          : "light"
      } theme`}
      size={32}
      onClick={() =>
        setColorScheme(
          colorScheme === "light"
            ? "dark"
            : colorScheme === "dark"
            ? "auto"
            : "light"
        )
      }
    >
      {colorScheme === "light" ? (
        <IconSun suppressHydrationWarning {...iconProps} />
      ) : colorScheme === "dark" ? (
        <IconMoon suppressHydrationWarning {...iconProps} />
      ) : (
        <IconBrightnessFilled suppressHydrationWarning {...iconProps} />
      )}
    </ActionIcon>
  );
};
