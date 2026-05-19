/* ============================================================
   REMINDERS — Per-tank notification scheduling
   Web version: uses Notification API (iOS 16.4+ if added to home screen)
   Capacitor wrap: same code is auto-upgraded to native iOS notifications
   ============================================================
   Reminder types per tank:
     • water_change  — every N days (default = tank.idealDays || 7)
     • water_test    — every N days (default = 7)
     • daily         — once daily at user-picked time (off by default)
     • advisor_urgent — fires immediately when advisor detects "urgent"
   ============================================================ */

const REM_KEY = "tm.reminders.v1";

const DEFAULT_TANK_REMINDERS = {
  water_change: { enabled: true,  intervalDays: null /* falls back to tank.idealDays */ },
  water_test:   { enabled: true,  intervalDays: 7 },
  daily:        { enabled: false, hour: 9, minute: 0 },
  advisor_urgent: { enabled: true }
};

function loadReminders(){
  try { return JSON.parse(store.get(REM_KEY) || "{}"); }
  catch { return {}; }
}
function saveReminders(r){
  store.set(REM_KEY, JSON.stringify(r));
}

function getTankReminders(tankId){
  const all = loadReminders();
  const r = all[tankId] || {};
  // Merge defaults for any missing keys
  return {
    water_change: { ...DEFAULT_TANK_REMINDERS.water_change, ...(r.water_change||{}) },
    water_test:   { ...DEFAULT_TANK_REMINDERS.water_test,   ...(r.water_test||{}) },
    daily:        { ...DEFAULT_TANK_REMINDERS.daily,        ...(r.daily||{}) },
    advisor_urgent: { ...DEFAULT_TANK_REMINDERS.advisor_urgent, ...(r.advisor_urgent||{}) }
  };
}
function setTankReminders(tankId, rem){
  const all = loadReminders();
  all[tankId] = rem;
  saveReminders(all);
}

/* ------------------------------------------------------------
   PERMISSION
   ------------------------------------------------------------ */
function notifSupported(){
  return typeof Notification !== "undefined";
}
function notifPermission(){
  if (!notifSupported()) return "unsupported";
  return Notification.permission; // "default" | "granted" | "denied"
}
async function requestNotifPermission(){
  if (!notifSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied")  return "denied";
  try { return await Notification.requestPermission(); }
  catch { return "denied"; }
}

/* ------------------------------------------------------------
   FIRING NOTIFICATIONS
   We use setTimeout-based scheduling. On the web this only works
   while the page (or installed PWA) is open. When wrapped in
   Capacitor we'll swap this for @capacitor/local-notifications
   which does proper OS-level scheduling.
   ------------------------------------------------------------ */
const _scheduledTimers = {}; // key: "tankId:type" -> timeoutId

function _clearScheduled(){
  for (const k in _scheduledTimers){
    clearTimeout(_scheduledTimers[k]);
    delete _scheduledTimers[k];
  }
}

function _fireNotification(title, body, tankId){
  // Log to history regardless of whether OS notification fires
  if (typeof logEvent === "function" && tankId){
    logEvent(tankId, "reminder_fired", { title, body });
  }
  if (notifPermission() !== "granted") return;
  try {
    const n = new Notification(title, {
      body,
      icon: "icon-192.png",
      badge: "icon-192.png",
      tag: "mytanks-" + (tankId || "general"),
      requireInteraction: false
    });
    n.onclick = () => {
      window.focus();
      if (tankId && typeof view !== "undefined") {
        view.screen = "tank";
        view.tankId = tankId;
        view.tab = "details";
        if (typeof render === "function") render();
      }
      n.close();
    };
  } catch (e) {
    console.warn("notification failed", e);
  }
}

function _schedule(key, delayMs, fireFn){
  if (_scheduledTimers[key]) clearTimeout(_scheduledTimers[key]);
  // setTimeout max is ~24.8 days. Cap at 24 days, will reschedule on next visit
  const safeDelay = Math.min(Math.max(delayMs, 0), 1000*60*60*24*24);
  _scheduledTimers[key] = setTimeout(fireFn, safeDelay);
}

/* ------------------------------------------------------------
   SCHEDULING LOGIC
   Called from app on boot, on tank change, on event log, on tab switch.
   ------------------------------------------------------------ */
function scheduleAllReminders(){
  _clearScheduled();
  if (typeof tanks === "undefined" || !Array.isArray(tanks)) return;
  if (notifPermission() !== "granted") return; // no point scheduling
  const now = Date.now();
  tanks.forEach(t => {
    const rem = getTankReminders(t.id);
    // Water change
    if (rem.water_change.enabled){
      const interval = (rem.water_change.intervalDays || t.idealDays || 7) * 86400000;
      const last = _lastEventTs(t.id, "water_change");
      const due = last ? last + interval : now + interval;
      const delay = due - now;
      if (delay >= 0){
        _schedule(t.id + ":water_change", delay, () => {
          _fireNotification(
            "Water change due",
            `${t.name} is due for a water change`,
            t.id
          );
        });
      }
    }
    // Water test
    if (rem.water_test.enabled){
      const interval = (rem.water_test.intervalDays || 7) * 86400000;
      const last = _lastEventTs(t.id, "water_test");
      const due = last ? last + interval : now + interval;
      const delay = due - now;
      if (delay >= 0){
        _schedule(t.id + ":water_test", delay, () => {
          _fireNotification(
            "Test your water",
            `${t.name} hasn't been tested in a while`,
            t.id
          );
        });
      }
    }
    // Daily check-in
    if (rem.daily.enabled){
      const next = _nextDailyTs(rem.daily.hour, rem.daily.minute);
      _schedule(t.id + ":daily", next - now, () => {
        _fireNotification(
          "Tank check-in",
          `How are your fish today? Log a quick observation for ${t.name}`,
          t.id
        );
      });
    }
  });
}

function _lastEventTs(tankId, type){
  if (typeof events === "undefined") return 0;
  const list = events[tankId] || [];
  const last = list.find(e => e.type === type);
  return last ? last.ts : 0;
}
function _nextDailyTs(hour, minute){
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  return target.getTime();
}

/* ------------------------------------------------------------
   ADVISOR URGENT HOOK
   The advisor module already runs whenever a tank detail screen is rendered.
   This helper fires an immediate notification if the advisor flagged an urgent issue
   AND the user has opted in. Called explicitly from app.js after advisor compute.
   ------------------------------------------------------------ */
function fireUrgentAdvisorNotif(tank, adv){
  if (!adv || adv.sev !== "urgent") return;
  const rem = getTankReminders(tank.id);
  if (!rem.advisor_urgent.enabled) return;
  if (notifPermission() !== "granted") return;
  // Dedup: only fire once per signature per 24hrs
  const sig = adv.title + " | " + adv.rule;
  const key = "tm.urgentFired." + tank.id;
  let fired = {};
  try { fired = JSON.parse(store.get(key) || "{}"); } catch {}
  const last = fired[sig] || 0;
  if (Date.now() - last < 24*3600*1000) return;
  fired[sig] = Date.now();
  store.set(key, JSON.stringify(fired));
  _fireNotification("Urgent: " + adv.title, adv.body.slice(0, 140), tank.id);
}

// Expose
window.REMINDERS = {
  getTankReminders,
  setTankReminders,
  notifSupported,
  notifPermission,
  requestNotifPermission,
  scheduleAllReminders,
  fireUrgentAdvisorNotif,
  DEFAULT_TANK_REMINDERS
};
