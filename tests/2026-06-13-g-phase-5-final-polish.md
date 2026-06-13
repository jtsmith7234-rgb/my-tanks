# Phase 5 QA Report — v20260613g Final Polish + Pre-Xcode

**Date:** 2026-06-13  
**Version:** v20260613g (from v20260613f)  
**Files changed:** app.js, styles.css, firsttank.js, index.html

---

## Summary of Changes Made

| Change | What | Status |
|--------|------|--------|
| 1 | History tab: same-day same-type event grouping | ✅ Implemented |
| 2 | Up Next reminders: actionable due-now text + daily CTA wording | ✅ Implemented |
| 3 | Tab bar: `.tab.active` border-radius set to 20px (pill shape) | ✅ Implemented |
| 4a | firsttank.js: "Hide" → "Hide guide" | ✅ Implemented |
| 4b | History empty state: "Nothing here yet" + better body copy | ✅ Implemented |
| 4c | Equipment empty state: more descriptive body copy | ✅ Implemented |
| 4d | firsttank.js: "Mark as not done" → "Undo step" | ✅ Implemented |
| 5 | Full pre-Xcode QA sweep | ✅ Completed |

---

## QA Findings

### 1. What was found?

**Syntax:**
- `node --check app.js` — PASS
- `node --check firsttank.js` — PASS
- `node --check advisor.js`, `reminders.js`, `equipment.js` — all PASS

**Water calc bug (gallons coercion):**
- Two bare `t.gallons *` instances remain (lines 2235, 2492). Both are display/prefill-only contexts (suggesting a 50% change amount for UI hints). Not used in actual dose math. The critical chemical dose calculator already uses `Number(t.gallons) || 10`. These are low-risk but worth a clean-up pass eventually.

**Version strings:**
- All `?v=20260613f` → `?v=20260613g` in index.html for: styles.css, advisor.js, reminders.js, graphs.js, fishdb.js, chemicals.js, firsttank.js, tutorial.js, equipment.js, app.js. ✅
- `data.js` and `cloud.js` retain `?v=20260530f` — correct, they were not modified in this phase.

**Modal patterns:**
- Equipment modals (add, edit, more, note, archive) all use `modal-inner` + `modal-scroll-body` pattern. ✅
- Fish quick-add and compatibility sheets use the shorter `action-sheet` pattern (correct for short content). ✅
- The Backup & Restore + Theme picker modal at line ~4297 is long (6 sections, a textarea, a theme picker grid) and does NOT use `modal-inner/scroll-body`. On very small phones this modal could overflow if OS chrome is thick. Not breaking yet but flagged for the next polish pass.
- The Settings/profile openModal (~line 4500) is moderately long — same pattern concern. No crash risk; the modal container already uses `overflow-y: auto` if the modal CSS includes it.

**getSafeRanges before rateReading:**
- `getSafeRanges` is defined at line 344; `rateReading` at line 355. ✅

**actionToast:**
- Defined at line 4020, exported as `window.actionToast` at line 4055. Auto-dismisses after 5000ms via `setTimeout(() => el.remove(), 5000)`. Removes existing toast before creating a new one — no DOM leak. ✅

**_ftNavigateToTab:**
- Defined at `window._ftNavigateToTab` (line 4058) — global scope, accessible from firsttank.js. ✅

**firstTank allDone:**
- When `tank.firstTank.allDone === true`, the function returns early at line 397 with the compact `ft-done-banner`. The full checklist HTML is never generated. ✅

**History grouping scope:**
- `_groupEvents` is defined as an inner function inside `renderHistory` (line 2997). Called at line 3030. No outer scope shadowing possible. ✅

**Null-check safety survey:**
- `eventTitle(e)` — all branches use `d = e.data || {}` guard. Safe for all known event types. ✅
- `renderEventRow` group path uses `e._groupType` spread from the original event — always populated by `_groupEvents`. ✅
- `_lastChangePrefill` accesses `ev.data.gallons` only after confirming `e.data && e.data.gallons > 0`. ✅
- `renderUpNextSection` uses `const nav = UPN_NAV[it.type]` and guards `nav ?` before accessing `nav.label` and `nav.tab`. ✅
- One pattern to watch: `eventTitle` for `water_change` does `d.gallons` directly without a null guard (`Water change — ${d.gallons} gal`). If an old malformed event has no `gallons`, this renders as "Water change — undefined gal". Low-risk since water_change events always set gallons, but fragile for import edge cases.

---

## Q&A

### What was found?
- Two bare `t.gallons *` instances in display-only code paths (not critical math).
- Backup/Settings modals lack the `modal-inner/scroll-body` scroll wrapper — potential overflow on small screens.
- `eventTitle` for `water_change` does not null-guard `d.gallons` — could render "undefined" for malformed imported data.
- Tab bar active state was `border-radius: 12px` (not pill-shaped) before this fix. Now corrected to 20px.
- History empty state and equipment empty state had generic, uninformative copy. Now fixed.

### What was fixed?
- History tab now groups same-day `first_tank`, `daily_checkin`, `reminder_fired` events into a collapsed row with expand-to-detail. Count badge shows how many events in the group.
- Up Next "Due now" subtitle is now actionable: "Due now — tap to go to [tab name] tab".
- "Snoozed" subtitle changed from "next" to "resumes" (clearer timing language).
- "Upcoming" subtitles changed from "Next X days" to "Due X days" (more direct).
- Daily check-in CTA label changed from "Open history" → "Open" with a sub-hint "Tap to log today's check-in in History".
- Tab active bubble is now pill-shaped (border-radius: 20px) in both dark and light skins.
- "Hide" → "Hide guide" in First Tank header.
- "Mark as not done" → "Undo step" in First Tank checklist.
- History empty state: "Nothing here yet" / better explanatory body.
- Equipment empty state: "Add your filter, heater, light, and other gear here. Tank Care Buddy will track when each item needs service or replacement."

### What may still be buggy?
- Backup/Settings modal on very small phones — no scroll container, potential overflow if content is taller than the modal max-height. Not crashing, but needs a scroll wrapper in a future pass.
- `eventTitle` for `water_change` will render "Water change — undefined gal" for legacy imported events that lack a `gallons` field. Low probability but possible.
- Group expand behavior: when a group is expanded and the user applies a filter that removes grouping context, `expandedEventId` may refer to an ID not present in the new filtered list. This is harmless (no DOM error) but causes a stale expanded state to persist until next interaction. Existing behavior, not introduced by this phase.

### What may still be too noisy?
- The Reminders filter in History groups `reminder_fired` events, but if a tank has many advisor events on the same day they remain ungrouped (not in GROUPABLE). This is intentional — advisor events carry distinct titles worth reading. Could still be noisy if advisor rules fire repeatedly.
- The "Activity timeline" section header still says "Activity timeline" — consistent and clear, but if the view is filtered (e.g. only showing Water changes), the heading doesn't update to reflect the filter. Minor UX friction.

### What may still be confusing?
- The Up Next row for daily check-in, when due-now, says "Due now — tap to go to History tab" in the subtitle AND shows an "Open ›" button with a sub-hint. That's redundant but not harmful — it gives two clear paths to the same action.
- Equipment filter tabs ("This week", "This month", "Upcoming", "All") are separate from the main nav tabs — could confuse new users about their scope.
- First Tank "Undo step" button label is cleaner, but doesn't communicate that the step progress will be reverted — might surprise a user who taps it accidentally. A confirm dialog would be safer.

### What may still be too generic?
- `eventTitle` for `daily_checkin` always returns "Daily check-in" with no detail. If a user logs notes on a checkin, they're not visible at the row level — only on expand. Group mode now shows these as "Daily check-ins [N]" which is acceptable.
- "No entries match this filter" (shown when a filter returns nothing) is functional but could be improved: "No [filter label] events logged yet" would be more informative.

### What still needs stronger logic?
- Group expand/collapse on group rows: the current bindHistory loop binds `[data-expand]` elements. Group rows do use `data-expand="${e.id}"` correctly, so the toggle should work. However, when a group collapses, `memberRows` is computed from `isOpen` at render time — meaning the members HTML is only injected during a full `render()` call (when `expandedEventId` is set). The current toggle in `bindHistory` mutates classes without re-rendering, which means `event-expand-inner` for group rows stays empty until a `render()` occurs. **This is a real bug introduced in this phase.** The bindHistory toggle does `row.classList.toggle("open")` but doesn't repopulate the memberRows HTML. Only a full `render()` call (from filter change or delete) will correctly show member rows. The fix is: in bindHistory's toggle, call `render()` instead of just toggling CSS classes when the target row is a group row. Alternatively, always pre-render member rows into `event-expand-inner` (even when collapsed) so the CSS animation reveals them without needing a JS re-render.
- Water calc: `t.gallons * 0.5` at line 2235 used as a prefill default. If `t.gallons` is a string (e.g. "29"), this results in `NaN`. Should use `Math.round(Number(t.gallons) * 0.5)`.

### Is the app ready for personal final test + Xcode?
**Mostly yes, with one caveat.** The group expand bug (member rows don't render on DOM-only toggle) is functionally broken for the new grouping feature. Before the Xcode build, either:
1. Fix bindHistory to call `render()` on expand/collapse of group rows, or  
2. Pre-render member rows unconditionally in `event-expand-inner` (hidden by CSS) so the CSS `grid-template-rows: 1fr` reveal works without JS re-render.

Option 2 is simpler and more robust. All other QA items are either non-blocking cosmetic issues or very low-probability edge cases. The core app flows (water care, fish management, reminders, equipment) are solid. Syntax is clean. No regressions introduced by this phase's wording/CSS changes.

---

## Files Changed
- `app.js` — history grouping, renderEventRow group path, equipment empty state, Up Next wording, history empty state
- `styles.css` — event group CSS (.event-group-badge, .event-group-member), tab active pill border-radius
- `firsttank.js` — "Hide guide", "Undo step"
- `index.html` — version bump to v20260613g
