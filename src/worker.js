/**
 * Production Worker (fuckim50) for im50show.com.
 * Runs first on every request so the other domains can redirect to im50show.com.
 * Static pages are then served from the assets pipeline. /api/contact sends mail via Resend.
 */

var ALLOWED_SUBJECTS = [
  "Become a Guest",
  "General Comments",
  "Commercial Partnerships",
  "Commercial Opportunities",
  "General Enquiry",
];

var CONTACT_TO = "paul@64.com.au";
// All enquiries go to Paul's master inbox. Sent from the shared 64 Brands Resend domain.
var CONTACT_FROM = "\"The I'M 50! Show\" <noreply@send.64.com.au>";

function isContactApi(pathname) {
  return pathname === "/api/contact" || pathname === "/api/contact/";
}

function isRetiredThingsPath(pathname) {
  return (
    pathname === "/things-im-doing" ||
    pathname === "/things-im-doing/" ||
    pathname.indexOf("/things-im-doing/") === 0
  );
}

// im50show.com is the main address. The old show domains (and any www.)
// are still attached to this Worker and 301-redirect here, keeping the path.
var CANONICAL_HOST = "im50show.com";
var REDIRECT_HOSTS = [
  "www.im50show.com",
  "theim50show.com",
  "www.theim50show.com",
  "fi50.show",
  "www.fi50.show",
  "fuckim50.show",
  "www.fuckim50.show",
];

function shouldRedirectHost(hostname) {
  return REDIRECT_HOSTS.indexOf(String(hostname || "").toLowerCase()) !== -1;
}

function canonicalUrl(url, pathname) {
  var target = new URL(url.toString());
  target.protocol = "https:";
  target.hostname = CANONICAL_HOST;
  target.port = "";
  if (pathname) {
    target.pathname = pathname;
    target.search = "";
  }
  return target.toString();
}

// Browsers keep this redirect for an hour only, so a future address change can't get stuck.
function redirect(location) {
  return new Response(null, {
    status: 301,
    headers: { Location: location, "Cache-Control": "public, max-age=3600" },
  });
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

function wordCount(text) {
  var trimmed = String(text || "").trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function headerSafe(value) {
  return String(value || "")
    .replace(/[\0\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function validateContact(body) {
  if (!body || typeof body !== "object") {
    return "invalid-request";
  }
  if (String(body.website || "").trim() !== "") {
    return "ignored";
  }
  if (ALLOWED_SUBJECTS.indexOf(String(body.subject || "").trim()) === -1) {
    return "invalid-subject";
  }
  if (!String(body.name || "").trim()) {
    return "invalid-name";
  }
  if (!isEmail(body.email)) {
    return "invalid-email";
  }
  if (!String(body.phone || "").trim()) {
    return "invalid-phone";
  }
  var message = String(body.message || "");
  if (!message.trim()) {
    return "invalid-message";
  }
  if (wordCount(message) > 500) {
    return "message-too-long";
  }
  return null;
}

function formatSubmittedAest(date) {
  var parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).formatToParts(date);
  var get = function (type) {
    var found = parts.filter(function (part) {
      return part.type === type;
    })[0];
    return found ? found.value : "";
  };
  var month = get("month").replace("Sept", "Sep");
  var period = get("dayPeriod").toLowerCase();
  return (
    get("day") +
    " " +
    month +
    " " +
    get("year") +
    ", " +
    get("hour") +
    ":" +
    get("minute") +
    " " +
    period +
    " " +
    get("timeZoneName")
  );
}

function buildEmail(body) {
  var submitted = formatSubmittedAest(new Date());
  var subject = headerSafe(body.subject);
  var name = headerSafe(body.name);
  var email = headerSafe(body.email);
  var phone = headerSafe(body.phone);
  var message = String(body.message).trim();
  var safeEmail = escapeHtml(email);

  var text = [
    "New I'M 50! Show website enquiry",
    "",
    "Enquiry Type: " + subject,
    "Name: " + name,
    "Email: " + email,
    "Phone: " + phone,
    "",
    "Message:",
    message,
    "",
    "Submitted: " + submitted,
  ].join("\n");

  var html =
    '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f5f5;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f5;">' +
    '<tr><td align="center" style="padding:32px 16px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:740px;background:#ffffff;border-radius:16px;">' +
    '<tr><td style="padding:40px 40px 36px;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;font-size:16px;line-height:1.5;color:#1a1a1a;">' +
    '<h1 style="margin:0 0 28px;font-size:26px;line-height:1.25;font-weight:700;color:#1a1a1a;">New I&#39;M 50! Show website enquiry</h1>' +
    '<p style="margin:0 0 16px;"><strong>Enquiry Type:</strong> ' +
    escapeHtml(subject) +
    "</p>" +
    '<p style="margin:0 0 16px;"><strong>Name:</strong> ' +
    escapeHtml(name) +
    "</p>" +
    '<p style="margin:0 0 16px;"><strong>Email:</strong> <a href="mailto:' +
    encodeURIComponent(email).replace(/%40/g, "@") +
    '" style="color:#017efe;text-decoration:underline;">' +
    safeEmail +
    "</a></p>" +
    '<p style="margin:0 0 16px;"><strong>Phone:</strong> ' +
    escapeHtml(phone) +
    "</p>" +
    '<p style="margin:0 0 8px;"><strong>Message:</strong></p>' +
    '<p style="margin:0 0 16px;">' +
    escapeHtml(message).replace(/\n/g, "<br>") +
    "</p>" +
    '<p style="margin:0;"><strong>Submitted:</strong> ' +
    escapeHtml(submitted) +
    "</p>" +
    "</td></tr></table></td></tr></table></body></html>";

  return {
    from: CONTACT_FROM,
    to: [CONTACT_TO],
    reply_to: email,
    subject: "I'M 50! Show Contact — " + subject + " — " + name,
    text: text,
    html: html,
  };
}

async function handleContact(request, env) {
  if (request.method !== "POST") {
    return json(
      { ok: false, error: "method-not-allowed" },
      405,
      { Allow: "POST" }
    );
  }

  var body;
  try {
    body = await request.json();
  } catch (err) {
    return json({ ok: false, error: "invalid-request" }, 400);
  }

  var problem = validateContact(body);
  if (problem === "ignored") {
    return json({ ok: true }, 200);
  }
  if (problem) {
    return json({ ok: false, error: problem }, 400);
  }

  if (!env.RESEND_API_KEY) {
    return json({ ok: false, error: "send-failed" }, 500);
  }

  var resendResponse;
  try {
    resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + env.RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildEmail(body)),
    });
  } catch (err) {
    return json({ ok: false, error: "send-failed" }, 500);
  }

  if (!resendResponse.ok) {
    return json({ ok: false, error: "send-failed" }, 500);
  }

  return json({ ok: true }, 200);
}

export default {
  async fetch(request, env) {
    var url = new URL(request.url);
    // The contact API answers on every attached domain, so nothing posts into a redirect.
    if (isContactApi(url.pathname)) {
      return handleContact(request, env);
    }
    var oldHost = shouldRedirectHost(url.hostname);
    if (isRetiredThingsPath(url.pathname)) {
      var guest = oldHost ? canonicalUrl(url, "/guest/") : new URL("/guest/", url.origin).toString();
      return redirect(guest);
    }
    if (oldHost) {
      return redirect(canonicalUrl(url));
    }
    return env.ASSETS.fetch(request);
  },
};
