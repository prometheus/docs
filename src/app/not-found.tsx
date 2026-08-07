import { Button, Center, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";
import { getPageMetadata } from "@/page-metadata";

export const metadata = getPageMetadata({
  pageTitle: "Page not found",
  pageDescription: "The page you requested could not be found.",
  pagePath: "/404",
});

export default function NotFound() {
  return (
    <Center mih="50vh">
      <Stack align="center" gap="md" maw={600}>
        <Title order={1} ta="center">
          Page not found
        </Title>
        <Text c="dimmed" ta="center">
          The page you requested does not exist or may have moved. Try the
          latest Prometheus documentation or return to the home page.
        </Text>
        <Stack gap="xs" align="center">
          <Button component={Link} href="/docs/introduction/overview">
            Go to the latest documentation
          </Button>
          <Button component={Link} href="/" variant="subtle">
            Return to Prometheus
          </Button>
        </Stack>
      </Stack>
    </Center>
  );
}
