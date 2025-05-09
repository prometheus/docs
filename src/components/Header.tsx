import { Group, Burger, rem, Text, Container, TextInput } from "@mantine/core";
import Image from "next/image";
import { useDisclosure } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import prometheusLogo from "../assets/prometheus-logo.svg";
import classes from "./Header.module.css";
import { FC } from "react";
import githubLogo from "../assets/github-logo.svg";
import Link from "next/link";

const links = [
  { link: "/docs/introduction/overview", label: "Docs" },
  { link: "/download", label: "Download" },
  { link: "/community", label: "Community" },
  { link: "/support-training", label: "Support & Training" },
  { link: "/blog", label: "Blog" },
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
      <Container size="lg">
        <div className={classes.inner}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <Group>
              <Image src={prometheusLogo} height={32} alt="Prometheus logo" />
              <Text fz={25} ff="Lato Light" c="white">
                Prometheus
              </Text>
            </Group>
          </Link>

          <Group align="center">
            <Group ml={50} gap={5} className={classes.links} visibleFrom="sm">
              {items}
            </Group>

            <TextInput
              className={classes.search}
              placeholder="Search"
              w={250}
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
                  c="dark.1"
                  //   bg="#394855"
                  bg="#56697a"
                  lh={1}
                  style={{ borderRadius: "0.25em" }}
                >
                  Ctrl + K
                </Text>
              }
              rightSectionWidth="fit-content"
              visibleFrom="xs"
              styles={{
                input: {
                  background: "#394855",
                  borderColor: "transparent",
                  color: "white",
                },
              }}
            />

            <a href="https://github.com/prometheus" target="_blank">
              <Image
                src={githubLogo}
                style={{
                  height: 20,
                  width: 20,
                  filter: "invert(1)",
                  verticalAlign: "middle",
                }}
                alt="GitHub Logo"
              />
            </a>
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
    </header>
  );
};
