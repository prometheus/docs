import { Text, Card, SimpleGrid, Container, rem } from "@mantine/core";
import {
  IconGauge,
  IconChartGridDots,
  IconDatabaseSearch,
  IconBell,
  IconRun,
  IconAffiliate,
} from "@tabler/icons-react";
import classes from "./FeaturesCards.module.css";
import Link from "next/link";

const features = [
  {
    title: "Dimensional data model",
    description:
      "Prometheus models time series in a flexible dimensional data model. Time series are identified by a metric name and a set of key-value pairs.",
    icon: IconChartGridDots,
    link: "/docs/concepts/data_model/",
  },
  {
    title: "Powerful queries",
    description:
      "The PromQL query language allows you to query, correlate, and transform your time series data in powerful ways for visualizations, alerts, and more.",
    icon: IconDatabaseSearch,
    link: "/docs/prometheus/latest/querying/basics/",
  },
  {
    title: "Precise alerting",
    description:
      "Alerting rules are based on PromQL and make full use of the dimensional data model. A separate Alertmanager component handles notifications and silencing.",
    icon: IconBell,
    link: "/docs/alerting/latest/overview/",
  },
  {
    title: "Simple operation",
    description:
      "Prometheus servers operate independently and only rely on local storage. Developed in Go, the statically linked binaries are easy to deploy across various environments.",
    icon: IconRun,
    // TODO: Find a better link - the complex configuration page is
    // not a good a good advertisement for simplicity.
    link: "/docs/prometheus/latest/configuration/configuration/",
  },
  {
    title: "Instrumentation libraries",
    description:
      "Prometheus provides a large number of official and community-contributed metrics instrumentation libraries that cover most major languages.",
    icon: IconGauge,
    link: "/docs/instrumenting/clientlibs/",
  },
  {
    title: "Ubiquitous integrations",
    description:
      "Prometheus comes with hundreds of official and community-contributed integrations that allow you to easily extract metrics from existing systems.",
    icon: IconAffiliate,
    link: "/docs/instrumenting/exporters/",
  },
];

// Based on the design at https://ui.mantine.dev/category/features/#features-cards
export function FeaturesCards() {
  return (
    <Container size="lg" px={0}>
      <SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }} spacing="xl">
        {features.map((feature) => (
          <Card
            key={feature.title}
            component={Link}
            href={feature.link}
            shadow="md"
            radius="md"
            className={classes.card}
            padding="xl"
          >
            <feature.icon
              style={{ width: rem(40), height: rem(40) }}
              stroke={1.5}
              color="var(--mantine-primary-color-filled)"
            />
            <Text fz="lg" fw={500} className={classes.cardTitle} mt="md">
              {feature.title}
            </Text>
            <Text fz="sm" c="dimmed" mt="sm">
              {feature.description}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
}
