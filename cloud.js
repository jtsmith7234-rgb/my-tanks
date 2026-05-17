/* ============================================================
   CLOUD SYNC — Supabase REST backend
   Stores per-device data so iOS Safari storage purges don't lose anything.
   ============================================================ */

const SUPABASE_URL = "https://xcwgcchxxbxntifatbsq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjd2djY2h4eGJ4bnRpZmF0YnNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NzEyMjUsImV4cCI6MjA5NDU0NzIyNX0.piW-5k1vWnBOm6zytdQhG4s1LD9s2PX07g5fZs40HyQ";

const SB_HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": "Bearer " + SUPABASE_KEY,
  "Content-Type": "application/json"
};

/* ---------- Device ID ----------
   Persisted everywhere we can think of so iOS storage purges don't make a new
   device every visit:
   1. localStorage  (fastest, lost on tracking purge)
   2. sessionStorage  (alive while tab/PWA is open)
   3. cookie (Max-Age 10 years — survives some scenarios localStorage doesn't)
   4. URL hash (#d=<id> — last-resort, makes the URL itself carry the id)
   If none exist we generate a fresh UUID.
*/
const DEVICE_KEY = "tm.device.v1";
function _readCookie(name){
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}
function _writeCookie(name, value){
  // 10 years; Lax so it sticks on the PWA standalone session too
  const exp = new Date(Date.now() + 10*365*24*60*60*1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${exp}; path=/; SameSite=Lax`;
}
function _readHash(){
  const h = (location.hash || "").replace(/^#/, "");
  const params = new URLSearchParams(h);
  return params.get("d");
}
function _writeHash(id){
  try {
    const h = (location.hash || "").replace(/^#/, "");
    const params = new URLSearchParams(h);
    params.set("d", id);
    history.replaceState(null, "", "#" + params.toString());
  } catch(e){}
}
function uuid(){
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c=="x"?r:(r&0x3|0x8);
    return v.toString(16);
  });
}
function getDeviceId(){
  let id = null;
  try { id = localStorage.getItem(DEVICE_KEY); } catch(e){}
  if (!id) { try { id = sessionStorage.getItem(DEVICE_KEY); } catch(e){} }
  if (!id) id = _readCookie(DEVICE_KEY);
  if (!id) id = _readHash();
  if (!id) id = uuid();

  // Write it back to every store we can
  try { localStorage.setItem(DEVICE_KEY, id); } catch(e){}
  try { sessionStorage.setItem(DEVICE_KEY, id); } catch(e){}
  _writeCookie(DEVICE_KEY, id);
  _writeHash(id);
  return id;
}

const DEVICE_ID = getDeviceId();

/* ---------- REST helpers ---------- */
async function sbFetch(path, opts){
  opts = opts || {};
  const res = await fetch(SUPABASE_URL + "/rest/v1" + path, {
    method: opts.method || "GET",
    headers: Object.assign({}, SB_HEADERS, opts.headers || {}),
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  if (!res.ok){
    const txt = await res.text().catch(() => "");
    throw new Error(`Supabase ${res.status}: ${txt}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/* Make sure our device row exists once. */
async function ensureDevice(){
  try {
    await sbFetch("/devices", {
      method: "POST",
      headers: { "Prefer": "resolution=ignore-duplicates,return=minimal" },
      body: [{ device_id: DEVICE_ID }]
    });
  } catch(e){ console.warn("ensureDevice failed", e); }
}

/* Pull every stored key for this device. Returns { storage_key: value } */
async function cloudLoadAll(){
  const rows = await sbFetch(`/tank_store?device_id=eq.${encodeURIComponent(DEVICE_ID)}&select=storage_key,value`);
  const out = {};
  (rows || []).forEach(r => { out[r.storage_key] = r.value; });
  return out;
}

/* Upsert one key. value should already be a JS object/array (NOT JSON.stringify). */
async function cloudSave(key, value){
  await sbFetch("/tank_store", {
    method: "POST",
    headers: {
      "Prefer": "resolution=merge-duplicates,return=minimal",
      "on-conflict": "device_id,storage_key"
    },
    body: [{
      device_id: DEVICE_ID,
      storage_key: key,
      value: value,
      updated_at: new Date().toISOString()
    }]
  });
}

/* Debounced writes per-key so a flurry of saveTanks/saveEvents calls only hit
   the network once. */
const _pending = {};
const _timers = {};
function cloudSaveDebounced(key, valueJSON){
  // valueJSON is a JSON string (the app currently passes JSON strings into store.set)
  let value;
  try { value = JSON.parse(valueJSON); }
  catch(e){ value = valueJSON; }
  _pending[key] = value;
  if (_timers[key]) clearTimeout(_timers[key]);
  _timers[key] = setTimeout(async () => {
    const v = _pending[key];
    delete _pending[key];
    delete _timers[key];
    try {
      await cloudSave(key, v);
      _markSyncOk();
    } catch(e){
      console.warn("cloudSave failed", key, e);
      _markSyncErr(e);
    }
  }, 400);
}

/* ---------- Status indicator hooks (filled in by app.js after DOM ready) ---------- */
let _onSyncOk = null;
let _onSyncErr = null;
function setSyncHandlers(ok, err){ _onSyncOk = ok; _onSyncErr = err; }
function _markSyncOk(){ if (_onSyncOk) try { _onSyncOk(); } catch(e){} }
function _markSyncErr(e){ if (_onSyncErr) try { _onSyncErr(e); } catch(_){} }

/* Expose */
window.CLOUD = {
  DEVICE_ID,
  ensureDevice,
  loadAll: cloudLoadAll,
  save: cloudSave,
  saveDebounced: cloudSaveDebounced,
  setSyncHandlers
};
