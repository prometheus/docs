#!/usr/bin/env tsx
// Copies each markdown source file into out/_md/docs/<slug>.md so that the
// Netlify edge function can serve raw markdown via content negotiation.
import docsCollectionJson from "../generated/docs-collection.json" with { type: "json" };
import type { DocsCollection } from "@/docs-collection-types";
import fs from "fs/promises";
import path from "path";

const collection = docsCollectionJson as DocsCollection;

for (const [slug, doc] of Object.entries(collection)) {
  const dest = path.join("out/_md/docs", slug + ".md");
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(doc.filePath, dest);
}

console.log(`Copied ${Object.keys(collection).length} markdown files to out/_md/docs/`);
