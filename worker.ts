// Cloudflare Worker entry point.
//
// - Requests to /api/* are forwarded server-side to the real backend.
//   Because this runs on Cloudflare's edge (not in the browser), it can
//   call the plain-HTTP backend without hitting the browser's
//   mixed-content block, and the browser only ever talks to our own
//   HTTPS domain — so there's no CORS issue either.
// - Everything else is served as a static asset (the built React app),
//   via the ASSETS binding configured in wrangler.jsonc.

const BACKEND_ORIGIN = "http://141-148-23-179.nip.io:8080";

// Update this if the site is ever moved to a different domain.
const SITE_ORIGIN = "https://nexora.hasindunawoda78.workers.dev";

interface BackendArticle {
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  date: string; // ISO date
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function buildSitemap(): Promise<string> {
  const staticUrls = ["", "about", "privacy", "terms"];

  let articleUrls: string[] = [];
  try {
    const res = await fetch(`${BACKEND_ORIGIN}/api/articles`);
    if (res.ok) {
      const articles: BackendArticle[] = await res.json();
      articleUrls = articles
        .filter((a) => a.status === "PUBLISHED")
        .map((a) => `articles/${a.slug}`);
    }
  } catch {
    // If the backend is briefly unreachable, still serve a sitemap with
    // the static pages rather than failing the whole request.
  }

  const allPaths = [...staticUrls, ...articleUrls];
  const urlEntries = allPaths
    .map((path) => `  <url><loc>${xmlEscape(`${SITE_ORIGIN}/${path}`)}</loc></url>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>\n`;
}

const ROBOTS_TXT = `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`;

export default {
  async fetch(request: Request, env: { ASSETS: Fetcher }): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/robots.txt") {
      return new Response(ROBOTS_TXT, {
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    if (url.pathname === "/sitemap.xml") {
      const sitemap = await buildSitemap();
      return new Response(sitemap, {
        headers: {
          "content-type": "application/xml; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    if (url.pathname.startsWith("/api/")) {
      const backendUrl = BACKEND_ORIGIN + url.pathname + url.search;
      const isBodyless = ["GET", "HEAD"].includes(request.method);

      // Forward headers server-to-server, but drop the browser-context
      // headers that leak the Worker's own origin into the request.
      // Spring's CORS filter checks Origin on every request (not just
      // preflight OPTIONS) and rejects anything not in its allow-list —
      // since this hop is edge-to-backend, not browser-to-backend, the
      // backend never needs to see it.
      const forwardHeaders = new Headers(request.headers);
      forwardHeaders.delete("origin");
      forwardHeaders.delete("referer");

      const response = await fetch(backendUrl, {
        method: request.method,
        headers: forwardHeaders,
        body: isBodyless ? undefined : await request.arrayBuffer(),
      });

      // Same idea in reverse: don't blindly relay the backend's raw
      // response headers back to the browser (e.g. any CORS headers
      // scoped to localhost, or hop-by-hop headers), since the browser
      // is talking to our own HTTPS origin and doesn't need them.
      const responseHeaders = new Headers(response.headers);
      responseHeaders.delete("access-control-allow-origin");
      responseHeaders.delete("access-control-allow-credentials");

      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    return env.ASSETS.fetch(request);
  },
};
