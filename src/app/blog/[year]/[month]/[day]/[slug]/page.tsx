import { getAllPostParams, getPost } from "@/blog-helpers";
import { Box, Text, Title } from "@mantine/core";
import dayjs from "dayjs";
import PromMarkdown from "@/components/PromMarkdown";
import { getPageMetadata } from "@/page-metadata";

export async function generateStaticParams() {
  return getAllPostParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string; month: string; day: string; slug: string }>;
}) {
  const { year, month, day, slug } = await params;
  const { frontmatter } = getPost(await params);
  const excerpt = frontmatter.excerpt
    ? frontmatter.excerpt.length > 160
      ? frontmatter.excerpt.substring(0, 157) + "..."
      : frontmatter.excerpt
    : "";

  return getPageMetadata({
    pageTitle: `${frontmatter.title}`,
    pageDescription: excerpt,
    pagePath: `/blog/${year}/${month}/${day}/${slug}/`,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ year: string; month: string; day: string; slug: string }>;
}) {
  const { frontmatter, content } = getPost(await params);

  return (
    <Box data-pagefind-body>
      <Title order={1} mt={0} mb="xs">
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
