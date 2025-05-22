import { getAllPosts } from "@/blog-helpers";
import PromMarkdown from "@/components/PromMarkdown";
import TOC from "@/components/TOC";
import {
  Anchor,
  Title,
  Text,
  Card,
  Stack,
  Button,
  Box,
  Group,
} from "@mantine/core";
import dayjs from "dayjs";
import Link from "next/link";

export async function generateMetadata() {
  return {
    title: "Blog | Prometheus",
    openGraph: {
      title: "Blog | Prometheus",
      url: "https://prometheus.io/blog",
    },
  };
}

function headingSlug({ year, month, day, slug }) {
  return `${year}-${month}-${day}-${slug}`.replace(/[^A-Za-z0-9\-_]/g, "-");
}

export default function BlogPage() {
  const allPosts = getAllPosts();

  return (
    <Group wrap="nowrap" align="flex-start">
      <Stack>
        {allPosts
          .sort(
            (a, b) =>
              new Date(b.frontmatter.created_at).valueOf() -
              new Date(a.frontmatter.created_at).valueOf()
          )
          .map(({ frontmatter, excerpt, path, params }) => (
            // "overflow: unset" is needed, since otherwise "overflow: hidden"
            // on the Card breaks the scroll-margin-top of the Title / h1, and
            // the title ends up under the sticky header.
            <Card key={path} withBorder style={{ overflow: "unset" }}>
              <Anchor c="inherit" href={path}>
                <Title order={1} mt={0} mb="xs" id={headingSlug(params)}>
                  {frontmatter.title}
                </Title>
              </Anchor>
              <Text size="sm" c="dimmed" mb="xs">
                {dayjs(frontmatter.created_at).format("MMMM D, YYYY")} by{" "}
                {frontmatter.author_name}
              </Text>
              <Box className="markdown-content">
                <PromMarkdown>{excerpt}</PromMarkdown>
              </Box>

              <Button
                component={Link}
                href={path}
                variant="light"
                mt="md"
                w={{ base: "100%", xs: "fit-content" }}
              >
                Read more...
              </Button>
            </Card>
          ))}
      </Stack>
      <TOC
        maw={400}
        scrollSpyOptions={{
          selector: ".mantine-Card-root h1",
        }}
      />
    </Group>
  );
}
