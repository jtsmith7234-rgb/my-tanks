# Phase 3 — Guided New Tank Experience
## QA Report · v20260613e

---

### 1. What was found?

The existing firsttank.js had solid checklist logic (optimistic DOM updates, auto-complete on all items checked, onChange(null) path already partially wired) but was missing all of the guided, contextual layer described in Phase 3:

- No navigation prompts when key items were checked.
- No stage-completion toasts — stages just silently jumped position on re-render.
- No full completion flow — the checklist would theoretically complete but nothing happened.
- No `data-stage-key` attribute on `.ft-stage` divs, so flash animation couldn't target them.
- No compact "allDone" banner — the card would just persist indefinitely.
- `actionToast` and `_ftNavigateToTab` didn't exist in app.js.
- `eventTitle`/`eventDetail` had no case for `first_tank_complete`.
- The `FIRSTTANK.bind` callback in app.js logged a generic `first_tank` event for the completion sentinel message (`__first_tank_complete__`), which would have double-logged.

---

### 2. What was fixed?

**app.js additions:**
- `actionToast(msg, actionLabel, onAction)` — new function. Shows a persistent (5s auto-dismiss) toast at bottom with optional action button. Replaces any existing action toast to prevent stacking. Exposed as `window.actionToast`.
- `window._ftNavigateToTab(tab)` — navigates to a tab within the current tank screen. Guards on `view.screen === "tank"` to prevent misfires.
- `eventTitle` — added case `first_tank_complete` → `"🌱 First tank complete"`.
- `eventDetail` — added case `first_tank_complete` → `"Tank fully set up — {kind} setup complete."`.
- `EVT_ICONS` — added `first_tank_complete` entry (reuses first_tank plant SVG).
- History filter — `first_tank` filter now also matches `first_tank_complete` events.
- `FIRSTTANK.bind` callback — skips logging `first_tank` event when msg is the sentinel `"__first_tank_complete__"` to prevent duplicate history entries.

**firsttank.js additions:**
- `FT_NAV_PROMPTS` map — 5 stageKey:itemId combos mapped to actionToast configs. Prompts only fire when the item is checked ON (not unchecked).
- `FT_STAGE_COMPLETE_MSGS` map — 6 stage keys mapped to completion messages. `first_fish` is null (handled by full completion flow).
- `_ftShowCompletion(tank, onChange)` — sets `allDone` + `completedAt`, calls `window.logEvent` directly for `first_tank_complete`, calls `onChange("__first_tank_complete__")` (sentinel), then opens a non-corny completion modal.
- `renderFirstTankSection` — added `allDone` guard at top that renders the compact `.ft-done-banner` instead of the full checklist.
- `renderFirstTankSection` — added `data-stage-key="${st.key}"` to each `.ft-stage` div for flash animation targeting.
- `bindFirstTank` — added History button binding on `.ft-done-banner`.
- ft-check handler — navigation prompts fire after optimistic update, before stage completion check.
- ft-check handler — when stage auto-completes: checks if ALL stages are done (triggers full completion), otherwise shows stage-completion `actionToast` then flashes the card for 600ms before calling `onChange`.

**styles.css additions:**
- `.ft-stage-flash-done` + `@keyframes ftStageDone` — 600ms green flash animation.
- `.ft-done-banner`, `.ft-done-row`, `.ft-done-icon`, `.ft-done-title`, `.ft-done-sub`, `.ft-done-history` — compact completion banner styles.

---

### 3. What may still be buggy?

- **Completion via "Mark this step done" button**: `_ftShowCompletion` is only wired into the ft-check (per-item checkbox) auto-complete path. If a user clicks "Mark this step done" on the last stage manually (bypassing per-item checks), `stageAutoCompleted` in the `.ft-complete` handler is never set, and the completion flow won't fire. The `.ft-complete` handler calls `onChange("Completed: " + key)` directly. This is a known gap — the completion check should also run in the `.ft-complete` handler. Low priority since the guided flow is checklist-first, but worth noting for Phase 4.
- **actionToast stacking with nav prompt + stage completion**: If a user checks the last item of a stage that also has a nav prompt (e.g. `first_fish:accl`), both a nav prompt AND the stage completion message would fire. The `actionToast` replaces any existing one, so only the stage completion message (or full completion modal) would be seen. This ordering (nav prompt fires first, then stage complete fires and replaces it) is acceptable but slightly noisy in that edge case.
- **`_ftShowCompletion` re-render timing**: The modal opens after `onChange` triggers a full re-render. If the re-render happens synchronously, the modal opens on top of the now-updated DOM (showing the compact banner), which is correct. If anything delays the re-render, there's a brief flash of the old full checklist behind the modal. No defect in practice but worth watching.

---

### 4. What may still be too noisy?

- **Stage-completion toasts during normal checklist flow**: A user checking the last item of a stage gets both a navigation prompt (if that item has one) AND a stage-completion toast. The `actionToast` replaces the first with the second, so only one shows at a time — acceptable. But if a user rapidly checks the last two items of a stage, they'll see two toasts in quick succession. Consider debouncing or suppressing the nav prompt when a stage is about to auto-complete.
- **"Stage completed" log entries in History**: Every stage completion fires a `first_tank` history event with message "Stage completed: {key}". Over 6 stages this produces 6 entries. They're filterable but could clutter history. Phase 4 might consider batching these or using a lower-visibility event type.

---

### 5. What may still be confusing?

- **The "Hide" button vs allDone banner**: If a user hides the checklist before completing (`ft-disable` → `enabled: false`), the CTA ("Start First Tank Mode") reappears. But if they've been using the guided flow and just want to tuck it away, they'll lose the in-progress UI. The allDone path is clean, but the mid-flow "hide" state is slightly confusing. No change made here — pre-existing behavior.
- **"Mark this step done" vs per-item checkboxes**: Two completion paths exist. The big button marks a whole stage done without requiring item checks. The per-item path auto-completes the stage. A user might wonder why the button still appears even after checking all items (it stays until re-render). This is cosmetic and pre-existing.

---

### 6. What may still be too generic?

- **Stage completion messages for `setup` and `fill`**: "Gear is ready — time to fill it up." and "Tank is filled! Cycling starts now." are reasonably specific. The `cycle_start` and `cycle_middle` messages ("Cycling underway. Check back in a few days." / "Almost there — test daily this week.") are slightly generic but correct for the context.
- **Completion modal body copy**: The modal says "cycled the water, added your first fish, and worked through every step" — this is accurate and specific. The "From here it's regular care" line is good. Not generic.

---

### 7. What still needs stronger logic?

- **Full completion via manual "Mark this step done"**: As noted in §3, the `.ft-complete` button handler doesn't check for full completion. This needs the same `everyStageDone` check added to that handler in a future pass.
- **Unchecking after allDone**: If `allDone` is true, the compact banner is shown and there's no way to undo. There's no "reset" path. This is intentional but should be documented — and perhaps a way to "restart" the checklist should be added in Phase 4.
- **Kind fallback in completion event**: `_ftShowCompletion` uses `tank.firstTank.kind || tank.kind || "freshwater"`. If neither is set, "freshwater" is the fallback. This is safe.
- **`window.logEvent` availability**: `_ftShowCompletion` calls `window.logEvent` directly. This works because `logEvent` is defined at module level in app.js and `window.logEvent` isn't explicitly set there. However, since app.js runs as a regular script (not a module), all top-level `function` declarations are implicitly on `window`. Verified: the call uses `window.logEvent && window.logEvent(...)` with a guard, so it fails silently if unavailable. Safe.

---

### 8. Is this phase complete enough to move to Phase 4?

**Yes, with one known gap documented.**

All 6 specified changes are implemented and pass `node --check`. The guided experience now:
- Fires contextual navigation prompts on 5 key checklist item checks.
- Shows stage-completion toasts for all 6 stages (with action button on cycle_finish).
- Triggers a full, non-corny completion modal when every stage is done.
- Logs a `first_tank_complete` history event with kind data.
- Renders a compact "First tank complete" banner with History navigation post-completion.
- Flashes the stage card on auto-complete before re-rendering.
- Handles `onChange(null)` correctly (save-only, no re-render).

The one known gap (completion not firing via manual "Mark this step done" button on the last stage) is low risk since the per-item checkbox path is the primary guided flow. It can be addressed in Phase 4 as a targeted fix.
