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

export default {
  async fetch(request: Request, env: { ASSETS: Fetcher }): Promise<Response> {
    const url = new URL(request.url);

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
