import {
  Group,
  Burger,
  rem,
  Text,
  Container,
  TextInput,
  ActionIcon,
} from "@mantine/core";
import Image from "next/image";
import { useDisclosure } from "@mantine/hooks";
import {
  IconDashboard,
  IconFileText,
  IconHome,
  IconSearch,
} from "@tabler/icons-react";
import prometheusLogo from "../assets/prometheus-logo.svg";
import classes from "./Header.module.css";
import { FC } from "react";
import githubLogo from "../assets/github-logo.svg";
import Link from "next/link";
import { ThemeSelector } from "./ThemeSelector";
import { Spotlight, SpotlightActionData, spotlight } from "@mantine/spotlight";

const links = [
  { link: "/docs/introduction/overview", label: "Docs" },
  { link: "/download", label: "Download" },
  { link: "/community", label: "Community" },
  { link: "/support-training", label: "Support & Training" },
  { link: "/blog", label: "Blog" },
];

const actions: SpotlightActionData[] = [
  {
    id: "home",
    label: "Home",
    description: "Get to home page",
    onClick: () => console.log("Home"),
    leftSection: <IconHome size={24} stroke={1.5} />,
  },
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Get full information about current system status",
    onClick: () => console.log("Dashboard"),
    leftSection: <IconDashboard size={24} stroke={1.5} />,
  },
  {
    id: "documentation",
    label: "Documentation",
    description: "Visit documentation to lean more about all features",
    onClick: () => console.log("Documentation"),
    leftSection: <IconFileText size={24} stroke={1.5} />,
  },
];

export const Header: FC = () => {
  const [opened, { toggle }] = useDisclosure(false);

  const items = links.map((link) => (
    <Link key={link.label} href={link.link} className={classes.link}>
      {link.label}
    </Link>
  ));

  return (
    <header className={classes.header}>
      <Container size="xl">
        <div className={classes.inner}>
          {/* Logo + Text */}
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Group wrap="nowrap" align="center">
              <Image src={prometheusLogo} height={32} alt="Prometheus logo" />
              <Text
                fz={25}
                ff="Lato Light"
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
              {/* <a href="https://github.com/prometheus" target="_blank">
                <Image
                  src={githubLogo}
                  style={{
                    height: 20,
                    width: 20,
                    opacity: 0.9,
                    verticalAlign: "middle",
                  }}
                  className="invertInDarkMode"
                  alt="GitHub Logo"
                />
              </a> */}
            </Group>
            <Burger
              opened={opened}
              onClick={toggle}
              color="gray.3"
              size="sm"
              hiddenFrom="sm"
            />
          </Group>
        </div>
      </Container>
      <Spotlight
        actions={actions}
        nothingFound="Nothing found..."
        highlightQuery
        searchProps={{
          leftSection: <IconSearch size={20} stroke={1.5} />,
          placeholder: "Search...",
        }}
      />
    </header>
  );
};
