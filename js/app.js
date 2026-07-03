/* Fondation Kalifa — application logic
 * Recreates the behaviour of the original Claude Design prototype as a
 * dependency-free vanilla SPA: page routing, scroll-aware nav, mobile menu,
 * FAQ accordion, donation selector, contact/join form states and hover styles.
 */
(function () {
  "use strict";

  var DON_LINK = "https://gofund.me/7c0746877";
  var EVENT_LINK = "https://www.eventbrite.be/e/drepanocytose-et-deuil-quand-la-maladie-laisse-une-empreinte-eternelle-tickets-1991843675051?utm-campaign=social&utm-content=attendeeshare&utm-medium=discovery&utm-term=listing&utm-source=wsa&aff=ebdsshwebmobile";
  var CONTACT_EMAIL = "fondationkalifa@gmail.com";
  var FORMSUBMIT_ENDPOINT = "https://formsubmit.co/ajax/" + CONTACT_EMAIL;

  var state = {
    page: "accueil",
    mobileOpen: false,
    donAmt: 35,
    scrolled: false,
    openFaq: null,
    formSubmitted: false,
    joinFormSubmitted: false,
    contactFormError: false,
    joinFormError: false,
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
    var contactErr = document.querySelector('[data-cond="contactFormError"]');
    if (contactErr) contactErr.style.display = state.contactFormError ? "" : "none";
    var joinErr = document.querySelector('[data-cond="joinFormError"]');
    if (joinErr) joinErr.style.display = state.joinFormError ? "" : "none";
  }

  /* ---------- persistance des brouillons de formulaire (localStorage) ----------
     Dans le SPA, changer de page ne vide pas les champs (le DOM persiste), mais
     un rechargement réel de la page le ferait. On sauvegarde donc les saisies
     pour qu'aucune donnée ne soit perdue, quel que soit le "changement de page". */

  function formKey(form) { return "kalifa_draft_" + form.getAttribute("data-act"); }

  function draftFields(form) {
    return [].slice.call(form.querySelectorAll("input, textarea, select"))
      .filter(function (f) { return f.name && f.name.charAt(0) !== "_" && f.type !== "hidden"; });
  }

  function saveDraft(form) {
    var data = {};
    draftFields(form).forEach(function (f) { data[f.name] = f.value; });
    try { localStorage.setItem(formKey(form), JSON.stringify(data)); } catch (e) {}
  }

  function restoreDraft(form) {
    var raw;
    try { raw = localStorage.getItem(formKey(form)); } catch (e) { return; }
    if (!raw) return;
    var data;
    try { data = JSON.parse(raw); } catch (e) { return; }
    draftFields(form).forEach(function (f) {
      if (data[f.name] != null && data[f.name] !== "") f.value = data[f.name];
    });
  }

  function clearDraft(form) { try { localStorage.removeItem(formKey(form)); } catch (e) {} }

  document.addEventListener("input", function (e) {
    var form = e.target.closest('[data-act="submitContact"], [data-act="submitJoin"]');
    if (form) saveDraft(form);
  });
  document.addEventListener("change", function (e) {
    var form = e.target.closest('[data-act="submitContact"], [data-act="submitJoin"]');
    if (form) saveDraft(form);
  });

  /* ---------- form submission (FormSubmit.co -> fondationkalifa@gmail.com) ---------- */

  function sendForm(form) {
    var data = {};
    new FormData(form).forEach(function (value, key) { data[key] = value; });
    // honeypot: if filled, silently pretend success without sending (bot trap)
    if (data._honey) return Promise.resolve(true);
    delete data._honey;

    return fetch(FORMSUBMIT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    }).then(function (res) {
      return res.json().then(function (json) {
        // FormSubmit replies HTTP 200 even when the target address still
        // needs one-time activation, so the JSON body is the real verdict.
        return res.ok && String(json.success) === "true";
      });
    }).catch(function () { return false; });
  }

  function renderAll() {
    renderPages(); renderNav(); renderMobile(); renderFaq(); renderDon(); renderForms();
  }

  /* ---------- actions ---------- */

  /* ---------- routage par ancre (#slug) + historique navigateur ---------- */

  var PAGE_SLUGS = {
    accueil: "accueil",
    histoire: "notre-histoire",
    drepanocytose: "la-maladie",
    actions: "nos-actions",
    evenements: "evenements",
    temoignages: "temoignages",
    don: "faire-un-don",
    rejoindre: "nous-rejoindre",
    partenaires: "partenaires",
    contact: "contact",
  };
  var SLUG_PAGES = {};
  Object.keys(PAGE_SLUGS).forEach(function (p) { SLUG_PAGES[PAGE_SLUGS[p]] = p; });

  function pageFromHash() {
    var slug = (location.hash || "").replace(/^#/, "");
    return SLUG_PAGES[slug] || "accueil";
  }

  /* applique une page (affichage) sans toucher à l'historique */
  function applyPage(page, scroll) {
    state.page = page;
    state.mobileOpen = false;
    if (scroll) window.scrollTo({ top: 0, behavior: "auto" });
    renderAll();
  }

  /* navigation déclenchée par l'utilisateur : met aussi à jour l'URL/l'historique */
  function go(page) {
    applyPage(page, true);
    var url = page === "accueil"
      ? location.pathname + location.search
      : "#" + (PAGE_SLUGS[page] || page);
    if (location.hash !== ("#" + (PAGE_SLUGS[page] || page)) &&
        !(page === "accueil" && !location.hash)) {
      history.pushState({ page: page }, "", url);
    }
  }

  /* boutons retour / avance du navigateur */
  window.addEventListener("popstate", function () {
    applyPage(pageFromHash(), true);
  });

  var DISPATCH = {
    don_link: function () { window.open(DON_LINK, "_blank", "noopener"); },
    event_reserve: function () { window.open(EVENT_LINK, "_blank", "noopener"); },
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
    if (act !== "submitContact" && act !== "submitJoin") return;
    e.preventDefault();

    var submitBtn = form.querySelector('button[type="submit"]');
    var originalLabel = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Envoi en cours…"; }

    if (act === "submitContact") state.contactFormError = false;
    if (act === "submitJoin") state.joinFormError = false;
    renderForms();

    sendForm(form).then(function (ok) {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
      if (act === "submitContact") {
        if (ok) { state.formSubmitted = true; form.reset(); clearDraft(form); }
        else { state.contactFormError = true; }
      } else {
        if (ok) { state.joinFormSubmitted = true; form.reset(); clearDraft(form); }
        else { state.joinFormError = true; }
      }
      renderForms();
    });
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

  /* restaure les brouillons éventuels au chargement */
  document.querySelectorAll('[data-act="submitContact"], [data-act="submitJoin"]').forEach(restoreDraft);

  /* ouvre directement la page correspondant à l'ancre de l'URL (lien partagé) */
  applyPage(pageFromHash(), false);
})();
