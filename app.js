/* ============================================================
   STORAGE — safe shim w/ in-memory fallback + cloud sync
   ============================================================ */
const _mem = {};
const store = {
  get(k){
    if (_mem[k] != null) return _mem[k];
    try { return localStorage.getItem(k); } catch(e){ return null; }
  },
  set(k,v){
    try { localStorage.setItem(k,v); } catch(e){}
    _mem[k] = v; // mirror in memory so a wipe still survives the session
    // Push to cloud (debounced). v is a JSON string for our keys.
    try {
      if (window.CLOUD && (k === KEY_TANKS || k === KEY_EVENTS || k === KEY_LOGS)){
        window.CLOUD.saveDebounced(k, v);
      }
    } catch(e){ console.warn("cloud save error", e); }
  },
  del(k){ try { localStorage.removeItem(k); } catch(e){} delete _mem[k]; }
};

/* Probe whether localStorage actually persists. Sets STORAGE_OK. */
let STORAGE_OK = true;
let STORAGE_REASON = "";
(function probeStorage(){
  try {
    const k = "__tm_probe__";
    localStorage.setItem(k, "1");
    const v = localStorage.getItem(k);
    localStorage.removeItem(k);
    if (v !== "1") { STORAGE_OK = false; STORAGE_REASON = "localStorage returned wrong value"; }
  } catch(e){
    STORAGE_OK = false;
    STORAGE_REASON = (e && e.message) ? e.message : "localStorage blocked";
  }
})();

const KEY_TANKS  = "tm.tanks.v1";
const KEY_LOGS   = "tm.logs.v1";    // legacy water-change-only log (migrated on boot)
const KEY_EVENTS = "tm.events.v1";  // unified timeline

/* ============================================================
   BACKUP / RESTORE — export/import the whole app to a JSON file
   ============================================================ */
function snapshot(){
  return {
    app: "My Tanks",
    version: 1,
    exportedAt: new Date().toISOString(),
    tanks: JSON.parse(store.get(KEY_TANKS) || "null") || (typeof tanks !== "undefined" ? tanks : DEFAULT_TANKS),
    events: JSON.parse(store.get(KEY_EVENTS) || "null") || (typeof events !== "undefined" ? events : {}),
    legacyLogs: JSON.parse(store.get(KEY_LOGS) || "null") || (typeof logs !== "undefined" ? logs : {})
  };
}
function downloadBackup(){
  const data = snapshot();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const ts = new Date().toISOString().slice(0,16).replace(/[T:]/g,"-");
  const a = document.createElement("a");
  a.href = url; a.download = `my-tanks-backup-${ts}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
function restoreFromText(text){
  let data;
  try { data = JSON.parse(text); } catch(e){ throw new Error("Backup file is not valid JSON."); }
  if (!data || data.app !== "My Tanks" || !Array.isArray(data.tanks)) {
    throw new Error("This doesn't look like a My Tanks backup.");
  }
  tanks  = data.tanks;
  events = data.events  || {};
  logs   = data.legacyLogs || {};
  saveTanks(tanks);
  saveEvents(events);
  saveLogs(logs);
  return { tankCount: tanks.length, eventCount: Object.values(events).reduce((s,a)=>s+a.length,0) };
}

/* ============================================================
   STATE
   ============================================================ */
function loadTanks(){
  const raw = store.get(KEY_TANKS);
  if(!raw) return JSON.parse(JSON.stringify(DEFAULT_TANKS));
  try { return JSON.parse(raw); } catch(e){ return JSON.parse(JSON.stringify(DEFAULT_TANKS)); }
}
function saveTanks(t){ store.set(KEY_TANKS, JSON.stringify(t)); }
function loadLogs(){
  const raw = store.get(KEY_LOGS);
  if(!raw) return {};
  try { return JSON.parse(raw); } catch(e){ return {}; }
}
function saveLogs(l){ store.set(KEY_LOGS, JSON.stringify(l)); }

function loadEvents(){
  const raw = store.get(KEY_EVENTS);
  if(!raw) return {};
  try { return JSON.parse(raw); } catch(e){ return {}; }
}
function saveEvents(e){ store.set(KEY_EVENTS, JSON.stringify(e)); }

let tanks  = loadTanks();
let logs   = loadLogs();   // legacy
let events = loadEvents(); // { [tankId]: [event, ...] }  newest first
let view   = { screen: "home", tankId: null, tab: "details" };

/* One-time migration: pull legacy water-change logs into events */
function migrateLogs(){
  let migrated = false;
  Object.keys(logs || {}).forEach(tankId => {
    (logs[tankId] || []).forEach(e => {
      const ts = e.ts || (e.date ? new Date(e.date + "T12:00:00").getTime() : Date.now());
      events[tankId] = events[tankId] || [];
      // Avoid double-migrating: skip if an event with the same legacy id exists
      if (events[tankId].some(x => x.legacyId && x.legacyId === e.id)) return;
      events[tankId].push({
        id: uid(),
        legacyId: e.id,
        ts,
        type: "water_change",
        data: {
          gallons: e.gallons,
          prime_mL: e.prime_mL,
          stability_mL: e.stability_mL,
          fert_pumps: e.fert_pumps,
          notes: e.notes || ""
        }
      });
      migrated = true;
    });
  });
  if(migrated){
    Object.keys(events).forEach(k => events[k].sort((a,b) => b.ts - a.ts));
    saveEvents(events);
  }
}

/* ============================================================
   EVENTS — unified timeline
   ============================================================ */
function logEvent(tankId, type, data){
  events[tankId] = events[tankId] || [];
  events[tankId].unshift({ id: uid(), ts: Date.now(), type, data: data || {} });
  saveEvents(events);
}
function deleteEvent(tankId, eventId){
  if(!events[tankId]) return;
  events[tankId] = events[tankId].filter(e => e.id !== eventId);
  saveEvents(events);
}
function tankEvents(tankId){ return events[tankId] || []; }
function lastEventOfType(tankId, type){
  return tankEvents(tankId).find(e => e.type === type) || null;
}

/* ============================================================
   WATER TEST SAFE RANGES (freshwater)
   ============================================================ */
const SAFE = {
  ph:       { good: [6.5, 7.8], warn: [6.0, 8.4] },
  ammonia:  { good: [0,   0.0], warn: [0,   0.25] },  // anything > 0 starts to worry; > 0.25 = danger
  nitrite:  { good: [0,   0.0], warn: [0,   0.25] },
  nitrate:  { good: [0,   20 ], warn: [0,   40  ] }
};
function rateReading(metric, value){
  if (value === "" || value == null || isNaN(value)) return "unknown";
  const v = Number(value);
  const s = SAFE[metric];
  if (!s) return "unknown";
  if (v >= s.good[0] && v <= s.good[1]) return "good";
  if (v >= s.warn[0] && v <= s.warn[1]) return "warn";
  return "bad";
}

/* ============================================================
   HELPERS
   ============================================================ */
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const fmt = (n) => {
  if (!isFinite(n)) return "0";
  if (Math.abs(n - Math.round(n)) < 0.05) return String(Math.round(n));
  return n.toFixed(1);
};
const escapeHTML = (s="") => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const uid = () => Math.random().toString(36).slice(2,9);

function getTank(id){ return tanks.find(t => t.id === id); }
function totalFish(tank){ return (tank.fish||[]).reduce((s,f) => s + (Number(f.count)||0), 0); }

/* ============================================================
   ROUTING / RENDER
   ============================================================ */
function render(){
  const titleEl = $("#title");
  const backBtn = $("#back-btn");
  const addBtn  = $("#add-tank-btn");

  if(view.screen === "home"){
    titleEl.textContent = "My Tanks";
    backBtn.hidden = true;
    addBtn.hidden = false;
    renderHome();
  } else if(view.screen === "tank"){
    const t = getTank(view.tankId);
    titleEl.textContent = t ? t.name : "Tank";
    backBtn.hidden = false;
    addBtn.hidden = true;
    renderTank();
  }
}

function renderHome(){
  const main = $("#main");
  if(!tanks.length){
    main.innerHTML = `
      <div class="section center">
        <h2>No tanks yet</h2>
        <p class="muted">Tap the + button to add your first tank.</p>
      </div>`;
    return;
  }
  main.innerHTML = `
    <div class="grid">
      ${tanks.map(t => `
        <button class="tank-card" data-tank="${t.id}">
          <h3>${escapeHTML(t.name)}</h3>
          <div class="meta">${t.gallons} gal &middot; ${escapeHTML(t.type||"Freshwater")}</div>
          <div class="pill-row">
            <span class="pill">${totalFish(t)} animals</span>
            <span class="pill alt">${(t.fish||[]).length} species</span>
            ${t.substrate ? `<span class="pill gray">${escapeHTML(t.substrate)}</span>` : ""}
          </div>
        </button>
      `).join("")}
    </div>
    <div class="spacer-12"></div>
    <p class="muted center" style="font-size:12px">Data saves in this browser. Add to Home Screen from Safari to use like an app.</p>
    <div class="center" style="margin-top:10px">
      <button class="btn small secondary" id="reset-defaults">Reset to default tanks</button>
    </div>
  `;
  $$("[data-tank]").forEach(card => {
    card.addEventListener("click", () => {
      view = { screen:"tank", tankId: card.dataset.tank, tab: "details" };
      render();
      window.scrollTo({top:0});
    });
  });
  const resetBtn = $("#reset-defaults");
  if (resetBtn) resetBtn.addEventListener("click", () => {
    if(!confirm("Reset all tanks to defaults? This wipes any tank edits, fish lists, water changes, and tests. This can't be undone.")) return;
    store.del(KEY_TANKS); store.del(KEY_LOGS); store.del(KEY_EVENTS);
    tanks  = loadTanks();
    logs   = {};
    events = {};
    saveTanks(tanks);
    toast("Reset complete");
    render();
  });
}

function renderTank(){
  const t = getTank(view.tankId);
  if(!t){ view.screen = "home"; render(); return; }

  const main = $("#main");
  main.innerHTML = `
    <div class="tabs" role="tablist">
      <button class="tab ${view.tab==='details'?'active':''}" data-tab="details">Details</button>
      <button class="tab ${view.tab==='fish'?'active':''}" data-tab="fish">Fish</button>
      <button class="tab ${view.tab==='clean'?'active':''}" data-tab="clean">Clean &amp; Dose</button>
      <button class="tab ${view.tab==='tests'?'active':''}" data-tab="tests">Water Tests</button>
      <button class="tab ${view.tab==='history'?'active':''}" data-tab="history">History</button>
    </div>
    <div id="tab-body"></div>
  `;
  $$("[data-tab]").forEach(b => b.addEventListener("click", () => {
    view.tab = b.dataset.tab; render();
  }));

  const body = $("#tab-body");
  if(view.tab === "details") body.innerHTML = renderDetails(t);
  if(view.tab === "fish")    body.innerHTML = renderFish(t);
  if(view.tab === "clean")   body.innerHTML = renderClean(t);
  if(view.tab === "tests")   body.innerHTML = renderTests(t);
  if(view.tab === "history") body.innerHTML = renderHistory(t);

  if(view.tab === "details") bindDetails(t);
  if(view.tab === "fish")    bindFish(t);
  if(view.tab === "clean")   bindClean(t);
  if(view.tab === "tests")   bindTests(t);
  if(view.tab === "history") bindHistory(t);
}

/* ============================================================
   DETAILS TAB
   ============================================================ */
function renderDetails(t){
  return `
    <div class="section">
      <h2>Overview</h2>
      <div class="kv">
        <b>Size</b><span>${t.gallons} gallons</span>
        <b>Type</b><span>${escapeHTML(t.type||"")}</span>
        <b>Substrate</b><span>${escapeHTML(t.substrate||"—")}</span>
        <b>Decor</b><span>${escapeHTML(t.decor||"—")}</span>
        <b>Inhabitants</b><span>${totalFish(t)} (${(t.fish||[]).length} species)</span>
      </div>
      ${t.notes ? `<div class="hr"></div><p class="muted" style="margin:0">${escapeHTML(t.notes)}</p>` : ""}
    </div>

    <div class="section">
      <h2>Edit tank info</h2>
      <label class="field"><span>Name</span><input class="input" id="d-name" value="${escapeHTML(t.name)}" /></label>
      <div class="row">
        <label class="field"><span>Gallons</span><input class="input" id="d-gallons" type="number" min="1" step="0.5" value="${t.gallons}" /></label>
        <label class="field"><span>Type</span><input class="input" id="d-type" value="${escapeHTML(t.type||"")}" /></label>
      </div>
      <div class="row">
        <label class="field"><span>Substrate</span><input class="input" id="d-substrate" value="${escapeHTML(t.substrate||"")}" /></label>
        <label class="field"><span>Decor</span><input class="input" id="d-decor" value="${escapeHTML(t.decor||"")}" /></label>
      </div>
      <label class="field"><span>Notes</span><textarea class="input" id="d-notes" rows="3">${escapeHTML(t.notes||"")}</textarea></label>
      <div class="row">
        <button class="btn" id="save-details">Save changes</button>
        <button class="btn danger" id="delete-tank">Delete this tank</button>
      </div>
    </div>
  `;
}
function bindDetails(t){
  $("#save-details").addEventListener("click", () => {
    const before = { name:t.name, gallons:t.gallons, type:t.type, substrate:t.substrate, decor:t.decor, notes:t.notes };
    t.name      = $("#d-name").value.trim() || t.name;
    t.gallons   = parseFloat($("#d-gallons").value) || t.gallons;
    t.type      = $("#d-type").value.trim();
    t.substrate = $("#d-substrate").value.trim();
    t.decor     = $("#d-decor").value.trim();
    t.notes     = $("#d-notes").value.trim();
    saveTanks(tanks);
    // Capture only what changed
    const after = { name:t.name, gallons:t.gallons, type:t.type, substrate:t.substrate, decor:t.decor, notes:t.notes };
    const changes = {};
    Object.keys(after).forEach(k => { if(before[k] !== after[k]) changes[k] = { from: before[k], to: after[k] }; });
    if(Object.keys(changes).length){
      logEvent(t.id, "tank_edit", { changes });
    }
    render();
    toast("Saved");
  });
  $("#delete-tank").addEventListener("click", () => {
    if(!confirm(`Delete "${t.name}"? This can't be undone.`)) return;
    tanks = tanks.filter(x => x.id !== t.id);
    delete logs[t.id];
    saveTanks(tanks); saveLogs(logs);
    view = { screen:"home", tankId:null, tab:"details" };
    render();
  });
}

/* ============================================================
   FISH TAB
   ============================================================ */
function renderFish(t){
  return `
    <div class="section">
      <h2>Inhabitants</h2>
      <div class="fish-list" id="fish-list">
        ${(t.fish||[]).map(f => `
          <div class="fish-row" data-id="${f.id}">
            <div class="count">${f.count}</div>
            <div>
              <div class="species">${escapeHTML(f.species)}</div>
              ${f.name ? `<div class="pet-name">"${escapeHTML(f.name)}"</div>` : ""}
            </div>
            <div class="spacer"></div>
            <div class="row-actions">
              <button class="btn small secondary" data-act="edit" data-id="${f.id}">Edit</button>
              <button class="btn small danger" data-act="del" data-id="${f.id}">Remove</button>
            </div>
          </div>
        `).join("") || `<p class="muted">No fish yet.</p>`}
      </div>
    </div>

    <div class="section">
      <h2>Add fish or invertebrate</h2>
      <div class="row">
        <label class="field"><span>Species</span><input class="input" id="add-species" placeholder="e.g. Cardinal Tetra" /></label>
        <label class="field"><span>Count</span><input class="input" id="add-count" type="number" min="1" value="1" /></label>
      </div>
      <label class="field"><span>Name (optional)</span><input class="input" id="add-name" placeholder="e.g. Boss" /></label>
      <button class="btn block" id="add-fish-btn">Add to tank</button>
    </div>
  `;
}
function bindFish(t){
  $("#add-fish-btn").addEventListener("click", () => {
    const sp = $("#add-species").value.trim();
    const ct = parseInt($("#add-count").value, 10) || 1;
    const nm = $("#add-name").value.trim();
    if(!sp){ alert("Species is required"); return; }
    t.fish = t.fish || [];
    t.fish.push({ id: uid(), species: sp, count: ct, name: nm });
    saveTanks(tanks);
    logEvent(t.id, "fish_add", { species: sp, count: ct, name: nm });
    render();
  });
  $$("[data-act='del']").forEach(b => b.addEventListener("click", () => {
    const id = b.dataset.id;
    const removed = (t.fish||[]).find(f => f.id === id);
    t.fish = (t.fish||[]).filter(f => f.id !== id);
    saveTanks(tanks);
    if(removed) logEvent(t.id, "fish_remove", { species: removed.species, count: removed.count, name: removed.name });
    render();
  }));
  $$("[data-act='edit']").forEach(b => b.addEventListener("click", () => {
    const id = b.dataset.id;
    const f = (t.fish||[]).find(x => x.id === id);
    if(!f) return;
    openFishEditor(t, f);
  }));
}

function openFishEditor(t, f){
  openModal(`
    <h3>Edit fish</h3>
    <label class="field"><span>Species</span><input class="input" id="e-species" value="${escapeHTML(f.species)}" /></label>
    <div class="row">
      <label class="field"><span>Count</span><input class="input" id="e-count" type="number" min="0" value="${f.count}" /></label>
      <label class="field"><span>Name</span><input class="input" id="e-name" value="${escapeHTML(f.name||"")}" /></label>
    </div>
    <div class="row">
      <button class="btn" id="e-save">Save</button>
      <button class="btn secondary" id="e-cancel">Cancel</button>
    </div>
  `, () => {
    $("#e-save").addEventListener("click", () => {
      const before = { species:f.species, count:f.count, name:f.name };
      f.species = $("#e-species").value.trim() || f.species;
      f.count   = Math.max(0, parseInt($("#e-count").value,10) || 0);
      f.name    = $("#e-name").value.trim();
      saveTanks(tanks);
      const after = { species:f.species, count:f.count, name:f.name };
      const changes = {};
      Object.keys(after).forEach(k => { if(before[k] !== after[k]) changes[k] = { from: before[k], to: after[k] }; });
      if(Object.keys(changes).length){ logEvent(t.id, "fish_edit", { species: f.species, name: f.name, changes }); }
      closeModal(); render();
    });
    $("#e-cancel").addEventListener("click", closeModal);
  });
}

/* ============================================================
   CLEAN & DOSE TAB
   ============================================================ */
function calcDoses(gallons){
  // Doses computed against new water volume (gallons)
  const primeML     = gallons * DOSING.prime.mlPerGallon;
  const stabilityML = gallons * DOSING.stability.mlPerGallon;
  const easyPumps   = gallons * DOSING.easygreen.pumpsPerGallon;
  return {
    prime:     { mL: primeML,     caps: primeML / DOSING.prime.cap_mL },
    stability: { mL: stabilityML, caps: stabilityML / DOSING.stability.cap_mL },
    easygreen: { pumps: easyPumps }
  };
}

function renderClean(t){
  const suggested = Math.round(t.gallons * 0.5); // suggest 50% water change
  return `
    <div class="section">
      <h2>Water change calculator</h2>
      <p class="muted" style="margin-top:0">Doses calculate against the gallons of new water you're putting back in. ${suggested} gal would be a ~50% change on this tank.</p>
      <div class="row">
        <label class="field"><span>Gallons being changed</span>
          <input class="input" id="wc-gallons" type="number" min="0" step="0.5" value="${suggested}" />
        </label>
        <label class="field"><span>Date</span>
          <input class="input" id="wc-date" type="date" value="${new Date().toISOString().slice(0,10)}" />
        </label>
      </div>

      <div id="dose-out"></div>

      <label class="field" style="margin-top:10px"><span>Notes (optional)</span>
        <input class="input" id="wc-notes" placeholder="e.g. trimmed moss, vacuumed substrate" /></label>

      <div class="row">
        <button class="btn block" id="log-btn">Save to history</button>
      </div>
    </div>

    <div class="section">
      <h2>Dosing rules used</h2>
      <ul class="muted" style="line-height:1.7;margin:0;padding-left:18px">
        <li><b style="color:var(--ink)">Seachem Prime</b> — ${DOSING.prime.rule}</li>
        <li><b style="color:var(--ink)">Seachem Stability</b> — ${DOSING.stability.rule}</li>
        <li><b style="color:var(--ink)">Easy Green</b> — ${DOSING.easygreen.rule}</li>
      </ul>
    </div>
  `;
}
function bindClean(t){
  const inp = $("#wc-gallons");
  const out = $("#dose-out");

  function paint(){
    const g = parseFloat(inp.value);
    if(!g || g <= 0){
      out.innerHTML = `<p class="muted center" style="margin:10px 0 0">Enter a gallon amount to see your doses.</p>`;
      return;
    }
    const d = calcDoses(g);
    out.innerHTML = `
      <div class="dose-grid">
        <div class="dose-card">
          <div class="label">Seachem Prime</div>
          <div class="big">${fmt(d.prime.mL)}<span class="unit">mL</span></div>
          <div class="sub">${fmt(d.prime.caps)} capful${d.prime.caps===1?"":"s"} &middot; ${DOSING.prime.rule}</div>
        </div>
        <div class="dose-card">
          <div class="label">Seachem Stability</div>
          <div class="big">${fmt(d.stability.mL)}<span class="unit">mL</span></div>
          <div class="sub">${fmt(d.stability.caps)} capful${d.stability.caps===1?"":"s"} &middot; ${DOSING.stability.rule}</div>
        </div>
        <div class="dose-card">
          <div class="label">Easy Green</div>
          <div class="big">${fmt(d.easygreen.pumps)}<span class="unit">pumps</span></div>
          <div class="sub">${DOSING.easygreen.rule}</div>
        </div>
      </div>
    `;
  }
  inp.addEventListener("input", paint);
  paint();

  $("#log-btn").addEventListener("click", () => {
    const g = parseFloat(inp.value);
    if(!g || g <= 0){ alert("Enter a gallon amount first."); return; }
    const d = calcDoses(g);
    logEvent(t.id, "water_change", {
      date: $("#wc-date").value || new Date().toISOString().slice(0,10),
      gallons: g,
      prime_mL: +d.prime.mL.toFixed(2),
      stability_mL: +d.stability.mL.toFixed(2),
      fert_pumps: +d.easygreen.pumps.toFixed(2),
      notes: $("#wc-notes").value.trim()
    });
    toast("Logged");
    view.tab = "history"; render();
  });
}

/* ============================================================
   WATER TESTS TAB
   ============================================================ */
function renderTests(t){
  const last = lastEventOfType(t.id, "water_test");
  const recent = tankEvents(t.id).filter(e => e.type === "water_test").slice(0, 6);
  const ld = last ? last.data : null;
  return `
    <div class="section">
      <h2>Log a water test</h2>
      <p class="muted" style="margin-top:0">API Master Test Kit values. Leave any field blank if you didn't test it.</p>
      <div class="row">
        <label class="field"><span>pH</span><input class="input" id="wt-ph" type="number" step="0.1" inputmode="decimal" placeholder="e.g. 7.2" /></label>
        <label class="field"><span>Ammonia (ppm)</span><input class="input" id="wt-ammonia" type="number" step="0.25" inputmode="decimal" placeholder="e.g. 0" /></label>
      </div>
      <div class="row">
        <label class="field"><span>Nitrite (ppm)</span><input class="input" id="wt-nitrite" type="number" step="0.25" inputmode="decimal" placeholder="e.g. 0" /></label>
        <label class="field"><span>Nitrate (ppm)</span><input class="input" id="wt-nitrate" type="number" step="5" inputmode="decimal" placeholder="e.g. 10" /></label>
      </div>
      <div class="row">
        <label class="field"><span>Temperature °F (optional)</span><input class="input" id="wt-temp" type="number" step="0.1" inputmode="decimal" placeholder="e.g. 78" /></label>
        <label class="field"><span>Date</span><input class="input" id="wt-date" type="date" value="${new Date().toISOString().slice(0,10)}" /></label>
      </div>
      <label class="field"><span>Notes (optional)</span><input class="input" id="wt-notes" placeholder="e.g. tested before water change" /></label>
      <button class="btn block" id="save-test">Save test</button>
    </div>

    ${last ? `
      <div class="section">
        <h2>Most recent reading</h2>
        <div class="kv">
          <b>When</b><span>${formatTS(last.ts)}</span>
          ${renderReadingRow("pH",       "ph",      ld.ph)}
          ${renderReadingRow("Ammonia",  "ammonia", ld.ammonia, "ppm")}
          ${renderReadingRow("Nitrite",  "nitrite", ld.nitrite, "ppm")}
          ${renderReadingRow("Nitrate",  "nitrate", ld.nitrate, "ppm")}
          ${ld.temp_f != null && ld.temp_f !== "" ? `<b>Temp</b><span>${escapeHTML(String(ld.temp_f))} °F</span>` : ""}
          ${ld.notes ? `<b>Notes</b><span>${escapeHTML(ld.notes)}</span>` : ""}
        </div>
      </div>` : ""}

    ${recent.length > 1 ? `
      <div class="section">
        <h2>Recent tests</h2>
        <div class="fish-list">
          ${recent.slice(1).map(e => `
            <div class="history-row">
              <div>
                <div class="what">${formatTSShort(e.ts)}</div>
                <div class="when">${renderReadingsInline(e.data)}</div>
                ${e.data.notes ? `<div class="when">${escapeHTML(e.data.notes)}</div>` : ""}
              </div>
            </div>
          `).join("")}
        </div>
      </div>` : ""}

    <div class="section">
      <h2>Safe ranges (freshwater)</h2>
      <ul class="muted" style="line-height:1.7;margin:0;padding-left:18px">
        <li><b style="color:var(--ink)">pH</b> — 6.5–7.8 ideal (most species tolerate 6.0–8.4)</li>
        <li><b style="color:var(--ink)">Ammonia</b> — 0 ppm. Any reading means trouble.</li>
        <li><b style="color:var(--ink)">Nitrite</b> — 0 ppm. Toxic above 0.</li>
        <li><b style="color:var(--ink)">Nitrate</b> — under 20 ppm ideal; over 40 = water change.</li>
      </ul>
    </div>
  `;
}
function renderReadingRow(label, metric, value, unit){
  if (value === "" || value == null) return `<b>${label}</b><span class="muted">—</span>`;
  const rating = rateReading(metric, value);
  const cls = rating === "good" ? "good" : rating === "warn" ? "warn" : rating === "bad" ? "bad" : "";
  return `<b>${label}</b><span><span class="reading reading-${cls}">${escapeHTML(String(value))}${unit?" "+unit:""}</span></span>`;
}
function renderReadingsInline(d){
  const parts = [];
  if (d.ph != null && d.ph !== "") parts.push(`pH <b class="reading reading-${rateReading('ph', d.ph)}">${escapeHTML(String(d.ph))}</b>`);
  if (d.ammonia != null && d.ammonia !== "") parts.push(`NH3 <b class="reading reading-${rateReading('ammonia', d.ammonia)}">${escapeHTML(String(d.ammonia))}</b>`);
  if (d.nitrite != null && d.nitrite !== "") parts.push(`NO2 <b class="reading reading-${rateReading('nitrite', d.nitrite)}">${escapeHTML(String(d.nitrite))}</b>`);
  if (d.nitrate != null && d.nitrate !== "") parts.push(`NO3 <b class="reading reading-${rateReading('nitrate', d.nitrate)}">${escapeHTML(String(d.nitrate))}</b>`);
  if (d.temp_f != null && d.temp_f !== "") parts.push(`${escapeHTML(String(d.temp_f))}°F`);
  return parts.join(" · ") || `<span class="muted">no values</span>`;
}
function bindTests(t){
  $("#save-test").addEventListener("click", () => {
    const ph      = $("#wt-ph").value;
    const ammonia = $("#wt-ammonia").value;
    const nitrite = $("#wt-nitrite").value;
    const nitrate = $("#wt-nitrate").value;
    const temp_f  = $("#wt-temp").value;
    if (!ph && !ammonia && !nitrite && !nitrate && !temp_f) {
      alert("Enter at least one reading.");
      return;
    }
    logEvent(t.id, "water_test", {
      date: $("#wt-date").value || new Date().toISOString().slice(0,10),
      ph:      ph      === "" ? "" : Number(ph),
      ammonia: ammonia === "" ? "" : Number(ammonia),
      nitrite: nitrite === "" ? "" : Number(nitrite),
      nitrate: nitrate === "" ? "" : Number(nitrate),
      temp_f:  temp_f  === "" ? "" : Number(temp_f),
      notes:   $("#wt-notes").value.trim()
    });
    toast("Test logged");
    render();
  });
}

/* ============================================================
   HISTORY TAB — unified timeline of every action
   ============================================================ */
const HISTORY_FILTERS = [
  { id: "all",          label: "All"           },
  { id: "water_change", label: "Water changes" },
  { id: "water_test",   label: "Water tests"   },
  { id: "fish",         label: "Fish"          },
  { id: "tank_edit",    label: "Tank edits"    }
];
let historyFilter = "all";

function renderHistory(t){
  const all = tankEvents(t.id);
  if(!all.length){
    return `
      <div class="section center">
        <h2>No history yet</h2>
        <p class="muted">Every water change, water test, fish change, and tank edit gets timestamped and saved here.</p>
      </div>`;
  }
  const filtered = all.filter(e => {
    if (historyFilter === "all") return true;
    if (historyFilter === "fish") return e.type.startsWith("fish_");
    return e.type === historyFilter;
  });
  return `
    <div class="section">
      <h2>Activity timeline</h2>
      <div class="filter-row">
        ${HISTORY_FILTERS.map(f => `
          <button class="chip ${historyFilter===f.id?'active':''}" data-filter="${f.id}">${f.label}</button>
        `).join("")}
      </div>
      <div class="fish-list" style="margin-top:10px">
        ${filtered.length ? filtered.map(e => renderEventRow(e)).join("") : `<p class="muted center">No entries match this filter.</p>`}
      </div>
    </div>
  `;
}

function renderEventRow(e){
  const when = formatTS(e.ts);
  const icon = eventIcon(e.type);
  const title = eventTitle(e);
  const detail = eventDetail(e);
  return `
    <div class="event-row" data-id="${e.id}">
      <div class="event-icon ${e.type}">${icon}</div>
      <div class="event-body">
        <div class="event-title">${title}</div>
        <div class="event-when">${when}</div>
        ${detail ? `<div class="event-detail">${detail}</div>` : ""}
      </div>
      <button class="btn small danger" data-del="${e.id}" title="Remove entry">✕</button>
    </div>`;
}

function eventIcon(type){
  if (type === "water_change") return "💧";
  if (type === "water_test")   return "🧪";
  if (type === "fish_add")     return "➕";
  if (type === "fish_remove")  return "✖";
  if (type === "fish_edit")    return "✏️";
  if (type === "tank_edit")    return "🔧";
  return "•";
}
function eventTitle(e){
  const d = e.data || {};
  if (e.type === "water_change") return `Water change — ${d.gallons} gal`;
  if (e.type === "water_test")   return `Water test`;
  if (e.type === "fish_add")     return `Added ${d.count}× ${escapeHTML(d.species)}${d.name?` (“${escapeHTML(d.name)}”)`:""}`;
  if (e.type === "fish_remove")  return `Removed ${d.count}× ${escapeHTML(d.species)}${d.name?` (“${escapeHTML(d.name)}”)`:""}`;
  if (e.type === "fish_edit")    return `Edited ${escapeHTML(d.species)}${d.name?` (“${escapeHTML(d.name)}”)`:""}`;
  if (e.type === "tank_edit")    return `Tank details updated`;
  return e.type;
}
function eventDetail(e){
  const d = e.data || {};
  if (e.type === "water_change") {
    const bits = [];
    bits.push(`Prime ${fmt(d.prime_mL)} mL`);
    bits.push(`Stability ${fmt(d.stability_mL)} mL`);
    bits.push(`Easy Green ${fmt(d.fert_pumps)} pumps`);
    if (d.notes) bits.push(escapeHTML(d.notes));
    return bits.join(" · ");
  }
  if (e.type === "water_test") {
    const main = renderReadingsInline(d);
    return d.notes ? `${main}<br><span class="muted">${escapeHTML(d.notes)}</span>` : main;
  }
  if (e.type === "fish_edit" || e.type === "tank_edit") {
    const changes = d.changes || {};
    return Object.keys(changes).map(k => `<b>${escapeHTML(k)}</b>: ${escapeHTML(String(changes[k].from ?? "—"))} → ${escapeHTML(String(changes[k].to ?? "—"))}`).join(" · ");
  }
  return "";
}

function bindHistory(t){
  $$("[data-filter]").forEach(b => b.addEventListener("click", () => {
    historyFilter = b.dataset.filter;
    render();
  }));
  $$("[data-del]").forEach(b => b.addEventListener("click", () => {
    if(!confirm("Remove this entry from history?")) return;
    deleteEvent(t.id, b.dataset.del);
    render();
  }));
}

/* ============================================================
   TIME FORMATTING
   ============================================================ */
function formatTS(ts){
  if(!ts) return "";
  const d = new Date(ts);
  const date = d.toLocaleDateString(undefined, { weekday:"short", month:"short", day:"numeric", year:"numeric" });
  const time = d.toLocaleTimeString(undefined, { hour:"numeric", minute:"2-digit" });
  return `${date} · ${time}`;
}
function formatTSShort(ts){
  if(!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month:"short", day:"numeric" }) + " · " + d.toLocaleTimeString(undefined, { hour:"numeric", minute:"2-digit" });
}

/* ============================================================
   ADD TANK MODAL
   ============================================================ */
function openAddTank(){
  openModal(`
    <h3>Add a tank</h3>
    <label class="field"><span>Name</span><input class="input" id="n-name" placeholder="e.g. Quarantine 10g" /></label>
    <div class="row">
      <label class="field"><span>Gallons</span><input class="input" id="n-gallons" type="number" min="1" step="0.5" value="10" /></label>
      <label class="field"><span>Type</span><input class="input" id="n-type" placeholder="e.g. Freshwater Betta" /></label>
    </div>
    <div class="row">
      <button class="btn" id="n-save">Create</button>
      <button class="btn secondary" id="n-cancel">Cancel</button>
    </div>
  `, () => {
    $("#n-save").addEventListener("click", () => {
      const name = $("#n-name").value.trim();
      if(!name){ alert("Name required"); return; }
      const tank = {
        id: "tank-" + uid(),
        name,
        gallons: parseFloat($("#n-gallons").value) || 10,
        type: $("#n-type").value.trim() || "Freshwater",
        substrate: "", decor: "", notes: "", fish: []
      };
      tanks.push(tank); saveTanks(tanks); closeModal();
      view = { screen:"tank", tankId: tank.id, tab:"details" };
      render();
    });
    $("#n-cancel").addEventListener("click", closeModal);
  });
}

/* ============================================================
   MODAL + TOAST
   ============================================================ */
function openModal(html, onMount){
  const wrap = document.createElement("div");
  wrap.className = "modal-backdrop";
  wrap.innerHTML = `<div class="modal">${html}</div>`;
  wrap.addEventListener("click", e => { if(e.target === wrap) closeModal(); });
  document.body.appendChild(wrap);
  if(typeof onMount === "function") onMount();
}
function closeModal(){
  const m = $(".modal-backdrop");
  if(m) m.remove();
}
function toast(msg){
  const el = document.createElement("div");
  el.textContent = msg;
  el.style.cssText = "position:fixed;left:50%;bottom:64px;transform:translateX(-50%);background:#0b1e2a;border:1px solid #234a66;color:#e9f5ff;padding:9px 14px;border-radius:999px;z-index:100;font-size:13px;box-shadow:0 6px 20px rgba(0,0,0,.4)";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

/* ============================================================
   BOOT
   ============================================================ */
let _cloudReady = false;
let _cloudError = null;

async function hydrateFromCloud(){
  if (!window.CLOUD) return;
  try {
    await window.CLOUD.ensureDevice();
    const all = await window.CLOUD.loadAll();
    // Cloud wins over local on boot. Only adopt cloud values that exist.
    if (all[KEY_TANKS])  { _mem[KEY_TANKS]  = JSON.stringify(all[KEY_TANKS]);  tanks  = all[KEY_TANKS]; }
    if (all[KEY_EVENTS]) { _mem[KEY_EVENTS] = JSON.stringify(all[KEY_EVENTS]); events = all[KEY_EVENTS]; }
    if (all[KEY_LOGS])   { _mem[KEY_LOGS]   = JSON.stringify(all[KEY_LOGS]);   logs   = all[KEY_LOGS]; }
    // Mirror to localStorage too if it works
    try {
      if (all[KEY_TANKS])  localStorage.setItem(KEY_TANKS,  JSON.stringify(all[KEY_TANKS]));
      if (all[KEY_EVENTS]) localStorage.setItem(KEY_EVENTS, JSON.stringify(all[KEY_EVENTS]));
      if (all[KEY_LOGS])   localStorage.setItem(KEY_LOGS,   JSON.stringify(all[KEY_LOGS]));
    } catch(e){}

    // If this device had nothing in the cloud yet, push current local state up so it survives next time.
    if (!all[KEY_TANKS] && tanks)  await window.CLOUD.save(KEY_TANKS,  tanks);
    if (!all[KEY_EVENTS] && events) await window.CLOUD.save(KEY_EVENTS, events);

    _cloudReady = true;
  } catch(e){
    console.warn("hydrateFromCloud failed", e);
    _cloudError = e;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  $("#back-btn").addEventListener("click", () => {
    view = { screen:"home", tankId:null, tab:"details" };
    render();
  });
  $("#add-tank-btn").addEventListener("click", openAddTank);
  $("#backup-btn").addEventListener("click", openBackupModal);
  $("#import-file").addEventListener("change", handleImportFile);

  // Wire cloud status to the storage banner so user sees "Syncing… / Synced"
  if (window.CLOUD){
    window.CLOUD.setSyncHandlers(
      () => renderStorageBanner(),
      (err) => renderStorageBanner(err)
    );
  }

  // Render once with whatever's local so the UI isn't empty while cloud loads
  migrateLogs();
  renderStorageBanner();
  render();

  // Then pull authoritative data from cloud and re-render
  await hydrateFromCloud();
  migrateLogs();
  renderStorageBanner();
  render();
});

/* ============================================================
   STORAGE BANNER + BACKUP MODAL
   ============================================================ */
function renderStorageBanner(err){
  const el = $("#storage-banner");
  if (!el) return;
  // Cloud sync error trumps everything else.
  if (err){
    el.hidden = false;
    el.className = "warn";
    el.innerHTML = `<b>Cloud sync error.</b> Your latest edits may not have saved. Check your connection — we'll retry automatically on next save.`;
    return;
  }
  // Cloud is the source of truth now. Show a small confirmation chip when ready.
  if (window.CLOUD && _cloudReady){
    el.hidden = false;
    el.className = "ok";
    el.innerHTML = `<span>☁️ Synced to cloud — your data is safe across phone restarts.</span>`;
    // Auto-hide after a few seconds so it stops nagging.
    setTimeout(() => { if (el && el.className === "ok") el.hidden = true; }, 4000);
    return;
  }
  if (window.CLOUD && !_cloudReady){
    el.hidden = false;
    el.className = "";
    el.innerHTML = `<span>Loading your tanks from the cloud…</span>`;
    return;
  }
  // Fallback (cloud script didn't load at all): old local-storage warning.
  if (STORAGE_OK){
    el.hidden = true;
    el.innerHTML = "";
    return;
  }
  el.hidden = false;
  el.className = "";
  el.innerHTML = `
    <b>Storage is blocked on this device.</b><br>
    Your edits won't survive closing the app. Use Backup to save a file to your phone, and Restore to load it back.
    <div class="row">
      <button class="btn small" id="banner-backup">Save backup now</button>
      <button class="btn small secondary" id="banner-restore">Restore from file</button>
    </div>
  `;
  const b1 = $("#banner-backup"); if (b1) b1.addEventListener("click", downloadBackup);
  const b2 = $("#banner-restore"); if (b2) b2.addEventListener("click", () => $("#import-file").click());
}

function handleImportFile(ev){
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const res = restoreFromText(String(reader.result || ""));
      toast(`Restored — ${res.tankCount} tanks, ${res.eventCount} history entries`);
      closeModal();
      view = { screen:"home", tankId:null, tab:"details" };
      render();
    } catch(err){
      alert("Couldn't restore: " + err.message);
    }
  };
  reader.onerror = () => alert("Couldn't read that file.");
  reader.readAsText(file);
  ev.target.value = ""; // allow re-importing same filename later
}

function openBackupModal(){
  const okText  = STORAGE_OK ? "Storage is working on this device." : "Storage is BLOCKED — always make a backup before closing.";
  const okClass = STORAGE_OK ? "ok" : "bad";
  openModal(`
    <h3>Backup &amp; Restore</h3>
    <p class="backup-status ${okClass}">${okText}</p>

    <div class="backup-block">
      <h4>📂 Save backup to Files</h4>
      <p>Download a snapshot of every tank, fish, water change, and test. iOS will save it to your Files app or Downloads.</p>
      <button class="btn block" id="do-export">Save backup file</button>
    </div>

    <div class="backup-block">
      <h4>⬆️ Restore from file</h4>
      <p>Pick a backup file you saved earlier to load all your data back.</p>
      <button class="btn block secondary" id="do-import">Choose backup file</button>
    </div>

    <div class="backup-block">
      <h4>📋 Copy backup as text</h4>
      <p>Paste this into Notes or email if you can't save files. Long‑press and Select All to copy.</p>
      <textarea class="input" id="backup-text" rows="6" readonly style="font-family:ui-monospace,Menlo,monospace;font-size:11px"></textarea>
      <div class="row" style="margin-top:8px">
        <button class="btn small secondary" id="copy-backup">Copy to clipboard</button>
        <button class="btn small secondary" id="paste-restore">Restore from clipboard</button>
      </div>
    </div>

    <div class="row" style="margin-top:8px">
      <button class="btn secondary block" id="close-backup">Close</button>
    </div>
  `, () => {
    const ta = $("#backup-text");
    ta.value = JSON.stringify(snapshot());
    $("#do-export").addEventListener("click", downloadBackup);
    $("#do-import").addEventListener("click", () => $("#import-file").click());
    $("#copy-backup").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(ta.value); toast("Copied"); }
      catch(e){ ta.select(); document.execCommand && document.execCommand("copy"); toast("Copied"); }
    });
    $("#paste-restore").addEventListener("click", async () => {
      try {
        const txt = await navigator.clipboard.readText();
        if (!txt) throw new Error("Clipboard is empty");
        const res = restoreFromText(txt);
        toast(`Restored — ${res.tankCount} tanks, ${res.eventCount} history entries`);
        closeModal();
        view = { screen:"home", tankId:null, tab:"details" };
        render();
      } catch(err){
        alert("Couldn't restore from clipboard: " + err.message);
      }
    });
    $("#close-backup").addEventListener("click", closeModal);
  });
}
