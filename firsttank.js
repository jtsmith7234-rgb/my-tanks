/* ============================================================
   FIRST TANK MODE — Guided new-tank walkthrough
   For people setting up their very first aquarium.
   Each stage is structured as:
     need[]   — what you should have on hand
     do[]     — what to actually do
     expect[] — what should happen if it's going right
   Plain language first. Hobby terms only when needed, with an
   inline plain-English explanation.
   ============================================================ */

// Each "do" item: { id, label, detail? } — id is stable so check state survives content tweaks.
const FIRST_TANK_STAGES = [
  {
    key: "setup",
    daysOffset: 0,
    title: "Before you start — Grab your gear",
    summary: "Get everything together before water goes in. Bigger tanks are actually easier than small ones.",
    need: [
      "A tank (10 gallons or bigger), a filter, a heater, and a thermometer",
      "Gravel, sand, or bare bottom",
      "Water conditioner (Seachem Prime is a safe pick)",
      "Starter bacteria (Fritz Turbo Start, Seachem Stability, or API Quick Start)",
      "A liquid test kit (API Master Kit works well — skip the paper strips)",
      "Optional: rocks, driftwood, or live plants if you want them"
    ],
    do: [
      { id:"gear",  label:"Pick up your starter gear", detail:"You don't need anything fancy. The list above is all of it." },
      { id:"place", label:"Pick a spot for the tank", detail:"Somewhere level and solid. A filled 20-gallon tank weighs about 200 lbs, so it can't go on anything wobbly." },
      { id:"read",  label:"Glance over the instructions on each box", detail:"No need to memorize anything. Just get a feel for what each thing does before you turn it on." }
    ],
    expect: [
      "You'll have a pile of gear and an empty tank. That's exactly where you should be.",
      "No fish yet — not even one. The tank isn't ready for them, and adding fish too early is the #1 reason new tanks fail."
    ],
    tip: "Bigger is easier. A 20-gallon tank is more forgiving than a 5-gallon because the extra water dilutes mistakes."
  },
  {
    key: "fill",
    daysOffset: 1,
    title: "Day 1 — Fill it up",
    summary: "Today you'll set the tank up: gravel, water, and turn the equipment on. No fish yet.",
    need: [
      "Everything from your gear list",
      "A clean bucket (one that's never had soap in it)"
    ],
    do: [
      { id:"rinse",   label:"Rinse the gravel and add it to the tank", detail:"Rinse it in plain water (no soap, ever) until the water runs clear. Then add rocks, wood, or plants while everything is still dry — it's way easier than fishing them in later." },
      { id:"fill",    label:"Add tap water and conditioner together", detail:"Pour water conditioner in as you fill. Tap water has chlorine, and chlorine kills the good bacteria you're about to grow. The conditioner takes care of that instantly. Start with Seachem Prime or any dechlorinator. After you fill, you can log it in the Chemicals section so you have a record of the first dose." },
      { id:"plug",    label:"Plug in the filter and heater", detail:"Set the heater to 78°F as a safe starting point. Let it run for 2–3 hours before checking with a thermometer — heaters often take longer than expected to stabilize." },
      { id:"basetest",label:"Do a first water test and save it", detail:"Use your liquid test kit and check ammonia, nitrite, nitrate, and pH. Everything should be near zero. Save the numbers in the Tests tab so you have a starting point." }
    ],
    expect: [
      "The water might look cloudy for a day or two — that's just dust from the gravel. It clears on its own.",
      "Your first test should show mostly zeros. That's normal and expected."
    ],
    tip: "If you forget anything today, it's fine. The conditioner is the only thing that absolutely has to go in before you walk away."
  },
  {
    key: "cycle_start",
    daysOffset: 2,
    title: "Days 2–7 — Grow the good bacteria",
    summary: "This is the part where the tank quietly gets ready for fish. You're growing invisible bacteria that handle fish waste safely.",
    need: [
      "Your starter bacteria bottle",
      "A tiny pinch of fish food (even though there are no fish)",
      "Your test kit"
    ],
    do: [
      { id:"dose",    label:"Add starter bacteria once a day", detail:"Use the dose on the back of the bottle. This is the bacteria you're trying to grow." },
      { id:"feed",    label:"Drop a tiny pinch of food in the tank each day", detail:"It breaks down and creates the ammonia those bacteria eat. No fish, but the bacteria still need food." },
      { id:"test",    label:"Test ammonia every couple of days", detail:"Just log the number. It'll go up this week — that's what you want." }
    ],
    expect: [
      "Ammonia goes from 0 up to maybe 1–4 ppm. That's a good thing right now.",
      "The water still looks totally normal. All the action is microscopic.",
      "Still no fish — we'll get there."
    ],
    tip: "This whole stage is called a 'fishless cycle.' Fancy name for a simple idea: grow the bacteria first, so no fish gets hurt while the tank ramps up."
  },
  {
    key: "cycle_middle",
    daysOffset: 8,
    title: "Days 8–21 — The slow middle",
    summary: "Not much to do here — just check on it. Ammonia drops, a new number called nitrite appears. That's the tank doing its job.",
    need: [
      "Your test kit",
      "Some patience — this stretch is the slowest"
    ],
    do: [
      { id:"test",    label:"Test the water every 2–3 days", detail:"You're watching for ammonia falling and nitrite rising. Both are good signs." },
      { id:"feed",    label:"Keep dropping a tiny pinch of food in daily", detail:"Don't stop now — the bacteria still need food to keep growing." },
      { id:"nochange",label:"Don't do a water change yet", detail:"A big water change here would slow down the bacteria. Wait until things finish up." }
    ],
    expect: [
      "Ammonia drops back toward 0.",
      "Nitrite shows up and may climb high — that's normal, not a problem.",
      "This is the longest stretch. Most tanks take 3–6 weeks total to fully cycle, and you're sitting in the middle of it."
    ],
    tip: "If ammonia is going down and nitrite is going up, everything is working. Trust the process."
  },
  {
    key: "cycle_finish",
    daysOffset: 22,
    title: "Days 22–28 — Almost ready",
    summary: "You're at the finish line. Nitrite drops to zero, a third number called nitrate shows up, and the tank is ready for fish.",
    need: [
      "Your test kit",
      "Water conditioner for one last water change before fish"
    ],
    do: [
      { id:"testdaily",label:"Test the water every day this week", detail:"You're looking for three numbers: ammonia 0, nitrite 0, and nitrate somewhere between 5–20 ppm." },
      { id:"confirm",  label:"Wait until you see those numbers two days in a row", detail:"One good day isn't enough. Two in a row is the green light — the tank is cycled." },
      { id:"prewc",    label:"Do a 25–50% water change before adding any fish", detail:"Use conditioned tap water. This drops the nitrate down so your new fish start in clean water." }
    ],
    expect: [
      "Nitrate showing up for the first time is the moment you've been waiting for. It means the full bacteria chain is working.",
      "After that water change, you're cleared to add your first fish."
    ],
    tip: "This is the part people get impatient about. Don't rush it — adding fish too early is the #1 reason new tanks fail."
  },
  {
    key: "first_fish",
    daysOffset: 30,
    title: "Day 30+ — Add your first fish",
    summary: "The wait is over. Start small with hardy beginner fish — don't fill the tank up all at once.",
    need: [
      "A small list of beginner fish (the Fish tab has a beginner filter)",
      "A small clean bucket and a clip or clothespin (to hold the bag while you acclimate them)"
    ],
    do: [
      { id:"pick",    label:"Pick 4–6 small, hardy fish to start", detail:"Don't stock the whole tank yet. Good first picks: White Clouds, Zebra Danios, Platies, Bronze Cories, or Cherry Shrimp." },
      { id:"accl",    label:"Take your time getting them in the tank", detail:"Float the bag in the tank for about 15 minutes so the water warms up to match. Then slowly add a little tank water to the bag every few minutes for 20–30 minutes. Finally, scoop the fish into the tank — don't pour the store water in." },
      { id:"checktest",label:"Test the water a day later", detail:"Ammonia and nitrite should both still be 0. If you see anything, do a 25% water change." },
      { id:"wait",    label:"Feed lightly and wait 2 weeks before adding more fish", detail:"Less food means less waste. Give the bacteria time to catch up before you add anything new." }
    ],
    expect: [
      "Fish often hide for the first day or two. That's normal — they're getting used to the new home.",
      "If ammonia or nitrite show up after the fish go in, do a 25% water change and check again the next day."
    ],
    tip: "You don't have to get this perfect. A 25% water change fixes almost any small problem that comes up in week one."
  }
];

/* ============================================================
   TANK-KIND EXTRAS — appended on top of the universal stages
   Keyed by stage.key. Each entry is { need?, do?, expect?, tip? }.
   Wording stays plain-language; jargon explained inline.
   ============================================================ */
const TANK_KIND_EXTRAS = {
  betta: {
    setup: {
      need: [
        "A tight-fitting lid — bettas are jumpers",
        "A heater (bettas need 76–82°F; they are tropical)",
        "A gentle filter or a filter with adjustable flow — bettas hate strong current"
      ],
      do: [
        "Pick smooth decor only — rough plastic plants can tear betta fins"
      ],
      tip: "Run a fingernail over every decoration. If it catches your nail, it'll catch a betta fin."
    },
    first_fish: {
      need: [
        "One betta. No tank mates yet — see how this one settles first"
      ],
      do: [
        "Float the bag, then add tank water slowly over 30 minutes — bettas are sensitive to sudden changes",
        "Feed 2–3 small pellets once a day. Bettas overeat easily."
      ],
      expect: [
        "Your betta may flare, sulk, or hide for a day or two. That's normal first-day stress."
      ]
    }
  },

  community: {
    setup: {
      need: [
        "At least 20 gallons — community tanks need swim space and dilute waste better"
      ],
      do: [
        "Plan your stocking before buying any fish. Open the Fish tab to check compatibility."
      ],
      tip: "Most community fish are schoolers — plan groups of 6+ for tetras, rasboras, danios."
    },
    first_fish: {
      need: [
        "A short list of hardy schooling fish — not a mix of singles"
      ],
      do: [
        "Add ONE species at a time. Wait 2 weeks between groups.",
        "Start with the most peaceful species first (tetras/rasboras), add bottom dwellers (cories) later"
      ],
      expect: [
        "Schooling fish look stressed when alone. A group of 6 will settle within a day or two."
      ]
    }
  },

  shrimp: {
    setup: {
      need: [
        "Plenty of live plants or moss — shrimp hide constantly and graze on biofilm",
        "A sponge over your filter intake — baby shrimp get sucked in otherwise",
        "Stable parameters more than perfect ones — shrimp hate sudden swings"
      ],
      do: [
        "Plan for a mature, fully cycled tank before adding shrimp — they're more sensitive than fish"
      ],
      tip: "Avoid copper-based medications or fertilizers — copper is toxic to shrimp."
    },
    cycle_finish: {
      do: [
        "For shrimp, wait an extra 1–2 weeks past cycle completion. Mature tanks grow biofilm that baby shrimp eat."
      ]
    },
    first_fish: {
      need: [
        "10–12 shrimp to start — they're social and breed better in groups"
      ],
      do: [
        "Drip-acclimate over 1–2 hours — slow drip from tank to bag using airline tubing",
        "Don't add fish that eat shrimp (most cichlids, bettas, large tetras)"
      ],
      expect: [
        "Shrimp will hide for the first week. You'll see them more once they feel safe.",
        "Berried (egg-carrying) females are a sign they're happy."
      ]
    }
  },

  planted: {
    setup: {
      need: [
        "Aquarium plant substrate or root-tab capable gravel — plants need something to root in",
        "A plant-friendly light (most LED aquarium lights work)",
        "Liquid fertilizer (Seachem Flourish or similar)"
      ],
      do: [
        "Pick easy starter plants: java fern, anubias, amazon sword, vallisneria, cryptocoryne"
      ],
      tip: "Anubias and java fern attach to wood/rock — do NOT bury their rhizome (the thick stem). It'll rot."
    },
    cycle_start: {
      do: [
        "Plant heavily from day one — plants use ammonia directly and speed up cycling"
      ],
      expect: [
        "Some plant melt (leaves dying back) in the first 1–2 weeks is normal. New growth replaces them."
      ]
    },
    first_fish: {
      do: [
        "Choose fish that don't dig or eat plants — avoid goldfish, large cichlids, silver dollars"
      ]
    }
  },

  species: {
    setup: {
      do: [
        "Research your one species before buying gear — their needs drive the whole setup",
        "Match temperature, pH, and tank size to that species specifically"
      ],
      tip: "Species-only tanks let you tune everything for one fish's ideal life. Worth the homework upfront."
    },
    first_fish: {
      do: [
        "Add the recommended group size all at once for schooling species, or just the pair for breeding species"
      ]
    }
  },

  quarantine: {
    setup: {
      need: [
        "A bare-bottom tank (no gravel) — easier to clean and spot waste/parasites",
        "Simple decor only: a few PVC pipes or a cheap plastic plant for cover",
        "A sponge filter — cheap, gentle, easy to sterilize between uses"
      ],
      do: [
        "Skip live plants — medications can kill them and they're hard to sterilize"
      ],
      tip: "Quarantine length is usually 2–4 weeks. Watch for spots, clamped fins, or odd swimming."
    },
    cycle_start: {
      do: [
        "You can run a quarantine tank uncycled if you do daily water changes and use Seachem Prime",
        "Or borrow filter media from an established tank to instantly seed bacteria"
      ]
    },
    first_fish: {
      do: [
        "Move new fish here BEFORE adding to your main tank — not after they're already sick",
        "Observe for 2–4 weeks. No new tank mates during that time."
      ]
    }
  },

  other: {} // no extras
};

function _mergeStage(base, extras){
  if (!extras) return base;
  return {
    ...base,
    need:   [...(base.need || []),   ...(extras.need || [])],
    do:     [...(base.do || []),     ...(extras.do || [])],
    expect: [...(base.expect || []), ...(extras.expect || [])],
    tip:    extras.tip || base.tip
  };
}

/* Returns the stages personalized for this tank's kind. */
function stagesForTank(tank){
  const kind = (tank.firstTank && tank.firstTank.kind) || tank.kind || "other";
  const extras = TANK_KIND_EXTRAS[kind] || {};
  const stages = FIRST_TANK_STAGES.map(st => _mergeStage(st, extras[st.key]));

  // Substrate-aware language substitution
  const substrate = ((tank.substrate || "").toLowerCase());
  const isSand = substrate.includes("sand");
  const isBare = substrate.includes("bare");
  stages.forEach(st => {
    if (st.key === "fill") {
      st.do = st.do.map(item => {
        if (item.id === "rinse") {
          if (isBare) {
            return { ...item, label: "Skip the substrate — bare bottom tank", detail: "No gravel or sand to rinse. Just make sure the glass is clean before filling." };
          } else if (isSand) {
            return { ...item, label: "Rinse the sand and add it to the tank", detail: "Sand needs a thorough rinse — run water through it until it runs mostly clear. Expect some initial cloudiness; it settles within a day." };
          }
          // Default: gravel (no change)
        }
        return item;
      });
    }
  });

  return stages;
}

function getStartedDate(tank){
  if (tank.firstTank && tank.firstTank.startedAt) return new Date(tank.firstTank.startedAt);
  if (tank.createdAt) return new Date(tank.createdAt);
  return new Date();
}

function currentStage(tank, stages){
  const list = stages || FIRST_TANK_STAGES;
  const started = getStartedDate(tank);
  const daysIn = Math.floor((Date.now() - started.getTime()) / 86400000);
  let cur = list[0];
  for (const st of list){
    if (daysIn >= st.daysOffset) cur = st;
  }
  return { stage: cur, daysIn };
}

function isComplete(tank, key){
  return !!(tank.firstTank && tank.firstTank.completed && tank.firstTank.completed[key]);
}

function _checked(tank, stageKey, itemId){
  return !!(tank.firstTank && tank.firstTank.checked && tank.firstTank.checked[stageKey] && tank.firstTank.checked[stageKey][itemId]);
}

// Used for need/expect lists (plain strings) only.
function _renderList(label, items, cls){
  if (!items || !items.length) return "";
  return `
    <div class="ft-block ${cls}">
      <div class="ft-block-label">${label}</div>
      <ul class="ft-block-list">
        ${items.map(item => `<li>${item}</li>`).join("")}
      </ul>
    </div>
  `;
}

// "What to do" — each item gets a checkbox bubble.
function _renderDoChecklist(tank, stage){
  const items = stage.do || [];
  if (!items.length) return "";
  return `
    <div class="ft-block ft-do">
      <div class="ft-block-label">What to do</div>
      <ul class="ft-check-list">
        ${items.map(it => {
          const isObj = typeof it === "object" && it !== null;
          const id = isObj ? it.id : String(it).slice(0,20);
          const label = isObj ? it.label : it;
          const detail = isObj ? it.detail : "";
          const on = _checked(tank, stage.key, id);
          return `
            <li class="ft-check-item ${on ? "on" : ""}">
              <button class="ft-check" data-stage="${stage.key}" data-item="${id}" aria-label="${on ? "Uncheck" : "Check"}: ${label.replace(/"/g,'&quot;')}" aria-pressed="${on}">
                <span class="ft-check-bubble" aria-hidden="true">${on ? "✓" : ""}</span>
                <span class="ft-check-text">
                  <span class="ft-check-label">${label}</span>
                  ${detail ? `<span class="ft-check-detail">${detail}</span>` : ""}
                </span>
              </button>
            </li>
          `;
        }).join("")}
      </ul>
    </div>
  `;
}

function renderFirstTankSection(tank){
  if (tank.firstTank && tank.firstTank.optedOut){
    return "";
  }

  // CHANGE 5: When allDone, show compact completion banner instead of full checklist
  if (tank.firstTank && tank.firstTank.allDone) {
    return `
      <div class="section ft-done-banner">
        <div class="ft-done-row">
          <span class="ft-done-icon">🌱</span>
          <div>
            <div class="ft-done-title">First tank complete</div>
            <div class="ft-done-sub muted small">Completed · Tap to view history</div>
          </div>
          <button class="btn small secondary ft-done-history" id="ft-done-history">History</button>
        </div>
      </div>
    `;
  }

  if (!tank.firstTank || !tank.firstTank.enabled){
    return `
      <div class="section first-tank-cta">
        <h2>🌱 First time setting up a tank?</h2>
        <p class="muted" style="margin-top:0">A simple, day-by-day walkthrough — what to buy, what to do, and what to expect. No prior knowledge needed.</p>
        <button class="btn block" id="enable-first-tank">Start First Tank Mode</button>
      </div>
    `;
  }

  const stages = stagesForTank(tank);
  const { daysIn } = currentStage(tank, stages);
  const totalStages = stages.length;
  const completedCount = stages.filter(s => isComplete(tank, s.key)).length;
  const kindLabel = (tank.firstTank && tank.firstTank.kind) || tank.kind || "";

  // Order: incomplete stages first (in original order), completed stages last.
  // The first incomplete stage is the "active" one and starts expanded.
  // Completed stages stay collapsed but remain tappable to reopen.
  const incomplete = stages.filter(s => !isComplete(tank, s.key));
  const completed  = stages.filter(s =>  isComplete(tank, s.key));
  const ordered = [...incomplete, ...completed];
  const activeKey = incomplete.length ? incomplete[0].key : null;

  return `
    <div class="section first-tank-active">
      <div class="ft-head">
        <h2>🌱 First Tank — Day ${daysIn}${kindLabel && kindLabel !== "other" ? ` · <span class="muted" style="font-weight:500;font-size:14px">${kindLabel.charAt(0).toUpperCase() + kindLabel.slice(1)}</span>` : ""}</h2>
        <button class="btn small secondary" id="ft-disable">Hide guide</button>
      </div>
      <div class="ft-progress">
        <div class="ft-progress-bar"><div class="ft-progress-fill" style="width:${(completedCount/totalStages*100)}%"></div></div>
        <div class="ft-progress-text">${completedCount} of ${totalStages} steps done</div>
      </div>

      ${ordered.map((st) => {
        const done = isComplete(tank, st.key);
        const active = st.key === activeKey;
        const expanded = active; // only the next-up stage is open by default
        // If user has equipment logged, show a small "Your equipment" note on the fill and cycle_start stages
        const hasEq = window.EQ && window.EQ.getItems(tank.id).length > 0;
        const showEqHint = hasEq && (st.key === "fill" || st.key === "cycle_start");
        return `
          <div class="ft-stage ${done ? "done" : ""} ${active ? "active" : ""}" data-stage-key="${st.key}">
            <div class="ft-stage-head" data-stage="${st.key}">
              <span class="ft-stage-icon">${done ? "\u2713" : active ? "\u25b6" : "\u25cb"}</span>
              <span class="ft-stage-title">${st.title}</span>
            </div>
            <div class="ft-stage-body" ${expanded ? "" : "hidden"}>
              <p class="ft-stage-summary">${st.summary}</p>
              ${_renderList("What you need", st.need, "ft-need")}
              ${_renderDoChecklist(tank, st)}
              ${showEqHint ? `
              <div class="ft-eq-hint">
                <span class="ft-eq-hint-label">Your equipment</span>
                <span class="ft-eq-hint-body">You've added equipment \u2014 check the Equipment tab for service schedules.</span>
                <button class="btn small secondary ft-eq-hint-btn" data-nav="equipment">View equipment \u203a</button>
              </div>` : ""}
              ${_renderList("What to expect", st.expect, "ft-expect")}
              <div class="ft-tip"><b>Tip:</b> ${st.tip}</div>
              ${done
                ? `<button class="btn small secondary ft-uncomplete" data-stage="${st.key}">Undo step</button>`
                : `<button class="btn small ft-complete" data-stage="${st.key}">Mark this step done</button>`}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

/* ============================================================
   NAVIGATION PROMPTS — shown as actionToasts when key items checked
   ============================================================ */
const FT_NAV_PROMPTS = {
  "fill:basetest":      { msg: "Ready to log your first water test?",          label: "Go \u2192", tab: "water-care" },
  "fill:fill":          { msg: "Time to add your conditioner. Tap to log it in your chemicals.", label: "Add chemical \u2192", tab: "water-care" },
  "cycle_start:dose":   { msg: "Good time to add your chemicals to the app.",   label: "Go \u2192", tab: "water-care" },
  "first_fish:pick":    { msg: "Browse fish in the Livestock tab to find yours.", label: "Go \u2192", tab: "fish" },
  "first_fish:accl":    { msg: "Add your fish to the tank in the Livestock tab.", label: "Go \u2192", tab: "fish" },
  "fill:plug":          { msg: "Add your equipment in the Equipment tab.",        label: "Go \u2192", tab: "equipment" }
};

/* Stage-completion messages — shown when a full stage auto-completes */
const FT_STAGE_COMPLETE_MSGS = {
  setup:         { msg: "Gear is ready \u2014 time to fill it up.",             label: null, tab: null },
  fill:          { msg: "Tank is filled! Cycling starts now.",                 label: null, tab: null },
  cycle_start:   { msg: "Cycling underway. Check back in a few days.",          label: null, tab: null },
  cycle_middle:  { msg: "Almost there \u2014 test daily this week.",            label: null, tab: null },
  cycle_finish:  { msg: "Cycle confirmed \u2014 you're ready for fish!",         label: "Add fish \u2192", tab: "fish" },
  first_fish:    null // handled by full completion flow
};

/* CHANGE 3: Full completion flow */
function _ftShowCompletion(tank, onChange) {
  tank.firstTank.completedAt = Date.now();
  tank.firstTank.allDone = true;

  // Log the completion event before the re-render
  window.logEvent && window.logEvent(tank.id, "first_tank_complete", {
    kind: tank.firstTank.kind || tank.kind || "freshwater"
  });

  // Signal app.js to show the rich completion modal after the re-render settles
  window._ftCompletionPending = tank.id;

  // Save and re-render via the special sentinel that skips duplicate logging
  onChange("__first_tank_complete__");
}

function bindFirstTank(tank, onChange){
  const enable = document.getElementById("enable-first-tank");
  if (enable){
    enable.addEventListener("click", () => {
      tank.firstTank = {
        enabled: true,
        startedAt: Date.now(),
        completed: {}
      };
      onChange("Started First Tank Mode");
    });
  }

  // CHANGE 5: Bind the History button on the done-banner
  const doneHistoryBtn = document.getElementById("ft-done-history");
  if (doneHistoryBtn) {
    doneHistoryBtn.addEventListener("click", () => {
      window._ftNavigateToTab && window._ftNavigateToTab("history");
    });
  }

  // Bind equipment hint nav buttons
  document.querySelectorAll(".ft-eq-hint-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      window._ftNavigateToTab && window._ftNavigateToTab("equipment");
    });
  });

  const disable = document.getElementById("ft-disable");
  if (disable){
    disable.addEventListener("click", () => {
      if (!confirm("Hide First Tank Mode? Your progress is saved \u2014 you can turn it back on anytime.")) return;
      tank.firstTank.enabled = false;
      onChange("Hidden First Tank Mode");
    });
  }

  document.querySelectorAll(".ft-stage-head").forEach(h => h.addEventListener("click", () => {
    const body = h.nextElementSibling;
    if (body) body.hidden = !body.hidden;
  }));

  document.querySelectorAll(".ft-complete").forEach(b => b.addEventListener("click", (e) => {
    e.stopPropagation();
    const key = b.dataset.stage;
    tank.firstTank.completed = tank.firstTank.completed || {};
    tank.firstTank.completed[key] = true;
    onChange("Completed: " + key);
  }));

  document.querySelectorAll(".ft-uncomplete").forEach(b => b.addEventListener("click", (e) => {
    e.stopPropagation();
    const key = b.dataset.stage;
    if (tank.firstTank.completed) delete tank.firstTank.completed[key];
    if (tank.firstTank.checked) delete tank.firstTank.checked[key]; // clear per-item checks too
    onChange("Reopened: " + key);
  }));

  // Per-item checkboxes inside each day card
  // BUG 6 FIX: Optimistic DOM update — toggle the .on class and bubble text
  // immediately before saving state, so the checkbox feels instant and smooth.
  // Only do a full re-render when the stage auto-completes (all items checked).
  document.querySelectorAll(".ft-check").forEach(b => b.addEventListener("click", (e) => {
    e.stopPropagation();
    const stageKey = b.dataset.stage;
    const itemId   = b.dataset.item;
    tank.firstTank.checked = tank.firstTank.checked || {};
    tank.firstTank.checked[stageKey] = tank.firstTank.checked[stageKey] || {};
    const isOn = !!tank.firstTank.checked[stageKey][itemId];
    const willBeOn = !isOn;

    // --- Optimistic DOM update (instant, no layout jump) ---
    const checkItem = b.closest(".ft-check-item");
    if (checkItem) checkItem.classList.toggle("on", willBeOn);
    const bubble = b.querySelector(".ft-check-bubble");
    if (bubble) bubble.textContent = willBeOn ? "\u2713" : "";
    b.setAttribute("aria-pressed", String(willBeOn));
    b.setAttribute("aria-label", (willBeOn ? "Uncheck" : "Check") + ": " + (b.querySelector(".ft-check-label")?.textContent || ""));

    // --- Persist state ---
    if (isOn) {
      delete tank.firstTank.checked[stageKey][itemId];
    } else {
      tank.firstTank.checked[stageKey][itemId] = true;
    }

    // CHANGE 1: Navigation prompts for key item checks (only when checking ON)
    if (willBeOn) {
      const promptKey = stageKey + ":" + itemId;
      const prompt = FT_NAV_PROMPTS[promptKey];
      if (prompt) {
        const tab = prompt.tab;
        window.actionToast && window.actionToast(
          prompt.msg,
          prompt.label,
          tab ? () => { window._ftNavigateToTab && window._ftNavigateToTab(tab); } : null
        );
      }
    }

    // Auto-mark the whole stage done when every "do" item is checked.
    const stages = stagesForTank(tank);
    const stage = stages.find(s => s.key === stageKey);
    let stageAutoCompleted = false;
    if (stage) {
      const items = stage.do || [];
      const allOn = items.length > 0 && items.every(it => {
        const id = (typeof it === "object" && it !== null) ? it.id : String(it).slice(0,20);
        return !!(tank.firstTank.checked[stageKey] && tank.firstTank.checked[stageKey][id]);
      });
      tank.firstTank.completed = tank.firstTank.completed || {};
      if (allOn && !tank.firstTank.completed[stageKey]) {
        tank.firstTank.completed[stageKey] = true;
        stageAutoCompleted = true;
      } else if (!allOn && tank.firstTank.completed[stageKey]) {
        // If user unchecks an item, don't keep the stage marked done
        delete tank.firstTank.completed[stageKey];
      }
    }

    if (stageAutoCompleted) {
      // CHANGE 3: Check if ALL stages are now complete
      const allStages = stagesForTank(tank);
      const everyStageDone = allStages.every(s => !!(tank.firstTank.completed && tank.firstTank.completed[s.key]));

      if (everyStageDone) {
        // Full completion — save first, then show modal
        _ftShowCompletion(tank, onChange);
      } else if (stageKey === "first_fish") {
        // first_fish stage completed but not all — shouldn't normally happen, but handle gracefully
        onChange("Stage completed: " + stageKey);
      } else {
        // CHANGE 2: Stage-completion contextual message
        const completion = FT_STAGE_COMPLETE_MSGS[stageKey];
        if (completion) {
          const tab = completion.tab;
          window.actionToast && window.actionToast(
            completion.msg,
            completion.label || null,
            (completion.label && tab) ? () => { window._ftNavigateToTab && window._ftNavigateToTab(tab); } : null
          );
        }

        // CHANGE 4: Flash the stage card before re-rendering
        const stageEl = document.querySelector(`.ft-stage[data-stage-key="${stageKey}"]`);
        if (stageEl) {
          stageEl.classList.add("ft-stage-flash-done");
          setTimeout(() => onChange("Stage completed: " + stageKey), 600);
        } else {
          onChange("Stage completed: " + stageKey);
        }
      }
    } else {
      // Just save without re-render (optimistic update already applied above)
      onChange(null); // null = save state only, skip full re-render if onChange supports it
    }
  }));
}

window.FIRSTTANK = {
  render: renderFirstTankSection,
  bind: bindFirstTank,
  stages: FIRST_TANK_STAGES
};
