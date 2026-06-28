/* Fondation Kalifa — application logic
 * Recreates the behaviour of the original Claude Design prototype as a
 * dependency-free vanilla SPA: page routing, scroll-aware nav, mobile menu,
 * FAQ accordion, donation selector, contact/join form states and hover styles.
 */
(function () {
  "use strict";

  var DON_LINK = "https://tr.ee/zDW-dFSHlH";

  var state = {
    page: "accueil",
    mobileOpen: false,
    donAmt: 35,
    scrolled: false,
    openFaq: null,
    formSubmitted: false,
    joinFormSubmitted: false,
  };

  var nav = document.querySelector("nav");
  var mobileMenu = document.getElementById("mobile-menu");

  /* ---------- rendering ---------- */

  function renderPages() {
    document.querySelectorAll(".dc-page").forEach(function (el) {
      el.style.display = el.getAttribute("data-page") === state.page ? "" : "none";
    });
  }

  function renderNav() {
    var bg = (state.scrolled || state.page !== "accueil")
      ? "rgba(10,7,7,0.98)" : "rgba(10,7,7,0.7)";
    var border = state.scrolled
      ? "1px solid rgba(139,28,28,0.45)" : "1px solid rgba(255,255,255,0.07)";
    if (nav) {
      nav.style.background = bg;
      nav.style.borderBottom = border;
    }
    // active states only for the top navigation bar links
    document.querySelectorAll('nav [data-nav]').forEach(function (btn) {
      var active = btn.getAttribute("data-nav") === state.page;
      btn.style.color = active ? "#FFFFFF" : "#9A9490";
      btn.style.borderBottom = active ? "2px solid #8B1C1C" : "2px solid transparent";
    });
  }

  function renderMobile() {
    if (mobileMenu) mobileMenu.style.display = state.mobileOpen ? "flex" : "none";
  }

  function renderFaq() {
    document.querySelectorAll('.dc-cond[data-cond^="faq"]').forEach(function (el) {
      var n = parseInt(el.getAttribute("data-cond").replace(/\D/g, ""), 10);
      el.style.display = state.openFaq === n ? "" : "none";
    });
    document.querySelectorAll('[data-act^="toggle_faq"]').forEach(function (btn) {
      var n = parseInt(btn.getAttribute("data-act").replace(/\D/g, ""), 10);
      var arrow = btn.querySelector("span:last-child");
      if (arrow) arrow.textContent = state.openFaq === n ? "−" : "+";
    });
  }

  function renderDon() {
    var amounts = { set_don7: 7, set_don35: 35, set_don70: 70, set_donCustom: 0 };
    Object.keys(amounts).forEach(function (act) {
      var btn = document.querySelector('[data-act="' + act + '"]');
      if (!btn) return;
      var on = state.donAmt === amounts[act];
      btn.style.background = on ? "#8B1C1C" : "#231A18";
      btn.style.color = on ? "#FFFFFF" : "#C0BBB6";
      btn.style.borderColor = on ? "#8B1C1C" : "#3A3028";
    });
    document.querySelectorAll('.dc-cond[data-cond="donCustom"]').forEach(function (el) {
      el.style.display = state.donAmt === 0 ? "" : "none";
    });
    var label = document.getElementById("don-amt-label");
    if (label) label.textContent = state.donAmt === 0 ? "— €" : state.donAmt + " €";
  }

  function renderForms() {
    var pairs = [
      ["formSubmitted", state.formSubmitted],
      ["formNotSubmitted", !state.formSubmitted],
      ["joinFormSubmitted", state.joinFormSubmitted],
      ["joinNotSubmitted", !state.joinFormSubmitted],
    ];
    pairs.forEach(function (p) {
      document.querySelectorAll('.dc-cond[data-cond="' + p[0] + '"]').forEach(function (el) {
        el.style.display = p[1] ? "" : "none";
      });
    });
  }

  function renderAll() {
    renderPages(); renderNav(); renderMobile(); renderFaq(); renderDon(); renderForms();
  }

  /* ---------- actions ---------- */

  function go(page) {
    state.page = page;
    state.mobileOpen = false;
    window.scrollTo({ top: 0, behavior: "auto" });
    renderAll();
  }

  var DISPATCH = {
    don_link: function () { window.open(DON_LINK, "_blank", "noopener"); },
    toggleMobile: function () { state.mobileOpen = !state.mobileOpen; renderMobile(); },
    set_don7: function () { state.donAmt = 7; renderDon(); },
    set_don35: function () { state.donAmt = 35; renderDon(); },
    set_don70: function () { state.donAmt = 70; renderDon(); },
    set_donCustom: function () { state.donAmt = 0; renderDon(); },
  };

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]");
    if (!el) return;
    var act = el.getAttribute("data-act");

    if (el.getAttribute("data-nav")) { go(el.getAttribute("data-nav")); return; }
    if (act.indexOf("toggle_faq") === 0) {
      var n = parseInt(act.replace(/\D/g, ""), 10);
      state.openFaq = state.openFaq === n ? null : n;
      renderFaq();
      return;
    }
    if (DISPATCH[act]) DISPATCH[act]();
  });

  document.addEventListener("submit", function (e) {
    var form = e.target.closest("[data-act]");
    if (!form) return;
    var act = form.getAttribute("data-act");
    if (act === "submitContact") { e.preventDefault(); state.formSubmitted = true; renderForms(); }
    if (act === "submitJoin") { e.preventDefault(); state.joinFormSubmitted = true; renderForms(); }
  });

  /* scroll-aware navigation bar */
  window.addEventListener("scroll", function () {
    var s = window.scrollY > 60;
    if (s !== state.scrolled) { state.scrolled = s; renderNav(); }
  }, { passive: true });

  /* hover styles (replaces the prototype's style-hover attribute) */
  document.querySelectorAll("[style-hover]").forEach(function (el) {
    var hov = el.getAttribute("style-hover");
    el.addEventListener("mouseenter", function () {
      el._baseStyle = el.getAttribute("style") || "";
      el.setAttribute("style", el._baseStyle + ";" + hov);
    });
    el.addEventListener("mouseleave", function () {
      el.setAttribute("style", el._baseStyle || "");
    });
  });

  renderAll();
})();
