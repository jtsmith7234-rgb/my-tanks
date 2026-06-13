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
  "planted":       { id:"planted",       skin:"light", label:"Planted Freshwater", desc:"Lush green planted-tank vibe, swaying background plants" },
  "clean":         { id:"clean",         skin:"light", label:"Clean",              desc:"Mirrors the website — warm off-white + deep teal" }
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
    app: "Tank Care Buddy",
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
  a.href = url; a.download = `tank-care-buddy-backup-${ts}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
function restoreFromText(text){
  let data;
  try { data = JSON.parse(text); } catch(e){ throw new Error("Backup file is not valid JSON."); }
  // Accept both the current name and the prior "My Tanks" name so older backups still load.
  const validApp = data && (data.app === "Tank Care Buddy" || data.app === "My Tanks");
  if (!data || !validApp || !Array.isArray(data.tanks)) {
    throw new Error("This doesn't look like a Tank Care Buddy backup.");
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
  ammonia:  { good: [0, 0.0], warn: [0, 0.25] },  // anything > 0 starts to worry; > 0.25 = danger
  nitrite:  { good: [0, 0.0], warn: [0, 0.25] },
  nitrate:  { good: [0, 20],  warn: [0, 40]   }
};

// Tank-kind-aware safe ranges
const SAFE_BY_KIND = {
  betta: {
    ph:      { good: [6.5, 7.5], warn: [6.0, 8.0] },
    nitrate: { good: [0, 10],    warn: [0, 20]     }  // bettas more sensitive
  },
  shrimp: {
    ph:      { good: [6.5, 7.5], warn: [6.2, 7.8] },
    ammonia: { good: [0, 0.0],   warn: [0, 0.0]   },  // shrimp: zero tolerance
    nitrate: { good: [0, 10],    warn: [0, 20]     }   // very sensitive
  },
  planted: {
    nitrate: { good: [5, 30],    warn: [0, 50]     }   // plants consume nitrate; low is normal
  },
  quarantine: {
    ammonia: { good: [0, 0.0],   warn: [0, 0.0]   },   // must be zero
    nitrate: { good: [0, 10],    warn: [0, 20]     }
  }
};

function getSafeRanges(tank) {
  const kind = (tank && tank.kind) || "other";
  const kindOverrides = SAFE_BY_KIND[kind] || {};
  // Merge: start from SAFE defaults, apply kind-specific overrides per metric
  const result = {};
  ["ph","ammonia","nitrite","nitrate"].forEach(m => {
    result[m] = kindOverrides[m] || SAFE[m];
  });
  return result;
}

function rateReading(metric, value, safe) {
  if (value === "" || value == null || isNaN(value)) return "unknown";
  const v = Number(value);
  const ranges = safe || SAFE;
  const s = ranges[metric];
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

function _getTankContext(tank) {
  const eqItems = window.EQ ? window.EQ.getItems(tank.id) : [];
  const fishList = tank.fish || [];
  const hasHeater = eqItems.some(e => e.type === "heater");
  const hasFilter = eqItems.some(e => e.type === "filter");
  const hasLight  = eqItems.some(e => e.type === "light");
  const isCycled  = !!(tank.firstTank && tank.firstTank.completed && tank.firstTank.completed["cycle_finish"]);
  const isBeginner = !!(tank.firstTank && tank.firstTank.enabled && !tank.firstTank.allDone);
  const substrate = (tank.substrate || "").toLowerCase();
  const kind = tank.kind || "other";
  return { eqItems, fishList, hasHeater, hasFilter, hasLight, isCycled, isBeginner, substrate, kind };
}

/* ============================================================
   ROUTING / RENDER
   ============================================================ */
function render(){
  // Save scroll position before re-render so the view doesn't jump
  const scrollContainer = document.querySelector('.tank-content')
    || document.querySelector('.screen-scroll')
    || document.querySelector('#main')
    || document.documentElement;
  const savedScrollY = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
  const savedScreen  = view.screen;
  const savedTab     = view.tab;

  const titleEl = $("#title");
  const backBtn = $("#back-btn");
  const addBtn  = $("#add-tank-btn");
  const browseBtn = $("#browse-species-btn");

  // Helper: swap between brand lockup (home) and plain title (inner screens)
  function setTitleText(text, showLogo) {
    if (showLogo) {
      titleEl.innerHTML = `
        <span class="topbar-brand-row">
          <img src="logo-mark.png" class="topbar-logo-mark" alt="" aria-hidden="true" draggable="false">
          <span class="topbar-brand-name">${escapeHTML(text)}</span>
        </span>
      `;
      titleEl.classList.add("topbar-brand");
    } else {
      titleEl.textContent = text;
      titleEl.classList.remove("topbar-brand");
    }
  }

  if(view.screen === "home"){
    setTitleText("Tank Care Buddy", true);
    backBtn.hidden = true;
    addBtn.hidden = false;
    if (browseBtn) browseBtn.hidden = false;
    renderHome();
  } else if(view.screen === "tank"){
    const t = getTank(view.tankId);
    setTitleText(t ? t.name : "Tank", false);
    backBtn.hidden = false;
    addBtn.hidden = true;
    if (browseBtn) browseBtn.hidden = true;
    renderTank();
  } else if(view.screen === "species"){
    setTitleText("Browse species", false);
    backBtn.hidden = false;
    addBtn.hidden = true;
    if (browseBtn) browseBtn.hidden = true;
    renderSpeciesBrowser();
  }

  // Restore scroll position if the screen + tab haven't changed (i.e. same view re-rendered)
  if (savedScrollY > 0 && view.screen === savedScreen && view.tab === savedTab) {
    requestAnimationFrame(() => {
      const sc = document.querySelector('.tank-content')
        || document.querySelector('.screen-scroll')
        || document.querySelector('#main')
        || document.documentElement;
      if (sc) sc.scrollTop = savedScrollY;
      else window.scrollTo(0, savedScrollY);
    });
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
        <span class="action-ico"><svg class="act-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></span>
        <span class="action-label">Open tank</span>
      </button>
      <button class="action-row" id="act-edit">
        <span class="action-ico"><svg class="act-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></span>
        <span class="action-label">Edit tank info</span>
      </button>
      <button class="action-row" id="act-clean">
        <span class="action-ico"><svg class="act-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg></span>
        <span class="action-label">Log water change</span>
      </button>
      <button class="action-row" id="act-test">
        <span class="action-ico"><svg class="act-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5m4 0h10m-6 4v4m-4-4v4m8-4v4"/></svg></span>
        <span class="action-label">Log water test</span>
      </button>
      <button class="action-row danger" id="act-delete">
        <span class="action-ico"><svg class="act-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></span>
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
    $("#act-edit").addEventListener("click",  () => {
      go("details");
      // Scroll to the edit form after render settles
      requestAnimationFrame(() => {
        const editEl = document.getElementById("details-edit-section") || document.getElementById("details-name");
        if (editEl) editEl.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    $("#act-clean").addEventListener("click", () => go("water-care"));
    $("#act-test").addEventListener("click",  () => go("water-care"));
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
    // Use list API when available so we always reflect the true top severity
    const list = window.ADVISOR && window.ADVISOR.computeAdviceList
      ? window.ADVISOR.computeAdviceList(t)
      : (window.ADVISOR && window.ADVISOR.computeAdvice ? [window.ADVISOR.computeAdvice(t)].filter(Boolean) : []);
    const adv = list[0] || null;
    if (adv && adv.sev){
      if (adv.sev === "urgent") return { tone:"urgent", label:"Needs attention", hint: adv.title || "" };
      if (adv.sev === "soon")   return { tone:"soon",   label:"Check soon",      hint: adv.title || "" };
      if (adv.sev === "fyi")    return { tone:"fyi",    label:"Heads up",         hint: adv.title || "" };
    }
  } catch(e){}
  return { tone:"ok", label:"Looking good", hint:"" };
}

function _renderEqHint(t) {
  if (typeof EQ === "undefined") return "";
  const s = EQ.tankSummary(t.id);
  if (s.total === 0) return "";
  if (s.overdue > 0) {
    return `<div class="tc-eq-hint tc-eq-hint-bad">${s.overdue} equipment item${s.overdue === 1 ? "" : "s"} overdue</div>`;
  }
  if (s.dueThisWeek > 0) {
    return `<div class="tc-eq-hint tc-eq-hint-warn">${s.dueThisWeek} due this week</div>`;
  }
  if (s.expiringSoon > 0) {
    return `<div class="tc-eq-hint tc-eq-hint-warn">${s.expiringSoon} expiring soon</div>`;
  }
  if (s.dueThisMonth > 0) {
    return `<div class="tc-eq-hint tc-eq-hint-soon">${s.dueThisMonth} due this month</div>`;
  }
  return `<div class="tc-eq-hint tc-eq-hint-ok">Equipment all caught up</div>`;
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
      ${_renderEqHint(t)}
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
    <div class="home-welcome-tagline">Take care, taken care of.</div>
    <div class="grid">
      ${tanks.map(t => `
        <div class="swipe-row" data-row="${t.id}">
          <div class="swipe-actions-left">
            <button class="swipe-act edit" data-act="edit" data-tank="${t.id}" aria-label="Edit ${t.name}">
              <span class="swipe-ico" aria-hidden="true">✏️</span><span class="swipe-lbl">Edit</span>
            </button>
          </div>
          <div class="swipe-actions-right">
            <button class="swipe-act delete" data-act="delete" data-tank="${t.id}" aria-label="Delete ${t.name}">
              <span class="swipe-ico" aria-hidden="true">🗑️</span><span class="swipe-lbl">Delete</span>
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
  if (!window.ADVISOR) return "";
  let advList = [];
  let adv = null;
  try {
    // Use list API when available (upgraded advisor), fall back to single
    advList = window.ADVISOR.computeAdviceList
      ? window.ADVISOR.computeAdviceList(t)
      : (window.ADVISOR.computeAdvice(t) ? [window.ADVISOR.computeAdvice(t)] : []);
    adv = advList[0] || null;
    if (adv) {
      // Log all active items to history (with per-rule dedup / cooldown inside advisor)
      advList.forEach(item => { try { window.ADVISOR.logAdviceIfNew(t, item); } catch(e){} });
      // Fire OS notification for urgent issues (if user opted in) — top item only
      if (window.REMINDERS) {
        try { window.REMINDERS.fireUrgentAdvisorNotif(t, adv); } catch(e){}
      }
    }
  } catch (err) { console.warn("advisor error", err); return ""; }
  if (!adv) return "";
  // Signature uses ruleId when available (new advisor), falls back to title+rule
  const sig = adv.ruleId ? (adv.ruleId + " | " + adv.rule) : (adv.title + " | " + adv.rule);
  // Check persistent dismiss store — survives tab switches and re-renders
  if (_isAdvisorDismissed(t.id, sig)) return "";
  // Tag label (Risk / Insight / Reminder / Tip) — only shown when present
  const tagLabel = adv.tag ? `<span class="adv-tag adv-tag-${adv.sev}">${escapeHTML(adv.tag)}</span>` : "";
  const target = (window.ADVISOR.adviceTarget && window.ADVISOR.adviceTarget(adv)) || null;
  const clickable = !!target;
  const targetAttrs = clickable
    ? ` data-target-tab="${escapeHTML(target.tab)}"${target.remType ? ` data-target-rem="${escapeHTML(target.remType)}"` : ""} role="button" tabindex="0" aria-label="${escapeHTML(adv.title)} \u2014 tap to fix"`
    : "";
  const hint = clickable
    ? `<div class="adv-hint">Tap to fix <span class="adv-chev">\u203a</span></div>`
    : "";
  // Secondary items indicator (when more than 1 item, show a quiet count)
  const moreCount = advList.length - 1;
  const moreHint = (moreCount > 0)
    ? `<div class="adv-more">${moreCount} more insight${moreCount > 1 ? 's' : ''} this tank</div>`
    : "";
  return `
    <div class="advisor-banner ${adv.sev}${clickable ? " adv-clickable" : ""}" data-sig="${escapeHTML(sig)}"${targetAttrs}>
      <div class="adv-icon">${adv.sev === "urgent" ? "\u26a0\ufe0f" : adv.sev === "soon" ? "\ud83d\udd14" : "\ud83c\udf38"}</div>
      <div class="adv-body">
        <div class="adv-title-row">${tagLabel}<span class="adv-title">${escapeHTML(adv.title)}</span></div>
        <div class="adv-text">${escapeHTML(adv.body)}</div>
        ${hint}
        ${moreHint}
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
      <button class="tab ${view.tab==='fish'?'active':''}" data-tab="fish">Livestock</button>
      <button class="tab ${view.tab==='water-care'?'active':''}" data-tab="water-care">Water Care</button>
      <button class="tab ${view.tab==='equipment'?'active':''}" data-tab="equipment">Equipment</button>
      <button class="tab ${view.tab==='history'?'active':''}" data-tab="history">History</button>
    </div>
    <div id="tab-body"></div>
  `;
  $$("[data-tab]").forEach(b => b.addEventListener("click", () => {
    view.tab = b.dataset.tab; render();
  }));

  const body = $("#tab-body");
  if(view.tab === "details")   body.innerHTML = renderDetails(t);
  if(view.tab === "fish")       body.innerHTML = renderFish(t);
  if(view.tab === "water-care") body.innerHTML = renderWaterCare(t);
  if(view.tab === "history")    body.innerHTML = renderHistory(t);
  if(view.tab === "equipment") { body.innerHTML = renderEquipment(t); }

  if(view.tab === "details")   bindDetails(t);
  if(view.tab === "fish")       bindFish(t);
  if(view.tab === "water-care") bindWaterCare(t);
  if(view.tab === "history")    bindHistory(t);
  if(view.tab === "equipment")  bindEquipment(t);

  // Wire up advisor dismiss button
  const dismiss = $("#adv-dismiss");
  if (dismiss){
    dismiss.addEventListener("click", (e) => {
      e.stopPropagation();   // never let the dismiss bubble into banner navigation
      const banner = dismiss.closest(".advisor-banner");
      if (!banner) return;
      const sig = banner.getAttribute("data-sig") || "";
      _dismissAdvisor(t.id, sig);  // persisted — survives navigation
      banner.remove();
    });
  }

  // Make the advisor banner tappable: jump to the tab/control that fixes it
  const banner = $(".advisor-banner.adv-clickable");
  if (banner){
    const go = () => {
      const tab     = banner.getAttribute("data-target-tab");
      const remType = banner.getAttribute("data-target-rem") || null;
      openReminderTarget(t, tab, remType);
    };
    banner.addEventListener("click", (e) => {
      if (e.target.closest(".adv-dismiss")) return; // X handled separately
      go();
    });
    banner.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar"){
        e.preventDefault();
        go();
      }
    });
  }

  // After a navigation that requested a highlight, scroll to + flash the target
  _consumeReminderHighlight();
}

/* ============================================================
   STANDALONE SPECIES BROWSER
   Reachable from the home-page fish button. Categorized list:
   top-level shows category buckets (Tetras, Cichlids, ...), tap
   to expand into species. Each species row has a quick-add (+)
   button that opens a tank picker, runs the compatibility check,
   and lets the user add the fish to a tank without leaving the
   browser.
   ============================================================ */
function renderSpeciesBrowser(){
  const main = $("#main");
  main.innerHTML = `
    <div class="section">
      <p class="muted" style="margin:0 0 10px">Tap a category to expand. Tap a fish for a full profile, or use <b>+</b> to add it to one of your tanks.</p>
      <label class="field">
        <input class="input" id="species-browser-search" placeholder="Search species" autocomplete="off" />
      </label>
      <div id="species-browser-list" class="browse-list"></div>
    </div>
  `;

  const searchEl = $("#species-browser-search");
  const listEl   = $("#species-browser-list");

  // Track which categories are open by name. Persisted only for this render,
  // not across navigations — keeps state simple.
  const openCats = new Set();

  function renderList(q){
    if (!window.FISHDB_API || !listEl) return;
    const groups = window.FISHDB_API.categories(q);
    if (!groups.length){
      listEl.innerHTML = `<p class="muted browse-empty">No species match that search.</p>`;
      return;
    }
    // When searching, auto-expand every matching category so results are visible
    // without an extra tap. When not searching, respect the openCats set.
    const isSearching = !!q;
    listEl.innerHTML = groups.map(g => {
      const expanded = isSearching || openCats.has(g.name);
      const speciesHTML = g.species.map(f => `
        <div class="browse-row-wrap">
          <button type="button" class="browse-row browse-row-species" data-name="${escapeHTML(f.name)}">
            ${window.FISHDB_API.thumbHTML(f)}
            <span class="browse-row-main">
              <span class="browse-row-name">${escapeHTML(f.name)}</span>
              ${f.sci ? `<span class="browse-row-sci">${escapeHTML(f.sci)}</span>` : ""}
            </span>
            <span class="browse-row-actions">
              <span class="browse-row-quickadd" data-quickadd="${escapeHTML(f.name)}" role="button" tabindex="0" aria-label="Add ${escapeHTML(f.name)} to a tank" title="Add to a tank">+</span>
              <span class="browse-row-chev">›</span>
            </span>
          </button>
          <div class="browse-detail" data-detail="${escapeHTML(f.name)}" hidden></div>
        </div>
      `).join("");
      return `
        <div class="browse-cat" data-cat="${escapeHTML(g.name)}">
          <button type="button" class="browse-row browse-row-cat${expanded ? " open" : ""}" data-cat-toggle="${escapeHTML(g.name)}">
            <span class="browse-row-main">
              <span class="browse-row-name">${escapeHTML(g.name)}</span>
              <span class="browse-row-sci browse-cat-count">${g.species.length} ${g.species.length === 1 ? "species" : "species"}</span>
            </span>
            <span class="browse-row-chev">›</span>
          </button>
          <div class="browse-cat-body" ${expanded ? "" : "hidden"}>${speciesHTML}</div>
        </div>
      `;
    }).join("");

    // Category toggle
    $$(".browse-row-cat", listEl).forEach(catBtn => {
      catBtn.addEventListener("click", () => {
        const cat = catBtn.dataset.catToggle;
        const body = catBtn.nextElementSibling;
        const willOpen = body.hidden;
        body.hidden = !willOpen;
        catBtn.classList.toggle("open", willOpen);
        if (willOpen) openCats.add(cat); else openCats.delete(cat);
      });
    });

    // Species row tap -> expand profile
    $$(".browse-row-species", listEl).forEach(row => {
      row.addEventListener("click", (ev) => {
        // Quick-add icon handled separately — don't trigger the profile open.
        if (ev.target && ev.target.closest("[data-quickadd]")) return;
        const name = row.dataset.name;
        const detail = row.parentElement.querySelector(`[data-detail="${CSS.escape(name)}"]`);
        const isOpen = row.classList.contains("open");
        // Single-open accordion across the whole list.
        $$(".browse-row-species.open", listEl).forEach(r => r.classList.remove("open"));
        $$(".browse-detail", listEl).forEach(d => { d.hidden = true; d.innerHTML = ""; });
        if (!isOpen){
          const f = window.FISHDB_API.byName(name);
          detail.innerHTML = window.FISHDB_API.profileCard(f);
          detail.hidden = false;
          row.classList.add("open");
          const toggle = detail.querySelector("[data-sources-toggle]");
          const drawer = detail.querySelector("[data-sources-drawer]");
          if (toggle && drawer){
            toggle.addEventListener("click", (e) => {
              e.stopPropagation();
              const open = drawer.hidden;
              drawer.hidden = !open;
              toggle.setAttribute("aria-expanded", String(open));
              toggle.classList.toggle("open", open);
            });
          }
        }
      });
    });

    // Quick-add (+) button — opens tank picker / compat check / confirm.
    $$("[data-quickadd]", listEl).forEach(el => {
      const trigger = (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        openQuickAddSheet(el.dataset.quickadd);
      };
      el.addEventListener("click", trigger);
      el.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") trigger(ev);
      });
    });
  }

  if (searchEl){
    searchEl.addEventListener("input", () => renderList(searchEl.value.trim()));
  }
  renderList("");
}

/* ----- Quick-add flow: pick a tank, see compat, confirm or back out ----- */
function openQuickAddSheet(speciesName){
  const f = window.FISHDB_API && window.FISHDB_API.byName(speciesName);
  if (!f){ toast("Species not found"); return; }

  if (!tanks || !tanks.length){
    openModal(`
      <div class="action-sheet">
        <div class="action-sheet-head">
          <h3 style="margin:0 0 4px">Add ${escapeHTML(f.name)}</h3>
          <p class="muted small" style="margin:0">You don't have any tanks yet.</p>
        </div>
        <p class="muted" style="padding:0 6px">Create a tank first by tapping the <b>+</b> button on the home screen, then come back to add this fish.</p>
        <button class="action-row cancel" id="qa-close">Close</button>
      </div>
    `, () => {
      $("#qa-close").addEventListener("click", closeModal);
    });
    return;
  }

  // Step 1: pick a tank.
  const tankRows = tanks.map(t => `
    <button class="action-row" data-tank-id="${t.id}">
      <span class="action-ico"><svg class="act-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg></span>
      <span class="action-label" style="display:flex;flex-direction:column;align-items:flex-start;gap:2px;flex:1">
        <span>${escapeHTML(t.name)}</span>
        <span class="muted small">${t.gallons} gal &middot; ${escapeHTML(t.type || "Freshwater")}</span>
      </span>
    </button>
  `).join("");

  openModal(`
    <div class="action-sheet" id="qa-sheet">
      <div class="action-sheet-head">
        <h3 style="margin:0 0 4px">Add ${escapeHTML(f.name)}</h3>
        <p class="muted small" style="margin:0">Pick a tank to check the fit.</p>
      </div>
      <div class="qa-tank-list">${tankRows}</div>
      <button class="action-row cancel" id="qa-cancel">Cancel</button>
    </div>
  `, () => {
    $("#qa-cancel").addEventListener("click", closeModal);
    $$("[data-tank-id]", $("#qa-sheet")).forEach(btn => {
      btn.addEventListener("click", () => {
        const tankId = btn.dataset.tankId;
        const tank = getTank(tankId);
        if (!tank){ toast("Tank not found"); closeModal(); return; }
        showQuickAddCompat(f, tank);
      });
    });
  });
}

function showQuickAddCompat(f, tank){
  const compat = window.FISHDB_API.compatibility(f, tank);
  const level = compat ? compat.level : "good";
  const label = compat ? compat.label : "Good fit";
  const reasons = (compat && compat.reasons) || [];

  // Friendly recommendation copy per level.
  const headlineMap = {
    good:    `Looks good for <b>${escapeHTML(tank.name)}</b>.`,
    caution: `Possible for <b>${escapeHTML(tank.name)}</b>, with a few cautions.`,
    bad:     `Not recommended for <b>${escapeHTML(tank.name)}</b>.`
  };
  const ctaLabelMap = {
    good:    "Add to tank",
    caution: "Add anyway",
    bad:     "Add anyway"
  };
  const badgeClass = `compat-badge compat-${level}`;

  const reasonItems = reasons.length
    ? `<ul class="qa-reasons">${reasons.map(r => `<li>${escapeHTML(r)}</li>`).join("")}</ul>`
    : `<p class="muted" style="margin:6px 0 0">No obvious conflicts.</p>`;

  closeModal();
  openModal(`
    <div class="action-sheet" id="qa-compat">
      <div class="action-sheet-head">
        <h3 style="margin:0 0 4px">${escapeHTML(f.name)}</h3>
        <p class="muted small" style="margin:0">${escapeHTML(f.sci || "")}</p>
      </div>
      <div style="padding:6px 8px 4px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <span class="${badgeClass}">${escapeHTML(label)}</span>
        <span class="muted small">${tank.gallons} gal &middot; ${escapeHTML(tank.type || "Freshwater")}</span>
      </div>
      <p style="padding:4px 8px;margin:0">${headlineMap[level] || ""}</p>
      <div style="padding:0 8px 4px">${reasonItems}</div>
      <div class="qa-count-row">
        <label for="qa-count" class="qa-count-label">How many?</label>
        <input id="qa-count" class="input" type="number" min="1" max="99" value="${f.school && f.school > 1 ? f.school : 1}" inputmode="numeric" />
      </div>
      <button class="action-row" id="qa-confirm" style="font-weight:600">
        <span class="action-ico"><svg class="act-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
        <span class="action-label">${ctaLabelMap[level]}</span>
      </button>
      <button class="action-row" id="qa-back">
        <span class="action-ico"><svg class="act-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></span>
        <span class="action-label">Pick a different tank</span>
      </button>
      <button class="action-row cancel" id="qa-cancel2">Cancel</button>
    </div>
  `, () => {
    $("#qa-cancel2").addEventListener("click", closeModal);
    $("#qa-back").addEventListener("click", () => {
      closeModal();
      openQuickAddSheet(f.name);
    });
    $("#qa-confirm").addEventListener("click", () => {
      const countEl = $("#qa-count");
      const count = Math.max(1, Math.min(99, parseInt(countEl && countEl.value, 10) || 1));
      quickAddFishToTank(f, tank, count);
    });
  });
}

function quickAddFishToTank(f, tank, count){
  tank.fish = tank.fish || [];
  tank.fish.push({ id: uid(), species: f.name, count: count, name: "" });
  saveTanks(tanks);
  logEvent(tank.id, "fish_add", { species: f.name, count: count, name: "" });
  closeModal();
  toast(`Added ${count}× ${f.name} to ${tank.name}`);
}

/* ------------------------------------------------------------
   REMINDER NAVIGATION
   Clicking a reminder banner routes here. We switch to the tab that
   holds the action needed to clear the reminder, then (after render)
   scroll to and briefly highlight the relevant control so the user
   knows exactly where to act. Clearing still happens through the
   existing Mark done / Snooze / Skip controls and test logging.
   ------------------------------------------------------------ */
function openReminderTarget(t, tab, remType){
  if (!t) return;
  const goTab = tab || "details";
  // Stash what to highlight; consumed by _consumeReminderHighlight() post-render
  window._reminderHighlight = goTab === "water-care"
    ? { sel: "#wt-section", focusId: "wt-ph" }
    : remType
      ? { sel: `.upn-row[data-rem="${remType}"]` }
      : { sel: ".upn-list" };
  view.tab = goTab;
  render();
}

function _consumeReminderHighlight(){
  const h = window._reminderHighlight;
  if (!h) return;
  window._reminderHighlight = null;
  // Two rAFs: gives iOS Safari time to settle after a tab swap before we focus.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    // Scroll-and-flash a highlight target (if provided)
    if (h.sel) {
      const el = document.querySelector(h.sel) || document.querySelector(".upn-list");
      if (el) {
        try { el.scrollIntoView({ behavior: "smooth", block: "center" }); }
        catch { el.scrollIntoView(); }
        el.classList.add("rem-flash");
        setTimeout(() => el.classList.remove("rem-flash"), 1800);
      }
    }
    // Auto-focus the most useful first input (if provided)
    if (h.focusId) {
      const f = document.getElementById(h.focusId);
      if (f) {
        try {
          f.focus({ preventScroll: false });
          if (typeof f.select === "function" && (f.type === "number" || f.type === "text")) {
            requestAnimationFrame(() => { try { f.select(); } catch(_){} });
          }
        } catch(_){}
      }
    }
  }));
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

/* Maps a reminder type to the tab, highlight selector, and auto-focus input ID.
   tab:    destination tab
   sel:    element to scroll into view and flash after tab switch (optional)
   focus:  input ID to auto-focus and select after the tab is rendered (optional)
   label:  short tab label used in row aria/hint text */
const UPN_NAV = {
  water_change: { tab: "water-care", sel: "#wc-section",  focus: "wc-gallons", label: "Water Care" },
  water_test:   { tab: "water-care", sel: "#wt-section",  focus: "wt-ph",       label: "Water Care" },
  daily:        { tab: "history",    sel: null,            focus: null,          label: "History"    },
  equipment:    { tab: "equipment",  sel: null,            focus: null,          label: "Equipment"  }
};

function _tankHasConfiguredReminders(t){
  // A tank has "configured" reminders when the user has explicitly saved reminder
  // settings for it (i.e. called setTankReminders). Brand-new tanks only have
  // default-merged values from getTankReminders() and have no entry in the store.
  try {
    const stored = JSON.parse(store.get("tm.reminders.v1") || "{}");
    return !!(stored[t.id]);
  } catch(e) { return false; }
}

function renderUpNextSection(t){
  if (!window.REMINDERS || !window.REMINDERS.computeDueList) return "";
  // Suppress Up Next for guided first-tank users who haven't configured reminders yet
  if (t.firstTank && t.firstTank.enabled && !_tankHasConfiguredReminders(t)){
    return `
      <div class="section">
        <h2>Up next</h2>
        <p class="muted" style="margin:0">Your reminders will appear here once you've completed a few steps in the setup checklist.</p>
      </div>
    `;
  }
  const items = window.REMINDERS.computeDueList(t);
  if (!items.length){
    return `
      <div class="section">
        <h2>Up next</h2>
        <p class="muted" style="margin:0">No reminders turned on yet. Scroll down to set up water-change, water-test, and daily check-in reminders.</p>
      </div>
    `;
  }
  const rows = items.map(it => {
    const nav = UPN_NAV[it.type];
    // Determine if this is a first-ever entry (never logged before)
    const isFirstEntry = !it.lastDoneTs;
    // Override sub-label for first-time entries to be friendly/neutral
    const sub = isFirstEntry
      ? `<span class="upn-sub first-entry">Let's log your first ${it.label.toLowerCase()} \u2192</span>`
      : (it.status === "due-now"
          ? `<span class="upn-sub bad">Due now — tap to go to ${nav ? nav.label : "the"} tab</span>`
          : it.status === "snoozed"
            ? `<span class="upn-sub warn">Snoozed — resumes ${_friendlyRelative(it.nextDueTs)}</span>`
            : `<span class="upn-sub">Due ${_friendlyRelative(it.nextDueTs)} · ${_friendlyShortDate(it.nextDueTs)}</span>`);
    const lastTxt = isFirstEntry
      ? "Never logged \u2014 set a baseline"
      : (it.lastDoneTs ? `Last done ${_friendlyRelative(it.lastDoneTs)}` : "Never done yet");
    // First-entry rows: show only "Go do it" button, no Mark done / Snooze / Skip
    const showActions = !isFirstEntry && (it.status === "due-now" || it.status === "snoozed");
    const navLabel = nav ? nav.label : "";
    // Daily check-in doesn't have a logging form to land on, so its CTA is "Open"
    const goLabel = it.type === "daily" ? "Open" : (isFirstEntry ? "Go do it \u203a" : "Go do it");
    const subLabel = it.type === "daily" ? `<div class="upn-go-hint muted small" style="margin-top:3px">Tap to log today's check-in in History</div>` : "";
    // For first-entry or due/snoozed: show CTA button. For upcoming: gentle hint on the row.
    const goHint = nav
      ? ((!isFirstEntry && it.status === "upcoming")
          ? `<div class="upn-go-hint muted small">Tap to go to ${navLabel} tab ›</div>`
          : `<button class="upn-go-btn" data-go="${it.type}" type="button">${goLabel} <span class="upn-go-chev">›</span></button>${subLabel}`)
      : "";
    // Skip-once doesn't apply to daily (it's already daily — use snooze instead)
    const showSkip = it.type !== "daily";
    const actions = showActions ? `
      <div class="upn-actions">
        <button class="btn small upn-done" data-type="${it.type}">Mark done</button>
        <button class="btn small secondary upn-snooze" data-type="${it.type}">Snooze 1 day</button>
        ${showSkip ? `<button class="btn small secondary upn-skip" data-type="${it.type}">Skip once</button>` : ""}
      </div>` : "";
    // Upcoming and first-entry rows: whole row is a button-like tap target
    const effectiveStatus = isFirstEntry ? "first" : it.status;
    const rowRole = (!showActions && nav) ? ` role="button" tabindex="0" aria-label="${escapeHTML(it.label)} — tap to go to ${navLabel} tab"` : "";
    const rowClass = `upn-row upn-${effectiveStatus}${(!showActions && nav) ? " upn-tappable" : ""}`;
    const intervalTxt = it.type === "daily" ? "every day" : `every ${it.intervalDays} days`;
    return `
      <div class="${rowClass}" data-rem="${it.type}"${rowRole}>
        <div class="upn-header upn-nav-target" data-go="${it.type}"${showActions ? ` role="button" tabindex="0" aria-label="${escapeHTML(it.label)} — tap to open ${navLabel} tab"` : ""}>
          <div class="upn-icon">${it.icon}</div>
          <div class="upn-body">
            <div class="upn-title">${escapeHTML(it.label)}</div>
            ${sub}
            <div class="upn-last muted small">${lastTxt} · ${intervalTxt}</div>
            ${(!showActions && nav) ? goHint : ""}
          </div>
          ${showActions ? goHint : ""}
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

/* Navigate to the correct tab and highlight the action area for a reminder type.
   Sets a highlight target (used by _consumeReminderHighlight to flash) AND an
   auto-focus target so mobile users can start typing immediately. */
function _goToReminderAction(t, type){
  const nav = UPN_NAV[type];
  if (!nav) return;
  window._reminderHighlight = nav.sel ? { sel: nav.sel, focusId: nav.focus || null } : null;
  // Even when there's no scroll/flash target (daily), still consume focus if any
  if (!window._reminderHighlight && nav.focus) {
    window._reminderHighlight = { sel: null, focusId: nav.focus };
  }
  view.tab = nav.tab;
  render();
}

function bindUpNext(t){
  if (!window.REMINDERS) return;

  // "Go do it" buttons on due-now/snoozed rows — navigate to action tab
  $$(".upn-go-btn").forEach(b => b.addEventListener("click", (e) => {
    e.stopPropagation();
    _goToReminderAction(t, b.dataset.go);
  }));

  // Tap the header area of due-now/snoozed rows to navigate
  // (Upcoming rows use the whole-row handler below; skip them here)
  $$(".upn-header.upn-nav-target[role='button']").forEach(hdr => {
    hdr.addEventListener("click", (e) => {
      // Ignore clicks on action buttons inside the header (upn-go-btn handled above)
      if (e.target.closest(".upn-go-btn")) return;
      _goToReminderAction(t, hdr.dataset.go);
    });
    hdr.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        _goToReminderAction(t, hdr.dataset.go);
      }
    });
  });

  // Tap entire row for upcoming rows (they have role=button on the row itself)
  $$(".upn-row.upn-tappable").forEach(row => {
    row.addEventListener("click", () => _goToReminderAction(t, row.dataset.rem));
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        _goToReminderAction(t, row.dataset.rem);
      }
    });
  });

  $$(".upn-done").forEach(b => b.addEventListener("click", (e) => {
    e.stopPropagation();
    const type = b.dataset.type;
    window.REMINDERS.markReminderDone(t, type);
    window.REMINDERS.scheduleAllReminders();
    toast("Marked done — next one scheduled");
    render();
  }));
  $$(".upn-snooze").forEach(b => b.addEventListener("click", (e) => {
    e.stopPropagation();
    const type = b.dataset.type;
    window.REMINDERS.snoozeReminder(t, type, 24);
    window.REMINDERS.scheduleAllReminders();
    toast("Snoozed for 1 day");
    render();
  }));
  $$(".upn-skip").forEach(b => b.addEventListener("click", (e) => {
    e.stopPropagation();
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
  const _dctx = _getTankContext(t);
  // Build cross-check hints
  const _hints = [];
  if (!_dctx.hasFilter) _hints.push({ msg: "No filter recorded", action: "Add one in Equipment", tab: "equipment" });
  if (_dctx.isCycled && _dctx.fishList.length === 0) _hints.push({ msg: "Tank is cycled", action: "You're ready for fish", tab: "fish" });
  if (_dctx.kind === "betta" && totalFish(t) > 1) _hints.push({ msg: "Multiple fish in betta tank", action: "Check compatibility", tab: "fish" });
  const _hintsHTML = _hints.length ? `
    <div class="tank-context-hint-group">${_hints.map(h =>
      `<div class="tank-context-hint" data-nav-tab="${h.tab}" style="cursor:pointer">${escapeHTML(h.msg)} — <span class="tank-context-hint-action">${escapeHTML(h.action)} →</span></div>`
    ).join("")}</div>` : "";

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
      ${_hintsHTML}
    </div>

    ${window.FIRSTTANK ? window.FIRSTTANK.render(t) : ""}

    ${renderRemindersSection(t)}

    <div class="section" id="details-edit-section">
      <h2>Edit tank info</h2>
      <label class="field"><span>Name</span><input class="input" id="d-name" value="${escapeHTML(t.name)}" /></label>
      <div class="row">
        <label class="field"><span>Gallons</span><input class="input" id="d-gallons" type="number" min="1" step="0.5" value="${t.gallons}" /></label>
        <label class="field"><span>Type</span><input class="input" id="d-type" value="${escapeHTML(t.type||"")}" /></label>
      </div>
      <div class="row">
        <label class="field"><span>Substrate</span>
          <select class="input" id="d-substrate">
            ${[{v:"",l:"Not sure yet"},{v:"gravel",l:"Gravel"},{v:"sand",l:"Sand"},{v:"aqua soil",l:"Aqua soil (planted tanks)"},{v:"bare bottom",l:"Bare bottom"},{v:"mixed",l:"Mixed (gravel + sand)"}].map(o => `<option value="${o.v}"${(t.substrate||"") === o.v ? " selected" : ""}>${escapeHTML(o.l)}</option>`).join("")}
          </select>
        </label>
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
    permBanner = `<div class="rem-perm-banner muted">Phone notifications are off. You can turn them back on in your iOS settings under Tank Care Buddy.</div>`;
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
  // Cross-check hint navigation
  $$("[data-nav-tab]").forEach(el => {
    el.addEventListener("click", () => {
      const tab = el.dataset.navTab;
      if (tab) { view.tab = tab; render(); }
    });
  });
  if (window.FIRSTTANK){
    window.FIRSTTANK.bind(t, (msg) => {
      saveTanks(tanks);
      // msg===null means optimistic update only — save state, skip re-render
      if (msg !== null) {
        // Don't log a generic first_tank event for completion — firsttank.js handles that
        if (msg !== "__first_tank_complete__") {
          logEvent(t.id, "first_tank", { msg });
        }
        render();
        // After render: if firsttank.js signalled completion, show the rich completion modal
        if (window._ftCompletionPending) {
          const completedTankId = window._ftCompletionPending;
          window._ftCompletionPending = null;
          const completedTank = getTank(completedTankId) || t;
          requestAnimationFrame(() => _showFirstTankCompletionModal(completedTank));
        }
      }
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
  const _ctx = _getTankContext(t);
  const _fishCycleWarning = (!_ctx.isCycled && _ctx.fishList.length > 0)
    ? `<div class="tank-context-hint">Heads up: adding fish before cycling is complete can stress them. Check your First Tank guide.</div>`
    : "";
  return `
    <div class="section">
      <h2>Inhabitants</h2>
      ${_fishCycleWarning}
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

    <div class="section fish-action-section">
      <div class="fish-action-header">
        <h2>Add fish</h2>
        <span class="fish-action-sub muted">Search to add or check compatibility</span>
      </div>
      <div class="fish-search-card">
        <label class="field species-field" style="margin:0">
          <input class="input" id="add-species"
            placeholder="Search by species name…"
            autocomplete="off"
            style="border-radius:12px;font-size:15px;padding:12px 16px;height:48px" />
          <div id="species-suggest" class="species-suggest" hidden></div>
        </label>
        <div class="fish-search-meta" id="fish-search-meta">
          <span class="muted small">Start typing to see fish profiles and compatibility</span>
        </div>
      </div>
      <div id="species-info"></div>

      <div class="fish-quick-row">
        <div class="fish-quick-card" id="fish-add-card">
          <div class="fish-quick-icon">🐠</div>
          <div class="fish-quick-label">Add a fish</div>
          <div class="fish-quick-sub muted small">Search above, then add it here</div>
          <div class="fish-add-controls" id="fish-add-controls">
            <div class="row" style="gap:8px;margin-top:8px">
              <label class="field" style="flex:1;margin:0"><span>Count</span><input class="input" id="add-count" type="number" min="1" value="1"/></label>
              <label class="field" style="flex:2;margin:0"><span>Name (optional)</span><input class="input" id="add-name" placeholder="e.g. Boss"/></label>
            </div>
            <button class="btn block" id="add-fish-btn" style="margin-top:10px">Add to tank</button>
          </div>
        </div>
        <div class="fish-quick-card" id="fish-compat-card">
          <div class="fish-quick-icon">🔍</div>
          <div class="fish-quick-label">Check compatibility</div>
          <div class="fish-quick-sub muted small">See if a fish fits your setup</div>
          <div id="compat-result" style="margin-top:8px"></div>
        </div>
      </div>

      <div class="fish-browse-section" id="fish-browse-section" style="margin-top:12px">
        <div class="fish-browse-header">
          <span class="muted small">Browse all species</span>
        </div>
        <div id="browse-list" class="browse-list"></div>
      </div>
    </div>
  `;
}
function bindFish(t){
  // ----- Unified search: autocomplete + compat + browse -----
  const spInput    = $("#add-species");
  const spSugg     = $("#species-suggest");
  const spInfo     = $("#species-info");
  const compatResult = $("#compat-result");
  const browseList   = $("#browse-list");
  const fishAddCard  = $("#fish-add-card");
  const searchMeta   = $("#fish-search-meta");

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
      onSpeciesSelected(b.dataset.name);
    }));
  }

  function onSpeciesSelected(name){
    renderSpeciesInfo(name);
    showCompatResult(name);
    renderBrowseList(name);
    if (fishAddCard) fishAddCard.classList.add("active-card");
    if (searchMeta) searchMeta.innerHTML = `<span class="muted small">${escapeHTML(name)} selected — fill in count and name below, then tap Add to tank</span>`;
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
    spInfo.innerHTML = warn + window.FISHDB_API.profileCard(f);
  }

  if (spInput){
    spInput.addEventListener("input", () => {
      const v = spInput.value.trim();
      showSuggestions(spInput.value);
      // Update compat + browse as user types
      const f = window.FISHDB_API && window.FISHDB_API.byName(v);
      if (f){
        renderSpeciesInfo(v);
        showCompatResult(v);
        renderBrowseList(v);
      } else {
        spInfo.innerHTML = "";
        if (compatResult) compatResult.innerHTML = "";
        renderBrowseList(v);
      }
    });
    spInput.addEventListener("blur", () => {
      // delay to allow click on suggestion
      setTimeout(() => { spSugg.hidden = true; }, 150);
    });
  }

  // ----- Compat + browse -----

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

  function renderBrowseList(q){
    if (!window.FISHDB_API || !browseList) return;
    const list = window.FISHDB_API.browse(q);
    if (!list.length){
      browseList.innerHTML = `<p class="muted browse-empty">No species match that search.</p>`;
      return;
    }
    browseList.innerHTML = list.map(f => `
      <button type="button" class="browse-row" data-name="${escapeHTML(f.name)}">
        ${window.FISHDB_API.thumbHTML(f)}
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
        if (!f) return;
        detail.innerHTML = window.FISHDB_API.profileCard(f) +
          `<button type="button" class="btn block browse-add-btn" data-addname="${escapeHTML(f.name)}" style="margin-top:12px">Add to tank</button>`;
        detail.hidden = false;
        row.classList.add("open");
        bindSourcesToggle(detail);
        // Wire Add to tank — skips tank picker since we're already inside this tank
        const addBtn = detail.querySelector(".browse-add-btn");
        if (addBtn){
          addBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            showQuickAddCompat(f, t);
          });
        }
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

  // Render browse list on first load (empty query = full list)
  renderBrowseList("");

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
   ADVISOR DISMISS — persistent per-(tank, sig) store
   Called after logging water_care to auto-resolve stale banners.
   Survives tab switches and re-renders within the same session.
   Persisted to localStorage so X stays gone across page reloads.
   Auto-expiry: entries older than 7 days are pruned on read.
   ============================================================ */
const ADV_DISMISS_KEY = "tm.advisorDismiss.v1";
const ADV_DISMISS_TTL = 7 * 86400000; // 7 days

function _loadAdvisorDismiss(){
  try { return JSON.parse(localStorage.getItem(ADV_DISMISS_KEY) || "{}"); }
  catch { return {}; }
}
function _saveAdvisorDismiss(d){
  try { localStorage.setItem(ADV_DISMISS_KEY, JSON.stringify(d)); } catch {}
}
function _isAdvisorDismissed(tankId, sig){
  const d = _loadAdvisorDismiss();
  const entries = d[tankId];
  if (!entries) return false;
  const now = Date.now();
  // Each entry: { sig, ts }
  return entries.some(e => e.sig === sig && (now - e.ts) < ADV_DISMISS_TTL);
}
function _dismissAdvisor(tankId, sig){
  const d = _loadAdvisorDismiss();
  const now = Date.now();
  // Prune expired entries for this tank, then add new one
  const existing = (d[tankId] || []).filter(e => (now - e.ts) < ADV_DISMISS_TTL && e.sig !== sig);
  existing.push({ sig, ts: now });
  d[tankId] = existing;
  _saveAdvisorDismiss(d);
}
function _clearAdvisorDismissals(tankId, filterFn){
  // filterFn(entry) -> true = keep (do NOT clear), false = clear
  // If filterFn is omitted, clears all entries for the tank
  const d = _loadAdvisorDismiss();
  if (!d[tankId]) return;
  if (typeof filterFn === 'function') {
    d[tankId] = d[tankId].filter(filterFn);
  } else {
    delete d[tankId];
  }
  _saveAdvisorDismiss(d);
}

function recomputeTankAlerts(tankId){
  // When new data is saved, clear ONLY dismissals for rules whose trigger
  // condition may now be resolved. Preserve dismissals the user explicitly set
  // for unrelated insights (so manually dismissed fyi insights stay gone).
  //
  // Rules cleared automatically after data save:
  //   - water_change_cadence  (a new water change resolves it)
  //   - nitrate_current       (new test data may have changed it)
  //   - nitrite_current
  //   - ammonia_current
  //   - ph_current
  //   - temp_current
  //   - test_staleness        (a new test resolves it)
  //   - combined_overdue_nitrate_stocking
  //   - stability_shift
  const AUTO_CLEAR_RULES = new Set([
    "water_change_cadence",
    "nitrate_current",
    "nitrite_current",
    "ammonia_current",
    "ph_current",
    "temp_current",
    "test_staleness",
    "combined_overdue_nitrate_stocking",
    "stability_shift",
  ]);
  // Clear only entries whose ruleId is in the auto-clear set
  _clearAdvisorDismissals(tankId, entry => {
    const ruleId = entry.sig.split(" | ")[0];
    return !AUTO_CLEAR_RULES.has(ruleId);  // keep = true means NOT auto-cleared
  });
  // Re-expose events so advisor.js picks up the new reading immediately
  window.events = events;
}

/* ============================================================
   WATER CARE — PREFILL HELPERS
   Each returns a plain object with the subset of fields it knows
   about, or null if no prior data exists for that tank.
   Backward-compat: reads water_care, water_change, water_test.
   ============================================================ */
function _lastCarePrefill(tankId){
  // Most recent event that has BOTH a gallons value AND at least one test reading
  const evs = tankEvents(tankId);
  const combined = evs.find(e =>
    (e.type === "water_care") &&
    e.data && e.data.gallons > 0 &&
    (e.data.ph !== "" && e.data.ph != null ||
     e.data.ammonia !== "" && e.data.ammonia != null ||
     e.data.nitrite !== "" && e.data.nitrite != null ||
     e.data.nitrate !== "" && e.data.nitrate != null)
  );
  if (!combined) return null;
  const d = combined.data;
  return {
    gallons: d.gallons,
    ph:      d.ph,
    ammonia: d.ammonia,
    nitrite: d.nitrite,
    nitrate: d.nitrate,
    temp_f:  d.temp_f,
    notes:   ""   // intentionally blank — notes are session-specific
  };
}

function _lastChangePrefill(tankId){
  // Most recent event that has a gallons value (water_care or water_change)
  const evs = tankEvents(tankId);
  const ev = evs.find(e =>
    (e.type === "water_care" || e.type === "water_change") &&
    e.data && e.data.gallons > 0
  );
  if (!ev) return null;
  return { gallons: ev.data.gallons };
}

function _lastTestPrefill(tankId){
  // Most recent event that has any test reading
  const evs = tankEvents(tankId);
  const ev = evs.find(e =>
    (e.type === "water_care" || e.type === "water_test") &&
    e.data &&
    (e.data.ph !== "" && e.data.ph != null ||
     e.data.ammonia !== "" && e.data.ammonia != null ||
     e.data.nitrite !== "" && e.data.nitrite != null ||
     e.data.nitrate !== "" && e.data.nitrate != null)
  );
  if (!ev) return null;
  const d = ev.data;
  return {
    ph:      d.ph,
    ammonia: d.ammonia,
    nitrite: d.nitrite,
    nitrate: d.nitrate,
    temp_f:  d.temp_f
  };
}

/* ============================================================
   WATER CARE TAB — merged Water Change + Tests
   Saves as water_care event (gallons + test readings + doses).
   Backward-compat: old water_change and water_test records are
   preserved and still render correctly in history.
   ============================================================ */
function renderWaterCare(t){
  const _wctx = _getTankContext(t);
  const _heaterTip = (!_wctx.hasHeater && (_wctx.kind === 'betta' || _wctx.kind === 'community'))
    ? `<div class="tank-context-hint">Tip: Your setup may need a heater — temperature affects water chemistry readings.</div>`
    : "";

  // BUG 3 FIX: t.gallons may be stored as a string. Coerce to Number before math.
  const gals = Number(t.gallons) || 10;
  const suggested = Math.round(gals * 0.5);
  if (!t.chemicals) t.chemicals = [];

  // Prefill data for Quick Log buttons
  const prefillCare   = _lastCarePrefill(t.id);
  const prefillChange = _lastChangePrefill(t.id);
  const prefillTest   = _lastTestPrefill(t.id);

  // Pull last readings for most-recent display
  const lastTest   = lastEventOfType(t.id, "water_test")   || lastEventOfType(t.id, "water_care");
  const lastChange = lastEventOfType(t.id, "water_change") || lastEventOfType(t.id, "water_care");
  const ld = lastTest ? lastTest.data : null;

  // Quick Log — repeat last care button (disabled + hint if no combined history)
  const repeatBtn = prefillCare
    ? `<button class="btn small ql-btn" id="ql-repeat" type="button">Repeat last care</button>`
    : `<button class="btn small ql-btn" disabled title="No combined care session found yet">Repeat last care</button>`;

  return `
    ${_heaterTip}
    <!-- QUICK LOG SECTION -->
    <div class="section ql-section" id="ql-section">
      <h2>Quick log</h2>
      <p class="muted small" style="margin:-2px 0 10px">Prefills the form below — review and tap Save when ready.</p>
      <div class="ql-row">
        ${repeatBtn}
        <button class="btn small ql-btn" id="ql-change" type="button"
          ${prefillChange ? "" : ""}
        >Water change only</button>
        <button class="btn small ql-btn" id="ql-test" type="button"
          ${prefillTest ? "" : ""}
        >Test only</button>
      </div>
      ${!prefillCare && !prefillChange && !prefillTest ? `<p class="muted small" style="margin:8px 0 0">No history yet for this tank — fill in the form below to get started.</p>` : ""}
    </div>

    <!-- WATER CHANGE SECTION -->
    <div class="section" id="wc-section">
      <h2>Water change</h2>
      <p class="muted" style="margin-top:0">${suggested} gal would be a ~50% change on this tank. Leave gallons at 0 if you're only logging a test.</p>
      <div class="row">
        <label class="field"><span>Gallons changed</span>
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

    <!-- WATER TEST SECTION -->
    <div class="section" id="wt-section">
      <div class="wt-section-head">
        <h2 style="margin:0">Water test</h2>
        <div class="wt-helpers">
          ${prefillTest ? `<button class="btn small ghost wt-helper" id="wth-same" type="button">Same as last</button>` : ""}
          <button class="btn small ghost wt-helper" id="wth-normal" type="button">Normal</button>
          <button class="btn small ghost wt-helper" id="wth-clear" type="button">Clear</button>
        </div>
      </div>
      <p class="muted" style="margin-top:6px">Leave any field blank if you didn't test it.</p>
      <div class="row">
        <label class="field"><span>pH</span><input class="input" id="wt-ph" type="number" step="0.1" inputmode="decimal" placeholder="e.g. 7.2" /></label>
        <label class="field"><span>Ammonia (ppm)</span><input class="input" id="wt-ammonia" type="number" step="0.25" inputmode="decimal" placeholder="e.g. 0" /></label>
      </div>
      <div class="row">
        <label class="field"><span>Nitrite (ppm)</span><input class="input" id="wt-nitrite" type="number" step="0.25" inputmode="decimal" placeholder="e.g. 0" /></label>
        <label class="field"><span>Nitrate (ppm)</span><input class="input" id="wt-nitrate" type="number" step="5" inputmode="decimal" placeholder="e.g. 10" /></label>
      </div>
      <div class="row">
        <label class="field"><span>Temp °F (optional)</span><input class="input" id="wt-temp" type="number" step="0.1" inputmode="decimal" placeholder="e.g. 78" /></label>
      </div>
    </div>

    <!-- NOTES + SAVE -->
    <div class="section">
      <label class="field"><span>Session notes (optional)</span>
        <input class="input" id="wc-notes" placeholder="e.g. trimmed moss, vacuumed substrate" /></label>
      <button class="btn block" id="log-wc-btn" style="margin-top:10px">Save to history</button>
    </div>

    <!-- LAST READING SUMMARY -->
    ${ld ? `
      <div class="section">
        <h2>Most recent reading</h2>
        <div class="kv">
          <b>When</b><span>${formatTS(lastTest.ts)}</span>
          ${renderReadingRow("pH",       "ph",      ld.ph,      undefined, getSafeRanges(t))}
          ${renderReadingRow("Ammonia",  "ammonia", ld.ammonia, "ppm",     getSafeRanges(t))}
          ${renderReadingRow("Nitrite",  "nitrite", ld.nitrite, "ppm",     getSafeRanges(t))}
          ${renderReadingRow("Nitrate",  "nitrate", ld.nitrate, "ppm",     getSafeRanges(t))}
          ${ld.temp_f != null && ld.temp_f !== "" ? `<b>Temp</b><span>${escapeHTML(String(ld.temp_f))} \u00b0F</span>` : ""}
          ${ld.notes ? `<b>Notes</b><span>${escapeHTML(ld.notes)}</span>` : ""}
        </div>
      </div>` : ""}

    ${window.GRAPHS ? window.GRAPHS.renderGraphsSection(t) : ""}

    ${(() => { const sr = getSafeRanges(t); return `
    <div class="section">
      <h2>Normal ranges for this tank</h2>
      <ul class="muted" style="line-height:1.7;margin:0;padding-left:18px">
        <li><b style="color:var(--ink)">pH</b> \u2014 ${sr.ph.good[0]}\u2013${sr.ph.good[1]} ideal (warn outside ${sr.ph.warn[0]}\u2013${sr.ph.warn[1]})</li>
        <li><b style="color:var(--ink)">Ammonia</b> \u2014 ${sr.ammonia.good[1] === 0 ? "0 ppm. Zero tolerance — any reading means trouble." : `0\u2013${sr.ammonia.good[1]} ppm ideal; warn at ${sr.ammonia.warn[1]} ppm.`}</li>
        <li><b style="color:var(--ink)">Nitrite</b> \u2014 0 ppm. Toxic above 0.</li>
        <li><b style="color:var(--ink)">Nitrate</b> \u2014 ${sr.nitrate.good[0] > 0 ? `${sr.nitrate.good[0]}\u2013${sr.nitrate.good[1]} ppm ideal` : `under ${sr.nitrate.good[1]} ppm ideal`}; warn above ${sr.nitrate.warn[1]} ppm.</li>
      </ul>
    </div>
    `; })()} 
  `;
}

function bindWaterCare(t){
  const inp = $("#wc-gallons");
  const out = $("#dose-out");

  // --- Dose calculator (identical to bindClean) ---
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
      ? `<span class="verify-badge verified">\u2713 Verified</span>`
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
        <button class="chem-remove" data-remove="${c.instanceId}" title="Remove from tank">\u00d7</button>
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

  // ----------------------------------------------------------------
  // QUICK LOG — prefill helpers
  // Sets form fields from a data object; never saves.
  // Only keys present in `fields` are written; missing keys untouched.
  // ----------------------------------------------------------------
  function setField(id, val){
    const el = document.getElementById(id);
    if (!el) return;
    el.value = (val != null && val !== "") ? String(val) : "";
    // Trigger input event so dose calculator repaints if gallons changed
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function prefillForm(fields){
    if (fields.gallons != null) setField("wc-gallons", fields.gallons);
    if ("ph"      in fields)   setField("wt-ph",      fields.ph);
    if ("ammonia" in fields)   setField("wt-ammonia", fields.ammonia);
    if ("nitrite" in fields)   setField("wt-nitrite", fields.nitrite);
    if ("nitrate" in fields)   setField("wt-nitrate", fields.nitrate);
    if ("temp_f"  in fields)   setField("wt-temp",    fields.temp_f);
    if ("notes"   in fields)   setField("wc-notes",   fields.notes);
    // Scroll smoothly to the form so the user sees what was filled
    const sec = document.getElementById("wc-section");
    if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Quick Log buttons
  const qlRepeat = document.getElementById("ql-repeat");
  const qlChange = document.getElementById("ql-change");
  const qlTest   = document.getElementById("ql-test");

  if (qlRepeat){
    const data = _lastCarePrefill(t.id);
    if (data){
      qlRepeat.addEventListener("click", () => {
        prefillForm(data);
        toast("Prefilled from last care session");
      });
    }
  }

  if (qlChange){
    qlChange.addEventListener("click", () => {
      const data = _lastChangePrefill(t.id);
      // Prefill gallons from last change; clear test fields so it reads as change-only
      prefillForm({
        gallons: data ? data.gallons : Math.round(Number(t.gallons) * 0.5),
        ph: "", ammonia: "", nitrite: "", nitrate: "", temp_f: ""
      });
      toast("Water change prefilled — test fields cleared");
      // Scroll to wc-section
      const sec = document.getElementById("wc-section");
      if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  if (qlTest){
    qlTest.addEventListener("click", () => {
      const data = _lastTestPrefill(t.id);
      // Set gallons to 0 / blank (test-only session), prefill test readings
      prefillForm(Object.assign(
        { gallons: 0 },
        data || { ph: "", ammonia: "", nitrite: "", nitrate: "", temp_f: "" }
      ));
      toast(data ? "Test prefilled from last reading" : "Test fields ready");
      // Scroll to test section
      const sec = document.getElementById("wt-section");
      if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // Field helpers — Same as last / Normal / Clear (test fields only)
  const wthSame   = document.getElementById("wth-same");
  const wthNormal = document.getElementById("wth-normal");
  const wthClear  = document.getElementById("wth-clear");

  if (wthSame){
    wthSame.addEventListener("click", () => {
      const data = _lastTestPrefill(t.id);
      if (!data){ toast("No previous test found"); return; }
      setField("wt-ph",      data.ph);
      setField("wt-ammonia", data.ammonia);
      setField("wt-nitrite", data.nitrite);
      setField("wt-nitrate", data.nitrate);
      setField("wt-temp",    data.temp_f);
      toast("Test fields filled from last reading");
    });
  }

  if (wthNormal){
    // Normal = freshwater "all-clear" ideal midpoints from SAFE ranges
    wthNormal.addEventListener("click", () => {
      setField("wt-ph",      7.2);   // midpoint of 6.5–7.8 ideal
      setField("wt-ammonia", 0);
      setField("wt-nitrite", 0);
      setField("wt-nitrate", 10);    // low end of acceptable (under 20 ideal)
      // Leave temp untouched — it's tank-specific
      toast("Normal freshwater values filled in");
    });
  }

  if (wthClear){
    wthClear.addEventListener("click", () => {
      ["wt-ph","wt-ammonia","wt-nitrite","wt-nitrate","wt-temp"].forEach(id => setField(id, ""));
      toast("Test fields cleared");
    });
  }

  // Verify / manual dose prompts (reuse same helpers from bindClean closure)
  function openVerifyPrompt(entry){
    const spec = chemResolve(entry);
    if (!spec) return;
    const title = `${escapeHTML(spec.brand || "")} ${escapeHTML(spec.name || "")}`.trim();
    const srcLink = spec.source
      ? `<a class="chem-source" href="${spec.source}" target="_blank" rel="noopener">Source</a>`
      : "";
    openModal(`
      <h3 style="margin:0 0 6px">${title}</h3>
      <p class="muted small" style="margin:0 0 10px">Check this against your bottle label before confirming.</p>
      <div class="verify-prompt-rule">${escapeHTML(spec.rule || "")} ${srcLink}</div>
      <button class="btn block" id="vp-confirm" style="margin-top:14px">Confirm \u2014 matches my bottle</button>
      <button class="btn block secondary" id="vp-manual" style="margin-top:8px">Not the correct dosage</button>
    `, () => {
      $("#vp-confirm").addEventListener("click", () => {
        entry.verified = true;
        entry.doseSource = entry.doseSource === "manual" ? "manual" : "researched";
        entry.savedDose = { mlPerGallon: spec.mlPerGallon, unit: spec.unit, rule: spec.rule, capSize: spec.capSize };
        entry.verifiedAt = new Date().toISOString();
        saveTanks(tanks);
        logEvent(t.id, "chem_verify", { name: title, source: entry.doseSource });
        closeModal(); paint();
      });
      $("#vp-manual").addEventListener("click", () => { closeModal(); openManualDose(entry); });
    });
  }

  function openManualDose(entry){
    const spec = chemResolve(entry);
    if (!spec) return;
    const title = `${escapeHTML(spec.brand || "")} ${escapeHTML(spec.name || "")}`.trim();
    const units = ["mL","pumps","drops","g","tsp","oz"];
    if (spec.unit && !units.includes(spec.unit)) units.unshift(spec.unit);
    openModal(`
      <h3 style="margin:0 0 6px">${title} \u2014 manual dose</h3>
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
        <button class="btn" id="md-save">Save &amp; mark verified</button>
        <button class="btn secondary" id="md-cancel">Cancel</button>
      </div>
    `, () => {
      $("#md-save").addEventListener("click", () => {
        const amt = parseFloat($("#md-amount").value);
        const unit = $("#md-unit").value;
        const rule = $("#md-rule").value.trim();
        if (!amt || amt <= 0){ alert("Enter the amount per gallon"); return; }
        entry.savedDose = { mlPerGallon: amt, unit, rule: rule || `${amt} ${unit} per gallon`, capSize: 0 };
        entry.doseSource = "manual";
        entry.verified = true;
        entry.verifiedAt = new Date().toISOString();
        saveTanks(tanks);
        logEvent(t.id, "chem_verify", { name: title, source: "manual" });
        closeModal(); paint();
      });
      $("#md-cancel").addEventListener("click", closeModal);
    });
  }

  // Chemical picker (reuse same modal builders)
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
        if (t.chemicals.some(c => c.libraryId === libId)){ toast("Already added"); closeModal(); return; }
        t.chemicals.push(entry);
        saveTanks(tanks);
        const spec = window.CHEMICALS && window.CHEMICALS.byId(libId);
        logEvent(t.id, "chem_add", { name: spec ? `${spec.brand} ${spec.name}` : libId });
        closeModal(); paint(); openVerifyPrompt(entry);
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
        const custom = { brand, name, type, unit, mlPerGallon: amt, capSize: 0,
          rule: rule || `${amt} ${unit} per gallon`, when: "", source: "" };
        const entry = { instanceId: uid(), libraryId: null, custom };
        t.chemicals = t.chemicals || [];
        t.chemicals.push(entry);
        saveTanks(tanks);
        logEvent(t.id, "chem_add", { name: `${brand} ${name}`, custom: true });
        closeModal(); paint(); openVerifyPrompt(entry);
      });
      $("#cc-cancel").addEventListener("click", closeModal);
    });
  }

  $("#add-chem-btn").addEventListener("click", openChemPicker);

  // --- Save handler ---
  $("#log-wc-btn").addEventListener("click", () => {
    const g       = parseFloat($("#wc-gallons").value);
    const ph      = $("#wt-ph").value;
    const ammonia = $("#wt-ammonia").value;
    const nitrite = $("#wt-nitrite").value;
    const nitrate = $("#wt-nitrate").value;
    const temp_f  = $("#wt-temp").value;
    const notes   = $("#wc-notes").value.trim();
    const date    = $("#wc-date").value || new Date().toISOString().slice(0,10);

    const hasTest = ph || ammonia || nitrite || nitrate || temp_f;
    if (!g && !hasTest) {
      alert("Enter gallons changed, at least one test reading, or both.");
      return;
    }

    const list = t.chemicals || [];
    const dosesLogged = (g > 0) ? list.map(c => {
      const spec = chemResolve(c);
      if (!spec) return null;
      return {
        name: `${spec.brand || ""} ${spec.name || ""}`.trim(),
        amount: +((spec.mlPerGallon || 0) * g).toFixed(2),
        unit: spec.unit || "mL",
        verified: !!c.verified,
        dose_source: c.doseSource || ""
      };
    }).filter(Boolean) : [];

    logEvent(t.id, "water_care", {
      date,
      gallons:  g > 0 ? g : null,
      ph:       ph      === "" ? "" : (ph      ? Number(ph)      : ""),
      ammonia:  ammonia === "" ? "" : (ammonia ? Number(ammonia) : ""),
      nitrite:  nitrite === "" ? "" : (nitrite ? Number(nitrite) : ""),
      nitrate:  nitrate === "" ? "" : (nitrate ? Number(nitrate) : ""),
      temp_f:   temp_f  === "" ? "" : (temp_f  ? Number(temp_f)  : ""),
      doses: dosesLogged,
      notes
    });

    // Clear stale advisor alert so it re-evaluates from new data
    recomputeTankAlerts(t.id);

    toast("Saved");
    view.tab = "water-care"; render();
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
  const suggested = Math.round(Number(t.gallons) * 0.5);
  if (!t.chemicals) t.chemicals = [];
  return `
    <div class="section" id="wc-section">
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
      <button class="btn block secondary" id="vp-manual" style="margin-top:8px">Not the correct dosage</button>
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
    view.tab = "water-care"; render();
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
    <div class="section" id="tests-log">
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
          ${renderReadingRow("pH",       "ph",      ld.ph,      undefined, getSafeRanges(t))}
          ${renderReadingRow("Ammonia",  "ammonia", ld.ammonia, "ppm",     getSafeRanges(t))}
          ${renderReadingRow("Nitrite",  "nitrite", ld.nitrite, "ppm",     getSafeRanges(t))}
          ${renderReadingRow("Nitrate",  "nitrate", ld.nitrate, "ppm",     getSafeRanges(t))}
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
                <div class="when">${renderReadingsInline(e.data, getSafeRanges(t))}</div>
                ${e.data.notes ? `<div class="when">${escapeHTML(e.data.notes)}</div>` : ""}
              </div>
            </div>
          `).join("")}
        </div>
      </div>` : ""}

    ${(() => { const sr = getSafeRanges(t); return `
    <div class="section">
      <h2>Normal ranges for this tank</h2>
      <ul class="muted" style="line-height:1.7;margin:0;padding-left:18px">
        <li><b style="color:var(--ink)">pH</b> \u2014 ${sr.ph.good[0]}\u2013${sr.ph.good[1]} ideal (warn outside ${sr.ph.warn[0]}\u2013${sr.ph.warn[1]})</li>
        <li><b style="color:var(--ink)">Ammonia</b> \u2014 ${sr.ammonia.good[1] === 0 ? "0 ppm. Zero tolerance \u2014 any reading means trouble." : `0\u2013${sr.ammonia.good[1]} ppm ideal; warn at ${sr.ammonia.warn[1]} ppm.`}</li>
        <li><b style="color:var(--ink)">Nitrite</b> \u2014 0 ppm. Toxic above 0.</li>
        <li><b style="color:var(--ink)">Nitrate</b> \u2014 ${sr.nitrate.good[0] > 0 ? `${sr.nitrate.good[0]}\u2013${sr.nitrate.good[1]} ppm ideal` : `under ${sr.nitrate.good[1]} ppm ideal`}; warn above ${sr.nitrate.warn[1]} ppm.</li>
      </ul>
    </div>
    `; })()} 
  `;
}
function renderReadingRow(label, metric, value, unit, safe){
  if (value === "" || value == null) return `<b>${label}</b><span class="muted">—</span>`;
  const rating = rateReading(metric, value, safe);
  const cls = rating === "good" ? "good" : rating === "warn" ? "warn" : rating === "bad" ? "bad" : "";
  return `<b>${label}</b><span><span class="reading reading-${cls}">${escapeHTML(String(value))}${unit?" "+unit:""}</span></span>`;
}
function renderReadingsInline(d, safe){
  const parts = [];
  if (d.ph != null && d.ph !== "") parts.push(`pH <b class="reading reading-${rateReading('ph', d.ph, safe)}">${escapeHTML(String(d.ph))}</b>`);
  if (d.ammonia != null && d.ammonia !== "") parts.push(`NH3 <b class="reading reading-${rateReading('ammonia', d.ammonia, safe)}">${escapeHTML(String(d.ammonia))}</b>`);
  if (d.nitrite != null && d.nitrite !== "") parts.push(`NO2 <b class="reading reading-${rateReading('nitrite', d.nitrite, safe)}">${escapeHTML(String(d.nitrite))}</b>`);
  if (d.nitrate != null && d.nitrate !== "") parts.push(`NO3 <b class="reading reading-${rateReading('nitrate', d.nitrate, safe)}">${escapeHTML(String(d.nitrate))}</b>`);
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
  { id: "water_care",   label: "Water care"    },
  { id: "water_change", label: "Water changes" },
  { id: "water_test",   label: "Water tests"   },
  { id: "fish",         label: "Fish"          },
  { id: "tank_edit",    label: "Tank edits"    },
  { id: "advisor",      label: "Advisor"       },
  { id: "reminder_fired", label: "Reminders"   },
  { id: "chem_add",     label: "Chemicals"     },
  { id: "first_tank",   label: "First Tank"    },
  { id: "daily_checkin", label: "Daily check-ins" }
];
let historyFilter = "all";
let historyPrevTankId = null; // reset filter when switching tanks
let expandedEventId = null;

function renderHistory(t){
  // Reset filter state when user navigates to a different tank
  if (t.id !== historyPrevTankId) { historyFilter = "all"; historyPrevTankId = t.id; }
  const all = tankEvents(t.id);
  if(!all.length){
    return `
      <div class="section center">
        <h2>Nothing here yet</h2>
        <p class="muted">Your water changes, tests, fish additions, and tank updates will all appear here.</p>
      </div>`;
  }
  const filtered = all.filter(e => {
    if (historyFilter === "all") return true;
    if (historyFilter === "fish") return e.type.startsWith("fish_");
    if (historyFilter === "first_tank") return e.type === "first_tank" || e.type === "first_tank_complete";
    return e.type === historyFilter;
  });

  // Group same-day events of the same type where grouping makes sense
  function _groupEvents(events) {
    const GROUPABLE = ["first_tank", "daily_checkin", "reminder_fired"];
    const result = [];
    const dayGroups = {}; // key: "type::YYYY-MM-DD"

    events.forEach(e => {
      if (!GROUPABLE.includes(e.type)) {
        result.push(e);
        return;
      }
      const day = new Date(e.ts).toISOString().slice(0, 10);
      const key = e.type + "::" + day;
      if (!dayGroups[key]) {
        // First event of this type on this day — create a group placeholder
        const group = {
          ...e,
          _isGroup: true,
          _groupCount: 1,
          _groupDay: day,
          _groupType: e.type,
          _members: [e]
        };
        dayGroups[key] = group;
        result.push(group);
      } else {
        dayGroups[key]._groupCount++;
        dayGroups[key]._members.push(e);
      }
    });

    return result;
  }

  const grouped = _groupEvents(filtered);

  return `
    <div class="section">
      <h2>Activity timeline</h2>
      <div class="filter-row">
        ${HISTORY_FILTERS.map(f => `
          <button class="chip ${historyFilter===f.id?'active':''}" data-filter="${f.id}">${f.label}</button>
        `).join("")}
      </div>
      <div class="fish-list" style="margin-top:10px">
        ${grouped.length ? grouped.map(e => renderEventRow(e)).join("") : `<p class="muted center">No entries match this filter.</p>`}
      </div>
    </div>
  `;
}

function renderEventRow(e){
  // Grouped event rendering
  if (e._isGroup && e._groupCount > 1) {
    const isOpen = expandedEventId === e.id;
    const label = e._groupType === "first_tank" ? "First Tank updates"
      : e._groupType === "daily_checkin" ? "Daily check-ins"
      : "Reminders";
    const dayStr = new Date(e._groupDay + "T12:00:00").toLocaleDateString(undefined, { month:"short", day:"numeric" });
    // Always pre-render member rows — CSS grid animation reveals them on .open class toggle
    // so no JS re-render is needed on expand/collapse.
    const memberRows = e._members.map(m => {
      const t2 = eventTitle(m);
      const t2when = new Date(m.ts).toLocaleTimeString(undefined, { hour:"numeric", minute:"2-digit" });
      return `<div class="event-group-member"><span class="event-group-member-title">${t2}</span><span class="muted small">${t2when}</span></div>`;
    }).join("");
    return `
      <div class="event-row event-row-group${isOpen ? " open" : ""}" data-id="${e.id}">
        <div class="event-main" data-expand="${e.id}" role="button" tabindex="0" aria-expanded="${isOpen}">
          <div class="event-icon ${e._groupType}">${eventIcon(e._groupType)}</div>
          <div class="event-body">
            <div class="event-title">${label} <span class="event-group-badge">${e._groupCount}</span></div>
            <div class="event-when">${dayStr}</div>
          </div>
          <svg class="event-chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8 10l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="event-expand">
          <div class="event-expand-inner">
            ${memberRows}
          </div>
        </div>
      </div>
    `;
  }

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
          <div class="event-actions">
            ${e.type === "water_change" ? `<button class="btn small secondary event-repeat-btn" data-repeat-tab="water-care" type="button">Log another change</button>` : ""}
            ${e.type === "water_test"   ? `<button class="btn small secondary event-repeat-btn" data-repeat-tab="water-care" type="button">Log another test</button>` : ""}
            ${e.type === "water_care"   ? `<button class="btn small secondary event-repeat-btn" data-repeat-tab="water-care" type="button">Log another</button>` : ""}
            <button class="btn small danger event-del-btn" data-del="${e.id}">Remove entry</button>
          </div>
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

  if (e.type === "water_care") {
    if (d.gallons) add("Amount changed", `${fmt(d.gallons)} gal`);
    add("Change date", d.date);
    add("pH", d.ph);
    add("Ammonia (NH₃)", d.ammonia);
    add("Nitrite (NO₂)", d.nitrite);
    add("Nitrate (NO₃)", d.nitrate);
    add("Temperature", d.temp_f != null && d.temp_f !== "" ? `${d.temp_f}°F` : "");
    if (Array.isArray(d.doses) && d.doses.length){
      const lines = d.doses.map(dose =>
        `${escapeHTML(dose.name)} — ${fmt(dose.amount)} ${escapeHTML(dose.unit || "")}${dose.verified ? " ✓" : ""}`
      );
      rows.push({ label: "Doses", val: lines.join("<br>") });
    }
    add("Notes", d.notes ? escapeHTML(d.notes) : "");
  } else if (e.type === "water_test") {
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

const EVT_ICONS = {
  water_care:     `<svg class="evt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/><line x1="12" y1="22" x2="12" y2="14"/></svg>`,
  water_change:   `<svg class="evt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
  water_test:     `<svg class="evt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5m4 0h10m-6 4v4m-4-4v4m8-4v4"/></svg>`,
  fish_add:       `<svg class="evt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  fish_remove:    `<svg class="evt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  fish_edit:      `<svg class="evt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  tank_edit:      `<svg class="evt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>`,
  advisor:        `<svg class="evt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  reminder_fired: `<svg class="evt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  chem_add:       `<svg class="evt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6m-5 0v6l-4 9a1 1 0 0 0 .9 1.45h10.2A1 1 0 0 0 18 18L14 9V3"/><line x1="7" y1="13" x2="17" y2="13"/></svg>`,
  first_tank:          `<svg class="evt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12m0 0C12 7 7 5 7 5s2 4 5 7zm0 0c0-5 5-7 5-7s-2 4-5 7z"/></svg>`,
  first_tank_complete: `<svg class="evt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12m0 0C12 7 7 5 7 5s2 4 5 7zm0 0c0-5 5-7 5-7s-2 4-5 7z"/></svg>`,
  daily_checkin:  `<svg class="evt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
};
function eventIcon(type){
  return EVT_ICONS[type] || `<svg class="evt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/></svg>`;
}
function eventTitle(e){
  const d = e.data || {};
  if (e.type === "water_care")   return `Water care — ${d.gallons ? d.gallons + " gal" : "test"}${(d.ph !== "" && d.ph != null) ? " · pH " + d.ph : ""}`;
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
  if (e.type === "first_tank_complete") return `🌱 First tank complete`;
  if (e.type === "daily_checkin") return `Daily check-in`;
  return e.type;
}
function eventDetail(e){
  const d = e.data || {};
  if (e.type === "water_care") {
    const bits = [];
    if (e.data.gallons) bits.push(`${fmt(e.data.gallons)} gal changed`);
    const rd = { ph: e.data.ph, ammonia: e.data.ammonia, nitrite: e.data.nitrite, nitrate: e.data.nitrate, temp_f: e.data.temp_f };
    const inline = renderReadingsInline(rd);
    if (inline && inline !== '<span class="muted">no values</span>') bits.push(inline);
    if (e.data.notes) bits.push(escapeHTML(e.data.notes));
    return bits.join(" · ");
  }
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
  if (e.type === "first_tank_complete") {
    return `Tank fully set up — ${escapeHTML(d.kind || "freshwater")} setup complete.`;
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
  // "Log another" quick-action from expanded history entries — jump straight to the action tab
  $$(".event-repeat-btn").forEach(b => b.addEventListener("click", (ev) => {
    ev.stopPropagation();
    const tab = b.dataset.repeatTab;
    view.tab = tab;
    expandedEventId = null;
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
   EQUIPMENT & MAINTENANCE DASHBOARD
   ============================================================ */

let eqFilter    = "all"; // week | month | upcoming | all
let eqPrevTankId = null;  // reset filter when switching tanks

const EQ_GUIDANCE_BY_KIND = {
  betta: {
    required: ["Heater (76\u201382\u00b0F)", "Filter with low flow"],
    recommended: ["Thermometer", "LED light"],
    optional: ["CO2 system", "UV sterilizer"]
  },
  community: {
    required: ["Filter", "Heater (if tropical fish)", "Thermometer"],
    recommended: ["LED light", "Air pump (optional backup)"],
    optional: ["UV sterilizer", "CO2 system"]
  },
  shrimp: {
    required: ["Sponge filter", "Heater", "Thermometer"],
    recommended: ["Aqua soil substrate", "Plants / moss"],
    optional: ["CO2 system", "UV sterilizer"]
  },
  planted: {
    required: ["Filter", "Plant-friendly light", "Fertilizer"],
    recommended: ["CO2 system", "Heater", "Thermometer"],
    optional: ["UV sterilizer"]
  },
  species: {
    required: ["Filter", "Heater matched to species", "Thermometer"],
    recommended: ["Species-appropriate light"],
    optional: ["UV sterilizer", "CO2 system"]
  },
  quarantine: {
    required: ["Sponge filter", "Heater", "Thermometer"],
    recommended: ["Basic light"],
    optional: ["UV sterilizer"]
  },
  other: {
    required: ["Filter", "Heater (if tropical)", "Thermometer"],
    recommended: [],
    optional: []
  }
};

function renderEquipment(t) {
  if (typeof EQ === "undefined") {
    return `<div class="section"><p class="muted center">Equipment module not loaded.</p></div>`;
  }
  // Reset filter when switching to a different tank
  if (t.id !== eqPrevTankId) { eqFilter = "all"; eqPrevTankId = t.id; }

  const summary = EQ.tankSummary(t.id);
  const items   = EQ.dueList(t.id, eqFilter);
  // For "all" show everything active; for other windows dueList already filters
  const allActive = EQ.getItems(t.id);
  const archived  = EQ.getAllItems().filter(i => i.tankId === t.id && !i.isActive);

  // Display list: if filter is "all" use allActive; else use dueList result
  const displayItems = eqFilter === "all" ? allActive : items;

  /* ── Summary chips ── */
  const chips = [];
  if (summary.overdue)      chips.push(`<span class="eq-chip eq-chip-bad">${summary.overdue} overdue</span>`);
  if (summary.dueThisWeek)  chips.push(`<span class="eq-chip eq-chip-warn">${summary.dueThisWeek} due this week</span>`);
  if (summary.dueThisMonth) chips.push(`<span class="eq-chip eq-chip-soon">${summary.dueThisMonth} due this month</span>`);
  if (summary.expiringSoon) chips.push(`<span class="eq-chip eq-chip-expiry">${summary.expiringSoon} expiring soon</span>`);
  if (!chips.length && summary.total > 0) chips.push(`<span class="eq-chip eq-chip-ok">All caught up</span>`);

  const summaryBar = chips.length
    ? `<div class="eq-summary-bar">${chips.join("")}</div>`
    : "";

  /* ── Filter strip ── */
  const filters = [
    { id: "all",      label: "All" },
    { id: "week",     label: "This week" },
    { id: "month",    label: "This month" },
    { id: "upcoming", label: "Upcoming" },
  ];
  const filterStrip = `
    <div class="eq-filters" role="tablist" aria-label="Equipment filter">
      ${filters.map(f => `
        <button class="eq-filter-btn${eqFilter === f.id ? " active" : ""}" data-eq-filter="${f.id}" role="tab" aria-selected="${eqFilter === f.id}">${f.label}</button>
      `).join("")}
    </div>`;

  /* ── Equipment cards ── */
  function _renderCard(item) {
    const st   = EQ.itemStatus(item);
    const type = EQ.TYPES.find(ty => ty.id === item.type) || { label: "Other", icon: "📦" };
    const subtypeLabel = item.subtype
      ? (type.subtypes || []).find(s => s.id === item.subtype)?.label || ""
      : "";
    const typeChip = subtypeLabel
      ? `${type.icon} ${escapeHTML(subtypeLabel)}`
      : `${type.icon} ${escapeHTML(type.label)}`;

    // Status chip class
    const chipClass = {
      ok:           "eq-status-ok",
      due_week:     "eq-status-warn",
      due_month:    "eq-status-soon",
      overdue:      "eq-status-bad",
      expiring_soon:"eq-status-expiry",
      expired:      "eq-status-bad",
      no_schedule:  "eq-status-neutral",
      archived:     "eq-status-neutral",
    }[st.code] || "eq-status-neutral";

    // Human-readable due line
    let dueLine = "";
    if (st.code === "overdue" || st.code === "expired") {
      const n = Math.abs(st.daysUntil);
      dueLine = `${n === 0 ? "Due today" : `${n} day${n === 1 ? "" : "s"} overdue`}`;
    } else if (st.code === "due_week") {
      const n = st.daysUntil;
      dueLine = n === 0 ? "Due today" : `Due in ${n} day${n === 1 ? "" : "s"}`;
    } else if (st.code === "due_month" || st.code === "expiring_soon") {
      dueLine = `In ${st.daysUntil} days`;
    } else if (st.code === "ok" && st.daysUntil !== null) {
      dueLine = `In ${st.daysUntil} days`;
    } else if (st.code === "no_schedule") {
      dueLine = "No schedule set";
    }

    // Action label
    const actionLabel = (st.kind === "replace") ? escapeHTML(item.replacementLabel || "Replace")
                      : (st.kind === "expiry")  ? "Check / swap"
                      :                            escapeHTML(item.serviceLabel || "Mark done");
    const actionFn    = (st.kind === "replace") ? "markReplaced" : "markServiced";

    const brandModel = [item.brand, item.model].filter(Boolean).join(" ");

    return `
      <div class="eq-card eq-card-${st.code}" data-eq-id="${item.id}">
        <div class="eq-card-top">
          <div class="eq-card-left">
            <span class="eq-type-chip">${typeChip}</span>
            <div class="eq-card-name">${escapeHTML(item.name)}</div>
            ${brandModel ? `<div class="eq-card-brand muted small">${escapeHTML(brandModel)}</div>` : ""}
          </div>
          <span class="eq-status-chip ${chipClass}">${escapeHTML(st.label)}</span>
        </div>
        ${dueLine ? `<div class="eq-due-line">${escapeHTML(dueLine)}</div>` : ""}
        <div class="eq-card-actions">
          ${st.code !== "no_schedule" && st.code !== "archived"
            ? `<button class="btn small eq-mark-btn" data-eq-mark="${item.id}" data-eq-action="${actionFn}">${actionLabel}</button>`
            : ""}
          <button class="btn small secondary eq-edit-btn" data-eq-edit="${item.id}">Edit</button>
          <button class="btn small ghost eq-more-btn" data-eq-more="${item.id}" aria-label="More options" title="More">···</button>
        </div>
      </div>`;
  }

  /* ── Equipment guidance card ── */
  const _kindGuidance = EQ_GUIDANCE_BY_KIND[t.kind] || EQ_GUIDANCE_BY_KIND.other;
  const _essentials = [..._kindGuidance.required, ..._kindGuidance.recommended];
  const _optional = _kindGuidance.optional;
  const guidanceCard = `
    <div class="eq-guidance-card">
      <div class="eq-guidance-title">Recommended for your setup</div>
      <div class="eq-guidance-required">
        <div class="eq-guidance-label">Essential</div>
        ${_kindGuidance.required.map(e => `<div class="eq-guidance-item">✓ ${escapeHTML(e)}</div>`).join('')}
        ${_kindGuidance.recommended.map(e => `<div class="eq-guidance-item muted">▸ ${escapeHTML(e)}</div>`).join('')}
      </div>
      ${_optional.length ? `<div class="eq-guidance-optional"><div class="eq-guidance-label muted">Optional</div>${_optional.map(e => `<div class="eq-guidance-item muted">◦ ${escapeHTML(e)}</div>`).join('')}</div>` : ''}
    </div>`;
  const _kindLabel = tankKindById(t.kind).label;
  const compactGuidanceNote = allActive.length > 0 ? `
    <div class="eq-setup-note">
      <span class="eq-setup-note-label">For a ${escapeHTML(_kindLabel)} tank:</span>
      <span class="eq-setup-note-items">${_kindGuidance.required.map(e => escapeHTML(e)).join(' · ')}</span>
      <span class="eq-setup-note-hint">These are the basics. Add them below if you haven't yet.</span>
    </div>` : '';

  /* ── Empty state ── */
  const emptyState = `
    <div class="eq-empty">
      <div class="eq-empty-icon">🔧</div>
      <p class="eq-empty-title">No equipment tracked yet</p>
      <p class="muted small">Add your filter, heater, light, and other gear here. Tank Care Buddy will track when each item needs service or replacement.</p>
      ${guidanceCard}
    </div>`;

  /* ── Items or empty ── */
  const listHTML = displayItems.length
    ? displayItems.map(_renderCard).join("")
    : (allActive.length > 0
      ? `<p class="muted center" style="padding:24px 0">Nothing due in this window. Tap <b>All</b> to see every item.</p>`
      : emptyState);

  /* ── Archived section ── */
  const archivedHTML = archived.length
    ? `<div class="eq-archived-toggle">
        <button class="btn small ghost" id="eq-show-archived">Show ${archived.length} archived item${archived.length === 1 ? "" : "s"}</button>
       </div>
       <div id="eq-archived-list" hidden>
         ${archived.map(_renderCard).join("")}
       </div>`
    : "";

  // Guided mode sticky banner — shown when first-tank setup is in progress
  const guidedBanner = (t.firstTank && t.firstTank.enabled && !t.firstTank.allDone)
    ? `<div class="guided-return-banner">
         <span class="guided-return-text">Setup guide in progress</span>
         <button class="guided-return-btn" id="eq-back-to-guide" type="button">Back to guide ›</button>
       </div>`
    : '';

  return `
    <div class="section eq-section">
      ${guidedBanner}
      ${summaryBar}
      ${filterStrip}
      ${compactGuidanceNote}
      <div class="eq-list" id="eq-list">${listHTML}</div>
      ${archivedHTML}
      <div class="eq-add-row">
        <button class="btn eq-add-btn" id="eq-add-btn">+ Add Equipment</button>
      </div>
    </div>`;
}

function bindEquipment(t) {
  if (typeof EQ === "undefined") return;

  /* ── Guided mode: back-to-guide banner button ── */
  const backToGuideBtn = document.getElementById("eq-back-to-guide");
  if (backToGuideBtn) {
    backToGuideBtn.addEventListener("click", () => {
      window._ftNavigateToTab && window._ftNavigateToTab("details");
    });
  }

  /* ── Filter strip ── */
  $$("[data-eq-filter]").forEach(b => b.addEventListener("click", () => {
    eqFilter = b.dataset.eqFilter;
    render();
  }));

  /* ── Mark serviced / replaced ──
     Phase 9: route through _openEqMoreModal so the user sees guidance before logging. */
  $$("[data-eq-mark]").forEach(btn => btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const id   = btn.dataset.eqMark;
    const item = EQ.getItem(id);
    if (!item) return;
    _openEqMoreModal(t, item);
  }));

  /* ── Edit ── */
  $$("[data-eq-edit]").forEach(btn => btn.addEventListener("click", () => {
    const item = EQ.getItem(btn.dataset.eqEdit);
    if (!item) return;
    _openEqEditModal(t, item);
  }));

  /* ── More (archive / delete / note) ── */
  $$("[data-eq-more]").forEach(btn => btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const id   = btn.dataset.eqMore;
    const item = EQ.getItem(id);
    if (!item) return;
    _openEqMoreModal(t, item);
  }));

  /* ── Add button ── */
  const addBtn = $("#eq-add-btn");
  if (addBtn) addBtn.addEventListener("click", () => _openEqAddModal(t));

  /* ── Archived toggle ── */
  const archBtn = $("#eq-show-archived");
  if (archBtn) archBtn.addEventListener("click", () => {
    const list = $("#eq-archived-list");
    if (!list) return;
    const hidden = list.hasAttribute("hidden");
    if (hidden) {
      list.removeAttribute("hidden");
      archBtn.textContent = "Hide archived";
    } else {
      list.setAttribute("hidden", "");
      const n = EQ.getAllItems().filter(i => i.tankId === t.id && !i.isActive).length;
      archBtn.textContent = `Show ${n} archived item${n === 1 ? "" : "s"}`;
    }
  });
}

/* ── Add Equipment modal (type → subtype → form) ──────────────── */
function _openEqAddModal(t) {
  // Step 1: type picker
  const typeHTML = EQ.TYPES.map(ty => `
    <button class="eq-type-pick-btn" data-eq-type="${ty.id}">
      <span class="eq-type-pick-icon">${ty.icon}</span>
      <span class="eq-type-pick-label">${escapeHTML(ty.label)}</span>
    </button>`).join("");

  openModal(`
    <div class="modal-inner">
    <h2 class="modal-title">Add Equipment</h2>
    <div class="modal-scroll-body">
    <p class="muted small" style="margin:0 0 16px">What type of equipment is this?</p>
    <div class="eq-type-grid">${typeHTML}</div>
    </div>
    <div class="modal-footer">
      <button class="btn secondary" id="eq-add-cancel">Cancel</button>
    </div>
    </div>`, () => {
      $$("[data-eq-type]").forEach(b => b.addEventListener("click", () => {
        const typeId = b.dataset.eqType;
        const typeObj = EQ.TYPES.find(ty => ty.id === typeId);
        if (!typeObj) return;
        if (typeObj.subtypes && typeObj.subtypes.length > 0) {
          _openEqSubtypeModal(t, typeObj);
        } else {
          _openEqFormModal(t, typeObj, null);
        }
      }));
      const cancelBtn = $("#eq-add-cancel");
      if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
    });
}

function _openEqSubtypeModal(t, typeObj) {
  const subtypeHTML = typeObj.subtypes.map(s => `
    <button class="eq-type-pick-btn" data-eq-sub="${s.id}">
      <span class="eq-type-pick-label">${escapeHTML(s.label)}</span>
    </button>`).join("");

  openModal(`
    <div class="modal-inner">
    <h2 class="modal-title">${typeObj.icon} ${escapeHTML(typeObj.label)}</h2>
    <div class="modal-scroll-body">
    <p class="muted small" style="margin:0 0 16px">Pick the subtype that matches yours.</p>
    <div class="eq-type-grid">${subtypeHTML}</div>
    </div>
    <div class="modal-footer">
      <button class="btn secondary" id="eq-sub-back">← Back</button>
    </div>
    </div>`, () => {
      $$("[data-eq-sub]").forEach(b => b.addEventListener("click", () => {
        const sub = typeObj.subtypes.find(s => s.id === b.dataset.eqSub);
        if (sub) _openEqFormModal(t, typeObj, sub.id);
      }));
      const backBtn = $("#eq-sub-back");
      if (backBtn) backBtn.addEventListener("click", () => _openEqAddModal(t));
    });
}

function _openEqFormModal(t, typeObj, subtypeId, existingItem) {
  const isEdit = !!existingItem;
  const defs   = typeObj.defaults ? typeObj.defaults(subtypeId) : {};
  const item   = existingItem || {};
  const subtypeLabel = subtypeId
    ? (typeObj.subtypes || []).find(s => s.id === subtypeId)?.label || ""
    : "";

  const today = new Date().toISOString().slice(0, 10);
  const guidance = defs.guidance || item.guidance || "";

  // Pre-fill values
  const name       = item.name   || (subtypeLabel ? `${subtypeLabel} ${typeObj.label}` : typeObj.label);
  const brand      = item.brand  || "";
  const installDt  = item.installDate || today;
  const servInt    = item.serviceIntervalDays     != null ? item.serviceIntervalDays     : (defs.serviceIntervalDays     || "");
  const replInt    = item.replacementIntervalDays != null ? item.replacementIntervalDays : (defs.replacementIntervalDays || "");
  const expiryDt   = item.expiryDate || "";
  const notes      = item.notes || "";
  const isExpiry   = defs.expiryBased || item.expiryBased;

  // Only show expiry field if the type uses expiry (test_kit) or if editing an item that has one
  const showExpiry = isExpiry || !!item.expiryDate;
  // Show replacement interval only if type has one in defaults or existing item has one
  const showReplace = !!(replInt || defs.replacementIntervalDays);

  openModal(`
    <div class="modal-inner">
    <h2 class="modal-title">${isEdit ? "Edit" : "Add"} ${typeObj.icon} ${escapeHTML(subtypeLabel || typeObj.label)}</h2>
    <div class="modal-scroll-body">
    ${guidance ? `<div class="eq-form-guidance">${escapeHTML(guidance)}</div>` : ""}
    <div class="eq-form">
      <label class="field-label">Name <span class="muted small">(what you call it)</span></label>
      <input id="eq-f-name" class="field" type="text" value="${escapeHTML(name)}" placeholder="e.g. Main sponge filter" maxlength="60" />

      <label class="field-label">Brand / model <span class="muted small">(optional)</span></label>
      <input id="eq-f-brand" class="field" type="text" value="${escapeHTML(brand)}" placeholder="e.g. Aquarium Co-Op, Fluval" maxlength="60" />

      <label class="field-label">Install / purchase date</label>
      <input id="eq-f-install" class="field" type="date" value="${escapeHTML(installDt)}" />

      ${!isExpiry && servInt !== "" ? `
      <label class="field-label">${escapeHTML(defs.serviceLabel || item.serviceLabel || "Service")} every <span class="muted small">(days)</span></label>
      <input id="eq-f-serv" class="field" type="number" min="1" max="9999" value="${servInt}" placeholder="e.g. 30" />
      ` : ""}

      ${showReplace ? `
      <label class="field-label">${escapeHTML(defs.replacementLabel || item.replacementLabel || "Replace")} every <span class="muted small">(days)</span></label>
      <input id="eq-f-repl" class="field" type="number" min="1" max="9999" value="${replInt}" placeholder="e.g. 90" />
      ` : ""}

      ${showExpiry ? `
      <label class="field-label">Expiry / best-by date</label>
      <input id="eq-f-expiry" class="field" type="date" value="${escapeHTML(expiryDt)}" />
      ` : ""}

      <label class="field-label">Notes <span class="muted small">(optional)</span></label>
      <textarea id="eq-f-notes" class="field" rows="2" placeholder="Any notes..." maxlength="300">${escapeHTML(notes)}</textarea>
    </div>
    </div><!-- /eq-form -->
    </div><!-- /modal-scroll-body -->
    <div class="modal-footer">
      ${!isEdit ? `<button class="btn secondary" id="eq-form-back">← Back</button>` : `<button class="btn secondary" id="eq-form-cancel">Cancel</button>`}
      <button class="btn" id="eq-form-save">${isEdit ? "Save changes" : "Add equipment"}</button>
    </div>
    </div><!-- /modal-inner -->`, () => {

    const saveBtn = $("#eq-form-save");
    if (saveBtn) saveBtn.addEventListener("click", () => {
      const nameVal    = ($("#eq-f-name")?.value || "").trim();
      if (!nameVal) { toast("Please enter a name."); return; }
      const brandVal   = ($("#eq-f-brand")?.value  || "").trim();
      const installVal = ($("#eq-f-install")?.value || today);
      const servVal    = $("#eq-f-serv")   ? Number($("#eq-f-serv").value)   || null : (existingItem?.serviceIntervalDays     ?? (isExpiry ? null : (defs.serviceIntervalDays || null)));
      const replVal    = $("#eq-f-repl")   ? Number($("#eq-f-repl").value)   || null : (existingItem?.replacementIntervalDays ?? (defs.replacementIntervalDays || null));
      const expiryVal  = $("#eq-f-expiry") ? ($("#eq-f-expiry").value || null) : (existingItem?.expiryDate || null);
      const notesVal   = ($("#eq-f-notes")?.value || "").trim();

      if (isEdit) {
        EQ.updateItem(existingItem.id, {
          name:                    nameVal,
          brand:                   brandVal,
          installDate:             installVal,
          serviceIntervalDays:     servVal,
          replacementIntervalDays: replVal,
          expiryDate:              expiryVal,
          notes:                   notesVal,
        });
        toast(`${nameVal} updated`);
      } else {
        EQ.addItem({
          tankId:                  t.id,
          type:                    typeObj.id,
          subtype:                 subtypeId,
          name:                    nameVal,
          brand:                   brandVal,
          installDate:             installVal,
          serviceIntervalDays:     servVal,
          replacementIntervalDays: replVal,
          expiryDate:              expiryVal,
          notes:                   notesVal,
        });
        toast(`${nameVal} added`);
        // Always land on the equipment tab after adding so the new item is visible
        view.tab = "equipment";
        // Post-add hook: for guided first-tank users, prompt them to start the setup guide
        if (t.firstTank && t.firstTank.enabled && !t.firstTank.allDone) {
          setTimeout(() => {
            actionToast(
              "Equipment saved \u2014 ready to start your setup?",
              "Start guide \u2192",
              () => {
                view = { screen: "tank", tankId: t.id, tab: "details" };
                render();
              }
            );
          }, 400);
        }
      }
      closeModal();
      render();
    });

    const backBtn = $("#eq-form-back");
    if (backBtn) backBtn.addEventListener("click", () => {
      if (subtypeId && typeObj.subtypes?.length) {
        _openEqSubtypeModal(t, typeObj);
      } else {
        _openEqAddModal(t);
      }
    });
    const cancelBtn = $("#eq-form-cancel");
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  });
}

function _openEqEditModal(t, item) {
  const typeObj = EQ.TYPES.find(ty => ty.id === item.type) || EQ.TYPES[EQ.TYPES.length - 1];
  _openEqFormModal(t, typeObj, item.subtype, item);
}

/* Returns plain-text service guidance for an equipment item by type. Phase 9. */
function _getEqServiceGuide(item) {
  const guides = {
    filter:    "Rinse filter media in tank water (not tap water). Check impeller and intake. Replace media if it's falling apart or running slow after a rinse. Do not use soap.",
    heater:    "Check the temperature on a separate thermometer and compare to the heater's setting. Look for cracks or mineral buildup on the glass. Confirm the indicator light cycles on and off normally.",
    light:     "Wipe the lens. Check the timer or controller settings. Note any dimming — LED lights degrade gradually over time.",
    pump:      "Check for debris on the intake. Rinse the impeller housing. Verify flow rate looks normal.",
    co2:       "Check bubble count against your target. Inspect the diffuser for buildup — soak in hydrogen peroxide if clogged. Verify solenoid is clicking on/off with your lights.",
    uv:        "Inspect the quartz sleeve for buildup. Replace the UV bulb annually even if it still lights up — output degrades before the light goes out.",
    other:     "Check the item visually, verify it is functioning correctly, and clean or adjust as needed."
  };
  return guides[item.type] || guides[item.typeId] || guides.other;
}

function _openEqMoreModal(t, item) {
  const serviceLabel = item.nextServiceType === "replace" ? "Replace" : "Inspect / service";
  const html = `
    <div class="modal-inner">
      <h2 class="modal-title">${escapeHTML(item.name)}</h2>
      <div class="modal-scroll-body">
        <p class="muted small" style="margin:0 0 12px">What would you like to do with this item?</p>
        <button class="btn block" id="eq-more-inspect" type="button">${escapeHTML(serviceLabel)}</button>
        <button class="btn block secondary" id="eq-more-note" type="button" style="margin-top:8px">📝 Add a note</button>
        <button class="btn block secondary" id="eq-more-archive" type="button" style="margin-top:8px">${item.isActive ? "📦 Archive" : "♻️ Restore"}</button>
        <button class="btn block" id="eq-more-delete" type="button" style="margin-top:8px;background:var(--koi,#e74c3c);color:#fff">🗑️ Delete</button>
      </div>
      <div class="modal-footer">
        <button class="btn secondary" id="eq-more-close" type="button">Close</button>
      </div>
    </div>`;

  openModal(html, () => {
    const closeBtn = document.getElementById("eq-more-close");
    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    const inspBtn = document.getElementById("eq-more-inspect");
    if (inspBtn) {
      inspBtn.addEventListener("click", () => {
        closeModal();
        const guideText = _getEqServiceGuide(item);
        const guideHtml = `
          <div class="modal-inner">
            <h2 class="modal-title">${escapeHTML(item.name)} — ${escapeHTML(serviceLabel)}</h2>
            <div class="modal-scroll-body">
              <p style="margin:0 0 12px;font-size:14px;line-height:1.55">${escapeHTML(guideText)}</p>
              <p class="muted small" style="margin:0 0 16px">Once you're done, tap below to log this service and reset the timer.</p>
            </div>
            <div class="modal-footer">
              <button class="btn" id="eq-inspect-done" type="button">Mark as serviced</button>
              <button class="btn secondary" id="eq-inspect-cancel" type="button" style="margin-top:8px">Cancel</button>
            </div>
          </div>`;
        openModal(guideHtml, () => {
          const doneBtn = document.getElementById("eq-inspect-done");
          const cancelBtn = document.getElementById("eq-inspect-cancel");
          if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
          if (doneBtn) {
            doneBtn.addEventListener("click", () => {
              EQ.markServiced(item.id);
              closeModal();
              view.tab = "equipment";
              render();
              toast("Serviced — timer reset.");
            });
          }
        });
      });
    }

    const noteBtn = document.getElementById("eq-more-note");
    if (noteBtn) noteBtn.addEventListener("click", () => {
      closeModal();
      openModal(`
        <div class="modal-inner">
        <h2 class="modal-title">Add a note</h2>
        <div class="modal-scroll-body">
        <textarea id="eq-note-text" class="field" rows="4" placeholder="What happened or what you noticed..." maxlength="400"></textarea>
        </div>
        <div class="modal-footer">
          <button class="btn secondary" id="eq-note-cancel">Cancel</button>
          <button class="btn" id="eq-note-save">Save note</button>
        </div>
        </div>`, () => {
          const saveNote = $("#eq-note-save");
          if (saveNote) saveNote.addEventListener("click", () => {
            const txt = ($("#eq-note-text")?.value || "").trim();
            if (!txt) { toast("Note is empty."); return; }
            EQ.addNote(item.id, txt);
            toast("Note saved");
            closeModal();
          });
          const nc = $("#eq-note-cancel");
          if (nc) nc.addEventListener("click", closeModal);
      });
    });

    const archBtn = document.getElementById("eq-more-archive");
    if (archBtn) archBtn.addEventListener("click", () => {
      if (item.isActive) {
        EQ.archiveItem(item.id);
        toast(`${item.name} archived`);
      } else {
        EQ.updateItem(item.id, { isActive: true });
        toast(`${item.name} restored`);
      }
      closeModal();
      render();
    });

    const delBtn = document.getElementById("eq-more-delete");
    if (delBtn) delBtn.addEventListener("click", () => {
      if (!confirm(`Delete "${item.name}" and all its history? This cannot be undone.`)) return;
      EQ.deleteItem(item.id);
      toast(`${item.name} deleted`);
      closeModal();
      render();
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
    <h3 style="margin:0 0 6px">Setting up a new tank?</h3>
    <p class="muted" style="margin:0 0 14px;font-size:13.5px;line-height:1.5">Guided setup gives you a step-by-step checklist based on your tank type — what to buy, what to do, and what to expect. Takes about 4–6 weeks from empty tank to fish-ready.</p>
    <div class="col" style="display:flex;flex-direction:column;gap:8px">
      <button class="btn block" id="ftp-yes">Yes, guide me through it</button>
      <button class="btn block secondary" id="ftp-no">No, I know what I'm doing</button>
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
  const kindOpts = `<option value="" disabled selected>Choose your tank type…</option>` + TANK_KINDS.map(k =>
    `<option value="${k.id}">${escapeHTML(k.label)}</option>`
  ).join("");
  openModal(`
    <div class="modal-inner">
      <h3 class="modal-title">Add a tank${guided ? ` <span class="pill" style="vertical-align:middle;font-size:11px;margin-left:6px">Guided</span>` : ""}</h3>
      <div class="modal-scroll-body">
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
        <details style="margin-top:8px">
          <summary style="cursor:pointer;font-size:13.5px;color:var(--ink-dim);user-select:none;list-style:none;display:flex;align-items:center;gap:6px"><span style="font-size:11px">&#9654;</span> More details (optional)</summary>
          <div style="margin-top:10px;display:flex;flex-direction:column;gap:10px">
            <label class="field">
              <span>Substrate</span>
              <select class="input" id="n-substrate">
                <option value="">Not sure yet</option>
                <option value="gravel">Gravel</option>
                <option value="sand">Sand</option>
                <option value="aqua soil">Aqua soil (planted tanks)</option>
                <option value="bare bottom">Bare bottom</option>
                <option value="mixed">Mixed (gravel + sand)</option>
              </select>
            </label>
            <label class="field"><span>D&#233;cor</span><input class="input" id="n-decor" placeholder="e.g. driftwood, rocks, fake plants" /></label>
            <label class="field"><span>Notes</span><textarea class="input" id="n-notes" rows="2" placeholder="Anything to remember about this tank..." style="resize:vertical"></textarea></label>
          </div>
        </details>
      </div>
      <div class="modal-footer">
        <button class="btn secondary" id="n-cancel">Cancel</button>
        <button class="btn" id="n-save">Create tank</button>
      </div>
    </div>
  `, () => {
    const kindSel = $("#n-kind");
    const desc = $("#n-kind-desc");
    const syncDesc = () => {
      if (!kindSel.value) { desc.textContent = ""; return; }
      const k = tankKindById(kindSel.value);
      desc.textContent = k ? k.desc : "";
    };
    syncDesc();
    kindSel.addEventListener("change", syncDesc);

    $("#n-save").addEventListener("click", () => {
      const name = $("#n-name").value.trim();
      if(!name){ alert("Name required"); return; }
      if(!kindSel.value){ alert("Please choose a tank type."); return; }
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
        substrate: ($("#n-substrate")?.value || "").trim(),
        decor: ($("#n-decor")?.value || "").trim(),
        notes: ($("#n-notes")?.value || "").trim(),
        fish: []
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
      if (guided){
        openEquipmentPromptModal(tank);
      } else {
        view = { screen:"tank", tankId: tank.id, tab:"details" };
        render();
      }
    });
    $("#n-cancel").addEventListener("click", closeModal);
  });
}

/* First Tank completion modal — slides up from the bottom, rich hero design */
function _showFirstTankCompletionModal(tank) {
  // Ensure we are on the tank screen (navigate there if not)
  if (!view || view.screen !== "tank" || view.tankId !== tank.id) {
    view = { screen: "tank", tankId: tank.id, tab: "details" };
    render();
  }
  const name = (tank && tank.name) ? tank.name : "your tank";
  openModal(`
    <div class="modal-completion">
      <div class="modal-completion-hero">
        <div class="modal-completion-icon"><svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="28" cy="28" r="28" fill="rgba(255,255,255,0.15)"/><path d="M18 28c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10S18 33.523 18 28z" fill="rgba(255,255,255,0.25)"/><path d="M22 28a6 6 0 1 1 12 0 6 6 0 0 1-12 0z" fill="white" fill-opacity="0.9"/><circle cx="31" cy="26" r="1.2" fill="rgba(0,0,0,0.35)"/></svg></div>
        <h2 class="modal-completion-headline">Your first habitat is ready.</h2>
        <p class="modal-completion-sub">You cycled ${escapeHTML(name)} from scratch. From here it&rsquo;s regular care &mdash; water changes, tests, and watching things grow.</p>
        <p class="modal-completion-brand">Tank Care.</p>
      </div>
      <div class="modal-completion-actions">
        <button class="btn block" id="ftc-go-tank">Go to my tank</button>
        <button class="btn block secondary" id="ftc-go-history">View guide history</button>
      </div>
    </div>
  `, () => {
    const goTank = document.getElementById("ftc-go-tank");
    if (goTank) goTank.addEventListener("click", () => {
      closeModal();
      view = { screen: "tank", tankId: tank.id, tab: "details" };
      render();
      // Scroll to top of tank content after render
      requestAnimationFrame(() => {
        const content = document.querySelector('.tank-content')
          || document.querySelector('.screen')
          || document.querySelector('main');
        if (content) content.scrollTop = 0;
        else window.scrollTo(0, 0);
      });
    });
    const goHistory = document.getElementById("ftc-go-history");
    if (goHistory) goHistory.addEventListener("click", () => {
      closeModal();
      view = { screen: "tank", tankId: tank.id, tab: "history" };
      render();
    });
  });
}

function openEquipmentPromptModal(tank){
  openModal(`
    <h3 style="margin:0 0 8px">Want to add your equipment?</h3>
    <p class="muted" style="margin:0 0 16px;font-size:13.5px;line-height:1.5">Adding your filter, heater, and any other gear now lets Tank Care Buddy track when things are due for service — and personalizes your setup checklist.</p>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button class="btn block" id="eq-yes">Add equipment</button>
      <button class="btn block secondary" id="eq-later">Add later</button>
    </div>
  `, () => {
    $("#eq-yes").addEventListener("click", () => {
      closeModal();
      view = { screen:"tank", tankId: tank.id, tab:"equipment" };
      render();
    });
    $("#eq-later").addEventListener("click", () => {
      closeModal();
      view = { screen:"tank", tankId: tank.id, tab:"details" };
      render();
    });
  });
}

/* ============================================================
   MODAL + TOAST
   ============================================================ */
function openModal(html, onMount){
  // Always close any existing modal before opening a new one — prevents backdrop stacking
  closeModal();
  const wrap = document.createElement("div");
  wrap.className = "modal-backdrop";
  wrap.innerHTML = `<div class="modal">${html}</div>`;
  wrap.addEventListener("click", e => { if(e.target === wrap) closeModal(); });
  document.body.appendChild(wrap);
  if(typeof onMount === "function") onMount();
}
function closeModal(){
  // Remove ALL backdrops in case any leaked through (defensive)
  $$("."+"modal-backdrop").forEach(m => m.remove());
}
function toast(msg){
  const el = document.createElement("div");
  el.textContent = msg;
  el.style.cssText = "position:fixed;left:50%;bottom:64px;transform:translateX(-50%);background:#0b1e2a;border:1px solid #234a66;color:#e9f5ff;padding:9px 14px;border-radius:999px;z-index:100;font-size:13px;box-shadow:0 6px 20px rgba(0,0,0,.4)";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

/* Action toast — shows a message with a tap/action button. Auto-dismisses after 8s.
   Phase 9: onAction fires BEFORE removal to avoid race with render(); added dismiss X. */
function actionToast(msg, actionLabel, onAction, duration) {
  duration = duration || 8000;
  // Remove any existing action toast (both old id and new id)
  const existing = document.getElementById('action-toast');
  if (existing) existing.remove();
  const existingOld = document.getElementById('ft-action-toast');
  if (existingOld) existingOld.remove();

  const el = document.createElement('div');
  el.id = 'action-toast';
  el.className = 'action-toast';
  el.innerHTML = `
    <span class="action-toast-msg">${escapeHTML(msg)}</span>
    <div class="action-toast-controls">
      ${actionLabel ? `<button class="action-toast-btn" type="button">${escapeHTML(actionLabel)}</button>` : ''}
      <button class="action-toast-dismiss" type="button" aria-label="Dismiss">✕</button>
    </div>`;
  document.body.appendChild(el);

  // Animate in
  requestAnimationFrame(() => el.classList.add('action-toast-show'));

  function dismissToast() {
    clearTimeout(tid);
    el.classList.remove('action-toast-show');
    setTimeout(() => el.remove(), 300);
  }

  if (actionLabel && typeof onAction === 'function') {
    const actionBtn = el.querySelector('.action-toast-btn');
    if (actionBtn) actionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Fire callback FIRST before removing, so render() triggered by callback doesn't race
      try { onAction(); } catch(err) { console.warn('actionToast callback error', err); }
      setTimeout(() => dismissToast(), 50);
    });
  }

  const dismissBtn = el.querySelector('.action-toast-dismiss');
  if (dismissBtn) dismissBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dismissToast();
  });

  const tid = setTimeout(() => dismissToast(), duration);
  el.dataset.tid = String(tid);
}
window.actionToast = actionToast;

/* Navigate to a tab within the current tank screen from firsttank.js.
   Phase 9: re-reads view at call time (not creation time) to avoid stale closure;
   scrolls tab content to top after render. */
function _ftNavigateToTab(tab) {
  // Always re-check view at call time
  if (!view || view.screen !== 'tank') return;
  view = { screen: 'tank', tankId: view.tankId, tab: tab };
  render();
  // After render, scroll to top of tank content
  const content = document.querySelector('.tank-content') || document.querySelector('#tank-body') || document.querySelector('.screen');
  if (content) content.scrollTop = 0;
}
window._ftNavigateToTab = _ftNavigateToTab;

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
  { const bs = $("#browse-species-btn"); if (bs) bs.addEventListener("click", () => {
    view = { screen:"species", tankId:null, tab:"details" };
    render();
  }); }
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
  const url = "https://jtsmith7234-rgb.github.io/tank-care-buddy/";
  const msg = `Hey — check out the aquarium app I'm beta testing. Track your tanks, water tests, dosing, and a guided cycle walkthrough for new tanks. Open in Safari then Share → Add to Home Screen.\n\n${url}`;

  const html = `
    <div style="max-width:520px">
      <h2 style="margin:0 0 8px">Share Tank Care Buddy</h2>
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
            title: "Tank Care Buddy beta",
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
        <button class="btn small secondary danger" id="do-wipe-all">Wipe all my data</button>
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
  const shortLabel = { "midnight-reef": "The Deep", "tropical-pop": "Tropical", "planted": "Planted", "clean": "Clean" };
  const themeBtns = Object.values(THEMES).map(t =>
    `<button class="seg-btn" data-theme-id="${t.id}" type="button">${escapeHTML(shortLabel[t.id] || t.label)}</button>`
  ).join("");

  const HELP_TOPICS = [
    {
      q: "Add a tank",
      where: "Home screen — tap the + button.",
      how: "Choose your tank kind, fill in the name and gallon size, then save. You can add fish, chemicals, and reminders any time after.",
      tip: "Start with just the basics. You can always edit tank details later from the Details tab.",
      action: { label: "Add a tank", id: "addtank" },
    },
    {
      q: "Water change reminders",
      where: "“Up next” at the top of each tank’s Details tab.",
      how: "When a reminder is due, tap “Go do it” to jump straight to the Water Care tab. Log your water change there and the reminder resets automatically.",
      tip: "Tap “Snooze 1 day” if you need a little more time. “Skip once” pushes it a full cycle without logging.",
    },
    {
      q: "Logging a water change",
      where: "Inside a tank, under the Water Care tab.",
      how: "Enter the gallons being changed, pick your chemicals, add any notes, then tap “Save to history.” The water-change reminder resets from that moment.",
      tip: "Dosing auto-calculates from the gallons you enter — you don’t have to do the math.",
    },
    {
      q: "Logging a water test",
      where: "Inside a tank, under the Water Care tab.",
      how: "Enter any readings you have (you don’t need all of them) and tap Save. The app color-codes each value — green is safe, red needs attention.",
      tip: "API Master Test Kit values. Leave any field blank if you didn’t test that parameter.",
    },
    {
      q: "Tracking equipment",
      where: "Inside a tank, under the Equipment tab.",
      how: "Tap + to add a filter, heater, light, or any other gear. The app calculates when each item is next due for service or replacement based on researched intervals. Tap an item to see its status or log a service.",
      tip: "Use the Inspect action to check your equipment and log it \u2014 keeps your service history tidy.",
    },
    {
      q: "History",
      where: "Inside a tank, under the History tab.",
      how: "Every water change, test, fish addition, and tank edit is logged here with a timestamp. Tap any entry to expand its full details.",
      tip: "Use the filter chips at the top to zero in on a specific type of event.",
    },
    {
      q: "Species Compatibility Browser",
      where: "Tap the fish icon at the top of any screen to open the browser from anywhere.",
      how: "Search any fish to see care stats — temperature, pH, tank size, and temperament. Inside a tank, go to the Fish tab and scroll to “Browse species & compatibility” to check fit and add directly to that tank.",
      tip: "Results are based on published care ranges. Always do a quick research pass before buying — especially for invertebrates and rarer species.",
      action: { label: "Species Compatibility Browser", id: "home-species" },
    },
  ];
  const helpRows = HELP_TOPICS.map((h, i) => {
    const action = h.action
      ? `<button class="help-action" data-help-action="${h.action.id}" type="button">${escapeHTML(h.action.label)} <span class="help-action-chev">›</span></button>`
      : "";
    return `
    <button class="help-item" data-help="${i}" type="button" aria-expanded="false" aria-controls="set-help-a-${i}">
      <span class="help-q">${escapeHTML(h.q)}</span>
      <span class="help-chev">›</span>
    </button>
    <div class="help-a" id="set-help-a-${i}" hidden>
      <dl class="help-guide">
        <dt>Where</dt><dd>${escapeHTML(h.where)}</dd>
        <dt>How</dt><dd>${escapeHTML(h.how)}</dd>
        <dt>Tip</dt><dd>${escapeHTML(h.tip)}</dd>
      </dl>
      ${action}
    </div>
  `;
  }).join("");

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
        <h4 class="settings-group-title">Help</h4>
        <p class="settings-note" style="margin-top:0">Quick guidance for the basics. Tap a topic to learn more.</p>
        <div class="help-list">${helpRows}</div>
        <button class="settings-action" id="settings-tutorial" type="button">
          <span class="settings-label">Replay tutorial</span><span class="settings-chev">›</span>
        </button>
        <p class="settings-note" style="margin-top:0">Reopens the guided walkthrough — handy for a quick refresher on the basics.</p>
      </section>

      <section class="settings-group">
        <h4 class="settings-group-title">Support</h4>
        <button class="settings-action" id="settings-bug" type="button">
          <span class="settings-label">Report a bug</span><span class="settings-chev">›</span>
        </button>
        <button class="settings-action" id="settings-feature" type="button">
          <span class="settings-label">Suggest a feature</span><span class="settings-chev">›</span>
        </button>
        <p class="settings-note">Feedback and bug reports help improve Tank Care Buddy. Email us at <a href="mailto:tankcarebuddy@outlook.com" style="color:var(--accent);">tankcarebuddy@outlook.com</a> — we read every message.</p>
      </section>

      <section class="settings-group">
        <h4 class="settings-group-title">App</h4>
        <button class="settings-action" id="settings-share" type="button">
          <span class="settings-label">Share Tank Care Buddy</span><span class="settings-chev">›</span>
        </button>
        <div class="settings-row">
          <span class="settings-label">Version</span>
          <span class="settings-value">${APP_VERSION}</span>
        </div>
        <div class="settings-row">
          <span class="settings-label">Owned by</span>
          <span class="settings-value">The Pop Umbrella</span>
        </div>
        <p class="settings-note">Tank Care Buddy — your simple aquarium companion.</p>
      </section>
      <div class="settings-brand-footer">
        <span class="settings-brand-name">Tank Care Buddy</span>
        <span class="settings-brand-tag">Care that shows.</span>
      </div>
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

    $$(".help-item").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = btn.dataset.help;
        const panel = $("#set-help-a-" + i);
        const willOpen = panel.hidden;
        $$(".help-item").forEach(other => {
          if (other === btn) return;
          const oi = other.dataset.help;
          const op = $("#set-help-a-" + oi);
          if (op) op.hidden = true;
          other.setAttribute("aria-expanded", "false");
          other.classList.remove("open");
        });
        panel.hidden = !willOpen;
        btn.setAttribute("aria-expanded", String(willOpen));
        btn.classList.toggle("open", willOpen);
      });
    });

    // Help jump actions — only navigate where the current app structure makes it safe.
    const goToTank = (tab) => {
      closeModal();
      if (tanks.length === 1) {
        view = { screen: "tank", tankId: tanks[0].id, tab };
      } else {
        view = { screen: "home", tankId: null, tab: "details" };
        if (tanks.length === 0) toast("Add a tank first, then open it to find this.");
      }
      render();
    };
    $$("[data-help-action]").forEach(b => {
      b.addEventListener("click", () => {
        switch (b.dataset.helpAction) {
          case "addtank":      closeModal(); handleAddTankTap(); break;
          case "home":         closeModal(); view = { screen:"home", tankId:null, tab:"details" }; render(); break;
          case "tank-details": goToTank("details"); break;
          case "tank-care":    goToTank("water-care"); break;
          case "tank-tests":   goToTank("water-care"); break;
          case "tank-history": goToTank("history"); break;
          case "tank-fish":    goToTank("fish"); break;
          case "home-species": closeModal(); view = { screen:"species", tankId:null, tab:"details" }; render(); break;
        }
      });
    });

    const tutBtn = $("#settings-tutorial");
    if (tutBtn) tutBtn.addEventListener("click", () => {
      closeModal();
      if (window.TUTORIAL) window.TUTORIAL.openTutorial({ markSeen: false, onFinish: handleAddTankTap });
    });

    const bugBtn = $("#settings-bug");
    if (bugBtn) bugBtn.addEventListener("click", () => {
      closeModal();
      openModal(`
        <div class="modal-inner">
          <h2 class="modal-title">Report a bug</h2>
          <div class="modal-scroll-body">
            <p style="font-size:14.5px;line-height:1.6;margin:0 0 14px">Found something broken? We want to know about it.</p>
            <p style="font-size:14px;line-height:1.55;margin:0 0 8px;color:var(--ink-dim)">Email us with:</p>
            <ul style="font-size:13.5px;line-height:1.8;margin:0 0 16px;padding-left:18px;color:var(--ink-dim)">
              <li>What you were doing</li>
              <li>What happened (vs. what you expected)</li>
              <li>Your device and iOS version</li>
            </ul>
            <a href="mailto:tankcarebuddy@outlook.com?subject=Bug Report" class="btn block" style="text-decoration:none;text-align:center;display:block">Open email app</a>
          </div>
          <div class="modal-footer">
            <button class="btn secondary" id="bug-modal-close" type="button">Close</button>
          </div>
        </div>
      `, () => {
        const c = document.getElementById("bug-modal-close");
        if (c) c.addEventListener("click", closeModal);
      });
    });

    const featBtn = $("#settings-feature");
    if (featBtn) featBtn.addEventListener("click", () => {
      closeModal();
      openModal(`
        <div class="modal-inner">
          <h2 class="modal-title">Suggest a feature</h2>
          <div class="modal-scroll-body">
            <p style="font-size:14.5px;line-height:1.6;margin:0 0 14px">Have an idea? We’d love to hear it.</p>
            <p style="font-size:14px;line-height:1.55;margin:0 0 8px;color:var(--ink-dim)">Tell us:</p>
            <ul style="font-size:13.5px;line-height:1.8;margin:0 0 16px;padding-left:18px;color:var(--ink-dim)">
              <li>What feature you’d want</li>
              <li>Why it would help your routine</li>
              <li>Anything similar you’ve seen in other apps</li>
            </ul>
            <a href="mailto:tankcarebuddy@outlook.com?subject=Feature Suggestion" class="btn block" style="text-decoration:none;text-align:center;display:block">Open email app</a>
          </div>
          <div class="modal-footer">
            <button class="btn secondary" id="feat-modal-close" type="button">Close</button>
          </div>
        </div>
      `, () => {
        const c = document.getElementById("feat-modal-close");
        if (c) c.addEventListener("click", closeModal);
      });
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
