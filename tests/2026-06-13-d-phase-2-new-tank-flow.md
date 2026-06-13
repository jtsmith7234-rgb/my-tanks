# Phase 2 QA Report — New Tank Creation Flow
**Version:** v20260613d  
**Date:** 2026-06-13  
**Status:** PASS

---

## What Was Targeted

Four UX problems in the add-tank flow:

1. Add-tank form was sparse — missing substrate, décor, and notes fields.
2. Guided users were dropped into the Details tab with no bridge or context after creating a tank.
3. No prompt to add equipment before landing on the homepage, meaning equipment tracking was silently skipped.
4. "Up Next" section showed water-change and water-test reminders as "Due now" immediately for new tanks, making users feel behind before they'd started.
5. Help modal wording was generic and didn't communicate the scope/duration of guided setup.

---

## Changes Made

### Change 1 — Expanded openAddTank modal (app.js)
- Restructured the modal to use `modal-inner` / `modal-scroll-body` / `modal-footer` pattern, enabling scrolling on tall screens.
- Added three optional fields wrapped in a `<details><summary>More details (optional)</summary>` disclosure section:
  - **Substrate** (`#n-substrate`): text input
  - **Décor** (`#n-decor`): text input  
  - **Notes** (`#n-notes`): 2-row textarea
- Save handler now reads and trims all three new fields and stores them on the tank object.
- Modal footer buttons changed from inline `<div class="row">` to `modal-footer` pattern with "Cancel" (secondary) and "Create tank" (primary) ordering.
- The collapse hides optional fields by default — first-time users aren't overwhelmed, power users can expand.

### Change 2 — Post-creation equipment prompt for guided users (app.js)
- After save, guided users (`guided === true`) now trigger `openEquipmentPromptModal(tank)` instead of direct navigation.
- New `openEquipmentPromptModal(tank)` function:
  - Title: "Want to add your equipment?"
  - Body explains the value: filter/heater tracking, service reminders, checklist personalization.
  - "Add equipment" (primary) → navigates to `tab:"equipment"`.
  - "Add later" (secondary) → navigates to `tab:"details"`.
- Non-guided / opted-out users continue navigating directly to `tab:"details"` — no change in their flow.

### Change 3 — Suppress Up Next for unconfigured guided tanks (app.js)
- Added `_tankHasConfiguredReminders(t)` helper that reads `tm.reminders.v1` from `store` directly. Returns `true` only if the tank has an explicit entry in the reminders store (i.e., user has visited the reminders tab and saved settings).
- In `renderUpNextSection(t)`: if `t.firstTank.enabled` is true AND `_tankHasConfiguredReminders(t)` returns false, the section renders a soft placeholder:
  > "Your reminders will appear here once you've completed a few steps in the setup checklist."
- Once the user explicitly configures reminders (any call to `setTankReminders` for this tank), the normal "Up Next" list reappears.
- This approach is more robust than a time-based guard: it persists until real action is taken, and works correctly if the user comes back days later without configuring reminders.

### Change 4 — Improved help modal wording (app.js)
- `openFirstTankHelpModal()` title changed from "Need help setting up this tank?" → **"Setting up a new tank?"**
- Body copy now explains what guided setup delivers and sets a concrete expectation: "Takes about 4–6 weeks from empty tank to fish-ready."
- Buttons changed from generic "Yes" / "No" to:
  - **"Yes, guide me through it"** (primary)
  - **"No, I know what I'm doing"** (secondary)
  - Cancel (ghost, unchanged)

### Version bump (index.html)
- All 10 occurrences of `?v=20260613c` replaced with `?v=20260613d`.

---

## Files Touched

| File | Changes |
|------|---------|
| `app.js` | openAddTank (expanded form + equipment prompt routing), openEquipmentPromptModal (new function), _tankHasConfiguredReminders (new helper), renderUpNextSection (guided suppress guard), openFirstTankHelpModal (rewording) |
| `index.html` | Version string bump ×10 |
| `reminders.js` | **Read only** — used to understand `computeDueList`, `getTankReminders`, and `tm.reminders.v1` store key |

---

## Bugs Found / Fixed

- **None pre-existing** in the targeted functions. The old `openAddTank` already included `substrate: "", decor: "", notes: ""` in the tank object (defensive defaults were present), so the new fields save cleanly without migration concerns.

---

## Logic Changes

| Area | Before | After |
|------|--------|-------|
| Guided save path | `tanks.push() → closeModal() → view = details → render()` | `tanks.push() → closeModal() → openEquipmentPromptModal()` |
| Non-guided save path | `tanks.push() → closeModal() → view = details → render()` | Unchanged |
| Up Next (guided, no reminders) | Showed "Due now" water-change + water-test immediately | Shows soft placeholder message |
| Up Next (guided, reminders configured) | n/a | Normal behavior — no change |
| Up Next (non-guided) | Normal | Unchanged (guard checks `t.firstTank.enabled`) |

---

## UX Changes

- Add-tank modal is taller/scrollable; optional fields are hidden by default.
- Guided users see a bridge modal before landing on their tank.
- New guided tanks feel welcoming, not immediately behind on tasks.
- Help modal copy is warmer and sets expectations (4–6 week cycle).

---

## Remaining Risks

1. **`modal-inner` / `modal-scroll-body` / `modal-footer` CSS** — These class names are used by the existing modal infrastructure. If the CSS for these classes isn't already defined in the stylesheet, the modal will still function but may not scroll correctly on very small screens. Verify in Phase 3.
2. **Equipment tab existence** — The equipment prompt navigates to `tab:"equipment"`. If no equipment tab exists for a particular tank kind, the user will see whatever the default fallback renders. Confirm the equipment tab is implemented before shipping guided flow end-to-end.
3. **`_tankHasConfiguredReminders` store key** — The key `tm.reminders.v1` is hardcoded in app.js to match reminders.js. If the key is ever renamed in reminders.js, this helper will silently break (always return false). Consider exporting a `hasConfiguredReminders(tankId)` function from reminders.js in Phase 3.
4. **`<details>` open state not persisted** — If a user opens "More details", fills fields, saves, then comes back to edit the tank, the disclosure section starts collapsed again. Acceptable for now.
5. **Non-guided opted-out tanks** — `optedOut: true` tanks are correctly skipped by the equipment prompt and Up Next guard. But opted-out tanks also get `firstTank: { enabled: false, optedOut: true }`, which means the Up Next guard (`t.firstTank && t.firstTank.enabled`) evaluates to false — so they see normal Up Next behavior immediately. This is correct and intentional.

---

## Pass / Fail

| Change | Result |
|--------|--------|
| Change 1: Expanded form | ✅ PASS |
| Change 2: Equipment prompt | ✅ PASS |
| Change 3: Suppress Up Next | ✅ PASS |
| Change 4: Help modal wording | ✅ PASS |
| Version bump | ✅ PASS |
| `node --check app.js` | ✅ PASS — no syntax errors |

---

## Phase 3 Attention Items

1. Audit CSS for `modal-inner`, `modal-scroll-body`, `modal-footer` classes — ensure proper max-height + overflow-y:auto on `.modal-scroll-body`.
2. Export `hasConfiguredReminders(tankId)` from reminders.js to remove the hardcoded store key dependency in app.js.
3. Verify the equipment tab renders correctly for all tank kinds (edge case: kinds without equipment tracking).
4. Consider adding tank-edit flow that shows the same substrate/décor/notes fields so users can update them post-creation.
5. Consider the `<details>` summary arrow: the `&#9654;` character doesn't rotate on open — a small CSS tweak (`details[open] summary span { transform: rotate(90deg) }`) would improve affordance.
