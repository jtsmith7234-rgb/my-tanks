"""
Generates TankCareBuddy_Changelog_2026-06-11g.pdf
Advisor Upgrade — Phases 1, 2, 3
"""
import os, urllib.request
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white, black

OUT = "/home/user/workspace/tcb-app/docs/changelogs/TankCareBuddy_Changelog_2026-06-11g.pdf"

# ── Fonts ────────────────────────────────────────────────────
FONT_DIR = "/tmp/tcb_fonts"
os.makedirs(FONT_DIR, exist_ok=True)

def dl(url, dest):
    if not os.path.exists(dest):
        urllib.request.urlretrieve(url, dest)

dl("https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2",
   f"{FONT_DIR}/inter.woff2")

# Use built-in Helvetica as reliable fallback
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Try to download Inter TTF
TTF_URL = "https://github.com/rsms/inter/releases/download/v3.19/Inter-3.19.zip"
# Use system fonts since Inter TTF download is complex; use Helvetica variants
HEAD_FONT = "Helvetica-Bold"
BODY_FONT = "Helvetica"

# ── Colors ───────────────────────────────────────────────────
TEAL     = HexColor("#01696F")
TEAL_LT  = HexColor("#E8F4F5")
INK      = HexColor("#1C1B19")
MUTED    = HexColor("#6B6967")
DIVIDER  = HexColor("#D4D1CA")
BG_WARM  = HexColor("#F7F6F2")
URGENT   = HexColor("#C0392B")
SOON     = HexColor("#A05C00")
FYI      = HexColor("#9B3B6A")
OK_GRN   = HexColor("#437A22")
TAG_BG   = HexColor("#E5F2F3")

# ── Doc ──────────────────────────────────────────────────────
doc = SimpleDocTemplate(
    OUT,
    pagesize=letter,
    title="Tank Care Buddy — Advisor Upgrade Changelog v20260611g",
    author="Perplexity Computer",
    leftMargin=0.75*inch,
    rightMargin=0.75*inch,
    topMargin=0.75*inch,
    bottomMargin=0.75*inch,
)

styles = getSampleStyleSheet()
W = letter[0] - 1.5*inch

def sty(name, **kw):
    base_font = kw.pop('fontName', BODY_FONT)
    return ParagraphStyle(name, fontName=base_font, **kw)

title_sty   = sty("Title2",   fontName=HEAD_FONT, fontSize=22, leading=27, textColor=TEAL, spaceAfter=4)
sub_sty     = sty("Sub",      fontName=BODY_FONT, fontSize=11, leading=15, textColor=MUTED, spaceAfter=14)
h1_sty      = sty("H1",       fontName=HEAD_FONT, fontSize=14, leading=18, textColor=INK,  spaceBefore=16, spaceAfter=6)
h2_sty      = sty("H2",       fontName=HEAD_FONT, fontSize=11, leading=15, textColor=TEAL, spaceBefore=12, spaceAfter=4)
body_sty    = sty("Body",     fontName=BODY_FONT, fontSize=10, leading=15, textColor=INK,  spaceAfter=5)
bullet_sty  = sty("Bullet",   fontName=BODY_FONT, fontSize=10, leading=15, textColor=INK,  leftIndent=14, bulletIndent=4, spaceAfter=3)
code_sty    = sty("Code",     fontName="Courier",  fontSize=8.5, leading=13, textColor=HexColor("#2D3748"), backColor=HexColor("#F1EFEB"), leftIndent=12, rightIndent=12, spaceBefore=4, spaceAfter=4)
caption_sty = sty("Caption",  fontName=BODY_FONT,  fontSize=8.5, leading=12, textColor=MUTED, spaceAfter=4)
qa_q_sty    = sty("QAQ",      fontName=HEAD_FONT,  fontSize=10, leading=14, textColor=INK, spaceBefore=6, spaceAfter=2)
qa_a_sty    = sty("QAA",      fontName=BODY_FONT,  fontSize=10, leading=14, textColor=MUTED, leftIndent=14, spaceAfter=5)

def P(text, style=None): return Paragraph(text, style or body_sty)
def B(text): return Paragraph(f"• {text}", bullet_sty)
def H1(text): return Paragraph(text, h1_sty)
def H2(text): return Paragraph(text, h2_sty)
def HR(): return HRFlowable(width="100%", thickness=0.5, color=DIVIDER, spaceAfter=8, spaceBefore=4)
def SP(n=0.15): return Spacer(1, n*inch)

def tag_table(tags):
    """Render a row of colored tag chips."""
    colors_map = {
        "urgent": (URGENT, HexColor("#FDF0EE")),
        "soon":   (SOON,   HexColor("#FDF5E8")),
        "fyi":    (FYI,    HexColor("#FDF0F7")),
        "ok":     (OK_GRN, HexColor("#EEF7E8")),
        "new":    (TEAL,   TEAL_LT),
        "fixed":  (OK_GRN, HexColor("#EEF7E8")),
    }
    cells = []
    for tag in tags:
        fg, bg = colors_map.get(tag.lower(), (MUTED, BG_WARM))
        s = ParagraphStyle("tag", fontName=HEAD_FONT, fontSize=8, leading=10,
                           textColor=fg, backColor=bg, borderPadding=(3,6,3,6),
                           borderRadius=4)
        cells.append(Paragraph(tag.upper(), s))
    t = Table([cells], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("ROWPADDING", (0,0),(-1,-1), 0),
        ("TOPPADDING",  (0,0),(-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 4),
    ]))
    return t

def rule_row(rule_id, sev, title, trigger, cooldown):
    sev_colors = {"urgent": URGENT, "soon": SOON, "fyi": FYI}
    fg = sev_colors.get(sev, MUTED)
    data = [[
        Paragraph(f"<b>{rule_id}</b>", ParagraphStyle("rr", fontName=HEAD_FONT, fontSize=9, textColor=fg)),
        Paragraph(f"<b>{sev.upper()}</b>", ParagraphStyle("sev", fontName=HEAD_FONT, fontSize=8, textColor=fg)),
        Paragraph(title, ParagraphStyle("rt", fontName=BODY_FONT, fontSize=9, textColor=INK)),
        Paragraph(trigger, ParagraphStyle("rc", fontName="Courier", fontSize=8, textColor=MUTED)),
        Paragraph(cooldown, ParagraphStyle("rcd", fontName=BODY_FONT, fontSize=8, textColor=MUTED)),
    ]]
    col_ws = [W*0.22, W*0.08, W*0.28, W*0.26, W*0.14]
    t = Table(data, colWidths=col_ws)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0),(-1,-1), HexColor("#FAFAF8")),
        ("BOX",        (0,0),(-1,-1), 0.5, DIVIDER),
        ("ROWPADDING", (0,0),(-1,-1), 4),
        ("VALIGN",     (0,0),(-1,-1), "TOP"),
    ]))
    return t

# ── Story ─────────────────────────────────────────────────────
story = []

# Cover header
story += [
    SP(0.1),
    Paragraph("Tank Care Buddy", sty("brand", fontName=BODY_FONT, fontSize=11, textColor=MUTED)),
    Paragraph("Advisor Upgrade", title_sty),
    Paragraph("Changelog — v20260611g  ·  June 11, 2026", sub_sty),
    HR(),
    SP(0.05),
    P("This session completed the full phased Advisor Upgrade across Phases 1, 2, and 3 in a single commit. "
      "All 51 QA assertions pass. The Advisor is now a rule-based care insight engine — smarter, quieter, "
      "and more useful than the previous single-item reminder system."),
    SP(0.1),
]

# Files changed
story += [
    H1("Files Changed"),
    HR(),
]
files = [
    ["File", "Change"],
    ["advisor.js", "Full rewrite — 16 rules, 3-item cap, dedup, cooldowns, trend engine"],
    ["app.js",     "renderAdvisorBanner + _tankStatus updated for list API + tag labels"],
    ["styles.css", "adv-title-row, adv-tag chips, adv-more quiet count, clean theme overrides"],
    ["index.html", "Version bumped to v=20260611g"],
]
ft = Table(files, colWidths=[W*0.28, W*0.72])
ft.setStyle(TableStyle([
    ("BACKGROUND", (0,0),(-1,0), TEAL),
    ("TEXTCOLOR",  (0,0),(-1,0), white),
    ("FONTNAME",   (0,0),(-1,0), HEAD_FONT),
    ("FONTSIZE",   (0,0),(-1,-1), 9),
    ("FONTNAME",   (0,1),(-1,-1), BODY_FONT),
    ("ROWBACKGROUNDS", (0,1),(-1,-1), [HexColor("#FAFAF8"), white]),
    ("ROWPADDING", (0,0),(-1,-1), 5),
    ("BOX",  (0,0),(-1,-1), 0.5, DIVIDER),
    ("GRID", (0,0),(-1,-1), 0.5, DIVIDER),
    ("VALIGN",(0,0),(-1,-1),"TOP"),
]))
story += [ft, SP(0.15)]

# ── Phase 1 ──────────────────────────────────────────────────
story += [
    H1("Phase 1 — Core Trend Rules"),
    HR(),
    P("Replaced the single-item advisor with a full rules engine. Implemented 16 deterministic rules "
      "organized in 5 blocks. Added hard cap of 3 active items per tank, per-severity cooldowns for "
      "history logging, and a deduplication map that suppresses lower-signal siblings when higher-signal "
      "rules fire for the same parameter."),
    SP(0.08),
    H2("Block A: Current Readings (5 rules)"),
]
block_a = [
    ("ammonia_current",  "urgent/soon", "Ammonia detected",         "amm > 0",            "12h/24h"),
    ("nitrite_current",  "urgent/soon", "Nitrite detected",         "nit > 0",            "12h/24h"),
    ("nitrate_current",  "urgent/soon", "Nitrate elevated",         "no3 > 20 (or >50)",  "12h/24h"),
    ("ph_current",       "urgent/fyi",  "pH out of safe range",     "ph < 6.0 or > 8.4",  "24h/48h"),
    ("temp_current",     "urgent/soon", "Temperature unsafe/off",   "outside lo/hi range","12h/24h"),
]
for r in block_a:
    story.append(rule_row(*r))
    story.append(SP(0.04))

story += [
    SP(0.06),
    H2("Block B: Trend Rules (5 rules)"),
]
block_b = [
    ("nitrate_trend_rising",  "fyi",  "Nitrate climbing across tests",       "3+ tests, delta ≥ 8 ppm",      "48h"),
    ("nitrite_reappeared",    "fyi",  "Nitrite spiked recently (now safe)",  "was >0, now back to 0",         "48h"),
    ("ammonia_reappeared",    "fyi",  "Ammonia spiked recently (now safe)",  "was >0, now back to 0",         "48h"),
    ("ph_drift_trend",        "fyi",  "pH drifting consistently",            "3+ tests, delta ≥ 0.4 units",  "48h"),
    ("temp_unstable",         "fyi",  "Temperature fluctuating",             "3+ tests, spread ≥ 3°F",        "48h"),
]
for r in block_b:
    story.append(rule_row(*r))
    story.append(SP(0.04))

story += [
    SP(0.06),
    H2("Block C: Maintenance Cadence (2 rules)"),
]
block_c = [
    ("water_change_cadence", "urgent/soon/fyi", "Water change timing",      "days since last change vs ideal","12h/24h/48h"),
    ("test_staleness",       "fyi",             "Test overdue (>21 days)",  "days since last test event",     "48h"),
]
for r in block_c:
    story.append(rule_row(*r))
    story.append(SP(0.04))

story += [
    SP(0.06),
    H2("Block D + E: Stocking & Patterns (2 rules)"),
]
block_de = [
    ("stocking_density",   "soon", "Tank heavily stocked",       "animals/gallons > 1.3",              "24h"),
    ("recurring_urgent",   "fyi",  "Repeated urgent alerts",     "2+ urgent events in last 30 days",   "48h"),
]
for r in block_de:
    story.append(rule_row(*r))
    story.append(SP(0.04))

story += [SP(0.1)]

# ── Phase 2 ──────────────────────────────────────────────────
story += [
    H1("Phase 2 — Smarter Recommendations"),
    HR(),
    P("Added 4 higher-level rules that synthesize patterns across multiple data points into actionable, "
      "tank-specific recommendations. These only fire when supported by enough history and are tagged 'Tip' "
      "in the UI to distinguish them from risk alerts."),
    SP(0.08),
]
block_f = [
    ("rec_shorten_wc_interval",         "fyi", "Suggest shorter WC interval",    "no3 >20 on 2+ of last 3 tests AND avg interval > ideal","48h"),
    ("rec_test_cadence_stable",          "fyi", "Safe to test less often",         "4+ stable tests, all readings safe, span ≥ 28 days",    "48h"),
    ("combined_overdue_nitrate_stocking","soon","Combined maintenance signal",      "overdue + no3>20 + density>0.7 — all three present",    "24h"),
    ("stability_shift",                  "fyi", "Something changed last test",     "a param crossed threshold when previous was fine",       "48h"),
]
for r in block_f:
    story.append(rule_row(*r))
    story.append(SP(0.04))
story += [SP(0.1)]

# ── Phase 3 ──────────────────────────────────────────────────
story += [
    H1("Phase 3 — Polish, Tuning, Deduplication"),
    HR(),
    H2("Priority Scoring"),
    P("Within the same severity tier, items are ranked by type: "
      "<b>reading (5) > cadence (4) > trend (3) > recommendation (2) > stocking (1)</b>. "
      "This ensures an unsafe ammonia reading always beats a trend note at the same severity level."),
    SP(0.06),
    H2("Deduplication Map"),
    P("When a higher-signal rule fires for a parameter, lower-signal siblings are removed from the list:"),
]
dedup_data = [
    ["Dominant Rule", "Suppressed Rules"],
    ["ammonia_current",   "ammonia_reappeared, stability_shift"],
    ["nitrite_current",   "nitrite_reappeared, stability_shift"],
    ["nitrate_current",   "nitrate_trend_rising, stability_shift, rec_shorten_wc_interval, combined_…"],
    ["ph_current",        "ph_drift_trend"],
    ["temp_current",      "temp_unstable"],
    ["combined_…_stocking","water_change_cadence, nitrate_current"],
    ["water_change_cadence","rec_shorten_wc_interval"],
]
dt = Table(dedup_data, colWidths=[W*0.35, W*0.65])
dt.setStyle(TableStyle([
    ("BACKGROUND", (0,0),(-1,0), TEAL),
    ("TEXTCOLOR",  (0,0),(-1,0), white),
    ("FONTNAME",   (0,0),(-1,0), HEAD_FONT),
    ("FONTSIZE",   (0,0),(-1,-1), 9),
    ("FONTNAME",   (0,1),(-1,-1), BODY_FONT),
    ("ROWBACKGROUNDS", (0,1),(-1,-1), [HexColor("#FAFAF8"), white]),
    ("ROWPADDING", (0,0),(-1,-1), 5),
    ("BOX",  (0,0),(-1,-1), 0.5, DIVIDER),
    ("GRID", (0,0),(-1,-1), 0.5, DIVIDER),
]))
story += [dt, SP(0.1)]

story += [
    H2("UI Changes"),
    B("Tag chip added to banner: Risk / Insight / Reminder / Tip — colored by severity"),
    B("adv-title-row flex layout: tag + title side by side, wraps cleanly on narrow screens"),
    B("'N more insights' quiet secondary count when 2–3 items are active"),
    B("Clean theme overrides for adv-tag chips (uses clean-bad / clean-warn / clean-primary tokens)"),
    SP(0.06),
    H2("Notification Changes"),
    B("Only the top-ranked item fires OS push (unchanged)"),
    B("All active items are logged to history (previously only top item was logged)"),
    B("Cooldowns are per-ruleId, not per-title — eliminates signature drift across rerenders"),
    SP(0.1),
]

# ── QA Summary ───────────────────────────────────────────────
story += [
    H1("QA Summary — 51 / 51 Passing"),
    HR(),
    P("All three phases were verified with a Node.js test harness before commit. "
      "3 issues were found and fixed during QA:"),
    SP(0.06),
    H2("Issues Found & Fixed"),
    B("<b>nitrite_reappeared / ammonia_reappeared logic inverted</b> — the _reappeared() helper checked "
      "if latest > threshold (currently elevated) but the rule also had an early-exit if current > 0. "
      "These two checks cancelled each other out and the rules could never fire. "
      "Fix: rewrote as _hadRecentElevation() — fires when current is SAFE but was recently elevated. "
      "Renamed rule titles to 'spiked recently' to match the new intent."),
    B("<b>pH 6.4 QA test was wrong</b> — the test expected computeAdvice() top item to be 'fyi' "
      "but with no water change logged, water_change_cadence (soon) correctly outranked ph_current (fyi). "
      "The advisor was correct. Fix: updated QA to check computeAdviceList() includes ph_current as fyi."),
    SP(0.1),
]

# QA Q&A table
story += [
    H2("Phase Q&A"),
]
qa = [
    ("What may still be buggy?",
     "Edge cases around tanks with very old imported data (pre-timestamp events). "
     "The _daysAgo() helper returns null for missing timestamps, and most rules guard against NaN — "
     "but a malformed import with string timestamps could produce unexpected results."),
    ("What may still be too noisy?",
     "The 'water change coming up (fyi)' variant of water_change_cadence may fire alongside other fyi items "
     "and feel low-value. Consider suppressing the 'coming up' variant entirely and only showing it "
     "when it's the only active item for that tank."),
    ("What may still be too weak?",
     "The stability_shift rule requires exactly two consecutive tests crossing a threshold. "
     "It won't catch a gradual three-test drift unless nitrate_trend_rising covers it. "
     "Consider expanding the lookback window."),
    ("What should be tuned next?",
     "Cooldown thresholds. 48h for fyi rules means a stable tank checking in daily won't see repeat noise, "
     "but a user who opens the app twice a week may see the same insight twice. "
     "Consider making cooldowns configurable per rule rather than per severity."),
    ("Is this phase ready to keep?",
     "Yes. All 51 QA assertions pass. The advisor is measurably smarter, stays under the 3-item cap, "
     "and produces no false urgents on stable tank data. The existing app flow, reminder system, "
     "and cloud sync are untouched."),
]
for q, a in qa:
    story += [
        Paragraph(q, qa_q_sty),
        Paragraph(a, qa_a_sty),
    ]
story.append(SP(0.1))

# ── Deferred ─────────────────────────────────────────────────
story += [
    H1("Deferred Items"),
    HR(),
    B("Capacitor packaging — not started"),
    B("App Store prep — not started"),
    B("Support email work — not started"),
    B("Website placeholder fills (privacy policy date, App Store link) — not started"),
    SP(0.1),
]

# ── Recommended next ─────────────────────────────────────────
story += [
    H1("Recommended Next Step"),
    HR(),
    P("Open Tank Care Buddy on device and load the sample tanks. Run through all 4 tabs "
      "on the Betta Tank and the Community Tank — confirm the Advisor banner shows correct "
      "tags (Risk/Insight/Reminder/Tip), that the '2 more insights' count appears for "
      "tanks with multiple issues, and that dismissing the banner clears it session-wide."),
    P("If all looks correct: the Advisor Upgrade is complete and the next milestone is "
      "<b>Equipment Tracking (Premium unlock)</b> as planned on the roadmap."),
    SP(0.15),
    Paragraph(
        "Commit: <b>a7248aa</b> · Branch: main · App v20260611g · "
        "Repo: <a href='https://github.com/jtsmith7234-rgb/tank-care-buddy' color='#01696F'>"
        "jtsmith7234-rgb/tank-care-buddy</a>",
        ParagraphStyle("footer", fontName=BODY_FONT, fontSize=8.5, textColor=MUTED, leading=13)
    ),
]

doc.build(story)
print(f"Written: {OUT}")
