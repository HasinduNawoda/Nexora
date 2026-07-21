// Cloudflare Worker entry point.
//
// - Requests to /api/* are forwarded server-side to the real backend.
//   Because this runs on Cloudflare's edge (not in the browser), it can
//   call the plain-HTTP backend without hitting the browser's
//   mixed-content block, and the browser only ever talks to our own
//   HTTPS domain — so there's no CORS issue either.
// - Everything else is served as a static asset (the built React app),
//   via the ASSETS binding configured in wrangler.jsonc.

const BACKEND_ORIGIN = "http://141.148.23.179:8080";

export default {
  async fetch(request: Request, env: { ASSETS: Fetcher }): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      const backendUrl = BACKEND_ORIGIN + url.pathname + url.search;
      const isBodyless = ["GET", "HEAD"].includes(request.method);

      const response = await fetch(backendUrl, {
        method: request.method,
        headers: request.headers,
        body: isBodyless ? undefined : await request.arrayBuffer(),
      });

      return new Response(response.body, {
        status: response.status,
        headers: response.headers,
      });
    }

    return env.ASSETS.fetch(request);
  },
};
