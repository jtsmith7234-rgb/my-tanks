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

const FIRST_TANK_STAGES = [
  {
    key: "setup",
    daysOffset: 0,
    title: "Day 0 — Get your gear together",
    summary: "Grab everything before water goes in. Bigger tanks are easier than small ones.",
    need: [
      "A tank — 10 gallons or bigger (more water = more forgiving of mistakes)",
      "A filter rated for your tank size",
      "A heater (most tropical fish like 75–80°F)",
      "Gravel or sand for the bottom",
      "A water conditioner like Seachem Prime (removes chlorine from tap water)",
      "A bottle of starter bacteria (Fritz Turbo Start, Seachem Stability, or API Quick Start)",
      "A liquid water test kit (API Master Kit) — strips are less accurate",
      "A thermometer",
      "Optional: rocks, driftwood, or live plants for decoration"
    ],
    do: [
      "Pick the spot for the tank — somewhere level and strong enough to hold the weight",
      "Read the back of each box so you know what you're working with"
    ],
    expect: [
      "You'll have a pile of gear and an empty tank. That's the right starting point.",
      "Don't put any fish in yet — even one fish now would likely die in the first week."
    ],
    tip: "A 20-gallon tank is actually easier to keep stable than a 5-gallon. Bigger is friendlier for beginners."
  },
  {
    key: "fill",
    daysOffset: 1,
    title: "Day 1 — Fill it up",
    summary: "Add gravel, water, and turn the equipment on.",
    need: [
      "Everything from Day 0",
      "A clean bucket (never used with soap)"
    ],
    do: [
      "Rinse the gravel in plain water until it runs clear, then add it to the tank",
      "Place any rocks, wood, or plants",
      "Add tap water — and add water conditioner as you fill (it neutralizes chlorine before it kills anything)",
      "Plug in the filter and heater",
      "Wait a few hours for the temperature to settle around 75–80°F",
      "Run a baseline water test and log the numbers in the Tests tab"
    ],
    expect: [
      "The water may look cloudy at first — that's just dust from the gravel and it clears in a day or two.",
      "Your first test will likely show 0 ammonia, 0 nitrite, 0 nitrate. That's normal for a brand-new tank."
    ],
    tip: "Untreated tap water has chlorine, which kills the good bacteria you're about to grow. Always add conditioner."
  },
  {
    key: "cycle_start",
    daysOffset: 2,
    title: "Days 2–7 — Start growing good bacteria",
    summary: "You're 'cycling' the tank — growing invisible bacteria that turn fish waste into something safe.",
    need: [
      "Your starter bacteria bottle",
      "A pinch of fish food (yes, even with no fish)",
      "Your test kit"
    ],
    do: [
      "Add a dose of starter bacteria each day (follow the bottle)",
      "Drop a small pinch of fish food into the tank daily — it breaks down into ammonia, which feeds the bacteria",
      "Test ammonia every day or two and write down the number",
      "Still no fish — the tank isn't ready"
    ],
    expect: [
      "Ammonia will climb from 0 to maybe 1–4 ppm over the week. That's a good sign — it means the bacteria have food to grow on.",
      "The water may still look totally normal. The action is microscopic."
    ],
    tip: "Hobbyists call this a 'fishless cycle' — growing the bacteria first, so no fish get hurt. It's the safest way to start."
  },
  {
    key: "cycle_middle",
    daysOffset: 8,
    title: "Days 8–21 — The middle stretch",
    summary: "Ammonia starts dropping. A new number called nitrite shows up. This is the cycle working.",
    need: [
      "Patience — this is the slowest stage",
      "Your test kit"
    ],
    do: [
      "Test every 2–3 days",
      "Keep adding a tiny pinch of food so the bacteria don't starve",
      "Skip water changes for now — they'd slow down the bacteria you're trying to grow"
    ],
    expect: [
      "Ammonia falls toward 0",
      "Nitrite (the second number on your test kit) rises — sometimes high. This is expected, not a problem.",
      "Total time so far feels long. That's normal — most tanks take 3–6 weeks to fully cycle."
    ],
    tip: "If ammonia is dropping and nitrite is rising, the first half of the cycle is working. You're on track."
  },
  {
    key: "cycle_finish",
    daysOffset: 22,
    title: "Days 22–28 — Almost there",
    summary: "Nitrite drops to zero. A third number — nitrate — appears. That's the finish line.",
    need: [
      "Your test kit",
      "Water conditioner for the pre-fish water change"
    ],
    do: [
      "Test daily — you're close",
      "Watch for: ammonia 0, nitrite 0, nitrate 5–20 ppm",
      "When you hit those numbers two days in a row, the tank is cycled",
      "Do a 25–50% water change with conditioned tap water before adding any fish"
    ],
    expect: [
      "Nitrate (the third number) showing up is the sign you've been waiting for — it means the full bacteria chain works.",
      "After the water change, you're ready for your first fish."
    ],
    tip: "Adding fish to a tank that isn't cycled is the #1 cause of new-fish deaths. The wait is worth it."
  },
  {
    key: "first_fish",
    daysOffset: 30,
    title: "Day 30+ — Add your first fish",
    summary: "Start small. Pick hardy beginner fish. Don't fill the tank up all at once.",
    need: [
      "A short list of beginner-friendly fish (try the Fish tab and filter for beginners)",
      "A small bucket and a clip or clothespin"
    ],
    do: [
      "Buy 4–6 small hardy fish — not a full tank's worth",
      "Float the bag in the tank for 15 minutes so the water warms slowly",
      "Slowly mix tank water into the bag over another 20–30 minutes, then gently scoop the fish in (leave the store water behind)",
      "Test water 24 hours later — ammonia and nitrite should both still be 0",
      "Feed lightly the first week — less food means less waste",
      "Wait 2 weeks before adding any more fish"
    ],
    expect: [
      "Fish may hide for the first day or two — that's normal, they're new to the place.",
      "If ammonia or nitrite shows up after adding fish, do a 25% water change and recheck the next day."
    ],
    tip: "Easy starter fish: White Cloud Minnows, Zebra Danios, Platies, Bronze Cory Cats, or Cherry Shrimp."
  }
];

function getStartedDate(tank){
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

function renderFirstTankSection(tank){
  if (!tank.firstTank || !tank.firstTank.enabled){
    return `
      <div class="section first-tank-cta">
        <h2>🌱 First time setting up a tank?</h2>
        <p class="muted" style="margin-top:0">A simple, day-by-day walkthrough — what to buy, what to do, and what to expect. No prior knowledge needed.</p>
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
        <div class="ft-progress-text">${completedCount} of ${totalStages} steps done</div>
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
              ${_renderList("What you need", st.need, "ft-need")}
              ${_renderList("What to do", st.do, "ft-do")}
              ${_renderList("What to expect", st.expect, "ft-expect")}
              <div class="ft-tip"><b>Tip:</b> ${st.tip}</div>
              ${done
                ? `<button class="btn small secondary ft-uncomplete" data-stage="${st.key}">Mark as not done</button>`
                : locked
                  ? `<p class="muted small" style="margin:8px 0 0">Unlocks on day ${st.daysOffset}.</p>`
                  : `<button class="btn small ft-complete" data-stage="${st.key}">Mark this step done</button>`}
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
      if (!confirm("Hide First Tank Mode? Your progress is saved — you can turn it back on anytime.")) return;
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
