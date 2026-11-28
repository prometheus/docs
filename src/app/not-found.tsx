import { Anchor, Button, Group, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";

export const metadata = {
  title: "404 – Page Not Found | Prometheus",
};

export default function NotFound() {
  return (
    <Stack align="center" justify="center" gap="lg" py={80}>
      <Title order={1} fz={80} fw={900} c="dimmed">
        404
      </Title>
      <Title order={2}>Page Not Found</Title>
      <Text c="dimmed" ta="center" maw={520}>
        The page you are looking for doesn&apos;t exist or may have been moved.
        Try one of the links below, or search on{" "}
        <Anchor href="https://prometheus.io" target="_blank" rel="noreferrer">
          prometheus.io
        </Anchor>
        .
      </Text>

      <Group mt="md" justify="center" wrap="wrap">
        <Button component={Link} href="/" variant="filled">
          Home
        </Button>
        <Button
          component={Link}
          href="/docs/prometheus/latest/"
          variant="light"
        >
          Docs
        </Button>
        <Button
          component={Link}
          href="/docs/prometheus/latest/getting_started/"
          variant="light"
        >
          Getting Started
        </Button>
        <Button
          component="a"
          href="https://github.com/prometheus/prometheus/issues"
          target="_blank"
          rel="noreferrer"
          variant="subtle"
        >
          GitHub Issues
        </Button>
      </Group>
    </Stack>
  );
}
