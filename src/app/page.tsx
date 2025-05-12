import NextImage from "next/image";
import { Box, Image } from "@mantine/core";
import classes from "@/components/FeaturesCards.module.css";
import { FeaturesCards } from "@/components/FeaturesCards";
import { Hero } from "@/components/Hero";
import { UserLogos } from "@/components/UserLogos";
import { Space, Title, Group, Anchor, Text } from "@mantine/core";
import cncfLogoLightMode from "../assets/cncf-logo.svg";
import cncfLogoDarkMode from "../assets/cncf-logo-white.svg";
import githubLogo from "../assets/github-logo.svg";
import { GitHubStars } from "@/components/GitHubStars";

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturesCards />
      <UserLogos />
      <Space h="xl" mb={50} />
      <Title order={2} className={classes.title} mt="sm">
        <Group justify="center">
          <Image
            component={NextImage}
            src={githubLogo}
            style={{ height: 40, width: 40 }}
            className="invertInDarkMode"
            alt="GitHub logo"
          />{" "}
          Open Source
        </Group>
      </Title>

      <Box className={classes.description}>
        <Text c="dimmed" ta="center" mt="md">
          Prometheus is 100% open source and community-driven. All components
          are available under the{" "}
          <Anchor href="http://www.apache.org/licenses/LICENSE-2.0">
            Apache 2 License
          </Anchor>{" "}
          on <Anchor href="https://github.com/prometheus">GitHub</Anchor>.
        </Text>
        <GitHubStars />
      </Box>

      <Box className={classes.description}>
        <Title order={2} className={classes.title} mt={80}>
          <Group justify="center">Open Governance</Group>
        </Title>
        <Text c="dimmed" ta="center" mt="md">
          Prometheus is a{" "}
          <Anchor href="https://cncf.io/">
            Cloud Native Computing Foundation
          </Anchor>{" "}
          graduated project.
        </Text>
        <Box mt="md">
          <a href="https://cncf.io/" target="_blank">
            <Image
              darkHidden
              component={NextImage}
              src={cncfLogoLightMode}
              alt="CNCF logo"
              style={{
                objectFit: "fill",
              }}
            />

            <Image
              lightHidden
              component={NextImage}
              src={cncfLogoDarkMode}
              alt="CNCF logo"
              style={{
                objectFit: "fill",
                opacity: 0.8,
              }}
            />
          </a>
        </Box>
      </Box>
    </>
  );
}
