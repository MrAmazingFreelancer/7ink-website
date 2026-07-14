(function () {
  if (window.__wkAuthGateLoaded) {
    return;
  }
  window.__wkAuthGateLoaded = true;

  var USERS_KEY = "wk_users_v1";
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

  function clearSessionUser() {
    localStorage.removeItem(SESSION_KEY);
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function getInitials(email) {
    var parts = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, " ").trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }

  function formatDate(ts) {
    if (!ts) return "Unknown";
    var d = new Date(ts);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }

  function injectStyle() {
    var style = document.createElement("style");
    style.textContent = ""
      /* shared overlay */
      + ".wk-auth-overlay{position:fixed;inset:0;background:rgba(3,6,16,.64);backdrop-filter:blur(3px);z-index:10000;display:none}"
      + ".wk-auth-overlay.show{display:block}"
      /* ---- login / signup modal ---- */
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
      + ".wk-auth-lock{display:inline-block;margin-right:6px;color:#a78bfa;font-weight:700}"
      /* ---- account dashboard panel ---- */
      + ".wk-dash{position:fixed;top:0;right:0;height:100%;width:min(100vw,380px);background:#0b1120;border-left:1px solid rgba(255,255,255,.1);box-shadow:-12px 0 40px rgba(0,0,0,.55);z-index:10001;display:none;flex-direction:column;color:#fff;font-family:Roboto,system-ui,-apple-system,Segoe UI,sans-serif;overflow-y:auto}"
      + ".wk-dash.show{display:flex}"
      + ".wk-dash-head{padding:18px 18px 14px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;align-items:center;flex-shrink:0}"
      + ".wk-dash-title{font-size:17px;font-weight:700;margin:0;letter-spacing:.3px}"
      + ".wk-dash-close{background:none;border:none;color:#9ca3af;font-size:24px;line-height:1;cursor:pointer;padding:2px 4px;transition:color .2s}"
      + ".wk-dash-close:hover{color:#fff}"
      + ".wk-dash-profile{display:flex;align-items:center;gap:14px;padding:20px 18px 16px;border-bottom:1px solid rgba(255,255,255,.07)}"
      + ".wk-dash-avatar{width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#9333ea);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#fff;flex-shrink:0;letter-spacing:.5px}"
      + ".wk-dash-info{overflow:hidden}"
      + ".wk-dash-email{font-size:14px;font-weight:600;color:#e5e7eb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"
      + ".wk-dash-joined{font-size:11px;color:rgba(255,255,255,.45);margin-top:3px}"
      + ".wk-dash-badge{display:inline-flex;align-items:center;gap:4px;background:rgba(124,58,237,.2);border:1px solid rgba(139,92,246,.35);color:#a78bfa;font-size:10px;font-weight:700;border-radius:999px;padding:2px 8px;margin-top:6px;text-transform:uppercase;letter-spacing:.6px}"
      + ".wk-dash-sections{padding:14px 18px;display:flex;flex-direction:column;gap:6px;flex:1}"
      + ".wk-dash-section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.9px;color:rgba(255,255,255,.35);margin:10px 0 4px}"
      + ".wk-dash-item{display:flex;align-items:center;gap:12px;padding:11px 13px;border-radius:10px;background:#11182f;border:1px solid rgba(255,255,255,.07);cursor:pointer;transition:background .18s,border-color .18s}"
      + ".wk-dash-item:hover{background:#17203d;border-color:rgba(139,92,246,.35)}"
      + ".wk-dash-item-icon{width:32px;height:32px;border-radius:8px;background:rgba(139,92,246,.15);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}"
      + ".wk-dash-item-label{font-size:13px;font-weight:600;color:#e5e7eb}"
      + ".wk-dash-item-sub{font-size:11px;color:rgba(255,255,255,.4);margin-top:1px}"
      + ".wk-dash-item-arrow{margin-left:auto;color:rgba(255,255,255,.25);font-size:16px}"
      + ".wk-dash-logout-btn{margin:0 18px 24px;border:1px solid rgba(239,68,68,.35);background:rgba(239,68,68,.08);color:#fca5a5;border-radius:11px;padding:11px;font-size:13px;font-weight:700;cursor:pointer;transition:background .18s;width:calc(100% - 36px)}"
      + ".wk-dash-logout-btn:hover{background:rgba(239,68,68,.18)}"
      /* change password form inside dashboard */
      + ".wk-dash-pw-form{background:#11182f;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:14px 14px 10px;margin-top:6px}"
      + ".wk-dash-pw-form.hidden{display:none}"
      + ".wk-dash-pw-field{width:100%;border:1px solid rgba(255,255,255,.14);background:#0b1120;color:#fff;border-radius:9px;padding:9px 11px;font-size:13px;outline:none;margin-top:8px}"
      + ".wk-dash-pw-field:focus{border-color:#8b5cf6;box-shadow:0 0 0 3px rgba(139,92,246,.2)}"
      + ".wk-dash-pw-save{margin-top:10px;width:100%;border:none;border-radius:9px;padding:9px;font-size:13px;font-weight:700;color:#fff;cursor:pointer;background:linear-gradient(90deg,#7c3aed,#8b5cf6,#9333ea)}"
      + ".wk-dash-pw-msg{min-height:18px;margin-top:8px;font-size:12px}"
      + ".wk-dash-pw-msg.error{color:#fca5a5}"
      + ".wk-dash-pw-msg.ok{color:#86efac}";
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

  function buildDashboard() {
    var dash = document.createElement("div");
    dash.className = "wk-dash";
    dash.setAttribute("role", "dialog");
    dash.setAttribute("aria-modal", "true");
    dash.setAttribute("aria-label", "Account Dashboard");
    dash.innerHTML = ""
      + "<div class=\"wk-dash-head\">"
      + "  <h3 class=\"wk-dash-title\">My Account</h3>"
      + "  <button class=\"wk-dash-close\" aria-label=\"Close dashboard\">&times;</button>"
      + "</div>"
      + "<div class=\"wk-dash-profile\">"
      + "  <div class=\"wk-dash-avatar\" id=\"wk-dash-avatar\"></div>"
      + "  <div class=\"wk-dash-info\">"
      + "    <div class=\"wk-dash-email\" id=\"wk-dash-email\"></div>"
      + "    <div class=\"wk-dash-joined\" id=\"wk-dash-joined\"></div>"
      + "    <div class=\"wk-dash-badge\">&#x2605; Member</div>"
      + "  </div>"
      + "</div>"
      + "<div class=\"wk-dash-sections\">"
      + "  <div class=\"wk-dash-section-title\">Account</div>"
      + "  <div class=\"wk-dash-item\" id=\"wk-dash-pw-toggle\">"
      + "    <div class=\"wk-dash-item-icon\">&#x1F511;</div>"
      + "    <div>"
      + "      <div class=\"wk-dash-item-label\">Change Password</div>"
      + "      <div class=\"wk-dash-item-sub\">Update your login credentials</div>"
      + "    </div>"
      + "    <span class=\"wk-dash-item-arrow\">&#8250;</span>"
      + "  </div>"
      + "  <div class=\"wk-dash-pw-form hidden\" id=\"wk-dash-pw-form\">"
      + "    <input class=\"wk-dash-pw-field\" id=\"wk-dash-pw-current\" type=\"password\" placeholder=\"Current password\" autocomplete=\"current-password\"/>"
      + "    <input class=\"wk-dash-pw-field\" id=\"wk-dash-pw-new\" type=\"password\" placeholder=\"New password (min 6 chars)\" autocomplete=\"new-password\"/>"
      + "    <input class=\"wk-dash-pw-field\" id=\"wk-dash-pw-confirm\" type=\"password\" placeholder=\"Confirm new password\" autocomplete=\"new-password\"/>"
      + "    <button class=\"wk-dash-pw-save\" id=\"wk-dash-pw-save\">Save New Password</button>"
      + "    <div class=\"wk-dash-pw-msg\" id=\"wk-dash-pw-msg\"></div>"
      + "  </div>"
      + "  <div class=\"wk-dash-section-title\">Downloads</div>"
      + "  <div class=\"wk-dash-item\">"
      + "    <div class=\"wk-dash-item-icon\">&#x1F4E5;</div>"
      + "    <div>"
      + "      <div class=\"wk-dash-item-label\">Protected Downloads</div>"
      + "      <div class=\"wk-dash-item-sub\">All gated content is unlocked</div>"
      + "    </div>"
      + "    <span style=\"margin-left:auto;font-size:11px;background:rgba(134,239,172,.12);color:#86efac;border:1px solid rgba(134,239,172,.3);border-radius:999px;padding:2px 9px;font-weight:700;\">Active</span>"
      + "  </div>"
      + "</div>"
      + "<button class=\"wk-dash-logout-btn\" id=\"wk-dash-logout\">&#x2192; Sign Out</button>";

    document.body.appendChild(dash);
    return dash;
  }

  function init() {
    injectStyle();
    var authUi = buildAuthModal();
    var dash = buildDashboard();
    var pendingUrl = "";
    var currentTab = "login";
    var dashOpen = false;

    /* --- auth modal elements --- */
    var tabs = authUi.modal.querySelectorAll(".wk-auth-tab");
    var authCloseBtn = authUi.modal.querySelector(".wk-auth-close");
    var submitBtn = authUi.modal.querySelector("#wk-auth-submit");
    var msg = authUi.modal.querySelector("#wk-auth-msg");
    var emailInput = authUi.modal.querySelector("#wk-auth-email");
    var passwordInput = authUi.modal.querySelector("#wk-auth-password");

    /* --- dashboard elements --- */
    var dashCloseBtn = dash.querySelector(".wk-dash-close");
    var dashAvatar = dash.querySelector("#wk-dash-avatar");
    var dashEmail = dash.querySelector("#wk-dash-email");
    var dashJoined = dash.querySelector("#wk-dash-joined");
    var dashLogout = dash.querySelector("#wk-dash-logout");
    var pwToggle = dash.querySelector("#wk-dash-pw-toggle");
    var pwForm = dash.querySelector("#wk-dash-pw-form");
    var pwCurrent = dash.querySelector("#wk-dash-pw-current");
    var pwNew = dash.querySelector("#wk-dash-pw-new");
    var pwConfirm = dash.querySelector("#wk-dash-pw-confirm");
    var pwSave = dash.querySelector("#wk-dash-pw-save");
    var pwMsg = dash.querySelector("#wk-dash-pw-msg");

    /* --- helpers --- */
    function setMsg(text, isError) {
      msg.textContent = text || "";
      msg.className = "wk-auth-msg " + (text ? (isError ? "error" : "ok") : "");
    }

    function setPwMsg(text, isError) {
      pwMsg.textContent = text || "";
      pwMsg.className = "wk-dash-pw-msg " + (text ? (isError ? "error" : "ok") : "");
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

    function openDashboard() {
      var email = getSessionUser();
      var users = readUsers();
      var user = users.find(function (u) { return u.email === email; });
      dashAvatar.textContent = getInitials(email);
      dashEmail.textContent = email;
      dashJoined.textContent = "Member since " + formatDate(user ? user.createdAt : null);
      pwForm.classList.add("hidden");
      pwCurrent.value = "";
      pwNew.value = "";
      pwConfirm.value = "";
      setPwMsg("", false);
      authUi.overlay.classList.add("show");
      dash.classList.add("show");
      dashOpen = true;
      dashCloseBtn.focus();
    }

    function closeDashboard() {
      authUi.overlay.classList.remove("show");
      dash.classList.remove("show");
      dashOpen = false;
    }

    /* --- auth modal wiring --- */
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        setTab(tab.getAttribute("data-tab"));
      });
    });

    authCloseBtn.addEventListener("click", closeAuthModal);
    authUi.overlay.addEventListener("click", function () {
      if (dashOpen) {
        closeDashboard();
      } else {
        closeAuthModal();
      }
    });

    submitBtn.addEventListener("click", function () {
      var email = emailInput.value.trim().toLowerCase();
      var password = passwordInput.value;

      if (!isValidEmail(email)) {
        setMsg("Enter a valid email address.", true);
        return;
      }
      if (password.length < 6) {
        setMsg("Password must be at least 6 characters.", true);
        return;
      }

      var users = readUsers();
      var existing = users.find(function (user) { return user.email === email; });

      if (currentTab === "signup") {
        if (existing) {
          setMsg("Account already exists. Please log in.", true);
          setTab("login");
          return;
        }
        users.push({ email: email, password: password, createdAt: Date.now() });
        writeUsers(users);
        setSessionUser(email);
        setMsg("Account created. Download unlocked.", false);
      } else {
        if (!existing || existing.password !== password) {
          setMsg("Email or password is incorrect.", true);
          return;
        }
        setSessionUser(email);
        setMsg("Login successful.", false);
      }

      if (pendingUrl) {
        var url = pendingUrl;
        pendingUrl = "";
        setTimeout(function () {
          closeAuthModal();
          window.location.href = url;
        }, 200);
      } else {
        setTimeout(function () {
          closeAuthModal();
          openDashboard();
        }, 280);
      }
    });

    /* --- dashboard wiring --- */
    dashCloseBtn.addEventListener("click", closeDashboard);

    dashLogout.addEventListener("click", function () {
      clearSessionUser();
      closeDashboard();
    });

    pwToggle.addEventListener("click", function () {
      var hidden = pwForm.classList.toggle("hidden");
      pwToggle.querySelector(".wk-dash-item-arrow").textContent = hidden ? "\u203A" : "\u2228";
      if (!hidden) {
        pwCurrent.focus();
      }
    });

    pwSave.addEventListener("click", function () {
      var email = getSessionUser();
      var oldPw = pwCurrent.value;
      var newPw = pwNew.value;
      var confPw = pwConfirm.value;
      var users = readUsers();
      var user = users.find(function (u) { return u.email === email; });

      if (!user || user.password !== oldPw) {
        setPwMsg("Current password is incorrect.", true);
        return;
      }
      if (newPw.length < 6) {
        setPwMsg("New password must be at least 6 characters.", true);
        return;
      }
      if (newPw !== confPw) {
        setPwMsg("Passwords do not match.", true);
        return;
      }
      user.password = newPw;
      writeUsers(users);
      setPwMsg("Password updated successfully.", false);
      pwCurrent.value = "";
      pwNew.value = "";
      pwConfirm.value = "";
      setTimeout(function () {
        pwForm.classList.add("hidden");
        pwToggle.querySelector(".wk-dash-item-arrow").textContent = "\u203A";
        setPwMsg("", false);
      }, 1800);
    });

    /* Keyboard: close on Escape */
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (dashOpen) { closeDashboard(); }
        else { closeAuthModal(); }
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
        if (getSessionUser()) {
          return;
        }
        event.preventDefault();
        openAuthModal(targetUrl);
      });
    });

    /* --- "Account" nav link --- */
    document.querySelectorAll(".wk-open-auth").forEach(function (el) {
      el.addEventListener("click", function (event) {
        event.preventDefault();
        if (getSessionUser()) {
          openDashboard();
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
