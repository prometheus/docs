import { getAllPosts, getPostFileContent } from "@/blog-helpers";
import { Feed } from "feed";

import {unified} from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

import docsConfig from "../../../../docs-config";

function processPostContent(content: string): string {
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter) // Parse YAML frontmatter
    .use(remarkGfm) // GitHub Flavored Markdown
    .use(remarkRehype) // Convert Markdown to HTML
    .use(rehypeStringify); // Convert HTML to string

  const result = processor.processSync(content);
  return result.toString();
}

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

  allPosts.forEach(({ frontmatter, path, params }) => {
    // Get the content for the post and render the markdown to HTML
    const rawContent = getPostFileContent(params);
    const renderedContent = processPostContent(rawContent);

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
      content: renderedContent,
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
