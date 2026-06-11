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

const REM_KEY       = "tm.reminders.v1";
const REM_STATE_KEY = "tm.reminderState.v1";  // snooze/skip state per tank+type

const DEFAULT_TANK_REMINDERS = {
  water_change: { enabled: true,  intervalDays: null /* falls back to tank.idealDays */ },
  water_test:   { enabled: true,  intervalDays: 7 },
  daily:        { enabled: false, hour: 9, minute: 0 },
  advisor_urgent: { enabled: true }
};

/* Friendly labels — used by the in-app "Up next" list */
const REM_META = {
  water_change: { label: "Water change",  doneEvent: "water_change",  icon: "💧" },
  water_test:   { label: "Water test",    doneEvent: "water_test",    icon: "🧪" },
  daily:        { label: "Daily check-in", doneEvent: "daily_checkin", icon: "👀" }
};

function loadReminders(){
  try { return JSON.parse(store.get(REM_KEY) || "{}"); }
  catch { return {}; }
}
function saveReminders(r){
  store.set(REM_KEY, JSON.stringify(r));
}

/* Per-(tank,type) state: { snoozedUntil: ts, skippedCycle: ts } */
function loadRemState(){
  try { return JSON.parse(store.get(REM_STATE_KEY) || "{}"); }
  catch { return {}; }
}
function saveRemState(s){ store.set(REM_STATE_KEY, JSON.stringify(s)); }
function _stateKey(tankId, type){ return tankId + ":" + type; }
function getRemState(tankId, type){
  const s = loadRemState();
  return s[_stateKey(tankId, type)] || {};
}
function setRemState(tankId, type, patch){
  const s = loadRemState();
  const k = _stateKey(tankId, type);
  s[k] = { ...(s[k] || {}), ...patch };
  saveRemState(s);
}
function clearRemState(tankId, type){
  const s = loadRemState();
  delete s[_stateKey(tankId, type)];
  saveRemState(s);
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
      icon: "apple-touch-icon.png",
      badge: "apple-touch-icon.png",
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
    // Water change — honor snooze/skip
    if (rem.water_change.enabled){
      const interval = (rem.water_change.intervalDays || t.idealDays || 7) * 86400000;
      const last = _lastEventTs(t.id, "water_change");
      const state = getRemState(t.id, "water_change");
      let due = last ? last + interval : now + interval;
      if (state.skipUntil  && state.skipUntil  > due) due = state.skipUntil;
      if (state.snoozedUntil && state.snoozedUntil > now) due = state.snoozedUntil;
      const delay = due - now;
      if (delay >= 0){
        _schedule(t.id + ":water_change", delay, () => {
          _fireNotification(
            "Water change due",
            `${t.name} is ready for a water change—tap to log it.`,
            t.id
          );
        });
      }
    }
    // Water test — honor snooze/skip
    if (rem.water_test.enabled){
      const interval = (rem.water_test.intervalDays || 7) * 86400000;
      const last = _lastEventTs(t.id, "water_test");
      const state = getRemState(t.id, "water_test");
      let due = last ? last + interval : now + interval;
      if (state.skipUntil  && state.skipUntil  > due) due = state.skipUntil;
      if (state.snoozedUntil && state.snoozedUntil > now) due = state.snoozedUntil;
      const delay = due - now;
      if (delay >= 0){
        _schedule(t.id + ":water_test", delay, () => {
          _fireNotification(
            "Time for a quick water test",
            `${t.name} — a 5-minute test keeps your fish safe.`,
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
  // water_care events count as both water_change and water_test completions
  // (the app saves combined sessions as water_care, not the legacy split types)
  const last = list.find(e => {
    if (e.type === type) return true;
    if (type === "water_change" && e.type === "water_care" && e.data && e.data.gallons > 0) return true;
    if (type === "water_test"   && e.type === "water_care" && e.data &&
        (e.data.ph !== "" && e.data.ph != null ||
         e.data.ammonia !== "" && e.data.ammonia != null ||
         e.data.nitrite !== "" && e.data.nitrite != null ||
         e.data.nitrate !== "" && e.data.nitrate != null)) return true;
    return false;
  });
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

/* ------------------------------------------------------------
   IN-APP DUE LIST
   computeDueList(tank) returns one entry per enabled reminder,
   with status ("due-now" | "snoozed" | "upcoming") and nextDueTs.
   ------------------------------------------------------------ */
function _intervalDaysFor(type, rem, tank){
  if (type === "water_change") return rem.water_change.intervalDays || tank.idealDays || 7;
  if (type === "water_test")   return rem.water_test.intervalDays   || 7;
  return 7;
}
function computeDueList(tank){
  const rem = getTankReminders(tank.id);
  const now = Date.now();
  const items = [];
  ["water_change", "water_test"].forEach(type => {
    if (!rem[type] || !rem[type].enabled) return;
    const meta = REM_META[type];
    const intervalDays = _intervalDaysFor(type, rem, tank);
    const intervalMs = intervalDays * 86400000;
    const last = _lastEventTs(tank.id, meta.doneEvent);
    const state = getRemState(tank.id, type);
    let baseDue = last ? last + intervalMs : now;  // if never done, due now
    // skip-this-one: skip the current cycle, push to one full interval from "now"
    if (state.skipUntil && state.skipUntil > baseDue) baseDue = state.skipUntil;
    // snooze: defer the current notification only, until snoozedUntil
    const snoozedUntil = (state.snoozedUntil && state.snoozedUntil > now) ? state.snoozedUntil : null;
    let status, nextDueTs;
    if (snoozedUntil){
      status = "snoozed";
      nextDueTs = snoozedUntil;
    } else if (baseDue <= now){
      status = "due-now";
      nextDueTs = baseDue;
    } else {
      status = "upcoming";
      nextDueTs = baseDue;
    }
    items.push({
      type,
      label: meta.label,
      icon: meta.icon,
      intervalDays,
      lastDoneTs: last || null,
      nextDueTs,
      status,
      snoozedUntil
    });
  });
  // Daily check-in — appears when enabled and today's window hasn't been logged yet.
  if (rem.daily && rem.daily.enabled){
    const meta = REM_META.daily;
    const last = _lastEventTs(tank.id, meta.doneEvent);
    const state = getRemState(tank.id, "daily");
    const hour = (rem.daily.hour != null) ? rem.daily.hour : 9;
    const minute = (rem.daily.minute != null) ? rem.daily.minute : 0;
    // Today's scheduled time (local timezone)
    const todayTarget = new Date();
    todayTarget.setHours(hour, minute, 0, 0);
    const todayTargetTs = todayTarget.getTime();
    // Did we already log a check-in today (after local midnight)?
    const todayMidnight = new Date(); todayMidnight.setHours(0,0,0,0);
    const alreadyLoggedToday = last && last >= todayMidnight.getTime();
    const snoozedUntil = (state.snoozedUntil && state.snoozedUntil > now) ? state.snoozedUntil : null;
    let status, nextDueTs;
    if (alreadyLoggedToday){
      status = "upcoming";
      nextDueTs = _nextDailyTs(hour, minute);
    } else if (snoozedUntil){
      status = "snoozed";
      nextDueTs = snoozedUntil;
    } else if (now >= todayTargetTs){
      status = "due-now";
      nextDueTs = todayTargetTs;
    } else {
      status = "upcoming";
      nextDueTs = todayTargetTs;
    }
    items.push({
      type: "daily",
      label: meta.label,
      icon: meta.icon,
      intervalDays: 1,
      lastDoneTs: last || null,
      nextDueTs,
      status,
      snoozedUntil
    });
  }
  // Sort: due-now first, then snoozed (earliest), then upcoming (earliest)
  const sevRank = { "due-now": 0, "snoozed": 1, "upcoming": 2 };
  items.sort((a,b) => sevRank[a.status] - sevRank[b.status] || a.nextDueTs - b.nextDueTs);
  return items;
}

/* Actions used by the UI */
function markReminderDone(tank, type){
  const meta = REM_META[type];
  if (!meta) return;
  // Log the matching event so the cycle restarts
  if (typeof logEvent === "function"){
    logEvent(tank.id, meta.doneEvent, { source: "reminder" });
  }
  clearRemState(tank.id, type);
}
function snoozeReminder(tank, type, hours){
  setRemState(tank.id, type, { snoozedUntil: Date.now() + (hours||24)*3600000 });
}
function skipReminder(tank, type){
  // Push next due by one full interval from now
  const rem = getTankReminders(tank.id);
  const days = _intervalDaysFor(type, rem, tank);
  setRemState(tank.id, type, { skipUntil: Date.now() + days*86400000, snoozedUntil: null });
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
  DEFAULT_TANK_REMINDERS,
  REM_META,
  computeDueList,
  markReminderDone,
  snoozeReminder,
  skipReminder
};
