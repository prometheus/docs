import { getAllPosts } from "@/blog-helpers";
import { Feed } from "feed";
import docsConfig from "../../../../docs-config";

export const dynamic = "force-static";
export async function GET() {
  const allPosts = getAllPosts();
  allPosts.sort(
    (a, b) =>
      new Date(b.frontmatter.created_at).valueOf() -
      new Date(a.frontmatter.created_at).valueOf()
  );

  const feed = new Feed({
    title: "Prometheus Blog",
    description: "The Prometheus blog",
    id: `${docsConfig.siteUrl}/`,
    link: `${docsConfig.siteUrl}/blog/`,
    copyright: `Prometheus Authors ${new Date().getFullYear()}`,
    language: "en",
    updated: allPosts[0].frontmatter.created_at,
    author: {
      name: "Prometheus Authors",
      link: `${docsConfig.siteUrl}/blog/`,
    },
    favicon: "TODO",
    image: "TODO",
    feedLinks: {
      atom: `${docsConfig.siteUrl}/blog/feed.xml`,
    },
  });

  allPosts.forEach(({ frontmatter, path }) => {
    feed.addItem({
      title: frontmatter.title,
      id: `${docsConfig.siteUrl}${path}`,
      link: `${docsConfig.siteUrl}${path}`,
      description: frontmatter.excerpt,
      date: new Date(frontmatter.created_at),
      published: new Date(frontmatter.created_at),
      author: [
        {
          name: frontmatter.author_name,
          link: `${docsConfig.siteUrl}/blog/`,
        },
      ],
      // TODO: Include rendered Markdown as content.
    });
  });
  const xml = feed.atom1();
  return new Response(xml, {
    headers: {
      "Content-Type": "application/atom+xml",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=59",
    },
  });
}
