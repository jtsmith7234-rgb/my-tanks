/* ============================================================
   ONBOARDING / HELP
   One connected system, three entry points:
     1. First-run Tutorial (auto on first launch for new users)
     2. Settings → Tutorial (replays the same flow)
     3. Settings → Help (short beginner how-to answers)
   Reuses the app's openModal/closeModal sheet infra and theme
   tokens. Snapshots are lightweight CSS/HTML mini-mockups that
   resemble real Tank Care Buddy screens — no image assets.
   ============================================================ */
(function(){
  "use strict";

  // Versioned so future tutorial rewrites can re-show if we ever bump it.
  const TUTORIAL_VERSION = 1;
  const PREF_KEY = "tutorialSeen.v" + TUTORIAL_VERSION;

  function seenTutorial(){
    try { return !!getPref(PREF_KEY, false); } catch(_) { return false; }
  }
  function markTutorialSeen(){
    try { setPref(PREF_KEY, true); } catch(_){}
  }

  /* ---------- Snapshot mockups (resemble real app screens) ---------- */
  // Each returns an HTML string for a polished mini app-preview framed
  // inside an iPhone-ish device. Kept minimal: just enough UI to make
  // the feature recognizable, with optional subtle callouts.

  function deviceFrame(inner, callout){
    return `
      <div class="tut-device">
        <div class="tut-device-notch"></div>
        <div class="tut-screen">${inner}</div>
        ${callout ? `<div class="tut-callout">${callout}</div>` : ""}
      </div>`;
  }

  function snapHome(){
    return deviceFrame(`
      <div class="tut-ui-head"><span class="tut-ui-gear">⚙</span><span class="tut-ui-title">Tank Care Buddy</span><span class="tut-ui-add">+</span></div>
      <div class="tut-card tut-ok">
        <div class="tut-card-top"><b>Reef Tank</b><span class="tut-pill tut-pill-ok">● Looking good</span></div>
        <div class="tut-card-sub">55 gal · Saltwater · 12 animals</div>
      </div>
      <div class="tut-card tut-soon">
        <div class="tut-card-top"><b>Planted 20</b><span class="tut-pill tut-pill-soon">● Check soon</span></div>
        <div class="tut-card-sub">20 gal · Freshwater · 8 animals</div>
      </div>
      <div class="tut-card tut-ok">
        <div class="tut-card-top"><b>Betta Cube</b><span class="tut-pill tut-pill-ok">● Looking good</span></div>
        <div class="tut-card-sub">5 gal · Freshwater · 1 animal</div>
      </div>
    `);
  }

  function snapBeginner(){
    return deviceFrame(`
      <div class="tut-ui-head"><span class="tut-ui-back">‹</span><span class="tut-ui-title">New tank</span><span></span></div>
      <div class="tut-help-prompt">
        <div class="tut-help-q">Need help setting up<br>this tank?</div>
        <div class="tut-help-opts">
          <div class="tut-help-yes">Yes, guide me</div>
          <div class="tut-help-no">No thanks</div>
        </div>
      </div>
    `);
  }

  function snapAddTank(){
    return deviceFrame(`
      <div class="tut-ui-head"><span class="tut-ui-back">‹</span><span class="tut-ui-title">New tank</span><span></span></div>
      <div class="tut-field"><label>Name</label><div class="tut-input">Reef Tank</div></div>
      <div class="tut-field-row">
        <div class="tut-field"><label>Volume</label><div class="tut-input">55 gal</div></div>
        <div class="tut-field"><label>Type</label><div class="tut-input">Saltwater</div></div>
      </div>
      <div class="tut-btn-primary">Save tank</div>
    `, `<span class="tut-callout-dot"></span>Tap + to start`);
  }

  function snapCareLog(){
    return deviceFrame(`
      <div class="tut-ui-head"><span class="tut-ui-back">‹</span><span class="tut-ui-title">Reef Tank</span><span></span></div>
      <div class="tut-tabs"><span class="tut-tab active">Care</span><span class="tut-tab">Tests</span><span class="tut-tab">Fish</span></div>
      <div class="tut-log">
        <div class="tut-log-row"><span class="tut-log-ico">🧹</span><span>Water change · 25%</span><span class="tut-log-when">Today</span></div>
        <div class="tut-log-row"><span class="tut-log-ico">🧪</span><span>Nitrate 10 ppm</span><span class="tut-log-when">2d</span></div>
        <div class="tut-log-row"><span class="tut-log-ico">💧</span><span>Dosed 5 mL</span><span class="tut-log-when">4d</span></div>
      </div>
    `);
  }

  function snapCompat(){
    return deviceFrame(`
      <div class="tut-ui-head"><span class="tut-ui-back">‹</span><span class="tut-ui-title">Compatibility</span><span></span></div>
      <div class="tut-compat-pair"><span class="tut-fish">Neon Tetra</span><span class="tut-vs">+</span><span class="tut-fish">Betta</span></div>
      <div class="tut-compat-result tut-compat-warn">⚠ Use caution</div>
      <div class="tut-compat-note">Bettas may nip long-finned, brightly colored tankmates.</div>
      <div class="tut-compat-pair"><span class="tut-fish">Neon Tetra</span><span class="tut-vs">+</span><span class="tut-fish">Corydoras</span></div>
      <div class="tut-compat-result tut-compat-ok">✓ Great match</div>
    `);
  }

  function snapReminders(){
    return deviceFrame(`
      <div class="tut-ui-head"><span class="tut-ui-back">‹</span><span class="tut-ui-title">Trends</span><span></span></div>
      <div class="tut-graph">
        <svg viewBox="0 0 120 48" preserveAspectRatio="none" aria-hidden="true">
          <polyline points="0,38 20,30 40,33 60,20 80,24 100,12 120,16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="tut-remind">
        <div class="tut-remind-row"><span class="tut-log-ico">🔔</span><span>Water change due</span><span class="tut-log-when">Sat</span></div>
        <div class="tut-remind-row"><span class="tut-log-ico">🔔</span><span>Test nitrate</span><span class="tut-log-when">Sun</span></div>
      </div>
    `);
  }

  function snapReady(){
    return deviceFrame(`
      <div class="tut-ready">
        <div class="tut-ready-mark">🐟</div>
        <div class="tut-ready-tank">
          <div class="tut-card tut-ok"><div class="tut-card-top"><b>Your first tank</b><span class="tut-pill tut-pill-ok">● Ready</span></div><div class="tut-card-sub">Add it in a tap</div></div>
        </div>
      </div>
    `);
  }

  function snapEquipment() {
    return deviceFrame(`
      <div class="tut-ui-head"><span class="tut-ui-back">‹</span><span class="tut-ui-title">Equipment</span><span></span></div>
      <div class="tut-eq-list">
        <div class="tut-eq-row"><span class="tut-log-ico">🔬</span><span><b>HOB Filter</b><br><span style="font-size:9px;color:#7a7974">Service in 12 days</span></span><span class="tut-pill tut-pill-ok">● OK</span></div>
        <div class="tut-eq-row"><span class="tut-log-ico">🌡️</span><span><b>Heater</b><br><span style="font-size:9px;color:#7a7974">Inspect in 45 days</span></span><span class="tut-pill tut-pill-ok">● OK</span></div>
        <div class="tut-eq-row"><span class="tut-log-ico">💡</span><span><b>LED Light</b><br><span style="font-size:9px;color:#7a7974">Check in 60 days</span></span><span class="tut-pill tut-pill-ok">● OK</span></div>
      </div>
    `);
  }

  /* ---------- Tutorial card content (4–6 cards max) ---------- */
  const CARDS = [
    {
      label: "Welcome",
      snap: snapHome,
      title: "Keep every tank healthy.",
      body: "Log care, track water, add fish, and stay on top of what\u2019s due \u2014 all in one place."
    },
    {
      label: "First steps",
      snap: snapBeginner,
      title: "New tank or experienced keeper \u2014 we\u2019ve got you",
      body: "If this is your first tank, turn on the guided setup for step-by-step help. If you\u2019re already set up, just add your tanks and log your care."
    },
    {
      label: "Your tanks",
      snap: snapAddTank,
      title: "Add your tanks",
      body: "Create a card for each aquarium with its size and type. Tap one anytime to open it."
    },
    {
      label: "Water care",
      snap: snapCareLog,
      title: "Log water changes & tests",
      body: "Track changes, tests, and dosing as you go. Tank Care Buddy keeps the history for you."
    },
    {
      label: "Livestock",
      snap: snapCompat,
      title: "Add fish, check compatibility",
      body: "Add your livestock and see at a glance which species get along before you buy."
    },
    {
      label: "Reminders",
      snap: snapReminders,
      title: "Stay on top of care",
      body: "Reminders and trends help you spot what's due and how your water is trending."
    },
    {
      label: "Equipment",
      snap: snapEquipment,
      title: "Track your gear",
      body: "Add your filter, heater, and other equipment. Tank Care Buddy calculates when each item is due for service \u2014 so nothing gets missed."
    },
    {
      label: "Ready",
      snap: snapReady,
      title: "You\u2019re set up for success.",
      body: "Everything you need to care for every tank \u2014 in one app.",
      cta: "Let\u2019s go"
    }
  ];

  /* ---------- Tutorial flow ---------- */
  let _state = null; // { idx, onFinish }

  function cardHTML(card, i, total){
    const isLast = i === total - 1;
    const ctaLabel = card.cta || (isLast ? "Get started" : "");
    if (i === 0) {
      return `
        <section class="tut-card-slide tut-card-hero" role="group" aria-roledescription="slide" aria-label="1 of ${total}">
          <div class="tut-hero-brand">
            <div class="tut-hero-wordmark">Tank Care Buddy</div>
            <div class="tut-hero-tagline">Take care, taken care of.</div>
          </div>
          <div class="tut-hero-visual">${card.snap()}</div>
          <div class="tut-hero-body">
            <h2 class="tut-hero-headline">${escapeHTML(card.title)}</h2>
            <p class="tut-hero-support">${escapeHTML(card.body)}</p>
          </div>
        </section>`;
    }
    return `
      <section class="tut-card-slide" role="group" aria-roledescription="slide" aria-label="${i+1} of ${total}">
        <div class="tut-card-label">${escapeHTML(card.label)}</div>
        <div class="tut-snap">${card.snap()}</div>
        <h2 class="tut-headline">${escapeHTML(card.title)}</h2>
        <p class="tut-support">${escapeHTML(card.body)}</p>
        ${isLast ? `<button class="btn block tut-cta" data-tut-finish type="button">${escapeHTML(ctaLabel)}</button>` : ""}
      </section>`;
  }

  function dotsHTML(total, idx){
    let s = "";
    for (let i = 0; i < total; i++){
      s += `<span class="tut-dot${i === idx ? " active" : ""}" data-tut-dot="${i}"></span>`;
    }
    return s;
  }

  function openTutorial(opts){
    opts = opts || {};
    const total = CARDS.length;
    _state = { idx: 0, onFinish: opts.onFinish || null, markSeen: opts.markSeen !== false };

    const html = `
      <div class="tut" role="dialog" aria-label="Tank Care Buddy tutorial">
        <button class="tut-skip" data-tut-skip type="button">Skip</button>
        <div class="tut-track" id="tut-track">
          ${CARDS.map((c,i) => cardHTML(c,i,total)).join("")}
        </div>
        <div class="tut-footer">
          <div class="tut-dots" id="tut-dots">${dotsHTML(total, 0)}</div>
          <button class="btn tut-next" id="tut-next" type="button">Next</button>
        </div>
      </div>`;

    openModal(html, () => {
      const root  = document.querySelector(".modal");
      if (root) root.classList.add("modal-tut");
      const track = document.getElementById("tut-track");
      const next  = document.getElementById("tut-next");

      // Tapping the backdrop dismisses the sheet (openModal wires this). Treat
      // that as "seen" too so first-run doesn't keep nagging on every launch.
      const backdrop = root && root.parentElement;
      if (backdrop){
        backdrop.addEventListener("click", (e) => {
          if (e.target === backdrop && _state && _state.markSeen) markTutorialSeen();
        });
      }

      const finish = () => {
        if (_state && _state.markSeen) markTutorialSeen();
        const cb = _state && _state.onFinish;
        _state = null;
        closeModal();
        if (typeof cb === "function") { try { cb(); } catch(_){} }
      };
      const skip = () => {
        if (_state && _state.markSeen) markTutorialSeen();
        _state = null;
        closeModal();
      };

      const goTo = (i) => {
        if (!_state) return;
        i = Math.max(0, Math.min(CARDS.length - 1, i));
        _state.idx = i;
        const slide = track.children[i];
        if (slide) track.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
        syncUI();
      };
      const syncUI = () => {
        const i = _state.idx, last = i === CARDS.length - 1;
        document.querySelectorAll("#tut-dots .tut-dot").forEach((d, di) =>
          d.classList.toggle("active", di === i));
        // On the final card, the in-card CTA takes over; hide the footer Next.
        next.textContent = "Next";
        next.style.visibility = last ? "hidden" : "visible";
      };

      next.addEventListener("click", () => goTo(_state.idx + 1));

      // Keep dots/Next in sync when the user swipes (scroll-snap) directly.
      let scrollRAF = 0;
      track.addEventListener("scroll", () => {
        if (scrollRAF) return;
        scrollRAF = requestAnimationFrame(() => {
          scrollRAF = 0;
          if (!_state) return;
          const i = Math.round(track.scrollLeft / track.clientWidth);
          if (i !== _state.idx){ _state.idx = i; syncUI(); }
        });
      }, { passive: true });

      document.querySelectorAll("[data-tut-dot]").forEach(d =>
        d.addEventListener("click", () => goTo(parseInt(d.dataset.tutDot, 10))));
      document.querySelectorAll("[data-tut-skip]").forEach(b =>
        b.addEventListener("click", skip));
      document.querySelectorAll("[data-tut-finish]").forEach(b =>
        b.addEventListener("click", finish));

      syncUI();
    });
  }

  // Show automatically on first launch for brand-new users only.
  // Caller passes a guard so we never stack on top of another sheet.
  function maybeShowFirstRun(opts){
    if (seenTutorial()) return false;
    if (document.querySelector(".modal-backdrop")) return false; // another sheet is up
    openTutorial(Object.assign({ markSeen: true }, opts || {}));
    return true;
  }

  /* ---------- Help sheet ---------- */
  const HELP = [
    { q: "How do I add a tank?",
      a: "Tap the <b>+</b> button at the top right of the home screen, enter your tank's name, volume, and type, then tap <b>Save tank</b>." },
    { q: "How do I add fish?",
      a: "Open a tank, go to the <b>Fish</b> tab, and tap <b>Add fish</b>. Search the species list and set how many you have." },
    { q: "How do I log a water change?",
      a: "Open a tank and choose <b>Log water change</b>. Enter the percentage or volume changed — it's saved to your tank's history." },
    { q: "How do I log a water test?",
      a: "Open a tank, go to <b>Tests</b>, and tap <b>Log water test</b>. Enter your readings (pH, ammonia, nitrate, and more)." },
    { q: "How do reminders work?",
      a: "Tank Care Buddy suggests when care is due based on your logged history. Check the trends and reminders to see what's coming up." },
    { q: "How do I check species compatibility?",
      a: "When adding or viewing fish, Tank Care Buddy flags whether your species get along — look for the compatibility result before buying new fish." },
    { q: "How do I export or import a backup?",
      a: "Open <b>Settings</b> → <b>Data &amp; Backup</b>. Use <b>Export backup</b> to save a file to your phone, and <b>Import backup</b> to restore it." }
  ];

  function openHelp(){
    const items = HELP.map((h, i) => `
      <button class="help-item" data-help="${i}" type="button" aria-expanded="false">
        <span class="help-q">${h.q}</span>
        <span class="help-chev">›</span>
      </button>
      <div class="help-a" id="help-a-${i}" hidden><p>${h.a}</p></div>
    `).join("");

    openModal(`
      <div class="help-sheet">
        <div class="settings-head">
          <h3>Help</h3>
          <button class="settings-x" id="help-close" aria-label="Close">✕</button>
        </div>
        <p class="settings-note" style="margin-top:0">Quick answers to common questions. New here? Try the <b>Tutorial</b> for the full walkthrough.</p>
        <div class="help-list">${items}</div>
      </div>
    `, () => {
      document.querySelectorAll(".help-item").forEach(btn => {
        btn.addEventListener("click", () => {
          const i = btn.dataset.help;
          const panel = document.getElementById("help-a-" + i);
          const open = !panel.hidden;
          panel.hidden = open;
          btn.setAttribute("aria-expanded", String(!open));
          btn.classList.toggle("open", !open);
        });
      });
      const x = document.getElementById("help-close");
      if (x) x.addEventListener("click", closeModal);
    });
  }

  window.TUTORIAL = { openTutorial, maybeShowFirstRun, openHelp, seenTutorial };
})();
