import {
  Badge,
  Group,
  Title,
  Text,
  Card,
  SimpleGrid,
  Container,
  rem,
} from "@mantine/core";
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
  // {
  //   title: "Efficient storage",
  //   description:
  //     "Prometheus stores data in an efficient custom-designed format. You can scale Prometheus by sharding, federating, or other using external integrations.",
  //   icon: IconServerBolt,
  // },
  // {
  //   title: "Alerting",
  //   description:
  //     "Alerts are defined based on Prometheus's flexible PromQL and maintain dimensional information. An alertmanager handles notifications and silencing.",
  //   icon: IconBell,
  // },
];

export function FeaturesCards() {
  const featureCards = features.map((feature) => (
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
  ));

  return (
    <Container size="lg" pb={90}>
      <SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }} spacing="xl" my={50}>
        {featureCards}
      </SimpleGrid>
      <Group justify="center" mt={120}>
        <Badge variant="filled" size="lg">
          Modern monitoring
        </Badge>
      </Group>

      <Title order={2} className={classes.title} ta="center" mt="sm">
        Monitoring for the cloud native world
      </Title>

      <Text c="dimmed" className={classes.description} ta="center" mt="md">
        Designed for the cloud native world, Prometheus integrates with
        Kubernetes and other cloud and container managers to continuously
        discover and monitor your services. It is the second project to graduate
        from the CNCF after Kubernetes.
      </Text>

      {/* <Group justify="center" mt={120}>
        <Badge variant="filled" size="lg">
          100% Open Source
        </Badge>
      </Group> */}
    </Container>
  );
}
