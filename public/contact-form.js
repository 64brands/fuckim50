(function () {
  var SUBJECTS = [
    "Become a Guest",
    "General Comments",
    "Commercial Partnerships",
  ];

  var DIAL_CODES = [
    ["Afghanistan", "+93", "AF"],
    ["Albania", "+355", "AL"],
    ["Algeria", "+213", "DZ"],
    ["Argentina", "+54", "AR"],
    ["Australia", "+61", "AU"],
    ["Austria", "+43", "AT"],
    ["Bangladesh", "+880", "BD"],
    ["Belgium", "+32", "BE"],
    ["Brazil", "+55", "BR"],
    ["Bulgaria", "+359", "BG"],
    ["Cambodia", "+855", "KH"],
    ["Canada", "+1", "CA"],
    ["Chile", "+56", "CL"],
    ["China", "+86", "CN"],
    ["Colombia", "+57", "CO"],
    ["Croatia", "+385", "HR"],
    ["Czechia", "+420", "CZ"],
    ["Denmark", "+45", "DK"],
    ["Egypt", "+20", "EG"],
    ["Estonia", "+372", "EE"],
    ["Fiji", "+679", "FJ"],
    ["Finland", "+358", "FI"],
    ["France", "+33", "FR"],
    ["Germany", "+49", "DE"],
    ["Ghana", "+233", "GH"],
    ["Greece", "+30", "GR"],
    ["Hong Kong", "+852", "HK"],
    ["Hungary", "+36", "HU"],
    ["Iceland", "+354", "IS"],
    ["India", "+91", "IN"],
    ["Indonesia", "+62", "ID"],
    ["Ireland", "+353", "IE"],
    ["Israel", "+972", "IL"],
    ["Italy", "+39", "IT"],
    ["Japan", "+81", "JP"],
    ["Kenya", "+254", "KE"],
    ["Latvia", "+371", "LV"],
    ["Lithuania", "+370", "LT"],
    ["Malaysia", "+60", "MY"],
    ["Mexico", "+52", "MX"],
    ["Netherlands", "+31", "NL"],
    ["New Zealand", "+64", "NZ"],
    ["Nigeria", "+234", "NG"],
    ["Norway", "+47", "NO"],
    ["Pakistan", "+92", "PK"],
    ["Papua New Guinea", "+675", "PG"],
    ["Philippines", "+63", "PH"],
    ["Poland", "+48", "PL"],
    ["Portugal", "+351", "PT"],
    ["Romania", "+40", "RO"],
    ["Saudi Arabia", "+966", "SA"],
    ["Singapore", "+65", "SG"],
    ["South Africa", "+27", "ZA"],
    ["South Korea", "+82", "KR"],
    ["Spain", "+34", "ES"],
    ["Sri Lanka", "+94", "LK"],
    ["Sweden", "+46", "SE"],
    ["Switzerland", "+41", "CH"],
    ["Taiwan", "+886", "TW"],
    ["Thailand", "+66", "TH"],
    ["Turkey", "+90", "TR"],
    ["Ukraine", "+380", "UA"],
    ["United Arab Emirates", "+971", "AE"],
    ["United Kingdom", "+44", "GB"],
    ["United States", "+1", "US"],
    ["Vietnam", "+84", "VN"],
  ];

  var form = document.getElementById("contact-form");
  if (!form) return;

  var dial = form.querySelector("[name=dial]");
  var message = form.querySelector("[name=message]");
  var counter = form.querySelector(".contact-word-count");
  var status = document.querySelector(".contact-status");
  var submit = form.querySelector("[type=submit]");

  function flagEmoji(iso) {
    return iso
      .toUpperCase()
      .replace(/./g, function (char) {
        return String.fromCodePoint(127397 + char.charCodeAt(0));
      });
  }

  function selectedCountryName() {
    var selected = dial.options[dial.selectedIndex];
    return selected && selected.getAttribute("data-country")
      ? selected.getAttribute("data-country")
      : "";
  }

  function updateDialLabel() {
    var country = selectedCountryName();
    var code = String(dial.value || "").trim();
    dial.setAttribute(
      "aria-label",
      country ? "Country dial code, " + country + " " + code : "Country dial code"
    );
  }

  DIAL_CODES.forEach(function (item) {
    var option = document.createElement("option");
    option.value = item[1];
    option.textContent = flagEmoji(item[2]) + " " + item[1];
    option.setAttribute("data-country", item[0]);
    option.setAttribute("aria-label", item[0] + " " + item[1]);
    dial.appendChild(option);
  });
  dial.addEventListener("change", updateDialLabel);
  updateDialLabel();

  function wordCount(text) {
    var trimmed = String(text || "").trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
  }

  function updateCount() {
    var count = wordCount(message.value);
    counter.textContent = count + " / 500 words";
    counter.classList.toggle("is-over", count > 500);
  }

  function showStatus(text, kind) {
    status.hidden = false;
    status.textContent = text;
    status.className = "contact-status is-" + kind;
  }

  function combinePhone() {
    var code = String(dial.value || "").trim();
    var number = String(form.phone.value || "").trim();
    if (!code || !number) return "";
    if (number.charAt(0) === "+") return number;
    return code + " " + number;
  }

  message.addEventListener("input", updateCount);
  updateCount();

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    status.hidden = true;

    var payload = {
      subject: String(form.subject.value || "").trim(),
      name: String(form.name.value || "").trim(),
      email: String(form.email.value || "").trim(),
      phone: combinePhone(),
      message: String(form.message.value || ""),
      website: String(form.website.value || ""),
    };

    if (SUBJECTS.indexOf(payload.subject) === -1) {
      showStatus("Please choose a subject.", "error");
      return;
    }
    if (!payload.name) {
      showStatus("Please enter your name.", "error");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      showStatus("Please enter a valid email address.", "error");
      return;
    }
    if (!payload.phone) {
      showStatus("Please enter your phone number.", "error");
      return;
    }
    if (!payload.message.trim()) {
      showStatus("Please enter a message.", "error");
      return;
    }
    if (wordCount(payload.message) > 500) {
      showStatus("Please keep your message to 500 words.", "error");
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
          showStatus("Something went wrong. Please try again.", "error");
          return;
        }
        form.reset();
        updateCount();
        form.setAttribute("hidden", "");
        showStatus("Message sent. Thanks — I’ll get back to you.", "success");
      })
      .catch(function () {
        submit.disabled = false;
        showStatus("Something went wrong. Please try again.", "error");
      });
  });
})();
