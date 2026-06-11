/* ============================================================
   EQUIPMENT — Equipment & Maintenance Dashboard  v20260611i
   Per-tank equipment tracking with researched default intervals,
   auto-calculated next-due dates, and status logic.

   Storage keys:
     tm.equipment.v1   — array of equipment items (all tanks)
     tm.eqevents.v1    — array of equipment history events

   Public API:
     EQ.getItems(tankId)          → active items for tank, sorted
     EQ.getAllItems()             → all items
     EQ.addItem(item)             → save new item, returns id
     EQ.updateItem(id, patch)     → partial update
     EQ.archiveItem(id)           → set isActive=false
     EQ.deleteItem(id)            → hard delete
     EQ.markServiced(id, date?)   → rolls service date forward
     EQ.markReplaced(id, date?)   → rolls replacement date forward
     EQ.addNote(id, text)         → appends note to eq history
     EQ.getHistory(itemId)        → history events for one item
     EQ.itemStatus(item)          → { code, label, daysUntil, overdue }
     EQ.dueList(tankId, window)   → items due in "week"|"month"|"all"
     EQ.tankSummary(tankId)       → { dueThisWeek, dueThisMonth, overdue, expiringSoon }
     EQ.TYPES                     → equipment type catalog
   ============================================================ */

"use strict";

(function () {

const KEY_EQ  = "tm.equipment.v1";
const KEY_EQH = "tm.eqevents.v1";
const DAY     = 86_400_000;

/* ── Storage helpers ─────────────────────────────────────────── */
function _load(key) {
  try {
    const raw = (window.store ? window.store.get(key) : localStorage.getItem(key)) || "[]";
    return JSON.parse(raw) || [];
  } catch { return []; }
}
function _save(key, data) {
  const s = JSON.stringify(data);
  if (window.store) {
    window.store.set(key, s);
  } else {
    try { localStorage.setItem(key, s); } catch {}
  }
}
function _uid() { return Math.random().toString(36).slice(2, 9); }
function _today() { return new Date().toISOString().slice(0, 10); }
function _addDays(dateStr, days) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function _daysUntil(dateStr) {
  if (!dateStr) return null;
  const now  = new Date(); now.setHours(0, 0, 0, 0);
  const then = new Date(dateStr + "T00:00:00");
  return Math.round((then - now) / DAY);
}

/* ── Equipment type catalog ──────────────────────────────────── */
/*
 * Each type has:
 *   label           — display name
 *   icon            — emoji
 *   subtypes        — array of { id, label } or [] if not needed
 *   defaults(subtype) → {
 *       serviceIntervalDays, replacementIntervalDays,
 *       serviceLabel, replacementLabel,
 *       guidance, expiryBased
 *   }
 *
 * All intervals are researched starting points, not hard rules.
 * Sources:
 *   • Fluval / Seachem / AquaClear HOB manuals (30–60 day service guidance)
 *   • Eheim canister service guide (60–90 day recommendation)
 *   • Aquarium Co-Op sponge filter care (monthly rinse)
 *   • Lifegard / Green Killing Machine UV sterilizer care (quartz sleeve 6mo, bulb 9–12mo)
 *   • API / Seachem test kit shelf life (18–24 months, 30-day warning)
 *   • Seachem / ADA CO2 guidance (user-variable, default 90-day check)
 *   • Aqueon / Fluval heater guidance (quarterly inspection)
 *   • Current USA / Kessil LED guidance (90-day performance check)
 *   • Brightwell Aquatics / Easy Life carbon media (30–45 days)
 *   • Seachem Matrix biological media (rarely replaced; 90-day check)
 */
const TYPES = [
  {
    id: "filter",
    label: "Filter",
    icon: "🔬",
    subtypes: [
      { id: "sponge",   label: "Sponge" },
      { id: "hob",      label: "HOB (hang-on-back)" },
      { id: "canister", label: "Canister" },
      { id: "internal", label: "Internal" },
    ],
    defaults(sub) {
      const map = {
        sponge: {
          serviceIntervalDays: 30,
          serviceLabel: "Rinse / check",
          guidance: "Rinse the sponge in used tank water every month. Avoid tap water — it kills beneficial bacteria. Squeeze gently until water runs clearer.",
        },
        hob: {
          serviceIntervalDays: 45,
          serviceLabel: "Check / clean",
          guidance: "Check flow rate and clean the impeller every 4–6 weeks. Most HOB filters can run longer between full disassembly.",
        },
        canister: {
          serviceIntervalDays: 75,
          serviceLabel: "Service / clean",
          guidance: "Canister filters hold large media volume and often go 2–3 months between full cleans. Service sooner if flow visibly drops.",
        },
        internal: {
          serviceIntervalDays: 30,
          serviceLabel: "Clean / check",
          guidance: "Internal filters typically need a rinse every 3–4 weeks. Check the impeller for debris and rinse media in tank water.",
        },
      };
      return map[sub] || {
        serviceIntervalDays: 45,
        serviceLabel: "Service / check",
        guidance: "Service your filter regularly. Rinse media in used tank water, not tap water, to protect your beneficial bacteria.",
      };
    },
  },
  {
    id: "heater",
    label: "Heater",
    icon: "🌡️",
    subtypes: [],
    defaults() {
      return {
        serviceIntervalDays: 90,
        serviceLabel: "Inspect",
        guidance: "Inspect your heater quarterly for calcium buildup, cracked housing, or erratic temperature. Heaters rarely need scheduled replacement — replace when failing.",
      };
    },
  },
  {
    id: "light",
    label: "Light",
    icon: "💡",
    subtypes: [
      { id: "led",         label: "LED" },
      { id: "fluorescent", label: "Fluorescent / T5 / T8" },
    ],
    defaults(sub) {
      if (sub === "fluorescent") {
        return {
          serviceIntervalDays: 90,
          replacementIntervalDays: 270,
          serviceLabel: "Check output",
          replacementLabel: "Replace bulb",
          guidance: "Fluorescent bulbs lose PAR output before they visually appear dim. A 9-month replacement cycle is a solid default. Adjust based on your plants or corals.",
        };
      }
      return {
        serviceIntervalDays: 90,
        serviceLabel: "Check / wipe lenses",
        guidance: "LED fixtures are low-maintenance. A quarterly wipe of the lens and a check of fan vents or thermal fins keeps output strong. LEDs rarely need scheduled replacement in freshwater.",
      };
    },
  },
  {
    id: "uv_sterilizer",
    label: "UV Sterilizer",
    icon: "☀️",
    subtypes: [],
    defaults() {
      return {
        serviceIntervalDays: 180,
        replacementIntervalDays: 365,
        serviceLabel: "Clean quartz sleeve",
        replacementLabel: "Replace UV bulb",
        guidance: "Clean the quartz sleeve every 6 months — mineral buildup blocks UV output significantly. Replace the UV bulb annually; output degrades before the bulb burns out.",
      };
    },
  },
  {
    id: "test_kit",
    label: "Test Kit",
    icon: "🧪",
    subtypes: [
      { id: "liquid",  label: "Liquid reagent" },
      { id: "strips",  label: "Test strips" },
    ],
    defaults(sub) {
      return {
        expiryBased: true,
        guidance: sub === "strips"
          ? "Test strips expire faster than liquid kits once opened. Mark your open date and watch for the expiry date printed on the bottle. Expired strips give unreliable readings."
          : "Liquid test kits typically last 18–24 months unopened and 12–18 months after opening. Track the printed expiry date — reagents can read falsely safe when expired.",
      };
    },
  },
  {
    id: "co2",
    label: "CO2 System",
    icon: "💨",
    subtypes: [
      { id: "cylinder",  label: "Cylinder / pressurized" },
      { id: "diffuser",  label: "Diffuser / regulator" },
    ],
    defaults(sub) {
      if (sub === "diffuser") {
        return {
          serviceIntervalDays: 60,
          serviceLabel: "Clean diffuser",
          guidance: "CO2 diffusers accumulate algae and calcium deposits. A monthly or bi-monthly soak in bleach solution (then de-chlor rinse) restores full output.",
        };
      }
      return {
        serviceIntervalDays: 90,
        serviceLabel: "Check cylinder level",
        guidance: "Track your CO2 cylinder refill or swap date. Most setups vary widely by tank size and injection rate — set an interval that matches your actual usage.",
      };
    },
  },
  {
    id: "air_pump",
    label: "Air Pump",
    icon: "🫧",
    subtypes: [],
    defaults() {
      return {
        serviceIntervalDays: 90,
        serviceLabel: "Check / clean",
        guidance: "Check airline tubing for cracks and clean air stones quarterly. Replace air stones every 3–6 months when output visibly decreases.",
      };
    },
  },
  {
    id: "pump_powerhead",
    label: "Pump / Powerhead",
    icon: "⚙️",
    subtypes: [],
    defaults() {
      return {
        serviceIntervalDays: 60,
        serviceLabel: "Clean impeller",
        guidance: "Clean the impeller and impeller housing every 1–2 months. Calcium buildup and debris are the most common causes of reduced flow and premature failure.",
      };
    },
  },
  {
    id: "filter_media",
    label: "Filter Media",
    icon: "🧱",
    subtypes: [
      { id: "mechanical",  label: "Mechanical (floss / sponge)" },
      { id: "biological",  label: "Biological (ceramic / bio-balls)" },
      { id: "chemical",    label: "Chemical / activated carbon" },
      { id: "other_media", label: "Other media" },
    ],
    defaults(sub) {
      const map = {
        mechanical: {
          serviceIntervalDays: 30,
          replacementIntervalDays: 90,
          serviceLabel: "Rinse",
          replacementLabel: "Replace",
          guidance: "Mechanical media captures waste particles and clogs quickly. Rinse monthly in tank water; replace every 2–3 months or when rinse no longer restores flow.",
        },
        biological: {
          serviceIntervalDays: 90,
          serviceLabel: "Gentle rinse",
          guidance: "Biological media hosts your beneficial bacteria — handle carefully and never replace all at once. A gentle rinse in tank water every few months keeps it clear without disrupting your cycle. Replace only when physically degraded.",
        },
        chemical: {
          replacementIntervalDays: 30,
          replacementLabel: "Replace carbon",
          guidance: "Activated carbon exhausts in about 4 weeks and should be removed after its active period. Leaving spent carbon in the filter doesn't harm the tank but adds no benefit.",
        },
        other_media: {
          serviceIntervalDays: 60,
          serviceLabel: "Check / rinse",
          guidance: "Check and rinse your media based on the manufacturer's guidance for this specific type.",
        },
      };
      return map[sub] || {
        serviceIntervalDays: 60,
        serviceLabel: "Check / rinse",
        guidance: "Service your filter media regularly in used tank water to maintain flow and effectiveness.",
      };
    },
  },
  {
    id: "dosing",
    label: "Dosing / Additive",
    icon: "💊",
    subtypes: [],
    defaults() {
      return {
        serviceIntervalDays: 30,
        expiryBased: false,
        serviceLabel: "Check supply",
        guidance: "Track your fertilizer, supplement, or additive stock. A monthly reminder to check levels prevents running dry mid-cycle.",
      };
    },
  },
  {
    id: "other",
    label: "Other",
    icon: "📦",
    subtypes: [],
    defaults() {
      return {
        guidance: "Add your own service or replacement intervals for this item.",
      };
    },
  },
];

/* ── Status logic ────────────────────────────────────────────── */
/*
 * Status codes:
 *   ok              — everything on track
 *   due_week        — due within 7 days
 *   due_month       — due within 30 days
 *   overdue         — due date is in the past
 *   expiring_soon   — expiry within 30 days
 *   expired         — expiry in the past
 *   archived        — item inactive
 *   no_schedule     — reference item, no dates set
 */
function _nextDueDate(item) {
  // Returns the soonest upcoming action date for the item.
  // Considers service, replacement, and expiry.
  const candidates = [];
  if (item.nextServiceDate)     candidates.push({ date: item.nextServiceDate,     kind: "service" });
  if (item.nextReplacementDate) candidates.push({ date: item.nextReplacementDate, kind: "replace" });
  if (item.expiryDate)          candidates.push({ date: item.expiryDate,          kind: "expiry" });
  if (!candidates.length) return null;
  candidates.sort((a, b) => a.date.localeCompare(b.date));
  return candidates[0];
}

function itemStatus(item) {
  if (!item.isActive) return { code: "archived", label: "Archived", daysUntil: null, overdue: false };

  const soonest = _nextDueDate(item);
  if (!soonest) return { code: "no_schedule", label: "Reference only", daysUntil: null, overdue: false };

  const days = _daysUntil(soonest.date);
  if (days === null) return { code: "no_schedule", label: "Reference only", daysUntil: null, overdue: false };

  const isExpiry = soonest.kind === "expiry";

  if (days < 0) {
    return {
      code:     isExpiry ? "expired"  : "overdue",
      label:    isExpiry ? "Expired"  : "Overdue",
      daysUntil: days,
      overdue:  true,
      kind:     soonest.kind,
      date:     soonest.date,
    };
  }
  if (isExpiry && days <= 30) {
    return {
      code: "expiring_soon",
      label: days <= 7 ? "Expires this week" : "Expiring soon",
      daysUntil: days,
      overdue: false,
      kind: "expiry",
      date: soonest.date,
    };
  }
  if (days <= 7) {
    return {
      code: "due_week",
      label: "Due this week",
      daysUntil: days,
      overdue: false,
      kind: soonest.kind,
      date: soonest.date,
    };
  }
  if (days <= 30) {
    return {
      code: "due_month",
      label: "Due this month",
      daysUntil: days,
      overdue: false,
      kind: soonest.kind,
      date: soonest.date,
    };
  }
  return {
    code: "ok",
    label: "On track",
    daysUntil: days,
    overdue: false,
    kind: soonest.kind,
    date: soonest.date,
  };
}

/* ── Derived next-date calculation ───────────────────────────── */
function _computeNextDates(item) {
  // nextServiceDate: lastServiceDate + interval, or installDate + interval
  if (item.serviceIntervalDays) {
    const base = item.lastServiceDate || item.installDate || _today();
    item.nextServiceDate = _addDays(base, item.serviceIntervalDays);
  } else {
    item.nextServiceDate = null;
  }
  // nextReplacementDate: lastReplacementDate + interval, or installDate + interval
  if (item.replacementIntervalDays) {
    const base = item.lastReplacementDate || item.installDate || _today();
    item.nextReplacementDate = _addDays(base, item.replacementIntervalDays);
  } else {
    item.nextReplacementDate = null;
  }
  return item;
}

/* ── CRUD ────────────────────────────────────────────────────── */
function _loadItems() { return _load(KEY_EQ); }
function _saveItems(items) { _save(KEY_EQ, items); }
function _loadHistory() { return _load(KEY_EQH); }
function _saveHistory(hist) { _save(KEY_EQH, hist); }

function getItems(tankId) {
  return _loadItems()
    .filter(i => i.tankId === tankId && i.isActive !== false)
    .map(_computeNextDates)
    .sort((a, b) => {
      const sa = itemStatus(a);
      const sb = itemStatus(b);
      const rank = { overdue: 0, expired: 0, expiring_soon: 1, due_week: 2, due_month: 3, no_schedule: 4, ok: 5, archived: 6 };
      return (rank[sa.code] ?? 5) - (rank[sb.code] ?? 5);
    });
}

function getAllItems() {
  return _loadItems().map(_computeNextDates);
}

function getItem(id) {
  const item = _loadItems().find(i => i.id === id);
  return item ? _computeNextDates({ ...item }) : null;
}

function addItem(raw) {
  const items = _loadItems();
  const typeObj = TYPES.find(t => t.id === raw.type) || TYPES[TYPES.length - 1];
  const sub     = raw.subtype || null;
  const defs    = typeObj.defaults ? typeObj.defaults(sub) : {};

  const item = {
    id:                   _uid(),
    tankId:               raw.tankId,
    type:                 raw.type || "other",
    subtype:              sub,
    name:                 raw.name || typeObj.label,
    brand:                raw.brand || "",
    model:                raw.model || "",
    installDate:          raw.installDate || _today(),
    lastServiceDate:      raw.lastServiceDate || null,
    lastReplacementDate:  raw.lastReplacementDate || null,
    serviceIntervalDays:  raw.serviceIntervalDays != null ? Number(raw.serviceIntervalDays) : (defs.serviceIntervalDays || null),
    replacementIntervalDays: raw.replacementIntervalDays != null ? Number(raw.replacementIntervalDays) : (defs.replacementIntervalDays || null),
    expiryDate:           raw.expiryDate || null,
    nextServiceDate:      null,  // computed
    nextReplacementDate:  null,  // computed
    serviceLabel:         raw.serviceLabel || defs.serviceLabel || "Service",
    replacementLabel:     raw.replacementLabel || defs.replacementLabel || "Replace",
    expiryBased:          defs.expiryBased || false,
    guidance:             defs.guidance || "",
    notes:                raw.notes || "",
    manualLink:           raw.manualLink || "",
    productLink:          raw.productLink || "",
    isActive:             true,
    createdAt:            Date.now(),
  };
  _computeNextDates(item);
  items.push(item);
  _saveItems(items);
  _logHistory(item.id, "installed", { note: "Added" });
  return item.id;
}

function updateItem(id, patch) {
  const items = _loadItems();
  const idx = items.findIndex(i => i.id === id);
  if (idx < 0) return;
  // Coerce numeric fields
  if (patch.serviceIntervalDays != null)     patch.serviceIntervalDays     = Number(patch.serviceIntervalDays)     || null;
  if (patch.replacementIntervalDays != null) patch.replacementIntervalDays = Number(patch.replacementIntervalDays) || null;
  items[idx] = _computeNextDates({ ...items[idx], ...patch });
  _saveItems(items);
}

function archiveItem(id) {
  updateItem(id, { isActive: false });
  _logHistory(id, "archived", {});
}

function deleteItem(id) {
  const items = _loadItems().filter(i => i.id !== id);
  _saveItems(items);
  const hist = _loadHistory().filter(h => h.itemId !== id);
  _saveHistory(hist);
}

/* ── Actions ─────────────────────────────────────────────────── */
function markServiced(id, dateStr) {
  const item = getItem(id);
  if (!item) return;
  const date = dateStr || _today();
  updateItem(id, { lastServiceDate: date });
  _logHistory(id, "serviced", { date });
}

function markReplaced(id, dateStr) {
  const item = getItem(id);
  if (!item) return;
  const date = dateStr || _today();
  updateItem(id, { lastReplacementDate: date });
  _logHistory(id, "replaced", { date });
}

function addNote(id, text) {
  if (!text || !text.trim()) return;
  _logHistory(id, "note", { text: text.trim() });
}

/* ── History ─────────────────────────────────────────────────── */
function _logHistory(itemId, action, data) {
  const hist = _loadHistory();
  hist.push({ id: _uid(), itemId, action, ts: Date.now(), data: data || {} });
  _saveHistory(hist);
}

function getHistory(itemId) {
  return _loadHistory()
    .filter(h => h.itemId === itemId)
    .sort((a, b) => b.ts - a.ts);
}

/* ── Dashboard queries ───────────────────────────────────────── */
function dueList(tankId, window_) {
  // window_: "week" | "month" | "upcoming" | "all"
  const items = getItems(tankId);
  return items.filter(item => {
    const st = itemStatus(item);
    if (st.code === "archived")    return false;
    if (st.code === "no_schedule") return false;
    if (window_ === "week")     return st.overdue || st.daysUntil <= 7;
    if (window_ === "month")    return st.overdue || st.daysUntil <= 30;
    if (window_ === "upcoming") return !st.overdue;
    return true; // "all"
  });
}

function tankSummary(tankId) {
  const items = getItems(tankId);
  let dueThisWeek = 0, dueThisMonth = 0, overdue = 0, expiringSoon = 0;
  items.forEach(item => {
    const st = itemStatus(item);
    if (st.code === "overdue" || st.code === "expired") overdue++;
    else if (st.code === "due_week") dueThisWeek++;
    else if (st.code === "due_month") dueThisMonth++;
    else if (st.code === "expiring_soon") expiringSoon++;
  });
  return { dueThisWeek, dueThisMonth, overdue, expiringSoon, total: items.length };
}

/* ── Expose ──────────────────────────────────────────────────── */
window.EQ = {
  TYPES,
  getItems,
  getAllItems,
  getItem,
  addItem,
  updateItem,
  archiveItem,
  deleteItem,
  markServiced,
  markReplaced,
  addNote,
  getHistory,
  itemStatus,
  dueList,
  tankSummary,
  // helpers exposed for testing
  _computeNextDates,
  _daysUntil,
  _addDays,
};

})();
