/* *Conditions Apply — shared behaviour: mobile menu + hero slider. */
(function () {
  /* ---------------------------------------------------------------------- */
  /* Mobile menu                                                            */
  /* ---------------------------------------------------------------------- */
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("site-menu");

  if (toggle && menu) {
    var label = toggle.querySelector(".menu-toggle-label");

    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (label) label.textContent = open ? "Close" : "Menu";
      menu.hidden = !open;
      document.documentElement.classList.toggle("menu-open", open);
    };

    var isOpen = function () {
      return toggle.getAttribute("aria-expanded") === "true";
    };

    toggle.addEventListener("click", function () {
      setOpen(!isOpen());
    });

    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || !isOpen()) return;
      setOpen(false);
      toggle.focus();
    });

    var wide = window.matchMedia("(min-width: 900px)");
    var onWide = function () {
      if (wide.matches && isOpen()) setOpen(false);
    };
    if (wide.addEventListener) wide.addEventListener("change", onWide);
    else if (wide.addListener) wide.addListener(onWide);
  }

  /* ---------------------------------------------------------------------- */
  /* Hero slider                                                            */
  /* Add up to three <li class="hero-slide"> items in the page markup.      */
  /* With one slide the controls stay hidden.                               */
  /* ---------------------------------------------------------------------- */
  var hero = document.querySelector(".hero");
  if (!hero) return;

  var track = hero.querySelector(".hero-track");
  var slides = track ? Array.prototype.slice.call(track.querySelectorAll(".hero-slide")) : [];
  var controls = hero.querySelector(".hero-controls");
  if (!track || slides.length < 2 || !controls) return;

  var INTERVAL = 7000;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var current = 0;
  var timer = null;
  var paused = false;
  var dots = [];

  hero.classList.add("has-controls");
  controls.hidden = false;

  slides.forEach(function (slide, index) {
    slide.setAttribute("role", "group");
    slide.setAttribute("aria-roledescription", "slide");
    slide.setAttribute("aria-label", index + 1 + " of " + slides.length);

    var dot = document.createElement("button");
    dot.type = "button";
    dot.className = "hero-dot";
    dot.setAttribute("aria-label", "Show artwork " + (index + 1));
    dot.addEventListener("click", function () {
      goTo(index);
      stop();
    });
    controls.appendChild(dot);
    dots.push(dot);
  });

  var arrowIcon = function (direction) {
    var path = direction === "prev" ? "M11 3L5 9l6 6" : "M7 3l6 6-6 6";
    return (
      '<svg viewBox="0 0 18 18" aria-hidden="true"><path d="' +
      path +
      '" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    );
  };

  ["prev", "next"].forEach(function (direction) {
    var arrow = document.createElement("button");
    arrow.type = "button";
    arrow.className = "hero-arrow hero-arrow--" + direction;
    arrow.setAttribute("aria-label", direction === "prev" ? "Previous artwork" : "Next artwork");
    arrow.innerHTML = arrowIcon(direction);
    arrow.addEventListener("click", function () {
      var step = direction === "prev" ? -1 : 1;
      goTo((current + step + slides.length) % slides.length);
      stop();
    });
    hero.appendChild(arrow);
  });

  function markCurrent(index) {
    current = index;
    dots.forEach(function (dot, i) {
      dot.setAttribute("aria-current", i === index ? "true" : "false");
    });
  }

  function goTo(index) {
    track.scrollTo({
      left: index * track.clientWidth,
      behavior: reduceMotion.matches ? "auto" : "smooth",
    });
    markCurrent(index);
  }

  var scrollFrame = null;
  track.addEventListener(
    "scroll",
    function () {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(function () {
        scrollFrame = null;
        var index = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
        if (index !== current && index >= 0 && index < slides.length) markCurrent(index);
      });
    },
    { passive: true }
  );

  function start() {
    if (timer || paused || reduceMotion.matches) return;
    timer = window.setInterval(function () {
      goTo((current + 1) % slides.length);
    }, INTERVAL);
  }

  function stop() {
    if (!timer) return;
    window.clearInterval(timer);
    timer = null;
  }

  hero.addEventListener("mouseenter", stop);
  hero.addEventListener("mouseleave", start);
  hero.addEventListener("focusin", stop);
  track.addEventListener(
    "touchstart",
    function () {
      paused = true;
      stop();
    },
    { passive: true }
  );
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else start();
  });

  markCurrent(0);
  start();
})();
