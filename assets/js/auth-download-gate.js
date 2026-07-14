(function () {
  if (window.__wkAuthGateLoaded) {
    return;
  }
  window.__wkAuthGateLoaded = true;

  var USERS_KEY   = "wk_users_v1";
  var SESSION_KEY = "wk_current_user_v1";

  function readUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function writeUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function getSessionUser() {
    return localStorage.getItem(SESSION_KEY) || "";
  }

  function setSessionUser(email) {
    localStorage.setItem(SESSION_KEY, email);
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function injectStyle() {
    var style = document.createElement("style");
    style.textContent = ""
      + ".wk-auth-overlay{position:fixed;inset:0;background:rgba(3,6,16,.64);backdrop-filter:blur(3px);z-index:10000;display:none}"
      + ".wk-auth-overlay.show{display:block}"
      + ".wk-auth-modal{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(94vw,420px);background:#0b1120;border:1px solid rgba(255,255,255,.12);border-radius:16px;box-shadow:0 20px 45px rgba(0,0,0,.5);z-index:10001;display:none;color:#fff;font-family:Roboto,system-ui,-apple-system,Segoe UI,sans-serif}"
      + ".wk-auth-modal.show{display:block}"
      + ".wk-auth-head{padding:15px 16px 12px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;align-items:center}"
      + ".wk-auth-title{font-size:18px;font-weight:700;margin:0}"
      + ".wk-auth-close{background:none;border:none;color:#d1d5db;font-size:22px;line-height:1;cursor:pointer;padding:2px 6px}"
      + ".wk-auth-tabs{display:flex;gap:8px;padding:12px 16px 0}"
      + ".wk-auth-tab{flex:1;border:1px solid rgba(255,255,255,.16);background:#11182f;color:#d1d5db;border-radius:10px;padding:9px 10px;cursor:pointer;font-weight:600}"
      + ".wk-auth-tab.active{background:linear-gradient(90deg,#7c3aed,#8b5cf6,#9333ea);border-color:transparent;color:#fff}"
      + ".wk-auth-body{padding:12px 16px 16px}"
      + ".wk-auth-field{width:100%;border:1px solid rgba(255,255,255,.16);background:#11182f;color:#fff;border-radius:10px;padding:10px 12px;font-size:14px;outline:none;margin-top:10px}"
      + ".wk-auth-field:focus{border-color:#8b5cf6;box-shadow:0 0 0 3px rgba(139,92,246,.2)}"
      + ".wk-auth-submit{margin-top:12px;width:100%;border:none;border-radius:11px;padding:10px 12px;font-size:14px;font-weight:700;color:#fff;cursor:pointer;background:linear-gradient(90deg,#7c3aed,#8b5cf6,#9333ea)}"
      + ".wk-auth-note{font-size:12px;color:rgba(255,255,255,.68);margin-top:10px;line-height:1.45}"
      + ".wk-auth-msg{min-height:20px;margin-top:10px;font-size:13px}"
      + ".wk-auth-msg.error{color:#fca5a5}"
      + ".wk-auth-msg.ok{color:#86efac}"
      + ".wk-auth-lock{display:inline-block;margin-right:6px;color:#a78bfa;font-weight:700}";
    document.head.appendChild(style);
  }

  function buildAuthModal() {
    var overlay = document.createElement("div");
    overlay.className = "wk-auth-overlay";

    var modal = document.createElement("div");
    modal.className = "wk-auth-modal";
    modal.innerHTML = ""
      + "<div class=\"wk-auth-head\">"
      + "<h3 class=\"wk-auth-title\">Account Access</h3>"
      + "<button class=\"wk-auth-close\" aria-label=\"Close\">&times;</button>"
      + "</div>"
      + "<div class=\"wk-auth-tabs\">"
      + "<button class=\"wk-auth-tab active\" data-tab=\"login\">Log In</button>"
      + "<button class=\"wk-auth-tab\" data-tab=\"signup\">Sign Up</button>"
      + "</div>"
      + "<div class=\"wk-auth-body\">"
      + "<input class=\"wk-auth-field\" id=\"wk-auth-email\" type=\"email\" placeholder=\"Email\" autocomplete=\"email\"/>"
      + "<input class=\"wk-auth-field\" id=\"wk-auth-password\" type=\"password\" placeholder=\"Password\" autocomplete=\"current-password\"/>"
      + "<button class=\"wk-auth-submit\" id=\"wk-auth-submit\">Log In</button>"
      + "<div class=\"wk-auth-msg\" id=\"wk-auth-msg\"></div>"
      + "<p class=\"wk-auth-note\">Create an account or log in to unlock protected downloads.</p>"
      + "</div>";

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    return { overlay: overlay, modal: modal };
  }

  function init() {
    injectStyle();
    var authUi = buildAuthModal();
    var pendingUrl = "";
    var currentTab = "login";

    var tabs         = authUi.modal.querySelectorAll(".wk-auth-tab");
    var authCloseBtn = authUi.modal.querySelector(".wk-auth-close");
    var submitBtn    = authUi.modal.querySelector("#wk-auth-submit");
    var msg          = authUi.modal.querySelector("#wk-auth-msg");
    var emailInput   = authUi.modal.querySelector("#wk-auth-email");
    var passwordInput = authUi.modal.querySelector("#wk-auth-password");

    var DOWNLOAD_REDIRECT_DELAY = 200; // short delay so success message renders before download starts
    var ACCOUNT_REDIRECT_DELAY  = 280; // slightly longer so "Login successful" is visible before page change
      msg.textContent = text || "";
      msg.className = "wk-auth-msg " + (text ? (isError ? "error" : "ok") : "");
    }

    function setTab(nextTab) {
      currentTab = nextTab;
      tabs.forEach(function (tab) {
        tab.classList.toggle("active", tab.getAttribute("data-tab") === nextTab);
      });
      submitBtn.textContent = nextTab === "signup" ? "Create Account" : "Log In";
      setMsg("", false);
    }

    function openAuthModal(downloadUrl) {
      pendingUrl = downloadUrl || "";
      authUi.overlay.classList.add("show");
      authUi.modal.classList.add("show");
      emailInput.value = "";
      passwordInput.value = "";
      setMsg("", false);
      emailInput.focus();
    }

    function closeAuthModal() {
      authUi.overlay.classList.remove("show");
      authUi.modal.classList.remove("show");
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () { setTab(tab.getAttribute("data-tab")); });
    });

    authCloseBtn.addEventListener("click", closeAuthModal);
    authUi.overlay.addEventListener("click", closeAuthModal);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeAuthModal(); }
    });

    submitBtn.addEventListener("click", function () {
      var email    = emailInput.value.trim().toLowerCase();
      var password = passwordInput.value;

      if (!isValidEmail(email)) { setMsg("Enter a valid email address.", true); return; }
      if (password.length < 6)  { setMsg("Password must be at least 6 characters.", true); return; }

      var users    = readUsers();
      var existing = users.find(function (u) { return u.email === email; });

      // NOTE: btoa encoding is used to avoid storing plain text in localStorage.
      // This is a client-side demo auth system; for production use,
      // replace with server-side authentication and proper password hashing.
      if (currentTab === "signup") {
        if (existing) { setMsg("Account already exists. Please log in.", true); setTab("login"); return; }
        users.push({ email: email, password: btoa(password), createdAt: Date.now() });
        writeUsers(users);
        setSessionUser(email);
        setMsg("Account created. Download unlocked.", false);
      } else {
        if (!existing || existing.password !== btoa(password)) { setMsg("Email or password is incorrect.", true); return; }
        setSessionUser(email);
        setMsg("Login successful.", false);
      }

      if (pendingUrl) {
        var url = pendingUrl;
        pendingUrl = "";
        // Short delay lets the success message render before navigating to the download
        setTimeout(function () { closeAuthModal(); window.location.href = url; }, DOWNLOAD_REDIRECT_DELAY);
      } else {
        // Slightly longer delay so the user sees "Login successful" before the page redirect
        setTimeout(function () { closeAuthModal(); window.location.href = "/admin/account.html"; }, ACCOUNT_REDIRECT_DELAY);
      }
    });

    /* --- protected download gate --- */
    document.querySelectorAll("[data-protected-download]").forEach(function (el) {
      var targetUrl = el.getAttribute("href") || el.getAttribute("data-download-url") || "";
      if (el.tagName === "A" && !el.hasAttribute("download")) {
        el.setAttribute("download", "");
      }
      var label = el.textContent.trim();
      if (label && !/^\s*\uD83D\uDD12/.test(label)) {
        el.innerHTML = "<span class=\"wk-auth-lock\">\uD83D\uDD12</span>" + el.innerHTML;
      }
      el.addEventListener("click", function (event) {
        if (getSessionUser()) { return; }
        event.preventDefault();
        openAuthModal(targetUrl);
      });
    });

    /* --- "Account" nav link --- */
    document.querySelectorAll(".wk-open-auth").forEach(function (el) {
      el.addEventListener("click", function (event) {
        event.preventDefault();
        if (getSessionUser()) {
          window.location.href = "/admin/account.html";
        } else {
          openAuthModal("");
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
