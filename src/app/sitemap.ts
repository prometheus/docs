import fs from "fs";
import path from "path";
import { MetadataRoute } from "next";
import { docsCollection } from "@/docs-collection";
import { getAllPostFileNames, postFileNameToPath } from "@/blog-helpers";
import docsConfig from "../../docs-config";

export const dynamic = "force-static";

function getStaticAppRoutes(): string[] {
  const appDir = path.join(process.cwd(), "src/app");
  const routes: string[] = [];

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.includes("[")) {
          walk(fullPath);
        }
      } else if (entry.name === "page.tsx" || entry.name === "page.ts") {
        const rel = path.relative(appDir, dir);
        routes.push(rel === "" ? "/" : `/${rel}/`);
      }
    }
  }

  walk(appDir);
  return routes;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = docsConfig.siteUrl;

  const staticEntries: MetadataRoute.Sitemap = getStaticAppRoutes().map(
    (route) => ({ url: `${base}${route}` })
  );

  const docsEntries: MetadataRoute.Sitemap = Object.values(docsCollection)
    .filter((doc) => {
      if (doc.type === "local-doc") {
        return true;
      }
      if (doc.version === doc.latestVersion) {
        return true;
      }
      return docsConfig.ltsVersions[doc.repo]?.includes(doc.version) ?? false;
    })
    .map((doc) => ({ url: `${base}/docs/${doc.slug}/` }));

  const blogEntries: MetadataRoute.Sitemap = getAllPostFileNames().map(
    (fileName) => ({
      url: `${base}${postFileNameToPath(fileName)}`,
    })
  );

  return [...staticEntries, ...docsEntries, ...blogEntries];
}
