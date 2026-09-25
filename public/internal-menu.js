(function () {
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("site-menu");
  if (!toggle || !menu) return;

  function setOpen(open) {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    menu.hidden = !open;
    document.documentElement.classList.toggle("menu-open", open);
  }

  function isOpen() {
    return toggle.getAttribute("aria-expanded") === "true";
  }

  toggle.addEventListener("click", function () {
    setOpen(!isOpen());
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape" || !isOpen()) return;
    setOpen(false);
    toggle.focus();
  });
})();
