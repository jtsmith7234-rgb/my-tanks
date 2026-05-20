/* ---------------------------------------------------------
   SAMPLE TANK DATA — opt-in demo only.
   These are personal example tanks. They are NEVER loaded
   automatically. A fresh install starts with zero tanks so
   new users get a clean app. Sample data is offered as an
   opt-in "Load sample data" button in Backup & Settings.

   Legacy alias DEFAULT_TANKS = SAMPLE_TANKS kept at bottom
   of this file so older code paths don't break.
   --------------------------------------------------------- */
const SAMPLE_TANKS = [
  {
    id: "tank-75",
    name: "75 Gallon Community",
    gallons: 75,
    type: "Freshwater Community",
    substrate: "Black gravel",
    decor: "Artificial plants",
    notes: "Main showpiece tank. Weekly ~50% water changes.",
    fish: [
      { id: "f1",  species: "Guppy",          count: 11, name: "" },
      { id: "f2",  species: "Molly",          count: 6,  name: "" },
      { id: "f3",  species: "Mollie (other)", count: 1,  name: "" },
      { id: "f4",  species: "Angelfish",      count: 2,  name: "" },
      { id: "f5",  species: "Heart Tetra",    count: 2,  name: "" },
      { id: "f6",  species: "Albino Tetra",   count: 3,  name: "" },
      { id: "f7",  species: "Fruit Tetra",    count: 2,  name: "" },
      { id: "f8",  species: "Cherry Barb",    count: 5,  name: "" },
      { id: "f9",  species: "Sucker Fish",    count: 2,  name: "" },
      { id: "f10", species: "Snail",          count: 2,  name: "" },
      { id: "f11", species: "Shrimp",         count: 1,  name: "" }
    ]
  },
  {
    id: "tank-buddha",
    name: "Buddha's Tank (11g Japanese)",
    gallons: 11,
    type: "Planted Betta (AIO Rimless)",
    substrate: "Aquasoil",
    decor: "Live spider wood bonsai with live moss, Japanese theme",
    notes: "Expensive UNS-style rimless AIO. Bonsai centerpiece.",
    fish: [
      { id: "b1", species: "Betta", count: 1, name: "Buddha" }
    ]
  },
  {
    id: "tank-tim",
    name: "Hellboy's Tank (5g)",
    gallons: 5,
    type: "Planted Betta",
    substrate: "Black sand",
    decor: "Live moss and driftwood",
    notes: "",
    fish: [
      { id: "t1", species: "Betta",       count: 1, name: "Hellboy" },
      { id: "t2", species: "Snail",       count: 1, name: "" },
      { id: "t3", species: "Sucker Fish", count: 1, name: "" }
    ]
  },
  {
    id: "tank-kelsey",
    name: "Moon Pie's Tank (5g)",
    gallons: 5,
    type: "Planted Betta",
    substrate: "Black sand",
    decor: "Live moss and driftwood",
    notes: "",
    fish: [
      { id: "k1", species: "Betta", count: 1, name: "Moon Pie" },
      { id: "k2", species: "Snail", count: 1, name: "" }
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
