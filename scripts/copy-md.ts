#!/usr/bin/env tsx
// Copies each markdown source file into out/_md/docs/<slug>.md so that the
// Netlify edge function can serve raw markdown via content negotiation.
// Frontmatter is rewritten to strip internal fields and add canonical_url;
// repo docs also get source_url and version. A footer with the canonical URL
// is appended so consumers can find the origin without parsing frontmatter.
import docsCollectionJson from "../generated/docs-collection.json" with { type: "json" };
import type { DocsCollection } from "@/docs-collection-types";
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

const BASE_URL = "https://prometheus.io";
const collection = docsCollectionJson as DocsCollection;

for (const [slug, doc] of Object.entries(collection)) {
  const raw = await fs.readFile(doc.filePath, "utf-8");
  const { data, content } = matter(raw);

  const frontmatter: Record<string, unknown> = {
    title: data.title ?? doc.title,
    canonical_url: `${BASE_URL}/docs/${slug}/`,
  };

  if (doc.type === "repo-doc") {
    frontmatter.version = doc.version;
    frontmatter.source_url = `https://github.com/${doc.owner}/${doc.repo}/blob/${doc.version}/docs/${path.basename(doc.filePath)}`;
  }

  const footer = `\n---\n\nSource: ${frontmatter.canonical_url}\n`;
  const output = matter.stringify(content, frontmatter) + footer;

  const dest = path.join("out/_md/docs", slug + ".md");
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, output);
}

console.log(`Copied ${Object.keys(collection).length} markdown files to out/_md/docs/`);
