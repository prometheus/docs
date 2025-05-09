import { Title, Text, Button, Container } from "@mantine/core";
import { Dots } from "./Dots";
import classes from "./Hero.module.css";
import { IconDownload } from "@tabler/icons-react";

export function Hero() {
  return (
    <Container className={classes.wrapper} size={1400}>
      <Dots className={classes.dots} style={{ left: 0, top: 0 }} />
      <Dots className={classes.dots} style={{ left: 60, top: 0 }} />
      <Dots className={classes.dots} style={{ left: 0, top: 140 }} />
      <Dots className={classes.dots} style={{ right: 0, top: 60 }} />

      <div className={classes.inner}>
        {/* <Container p={0} size={800}>
          <Title className={classes.title}>
            The leading{" "}
            <Text component="span" className={classes.highlight} inherit>
              metrics and monitoring
            </Text>{" "}
            solution
          </Title>
        </Container> */}
        {/* <Container p={0} size={800}>
          <Title className={classes.title}>
            Open source{" "}
            <Text component="span" className={classes.highlight} inherit>
              metrics and monitoring
            </Text>{" "}
            for your systems and services
          </Title>
        </Container> */}
        <Container p={0} size={800}>
          <Title className={classes.title}>
            Open source{" "}
            <Text component="span" className={classes.highlight} inherit>
              metrics and monitoring
            </Text>{" "}
            for your systems and services
          </Title>
        </Container>

        <Container p={0} size={600} my="xl">
          <Text size="lg" c="dimmed" className={classes.description}>
            Monitor your applications, systems, and services with the leading
            open source monitoring solution. Instrument, collect, store, and
            query your metrics for alerting, dashboarding, and other use cases.
          </Text>
        </Container>

        <div className={classes.controls}>
          <Button className={classes.control} size="lg">
            Get started
          </Button>
          <Button
            className={classes.control}
            size="lg"
            variant="default"
            color="gray"
            leftSection={<IconDownload />}
          >
            Download
          </Button>
        </div>
      </div>
    </Container>
  );
}
