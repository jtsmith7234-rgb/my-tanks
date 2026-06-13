# Phase 4 QA Report — Smarter Feature Logic (v20260613f)

**Date:** 2026-06-13  
**Version:** v20260613f  
**Files modified:** app.js, firsttank.js, styles.css, index.html

---

## Q1: Where is `getSafeRanges` defined, and does it appear before `rateReading`?

`getSafeRanges` is defined at **app.js line 344**, immediately after the `SAFE_BY_KIND` constant. `rateReading` is defined at **line 355**. Order is correct — `getSafeRanges` is always available when `rateReading` is called.

---

## Q2: How many arguments does `rateReading` now accept, and what is the third?

`rateReading(metric, value, safe)` — **3 arguments**. The third argument `safe` is an optional safe-ranges object. When omitted (or falsy), it falls back to the global `SAFE` object. This preserves backward compatibility for all history/event-detail call sites that don't pass a tank context.

---

## Q3: List every `rateReading(` call site and confirm each passes 3 arguments.

| Line | Call site | 3 args? |
|------|-----------|---------|
| 355 | `function rateReading(metric, value, safe)` | definition |
| 2919 | Inside `renderReadingRow(label, metric, value, unit, safe)` — passes `safe` through | ✓ |
| 2925–2928 | Inside `renderReadingsInline(d, safe)` — passes `safe` through (×4) | ✓ |

All downstream callers now thread the `safe` parameter:
- `renderReadingRow(…, getSafeRanges(t))` — called from `renderWaterCare` (lines 2103–2106) and `renderTests` (lines 2877–2880)
- `renderReadingsInline(e.data, getSafeRanges(t))` — called from `renderTests` recent-tests loop (line 2896)

History/event-detail calls at lines 3156 and 3178 intentionally omit `safe`, correctly falling back to global SAFE defaults.

---

## Q4: What tank kinds have overrides in `SAFE_BY_KIND`, and what differs from the defaults?

| Kind | Overridden metric | Change vs. default |
|------|--------------------|-------------------|
| `betta` | pH | good: [6.5, 7.5] vs [6.5, 7.8]; warn: [6.0, 8.0] vs [6.0, 8.4] |
| `betta` | nitrate | good: [0, 10] vs [0, 20]; warn: [0, 20] vs [0, 40] — bettas more sensitive |
| `shrimp` | pH | good: [6.5, 7.5], warn: [6.2, 7.8] — tighter range |
| `shrimp` | ammonia | warn: [0, 0.0] — zero tolerance (vs 0.25) |
| `shrimp` | nitrate | good: [0, 10], warn: [0, 20] — very sensitive |
| `planted` | nitrate | good: [5, 30] — plants consume nitrate; low is normal |
| `quarantine` | ammonia | warn: [0, 0.0] — must be zero |
| `quarantine` | nitrate | good: [0, 10], warn: [0, 20] |

---

## Q5: What changed in the fish "Add to tank" section (Change 2)?

Three changes:
1. **h2 heading**: "Add fish or invertebrate" → "**Add to tank**"
2. **Placeholder text**: "Start typing (e.g. neon, betta, cory)" → "**Type a fish name to see its profile, then add it**"
3. **Species card**: `renderSpeciesInfo()` now calls `window.FISHDB_API.profileCard(f)` instead of `window.FISHDB_API.card(f)`, showing the richer full-profile card (with image/details) in the `#species-info` div when a species is selected from autocomplete.

---

## Q6: When does the `.ft-eq-hint` block appear in the First Tank walkthrough?

The hint appears when **both** conditions are true:
- `window.EQ && window.EQ.getItems(tank.id).length > 0` — the tank has at least one equipment item logged
- The current stage key is `"fill"` or `"cycle_start"`

It is injected after the do-checklist and before the "What to expect" list. The "View equipment ›" button navigates to the Equipment tab via `window._ftNavigateToTab("equipment")`. When no equipment is logged, the block is omitted entirely (no DOM overhead).

---

## Q7: Where was the Equipment help topic inserted in `HELP_TOPICS`, and what is the final count?

Inserted after "Logging a water test" (index 3) and before "History" (index 4). Final `HELP_TOPICS` array has **7 entries**:

1. Add a tank
2. Water change reminders
3. Logging a water change
4. Logging a water test
5. **Tracking equipment** ← new
6. History
7. Species Compatibility Browser

---

## Q8: What is the updated heater detail text in the "fill" stage?

**Before:**
> "Set the heater to 78°F if you're not sure. Give it a few hours to warm up before checking."

**After:**
> "Set the heater to 78°F as a safe starting point. Let it run for 2–3 hours before checking with a thermometer — heaters often take longer than expected to stabilize."

The change adds actionable specificity (2–3 hours, mentions using a thermometer) and explains *why* the wait is needed (stabilization time), which is a common point of confusion for new hobbyists.

---

## QA Summary

| Check | Result |
|-------|--------|
| `node --check app.js` | ✓ PASS |
| `node --check firsttank.js` | ✓ PASS |
| All `rateReading(` calls pass 3 args | ✓ |
| `getSafeRanges` defined before `rateReading` | ✓ (line 344 vs 355) |
| HELP_TOPICS entry count | ✓ 7 entries |
| `.ft-eq-hint` styles in styles.css | ✓ lines 3841–3853 |
| Version bumped in index.html (10 occurrences) | ✓ v20260613e → v20260613f |
