(function () {
  var WORD_LIMIT = 500;
  var form = document.getElementById("guest-form");
  if (!form) return;

  var message = form.querySelector("[name=message]");
  var counter = form.querySelector(".guest-word-count");
  var status = document.querySelector(".guest-status");
  var success = document.querySelector(".guest-success");
  var submit = form.querySelector("[type=submit]");

  function wordCount(text) {
    var trimmed = String(text || "").trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
  }

  function updateCount() {
    var count = wordCount(message.value);
    counter.textContent = count + " / " + WORD_LIMIT + " words";
    counter.classList.toggle("is-over", count > WORD_LIMIT);
  }

  function showStatus(text) {
    if (success) success.hidden = true;
    status.hidden = false;
    status.textContent = text;
    status.className = "guest-status is-error";
  }

  function showSuccess() {
    form.reset();
    updateCount();
    form.setAttribute("hidden", "");
    status.hidden = true;
    if (success) success.hidden = false;
    if (success && success.scrollIntoView) {
      success.scrollIntoView({ block: "nearest" });
    }
  }

  message.addEventListener("input", updateCount);
  updateCount();

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    status.hidden = true;

    var payload = {
      subject: "Become a Guest",
      name: String(form.name.value || "").trim(),
      email: String(form.email.value || "").trim(),
      phone: String(form.phone.value || "").trim(),
      message: String(form.message.value || ""),
      website: String(form.website.value || ""),
    };

    if (!payload.name) {
      showStatus("Please enter your name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      showStatus("Please enter a valid email address.");
      return;
    }
    if (!payload.phone) {
      showStatus("Please enter your phone number.");
      return;
    }
    if (!payload.message.trim()) {
      showStatus("Please enter a message.");
      return;
    }
    if (wordCount(payload.message) > WORD_LIMIT) {
      showStatus("Please keep your message to " + WORD_LIMIT + " words.");
      return;
    }

    submit.disabled = true;
    fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return { ok: response.ok && data && data.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok) {
          submit.disabled = false;
          showStatus("Something went wrong. Please try again.");
          return;
        }
        showSuccess();
      })
      .catch(function () {
        submit.disabled = false;
        showStatus("Something went wrong. Please try again.");
      });
  });
})();
