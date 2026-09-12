(function () {
  if (window.__wkAuthGateLoaded) {
    return;
  }
  window.__wkAuthGateLoaded = true;

  var accountBase = "https://7ink-dashboard.vercel.app";

  function dashboardUrl(path) {
    return accountBase + path;
  }

  function loginForDownload(slug) {
    var callbackUrl = "/api/downloads/" + encodeURIComponent(slug);
    return dashboardUrl("/login?callbackUrl=" + encodeURIComponent(callbackUrl));
  }

  document.querySelectorAll(".wk-open-auth").forEach(function (el) {
    el.setAttribute("href", dashboardUrl("/login"));
    el.addEventListener("click", function (event) {
      event.preventDefault();
      window.location.href = dashboardUrl("/login");
    });
  });

  document.querySelectorAll("[data-protected-download]").forEach(function (el) {
    var slug = el.getAttribute("data-protected-download") || "";
    if (!slug) {
      return;
    }

    var href = loginForDownload(slug);
    el.setAttribute("href", href);

    if (!el.querySelector(".wk-auth-lock")) {
      el.insertAdjacentHTML("afterbegin", "<span class=\"wk-auth-lock\">&#128274;</span>");
    }

    el.addEventListener("click", function (event) {
      event.preventDefault();
      window.location.href = href;
    });
  });
})();
