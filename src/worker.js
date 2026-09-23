/**
 * Minimal Worker runtime for fuckim50-preview.
 * Static pages stay on the assets pipeline. Only /api/* is intercepted.
 */

function isContactApi(pathname) {
  return pathname === "/api/contact" || pathname === "/api/contact/";
}

function json(body, status, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: Object.assign(
      { "Content-Type": "application/json" },
      extraHeaders || {}
    ),
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (isContactApi(url.pathname)) {
      if (request.method !== "POST") {
        return json(
          { ok: false, error: "method-not-allowed" },
          405,
          { Allow: "POST" }
        );
      }

      return json({ ok: true, status: "contact-api-ready" }, 200);
    }

    return env.ASSETS.fetch(request);
  },
};
