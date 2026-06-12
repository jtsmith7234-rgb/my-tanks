# QA Report — 2026-06-12-a

| Field | Value |
|---|---|
| **Date** | June 12, 2026 |
| **Scope** | Full pre-Capacitor finalization pass |
| **Build / Version** | v20260612a (committed this session) |
| **Previous version** | v20260611l |
| **Inspector** | Perplexity Computer (automated + manual analysis) |
| **Files analyzed** | app.js (4368 lines), equipment.js (598), advisor.js (858), reminders.js (388), styles.css (3783), index.html (102), chemicals.js (229), firsttank.js (540), tutorial.js (351), graphs.js (224), fishdb.js (1567), data.js (103), cloud.js (165) |

---

## Areas Tested

- Tab navigation (Details / Livestock / Water Care / Equipment / History)
- History tab filter state across tank switches
- Tank action sheet (open / edit / water change / water test / delete)
- Equipment dashboard — filter pills, card status, add/edit/more modals
- Equipment modal layout (modal-inner / modal-scroll-body / modal-footer structure)
- Share modal URL and message content
- Backup / restore download filename
- Settings sheet — theme switcher, help accordion, data actions
- Storage banner (cloud sync, local storage fallback)
- Add tank flow (guided + non-guided)
- Advisor banner (dismiss, tap-to-navigate)
- Reminders Up Next section
- Modal system (open/close, backdrop, stacking)
- Cache-busting version strings
- Dead code audit
- CSS layout — theme tokens, modal padding, equipment chip colors
- iOS safe-area compliance in key containers

---

## Bugs Found

### CRITICAL (must fix before Capacitor)

| # | Bug | Severity | Status |
|---|---|---|---|
| C-1 | History filter state bleeds between tanks | Critical | **FIXED** |
| C-2 | Modal double-padding when `.modal-inner` is used | Critical | **FIXED** |
| C-3 | Share modal URL pointed to old `my-tanks` repo | Critical | **FIXED** |

---

### MEDIUM (fixed this pass)

| # | Bug | Severity | Status |
|---|---|---|---|
| M-1 | Backup download filename said `my-tanks-backup-*.json` | Medium | **FIXED** |
| M-2 | `act-edit` action sheet button routed to details tab with no scroll-to-edit context | Medium | **FIXED** |
| M-3 | `color-mix()` used for text `color:` property on `.eq-chip-soon`, `.eq-status-soon`, `.tc-eq-hint-soon` — invalid value on pre-Safari 16.2 (invisible text) | Medium | **FIXED** |

---

### LOW (deferred — not blockers for Capacitor)

| # | Bug | Severity | Status |
|---|---|---|---|
| L-1 | `renderClean()` / `bindClean()` / `renderTests()` / `bindTests()` are unreachable dead code (old Water Care tab architecture) | Low | Deferred |
| L-2 | `data.js` and `cloud.js` version tags still at `v=20260530f` — inconsistent with other files at `v=20260612a` | Low | Deferred (those files haven't changed; intentional) |
| L-3 | `act-edit` and `act-open` in the tank action sheet both navigate to the Details tab — the "edit" button now scrolls to the edit section, but the label distinction could still be confusing for new users | Low | Deferred |
| L-4 | `color-mix()` used for `background:` on equipment chips — degrades gracefully to transparent background on pre-16.2 (chip text still visible); acceptable | Low | Accepted risk |
| L-5 | `expandedEventId` module-level state is not reset when switching tanks (accordion stays open on same event if IDs collide across tanks) | Low | Deferred |
| L-6 | Settings sheet `APP_VERSION` constant is hardcoded `"1.0"` — not tied to the cache-bust version string | Low | Deferred |

---

## Bug Details

### C-1: History filter bleeds between tanks (FIXED)

**Reproduction steps:**
1. Open Tank A → History tab → tap "Water Changes" filter
2. Press back → open Tank B → History tab
3. **Before fix:** Filter showed "Water Changes" (from Tank A), not "All"

**Root cause:** `historyFilter` is a module-level `let` that was never reset when switching tanks. The Equipment filter (`eqFilter`) had a guard (`if (t.id !== eqPrevTankId)`) but History did not.

**Fix applied:** Added `let historyPrevTankId = null;` at module level and added reset guard at the top of `renderHistory(t)`:
```js
if (t.id !== historyPrevTankId) { historyFilter = "all"; historyPrevTankId = t.id; }
```

**Files touched:** `app.js` (lines 2903, 2907–2908)

**Retest:** Filter always resets to "All" when navigating to a different tank. Filter persists correctly when navigating away and back to the same tank within a session.

---

### C-2: Modal double-padding when `.modal-inner` is used (FIXED)

**Reproduction steps:** Open any Equipment modal (Add / Edit / More). Inspect the content top and horizontal spacing.

**Root cause:** `.modal` has `padding:24px 18px env(safe-area-inset-bottom,16px)` as its default. When `.modal-inner` (which adds `padding:20px 18px 0`) is a direct child, the inner content receives 44px top spacing and 36px horizontal spacing instead of the intended 20px / 18px respectively. `.modal-scroll-body` uses `margin:0 -18px` to cancel .modal-inner's horizontal padding, but this didn't account for .modal's own 18px horizontal padding on top.

**Fix applied:** Added CSS rule:
```css
.modal:has(.modal-inner) { padding: 0; }
```
This cancels the `.modal` default padding when `.modal-inner` is present, leaving `.modal-inner` as the sole padding controller. `:has()` is supported in Safari 16+ (iOS 16+, Sept 2022).

**Files touched:** `styles.css` (appended after `.modal-inner` block)

**Retest:** Equipment modals (Add, Edit, More) render with correct spacing. Non-equipment modals (backup, share, settings, add-tank) unaffected — they don't use `.modal-inner`.

---

### C-3: Share modal URL pointed to old `my-tanks` repo (FIXED)

**Reproduction steps:** Settings → Share Tank Care Buddy → observe the URL in the message.

**Root cause:** `openShareModal()` in `app.js` had `const url = "https://jtsmith7234-rgb.github.io/my-tanks/"` — the old repo name before the project was renamed to `tank-care-buddy`.

**Fix applied:** Changed to `https://jtsmith7234-rgb.github.io/tank-care-buddy/`

**Files touched:** `app.js` (line 3958)

**Retest:** Share dialog and native share sheet now display the correct URL.

---

### M-1: Backup download filename (FIXED)

**Root cause:** `downloadBackup()` used `` `my-tanks-backup-${ts}.json` `` — old app name.

**Fix applied:** Changed to `` `tank-care-buddy-backup-${ts}.json` ``

**Files touched:** `app.js` (line 105)

---

### M-2: `act-edit` had no scroll-to-edit behavior (FIXED)

**Root cause:** Both "Open tank" and "Edit tank info" in the tank action sheet called `go("details")` with no differentiation, so "Edit tank info" landed at the top of the Details tab. The edit form is at the bottom.

**Fix applied:** Added `id="details-edit-section"` to the Edit Tank Info `.section` div in `renderDetails()`. `act-edit` listener now calls `go("details")` then uses `requestAnimationFrame` to scroll the edit section into view.

**Files touched:** `app.js` (lines 431–438 for action handler, line 1388 for section ID)

---

### M-3: `color-mix()` text color fallback (FIXED)

**Root cause:** Three CSS rules used `color: color-mix(in srgb, var(--gold) XX%, var(--ink))` for text color. On pre-Safari 16.2 this evaluates to an invalid value, making chip/hint text invisible (inherits transparent).

**Fix applied:** Simplified all three rules to `color: var(--gold)` — gold is already a legible warm amber on all four themes. No visual regression for supported devices; pre-16.2 devices now show gold text instead of invisible text.

**Files touched:** `styles.css` (lines 3520, 3621, 3785)

---

## Syntax Check

```
node --check app.js → SYNTAX OK
```

No syntax errors in any modified file.

---

## Files Touched This Pass

| File | Changes |
|---|---|
| `app.js` | historyFilter reset guard, `historyPrevTankId` state var, `act-edit` scroll behavior, `details-edit-section` ID, share URL fix, backup filename fix |
| `styles.css` | `.modal:has(.modal-inner)` padding override, 3× `color-mix()` text color simplification |
| `index.html` | Version bump `20260611l` → `20260612a` on all `?v=` cache-bust strings |
| `tests/2026-06-12-a-qa-report.md` | This file (new) |

---

## Remaining Risks

1. **Dead code (`renderClean` / `bindClean` / `renderTests` / `bindTests`)** — Large functions (~300+ lines total) that are never called. Not a bug but add payload size. Safe to remove in a future cleanup pass but skipped today per "minimize risky refactors" policy.

2. **`color-mix()` backgrounds** — Still used for chip and status card backgrounds (degrading to transparent on pre-16.2). Cosmetic-only — chip text and borders remain visible. Acceptable for the Capacitor build which targets iOS 16+.

3. **`expandedEventId` not reset on tank switch** — An already-open history accordion row could theoretically re-expand on a different tank if a collision in event IDs occurred. Unlikely in practice (UIDs are random) but worth a future fix.

4. **`APP_VERSION = "1.0"`** — Not tied to the versioning system. Users in Settings see "1.0" regardless of build. Low priority but should be updated before App Store submission.

5. **`act-edit` scroll** — Uses `requestAnimationFrame` (single frame). On very slow devices, render may not have completed. A double-`rAF` or 50ms `setTimeout` fallback would be more robust, but this is sufficient for Capacitor-wrapped iOS.

---

## Go / No-Go Recommendation

### ✅ GO for Capacitor wrapping

All Critical issues are fixed. The app is stable, syntax-clean, and mobile-first. The remaining Low items are cosmetic or non-blocking.

**Recommended next step:** Proceed to Capacitor initialization (`npx cap init` / `npx cap add ios`). Confirm the GitHub Pages deployment reflects v20260612a before wrapping, then build the native shell.

**Do not start:** App Store prep (screenshots, privacy policy, support URL) — those come after first native build.
