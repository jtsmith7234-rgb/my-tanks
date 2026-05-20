/* ---------------------------------------------------------
   SAMPLE TANK DATA — opt-in demo only.
   These are personal example tanks. They are NEVER loaded
   automatically. A fresh install starts with zero tanks so
   new users get a clean app. Sample data is offered as an
   opt-in "Load sample data" button in Backup & Settings.

   Legacy alias DEFAULT_TANKS = SAMPLE_TANKS kept at bottom
   of this file so older code paths don't break.
   --------------------------------------------------------- */
/* Curated showcase: 4 sample tanks chosen to demonstrate the
   variety the app supports — community, betta, shrimp, coldwater.
   These are NOT real personal tanks. Every new visitor who taps
   "Load sample tanks" sees this exact same set. */
const SAMPLE_TANKS = [
  {
    id: "sample-community-40",
    name: "Community Showcase (40g)",
    kind: "community",
    gallons: 40,
    type: "Freshwater Community — Planted",
    substrate: "Fine natural gravel",
    decor: "Driftwood, java fern, anubias, amazon sword",
    notes: "Sample tank. Mid-size planted community with peaceful schooling fish and a cleanup crew.",
    fish: [
      { id: "sc1", species: "Neon Tetra",      count: 8, name: "" },
      { id: "sc2", species: "Harlequin Rasbora", count: 6, name: "" },
      { id: "sc3", species: "Bronze Cory",     count: 5, name: "" },
      { id: "sc4", species: "Otocinclus",      count: 3, name: "" },
      { id: "sc5", species: "Mystery Snail",   count: 2, name: "" }
    ]
  },
  {
    id: "sample-betta-10",
    name: "Betta Sanctuary (10g)",
    kind: "betta",
    gallons: 10,
    type: "Planted Betta",
    substrate: "Black sand",
    decor: "Indian almond leaves, live moss, smooth driftwood",
    notes: "Sample tank. Beginner-friendly single-betta setup with gentle flow.",
    fish: [
      { id: "sb1", species: "Betta",        count: 1, name: "Sample Betta" },
      { id: "sb2", species: "Nerite Snail", count: 2, name: "" }
    ]
  },
  {
    id: "sample-shrimp-5",
    name: "Shrimp Garden (5g)",
    kind: "shrimp",
    gallons: 5,
    type: "Nano Planted Shrimp",
    substrate: "Active aquasoil",
    decor: "Java moss, cholla wood, small lava rocks",
    notes: "Sample tank. Heavily planted shrimp-only nano. Stable parameters, no fish predators.",
    fish: [
      { id: "sh1", species: "Cherry Shrimp", count: 12, name: "" }
    ]
  },
  {
    id: "sample-goldfish-29",
    name: "Goldfish Pair (29g)",
    kind: "species",
    gallons: 29,
    type: "Coldwater Species-Only",
    substrate: "Large smooth river rock",
    decor: "Hardy plants (anubias, java fern), no sharp decor",
    notes: "Sample tank. No heater. Coldwater setup — very different from tropical tanks.",
    fish: [
      { id: "sg1", species: "Fancy Goldfish", count: 2, name: "" }
    ]
  }
];

// Legacy alias — older references still resolve, but the
// app should treat a missing store as EMPTY, not as SAMPLE_TANKS.
const DEFAULT_TANKS = SAMPLE_TANKS;

/* ---------------------------------------------------------
   DOSING RULES
   All doses are computed against the volume of NEW water
   being added back into the tank (standard practice).
   --------------------------------------------------------- */
const DOSING = {
  prime: {
    label: "Seachem Prime",
    mlPerGallon: 0.1,            // 1 mL per 10 gal
    rule: "1 mL per 10 gal of new water",
    cap_mL: 5                    // 1 capful = 5 mL
  },
  stability: {
    label: "Seachem Stability",
    mlPerGallon: 0.1,            // 1 mL per 10 gal (user-specified)
    rule: "1 mL per 10 gal of new water",
    cap_mL: 5
  },
  easygreen: {
    label: "Easy Green Fertilizer",
    pumpsPerGallon: 0.1,         // 1 pump per 10 gal
    rule: "1 pump per 10 gal of new water",
    mlPerPump: 1                 // ~1 mL per pump
  }
};
