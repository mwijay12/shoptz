// ─── SHOP.TZ LUMINANCE INTRO PRELOADER SCRIPT ───
(function () {
  function injectLoader() {
    if (document.getElementById("tz-luminance-loader")) return;

    const loader = document.createElement("div");
    loader.id = "tz-luminance-loader";
    loader.innerHTML = `
      <div class="luminance-brand-text">SHOP.TZ</div>
      <div class="luminance-subtext">Designed by MWijay • Tanzania 2026</div>
    `;

    document.body.appendChild(loader);

    // Dismiss loader smoothly after animation completes
    setTimeout(() => {
      loader.classList.add("loader-hidden");
      setTimeout(() => {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      }, 800);
    }, 2200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectLoader);
  } else {
    injectLoader();
  }
})();
