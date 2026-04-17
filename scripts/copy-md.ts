#!/usr/bin/env tsx
// Copies each markdown source file into out/_md/docs/<slug>.md so that the
// Netlify edge function can serve raw markdown via content negotiation.
// Frontmatter is rewritten to strip internal fields and add canonical_url;
// repo docs also get source_url and version. Relative and absolute /docs/
// links are resolved to full https://prometheus.io URLs. A footer with the
// canonical URL is appended so consumers can find the origin without parsing
// frontmatter.
import docsCollectionJson from "../generated/docs-collection.json" with { type: "json" };
import type { DocsCollection } from "@/docs-collection-types";
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

const BASE_URL = "https://prometheus.io";
const collection = docsCollectionJson as DocsCollection;

// Build a reverse map: resolved absolute filePath → slug.
const fileToSlug = new Map<string, string>();
for (const [slug, doc] of Object.entries(collection)) {
  fileToSlug.set(path.resolve(doc.filePath), slug);
}

function rewriteLinks(content: string, docFilePath: string): string {
  const docDir = path.dirname(path.resolve(docFilePath));

  // Match markdown links [text](url) but not images ![alt](url).
  return content.replace(/(?<!!)\[([^\]]*)\]\(([^)]+)\)/g, (match, text, url) => {
    const hashIdx = url.indexOf("#");
    const href = hashIdx === -1 ? url : url.slice(0, hashIdx);
    const fragment = hashIdx === -1 ? "" : url.slice(hashIdx);

    // External links — leave as-is.
    if (/^https?:\/\//.test(href)) return match;

    // Anchor-only links — leave as-is.
    if (!href) return match;

    // Absolute /docs/ paths — prepend base URL.
    if (href.startsWith("/docs/")) {
      return `[${text}](${BASE_URL}${href}${fragment})`;
    }

    // Other absolute paths — prepend base URL.
    if (href.startsWith("/")) {
      return `[${text}](${BASE_URL}${href}${fragment})`;
    }

    // Relative links — resolve to a slug via the reverse map.
    const resolved = path.resolve(docDir, href);
    const slug =
      fileToSlug.get(resolved) ??
      fileToSlug.get(resolved.replace(/\.md$/, "")) ??
      fileToSlug.get(resolved + ".md");

    if (slug) {
      return `[${text}](${BASE_URL}/docs/${slug}/${fragment})`;
    }

    // Unresolvable relative link — leave as-is.
    return match;
  });
}

for (const [slug, doc] of Object.entries(collection)) {
  const raw = await fs.readFile(doc.filePath, "utf-8");
  const { data, content } = matter(raw);

  const frontmatter: Record<string, unknown> = {
    title: data.title ?? doc.title,
    canonical_url: `${BASE_URL}/docs/${slug}/`,
  };

  let outdatedNotice = "";

  if (doc.type === "repo-doc") {
    frontmatter.version = doc.version;
    frontmatter.source_url = `https://github.com/${doc.owner}/${doc.repo}/blob/${doc.version}/docs/${path.basename(doc.filePath)}`;

    if (doc.version !== doc.latestVersion) {
      // Replace the version segment in the slug to build the latest URL.
      const latestSlug = slug.replace(
        `${doc.slugPrefix}/${doc.version}/`,
        `${doc.slugPrefix}/${doc.latestVersion}/`
      );
      const latestUrl = `${BASE_URL}/docs/${latestSlug}/`;
      frontmatter.outdated = true;
      frontmatter.latest_version_url = latestUrl;
      outdatedNotice =
        `> **Note:** This page documents version ${doc.version}, which is outdated. ` +
        `See the [latest stable version](${latestUrl}).\n\n`;
    }
  }

  const rewritten = rewriteLinks(content, doc.filePath);
  const footer = `\n---\n\nSource: ${frontmatter.canonical_url}\n`;
  const output = matter.stringify(outdatedNotice + rewritten, frontmatter) + footer;

  const dest = path.join("out/_md/docs", slug + ".md");
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, output);
}

console.log(`Copied ${Object.keys(collection).length} markdown files to out/_md/docs/`);
