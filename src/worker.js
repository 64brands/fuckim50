/**
 * fuckim50-preview Worker.
 * Static pages stay on the assets pipeline. /api/contact sends mail via Resend.
 */

var ALLOWED_SUBJECTS = [
  "Become a Guest",
  "General Comments",
  "Commercial Partnerships",
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
  if (wordCount(message) > 300) {
    return "message-too-long";
  }
  return null;
}

function buildEmail(body) {
  var submitted = new Date().toISOString();
  var subject = String(body.subject).trim();
  var name = String(body.name).trim();
  var email = String(body.email).trim();
  var phone = String(body.phone).trim();
  var message = String(body.message).trim();

  var text = [
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
    "<p><strong>Enquiry Type:</strong> " +
    escapeHtml(subject) +
    "</p>" +
    "<p><strong>Name:</strong> " +
    escapeHtml(name) +
    "</p>" +
    "<p><strong>Email:</strong> " +
    escapeHtml(email) +
    "</p>" +
    "<p><strong>Phone:</strong> " +
    escapeHtml(phone) +
    "</p>" +
    "<p><strong>Message:</strong></p>" +
    "<p>" +
    escapeHtml(message).replace(/\n/g, "<br>") +
    "</p>" +
    "<p><strong>Submitted:</strong> " +
    escapeHtml(submitted) +
    "</p>";

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
      return handleContact(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
