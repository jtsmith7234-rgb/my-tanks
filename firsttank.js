/* ============================================================
   FIRST TANK MODE — Guided new-tank cycle walkthrough
   For users setting up their very first aquarium.
   Sources: Aqueon, Aquarium Co-Op, PetMD, Seachem.
   ============================================================ */

const FIRST_TANK_STAGES = [
  {
    key: "setup",
    daysOffset: 0,
    title: "Day 0 — Set up your tank",
    summary: "Get all the gear in place before water goes in.",
    checklist: [
      "Tank (10+ gallons recommended for beginners — bigger is more forgiving)",
      "Filter rated for your tank size",
      "Heater (75–80°F for most tropical fish)",
      "Substrate (gravel or sand) — rinsed",
      "Dechlorinator (Seachem Prime or similar)",
      "Bacteria starter (Stability, FritzZyme 7, or Quick Start)",
      "API Master Test Kit (liquid, not strips — much more accurate)",
      "Thermometer",
      "A few hardscape pieces (rocks, driftwood) and/or plants"
    ],
    tip: "Don't add fish yet. Even one fish before the cycle is done can die from ammonia poisoning."
  },
  {
    key: "fill",
    daysOffset: 1,
    title: "Day 1 — Fill the tank",
    summary: "Add water, treat with dechlorinator, plug in equipment.",
    checklist: [
      "Place tank on a level surface that can support the weight (8 lbs per gallon)",
      "Rinse and add substrate, hardscape, plants",
      "Fill with tap water — dose dechlorinator BEFORE or as you fill",
      "Plug in filter and heater",
      "Let temperature stabilize at 75–80°F",
      "Test water (pH, ammonia, nitrite, nitrate) — log baseline in the Tests tab"
    ],
    tip: "Tap water out of the faucet has chlorine/chloramine that will kill beneficial bacteria. Always dechlorinate."
  },
  {
    key: "cycle_start",
    daysOffset: 2,
    title: "Days 2–7 — Start the nitrogen cycle",
    summary: "Add bacteria starter daily. Add an ammonia source.",
    checklist: [
      "Dose bacteria starter daily per bottle directions",
      "Add an ammonia source — easiest: a small pinch of fish food daily (it decays into ammonia)",
      "OR use pure ammonia drops (~2–4 ppm) for a fishless cycle",
      "Test ammonia daily — should rise then start to fall as bacteria grow",
      "Don't add fish yet"
    ],
    tip: "The cycle is your tank growing the bacteria that turn fish waste (ammonia → nitrite → nitrate) into safe levels."
  },
  {
    key: "cycle_middle",
    daysOffset: 8,
    title: "Days 8–21 — Watch ammonia drop, nitrite rise",
    summary: "Bacteria are working. Test every 2–3 days.",
    checklist: [
      "Keep testing every 2–3 days",
      "Expect: ammonia drops toward 0, nitrite spikes (this is normal)",
      "Keep dosing a small ammonia source so bacteria don't starve",
      "Continue bacteria starter weekly",
      "DON'T do water changes yet — you'd reset the cycle"
    ],
    tip: "If you see nitrite rising while ammonia falls, congrats — the first half of your cycle is working."
  },
  {
    key: "cycle_finish",
    daysOffset: 22,
    title: "Days 22–28 — Cycle finishing up",
    summary: "Nitrite drops to 0. Nitrate appears.",
    checklist: [
      "Test daily now — you're close",
      "Cycled = ammonia 0, nitrite 0, nitrate 5–20 ppm, within 24 hours of dosing ammonia",
      "When you hit those numbers two days in a row, you're cycled",
      "Do a 25–50% water change with dechlorinated water before adding fish",
      "You're ready for your first fish"
    ],
    tip: "Patience here is everything. Adding fish to an uncycled tank is the #1 cause of new-fish deaths."
  },
  {
    key: "first_fish",
    daysOffset: 30,
    title: "Day 30+ — Add your first fish",
    summary: "Start small. Add hardy beginner species.",
    checklist: [
      "Start with 4–6 hardy fish — NOT a full stock",
      "Acclimate properly: float bag 15 min, then drip-acclimate 30+ min",
      "Test water 24 hours after adding fish — confirm 0 ammonia, 0 nitrite",
      "Feed lightly first week (less waste = safer cycle)",
      "Wait 2 weeks before adding more fish",
      "Browse the Fish tab — filter the species browser for beginner-friendly options"
    ],
    tip: "Recommended starters: White Cloud Mountain Minnows, Zebra Danios, Platies, Bronze Cory Cats, Cherry Shrimp."
  }
];

function getStartedDate(tank){
  // Use stored start date if present, otherwise tank.createdAt or now
  if (tank.firstTank && tank.firstTank.startedAt) return new Date(tank.firstTank.startedAt);
  if (tank.createdAt) return new Date(tank.createdAt);
  return new Date();
}

function currentStage(tank){
  const started = getStartedDate(tank);
  const daysIn = Math.floor((Date.now() - started.getTime()) / 86400000);
  let cur = FIRST_TANK_STAGES[0];
  for (const st of FIRST_TANK_STAGES){
    if (daysIn >= st.daysOffset) cur = st;
  }
  return { stage: cur, daysIn };
}

function isComplete(tank, key){
  return !!(tank.firstTank && tank.firstTank.completed && tank.firstTank.completed[key]);
}

function renderFirstTankSection(tank){
  if (!tank.firstTank || !tank.firstTank.enabled){
    return `
      <div class="section first-tank-cta">
        <h2>🌱 First time setting up a tank?</h2>
        <p class="muted" style="margin-top:0">A guided 30-day walkthrough — what to buy, when to cycle, when it's safe to add fish. Built for absolute beginners.</p>
        <button class="btn block" id="enable-first-tank">Start First Tank Mode</button>
      </div>
    `;
  }

  const { stage, daysIn } = currentStage(tank);
  const totalStages = FIRST_TANK_STAGES.length;
  const stageIdx = FIRST_TANK_STAGES.findIndex(s => s.key === stage.key);
  const completedCount = FIRST_TANK_STAGES.filter(s => isComplete(tank, s.key)).length;

  return `
    <div class="section first-tank-active">
      <div class="ft-head">
        <h2>🌱 First Tank — Day ${daysIn}</h2>
        <button class="btn small secondary" id="ft-disable">Hide</button>
      </div>
      <div class="ft-progress">
        <div class="ft-progress-bar"><div class="ft-progress-fill" style="width:${(completedCount/totalStages*100)}%"></div></div>
        <div class="ft-progress-text">${completedCount} of ${totalStages} stages complete</div>
      </div>

      ${FIRST_TANK_STAGES.map((st, i) => {
        const done = isComplete(tank, st.key);
        const active = i === stageIdx;
        const locked = daysIn < st.daysOffset && !done;
        return `
          <div class="ft-stage ${done ? "done" : ""} ${active ? "active" : ""} ${locked ? "locked" : ""}">
            <div class="ft-stage-head" data-stage="${st.key}">
              <span class="ft-stage-icon">${done ? "✓" : active ? "▶" : locked ? "🔒" : "○"}</span>
              <span class="ft-stage-title">${st.title}</span>
            </div>
            <div class="ft-stage-body" ${active || done ? "" : "hidden"}>
              <p class="ft-stage-summary">${st.summary}</p>
              <ul class="ft-checklist">
                ${st.checklist.map(item => `<li>${item}</li>`).join("")}
              </ul>
              <div class="ft-tip"><b>Tip:</b> ${st.tip}</div>
              ${done
                ? `<button class="btn small secondary ft-uncomplete" data-stage="${st.key}">Mark incomplete</button>`
                : locked
                  ? `<p class="muted small" style="margin:8px 0 0">Unlocks on day ${st.daysOffset}.</p>`
                  : `<button class="btn small ft-complete" data-stage="${st.key}">Mark complete</button>`}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
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

  const disable = document.getElementById("ft-disable");
  if (disable){
    disable.addEventListener("click", () => {
      if (!confirm("Hide First Tank Mode? Your progress is saved — you can re-enable anytime.")) return;
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
    onChange("Reopened: " + key);
  }));
}

window.FIRSTTANK = {
  render: renderFirstTankSection,
  bind: bindFirstTank,
  stages: FIRST_TANK_STAGES
};
