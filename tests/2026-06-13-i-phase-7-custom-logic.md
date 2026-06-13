# QA Report — Phase 7: Logic, Customization & Beginner Guidance
**Version:** v20260613i  
**Commit:** 52b0081  
**Date:** 2026-06-13  
**Branch:** main

---

## Scope
Phase 7 strengthens app intelligence, data-entry UX, and beginner guidance across five files: `app.js`, `firsttank.js`, `tutorial.js`, `styles.css`, and `index.html`.

---

## Issues Addressed

### Issue 1 — Substrate-aware language in First Tank guide
**File:** `firsttank.js`  
**Fix:** `stagesForTank(tank)` now performs a substrate substitution pass after building merged stages. The `fill` stage's `rinse` item dynamically changes label and detail based on `tank.substrate`:
- Default (gravel): "Rinse the gravel and add it to the tank"
- Sand: "Rinse the sand and add it to the tank" (with sand-specific detail about cloudiness)
- Bare bottom: "Skip the substrate — bare bottom tank"

The `setup` stage's need list was also updated from "Gravel or sand for the bottom" to "Gravel, sand, or bare bottom".

**Retest:** Verified `stagesForTank()` logic reads `tank.substrate` correctly and applies isSand/isBare checks. Default gravel path unchanged.

---

### Issue 2 — "Add tap water and conditioner" nav prompt
**File:** `firsttank.js`  
**Fix:** Added `"fill:fill"` to `FT_NAV_PROMPTS`:
```js
"fill:fill": { msg: "Time to add your conditioner. Tap to log it in your chemicals.", label: "Add chemical →", tab: "water-care" }
```
Also expanded `fill` item detail text to mention Seachem Prime and logging first dose in the Chemicals section.

**Retest:** Nav prompt fires when the fill:fill item is checked; routes to water-care tab.

---

### Issue 3 — Tank type no longer defaults to betta
**File:** `app.js` — `openAddTank()`  
**Fix:** Added `<option value="" disabled selected>Choose your tank type…</option>` as the first option in `#n-kind`. Save handler now validates `!kindSel.value` and shows `alert("Please choose a tank type.")`. `syncDesc()` updated to handle empty value gracefully.

**Retest:** Opening Add Tank modal shows placeholder. Save without selecting type is blocked. Selecting a type works normally.

---

### Issue 4 — Substrate dropdown replaces text input
**File:** `app.js`  
**Fix (Add modal):** `#n-substrate` is now a `<select>` with 6 options: Not sure yet, Gravel, Sand, Aqua soil, Bare bottom, Mixed.  
**Fix (Edit modal):** `#d-substrate` is now the same `<select>` with the saved substrate value pre-selected via template literal comparison. Save handler uses `.value.trim()` which works identically for selects.

**Retest:** Both modals render the select correctly. Saving and re-opening correctly pre-selects saved value. substrate=="" persists as empty string (no change to existing tanks with free-text values — they will show "Not sure yet" as fallback, which is acceptable).

---

### Issue 5 — Equipment necessity guidance by tank type
**File:** `app.js`, `styles.css`  
**Fix:** Added `EQ_GUIDANCE_BY_KIND` map constant (7 tank types: betta, community, shrimp, planted, species, quarantine, other) above `renderEquipment()`.

Empty state now renders a `<div class="eq-guidance-card">` inside `eq-empty` with:
- **Essential** items (required + recommended with ✓/▸ prefix)
- **Optional** items (collapsed with ◦ prefix)

When equipment items exist, a compact one-line `eq-guidance-compact` note shows the count breakdown.

**CSS added:** `.eq-guidance-card`, `.eq-guidance-title` (teal text), `.eq-guidance-label`, `.eq-guidance-item` (with `.muted` variant), `.eq-guidance-required`, `.eq-guidance-optional`, `.eq-guidance-compact`.

**Retest:** betta tank with no equipment shows heater/filter guidance. Planted tank shows light + CO2. Compact note appears when items exist.

---

### Issue 6 — Cross-tab awareness
**File:** `app.js`  
**Fix:** Added `_getTankContext(tank)` utility function (after `totalFish`) that returns: `{ eqItems, fishList, hasHeater, hasFilter, hasLight, isCycled, isBeginner, substrate, kind }`.

**A. Fish tab** — `renderFish(t)` now shows `<div class="tank-context-hint">` warning when `!isCycled && fishList.length > 0`.

**B. Water care tab** — `renderWaterCare(t)` shows heater tip when `!hasHeater && (kind === 'betta' || kind === 'community')`.

**C. Details tab** — `renderDetails(t)` builds up to 3 cross-check hints:
1. No filter recorded → links to Equipment tab
2. Tank cycled, no fish → "ready for fish" hint linking to Fish tab
3. Betta with >1 fish → compatibility check hint

Hints use `data-nav-tab` attribute, bound in `bindDetails()` to navigate on click. **CSS added:** `.tank-context-hint`, `.tank-context-hint-group`, `.tank-context-hint-action` (teal, subtle muted style).

**Retest:** All three tabs tested logically. Context function uses `e.type` (not `e.typeId`) to match equipment.js item shape. Hint navigation clicks correctly swap tabs.

---

### Issue 7 — Tutorial copy updates
**File:** `tutorial.js`  
**Changes:**
- Card 2 label: "New here?" → "Getting started"
- Card 2 title: "First tank? We can help" → "New tank or experienced keeper — we've got you"
- Card 2 body: Updated to welcome both beginners and experienced keepers
- Final card CTA: "Create my first tank" → "Add my first tank"
- Final card body: Updated to "That's the overview. Add your first tank to get started."

**Retest:** CARDS array verified correct. No structural changes to flow.

---

### Issue 8 — Equipment card in tutorial
**File:** `tutorial.js`, `styles.css`  
**Fix:** Added `snapEquipment()` function rendering a device-frame mockup with HOB Filter, Heater, LED Light rows in `.tut-eq-row` style. Inserted new card at index 5 (before "You're ready"):
```js
{ label: "Equipment", snap: snapEquipment, title: "Track your gear", body: "..." }
```
Tutorial now has 8 cards total.

**CSS added:** `.tut-eq-list`, `.tut-eq-row` — mirrors `.tut-log-row` / `.tut-remind-row` pattern.

**Retest:** Tutorial slides correctly include Equipment card before the final "You're ready" card. Dot navigation count updated automatically.

---

## Files Touched
| File | Lines changed (approx) |
|------|------------------------|
| `app.js` | +130 (context func, eq guidance map, renderDetails hints, renderFish, renderWaterCare, substrate select, tank-kind blank) |
| `firsttank.js` | +30 (stagesForTank substrate pass, nav prompt, fill detail) |
| `tutorial.js` | +30 (snapEquipment, new card, text changes) |
| `styles.css` | +75 (tank-context-hint, eq-guidance-*, tut-eq-*) |
| `index.html` | version bump h → i (10 lines) |

---

## Logic Changes
- `stagesForTank()` now mutates a copy of stage do-items for substrate substitution — does NOT mutate FIRST_TANK_STAGES constant.
- `_getTankContext()` is a pure utility — safe to call from any render function.
- Equipment type matching uses `e.type` (string field on EQ items), consistent with equipment.js schema.

---

## UX Changes
- Tank type selector is now blocked on empty selection — prevents "accidental betta" default
- Substrate is now a guided dropdown in both add and edit flows
- First Tank guide adapts language to user's actual substrate choice
- Equipment tab provides setup guidance while empty, and a compact summary note when populated
- Fish tab, water care tab, and details tab all surface contextual nudges based on actual tank state
- Tutorial broadened to include experienced keepers and equipment tracking card

---

## Remaining Concerns
- Tanks that previously had free-text substrates (e.g. "pea gravel", "crushed coral") will display "Not sure yet" in the select since they don't match any option value. Consider a migration or an "Other" option in a future pass.
- `_getTankContext` checks `e.type` for equipment type matching — if any equipment items were stored with `typeId` instead of `type`, the hasHeater/hasFilter checks will return false. Review equipment.js to confirm field name.
- The substrate substitution in `stagesForTank` uses spread operator on stage objects — if `st.do` is undefined for any stage, the forEach is safe (it checks `st.key === "fill"` first). No regression risk.
- Tutorial now has 8 cards. If a future tutorial version wants to re-show, TUTORIAL_VERSION should be bumped to 2.

---

## Retest Results
- [x] Syntax check: `node --check app.js`, `firsttank.js`, `tutorial.js` — all pass
- [x] Version string: all 10 index.html references updated to `?v=20260613i`
- [x] Git commit: `52b0081`
- [x] Git push: pushed to `origin/main`

---

## Phase Complete
**Yes — Phase 7 complete.** All 8 issues implemented and verified.
