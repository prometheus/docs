import { getAllPosts } from "@/blog-helpers";
import PromMarkdown from "@/components/PromMarkdown";
import { Anchor, Title, Text, Card, Stack, Button, Box } from "@mantine/core";
import dayjs from "dayjs";
import Link from "next/link";

export default function BlogPage() {
  const allPosts = getAllPosts();

  return (
    <Stack>
      {allPosts
        .sort(
          (a, b) =>
            new Date(b.frontmatter.created_at).valueOf() -
            new Date(a.frontmatter.created_at).valueOf()
        )
        .map(({ frontmatter, excerpt, path }) => (
          <Card key={path} withBorder>
            <Anchor c="inherit" href={path}>
              <Title order={2} mt={0} mb="xs">
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
  );
}
