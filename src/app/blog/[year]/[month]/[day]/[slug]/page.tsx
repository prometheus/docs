import { getAllPostParams, getPost } from "@/blog-helpers";
import { Box, Text, Title } from "@mantine/core";
import dayjs from "dayjs";
import PromMarkdown from "@/components/PromMarkdown";

export async function generateStaticParams() {
  return getAllPostParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string; month: string; day: string; slug: string }>;
}) {
  const { frontmatter } = getPost(await params);
  return {
    title: `${frontmatter.title} | Prometheus`,
    openGraph: {
      title: `${frontmatter.title} | Prometheus`,
      url: `https://prometheus.io/blog/${frontmatter.slug}`,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ year: string; month: string; day: string; slug: string }>;
}) {
  const { frontmatter, content } = getPost(await params);

  return (
    <Box className="markdown-content" data-pagefind-body>
      <Title order={2} mt={0} mb="xs">
        {frontmatter.title}
      </Title>
      <Text size="sm" c="dimmed" mb="xl">
        {dayjs(frontmatter.created_at).format("MMMM D, YYYY")} by{" "}
        {frontmatter.author_name}
      </Text>
      <PromMarkdown>{content}</PromMarkdown>
    </Box>
  );
}
