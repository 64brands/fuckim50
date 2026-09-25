/**
 * fuckim50-preview Worker.
 * Static pages stay on the assets pipeline. /api/contact sends mail via Resend.
 */

var ALLOWED_SUBJECTS = [
  "Become a Guest",
  "General Comments",
  "Commercial Partnerships",
  "Commercial Opportunities",
  "General Enquiry",
];

var CONTACT_TO = "paul@fuckim50.show";
var CONTACT_FROM = "F*CK! I'M 50 Website <website@send.fuckim50.show>";

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

function wordCount(text) {
  var trimmed = String(text || "").trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
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
  var subject = String(body.subject).trim();
  var name = String(body.name).trim();
  var email = String(body.email).trim();
  var phone = String(body.phone).trim();
  var message = String(body.message).trim();
  var safeEmail = escapeHtml(email);

  var text = [
    "New Fi50 website enquiry",
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
    '<h1 style="margin:0 0 28px;font-size:26px;line-height:1.25;font-weight:700;color:#1a1a1a;">New Fi50 website enquiry</h1>' +
    '<p style="margin:0 0 16px;"><strong>Enquiry Type:</strong> ' +
    escapeHtml(subject) +
    "</p>" +
    '<p style="margin:0 0 16px;"><strong>Name:</strong> ' +
    escapeHtml(name) +
    "</p>" +
    '<p style="margin:0 0 16px;"><strong>Email:</strong> <a href="mailto:' +
    email.replace(/"/g, "") +
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
    subject: "Fi50 Contact — " + subject + " — " + name,
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
    if (isContactApi(url.pathname)) {
      if (!env.RESEND_API_KEY && env.CONTACT) {
        return env.CONTACT.fetch(request);
      }
      return handleContact(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
