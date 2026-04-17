import type { Config, Context } from "@netlify/edge-functions";

export default async function handler(req: Request, ctx: Context) {
  const accept = req.headers.get("Accept") ?? "";
  if (!accept.includes("text/markdown") && !accept.includes("text/plain")) {
    return ctx.next();
  }

  const url = new URL(req.url);
  const slug = url.pathname
    .replace(/^\/docs\//, "")
    .replace(/\/$/, "");

  if (!slug) {
    return ctx.next();
  }

  const mdUrl = new URL(`/_md/docs/${slug}.md`, url.origin);
  const res = await fetch(mdUrl);
  if (!res.ok) {
    return ctx.next();
  }

  return new Response(await res.text(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Vary": "Accept",
    },
  });
}

export const config: Config = { path: "/docs/*" };
