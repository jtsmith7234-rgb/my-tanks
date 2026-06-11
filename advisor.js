/* ============================================================
   ADVISOR — Expert freshwater rules engine  v20260611g
   ── Phase 1: Core trend rules (multi-item, capped, noise-controlled)
   ── Phase 2: Smarter recommendations (interval, combined signals)
   ── Phase 3: Polished ranking, deduplication, wording consistency

   Public API (unchanged):
     ADVISOR.computeAdvice(tank)       → top advice object or null
     ADVISOR.computeAdviceList(tank)   → sorted array (up to MAX_ACTIVE)
     ADVISOR.logAdviceIfNew(tank, adv) → history dedup write
     ADVISOR.adviceTarget(adv)         → { tab, remType } | null

   Severity: "urgent" | "soon" | "fyi" | "ok"

   THRESHOLDS sourced from:
   • Aqueon — Freshwater water quality guide
     https://www.aqueon.com/articles/freshwater-aquarium-water-quality
   • AquariumScience.org — ammonia/nitrite ≤0.25 = undetectable
     https://aquariumscience.org/5-ammonia-nitrite-nitrate-and-chlorine/
   • Seachem Prime official — 1 mL per 10 US gal; safe at 5x for emergency detox
     https://seachem.zendesk.com/hc/en-us/articles/115000125454
   • Seachem Stability official — 5 mL/10 gal day 1; 5 mL/20 gal daily × 7 days
     https://seachem.zendesk.com/hc/en-us/articles/115000127873
   • Aquarium Co-Op — Easy Green target ~50 ppm nitrate in planted tanks
     https://www.aquariumcoop.com/products/easy-green
   • PetMD / Buce Plant — Betta: 76-81°F, pH 6.5-7.8, ammonia 0, nitrate <20 ppm
     https://www.petmd.com/fish/betta-fish-care-sheet
     https://buceplant.com/blogs/aquascaping-guides-and-tips/keeping-bettas-how-to-care-for-a-betta-fish
   ============================================================ */

"use strict";

(function () {

/* ── Constants ──────────────────────────────────────────────── */
const DAY        = 86_400_000;
const HOUR       = 3_600_000;
const MAX_ACTIVE = 3;          // hard cap: never show more than 3 items at once
const SEV_RANK   = { urgent: 4, soon: 3, fyi: 2, ok: 1 };

/* Cooldown: minimum ms between logging the same rule to history */
const COOLDOWN = {
  urgent : 12 * HOUR,   // urgent fires at most twice a day
  soon   : 24 * HOUR,   // soon fires at most once a day
  fyi    : 48 * HOUR,   // fyi fires at most every 2 days
};

/* ── Helpers ────────────────────────────────────────────────── */
function _daysAgo(ts) { return ts ? (Date.now() - ts) / DAY : null; }
function _numOr(v, d) { const n = parseFloat(v); return isNaN(n) ? d : n; }
function _hasVal(v)   { return v !== "" && v !== null && v !== undefined && !isNaN(parseFloat(v)); }

function _isBettaTank(tank) {
  return (tank.fish || []).some(f => /betta/i.test(f.species || f.name || ""));
}
function _tankAnimals(t) {
  return (t.fish || []).reduce((s, f) => s + (_numOr(f.count, 0) | 0), 0);
}

/* ── Event accessors ────────────────────────────────────────── */
function _evs(tankId) {
  return ((window.events && window.events[tankId]) || []);
}
function _real(tankId) {
  return _evs(tankId).filter(e => e.type !== "advisor");
}

/* Returns array of events that have at least one test reading, newest first */
function _testEvents(tankId) {
  return _real(tankId).filter(e =>
    (e.type === "water_test" || e.type === "water_care") &&
    e.data &&
    (_hasVal(e.data.ph) || _hasVal(e.data.ammonia) ||
     _hasVal(e.data.nitrite) || _hasVal(e.data.nitrate) ||
     _hasVal(e.data.temp_f) || _hasVal(e.data.temp))
  );
}

/* Returns array of events that have a gallons value, newest first */
function _changeEvents(tankId) {
  return _real(tankId).filter(e =>
    (e.type === "water_change" || e.type === "water_care") &&
    e.data && _numOr(e.data.gallons, 0) > 0
  );
}

/* Pull a numeric reading from a test event, supporting both old (temp_f) and new (temp) key */
function _testVal(ev, field) {
  if (!ev || !ev.data) return NaN;
  const d = ev.data;
  if (field === "temp") return _numOr(d.temp_f != null ? d.temp_f : d.temp, NaN);
  return _numOr(d[field], NaN);
}

/* Ideal water-change interval in days based on stocking density + last nitrate */
function _idealInterval(tank, lastTest) {
  const animals = _tankAnimals(tank);
  const gallons = _numOr(tank.gallons, 10);
  const density = gallons > 0 ? animals / gallons : 0;
  let base = 9;
  if (density > 0.6) base = 7;
  if (density > 1.0) base = 5;
  if (lastTest) {
    const no3 = _testVal(lastTest, "nitrate");
    if (!isNaN(no3)) {
      if (no3 > 40) base = Math.min(base, 4);
      else if (no3 > 20) base = Math.min(base, 7);
    }
  }
  return base;
}

/* ── Trend helpers ──────────────────────────────────────────── */

/*
 * Returns { rising, falling, stable, delta, first, last, count }
 * for a numeric field across up to N most-recent test events.
 * Requires at least `minCount` data points to be meaningful.
 * Rising/falling = last reading vs first, with a minimum delta threshold.
 */
function _trend(tankId, field, { n = 5, minCount = 3, minDelta = 0 } = {}) {
  const tests = _testEvents(tankId).slice(0, n);
  const vals  = tests.map(e => _testVal(e, field)).filter(v => !isNaN(v));
  if (vals.length < minCount) return null;
  const last  = vals[0];  // newest
  const first = vals[vals.length - 1]; // oldest in window
  const delta = last - first;
  return {
    rising : delta >  minDelta,
    falling: delta < -minDelta,
    stable : Math.abs(delta) <= minDelta,
    delta,
    first,
    last,
    count : vals.length,
    vals,        // newest → oldest
  };
}

/*
 * Returns true if the parameter was recently elevated above `threshold`
 * but the CURRENT reading is now at or below threshold.
 * Useful for "tank recovered but had a spike" insights.
 */
function _hadRecentElevation(tankId, field, { threshold = 0, lookback = 5 } = {}) {
  const tests = _testEvents(tankId).slice(0, lookback);
  if (tests.length < 2) return false;
  const latest = _testVal(tests[0], field);
  // Current must be safe (at or below threshold)
  if (isNaN(latest) || latest > threshold) return false;
  // At least one of the previous N-1 tests must have been above threshold
  const previous = tests.slice(1).map(e => _testVal(e, field)).filter(v => !isNaN(v));
  return previous.length >= 1 && previous.some(v => v > threshold);
}

/* ── Rule definitions ───────────────────────────────────────── */
/*
 * Each rule is an object:
 *   id        — unique string identifier (used for suppression key)
 *   evaluate  — function(tank) → advice object or null
 *
 * Advice object:
 *   sev     — "urgent" | "soon" | "fyi"
 *   ruleId  — matches rule.id
 *   title   — concise (<50 chars)
 *   body    — 1-3 sentences, plain English
 *   rule    — machine-readable trigger summary (for history/dedup)
 *   type    — "reading" | "trend" | "cadence" | "recommendation" | "stocking"
 *   tag     — UI label: "Risk" | "Insight" | "Reminder" | "Tip"
 */

const RULES = [];

/* ── BLOCK A: Current readings ───────────────────────────────── */

RULES.push({
  id: "ammonia_current",
  evaluate(tank) {
    const t0 = _testEvents(tank.id)[0];
    if (!t0) return null;
    const amm = _testVal(t0, "ammonia");
    if (isNaN(amm) || amm <= 0) return null;
    const sev = amm >= 0.25 ? "urgent" : "soon";
    return {
      sev,
      ruleId: "ammonia_current",
      tag: "Risk",
      title: amm >= 0.25 ? "Ammonia is unsafe" : "Trace ammonia detected",
      body: amm >= 0.25
        ? `Last test: ammonia ${amm} ppm. At this level, fish gills are being irritated. Do a 50% water change today and dose Prime — it detoxifies ammonia for 24–48 h while your filter catches up.`
        : `Last test shows ${amm} ppm ammonia — low, but worth watching. A small water change and a dose of Prime will clear it. Test again in 2–3 days.`,
      rule: `ammonia=${amm}`,
      type: "reading",
    };
  }
});

RULES.push({
  id: "nitrite_current",
  evaluate(tank) {
    const t0 = _testEvents(tank.id)[0];
    if (!t0) return null;
    const nit = _testVal(t0, "nitrite");
    if (isNaN(nit) || nit <= 0) return null;
    const sev = nit >= 0.25 ? "urgent" : "soon";
    return {
      sev,
      ruleId: "nitrite_current",
      tag: "Risk",
      title: nit >= 0.25 ? "Nitrite is unsafe" : "Trace nitrite detected",
      body: nit >= 0.25
        ? `Nitrite at ${nit} ppm. Your bacterial colony hasn't fully caught up yet. Do a 30–50% water change, dose Prime, and add Stability daily for 7 days. Don't add fish until ammonia and nitrite both read 0 on two consecutive tests.`
        : `Nitrite at ${nit} ppm — still low, but it means your cycle isn't fully stable. Add Stability daily for a week and test again soon.`,
      rule: `nitrite=${nit}`,
      type: "reading",
    };
  }
});

RULES.push({
  id: "nitrate_current",
  evaluate(tank) {
    const t0 = _testEvents(tank.id)[0];
    if (!t0) return null;
    const no3 = _testVal(t0, "nitrate");
    if (isNaN(no3)) return null;
    const isBetta = _isBettaTank(tank);
    if (no3 > 50) {
      return {
        sev: "urgent", ruleId: "nitrate_current", tag: "Risk",
        title: "Nitrate is very high",
        body: `Last reading: ${no3} ppm. Above 50 ppm stresses most fish and degrades water quality fast. Do a 40–50% water change today, then a smaller 25% change in 2–3 days to bring it down gradually.`,
        rule: `nitrate=${no3}`, type: "reading",
      };
    }
    if (no3 > 40) {
      return {
        sev: "urgent", ruleId: "nitrate_current", tag: "Risk",
        title: "Nitrate is high",
        body: `Last reading: ${no3} ppm. Above 40 ppm puts stress on most community fish. A 40–50% water change this week will bring it back into range.`,
        rule: `nitrate=${no3}`, type: "reading",
      };
    }
    if (isBetta && no3 > 20) {
      return {
        sev: "soon", ruleId: "nitrate_current", tag: "Risk",
        title: "Nitrate above betta target",
        body: `Last reading: ${no3} ppm. Bettas do best under 20 ppm. A 25–30% water change in the next day or two will bring it back to the target range.`,
        rule: `nitrate=${no3} (betta)`, type: "reading",
      };
    }
    if (no3 > 20) {
      return {
        sev: "soon", ruleId: "nitrate_current", tag: "Risk",
        title: "Nitrate is climbing",
        body: `Last reading: ${no3} ppm. Long term above 20 ppm stresses sensitive species. A 25–30% change in the next day or two brings it back down.`,
        rule: `nitrate=${no3}`, type: "reading",
      };
    }
    return null;
  }
});

RULES.push({
  id: "ph_current",
  evaluate(tank) {
    const t0 = _testEvents(tank.id)[0];
    if (!t0) return null;
    const ph = _testVal(t0, "ph");
    if (isNaN(ph)) return null;
    if (ph < 6.0 || ph > 8.4) {
      return {
        sev: "urgent", ruleId: "ph_current", tag: "Risk",
        title: "pH is out of safe range",
        body: `pH read ${ph}. Most freshwater fish do best between 6.8–7.8. Don't correct it fast — change pH no more than 0.2 per day to avoid shock. Check whether your substrate, driftwood, or tap water is the cause.`,
        rule: `ph=${ph}`, type: "reading",
      };
    }
    if (ph < 6.5 || ph > 7.8) {
      return {
        sev: "fyi", ruleId: "ph_current", tag: "Insight",
        title: "pH is slightly outside the sweet spot",
        body: `pH read ${ph}. Still safe for most community fish, but the ideal range for tetras, rasboras, and bettas is 6.8–7.4. Stability matters more than the exact number.`,
        rule: `ph=${ph}`, type: "reading",
      };
    }
    return null;
  }
});

RULES.push({
  id: "temp_current",
  evaluate(tank) {
    const t0 = _testEvents(tank.id)[0];
    if (!t0) return null;
    const temp = _testVal(t0, "temp");
    if (isNaN(temp)) return null;
    const isBetta = _isBettaTank(tank);
    const lo = isBetta ? 76 : 72;
    const hi = isBetta ? 82 : 82;
    const targetRange = isBetta ? "76–81°F" : "75–80°F";
    if (temp < lo - 4 || temp > hi + 4) {
      return {
        sev: "urgent", ruleId: "temp_current", tag: "Risk",
        title: "Water temperature is unsafe",
        body: `Last reading: ${temp}°F. ${isBetta ? "Bettas need 76–81°F." : "Most tropical fish do best at 75–80°F."} Check your heater — a stuck or undersized unit is usually the cause. Aim for 3–5 watts per gallon.`,
        rule: `temp=${temp}°F`, type: "reading",
      };
    }
    if (temp < lo || temp > hi) {
      return {
        sev: "soon", ruleId: "temp_current", tag: "Risk",
        title: "Temperature is off target",
        body: `Tank is at ${temp}°F. Target: ${targetRange}. Avoid changing temperature faster than 2°F per hour — sudden swings stress fish more than a steady drift.`,
        rule: `temp=${temp}°F`, type: "reading",
      };
    }
    return null;
  }
});

/* ── BLOCK B: Trend rules (Phase 1) ─────────────────────────── */

/*
 * Nitrate rising across last 3+ tests by at least 8 ppm total
 * Only fires if current reading is still below the "urgent" threshold
 * (otherwise nitrate_current already covers it).
 */
RULES.push({
  id: "nitrate_trend_rising",
  evaluate(tank) {
    const t0 = _testEvents(tank.id)[0];
    const currentNo3 = t0 ? _testVal(t0, "nitrate") : NaN;
    // Skip if we already have a current nitrate alert (less noisy)
    if (!isNaN(currentNo3) && currentNo3 > 20) return null;
    const tr = _trend(tank.id, "nitrate", { n: 5, minCount: 3, minDelta: 8 });
    if (!tr || !tr.rising) return null;
    return {
      sev: "fyi", ruleId: "nitrate_trend_rising", tag: "Insight",
      title: "Nitrate is trending up",
      body: `Over your last ${tr.count} tests, nitrate climbed from ${tr.first} → ${tr.last} ppm. Not urgent yet, but a slightly larger or more frequent water change will keep it in check before it becomes a problem.`,
      rule: `nitrate_trend ${tr.first}→${tr.last} (${tr.count} tests)`,
      type: "trend",
    };
  }
});

/*
 * Nitrite was recently elevated but is now back to zero — 'watch it' signal.
 * Fires only when current reading is safe. nitrite_current handles it when currently elevated.
 */
RULES.push({
  id: "nitrite_reappeared",
  evaluate(tank) {
    if (!_hadRecentElevation(tank.id, "nitrite", { threshold: 0, lookback: 6 })) return null;
    return {
      sev: "fyi", ruleId: "nitrite_reappeared", tag: "Insight",
      title: "Nitrite spiked recently",
      body: `Nitrite showed up in a recent test after previously reading zero. It's back to zero now, but this can follow a filter disruption, medication, or a deep clean. Keep testing over the next week.`,
      rule: "nitrite_reappeared",
      type: "trend",
    };
  }
});

/*
 * Ammonia was recently elevated but is now back to zero — 'watch it' signal.
 */
RULES.push({
  id: "ammonia_reappeared",
  evaluate(tank) {
    if (!_hadRecentElevation(tank.id, "ammonia", { threshold: 0, lookback: 6 })) return null;
    return {
      sev: "fyi", ruleId: "ammonia_reappeared", tag: "Insight",
      title: "Ammonia spiked recently",
      body: `Ammonia showed up in a recent test after reading zero. It's back to zero now, but the cause is worth understanding — common triggers are overfeeding, a fish death, or a filter disruption. Test again in 3–4 days to confirm it's stable.`,
      rule: "ammonia_reappeared",
      type: "trend",
    };
  }
});

/*
 * pH drifting consistently — requires 3+ tests and a 0.4 unit drift,
 * and only fires if current pH is still in a safe range
 * (ph_current already handles out-of-range cases)
 */
RULES.push({
  id: "ph_drift_trend",
  evaluate(tank) {
    const t0 = _testEvents(tank.id)[0];
    const ph0 = t0 ? _testVal(t0, "ph") : NaN;
    // ph_current handles the flagging when it's out of range
    if (!isNaN(ph0) && (ph0 < 6.5 || ph0 > 7.8)) return null;
    const tr = _trend(tank.id, "ph", { n: 5, minCount: 3, minDelta: 0.4 });
    if (!tr) return null;
    if (!tr.rising && !tr.falling) return null;
    const dir = tr.rising ? "rising" : "falling";
    return {
      sev: "fyi", ruleId: "ph_drift_trend", tag: "Insight",
      title: "pH is drifting consistently",
      body: `pH has been ${dir} across your last ${tr.count} tests (${tr.first.toFixed(1)} → ${tr.last.toFixed(1)}). The water is still in a safe range, but a consistent drift can signal a buffering issue or CO₂ change. Worth keeping an eye on.`,
      rule: `ph_drift ${dir} ${tr.first}→${tr.last}`,
      type: "trend",
    };
  }
});

/*
 * Temperature unstable — fluctuating more than 3°F between recent tests
 * (not just a single outlier — requires at least 3 tests)
 */
RULES.push({
  id: "temp_unstable",
  evaluate(tank) {
    const tests = _testEvents(tank.id).slice(0, 5);
    const vals = tests.map(e => _testVal(e, "temp")).filter(v => !isNaN(v));
    if (vals.length < 3) return null;
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    const spread = max - min;
    // Only flag meaningful spread; ignore if already flagged by temp_current
    const t0 = tests[0];
    const curTemp = t0 ? _testVal(t0, "temp") : NaN;
    const isBetta = _isBettaTank(tank);
    const lo = isBetta ? 76 : 72;
    const hi = isBetta ? 82 : 82;
    if (!isNaN(curTemp) && (curTemp < lo || curTemp > hi)) return null;
    if (spread < 3) return null;
    return {
      sev: "fyi", ruleId: "temp_unstable", tag: "Insight",
      title: "Temperature has been fluctuating",
      body: `Your last ${vals.length} readings ranged from ${min}°F to ${max}°F — a ${spread.toFixed(1)}°F swing. Frequent swings stress fish more than a steady slightly-off reading. Check your heater for consistent output.`,
      rule: `temp_spread=${spread.toFixed(1)}°F (${min}–${max})`,
      type: "trend",
    };
  }
});

/* ── BLOCK C: Cadence / maintenance ─────────────────────────── */

RULES.push({
  id: "water_change_cadence",
  evaluate(tank) {
    const changes = _changeEvents(tank.id);
    const real    = _real(tank.id);
    if (!changes.length && !real.length) return null;
    // If there's activity but no changes — gentle prompt
    if (!changes.length) {
      return {
        sev: "soon", ruleId: "water_change_cadence", tag: "Reminder",
        title: "No water changes logged yet",
        body: `Once you log your first water change on the Water Care tab, future timing recommendations will be tuned to your tank's specific schedule.`,
        rule: "no_water_changes",
        type: "cadence",
      };
    }
    const last   = changes[0];
    const days   = _daysAgo(last.ts);
    const tests  = _testEvents(tank.id);
    const ideal  = _idealInterval(tank, tests[0] || null);
    const overdue = days - ideal;
    if (overdue >= 5) {
      return {
        sev: "urgent", ruleId: "water_change_cadence", tag: "Reminder",
        title: "Water change is overdue",
        body: `It's been ${Math.round(days)} days since your last water change. For this tank, the target is every ~${ideal} days. Plan a 30–40% change today or tomorrow.`,
        rule: `wc_days=${Math.round(days)},ideal=${ideal}`,
        type: "cadence",
      };
    }
    if (overdue >= 0) {
      return {
        sev: "soon", ruleId: "water_change_cadence", tag: "Reminder",
        title: "Water change due",
        body: `${Math.round(days)} days since your last change — right on schedule. A 25–30% change in the next day or two keeps nitrate steady.`,
        rule: `wc_days=${Math.round(days)},ideal=${ideal}`,
        type: "cadence",
      };
    }
    if (overdue >= -2) {
      return {
        sev: "fyi", ruleId: "water_change_cadence", tag: "Reminder",
        title: "Water change coming up",
        body: `${Math.round(days)} days since your last change — you're on track. Plan one in ~${Math.round(ideal - days)} day(s).`,
        rule: `wc_days=${Math.round(days)},ideal=${ideal}`,
        type: "cadence",
      };
    }
    return null;
  }
});

RULES.push({
  id: "test_staleness",
  evaluate(tank) {
    const tests = _testEvents(tank.id);
    if (!tests.length) {
      const real = _real(tank.id);
      if (real.length < 1) return null;
      return {
        sev: "fyi", ruleId: "test_staleness", tag: "Reminder",
        title: "No water tests logged yet",
        body: `Log your first test (pH, ammonia, nitrite, nitrate) and the Advisor can give you specific, data-based feedback.`,
        rule: "no_tests",
        type: "cadence",
      };
    }
    const days = _daysAgo(tests[0].ts);
    if (days >= 21) {
      return {
        sev: "fyi", ruleId: "test_staleness", tag: "Reminder",
        title: "Water test is overdue",
        body: `Last test was ${Math.round(days)} days ago. Conditions drift between tests — a fresh reading helps catch problems early.`,
        rule: `last_test=${Math.round(days)}d`,
        type: "cadence",
      };
    }
    return null;
  }
});

/* ── BLOCK D: Stocking ───────────────────────────────────────── */

RULES.push({
  id: "stocking_density",
  evaluate(tank) {
    const animals = _tankAnimals(tank);
    const gallons = _numOr(tank.gallons, 0);
    if (gallons <= 0 || animals <= 0) return null;
    const ratio = animals / gallons;
    if (ratio > 1.3) {
      return {
        sev: "soon", ruleId: "stocking_density", tag: "Risk",
        title: "Tank is heavily stocked",
        body: `${animals} animals in ${gallons} gal (${ratio.toFixed(2)}/gal) is above community-tank guidance. Keep filtration strong, test weekly, and hold off on adding more livestock until nitrate stays under 20 ppm between changes.`,
        rule: `density=${ratio.toFixed(2)}`,
        type: "stocking",
      };
    }
    return null;
  }
});

/* ── BLOCK E: Recurring urgent pattern (Phase 1 addition) ───── */

/*
 * If a tank has had 2+ urgent advisor events in the last 30 days
 * AND current state is ok, surface a pattern insight.
 */
RULES.push({
  id: "recurring_urgent",
  evaluate(tank) {
    // Only fires when current readings are safe
    const t0 = _testEvents(tank.id)[0];
    if (t0) {
      const amm = _testVal(t0, "ammonia");
      const nit = _testVal(t0, "nitrite");
      const no3 = _testVal(t0, "nitrate");
      if ((!isNaN(amm) && amm > 0) || (!isNaN(nit) && nit > 0) || (!isNaN(no3) && no3 > 40)) return null;
    }
    const cutoff = Date.now() - 30 * DAY;
    const urgentHistory = _evs(tank.id).filter(e =>
      e.type === "advisor" &&
      e.ts >= cutoff &&
      e.data && e.data.sev === "urgent"
    );
    if (urgentHistory.length < 2) return null;
    return {
      sev: "fyi", ruleId: "recurring_urgent", tag: "Insight",
      title: "This tank has had repeated issues",
      body: `There have been ${urgentHistory.length} urgent alerts in the last 30 days. The tank looks fine now, but the pattern suggests maintenance timing or stocking level may need a closer look.`,
      rule: `recurring_urgent=${urgentHistory.length}`,
      type: "trend",
    };
  }
});

/* ── BLOCK F: Smarter recommendations (Phase 2) ─────────────── */

/*
 * Suggest shortening water-change interval when nitrate has been
 * elevated (>20 ppm) on 2+ of the last 3 tests AND current schedule
 * is already at the default or slower.
 */
RULES.push({
  id: "rec_shorten_wc_interval",
  evaluate(tank) {
    const tests = _testEvents(tank.id).slice(0, 3);
    const no3Vals = tests.map(e => _testVal(e, "nitrate")).filter(v => !isNaN(v));
    if (no3Vals.length < 2) return null;
    const highCount = no3Vals.filter(v => v > 20).length;
    if (highCount < 2) return null;
    const changes = _changeEvents(tank.id);
    if (changes.length < 2) return null;
    // Compute average interval between last 3 changes
    const intervals = [];
    for (let i = 0; i < Math.min(changes.length - 1, 3); i++) {
      intervals.push((changes[i].ts - changes[i + 1].ts) / DAY);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const ideal = _idealInterval(tank, tests[0] || null);
    // Only suggest if actual interval is noticeably longer than ideal
    if (avgInterval <= ideal + 1) return null;
    // Don't pile this on top of an active nitrate_current alert
    const t0 = tests[0];
    const curNo3 = t0 ? _testVal(t0, "nitrate") : NaN;
    if (!isNaN(curNo3) && curNo3 > 20) return null;
    return {
      sev: "fyi", ruleId: "rec_shorten_wc_interval", tag: "Tip",
      title: "Consider shorter water-change intervals",
      body: `Nitrate has been above 20 ppm on ${highCount} of your last ${no3Vals.length} tests, and you're averaging ~${Math.round(avgInterval)}-day changes. Dropping to every ~${ideal} days would likely keep it lower between sessions.`,
      rule: `avg_interval=${Math.round(avgInterval)}d,ideal=${ideal}d,high_no3=${highCount}`,
      type: "recommendation",
    };
  }
});

/*
 * "Test less often" — only when a tank has been consistently stable
 * for at least 4 tests across 4+ weeks.
 */
RULES.push({
  id: "rec_test_cadence_stable",
  evaluate(tank) {
    const tests = _testEvents(tank.id).slice(0, 6);
    if (tests.length < 4) return null;
    // All tests must have readings and all must be in safe range
    const safe = tests.every(e => {
      const amm = _testVal(e, "ammonia");
      const nit = _testVal(e, "nitrite");
      const no3 = _testVal(e, "nitrate");
      const ph  = _testVal(e, "ph");
      if (!isNaN(amm) && amm > 0) return false;
      if (!isNaN(nit) && nit > 0) return false;
      if (!isNaN(no3) && no3 > 20) return false;
      if (!isNaN(ph)  && (ph < 6.5 || ph > 7.8)) return false;
      return true;
    });
    if (!safe) return null;
    // Span must be at least 28 days
    const span = (tests[0].ts - tests[tests.length - 1].ts) / DAY;
    if (span < 28) return null;
    return {
      sev: "fyi", ruleId: "rec_test_cadence_stable", tag: "Tip",
      title: "This tank has been consistently stable",
      body: `All ${tests.length} tests over the last ${Math.round(span)} days have been in the safe range. Testing every 2–3 weeks instead of weekly is fine for an established, healthy tank.`,
      rule: `stable_tests=${tests.length},span=${Math.round(span)}d`,
      type: "recommendation",
    };
  }
});

/*
 * Combined signal: overdue maintenance + high nitrate + heavy stocking
 */
RULES.push({
  id: "combined_overdue_nitrate_stocking",
  evaluate(tank) {
    const animals = _tankAnimals(tank);
    const gallons = _numOr(tank.gallons, 0);
    const density = gallons > 0 ? animals / gallons : 0;
    if (density < 0.7) return null;  // only fires for meaningfully stocked tanks
    const changes = _changeEvents(tank.id);
    if (!changes.length) return null;
    const daysSinceChange = _daysAgo(changes[0].ts);
    const ideal = _idealInterval(tank, null);
    if (daysSinceChange < ideal) return null;  // not overdue
    const tests = _testEvents(tank.id).slice(0, 2);
    const curNo3 = tests.length ? _testVal(tests[0], "nitrate") : NaN;
    if (isNaN(curNo3) || curNo3 <= 20) return null;  // needs a real no3 reading
    // Suppress if individual nitrate_current or water_change_cadence already urgent
    // This rule fills the gap when both are "soon" grade individually
    return {
      sev: "soon", ruleId: "combined_overdue_nitrate_stocking", tag: "Risk",
      title: "Maintenance + nitrate + stocking — all elevated",
      body: `${Math.round(daysSinceChange)} days since your last change, nitrate at ${curNo3} ppm, and the tank is well-stocked. These combine — a water change now would help on all three fronts.`,
      rule: `combined:days=${Math.round(daysSinceChange)},no3=${curNo3},density=${density.toFixed(2)}`,
      type: "recommendation",
    };
  }
});

/*
 * "What changed lately" — when a previously stable tank has a new problem
 * Fires when last test shows a value that crossed a threshold but the
 * test before it was fine.
 */
RULES.push({
  id: "stability_shift",
  evaluate(tank) {
    const tests = _testEvents(tank.id).slice(0, 3);
    if (tests.length < 2) return null;
    const t0 = tests[0]; // most recent
    const t1 = tests[1]; // one before
    const checks = [
      { field: "ammonia", threshold: 0,  label: "ammonia" },
      { field: "nitrite", threshold: 0,  label: "nitrite" },
      { field: "nitrate", threshold: 20, label: "nitrate" },
    ];
    const newlyBad = [];
    for (const c of checks) {
      const v0 = _testVal(t0, c.field);
      const v1 = _testVal(t1, c.field);
      if (isNaN(v0) || isNaN(v1)) continue;
      if (v0 > c.threshold && v1 <= c.threshold) {
        newlyBad.push(c.label);
      }
    }
    if (!newlyBad.length) return null;
    // Don't double-fire if the individual current-reading rules already fired
    // at urgent/soon — this is purely a "what changed" insight for borderline moves
    const t0amm = _testVal(t0, "ammonia");
    const t0nit = _testVal(t0, "nitrite");
    const t0no3 = _testVal(t0, "nitrate");
    if ((!isNaN(t0amm) && t0amm >= 0.25) ||
        (!isNaN(t0nit) && t0nit >= 0.25) ||
        (!isNaN(t0no3) && t0no3 > 40)) return null;
    return {
      sev: "fyi", ruleId: "stability_shift", tag: "Insight",
      title: `Something changed since your last test`,
      body: `${newlyBad.join(" and ")} moved into an elevated range this test when it was fine before. Keep an eye on it — if it stays elevated next test, it's worth addressing.`,
      rule: `stability_shift:${newlyBad.join(",")}`,
      type: "trend",
    };
  }
});

/* ── DEDUPLICATION & GROUPING ────────────────────────────────── */

/*
 * Some rule pairs are inherently redundant:
 * If a high-severity rule fires for a parameter, suppress lower-severity
 * trend/pattern rules for the same parameter.
 */
const SUPPRESSION_MAP = {
  // If these fire, suppress the lower-signal sibling
  ammonia_current:          ["ammonia_reappeared", "stability_shift"],
  nitrite_current:          ["nitrite_reappeared", "stability_shift"],
  nitrate_current:          ["nitrate_trend_rising", "stability_shift", "rec_shorten_wc_interval", "combined_overdue_nitrate_stocking"],
  ph_current:               ["ph_drift_trend"],
  temp_current:             ["temp_unstable"],
  water_change_cadence:     ["rec_shorten_wc_interval"],  // suppress tip if reminder already shown
  combined_overdue_nitrate_stocking: ["water_change_cadence", "nitrate_current"],  // combined replaces individual when both are moderate
};

function _deduplicate(items) {
  const activeIds = new Set(items.map(i => i.ruleId));
  // Suppress lower-signal items when a higher-signal one is present
  for (const [dominant, suppressed] of Object.entries(SUPPRESSION_MAP)) {
    if (activeIds.has(dominant)) {
      suppressed.forEach(s => activeIds.delete(s));
    }
  }
  return items.filter(i => activeIds.has(i.ruleId));
}

/* ── PRIORITY SCORING (Phase 3) ─────────────────────────────── */
/*
 * Within the same severity tier, rank by type:
 * reading > cadence > trend > recommendation > stocking
 * This ensures current unsafe readings always float to the top.
 */
const TYPE_RANK = {
  reading:        5,
  cadence:        4,
  trend:          3,
  recommendation: 2,
  stocking:       1,
};

function _score(item) {
  return (SEV_RANK[item.sev] || 0) * 10 + (TYPE_RANK[item.type] || 0);
}

/* ── MAIN COMPUTE ────────────────────────────────────────────── */

function computeAdviceList(tank) {
  const results = [];
  for (const rule of RULES) {
    try {
      const adv = rule.evaluate(tank);
      if (adv) results.push(adv);
    } catch (err) {
      console.warn(`[Advisor] rule ${rule.id} threw:`, err);
    }
  }
  const deduped = _deduplicate(results);
  deduped.sort((a, b) => _score(b) - _score(a));
  // Hard cap: never surface more than MAX_ACTIVE items
  return deduped.slice(0, MAX_ACTIVE);
}

function computeAdvice(tank) {
  const list = computeAdviceList(tank);
  return list[0] || null;
}

/* ── HISTORY LOGGING ─────────────────────────────────────────── */

function _ruleSignature(adv) {
  return adv ? `${adv.ruleId} | ${adv.rule}` : null;
}

function _hasRecentMatchingAdvice(tankId, sig, sev) {
  const evs = (window.events && window.events[tankId]) || [];
  const cooldown = COOLDOWN[sev] || COOLDOWN.fyi;
  const cutoff = Date.now() - cooldown;
  return evs.some(e =>
    e.type === "advisor" &&
    e.ts >= cutoff &&
    e.data && e.data.sig === sig
  );
}

function logAdviceIfNew(tank, adv) {
  if (!adv) return;
  const sig = _ruleSignature(adv);
  if (_hasRecentMatchingAdvice(tank.id, sig, adv.sev)) return;
  if (typeof logEvent === "function") {
    logEvent(tank.id, "advisor", {
      sev:   adv.sev,
      title: adv.title,
      body:  adv.body,
      rule:  adv.rule,
      sig,
    });
  }
}

/* ── ACTION TARGET ───────────────────────────────────────────── */

function adviceTarget(adv) {
  if (!adv) return null;
  const type = adv.type || "";
  const id   = adv.ruleId || "";
  // Test-related → water-care tab
  if (type === "cadence" && id.includes("test")) return { tab: "water-care", remType: null };
  if (id === "test_staleness") return { tab: "water-care", remType: null };
  // Trend insights that can be verified with a test
  if (type === "trend") return { tab: "water-care", remType: null };
  // Everything else → water-care tab (do a change + dose)
  return { tab: "water-care", remType: "water_change" };
}

/* ── EXPOSE ──────────────────────────────────────────────────── */

window.ADVISOR = {
  computeAdvice,
  computeAdviceList,
  logAdviceIfNew,
  adviceTarget,
  // Exposed for debugging / future inspector panel
  _rules: RULES,
  _MAX_ACTIVE: MAX_ACTIVE,
};

})();
