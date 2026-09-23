(function () {
  var SUBJECTS = [
    "Become a Guest",
    "General Comments",
    "Commercial Partnerships",
  ];

  var DIAL_CODES = [
    ["Afghanistan", "+93"],
    ["Albania", "+355"],
    ["Algeria", "+213"],
    ["Argentina", "+54"],
    ["Australia", "+61"],
    ["Austria", "+43"],
    ["Bangladesh", "+880"],
    ["Belgium", "+32"],
    ["Brazil", "+55"],
    ["Bulgaria", "+359"],
    ["Cambodia", "+855"],
    ["Canada", "+1"],
    ["Chile", "+56"],
    ["China", "+86"],
    ["Colombia", "+57"],
    ["Croatia", "+385"],
    ["Czechia", "+420"],
    ["Denmark", "+45"],
    ["Egypt", "+20"],
    ["Estonia", "+372"],
    ["Fiji", "+679"],
    ["Finland", "+358"],
    ["France", "+33"],
    ["Germany", "+49"],
    ["Ghana", "+233"],
    ["Greece", "+30"],
    ["Hong Kong", "+852"],
    ["Hungary", "+36"],
    ["Iceland", "+354"],
    ["India", "+91"],
    ["Indonesia", "+62"],
    ["Ireland", "+353"],
    ["Israel", "+972"],
    ["Italy", "+39"],
    ["Japan", "+81"],
    ["Kenya", "+254"],
    ["Latvia", "+371"],
    ["Lithuania", "+370"],
    ["Malaysia", "+60"],
    ["Mexico", "+52"],
    ["Netherlands", "+31"],
    ["New Zealand", "+64"],
    ["Nigeria", "+234"],
    ["Norway", "+47"],
    ["Pakistan", "+92"],
    ["Papua New Guinea", "+675"],
    ["Philippines", "+63"],
    ["Poland", "+48"],
    ["Portugal", "+351"],
    ["Romania", "+40"],
    ["Saudi Arabia", "+966"],
    ["Singapore", "+65"],
    ["South Africa", "+27"],
    ["South Korea", "+82"],
    ["Spain", "+34"],
    ["Sri Lanka", "+94"],
    ["Sweden", "+46"],
    ["Switzerland", "+41"],
    ["Taiwan", "+886"],
    ["Thailand", "+66"],
    ["Turkey", "+90"],
    ["Ukraine", "+380"],
    ["United Arab Emirates", "+971"],
    ["United Kingdom", "+44"],
    ["United States", "+1"],
    ["Vietnam", "+84"],
  ];

  var form = document.getElementById("contact-form");
  if (!form) return;

  var dial = form.querySelector("[name=dial]");
  var message = form.querySelector("[name=message]");
  var counter = form.querySelector(".contact-word-count");
  var status = form.querySelector(".contact-status");
  var submit = form.querySelector("[type=submit]");

  DIAL_CODES.forEach(function (item) {
    var option = document.createElement("option");
    option.value = item[1];
    option.textContent = item[0] + " " + item[1];
    dial.appendChild(option);
  });

  function wordCount(text) {
    var trimmed = String(text || "").trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
  }

  function updateCount() {
    var count = wordCount(message.value);
    counter.textContent = count + " / 300 words";
    counter.classList.toggle("is-over", count > 300);
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
    if (wordCount(payload.message) > 300) {
      showStatus("Please keep your message to 300 words.", "error");
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
