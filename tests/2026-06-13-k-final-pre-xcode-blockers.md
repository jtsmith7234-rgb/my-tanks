# Final Pre-Xcode Blocker Pass QA Report
Date: 2026-06-13
Phases: 9–13
Version: v20260613o

---

## Phase 9 — Broken Actions

### FIX 1: actionToast navigation not working
- **Before:** `onAction()` was called *after* `el.remove()`, causing race conditions. `_ftNavigateToTab` used `window.view`/`window.render` (undefined locals).
- **After:** `onAction()` fires first; removal deferred via `setTimeout(..., 50)`. `_ftNavigateToTab` rewritten using local `view`/`render` refs. Duration extended to 8000ms. ✕ dismiss button added.

### FIX 2: ft-eq-hint "View equipment ›" link does nothing
- **Before:** Silently no-op'd because `_ftNavigateToTab` was broken.
- **After:** Resolved by FIX 1's rewrite. No separate code change needed — `firsttank.js` binding was already correct.

### FIX 3: Equipment action buttons (Inspect/Service) do nothing
- **Before:** `eq-mark-btn` silently called `EQ.markServiced()` with no user feedback.
- **After:** `[data-eq-mark]` click opens `_openEqMoreModal(t, item)` — a two-modal chain with type-specific guidance from `_getEqServiceGuide(item)` and a confirm "Mark as serviced" step.

### FIX 4: Guided mode sticky banner on equipment tab
- **Before:** After adding equipment in guided mode, user had no path back to the guide if they missed the actionToast.
- **After:** `renderEquipment` renders a `.guided-return-banner` with "Back to guide ›" when `t.firstTank.enabled && !t.firstTank.allDone`.

### FIX 5: Report a bug / Suggest a feature — proper modals
- **Before:** Both settings buttons called `toast(msg)` — text clipped, no mailto link visible.
- **After:** Both now open full `openModal()` flows with instructions + `mailto:tankcarebuddy@outlook.com` links with pre-filled subjects.

---

## Phase 10 — Layout Trust

### BUG 1: Input text floating handles (iOS select() jitter)
- **Before:** `input.select()` called synchronously on focus — caused iOS Safari pre-selection jitter before layout settled.
- **After:** `select()` deferred in `requestAnimationFrame()`. CSS added: `min-height: 44px; -webkit-appearance: none` for number/text/date inputs; `@supports (-webkit-touch-callout: none)` block for iOS date input height fix.

### BUG 2: Checklist bubble jitter
- **Before:** Rapid taps registered double-clicks, causing checklist flicker.
- **After:** `b.disabled = true` set immediately on click (re-enabled after 350ms). Persist + re-render wrapped in `setTimeout(..., 120)` so optimistic DOM update paints first.

### BUG 3: Header slogan clipping ("Care th…")
- **Before:** Tagline was inline in the h1 and clipped at small widths.
- **After:** Tagline moved to `<div class="home-welcome-tagline">` injected at top of `renderHome()` output, outside the header entirely. `.home-tagline { display: none }` suppresses the old inline span.

### BUG 4: Chemical dosage modal teal-on-teal
- **Before:** `#vp-manual` button used `.btn.link-btn` which inherited the modal's teal background — text invisible.
- **After:** Changed to `.btn.secondary` (glass-stroke border + ink color). Light-skin contrast override added in CSS.

### BUG 5: Scroll anchor / re-render jumpiness
- **Before:** Every `render()` call reset scroll to top, including same-screen checklist updates.
- **After:** `render()` saves `scrollTop` + `view.screen/tab` before rendering. `requestAnimationFrame` restores scroll only when screen and tab haven't changed. New-screen navigation correctly resets to top.

---

## Phase 11 — First-Run Logic

### FIX 1A: Water change save — stay on water-care tab
- **Before:** Both `#log-wc-btn` and `#log-btn` set `view.tab = "history"` after save, navigating away from Water Care.
- **After:** Both changed to `view.tab = "water-care"` before `render()`.

### FIX 1B: Water test save — confirmed no regression
- `#save-test` and `bindTests()` are legacy dead code; water test fields now save via `#log-wc-btn`. No change needed.

### FIX 1C: Equipment service/inspect done — confirmed correct
- `eq-inspect-done` already set `view.tab = "equipment"` after close. No change needed.

### FIX 1D: Fish add — confirmed correct
- `#add-fish-btn` handler doesn't change `view.tab`. No change needed.

### FIX 2: First-run Up Next cards
- **Before:** First-entry rows showed red "Due now" and offered Mark done/Snooze/Skip actions that don't make sense before any data exists.
- **After:** Rows with no prior log show `"Let's log your first {label} →"` in teal, "Never logged — set a baseline" as last text, and no action buttons. Row gets `upn-first` class. "Go do it ›" CTA still present.

### FIX 3: Completion modal scroll-to-top
- **Before:** After "Go to my tank" from completion modal, page stayed scrolled to bottom.
- **After:** `requestAnimationFrame` scroll-to-top added in `ftc-go-tank` handler.

### FIX 4–5: actionToast + guided-return-banner — confirmed correct (Phase 9 work)
- No additional changes needed.

---

## Phase 12 — Equipment & Livestock UX

### FIX 1: Equipment tab defaults to "All"
- **Before:** Default filter was `"month"` — new tanks with no recent entries showed an empty list.
- **After:** `eqFilter` defaults to `"all"`. Reset to `"all"` on tank switch. Filter order reordered: All | This week | This month | Upcoming.

### FIX 2: Equipment setup note — beginner-friendly copy
- **Before:** Count-heavy compact note: "ℹ️ Your setup: 3 essential, 2 recommended, 2 optional — Filter, Heater…"
- **After:** Clean `.eq-setup-note` block: "FOR A {TANK KIND}: [essential items dot-separated]. These are the basics. Add them below if you haven't yet." Uses `tankKindById(t.kind).label`.

### FIX 3: Fish tab — unified premium card flow
- **Before:** Two separate sections ("Add to tank" and "Browse species & compatibility") with separate inputs and confusing layout.
- **After:** Single `#add-species` input drives species suggestions, compat result, browse filtering, and add-form pre-population simultaneously. Layout: search card → two quick-action cards (Add a fish / Check compatibility) → browse list. `.active-card` border highlights when species selected. All existing add/delete/edit/browse/compat logic preserved.

---

## Phase 13 — Brand & Header

### FIX 1: Slogan unified — "Take care, taken care of."
- **Before:** `app.js` settings brand footer and `tutorial.js` hero tagline said "Care that shows."
- **After:** Both updated to "Take care, taken care of." — matching the website. The `home-welcome-tagline` in `app.js` was already correct from Phase 10.

### FIX 2: Header buttons — labeled icon buttons
- **Before:** Browse-species button had no label; add-tank button showed a bare + with no context.
- **After:** Both buttons now use `.ghost-btn-labeled` class with icon + small text label below: "Fish" (fish icon) and "Tank" (aquarium shape SVG with water line + plus inside). New CSS: `.ghost-btn-labeled`, `.ghost-btn-label`, sized overrides for `.btn-icon` and `.fish-btn-icon`.

### FIX 3: Tutorial welcome card content confirmed
- `tut-hero-tagline`: "Take care, taken care of." ✓ (updated in FIX 1)
- `tut-hero-headline`: "Keep every tank healthy." ✓ (was already correct from Phase 8)
- `tut-hero-support`: "Log care, track water, add fish, and stay on top of what's due — all in one place." ✓
- Card 0 `title` (aria label): "Keep every tank healthy." — matches ARIA usage ✓

### FIX 4A: Home screen empty state — welcoming redesign
- **Before:** "Let's add your first tank" plain heading with muted text, no CTA button.
- **After:** `.home-empty-state` flex column with 🐠 emoji, bold title "Welcome to Tank Care Buddy", descriptive sub-text, and "Add my first tank" `.btn` CTA wired to `openAddTank()`. "Load sample tanks" and First Tank Mode note preserved below.

### FIX 4B: Tank card health dot — no regression detected
- Tank card CSS confirmed intact from Phase 8. Box-shadow and health dot rendering unchanged.

### FIX 4C: Tutorial progress dots — no regression
- Dot rendering confirmed correct from Phase 8. Active dot elongated/highlighted as designed.

### FIX 4D: Settings "Owned by" — updated to "Tank Care Buddy"
- **Before:** `<span class="settings-value">The Pop Umbrella</span>` — internal team name, confusing to testers.
- **After:** `<span class="settings-value">Tank Care Buddy</span>`

### FIX 4E: Tab label "Livestock" → "Fish"
- **Before:** Fish tab label was "Livestock" — unfamiliar to beginners.
- **After:** Changed to "Fish" — immediately clear to all users.

### FIX 4F: Water Care chemicals empty state padding
- Confirmed: `<p class="muted center" style="margin:10px 0 0">No chemicals added. Tap <b>+ Add</b> to pick what you use.</p>` — renders with class-level padding from `.muted` + inline margin. Adequate spacing, no change needed.

---

## Files Modified

### Across Phases 9–13:
| File | Phases |
|------|--------|
| `app.js` | 9, 10, 11, 12, 13 |
| `styles.css` | 9, 10, 11, 12, 13 |
| `index.html` | 9 (→k), 10 (→l), 11 (→m), 12 (→n), 13 (→o) |
| `firsttank.js` | 10 |
| `tutorial.js` | 13 |

---

## Issues That Could Not Be Fully Solved

1. **Checklist re-enable timing (350ms):** The button disabled lock after tap may feel sluggish on quick unchecking. Workaround: 350ms was chosen to prevent double-registration. Could be reduced to 200ms in a future pass if testers report it.

2. **Android date input height:** The `@supports (-webkit-touch-callout)` guard only targets iOS WebKit. Android Chrome date inputs may have minor height inconsistencies — not yet reported, deferred.

3. **`_ftNavigateToTab` silent no-op from home screen:** If a First Tank Mode actionToast fires while user is on the home screen (not in a tank), the tab navigation silently no-ops. This is correct defensive behavior but could be surprising in testing.

4. **Phase 12 parallel commit timing:** Phase 11 and 12 ran concurrently. Phase 12 changes landed in `app.js`/`styles.css` before Phase 11's commit, so Phase 11's commit (`1c7ae7a`) already contained Phase 12 code. Phase 12 only committed the `index.html` version bump. No functional regression, but git blame for Phase 12 CSS/JS changes points to Phase 11's commit hash.

---

## Remaining Non-Blocking Items

- **Equipment "Quick log" shortcut:** The `_openEqMoreModal` two-tap flow is correct but slightly friction-heavy for power users who want to log a service in one tap. A direct "Quick log" button inside the modal could be added post-launch.
- **Scroll restore race:** Two rapid back-to-back re-renders (e.g., auto-toast + re-render) could briefly race the scroll position guard. Unlikely in practice, deferred.
- **Water Care empty state padding:** Currently relies on class-level padding. Could be elevated to a dedicated `.chemicals-empty-state` component for consistency in a future design pass.
- **Settings share button:** "Share Tank Care Buddy" uses a native share sheet. No deep integration yet — valid for launch.
- **Tutorial card 0 `title` field:** Set to "Keep every tank healthy." for aria use; the welcome card hero overrides visual display. Functionally correct but slightly semantically redundant. Fine for launch.

---

## Phase Complete

Yes — all 5 phases (9–13) complete. Ready for final personal validation test before Xcode export.

**Version:** `?v=20260613o`  
**Branch:** `main`  
**Final commit message:** Phase 13 brand + header v20260613o: slogan unified, labeled buttons, tab label fish, premium audit
