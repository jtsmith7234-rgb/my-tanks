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
const KEY_THEME  = "tm.theme.v1";
const KEY_PREFS  = "tm.prefs.v1";   // small key-value preferences bag

function getPrefs(){
  try { return JSON.parse(store.get(KEY_PREFS) || "{}") || {}; } catch(_) { return {}; }
}
function setPref(k, v){
  const p = getPrefs();
  p[k] = v;
  store.set(KEY_PREFS, JSON.stringify(p));
}
function getPref(k, fallback){
  const p = getPrefs();
  return (k in p) ? p[k] : fallback;
}
const DEFAULT_THEME = "tropical-pop";
const THEMES = {
  "midnight-reef": { id:"midnight-reef", skin:"dark",  label:"The Deep",           desc:"Deep navy reef with cyan highlights" },
  "tropical-pop":  { id:"tropical-pop",  skin:"light", label:"Tropical Pop",       desc:"Bright aqua, crisp white, coral accents (default)" },
  "planted":       { id:"planted",       skin:"light", label:"Planted Freshwater", desc:"Lush green planted-tank vibe, swaying background plants" }
};
// Map legacy stored values to the current theme set. Removed themes fall
// through normalizeTheme() to DEFAULT_THEME unless mapped here explicitly.
const LEGACY_THEME_MAP = { aquarium:"midnight-reef" };
function normalizeTheme(id){
  if (THEMES[id]) return id;
  if (LEGACY_THEME_MAP[id]) return LEGACY_THEME_MAP[id];
  return DEFAULT_THEME;
}
function getTheme(){
  try { return normalizeTheme(store.get(KEY_THEME)); } catch(_) { return DEFAULT_THEME; }
}
function applyTheme(id){
  const t = normalizeTheme(id);
  const root = document.documentElement;
  root.dataset.theme = t;
  root.dataset.skin = THEMES[t].skin;
  try { store.set(KEY_THEME, t); } catch(_){}
}
// apply immediately so there is no flash of unstyled background
applyTheme(getTheme());

/* ============================================================
   BACKUP / RESTORE — export/import the whole app to a JSON file
   ============================================================ */
function snapshot(){
  return {
    app: "My Tanks",
    version: 1,
    exportedAt: new Date().toISOString(),
    tanks: JSON.parse(store.get(KEY_TANKS) || "null") || (typeof tanks !== "undefined" ? tanks : []),
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
  window.events = events;
  saveTanks(tanks);
  saveEvents(events);
  saveLogs(logs);
  return { tankCount: tanks.length, eventCount: Object.values(events).reduce((s,a)=>s+a.length,0) };
}

/* ============================================================
   STATE
   ============================================================ */
function loadTanks(){
  // Fresh install → EMPTY tank list. Sample data is opt-in via Backup modal.
  const raw = store.get(KEY_TANKS);
  if(!raw) return [];
  try { return JSON.parse(raw); } catch(e){ return []; }
}
function loadSampleTanks(){
  const sample = (typeof SAMPLE_TANKS !== "undefined") ? SAMPLE_TANKS
               : (typeof DEFAULT_TANKS !== "undefined") ? DEFAULT_TANKS
               : [];
  return JSON.parse(JSON.stringify(sample));
}

/* Build a realistic history (water changes, water tests, dosing notes,
   fish-add entries) for each sample tank so graphs and the history log
   populate the moment someone taps "Load sample tanks". All timestamps
   are anchored to "now" so the timeline always looks recent. */
function seedSampleEvents(sampleTankList){
  const DAY = 86400000;
  const now = Date.now();
  const out = {};

  // Per-tank scripted histories. Each entry is {daysAgo, type, data}.
  // Numbers chosen to look like a tank that's been running ~6–8 weeks
  // and has cycled through ammonia→nitrite→nitrate already.
  const SCRIPTS = {
    "sample-community-40": [
      {daysAgo:55, type:"tank_edit",   data:{notes:"Tank set up and filled"}},
      {daysAgo:54, type:"water_test",  data:{ph:7.4, ammonia:0,    nitrite:0,    nitrate:0,  temp_f:78}},
      {daysAgo:48, type:"water_test",  data:{ph:7.4, ammonia:1.0,  nitrite:0.25, nitrate:5,  temp_f:78}},
      {daysAgo:40, type:"water_test",  data:{ph:7.3, ammonia:0.5,  nitrite:1.0,  nitrate:10, temp_f:78}},
      {daysAgo:32, type:"water_test",  data:{ph:7.3, ammonia:0,    nitrite:0.25, nitrate:20, temp_f:78}},
      {daysAgo:28, type:"water_change",data:{gallons:15, prime_mL:1.5, stability_mL:1.5, fert_pumps:0, notes:"First post-cycle change"}},
      {daysAgo:28, type:"water_test",  data:{ph:7.3, ammonia:0, nitrite:0, nitrate:10, temp_f:78}},
      {daysAgo:25, type:"fish_add",    data:{species:"Neon Tetra", count:8, notes:"Added first school"}},
      {daysAgo:21, type:"water_change",data:{gallons:15, prime_mL:1.5, stability_mL:1.5, fert_pumps:1, notes:"Weekly change"}},
      {daysAgo:21, type:"water_test",  data:{ph:7.3, ammonia:0, nitrite:0, nitrate:15, temp_f:78}},
      {daysAgo:18, type:"fish_add",    data:{species:"Harlequin Rasbora", count:6, notes:"Second species added"}},
      {daysAgo:14, type:"water_change",data:{gallons:15, prime_mL:1.5, stability_mL:0, fert_pumps:1, notes:""}},
      {daysAgo:14, type:"water_test",  data:{ph:7.4, ammonia:0, nitrite:0, nitrate:20, temp_f:78}},
      {daysAgo:11, type:"fish_add",    data:{species:"Bronze Cory", count:5, notes:"Bottom dwellers"}},
      {daysAgo:7,  type:"water_change",data:{gallons:15, prime_mL:1.5, stability_mL:0, fert_pumps:1, notes:""}},
      {daysAgo:7,  type:"water_test",  data:{ph:7.4, ammonia:0, nitrite:0, nitrate:15, temp_f:78}},
      {daysAgo:2,  type:"water_test",  data:{ph:7.4, ammonia:0, nitrite:0, nitrate:20, temp_f:78}}
    ],

    "sample-betta-10": [
      {daysAgo:45, type:"tank_edit",   data:{notes:"Tank cycled with bacteria starter"}},
      {daysAgo:42, type:"water_test",  data:{ph:7.0, ammonia:0.5, nitrite:0.25, nitrate:5,  temp_f:80}},
      {daysAgo:30, type:"water_test",  data:{ph:7.0, ammonia:0,   nitrite:0,    nitrate:10, temp_f:80}},
      {daysAgo:28, type:"water_change",data:{gallons:3, prime_mL:0.3, stability_mL:0.3, fert_pumps:0, notes:"Pre-fish water change"}},
      {daysAgo:27, type:"fish_add",    data:{species:"Betta", count:1, name:"Sample Betta", notes:"Acclimated over 30 min"}},
      {daysAgo:21, type:"water_change",data:{gallons:2.5, prime_mL:0.25, stability_mL:0, fert_pumps:0, notes:""}},
      {daysAgo:21, type:"water_test",  data:{ph:7.0, ammonia:0, nitrite:0, nitrate:10, temp_f:80}},
      {daysAgo:14, type:"water_change",data:{gallons:2.5, prime_mL:0.25, stability_mL:0, fert_pumps:0, notes:""}},
      {daysAgo:14, type:"water_test",  data:{ph:7.0, ammonia:0, nitrite:0, nitrate:15, temp_f:80}},
      {daysAgo:10, type:"fish_add",    data:{species:"Nerite Snail", count:2, notes:"Algae crew"}},
      {daysAgo:7,  type:"water_change",data:{gallons:2.5, prime_mL:0.25, stability_mL:0, fert_pumps:0, notes:""}},
      {daysAgo:7,  type:"water_test",  data:{ph:7.0, ammonia:0, nitrite:0, nitrate:10, temp_f:80}},
      {daysAgo:1,  type:"water_test",  data:{ph:7.0, ammonia:0, nitrite:0, nitrate:15, temp_f:80}}
    ],

    "sample-shrimp-5": [
      {daysAgo:60, type:"tank_edit",   data:{notes:"Aquasoil added, plants in, light running"}},
      {daysAgo:55, type:"water_test",  data:{ph:6.5, ammonia:2.0, nitrite:0.25, nitrate:5,  temp_f:72}},
      {daysAgo:45, type:"water_test",  data:{ph:6.5, ammonia:0.5, nitrite:1.0,  nitrate:10, temp_f:72}},
      {daysAgo:35, type:"water_test",  data:{ph:6.6, ammonia:0,   nitrite:0,    nitrate:15, temp_f:72}},
      {daysAgo:30, type:"water_change",data:{gallons:1, prime_mL:0.1, stability_mL:0, fert_pumps:0, notes:"Extra wait — maturing biofilm"}},
      {daysAgo:25, type:"fish_add",    data:{species:"Cherry Shrimp", count:12, notes:"Drip-acclimated 90 min"}},
      {daysAgo:18, type:"water_change",data:{gallons:1, prime_mL:0.1, stability_mL:0, fert_pumps:0, notes:""}},
      {daysAgo:18, type:"water_test",  data:{ph:6.6, ammonia:0, nitrite:0, nitrate:10, temp_f:72}},
      {daysAgo:11, type:"water_change",data:{gallons:1, prime_mL:0.1, stability_mL:0, fert_pumps:0, notes:""}},
      {daysAgo:11, type:"water_test",  data:{ph:6.6, ammonia:0, nitrite:0, nitrate:15, temp_f:72}},
      {daysAgo:5,  type:"water_change",data:{gallons:1, prime_mL:0.1, stability_mL:0, fert_pumps:0, notes:"Berried female spotted"}},
      {daysAgo:2,  type:"water_test",  data:{ph:6.6, ammonia:0, nitrite:0, nitrate:10, temp_f:72}}
    ],

    "sample-goldfish-29": [
      {daysAgo:70, type:"tank_edit",   data:{notes:"Coldwater setup — no heater"}},
      {daysAgo:65, type:"water_test",  data:{ph:7.6, ammonia:0,   nitrite:0,    nitrate:0,  temp_f:68}},
      {daysAgo:55, type:"water_test",  data:{ph:7.6, ammonia:1.5, nitrite:0.5,  nitrate:5,  temp_f:68}},
      {daysAgo:42, type:"water_test",  data:{ph:7.5, ammonia:0,   nitrite:0,    nitrate:20, temp_f:68}},
      {daysAgo:38, type:"water_change",data:{gallons:10, prime_mL:1, stability_mL:1, fert_pumps:0, notes:"Heavy change before fish"}},
      {daysAgo:35, type:"fish_add",    data:{species:"Fancy Goldfish", count:2, notes:"Slow drip acclimation"}},
      {daysAgo:28, type:"water_change",data:{gallons:10, prime_mL:1, stability_mL:0, fert_pumps:0, notes:"Weekly change — goldfish are messy"}},
      {daysAgo:28, type:"water_test",  data:{ph:7.5, ammonia:0,   nitrite:0,    nitrate:30, temp_f:68}},
      {daysAgo:21, type:"water_change",data:{gallons:10, prime_mL:1, stability_mL:0, fert_pumps:0, notes:""}},
      {daysAgo:21, type:"water_test",  data:{ph:7.5, ammonia:0,   nitrite:0,    nitrate:25, temp_f:68}},
      {daysAgo:14, type:"water_change",data:{gallons:10, prime_mL:1, stability_mL:0, fert_pumps:0, notes:""}},
      {daysAgo:14, type:"water_test",  data:{ph:7.5, ammonia:0,   nitrite:0,    nitrate:30, temp_f:68}},
      {daysAgo:7,  type:"water_change",data:{gallons:10, prime_mL:1, stability_mL:0, fert_pumps:0, notes:""}},
      {daysAgo:7,  type:"water_test",  data:{ph:7.5, ammonia:0,   nitrite:0,    nitrate:25, temp_f:68}},
      {daysAgo:1,  type:"water_test",  data:{ph:7.5, ammonia:0,   nitrite:0,    nitrate:30, temp_f:68}}
    ]
  };

  sampleTankList.forEach(t => {
    const script = SCRIPTS[t.id];
    if (!script) return;
    // Build events newest-first to match existing convention.
    const list = script
      .map(s => ({ id: uid(), ts: now - s.daysAgo*DAY, type: s.type, data: s.data }))
      .sort((a, b) => b.ts - a.ts);
    out[t.id] = list;
  });

  return out;
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
window.events = events; // expose for advisor.js

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
  window.events = events;
  // Re-schedule reminders since lastEventTs changed
  if (window.REMINDERS && type !== "reminder_fired" && type !== "advisor"){
    try { window.REMINDERS.scheduleAllReminders(); } catch(e){}
  }
}
function deleteEvent(tankId, eventId){
  if(!events[tankId]) return;
  events[tankId] = events[tankId].filter(e => e.id !== eventId);
  saveEvents(events);
  window.events = events;
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

function openTankActions(tankId){
  const t = tanks.find(x => x.id === tankId);
  if (!t) return;
  const html = `
    <div class="action-sheet">
      <div class="action-sheet-head">
        <h3 style="margin:0 0 4px">${escapeHTML(t.name)}</h3>
        <p class="muted small" style="margin:0">${t.gallons} gal &middot; ${escapeHTML(t.type||"Freshwater")}</p>
      </div>
      <button class="action-row" id="act-open">
        <span class="action-ico">📂</span>
        <span class="action-label">Open tank</span>
      </button>
      <button class="action-row" id="act-edit">
        <span class="action-ico">✏️</span>
        <span class="action-label">Edit tank info</span>
      </button>
      <button class="action-row" id="act-clean">
        <span class="action-ico">🧹</span>
        <span class="action-label">Log water change</span>
      </button>
      <button class="action-row" id="act-test">
        <span class="action-ico">🧪</span>
        <span class="action-label">Log water test</span>
      </button>
      <button class="action-row danger" id="act-delete">
        <span class="action-ico">🗑️</span>
        <span class="action-label">Delete tank</span>
      </button>
      <button class="action-row cancel" id="act-cancel">Cancel</button>
    </div>
  `;
  openModal(html, () => {
    const go = (tab) => {
      closeModal();
      view = { screen:"tank", tankId: t.id, tab };
      render();
      window.scrollTo({top:0});
    };
    $("#act-open").addEventListener("click",  () => go("details"));
    $("#act-edit").addEventListener("click",  () => go("details"));
    $("#act-clean").addEventListener("click", () => go("clean"));
    $("#act-test").addEventListener("click",  () => go("tests"));
    $("#act-cancel").addEventListener("click",() => closeModal());
    $("#act-delete").addEventListener("click", () => {
      if(!confirm(`Delete "${t.name}"? This can't be undone.`)) return;
      tanks = tanks.filter(x => x.id !== t.id);
      delete logs[t.id];
      delete events[t.id];
      saveTanks(tanks); saveLogs(logs); saveEvents(events);
      closeModal();
      view = { screen:"home", tankId:null, tab:"details" };
      render();
      toast("Tank deleted");
    });
  });
}

function _tankStatus(t){
  // Returns { tone: "ok"|"fyi"|"soon"|"urgent", label, hint }
  try {
    const adv = window.ADVISOR && window.ADVISOR.computeAdvice ? window.ADVISOR.computeAdvice(t) : null;
    if (adv && adv.sev){
      if (adv.sev === "urgent") return { tone:"urgent", label:"Needs attention", hint: adv.title || "" };
      if (adv.sev === "soon")   return { tone:"soon",   label:"Check soon",      hint: adv.title || "" };
      if (adv.sev === "fyi")    return { tone:"fyi",    label:"Heads up",         hint: adv.title || "" };
    }
  } catch(e){}
  return { tone:"ok", label:"Looking good", hint:"" };
}

function _renderTankCard(t){
  const st = _tankStatus(t);
  const animals = totalFish(t);
  const species = (t.fish||[]).length;
  return `
    <button class="tank-card tc-${st.tone}" data-tank="${t.id}">
      <div class="tc-top">
        <h3 class="tc-name">${escapeHTML(t.name)}</h3>
        <span class="tc-status tc-status-${st.tone}" title="${escapeHTML(st.hint)}">
          <span class="tc-dot"></span>${st.label}
        </span>
      </div>
      <div class="tc-meta">${t.gallons} gal &middot; ${escapeHTML(t.type||"Freshwater")} &middot; ${animals} ${animals === 1 ? "animal" : "animals"}${species ? ` &middot; ${species} ${species === 1 ? "species" : "species"}` : ""}</div>
    </button>
  `;
}

function renderHome(){
  const main = $("#main");
  if(!tanks.length){
    main.innerHTML = `
      <div class="section center">
        <h2>Let's add your first tank</h2>
        <p class="muted">Tap the + button up top to get started. It takes about a minute.</p>
      </div>
      <div class="section first-tank-cta">
        <h2>🌱 New to keeping fish?</h2>
        <p class="muted" style="margin:0">Once your tank is added, open it and turn on <b>First Tank Mode</b> — a simple, day-by-day walkthrough that gets you to healthy fish safely.</p>
      </div>
      <div class="center" style="margin-top:14px">
        <button class="btn small secondary" id="load-sample-data">Just looking? Load sample tanks</button>
        <p class="muted" style="font-size:11px;margin:8px 0 0">Demo data only — safe to wipe later from Backup &amp; Settings.</p>
      </div>`;
    const sampleBtn = $("#load-sample-data");
    if (sampleBtn) sampleBtn.addEventListener("click", () => {
      if (!confirm("Load sample tanks for a tour? You can clear them anytime from Backup & Settings.")) return;
      tanks = loadSampleTanks();
      events = seedSampleEvents(tanks);
      window.events = events;
      saveTanks(tanks);
      saveEvents(events);
      toast("Sample tanks loaded with history");
      render();
    });
    return;
  }
  main.innerHTML = `
    <div class="grid">
      ${tanks.map(t => `
        <div class="swipe-row" data-row="${t.id}">
          <div class="swipe-actions-left">
            <button class="swipe-act edit" data-act="edit" data-tank="${t.id}">
              <span class="swipe-ico">✏️</span><span class="swipe-lbl">Edit</span>
            </button>
          </div>
          <div class="swipe-actions-right">
            <button class="swipe-act delete" data-act="delete" data-tank="${t.id}">
              <span class="swipe-ico">🗑️</span><span class="swipe-lbl">Delete</span>
            </button>
          </div>
          ${_renderTankCard(t)}
        </div>
      `).join("")}
    </div>
    <div class="spacer-12"></div>
    <p class="muted center" style="font-size:12px">Your data is saved right on this device. Add to Home Screen from Safari to use it like a real app.</p>
  `;
  // ---- Swipe-to-reveal on tank rows (iOS-style) ----
  const REVEAL = 96;       // px the card slides to expose the action button
  const COMMIT = 180;      // drag past this on either side = auto-commit
  const SWIPE_MIN = 8;     // px before we consider it a horizontal swipe
  let openRow = null;      // currently revealed row (only one at a time)

  const closeOpenRow = (except) => {
    if (openRow && openRow !== except) {
      openRow.classList.remove("revealed-left","revealed-right");
      const c = openRow.querySelector(".tank-card");
      if (c) c.style.transform = "";
      openRow = null;
    }
  };

  $$(".swipe-row").forEach(row => {
    const card = row.querySelector(".tank-card");
    const tankId = row.dataset.row;
    let startX = 0, startY = 0, dx = 0, dy = 0;
    let tracking = false, locked = false, axis = null;
    let didSwipe = false;

    const onStart = (x, y) => {
      startX = x; startY = y; dx = 0; dy = 0;
      tracking = true; locked = false; axis = null; didSwipe = false;
      card.style.transition = "none";
    };
    const onMove = (x, y) => {
      if (!tracking) return;
      dx = x - startX;
      dy = y - startY;
      if (!locked) {
        if (Math.abs(dx) < SWIPE_MIN && Math.abs(dy) < SWIPE_MIN) return;
        // lock to the dominant axis
        axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        locked = true;
        if (axis === "x") {
          didSwipe = true;
          closeOpenRow(row);
        }
      }
      if (axis !== "x") return;
      // rubber-band beyond COMMIT
      let t = dx;
      if (Math.abs(t) > COMMIT) {
        const over = Math.abs(t) - COMMIT;
        t = (t > 0 ? 1 : -1) * (COMMIT + over * 0.35);
      }
      card.style.transform = `translateX(${t}px)`;
      row.classList.toggle("swiping-left",  t < 0);
      row.classList.toggle("swiping-right", t > 0);
    };
    const onEnd = () => {
      if (!tracking) return;
      tracking = false;
      card.style.transition = "";
      // always drop the active-swipe glow classes when the finger lifts
      row.classList.remove("swiping-left","swiping-right");
      if (axis !== "x") return;

      if (dx <= -COMMIT) {
        // auto-commit delete
        card.style.transform = `translateX(-100%)`;
        setTimeout(() => doDelete(tankId), 180);
        return;
      }
      if (dx >= COMMIT) {
        // auto-commit edit
        card.style.transform = "";
        row.classList.remove("revealed-left","revealed-right");
        openRow = null;
        goToTank(tankId, "details");
        return;
      }
      if (dx <= -REVEAL/2) {
        card.style.transform = `translateX(-${REVEAL}px)`;
        row.classList.add("revealed-right");
        row.classList.remove("revealed-left");
        openRow = row;
        return;
      }
      if (dx >= REVEAL/2) {
        card.style.transform = `translateX(${REVEAL}px)`;
        row.classList.add("revealed-left");
        row.classList.remove("revealed-right");
        openRow = row;
        return;
      }
      // snap back
      card.style.transform = "";
      row.classList.remove("revealed-left","revealed-right");
      if (openRow === row) openRow = null;
    };

    card.addEventListener("touchstart", (e) => {
      const t = e.touches[0]; onStart(t.clientX, t.clientY);
    }, { passive: true });
    card.addEventListener("touchmove", (e) => {
      const t = e.touches[0]; onMove(t.clientX, t.clientY);
    }, { passive: true });
    card.addEventListener("touchend",    onEnd);
    card.addEventListener("touchcancel", onEnd);
    // Safety net: if iOS sends the final touch event somewhere other than the card
    // (finger drags off the card, system gesture interrupts, scroll takes over),
    // the card was getting stuck translated. Mirror the desktop mouseup pattern.
    window.addEventListener("touchend",    () => { if (tracking) onEnd(); }, { passive: true });
    window.addEventListener("touchcancel", () => { if (tracking) onEnd(); }, { passive: true });

    // Pointer fallback for desktop testing
    let mouseDown = false;
    card.addEventListener("mousedown", (e) => { mouseDown = true; onStart(e.clientX, e.clientY); });
    window.addEventListener("mousemove", (e) => { if (mouseDown) onMove(e.clientX, e.clientY); });
    window.addEventListener("mouseup",   () => { if (mouseDown) { mouseDown = false; onEnd(); } });

    card.addEventListener("click", (e) => {
      if (didSwipe) { e.preventDefault(); e.stopPropagation(); didSwipe = false; return; }
      if (openRow) {
        // tapping the card while another row is open just closes it
        if (openRow !== row) { closeOpenRow(); e.preventDefault(); return; }
        // tapping a revealed card snaps it shut
        if (row.classList.contains("revealed-left") || row.classList.contains("revealed-right")) {
          card.style.transform = "";
          row.classList.remove("revealed-left","revealed-right");
          openRow = null;
          e.preventDefault();
          return;
        }
      }
      goToTank(tankId, "details");
    });
  });

  function goToTank(id, tab){
    view = { screen:"tank", tankId: id, tab };
    render();
    window.scrollTo({top:0});
  }
  function doDelete(id){
    const t = tanks.find(x => x.id === id);
    if (!t) return;
    if (!confirm(`Delete "${t.name}"? This can't be undone.`)) {
      // user bailed — snap card back
      const row = $(`.swipe-row[data-row="${id}"]`);
      const card = row && row.querySelector(".tank-card");
      if (card) card.style.transform = "";
      if (row) row.classList.remove("revealed-left","revealed-right");
      openRow = null;
      return;
    }
    tanks = tanks.filter(x => x.id !== id);
    delete logs[id];
    delete events[id];
    saveTanks(tanks); saveLogs(logs); saveEvents(events);
    openRow = null;
    render();
    toast("Tank deleted");
  }

  // Edit / Delete buttons (when revealed and tapped)
  $$(".swipe-act").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.tank;
      const act = btn.dataset.act;
      if (act === "edit")   { closeOpenRow(); goToTank(id, "details"); }
      if (act === "delete") { doDelete(id); }
    });
  });

  // Tap outside to close any revealed row
  document.addEventListener("click", (e) => {
    if (!openRow) return;
    if (!e.target.closest(".swipe-row")) closeOpenRow();
  }, { capture: true });
  // Reset-to-defaults button removed — it would have wiped user data and
  // replaced it with personal sample tanks. Sample data is now opt-in via
  // the Backup & Settings modal ("Load sample data").
}

function renderAdvisorBanner(t){
  // Get top recommendation and log if new (history persistence)
  if (!window.ADVISOR) return "";
  let adv = null;
  try {
    adv = window.ADVISOR.computeAdvice(t);
    if (adv) {
      window.ADVISOR.logAdviceIfNew(t, adv);
      // Fire OS notification for urgent issues (if user opted in)
      if (window.REMINDERS) {
        try { window.REMINDERS.fireUrgentAdvisorNotif(t, adv); } catch(e){}
      }
    }
  } catch (err) { console.warn("advisor error", err); return ""; }
  if (!adv) return "";
  // Suppress if user dismissed this exact signature this session
  const sig = (adv.title + " | " + adv.rule);
  if (window._advisorDismissed && window._advisorDismissed[t.id] === sig) return "";
  return `
    <div class="advisor-banner ${adv.sev}" data-sig="${escapeHTML(sig)}">
      <div class="adv-icon">${adv.sev === "urgent" ? "\u26a0\ufe0f" : adv.sev === "soon" ? "\ud83d\udd14" : "\ud83c\udf38"}</div>
      <div class="adv-body">
        <div class="adv-title">${escapeHTML(adv.title)}</div>
        <div class="adv-text">${escapeHTML(adv.body)}</div>
      </div>
      <button class="adv-dismiss" id="adv-dismiss" aria-label="Dismiss">\u2715</button>
    </div>
  `;
}

function renderTank(){
  const t = getTank(view.tankId);
  if(!t){ view.screen = "home"; render(); return; }

  const main = $("#main");
  main.innerHTML = `
    ${renderAdvisorBanner(t)}
    <div class="tabs" role="tablist">
      <button class="tab ${view.tab==='details'?'active':''}" data-tab="details">Details</button>
      <button class="tab ${view.tab==='fish'?'active':''}" data-tab="fish">Fish</button>
      <button class="tab ${view.tab==='clean'?'active':''}" data-tab="clean">Care</button>
      <button class="tab ${view.tab==='tests'?'active':''}" data-tab="tests">Tests</button>
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

  // Wire up advisor dismiss button
  const dismiss = $("#adv-dismiss");
  if (dismiss){
    dismiss.addEventListener("click", () => {
      const banner = dismiss.closest(".advisor-banner");
      if (!banner) return;
      const sig = banner.getAttribute("data-sig") || "";
      window._advisorDismissed = window._advisorDismissed || {};
      window._advisorDismissed[t.id] = sig;
      banner.remove();
    });
  }
}

/* ============================================================
   DETAILS TAB
   ============================================================ */
/* ============================================================
   FRIENDLY DATE HELPERS — used by Up Next reminders list
   ============================================================ */
function _friendlyRelative(ts){
  if (!ts) return "";
  const diffMs = ts - Date.now();
  const absMs  = Math.abs(diffMs);
  const future = diffMs > 0;
  const minute = 60000, hour = 3600000, day = 86400000;
  if (absMs < minute)         return future ? "in under a minute" : "just now";
  if (absMs < hour){
    const m = Math.round(absMs/minute);
    return future ? `in ${m} min` : `${m} min ago`;
  }
  if (absMs < day){
    const h = Math.round(absMs/hour);
    return future ? `in ${h} hr` : `${h} hr ago`;
  }
  const d = Math.round(absMs/day);
  if (d === 1) return future ? "tomorrow" : "yesterday";
  if (d < 7)   return future ? `in ${d} days` : `${d} days ago`;
  if (d < 30){
    const w = Math.round(d/7);
    return future ? `in ${w} wk` : `${w} wk ago`;
  }
  const months = Math.round(d/30);
  return future ? `in ${months} mo` : `${months} mo ago`;
}
function _friendlyShortDate(ts){
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function renderUpNextSection(t){
  if (!window.REMINDERS || !window.REMINDERS.computeDueList) return "";
  const items = window.REMINDERS.computeDueList(t);
  if (!items.length){
    return `
      <div class="section">
        <h2>Up next</h2>
        <p class="muted" style="margin:0">No reminders turned on yet. Scroll down to set up water-change and water-test reminders.</p>
      </div>
    `;
  }
  const rows = items.map(it => {
    const sub = it.status === "due-now"
      ? `<span class="upn-sub bad">Due now</span>`
      : it.status === "snoozed"
        ? `<span class="upn-sub warn">Snoozed — next ${_friendlyRelative(it.nextDueTs)}</span>`
        : `<span class="upn-sub">Next ${_friendlyRelative(it.nextDueTs)} · ${_friendlyShortDate(it.nextDueTs)}</span>`;
    const lastTxt = it.lastDoneTs
      ? `Last done ${_friendlyRelative(it.lastDoneTs)}`
      : `Never done yet`;
    const showActions = it.status === "due-now" || it.status === "snoozed";
    const actions = showActions ? `
      <div class="upn-actions">
        <button class="btn small upn-done" data-type="${it.type}">Mark done</button>
        <button class="btn small secondary upn-snooze" data-type="${it.type}">Snooze 1 day</button>
        <button class="btn small secondary upn-skip" data-type="${it.type}">Skip once</button>
      </div>` : "";
    return `
      <div class="upn-row upn-${it.status}">
        <div class="upn-icon">${it.icon}</div>
        <div class="upn-body">
          <div class="upn-title">${escapeHTML(it.label)}</div>
          ${sub}
          <div class="upn-last muted small">${lastTxt} · every ${it.intervalDays} days</div>
        </div>
        ${actions}
      </div>
    `;
  }).join("");
  return `
    <div class="section">
      <h2>Up next</h2>
      <div class="upn-list">${rows}</div>
    </div>
  `;
}

function bindUpNext(t){
  if (!window.REMINDERS) return;
  $$(".upn-done").forEach(b => b.addEventListener("click", () => {
    const type = b.dataset.type;
    window.REMINDERS.markReminderDone(t, type);
    window.REMINDERS.scheduleAllReminders();
    toast("Marked done — next one scheduled");
    render();
  }));
  $$(".upn-snooze").forEach(b => b.addEventListener("click", () => {
    const type = b.dataset.type;
    window.REMINDERS.snoozeReminder(t, type, 24);
    window.REMINDERS.scheduleAllReminders();
    toast("Snoozed for 1 day");
    render();
  }));
  $$(".upn-skip").forEach(b => b.addEventListener("click", () => {
    const type = b.dataset.type;
    const meta = window.REMINDERS.REM_META[type];
    if (!confirm(`Skip this ${meta.label.toLowerCase()}? We'll bump it to the next regular cycle.`)) return;
    window.REMINDERS.skipReminder(t, type);
    window.REMINDERS.scheduleAllReminders();
    toast("Skipped — see you next cycle");
    render();
  }));
}

function renderDetails(t){
  return `
    ${renderUpNextSection(t)}

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

    ${window.FIRSTTANK ? window.FIRSTTANK.render(t) : ""}

    ${renderRemindersSection(t)}

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
function renderRemindersSection(t){
  if (!window.REMINDERS) return "";
  const rem = window.REMINDERS.getTankReminders(t.id);
  const perm = window.REMINDERS.notifPermission();
  const supported = window.REMINDERS.notifSupported();
  const wcInterval = rem.water_change.intervalDays || t.idealDays || 7;
  const wtInterval = rem.water_test.intervalDays || 7;
  const dailyTime = String(rem.daily.hour).padStart(2,"0") + ":" + String(rem.daily.minute).padStart(2,"0");

  let permBanner = "";
  if (!supported){
    permBanner = `<div class="rem-perm-banner muted">Phone notifications won\u2019t work in this browser. They\u2019ll start working once you install the app from the App Store.</div>`;
  } else if (perm === "default"){
    permBanner = `<div class="rem-perm-banner"><span>Want a phone alert when something is due?</span><button class="btn small" id="rem-enable">Turn on</button></div>`;
  } else if (perm === "denied"){
    permBanner = `<div class="rem-perm-banner muted">Phone notifications are off. You can turn them back on in your iOS settings under My Tanks.</div>`;
  } else {
    permBanner = `<div class="rem-perm-banner ok">\u2713 Phone notifications are on for this device.</div>`;
  }

  return `
    <div class="section">
      <h2>Reminder settings</h2>
      <p class="muted small" style="margin:-4px 0 10px">Choose how often each task should come up. You can mark, snooze, or skip from the Up next list above.</p>
      ${permBanner}
      <div class="rem-row">
        <label class="toggle"><input type="checkbox" id="rem-wc-on" ${rem.water_change.enabled?"checked":""}/><span>Remind me to do a water change</span></label>
        <label class="rem-interval"><span>every</span><input class="input tiny" id="rem-wc-days" type="number" min="1" max="60" value="${wcInterval}" /><span>days</span></label>
      </div>
      <div class="rem-row">
        <label class="toggle"><input type="checkbox" id="rem-wt-on" ${rem.water_test.enabled?"checked":""}/><span>Remind me to test the water</span></label>
        <label class="rem-interval"><span>every</span><input class="input tiny" id="rem-wt-days" type="number" min="1" max="60" value="${wtInterval}" /><span>days</span></label>
      </div>
      <div class="rem-row">
        <label class="toggle"><input type="checkbox" id="rem-daily-on" ${rem.daily.enabled?"checked":""}/><span>Daily check-in nudge</span></label>
        <label class="rem-interval"><span>at</span><input class="input tiny" id="rem-daily-time" type="time" value="${dailyTime}" /></label>
      </div>
      <div class="rem-row">
        <label class="toggle"><input type="checkbox" id="rem-urgent-on" ${rem.advisor_urgent.enabled?"checked":""}/><span>Alert me right away if water looks unsafe</span></label>
        <span class="muted small">Sends a notification if ammonia, nitrite, nitrate, or pH cross a danger line.</span>
      </div>
      <button class="btn" id="rem-save">Save reminder settings</button>
    </div>
  `;
}

function bindReminders(t){
  if (!window.REMINDERS) return;
  const enableBtn = document.getElementById("rem-enable");
  if (enableBtn){
    enableBtn.addEventListener("click", async () => {
      const result = await window.REMINDERS.requestNotifPermission();
      if (result === "granted"){
        window.REMINDERS.scheduleAllReminders();
        toast("Notifications on");
      } else if (result === "denied"){
        toast("Permission denied");
      }
      render();
    });
  }
  const saveBtn = document.getElementById("rem-save");
  if (saveBtn){
    saveBtn.addEventListener("click", () => {
      const timeStr = (document.getElementById("rem-daily-time").value || "09:00").split(":");
      const rem = {
        water_change: {
          enabled: document.getElementById("rem-wc-on").checked,
          intervalDays: Math.max(1, parseInt(document.getElementById("rem-wc-days").value) || 7)
        },
        water_test: {
          enabled: document.getElementById("rem-wt-on").checked,
          intervalDays: Math.max(1, parseInt(document.getElementById("rem-wt-days").value) || 7)
        },
        daily: {
          enabled: document.getElementById("rem-daily-on").checked,
          hour: parseInt(timeStr[0]) || 9,
          minute: parseInt(timeStr[1]) || 0
        },
        advisor_urgent: {
          enabled: document.getElementById("rem-urgent-on").checked
        }
      };
      window.REMINDERS.setTankReminders(t.id, rem);
      window.REMINDERS.scheduleAllReminders();
      toast("Reminder settings saved");
      render();
    });
  }
}

function bindDetails(t){
  bindUpNext(t);
  bindReminders(t);
  if (window.FIRSTTANK){
    window.FIRSTTANK.bind(t, (msg) => {
      saveTanks(tanks);
      logEvent(t.id, "first_tank", { msg });
      render();
    });
  }
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
        `).join("") || `<p class="muted">No fish added yet. Use the picker below to add your first one.</p>`}
      </div>
    </div>

    <div class="section">
      <h2>Add fish or invertebrate</h2>
      <div class="row">
        <label class="field species-field"><span>Species</span>
          <input class="input" id="add-species" placeholder="Start typing (e.g. neon, betta, cory)" autocomplete="off" />
          <div id="species-suggest" class="species-suggest" hidden></div>
        </label>
        <label class="field"><span>Count</span><input class="input" id="add-count" type="number" min="1" value="1" /></label>
      </div>
      <label class="field"><span>Name (optional)</span><input class="input" id="add-name" placeholder="e.g. Boss" /></label>
      <div id="species-info"></div>
      <button class="btn block" id="add-fish-btn">Add to tank</button>
    </div>

    <div class="section">
      <h2>Species compatibility</h2>
      <div class="seg seg-fill species-modes" role="tablist">
        <button type="button" class="seg-btn active" data-spmode="check" role="tab">Check fit</button>
        <button type="button" class="seg-btn" data-spmode="browse" role="tab">Browse species</button>
      </div>

      <div class="spmode-panel" data-spmode-panel="check">
        <p class="muted" style="margin-top:12px">Search to see if a fish is a good fit for this tank.</p>
        <label class="field compat-field">
          <input class="input" id="compat-search" placeholder="Search fish or species" autocomplete="off" />
          <div id="compat-suggest" class="species-suggest" hidden></div>
        </label>
        <div id="compat-result"></div>
      </div>

      <div class="spmode-panel" data-spmode-panel="browse" hidden>
        <p class="muted" style="margin-top:12px">Tap a fish for a quick expert profile.</p>
        <label class="field">
          <input class="input" id="browse-search" placeholder="Search species" autocomplete="off" />
        </label>
        <div id="browse-list" class="browse-list"></div>
      </div>
    </div>
  `;
}
function bindFish(t){
  // ----- Autocomplete on species input -----
  const spInput = $("#add-species");
  const spSugg  = $("#species-suggest");
  const spInfo  = $("#species-info");

  function showSuggestions(q){
    if (!window.FISHDB_API) return;
    const results = window.FISHDB_API.search(q, 5);
    if (!results.length){ spSugg.hidden = true; spSugg.innerHTML = ""; return; }
    spSugg.innerHTML = results.map(f => `
      <button type="button" class="species-suggest-row" data-name="${escapeHTML(f.name)}">
        <span class="species-suggest-name">${escapeHTML(f.name)}</span>
        <span class="species-suggest-meta">${f.minGal} gal · ${f.tempLo}-${f.tempHi}°F · pH ${f.phLo}-${f.phHi}</span>
      </button>
    `).join("");
    spSugg.hidden = false;
    $$(".species-suggest-row", spSugg).forEach(b => b.addEventListener("click", () => {
      spInput.value = b.dataset.name;
      spSugg.hidden = true;
      renderSpeciesInfo(b.dataset.name);
    }));
  }

  function renderSpeciesInfo(name){
    if (!window.FISHDB_API){ spInfo.innerHTML = ""; return; }
    const f = window.FISHDB_API.byName(name);
    if (!f){ spInfo.innerHTML = ""; return; }
    // Tank-size warning
    let warn = "";
    if (t.gallons && f.minGal > t.gallons){
      warn = `<div class="species-warn"><b>Heads up:</b> This species needs at least ${f.minGal} gal. Your tank is ${t.gallons} gal.</div>`;
    }
    spInfo.innerHTML = warn + window.FISHDB_API.card(f);
  }

  if (spInput){
    spInput.addEventListener("input", () => {
      showSuggestions(spInput.value);
      // Clear info when user types past an exact match
      const f = window.FISHDB_API && window.FISHDB_API.byName(spInput.value.trim());
      if (f) renderSpeciesInfo(spInput.value.trim()); else spInfo.innerHTML = "";
    });
    spInput.addEventListener("blur", () => {
      // delay to allow click on suggestion
      setTimeout(() => { spSugg.hidden = true; }, 150);
    });
  }

  // ----- Species compatibility -----
  const compatSearch  = $("#compat-search");
  const compatSuggest = $("#compat-suggest");
  const compatResult  = $("#compat-result");

  function showCompatResult(name){
    if (!window.FISHDB_API){ compatResult.innerHTML = ""; return; }
    const f = window.FISHDB_API.byName(name);
    if (!f){ compatResult.innerHTML = ""; return; }
    const c = window.FISHDB_API.compatibility(f, t);
    if (!c){ compatResult.innerHTML = ""; return; }
    const reasons = c.reasons.map(r => `<li>${escapeHTML(r)}</li>`).join("");
    compatResult.innerHTML = `
      <div class="compat-card compat-${c.level}">
        <div class="compat-head">
          <span class="compat-dot"></span>
          <div>
            <div class="compat-fish">${escapeHTML(f.name)}</div>
            <div class="compat-label">${c.label}</div>
          </div>
        </div>
        <div class="compat-why">Why this result</div>
        <ul class="compat-reasons">${reasons}</ul>
      </div>
    `;
  }

  function showCompatSuggestions(q){
    if (!window.FISHDB_API){ return; }
    const results = window.FISHDB_API.search(q, 6);
    if (!results.length){ compatSuggest.hidden = true; compatSuggest.innerHTML = ""; return; }
    compatSuggest.innerHTML = results.map(f => `
      <button type="button" class="species-suggest-row" data-name="${escapeHTML(f.name)}">
        <span class="species-suggest-name">${escapeHTML(f.name)}</span>
        <span class="species-suggest-meta">${f.minGal} gal · ${f.adult}" adult · ${f.tempLo}-${f.tempHi}°F</span>
      </button>
    `).join("");
    compatSuggest.hidden = false;
    $$(".species-suggest-row", compatSuggest).forEach(b => b.addEventListener("click", () => {
      compatSearch.value = b.dataset.name;
      compatSuggest.hidden = true;
      showCompatResult(b.dataset.name);
    }));
  }

  if (compatSearch){
    compatSearch.addEventListener("input", () => {
      const v = compatSearch.value.trim();
      showCompatSuggestions(v);
      // Show result immediately if the text exactly matches a species.
      const f = window.FISHDB_API && window.FISHDB_API.byName(v);
      if (f) showCompatResult(v); else compatResult.innerHTML = "";
    });
    compatSearch.addEventListener("blur", () => {
      setTimeout(() => { compatSuggest.hidden = true; }, 150);
    });
  }

  // ----- Mode switch: Check fit / Browse species -----
  const modeBtns = $$(".species-modes .seg-btn");
  modeBtns.forEach(btn => btn.addEventListener("click", () => {
    const mode = btn.dataset.spmode;
    modeBtns.forEach(b => b.classList.toggle("active", b === btn));
    $$("[data-spmode-panel]").forEach(p => { p.hidden = p.dataset.spmodePanel !== mode; });
    if (mode === "browse") renderBrowseList("");
  }));

  // ----- Browse species -----
  const browseSearch = $("#browse-search");
  const browseList   = $("#browse-list");

  function renderBrowseList(q){
    if (!window.FISHDB_API || !browseList) return;
    const list = window.FISHDB_API.browse(q);
    if (!list.length){
      browseList.innerHTML = `<p class="muted browse-empty">No species match that search.</p>`;
      return;
    }
    browseList.innerHTML = list.map(f => `
      <button type="button" class="browse-row" data-name="${escapeHTML(f.name)}">
        <span class="browse-row-main">
          <span class="browse-row-name">${escapeHTML(f.name)}</span>
          ${f.sci ? `<span class="browse-row-sci">${escapeHTML(f.sci)}</span>` : ""}
        </span>
        <span class="browse-row-chev">›</span>
      </button>
      <div class="browse-detail" data-detail="${escapeHTML(f.name)}" hidden></div>
    `).join("");

    $$(".browse-row", browseList).forEach(row => row.addEventListener("click", () => {
      const name = row.dataset.name;
      const detail = browseList.querySelector(`[data-detail="${CSS.escape(name)}"]`);
      const isOpen = row.classList.contains("open");
      // Close any open profile first (single-open accordion).
      $$(".browse-row.open", browseList).forEach(r => r.classList.remove("open"));
      $$(".browse-detail", browseList).forEach(d => { d.hidden = true; d.innerHTML = ""; });
      if (!isOpen){
        const f = window.FISHDB_API.byName(name);
        detail.innerHTML = window.FISHDB_API.profileCard(f);
        detail.hidden = false;
        row.classList.add("open");
        bindSourcesToggle(detail);
      }
    }));
  }

  function bindSourcesToggle(scope){
    const toggle = scope.querySelector("[data-sources-toggle]");
    const drawer = scope.querySelector("[data-sources-drawer]");
    if (!toggle || !drawer) return;
    toggle.addEventListener("click", () => {
      const open = drawer.hidden;
      drawer.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.classList.toggle("open", open);
    });
  }

  if (browseSearch){
    browseSearch.addEventListener("input", () => renderBrowseList(browseSearch.value.trim()));
  }

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
  const suggested = Math.round(t.gallons * 0.5);
  if (!t.chemicals) t.chemicals = [];
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
    </div>

    <div class="section">
      <div class="chem-section-head">
        <h2>Your chemicals</h2>
        <button class="btn small" id="add-chem-btn">+ Add</button>
      </div>
      <div id="dose-out"></div>
    </div>

    <div class="section">
      <label class="field"><span>Session notes (optional)</span>
        <input class="input" id="wc-notes" placeholder="e.g. trimmed moss, vacuumed substrate" /></label>
      <button class="btn block" id="log-btn" style="margin-top:10px">Save to history</button>
    </div>
  `;
}

function renderChemPickerModal(){
  if (!window.CHEMICALS) return "";
  const byType = {};
  window.CHEMICALS.ALL.forEach(c => {
    byType[c.type] = byType[c.type] || [];
    byType[c.type].push(c);
  });
  const sections = Object.keys(byType).map(type => `
    <div class="chem-picker-section">
      <div class="chem-picker-type">${type}</div>
      ${byType[type].map(c => `
        <button type="button" class="chem-picker-item" data-lib="${c.id}">
          <div>
            <div class="chem-picker-name">${c.brand} ${c.name}</div>
            <div class="chem-picker-rule muted small">${c.rule}</div>
          </div>
        </button>
      `).join("")}
    </div>
  `).join("");
  return `
    <h3 style="margin-top:0">Add a chemical</h3>
    <p class="muted" style="margin-top:0">Pick from the library or add your own.</p>
    <input class="input" id="chem-search" placeholder="Search (e.g. Prime, bacteria, fert)" style="margin-bottom:8px" />
    <div id="chem-picker-list">${sections}</div>
    <div class="chem-picker-not-found">
      <p class="muted small" style="margin:12px 0 6px">Don't see your chemical?</p>
      <button class="btn block secondary" id="chem-custom-btn">+ Add custom chemical</button>
    </div>
    <button class="btn block secondary" id="chem-cancel-btn" style="margin-top:8px">Cancel</button>
  `;
}

function renderChemCustomModal(){
  return `
    <h3 style="margin-top:0">Custom chemical</h3>
    <p class="muted" style="margin-top:0">Read the bottle carefully. Enter the dose exactly as the label states.</p>
    <label class="field"><span>Brand</span><input class="input" id="cc-brand" placeholder="e.g. Seachem" /></label>
    <label class="field"><span>Product name</span><input class="input" id="cc-name" placeholder="e.g. Flourish Trace" /></label>
    <label class="field"><span>Type</span>
      <select class="input" id="cc-type">
        ${(window.CHEMICALS ? window.CHEMICALS.TYPES : []).map(t => `<option>${t}</option>`).join("")}
      </select>
    </label>
    <div class="row">
      <label class="field"><span>Amount per gallon</span><input class="input" id="cc-amount" type="number" step="0.01" placeholder="e.g. 0.1" /></label>
      <label class="field"><span>Unit</span>
        <select class="input" id="cc-unit">
          <option>mL</option><option>pumps</option><option>drops</option><option>g</option><option>tsp</option><option>oz</option>
        </select>
      </label>
    </div>
    <label class="field"><span>Bottle directions (what it says on the label)</span>
      <input class="input" id="cc-rule" placeholder="e.g. 1 mL per 10 gal weekly" /></label>
    <div class="row">
      <button class="btn" id="cc-save">Add to tank</button>
      <button class="btn secondary" id="cc-cancel">Cancel</button>
    </div>
  `;
}
function chemResolve(c){
  // Returns the effective spec for a tank chemical entry.
  // If the user verified with a manual dose, the manual values override the library defaults.
  const base = c.custom ? c.custom
    : (window.CHEMICALS ? window.CHEMICALS.byId(c.libraryId) : null);
  if (!base) return null;
  if (c.savedDose && c.doseSource === "manual"){
    return Object.assign({}, base, {
      mlPerGallon: c.savedDose.mlPerGallon,
      unit:        c.savedDose.unit || base.unit,
      rule:        c.savedDose.rule || base.rule,
      capSize:     (c.savedDose.capSize != null) ? c.savedDose.capSize : base.capSize
    });
  }
  return base;
}

function bindClean(t){
  const inp = $("#wc-gallons");
  const out = $("#dose-out");

  function doseCard(c, gallons){
    const spec = chemResolve(c);
    if (!spec) return "";
    const verified = !!c.verified;
    const amount = (spec.mlPerGallon || 0) * gallons;
    const caps = spec.capSize ? amount / spec.capSize : 0;
    const unit = spec.unit || "mL";
    const inline = (spec.capSize && spec.capSize > 1)
      ? `<span class="sub-inline">(${fmt(caps)} cap${caps===1?"":"s"})</span>`
      : "";
    const valueHTML = `${fmt(amount)}<span class="unit">${unit}</span> ${inline}`;
    const action = verified
      ? `<span class="verify-badge verified">✓ Verified</span>`
      : `<button class="btn small ghost" data-verify-now="${c.instanceId}">Verify dose</button>`;
    return `
      <div class="dose-card ${verified ? "verified" : ""}">
        <div class="dose-card-head">
          <div class="label">${escapeHTML(spec.brand || "")} ${escapeHTML(spec.name || "")}</div>
          ${action}
        </div>
        <div class="dose-heading">Dose</div>
        <div class="big">${valueHTML}</div>
        <div class="sub">${escapeHTML(spec.rule || "")}</div>
        <button class="chem-remove" data-remove="${c.instanceId}" title="Remove from tank">×</button>
      </div>
    `;
  }

  function paint(){
    const g = parseFloat(inp.value);
    const list = t.chemicals || [];
    if (!list.length){
      out.innerHTML = `<p class="muted center" style="margin:10px 0 0">No chemicals added. Tap <b>+ Add</b> to pick what you use.</p>`;
      return;
    }
    if(!g || g <= 0){
      out.innerHTML = `<p class="muted center" style="margin:10px 0 0">Enter a gallon amount above to see your doses.</p>`;
      return;
    }
    out.innerHTML = `<div class="dose-grid">${list.map(c => doseCard(c, g)).join("")}</div>`;
    $$("button[data-verify-now]", out).forEach(b => b.addEventListener("click", () => {
      const id = b.dataset.verifyNow;
      const entry = (t.chemicals || []).find(c => c.instanceId === id);
      if (entry) openVerifyPrompt(entry);
    }));
    $$("button[data-remove]", out).forEach(b => b.addEventListener("click", () => {
      const id = b.dataset.remove;
      t.chemicals = (t.chemicals || []).filter(c => c.instanceId !== id);
      saveTanks(tanks);
      paint();
    }));
  }
  inp.addEventListener("input", paint);
  paint();

  // ----- Verify-dose prompt (researched data + confirm / manual fallback) -----
  function openVerifyPrompt(entry){
    const spec = chemResolve(entry);
    if (!spec) return;
    const title = `${escapeHTML(spec.brand || "")} ${escapeHTML(spec.name || "")}`.trim();
    const srcLink = spec.source
      ? `<a class="chem-source" href="${spec.source}" target="_blank" rel="noopener">Source</a>`
      : "";
    openModal(`
      <h3 style="margin:0 0 6px">${title}</h3>
      <p class="muted small" style="margin:0 0 10px">Check this against your bottle label before confirming. Manufacturers sometimes change instructions between batches.</p>
      <div class="verify-prompt-rule">${escapeHTML(spec.rule || "")} ${srcLink}</div>
      <button class="btn block" id="vp-confirm" style="margin-top:14px">Confirm — matches my bottle</button>
      <button class="btn block link-btn" id="vp-manual" style="margin-top:8px">Not the correct dosage</button>
    `, () => {
      $("#vp-confirm").addEventListener("click", () => {
        entry.verified = true;
        entry.doseSource = entry.doseSource === "manual" ? "manual" : "researched";
        entry.savedDose = {
          mlPerGallon: spec.mlPerGallon,
          unit: spec.unit,
          rule: spec.rule,
          capSize: spec.capSize
        };
        entry.verifiedAt = new Date().toISOString();
        saveTanks(tanks);
        logEvent(t.id, "chem_verify", { name: title, source: entry.doseSource });
        closeModal();
        paint();
      });
      $("#vp-manual").addEventListener("click", () => {
        closeModal();
        openManualDose(entry);
      });
    });
  }

  function openManualDose(entry){
    const spec = chemResolve(entry);
    if (!spec) return;
    const title = `${escapeHTML(spec.brand || "")} ${escapeHTML(spec.name || "")}`.trim();
    const units = ["mL","pumps","drops","g","tsp","oz"];
    if (spec.unit && !units.includes(spec.unit)) units.unshift(spec.unit);
    openModal(`
      <h3 style="margin:0 0 6px">${title} — manual dose</h3>
      <p class="muted small" style="margin:0 0 10px">Enter the dose exactly as your bottle states.</p>
      <div class="row">
        <label class="field"><span>Amount per gallon</span>
          <input class="input" id="md-amount" type="number" step="0.01" placeholder="e.g. 0.1" /></label>
        <label class="field"><span>Unit</span>
          <select class="input" id="md-unit">
            ${units.map(u => `<option ${u===spec.unit?"selected":""}>${u}</option>`).join("")}
          </select>
        </label>
      </div>
      <label class="field"><span>Bottle directions (optional)</span>
        <input class="input" id="md-rule" placeholder="e.g. 1 mL per 10 gal" /></label>
      <div class="row" style="margin-top:6px">
        <button class="btn" id="md-save">Save & mark verified</button>
        <button class="btn secondary" id="md-cancel">Cancel</button>
      </div>
    `, () => {
      $("#md-save").addEventListener("click", () => {
        const amt = parseFloat($("#md-amount").value);
        const unit = $("#md-unit").value;
        const rule = $("#md-rule").value.trim();
        if (!amt || amt <= 0){ alert("Enter the amount per gallon"); return; }
        entry.savedDose = {
          mlPerGallon: amt,
          unit,
          rule: rule || `${amt} ${unit} per gallon`,
          capSize: 0
        };
        entry.doseSource = "manual";
        entry.verified = true;
        entry.verifiedAt = new Date().toISOString();
        saveTanks(tanks);
        logEvent(t.id, "chem_verify", { name: title, source: "manual" });
        closeModal();
        paint();
      });
      $("#md-cancel").addEventListener("click", closeModal);
    });
  }

  // ----- + Add chemical flow -----
  function openChemPicker(){
    openModal(renderChemPickerModal(), () => {
      const search = $("#chem-search");
      const list   = $("#chem-picker-list");
      function filter(q){
        const norm = (q || "").toLowerCase().trim();
        $$(".chem-picker-item", list).forEach(item => {
          const txt = item.textContent.toLowerCase();
          item.style.display = (!norm || txt.includes(norm)) ? "" : "none";
        });
        // Hide empty type sections
        $$(".chem-picker-section", list).forEach(sec => {
          const visible = $$(".chem-picker-item", sec).some(i => i.style.display !== "none");
          sec.style.display = visible ? "" : "none";
        });
      }
      if (search) search.addEventListener("input", e => filter(e.target.value));

      $$(".chem-picker-item").forEach(b => b.addEventListener("click", () => {
        const libId = b.dataset.lib;
        const entry = { instanceId: uid(), libraryId: libId, custom: null };
        t.chemicals = t.chemicals || [];
        // Prevent duplicates of the same library item
        if (t.chemicals.some(c => c.libraryId === libId)){
          toast("Already added");
          closeModal();
          return;
        }
        t.chemicals.push(entry);
        saveTanks(tanks);
        const spec = window.CHEMICALS && window.CHEMICALS.byId(libId);
        logEvent(t.id, "chem_add", { name: spec ? `${spec.brand} ${spec.name}` : libId });
        closeModal();
        paint();
        openVerifyPrompt(entry);
      }));
      $("#chem-custom-btn").addEventListener("click", () => { closeModal(); openCustom(); });
      $("#chem-cancel-btn").addEventListener("click", closeModal);
    });
  }
  function openCustom(){
    openModal(renderChemCustomModal(), () => {
      $("#cc-save").addEventListener("click", () => {
        const brand = $("#cc-brand").value.trim();
        const name  = $("#cc-name").value.trim();
        const type  = $("#cc-type").value;
        const amt   = parseFloat($("#cc-amount").value);
        const unit  = $("#cc-unit").value;
        const rule  = $("#cc-rule").value.trim();
        if (!brand || !name){ alert("Brand and name are required"); return; }
        if (!amt || amt <= 0){ alert("Enter the amount per gallon"); return; }
        const custom = {
          brand, name, type, unit,
          mlPerGallon: amt,
          capSize: 0,
          rule: rule || `${amt} ${unit} per gallon`,
          when: "",
          source: ""
        };
        const entry = { instanceId: uid(), libraryId: null, custom };
        t.chemicals = t.chemicals || [];
        t.chemicals.push(entry);
        saveTanks(tanks);
        logEvent(t.id, "chem_add", { name: `${brand} ${name}`, custom: true });
        closeModal();
        paint();
        openVerifyPrompt(entry);
      });
      $("#cc-cancel").addEventListener("click", closeModal);
    });
  }
  $("#add-chem-btn").addEventListener("click", openChemPicker);

  // ----- Save to history -----
  $("#log-btn").addEventListener("click", () => {
    const g = parseFloat(inp.value);
    if(!g || g <= 0){ alert("Enter a gallon amount first."); return; }
    const list = t.chemicals || [];
    const dosesLogged = list.map(c => {
      const spec = chemResolve(c);
      if (!spec) return null;
      return {
        name: `${spec.brand || ""} ${spec.name || ""}`.trim(),
        amount: +((spec.mlPerGallon || 0) * g).toFixed(2),
        unit: spec.unit || "mL",
        verified: !!c.verified,
        dose_source: c.doseSource || ""
      };
    }).filter(Boolean);
    logEvent(t.id, "water_change", {
      date: $("#wc-date").value || new Date().toISOString().slice(0,10),
      gallons: g,
      doses: dosesLogged,
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

    ${window.GRAPHS ? window.GRAPHS.renderGraphsSection(t) : ""}

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
  { id: "tank_edit",    label: "Tank edits"    },
  { id: "advisor",      label: "Advisor"       },
  { id: "reminder_fired", label: "Reminders"   },
  { id: "chem_add",     label: "Chemicals"     },
  { id: "first_tank",   label: "First Tank"    }
];
let historyFilter = "all";
let expandedEventId = null;

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
  const full = eventDetailFull(e);
  const isOpen = expandedEventId === e.id;
  return `
    <div class="event-row${isOpen ? " open" : ""}" data-id="${e.id}">
      <div class="event-main" data-expand="${e.id}" role="button" tabindex="0" aria-expanded="${isOpen}">
        <div class="event-icon ${e.type}">${icon}</div>
        <div class="event-body">
          <div class="event-title">${title}</div>
          <div class="event-when">${when}</div>
          ${detail ? `<div class="event-detail">${detail}</div>` : ""}
        </div>
        <svg class="event-chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8 10l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div class="event-expand">
        <div class="event-expand-inner">
          ${full || `<div class="event-field"><span class="event-fval muted">No additional details saved.</span></div>`}
          <button class="btn small danger event-del-btn" data-del="${e.id}">Remove entry</button>
        </div>
      </div>
    </div>`;
}

/* Build the full grouped field list shown when a history row is expanded.
   Fields are driven by data already stored on each event; missing fields are
   omitted rather than shown as empty placeholders. */
function eventDetailFull(e){
  const d = e.data || {};
  const rows = [];
  const add = (label, val) => { if (val != null && val !== "") rows.push({ label, val }); };

  if (e.type === "water_test") {
    add("pH", d.ph);
    add("Ammonia (NH₃)", d.ammonia);
    add("Nitrite (NO₂)", d.nitrite);
    add("Nitrate (NO₃)", d.nitrate);
    add("Temperature", d.temp_f != null && d.temp_f !== "" ? `${d.temp_f}°F` : "");
    add("Test date", d.date);
    add("Notes", d.notes ? escapeHTML(d.notes) : "");
  } else if (e.type === "water_change") {
    add("Amount changed", d.gallons != null ? `${fmt(d.gallons)} gal` : "");
    add("Change date", d.date);
    if (Array.isArray(d.doses) && d.doses.length){
      const lines = d.doses.map(dose =>
        `${escapeHTML(dose.name)} — ${fmt(dose.amount)} ${escapeHTML(dose.unit || "")}${dose.verified ? " ✓" : ""}`
      );
      rows.push({ label: "Doses", val: lines.join("<br>") });
    } else {
      if (d.prime_mL != null)     add("Prime", `${fmt(d.prime_mL)} mL`);
      if (d.stability_mL != null) add("Stability", `${fmt(d.stability_mL)} mL`);
      if (d.fert_pumps != null)   add("Easy Green", `${fmt(d.fert_pumps)} pumps`);
    }
    add("Notes", d.notes ? escapeHTML(d.notes) : "");
  } else if (e.type === "fish_add" || e.type === "fish_remove") {
    add("Species", d.species ? escapeHTML(d.species) : "");
    add("Quantity", d.count);
    add("Name", d.name ? escapeHTML(d.name) : "");
  } else if (e.type === "fish_edit" || e.type === "tank_edit") {
    if (d.species) add("Species", escapeHTML(d.species));
    if (d.name) add("Name", escapeHTML(d.name));
    const changes = d.changes || {};
    Object.keys(changes).forEach(k => {
      rows.push({ label: k, val: `${escapeHTML(String(changes[k].from ?? "—"))} → ${escapeHTML(String(changes[k].to ?? "—"))}` });
    });
  } else if (e.type === "advisor") {
    const sevLabel = d.sev === "urgent" ? "Urgent" : d.sev === "soon" ? "Soon" : "FYI";
    add("Severity", sevLabel);
    add("Details", d.body ? escapeHTML(d.body) : "");
    add("Triggered by", d.rule ? escapeHTML(d.rule) : "");
  } else if (e.type === "reminder_fired") {
    add("Details", d.body ? escapeHTML(d.body) : "");
  } else if (e.type === "chem_add" || e.type === "chem_verify") {
    add("Chemical", d.name ? escapeHTML(d.name) : "");
    add("Source", d.source ? escapeHTML(d.source) : "");
  } else if (e.type === "first_tank") {
    add("Update", d.msg ? escapeHTML(d.msg) : "");
  }

  add("Logged", formatTS(e.ts));

  if (!rows.length) return "";
  return rows.map(r =>
    `<div class="event-field"><span class="event-flabel">${escapeHTML(r.label)}</span><span class="event-fval">${r.val}</span></div>`
  ).join("");
}

function eventIcon(type){
  if (type === "water_change") return "💧";
  if (type === "water_test")   return "🧪";
  if (type === "fish_add")     return "➕";
  if (type === "fish_remove")  return "✖";
  if (type === "fish_edit")    return "✏️";
  if (type === "tank_edit")    return "🔧";
  if (type === "advisor")      return "🌸";
  if (type === "reminder_fired") return "🔔";
  if (type === "chem_add")       return "🧪";
  if (type === "first_tank")     return "🌱";
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
  if (e.type === "advisor")      return escapeHTML(d.title || "Advisor");
  if (e.type === "reminder_fired") return escapeHTML(d.title || "Reminder");
  if (e.type === "chem_add")     return `Added chemical: ${escapeHTML(d.name || "")}${d.custom ? " (custom)" : ""}`;
  if (e.type === "first_tank")   return `First Tank: ${escapeHTML(d.msg || "updated")}`;
  return e.type;
}
function eventDetail(e){
  const d = e.data || {};
  if (e.type === "water_change") {
    const bits = [];
    if (Array.isArray(d.doses) && d.doses.length){
      d.doses.forEach(dose => {
        const v = dose.verified ? " ✓" : "";
        bits.push(`${escapeHTML(dose.name)} ${fmt(dose.amount)} ${escapeHTML(dose.unit)}${v}`);
      });
    } else {
      // legacy entries
      if (d.prime_mL != null)     bits.push(`Prime ${fmt(d.prime_mL)} mL`);
      if (d.stability_mL != null) bits.push(`Stability ${fmt(d.stability_mL)} mL`);
      if (d.fert_pumps != null)   bits.push(`Easy Green ${fmt(d.fert_pumps)} pumps`);
    }
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
  if (e.type === "advisor") {
    const sevLabel = d.sev === "urgent" ? "Urgent" : d.sev === "soon" ? "Soon" : "FYI";
    return `<b class="sev-${escapeHTML(d.sev || "fyi")}">${sevLabel}</b> · ${escapeHTML(d.body || "")}<br><span class="muted">Triggered by: ${escapeHTML(d.rule || "")}</span>`;
  }
  if (e.type === "reminder_fired") {
    return escapeHTML(d.body || "");
  }
  return "";
}

function bindHistory(t){
  $$("[data-filter]").forEach(b => b.addEventListener("click", () => {
    historyFilter = b.dataset.filter;
    expandedEventId = null;
    render();
  }));
  $$("[data-del]").forEach(b => b.addEventListener("click", (ev) => {
    ev.stopPropagation();
    if(!confirm("Remove this entry from history?")) return;
    if (expandedEventId === b.dataset.del) expandedEventId = null;
    deleteEvent(t.id, b.dataset.del);
    render();
  }));
  const toggle = (id) => {
    const opening = expandedEventId !== id;
    expandedEventId = opening ? id : null;
    $$(".event-row").forEach(row => {
      const open = row.dataset.id === expandedEventId;
      row.classList.toggle("open", open);
      const main = row.querySelector(".event-main");
      if (main) main.setAttribute("aria-expanded", open ? "true" : "false");
    });
  };
  $$("[data-expand]").forEach(m => {
    m.addEventListener("click", () => toggle(m.dataset.expand));
    m.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toggle(m.dataset.expand); }
    });
  });
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
/* ============================================================
   TANK KINDS — drives setup checklist branching
   ============================================================ */
const TANK_KINDS = [
  { id:"betta",      label:"Betta",                 typeText:"Freshwater Betta",     desc:"One betta, peaceful setup" },
  { id:"community",  label:"Freshwater community",  typeText:"Freshwater Community", desc:"Mixed peaceful fish" },
  { id:"shrimp",     label:"Shrimp",                typeText:"Freshwater Shrimp",    desc:"Cherry, neocaridina, caridina" },
  { id:"planted",    label:"Planted tank",          typeText:"Planted Freshwater",   desc:"Plants are the focus" },
  { id:"species",    label:"Species-only",          typeText:"Species-only Freshwater", desc:"One species, breeding or display" },
  { id:"quarantine", label:"Quarantine / hospital", typeText:"Quarantine",           desc:"Short-term observation tank" },
  { id:"other",      label:"Other / custom",        typeText:"Freshwater",           desc:"None of these fit" }
];
function tankKindById(id){ return TANK_KINDS.find(k => k.id === id) || TANK_KINDS[TANK_KINDS.length - 1]; }

/* Entry point for the + button. Always shows the help prompt first. */
function handleAddTankTap(){
  openFirstTankHelpModal();
}

function openFirstTankHelpModal(){
  openModal(`
    <h3 style="margin:0 0 6px">Need help setting up this tank?</h3>
    <p class="muted" style="margin:0 0 14px;font-size:13.5px;line-height:1.5">Choose guided setup if you want a beginner-friendly checklist based on the kind of tank you're making.</p>
    <div class="col" style="display:flex;flex-direction:column;gap:8px">
      <button class="btn block" id="ftp-yes">Yes</button>
      <button class="btn block secondary" id="ftp-no">No</button>
      <button class="btn block ghost" id="ftp-cancel" style="background:transparent;border:0;color:var(--ink-dim);font-weight:500">Cancel</button>
    </div>
  `, () => {
    $("#ftp-yes").addEventListener("click", () => {
      closeModal();
      openAddTank({ guided:true });
    });
    $("#ftp-no").addEventListener("click", () => {
      closeModal();
      openAddTank({ guided:false, optedOut:true });
    });
    $("#ftp-cancel").addEventListener("click", () => {
      closeModal();
    });
  });
}

function openAddTank(opts){
  const guided = !!(opts && opts.guided);
  const optedOut = !!(opts && opts.optedOut);
  const kindOpts = TANK_KINDS.map(k =>
    `<option value="${k.id}">${escapeHTML(k.label)}</option>`
  ).join("");
  openModal(`
    <h3>Add a tank${guided ? ` <span class="pill" style="vertical-align:middle;font-size:11px;margin-left:6px">Guided</span>` : ""}</h3>
    <label class="field">
      <span>What kind of tank?</span>
      <select class="input" id="n-kind">${kindOpts}</select>
    </label>
    <p class="muted small" id="n-kind-desc" style="margin:-4px 0 8px 2px;font-size:12px"></p>
    <label class="field"><span>Name</span><input class="input" id="n-name" placeholder="e.g. Living-room 20g" /></label>
    <div class="row">
      <label class="field"><span>Gallons</span><input class="input" id="n-gallons" type="number" min="1" step="0.5" value="10" /></label>
      <label class="field"><span>Main fish or plant <span class="muted small">(optional)</span></span><input class="input" id="n-mainfish" placeholder="e.g. Crowntail betta" /></label>
    </div>
    <div class="row">
      <button class="btn" id="n-save">Create</button>
      <button class="btn secondary" id="n-cancel">Cancel</button>
    </div>
  `, () => {
    const kindSel = $("#n-kind");
    const desc = $("#n-kind-desc");
    const syncDesc = () => {
      const k = tankKindById(kindSel.value);
      desc.textContent = k.desc;
    };
    syncDesc();
    kindSel.addEventListener("change", syncDesc);

    $("#n-save").addEventListener("click", () => {
      const name = $("#n-name").value.trim();
      if(!name){ alert("Name required"); return; }
      const k = tankKindById(kindSel.value);
      const mainFish = $("#n-mainfish").value.trim();
      const tank = {
        id: "tank-" + uid(),
        name,
        gallons: parseFloat($("#n-gallons").value) || 10,
        type: k.typeText,
        kind: k.id,
        mainFish: mainFish || "",
        createdAt: Date.now(),
        substrate: "", decor: "", notes: "", fish: []
      };
      if (guided){
        tank.firstTank = {
          enabled: true,
          startedAt: Date.now(),
          kind: k.id,
          completed: {}
        };
      } else if (optedOut){
        tank.firstTank = { enabled: false, optedOut: true };
      }
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
    if (all[KEY_EVENTS]) { _mem[KEY_EVENTS] = JSON.stringify(all[KEY_EVENTS]); events = all[KEY_EVENTS]; window.events = events; }
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
  // ROOT-CAUSE GUARD for horizontal drift.
  // Even with overflow-x:hidden, iOS Safari can set scrollLeft > 0 on a scroll
  // container via focus(), system gestures, or autoscroll. Once that happens,
  // every child inside that container renders shifted left and stays that way
  // when navigating between screens. Clamp scrollLeft back to 0 the moment it
  // moves on the document or the main scroller. Single global listener — no
  // per-screen hacks.
  const clampX = () => {
    if (window.scrollX !== 0) window.scrollTo(0, window.scrollY);
    const main = document.getElementById("main");
    if (main && main.scrollLeft !== 0) main.scrollLeft = 0;
    if (document.documentElement.scrollLeft !== 0) document.documentElement.scrollLeft = 0;
    if (document.body.scrollLeft !== 0) document.body.scrollLeft = 0;
  };
  window.addEventListener("scroll", clampX, { passive: true, capture: true });
  clampX();

  $("#back-btn").addEventListener("click", () => {
    view = { screen:"home", tankId:null, tab:"details" };
    render();
  });
  $("#add-tank-btn").addEventListener("click", handleAddTankTap);
  { const sb = $("#settings-btn"); if (sb) sb.addEventListener("click", openSettingsSheet); }
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

  // Schedule reminders once the app has its data
  if (window.REMINDERS) {
    try { window.REMINDERS.scheduleAllReminders(); } catch(e){ console.warn("reminder schedule failed", e); }
  }

  // First-run onboarding: auto-show the tutorial for brand-new users only,
  // and only when no other startup sheet/modal is already open.
  if (window.TUTORIAL) {
    try { window.TUTORIAL.maybeShowFirstRun({ onFinish: handleAddTankTap }); } catch(e){ console.warn("tutorial first-run failed", e); }
  }
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

function openShareModal(){
  const url = "https://jtsmith7234-rgb.github.io/my-tanks/";
  const msg = `Hey — check out the aquarium app I'm beta testing. Track your tanks, water tests, dosing, and a guided cycle walkthrough for new tanks. Open in Safari then Share → Add to Home Screen.\n\n${url}`;

  const html = `
    <div style="max-width:520px">
      <h2 style="margin:0 0 8px">Share My Tanks</h2>
      <p class="muted" style="margin:0 0 14px">Send this to a friend so they can try it on their own phone. Their tanks stay on their device, not yours.</p>

      <label class="label" style="display:block;margin-bottom:6px">Message</label>
      <textarea id="share-msg" rows="6" style="width:100%;font-family:inherit;font-size:14px;padding:10px;border-radius:12px;background:var(--glass-fill-strong);border:1px solid var(--glass-stroke);color:var(--ink);resize:vertical">${escapeHTML(msg)}</textarea>

      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
        <button class="btn" id="share-native">📲 Share…</button>
        <button class="btn secondary" id="share-copy">📋 Copy message</button>
        <button class="btn secondary" id="share-copy-link">🔗 Copy link only</button>
      </div>
      <p class="muted small" style="margin:14px 0 0">Tip: tell them to open it in Safari, then tap Share → Add to Home Screen so it acts like a real app.</p>
      <div style="display:flex;justify-content:flex-end;margin-top:14px">
        <button class="btn secondary" id="share-close">Close</button>
      </div>
    </div>
  `;
  openModal(html, () => {
    const ta = $("#share-msg");
    const flash = (btn, label) => {
      const old = btn.textContent;
      btn.textContent = label;
      setTimeout(() => { btn.textContent = old; }, 1400);
    };
    const copy = async (text, btn, label) => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          ta.select(); document.execCommand("copy");
        }
        flash(btn, label);
      } catch (_){
        ta.select();
        try { document.execCommand("copy"); flash(btn, label); }
        catch(__){ toast("Couldn't copy — select the text and copy manually"); }
      }
    };

    // Native iOS / Android share sheet when available
    const nativeBtn = $("#share-native");
    if (navigator.share) {
      nativeBtn.addEventListener("click", async () => {
        try {
          await navigator.share({
            title: "My Tanks beta",
            text:  ta.value,
            url
          });
        } catch(_){ /* user cancelled — ignore */ }
      });
    } else {
      nativeBtn.style.display = "none";
    }

    $("#share-copy").addEventListener("click", (e) => copy(ta.value, e.currentTarget, "✓ Copied!"));
    $("#share-copy-link").addEventListener("click", (e) => copy(url, e.currentTarget, "✓ Link copied!"));
    $("#share-close").addEventListener("click", closeModal);
  });
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

    <div class="backup-block">
      <h4>🧪 Sample data</h4>
      <p>Load a few example tanks to explore the app, or wipe everything to start fresh.</p>
      <div class="row" style="gap:8px;flex-wrap:wrap">
        <button class="btn small secondary" id="do-load-sample">Load sample tanks</button>
        <button class="btn small secondary" id="do-wipe-all" style="color:#ff7a4a">Wipe all my data</button>
      </div>
    </div>

    <div class="backup-block">
      <h4>🎨 Theme</h4>
      <p>Switch the look of the app. Your data isn't affected.</p>
      <div class="theme-picker">
        ${Object.values(THEMES).map(t => `
          <button class="theme-card" data-theme-id="${t.id}">
            <div class="theme-preview theme-preview-${t.id}"></div>
            <div class="theme-meta">
              <strong>${t.label}</strong>
              <span class="muted small">${t.desc}</span>
            </div>
            <span class="theme-check">✓</span>
          </button>
        `).join("")}
      </div>
    </div>

    <div class="row" style="margin-top:8px">
      <button class="btn secondary block" id="close-backup">Close</button>
    </div>
  `, () => {
    const ta = $("#backup-text");
    ta.value = JSON.stringify(snapshot());

    // Theme picker
    const refreshThemeChecks = () => {
      const cur = getTheme();
      $$(".theme-card").forEach(c => {
        c.classList.toggle("selected", c.dataset.themeId === cur);
      });
    };
    refreshThemeChecks();
    $$(".theme-card").forEach(c => {
      c.addEventListener("click", () => {
        applyTheme(c.dataset.themeId);
        refreshThemeChecks();
        toast(`Theme: ${THEMES[c.dataset.themeId].label}`);
      });
    });

    $("#do-export").addEventListener("click", downloadBackup);
    $("#do-import").addEventListener("click", () => $("#import-file").click());

    const loadSampleBtn = $("#do-load-sample");
    if (loadSampleBtn) loadSampleBtn.addEventListener("click", () => {
      if (!confirm("Load sample tanks? This adds 4 example tanks (with example water-change and test history) to your list. You can wipe them again from this same screen.")) return;
      const sample = loadSampleTanks();
      // append, don't overwrite — user may already have real tanks
      const existingIds = new Set(tanks.map(t => t.id));
      const fresh = sample.filter(t => !existingIds.has(t.id));
      tanks = tanks.concat(fresh);
      // Seed history only for the freshly added sample tanks — don't
      // touch any history on tanks the user already has.
      const seeded = seedSampleEvents(fresh);
      Object.keys(seeded).forEach(tankId => { events[tankId] = seeded[tankId]; });
      window.events = events;
      saveTanks(tanks);
      saveEvents(events);
      toast(`Added ${fresh.length} sample tank${fresh.length===1?"":"s"}`);
      closeModal(); render();
    });

    const wipeBtn = $("#do-wipe-all");
    if (wipeBtn) wipeBtn.addEventListener("click", () => {
      if (!confirm("Wipe all tanks, fish, water changes, and tests on this device? This can't be undone. Save a backup first if you want to keep anything.")) return;
      store.del(KEY_TANKS); store.del(KEY_LOGS); store.del(KEY_EVENTS);
      tanks = []; logs = {}; events = {}; window.events = events;
      toast("All data cleared");
      closeModal(); render();
    });
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

/* ============================================================
   SETTINGS SHEET — clean half-screen bottom sheet
   ============================================================ */
const APP_VERSION = "1.0";

function openSettingsSheet(){
  const shortLabel = { "midnight-reef": "The Deep", "tropical-pop": "Tropical", "planted": "Planted" };
  const themeBtns = Object.values(THEMES).map(t =>
    `<button class="seg-btn" data-theme-id="${t.id}" type="button">${escapeHTML(shortLabel[t.id] || t.label)}</button>`
  ).join("");

  openModal(`
    <div class="settings-sheet">
      <div class="settings-head">
        <h3>Settings</h3>
        <button class="settings-x" id="settings-close" aria-label="Close">✕</button>
      </div>

      <section class="settings-group">
        <h4 class="settings-group-title">Appearance</h4>
        <div class="settings-row settings-row-stack">
          <span class="settings-label">Theme</span>
          <div class="seg seg-fill" id="settings-theme">${themeBtns}</div>
        </div>
      </section>

      <section class="settings-group">
        <h4 class="settings-group-title">Data &amp; Backup</h4>
        <button class="settings-action" id="settings-export" type="button">
          <span class="settings-label">Export backup</span><span class="settings-chev">›</span>
        </button>
        <button class="settings-action" id="settings-import" type="button">
          <span class="settings-label">Import backup</span><span class="settings-chev">›</span>
        </button>
        <p class="settings-note">Your tank data is stored on this device. It isn't saved anywhere else unless you export a backup.</p>
        <button class="settings-action danger" id="settings-clear" type="button">
          <span class="settings-label">Clear local data</span><span class="settings-chev">›</span>
        </button>
      </section>

      <section class="settings-group">
        <h4 class="settings-group-title">App</h4>
        <button class="settings-action" id="settings-share" type="button">
          <span class="settings-label">Share My Tanks</span><span class="settings-chev">›</span>
        </button>
        <div class="settings-row">
          <span class="settings-label">Version</span>
          <span class="settings-value">${APP_VERSION}</span>
        </div>
      </section>

      <section class="settings-group">
        <h4 class="settings-group-title">Help &amp; Guides</h4>
        <button class="settings-action" id="settings-tutorial" type="button">
          <span class="settings-label">Tutorial</span><span class="settings-chev">›</span>
        </button>
        <button class="settings-action" id="settings-help" type="button">
          <span class="settings-label">Help</span><span class="settings-chev">›</span>
        </button>
        <p class="settings-note">New here? Replay the walkthrough, or open Help for quick how-to answers.</p>
      </section>

      <section class="settings-group">
        <h4 class="settings-group-title">Support</h4>
        <div class="settings-row">
          <span class="settings-label">Contact support</span>
          <span class="settings-value muted">Coming soon</span>
        </div>
        <p class="settings-note">Support contact details will be added here soon.</p>
      </section>
    </div>
  `, () => {
    const refreshTheme = () => {
      const cur = getTheme();
      $$("#settings-theme .seg-btn").forEach(b =>
        b.classList.toggle("active", b.dataset.themeId === cur)
      );
    };
    refreshTheme();
    $$("#settings-theme .seg-btn").forEach(b => {
      b.addEventListener("click", () => {
        applyTheme(b.dataset.themeId);
        refreshTheme();
      });
    });

    $("#settings-export").addEventListener("click", downloadBackup);
    $("#settings-import").addEventListener("click", () => $("#import-file").click());
    $("#settings-share").addEventListener("click", () => { closeModal(); openShareModal(); });

    const tutBtn = $("#settings-tutorial");
    if (tutBtn) tutBtn.addEventListener("click", () => {
      closeModal();
      if (window.TUTORIAL) window.TUTORIAL.openTutorial({ markSeen: false, onFinish: handleAddTankTap });
    });
    const helpBtn = $("#settings-help");
    if (helpBtn) helpBtn.addEventListener("click", () => {
      closeModal();
      if (window.TUTORIAL) window.TUTORIAL.openHelp();
    });

    $("#settings-clear").addEventListener("click", () => {
      if (!confirm("Clear all tanks, fish, water changes, and tests on this device? This can't be undone. Export a backup first if you want to keep anything.")) return;
      store.del(KEY_TANKS); store.del(KEY_LOGS); store.del(KEY_EVENTS);
      tanks = []; logs = {}; events = {}; window.events = events;
      toast("Local data cleared");
      closeModal();
      view = { screen:"home", tankId:null, tab:"details" };
      render();
    });

    $("#settings-close").addEventListener("click", closeModal);
  });
}
