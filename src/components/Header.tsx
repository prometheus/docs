"use client";

import {
  Group,
  Burger,
  rem,
  Text,
  Container,
  TextInput,
  ActionIcon,
  AppShell,
  Popover,
} from "@mantine/core";
import Image from "next/image";
import { IconSearch } from "@tabler/icons-react";
import prometheusLogo from "../assets/prometheus-logo.svg";
import classes from "./Header.module.css";
import githubLogo from "../assets/github-logo.svg";
import Link from "next/link";
import { ThemeSelector } from "./ThemeSelector";
import { usePathname } from "next/navigation";
import { spotlight } from "@mantine/spotlight";
import SpotlightSearch from "./SpotlightSearch";
import { useDisclosure } from "@mantine/hooks";

const links = [
  {
    link: "/docs/introduction/overview",
    label: "Docs",
    activeBasePath: "/docs",
  },
  { link: "/download", label: "Download" },
  { link: "/community", label: "Community" },
  { link: "/support-training", label: "Support & Training" },
  { link: "/blog", label: "Blog" },
];

export const Header = () => {
  const path = usePathname();
  const [burgerOpened, { toggle: toggleBurger, close: closeBurger }] =
    useDisclosure(false);

  const items = links.map((link) => (
    <Link
      key={link.label}
      href={link.link}
      className={classes.link}
      aria-current={
        path.startsWith(link.activeBasePath || link.link) ? "page" : undefined
      }
      // Close burger menu when clicking a link.
      onClick={closeBurger}
    >
      {link.label}
    </Link>
  ));

  const actionIcons = (
    <>
      <ActionIcon
        hiddenFrom="lg"
        color="gray"
        variant="subtle"
        onClick={spotlight.open}
      >
        <IconSearch
          {...{
            style: {
              width: rem(20),
              height: rem(20),
              display: "block",
            },
            stroke: 2,
          }}
        />
      </ActionIcon>

      <ThemeSelector />

      <ActionIcon
        component="a"
        href="https://github.com/prometheus"
        target="_blank"
        color="gray"
        variant="subtle"
      >
        <Image
          src={githubLogo}
          priority
          style={{
            height: 20,
            width: 20,
            opacity: 0.9,
            verticalAlign: "middle",
          }}
          className="invertInDarkMode"
          alt="GitHub Logo"
        />
      </ActionIcon>
    </>
  );

  return (
    <>
      <AppShell.Header
        className={classes.header}
        style={
          path === "/"
            ? { borderBottomColor: "rgba(222, 226, 230, 0)" }
            : undefined
        }
      >
        <Container size="xl" px={{ base: "md", xs: "xl" }}>
          <div className={classes.inner}>
            {/* Logo + Text */}
            <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
              <Group wrap="nowrap" align="center">
                <Image src={prometheusLogo} height={32} alt="Prometheus logo" />
                <Text
                  fz={25}
                  ff="var(--font-lato)"
                  c="light-dark(var(--mantine-color-gray-7), var(--mantine-color-gray-0))"
                >
                  Prometheus
                </Text>
              </Group>
            </Link>

            {/* Menu items + search */}
            <Group align="center">
              <Group gap={5} visibleFrom="sm" align="center">
                {items}
              </Group>

              <Group visibleFrom="md" gap="xs">
                <TextInput
                  placeholder="Search"
                  w={220}
                  mx="lg"
                  leftSection={
                    <IconSearch
                      style={{ width: rem(16), height: rem(16) }}
                      stroke={1.5}
                    />
                  }
                  rightSection={
                    <Text
                      size="xs"
                      mx={5}
                      p={6}
                      fw={700}
                      bg="light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-7))"
                      lh={1}
                      style={{ borderRadius: "0.25em" }}
                    >
                      Ctrl + K
                    </Text>
                  }
                  onClick={spotlight.open}
                  rightSectionWidth="fit-content"
                  visibleFrom="lg"
                />
                {actionIcons}
              </Group>

              {/* Mobile version of the nav */}
              <Popover
                opened={burgerOpened}
                onDismiss={closeBurger}
                position="bottom"
                withArrow
                shadow="md"
                hideDetached={false}
              >
                <Popover.Target>
                  <Burger
                    opened={burgerOpened}
                    onClick={toggleBurger}
                    color="gray.5"
                    size="sm"
                    hiddenFrom="sm"
                  />
                </Popover.Target>
                <Popover.Dropdown>
                  {items}
                  <Group m="xs" gap="xs">
                    {actionIcons}
                  </Group>
                </Popover.Dropdown>
              </Popover>
            </Group>
          </div>
        </Container>
        <SpotlightSearch />
      </AppShell.Header>
    </>
  );
};
