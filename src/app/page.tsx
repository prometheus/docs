import NextImage from "next/image";
import { Image } from "@mantine/core";
import classes from "@/components/FeaturesCards.module.css";
import { FeaturesCards } from "@/components/FeaturesCards";
import { Hero } from "@/components/Hero";
import { UserLogos } from "@/components/UserLogos";
import { Space, Title, Group, Anchor, Text } from "@mantine/core";
import cncfLogo from "../assets/cncf-logo.svg";
import githubLogo from "../assets/github-logo.svg";

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
            alt="GitHub logo"
          />{" "}
          Open Source
        </Group>
      </Title>

      <Text c="dimmed" className={classes.description} ta="center" mt="md">
        Prometheus is 100% open source and community-driven. All components are
        available under the{" "}
        <Anchor href="http://www.apache.org/licenses/LICENSE-2.0">
          Apache 2 License
        </Anchor>{" "}
        on <Anchor href="https://github.com/prometheus">GitHub</Anchor>.
        <iframe
          src="https://ghbtns.com/github-btn.html?user=prometheus&repo=prometheus&type=star&count=true&size=large"
          scrolling="0"
          style={{
            width: 200,
            height: 30,
            margin: "auto",
            display: "block",
            marginTop: 20,
            marginBottom: 20,
            border: 0,
          }}
        ></iframe>
      </Text>

      <Title order={2} className={classes.title} mt={80}>
        <Group justify="center">Open Governance</Group>
      </Title>
      <Text c="dimmed" className={classes.description} ta="center" mt="md">
        Prometheus is a{" "}
        <Anchor href="https://cncf.io/">
          Cloud Native Computing Foundation
        </Anchor>{" "}
        graduated project.
        <Image
          component={NextImage}
          mt="md"
          m="auto"
          w="auto"
          src={cncfLogo}
          alt="CNCF logo"
          className={classes.cncfLogo}
          style={{
            objectFit: "fill",
          }}
        />
      </Text>
    </>
  );
}
