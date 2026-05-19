/* ============================================================
   CHEMICAL LIBRARY — Top 15 most-used freshwater products
   Doses pulled from each manufacturer's official site/KB.
   Source links included so users can confirm before dosing.
   ============================================================ */

const CHEM_TYPES = [
  "Dechlorinator",
  "Bacteria starter",
  "Fertilizer",
  "pH adjuster",
  "Algae / CO2 alt",
  "General"
];

const CHEM_LIBRARY = [
  // ----- Dechlorinators -----
  {
    id: "prime",
    brand: "Seachem",
    name: "Prime",
    type: "Dechlorinator",
    unit: "mL",
    mlPerGallon: 0.1,
    capSize: 5,
    rule: "1 mL per 10 gal of new water (1 cap = 5 mL = 50 gal)",
    when: "Every water change",
    source: "https://seachem.zendesk.com/hc/en-us/articles/115000125454"
  },
  {
    id: "api_water_conditioner",
    brand: "API",
    name: "Tap Water Conditioner",
    type: "Dechlorinator",
    unit: "mL",
    mlPerGallon: 0.0333,
    capSize: 5,
    rule: "1 mL per 30 gal of new water (highly concentrated)",
    when: "Every water change",
    source: "https://apifishcare.com/product/tap-water-conditioner"
  },
  {
    id: "tetra_aquasafe",
    brand: "Tetra",
    name: "AquaSafe Plus",
    type: "Dechlorinator",
    unit: "mL",
    mlPerGallon: 0.5,
    capSize: 5,
    rule: "5 mL per 10 gal of new water",
    when: "Every water change",
    source: "https://www.tetra-fish.com/products/water-care/aquasafe.aspx"
  },

  // ----- Bacteria starters -----
  {
    id: "stability",
    brand: "Seachem",
    name: "Stability",
    type: "Bacteria starter",
    unit: "mL",
    mlPerGallon: 0.5,
    capSize: 5,
    rule: "Day 1: 1 cap (5 mL) per 10 gal. Days 2–7: 1 cap per 20 gal daily. Monthly maintenance: 1 cap per 20 gal.",
    when: "First 7 days, then monthly + after water changes",
    source: "https://seachem.zendesk.com/hc/en-us/articles/115000127873"
  },
  {
    id: "fritzzyme7",
    brand: "Fritz",
    name: "FritzZyme 7",
    type: "Bacteria starter",
    unit: "oz",
    mlPerGallon: 11.83, // 4 oz per 10 gal = ~11.83 mL/gal
    capSize: 30,
    rule: "Cycling: 4 oz per 10 gal initial dose. Maintenance: 2 oz per 10 gal weekly until cycled.",
    when: "New tank cycle + after filter cleaning",
    source: "https://www.fritzaquatics.com/products/fritzzyme-7-live-nitrifying-bacteria-freshwater"
  },
  {
    id: "api_quickstart",
    brand: "API",
    name: "Quick Start",
    type: "Bacteria starter",
    unit: "mL",
    mlPerGallon: 1.0,
    capSize: 5,
    rule: "10 mL per 10 gal of aquarium water",
    when: "Every new fish addition or after filter cleaning",
    source: "https://apifishcare.com/product/quick-start"
  },
  {
    id: "tetra_safestart",
    brand: "Tetra",
    name: "SafeStart Plus",
    type: "Bacteria starter",
    unit: "mL",
    mlPerGallon: 2.5,
    capSize: 5,
    rule: "5 mL per 2 gal of aquarium water (entire bottle for full tank cycling)",
    when: "New tank setup, before adding fish",
    source: "https://www.tetra-fish.com/products/water-care/safestart-plus-8-45-oz.aspx"
  },

  // ----- Fertilizers -----
  {
    id: "easygreen",
    brand: "Aquarium Co-Op",
    name: "Easy Green All-in-One",
    type: "Fertilizer",
    unit: "pumps",
    mlPerGallon: 0.1, // 1 pump = 1 mL per 10 gal
    capSize: 1,
    rule: "1 pump per 10 gal. Once a week (low light) or twice a week (medium light).",
    when: "Weekly for planted tanks",
    source: "https://www.aquariumcoop.com/products/easy-green"
  },
  {
    id: "flourish",
    brand: "Seachem",
    name: "Flourish Comprehensive",
    type: "Fertilizer",
    unit: "mL",
    mlPerGallon: 0.0833, // 5 mL per 60 gal weekly = 0.0833 mL/gal
    capSize: 5,
    rule: "1 cap (5 mL) per 60 gal once or twice weekly",
    when: "Weekly for planted tanks",
    source: "https://www.seachem.com/flourish.php"
  },
  {
    id: "leafzone",
    brand: "API",
    name: "Leaf Zone",
    type: "Fertilizer",
    unit: "mL",
    mlPerGallon: 0.5, // 5 mL per 10 gal weekly
    capSize: 5,
    rule: "5 mL per 10 gal weekly (or after large water change)",
    when: "Weekly for planted tanks",
    source: "https://apifishcare.com/product/leaf-zone"
  },

  // ----- pH adjusters -----
  {
    id: "acid_buffer",
    brand: "Seachem",
    name: "Acid Buffer",
    type: "pH adjuster",
    unit: "g",
    mlPerGallon: 0.0264, // ~1/4 tsp per 40 L = ~0.0264 g/gal
    capSize: 1,
    rule: "1/4 tsp (~1 g) per 10 gal lowers pH ~0.1–0.2. Always test before adding more.",
    when: "Only when needed to lower pH",
    source: "https://www.seachem.com/acid-buffer.php"
  },
  {
    id: "alkaline_buffer",
    brand: "Seachem",
    name: "Alkaline Buffer",
    type: "pH adjuster",
    unit: "g",
    mlPerGallon: 0.0264,
    capSize: 1,
    rule: "1/4 tsp (~1 g) per 10 gal raises pH ~0.1–0.2. Always test before adding more.",
    when: "Only when needed to raise pH",
    source: "https://www.seachem.com/alkaline-buffer.php"
  },
  {
    id: "api_phup",
    brand: "API",
    name: "pH Up / pH Down",
    type: "pH adjuster",
    unit: "tsp",
    mlPerGallon: 0.025, // 1 tsp per 40 gal ~= 0.025 tsp/gal
    capSize: 1,
    rule: "1 tsp per 40 gal raises/lowers pH ~0.2. Add slowly across hours — never all at once.",
    when: "Only when needed to adjust pH",
    source: "https://apifishcare.com/product/ph-down"
  },

  // ----- Algae / CO2 alt -----
  {
    id: "excel",
    brand: "Seachem",
    name: "Flourish Excel",
    type: "Algae / CO2 alt",
    unit: "mL",
    mlPerGallon: 0.0833, // 5 mL per 50 gal daily, max 15 mL per 20 gal
    capSize: 5,
    rule: "Day 1 (new tank or large water change): 1 cap (5 mL) per 10 gal. Daily: 1 cap per 50 gal.",
    when: "Daily for planted tanks (carbon source)",
    source: "https://www.seachem.com/flourish-excel.php"
  },
  {
    id: "equilibrium",
    brand: "Seachem",
    name: "Equilibrium",
    type: "General",
    unit: "g",
    mlPerGallon: 0.42, // 16 g per 80 L (20 gal) = ~0.8 g/gal raises GH by 3
    capSize: 1,
    rule: "1 tbsp (~16 g) per 20 gal raises GH ~3 dKH. Use with RO/soft water.",
    when: "For RO water or very soft tap",
    source: "https://www.seachem.com/equilibrium.php"
  }
];

function chemById(id){
  return CHEM_LIBRARY.find(c => c.id === id) || null;
}

function chemsByType(type){
  return CHEM_LIBRARY.filter(c => c.type === type);
}

function calcDose(chem, gallons){
  if (!chem || !gallons || gallons <= 0) return { amount: 0, caps: 0 };
  const amount = chem.mlPerGallon * gallons;
  const caps = chem.capSize ? amount / chem.capSize : 0;
  return { amount, caps };
}

window.CHEMICALS = {
  TYPES: CHEM_TYPES,
  ALL: CHEM_LIBRARY,
  byId: chemById,
  byType: chemsByType,
  calc: calcDose
};
