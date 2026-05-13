import { Title, Text, Button, Container, Group } from "@mantine/core";
import { Dots } from "./Dots";
import classes from "./Hero.module.css";
import { IconDownload } from "@tabler/icons-react";
import Link from "next/link";
import React from "react";

// Based on the design at https://ui.mantine.dev/category/hero/#hero-text.
export function Hero() {
  return (
    <Container className={classes.wrapper} size={1400} px={0}>
      <Dots className={classes.dots} style={{ left: 0, top: 0 }} />
      <Dots className={classes.dots} style={{ left: 60, top: 0 }} />
      <Dots className={classes.dots} style={{ left: 0, top: 140 }} />
      <Dots className={classes.dots} style={{ right: 0, top: 60 }} />

      <div className={classes.inner}>
        <Title className={classes.title}>
          Open source{" "}
          <Text component="span" className={classes.highlight} inherit>
            metrics and monitoring
          </Text>{" "}
          for your systems and services
        </Title>

        <Text c="dimmed" className={classes.description}>
          Monitor your applications, systems, and services with the leading open
          source monitoring solution. Instrument, collect, store, and query your
          metrics for alerting, dashboarding, and other use cases.
        </Text>

        <Group gap="md" justify="center" className={classes.buttons}>
          {[
            { size: "lg", hiddenFrom: "md" },
            { size: "xl", visibleFrom: "md", mt: "xs" },
          ].map((props) => (
            <React.Fragment key={props.size}>
              <Button
                component={Link}
                href="/docs/prometheus/latest/getting_started/"
                w={{ base: "100%", xs: "fit-content" }}
                {...props}
              >
                Get started
              </Button>
              <Button
                component={Link}
                href="/download/"
                variant="default"
                color="gray"
                w={{ base: "100%", xs: "fit-content" }}
                leftSection={<IconDownload />}
                {...props}
              >
                Download
              </Button>
            </React.Fragment>
          ))}
        </Group>
      </div>
    </Container>
  );
}
