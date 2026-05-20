/* ============================================================
   FISH DATABASE — ~60 popular freshwater species
   Sources: Aqueon care guides, SeriouslyFish, Tetra Aquarium,
   Petco care sheets, AquariumCoOp species profiles.
   Each entry is a starting point — always cross-check before stocking.
   ============================================================ */

const FISHDB = [
  // ----- Bettas / Anabantoids -----
  { name:"Betta (Siamese Fighting Fish)", sci:"Betta splendens", minGal:5, tempLo:76, tempHi:82, phLo:6.5, phHi:7.5, diet:"Carnivore", temperament:"Aggressive (males solo)", school:1, care:"Easy", notes:"One male per tank. No fin-nippers." },
  { name:"Dwarf Gourami", sci:"Trichogaster lalius", minGal:10, tempLo:72, tempHi:82, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Peaceful (skittish)", school:1, care:"Easy", notes:"One male per tank. Susceptible to Iridovirus." },
  { name:"Pearl Gourami", sci:"Trichopodus leerii", minGal:30, tempLo:77, tempHi:82, phLo:6.5, phHi:8.0, diet:"Omnivore", temperament:"Peaceful", school:1, care:"Easy", notes:"Needs surface cover. Great community fish." },
  { name:"Honey Gourami", sci:"Trichogaster chuna", minGal:10, tempLo:74, tempHi:82, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:1, care:"Easy", notes:"Calm alternative to dwarf gourami." },
  { name:"Paradise Fish", sci:"Macropodus opercularis", minGal:20, tempLo:61, tempHi:80, phLo:6.0, phHi:8.0, diet:"Omnivore", temperament:"Semi-aggressive", school:1, care:"Easy", notes:"Hardy but will nip slow fish." },

  // ----- Tetras -----
  { name:"Neon Tetra", sci:"Paracheirodon innesi", minGal:10, tempLo:70, tempHi:81, phLo:6.0, phHi:7.0, diet:"Omnivore", temperament:"Peaceful", school:6, care:"Easy", notes:"Group of 6+. Sensitive to nitrates." },
  { name:"Cardinal Tetra", sci:"Paracheirodon axelrodi", minGal:20, tempLo:73, tempHi:81, phLo:5.5, phHi:7.0, diet:"Omnivore", temperament:"Peaceful", school:6, care:"Moderate", notes:"Prefers soft acidic water." },
  { name:"Ember Tetra", sci:"Hyphessobrycon amandae", minGal:10, tempLo:73, tempHi:84, phLo:5.5, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:8, care:"Easy", notes:"Tiny orange schooler. Loves planted tanks." },
  { name:"Black Skirt Tetra", sci:"Gymnocorymbus ternetzi", minGal:15, tempLo:70, tempHi:79, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Semi-peaceful (fin nipper)", school:6, care:"Easy", notes:"Avoid with long-finned tankmates." },
  { name:"Serpae Tetra", sci:"Hyphessobrycon eques", minGal:20, tempLo:72, tempHi:79, phLo:5.0, phHi:7.5, diet:"Omnivore", temperament:"Semi-aggressive (fin nipper)", school:8, care:"Easy", notes:"Larger groups reduce nipping." },
  { name:"Rummy-nose Tetra", sci:"Hemigrammus rhodostomus", minGal:20, tempLo:75, tempHi:84, phLo:5.5, phHi:6.8, diet:"Omnivore", temperament:"Peaceful", school:8, care:"Moderate", notes:"Red nose pales when water quality drops." },
  { name:"Black Neon Tetra", sci:"Hyphessobrycon herbertaxelrodi", minGal:10, tempLo:73, tempHi:81, phLo:5.5, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:6, care:"Easy", notes:"Hardier than regular neons." },
  { name:"Glowlight Tetra", sci:"Hemigrammus erythrozonus", minGal:10, tempLo:72, tempHi:80, phLo:5.8, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:6, care:"Easy", notes:"Subtle orange stripe. Soft water preferred." },
  { name:"Bloodfin Tetra", sci:"Aphyocharax anisitsi", minGal:15, tempLo:64, tempHi:82, phLo:6.0, phHi:8.0, diet:"Omnivore", temperament:"Peaceful (active)", school:6, care:"Easy", notes:"Tolerates cooler water. Active swimmer." },
  { name:"Diamond Tetra", sci:"Moenkhausia pittieri", minGal:20, tempLo:73, tempHi:82, phLo:5.5, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:6, care:"Easy", notes:"Sparkly scales develop with age." },

  // ----- Rasboras / Danios -----
  { name:"Harlequin Rasbora", sci:"Trigonostigma heteromorpha", minGal:10, tempLo:72, tempHi:81, phLo:6.0, phHi:7.8, diet:"Omnivore", temperament:"Peaceful", school:6, care:"Easy", notes:"Hardy. Excellent community fish." },
  { name:"Chili Rasbora", sci:"Boraras brigittae", minGal:5, tempLo:68, tempHi:83, phLo:4.0, phHi:7.0, diet:"Omnivore", temperament:"Peaceful", school:8, care:"Moderate", notes:"Nano fish. Needs soft acidic water." },
  { name:"Celestial Pearl Danio", sci:"Danio margaritatus", minGal:10, tempLo:73, tempHi:79, phLo:6.5, phHi:7.5, diet:"Omnivore", temperament:"Peaceful (shy)", school:6, care:"Moderate", notes:"Heavily planted tank preferred." },
  { name:"Zebra Danio", sci:"Danio rerio", minGal:10, tempLo:64, tempHi:77, phLo:6.5, phHi:7.5, diet:"Omnivore", temperament:"Peaceful (active)", school:6, care:"Easy", notes:"Very hardy beginner fish. Cooler water OK." },
  { name:"Pearl Danio", sci:"Danio albolineatus", minGal:20, tempLo:68, tempHi:77, phLo:6.0, phHi:8.0, diet:"Omnivore", temperament:"Peaceful (active)", school:6, care:"Easy", notes:"Iridescent pearl sheen. Top-level swimmer." },
  { name:"Giant Danio", sci:"Devario aequipinnatus", minGal:30, tempLo:72, tempHi:75, phLo:6.0, phHi:8.0, diet:"Omnivore", temperament:"Peaceful (very active)", school:6, care:"Easy", notes:"Needs swimming room. Long tanks preferred." },

  // ----- Livebearers -----
  { name:"Guppy", sci:"Poecilia reticulata", minGal:5, tempLo:72, tempHi:82, phLo:6.8, phHi:7.8, diet:"Omnivore", temperament:"Peaceful", school:3, care:"Easy", notes:"Breeds prolifically. Keep more females than males." },
  { name:"Endler's Livebearer", sci:"Poecilia wingei", minGal:5, tempLo:72, tempHi:82, phLo:6.5, phHi:8.0, diet:"Omnivore", temperament:"Peaceful", school:3, care:"Easy", notes:"Smaller, hardier cousin of the guppy." },
  { name:"Platy", sci:"Xiphophorus maculatus", minGal:10, tempLo:70, tempHi:80, phLo:7.0, phHi:8.2, diet:"Omnivore", temperament:"Peaceful", school:3, care:"Easy", notes:"Hardy livebearer. Prefers harder water." },
  { name:"Swordtail", sci:"Xiphophorus hellerii", minGal:20, tempLo:72, tempHi:79, phLo:7.0, phHi:8.4, diet:"Omnivore", temperament:"Peaceful", school:3, care:"Easy", notes:"Males have signature tail extension." },
  { name:"Molly", sci:"Poecilia sphenops", minGal:20, tempLo:72, tempHi:78, phLo:7.5, phHi:8.5, diet:"Omnivore", temperament:"Peaceful", school:3, care:"Easy", notes:"Prefers hard alkaline water. Some keep in brackish." },

  // ----- Catfish / Loaches -----
  { name:"Bronze Cory Catfish", sci:"Corydoras aeneus", minGal:15, tempLo:72, tempHi:79, phLo:6.0, phHi:8.0, diet:"Omnivore (bottom)", temperament:"Peaceful", school:6, care:"Easy", notes:"Sand or smooth gravel only. Group of 6+." },
  { name:"Panda Cory Catfish", sci:"Corydoras panda", minGal:15, tempLo:68, tempHi:77, phLo:6.0, phHi:7.5, diet:"Omnivore (bottom)", temperament:"Peaceful", school:6, care:"Easy", notes:"Cooler water. Adorable panda markings." },
  { name:"Sterbai Cory Catfish", sci:"Corydoras sterbai", minGal:20, tempLo:73, tempHi:82, phLo:6.0, phHi:7.6, diet:"Omnivore (bottom)", temperament:"Peaceful", school:6, care:"Easy", notes:"Handles warmer water — pairs well with discus." },
  { name:"Pygmy Cory Catfish", sci:"Corydoras pygmaeus", minGal:10, tempLo:72, tempHi:79, phLo:6.4, phHi:7.4, diet:"Omnivore (bottom)", temperament:"Peaceful", school:8, care:"Easy", notes:"Tiny — swims mid-water in groups." },
  { name:"Otocinclus Catfish", sci:"Otocinclus vittatus", minGal:10, tempLo:72, tempHi:79, phLo:6.0, phHi:7.5, diet:"Herbivore (algae)", temperament:"Peaceful", school:4, care:"Moderate", notes:"Needs mature tank with biofilm/algae." },
  { name:"Bristlenose Pleco", sci:"Ancistrus cirrhosus", minGal:25, tempLo:73, tempHi:81, phLo:6.5, phHi:7.5, diet:"Omnivore (algae+wood)", temperament:"Peaceful", school:1, care:"Easy", notes:"Stays small (~5 in). Needs driftwood." },
  { name:"Common Pleco", sci:"Hypostomus plecostomus", minGal:75, tempLo:72, tempHi:86, phLo:6.5, phHi:7.5, diet:"Omnivore", temperament:"Peaceful (large)", school:1, care:"Moderate", notes:"Grows to 18+ inches. Massive waste producer." },
  { name:"Kuhli Loach", sci:"Pangio kuhlii", minGal:20, tempLo:75, tempHi:86, phLo:5.5, phHi:6.5, diet:"Omnivore (bottom)", temperament:"Peaceful (nocturnal)", school:5, care:"Moderate", notes:"Eel-like. Needs sand and hiding spots." },
  { name:"Yoyo Loach", sci:"Botia almorhae", minGal:30, tempLo:75, tempHi:86, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Semi-peaceful", school:5, care:"Easy", notes:"Active loach. Eats snails." },
  { name:"Clown Loach", sci:"Chromobotia macracanthus", minGal:75, tempLo:75, tempHi:85, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:5, care:"Moderate", notes:"Grows 12+ inches. Needs huge tank long-term." },

  // ----- Cichlids -----
  { name:"German Blue Ram", sci:"Mikrogeophagus ramirezi", minGal:20, tempLo:78, tempHi:85, phLo:5.0, phHi:7.0, diet:"Omnivore", temperament:"Peaceful (sensitive)", school:2, care:"Moderate", notes:"Warm soft water. Stable parameters critical." },
  { name:"Bolivian Ram", sci:"Mikrogeophagus altispinosus", minGal:20, tempLo:72, tempHi:79, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:2, care:"Easy", notes:"Hardier than German ram. Great dwarf cichlid." },
  { name:"Apistogramma Cacatuoides", sci:"Apistogramma cacatuoides", minGal:20, tempLo:75, tempHi:82, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Semi-peaceful (territorial)", school:1, care:"Moderate", notes:"One male with multiple females." },
  { name:"Angelfish", sci:"Pterophyllum scalare", minGal:30, tempLo:75, tempHi:84, phLo:6.8, phHi:7.8, diet:"Omnivore", temperament:"Semi-aggressive when breeding", school:1, care:"Moderate", notes:"Tall tank (18+ inches). Will eat neon tetras." },
  { name:"Kribensis", sci:"Pelvicachromis pulcher", minGal:20, tempLo:75, tempHi:81, phLo:6.5, phHi:7.5, diet:"Omnivore", temperament:"Semi-aggressive (breeding)", school:2, care:"Easy", notes:"Cave spawner. Hardy dwarf cichlid." },
  { name:"Convict Cichlid", sci:"Amatitlania nigrofasciata", minGal:30, tempLo:74, tempHi:82, phLo:6.6, phHi:7.8, diet:"Omnivore", temperament:"Aggressive", school:1, care:"Easy", notes:"Will breed and defend territory fiercely." },
  { name:"Discus", sci:"Symphysodon aequifasciatus", minGal:55, tempLo:82, tempHi:88, phLo:6.0, phHi:7.0, diet:"Carnivore", temperament:"Peaceful", school:5, care:"Hard", notes:"Expert fish. Soft warm water, pristine conditions." },
  { name:"Oscar", sci:"Astronotus ocellatus", minGal:75, tempLo:74, tempHi:81, phLo:6.0, phHi:7.5, diet:"Carnivore", temperament:"Aggressive", school:1, care:"Moderate", notes:"Grows 12+ inches and produces a lot of waste — needs a very big tank and strong filtration." },
  { name:"Yellow Lab Cichlid", sci:"Labidochromis caeruleus", minGal:40, tempLo:75, tempHi:82, phLo:7.8, phHi:8.6, diet:"Omnivore", temperament:"Semi-aggressive", school:3, care:"Easy", notes:"African Rift Lake. Hard alkaline water." },

  // ----- Other community -----
  { name:"White Cloud Mountain Minnow", sci:"Tanichthys albonubes", minGal:10, tempLo:60, tempHi:72, phLo:6.0, phHi:8.0, diet:"Omnivore", temperament:"Peaceful", school:6, care:"Easy", notes:"Coldwater-tolerant. Great for unheated tanks." },
  { name:"Cherry Barb", sci:"Puntius titteya", minGal:20, tempLo:73, tempHi:81, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:6, care:"Easy", notes:"Less nippy than other barbs." },
  { name:"Tiger Barb", sci:"Puntigrus tetrazona", minGal:20, tempLo:74, tempHi:79, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Semi-aggressive (fin nipper)", school:8, care:"Easy", notes:"Keep in groups of 8+ to reduce nipping." },
  { name:"Rainbow Shark", sci:"Epalzeorhynchos frenatum", minGal:50, tempLo:72, tempHi:79, phLo:6.5, phHi:7.5, diet:"Omnivore", temperament:"Aggressive (territorial)", school:1, care:"Moderate", notes:"One per tank. Not a true shark." },
  { name:"Red-tailed Black Shark", sci:"Epalzeorhynchos bicolor", minGal:55, tempLo:72, tempHi:79, phLo:6.5, phHi:7.5, diet:"Omnivore", temperament:"Aggressive", school:1, care:"Moderate", notes:"One per tank. Chases bottom-dwellers." },
  { name:"Siamese Algae Eater", sci:"Crossocheilus siamensis", minGal:30, tempLo:75, tempHi:79, phLo:6.5, phHi:8.0, diet:"Omnivore (algae)", temperament:"Peaceful (active)", school:1, care:"Easy", notes:"One of few fish that eats black beard algae." },
  { name:"Killifish (Golden Wonder)", sci:"Aplocheilus lineatus", minGal:20, tempLo:72, tempHi:79, phLo:6.0, phHi:8.0, diet:"Carnivore", temperament:"Semi-aggressive", school:1, care:"Moderate", notes:"Surface predator. Tight lid required." },
  { name:"Hatchetfish (Marble)", sci:"Carnegiella strigata", minGal:20, tempLo:75, tempHi:82, phLo:5.5, phHi:6.5, diet:"Carnivore (surface)", temperament:"Peaceful", school:6, care:"Moderate", notes:"Strong jumpers. Tight lid mandatory." },

  // ----- Goldfish -----
  { name:"Common Goldfish", sci:"Carassius auratus", minGal:75, tempLo:65, tempHi:72, phLo:7.0, phHi:8.4, diet:"Omnivore", temperament:"Peaceful (messy)", school:2, care:"Moderate", notes:"Grows 12+ inches. Pond fish — no tropical tankmates." },
  { name:"Fancy Goldfish", sci:"Carassius auratus (fancy)", minGal:30, tempLo:65, tempHi:75, phLo:7.0, phHi:8.4, diet:"Omnivore", temperament:"Peaceful", school:2, care:"Moderate", notes:"+10 gal per additional fancy. Strong filtration." },

  // ----- Invertebrates -----
  { name:"Cherry Shrimp", sci:"Neocaridina davidi", minGal:5, tempLo:65, tempHi:80, phLo:6.5, phHi:8.0, diet:"Omnivore (algae/biofilm)", temperament:"Peaceful", school:10, care:"Easy", notes:"No copper meds. Breeds easily." },
  { name:"Amano Shrimp", sci:"Caridina multidentata", minGal:10, tempLo:65, tempHi:80, phLo:6.0, phHi:7.5, diet:"Omnivore (algae)", temperament:"Peaceful", school:3, care:"Easy", notes:"Best algae-eating shrimp. Won't breed in freshwater." },
  { name:"Crystal Red Shrimp", sci:"Caridina cantonensis", minGal:10, tempLo:62, tempHi:76, phLo:5.8, phHi:6.8, diet:"Omnivore", temperament:"Peaceful", school:10, care:"Hard", notes:"Sensitive. Needs RO water and stable params." },
  { name:"Ghost Shrimp", sci:"Palaemonetes paludosus", minGal:5, tempLo:65, tempHi:82, phLo:7.0, phHi:8.0, diet:"Omnivore", temperament:"Peaceful (mostly)", school:5, care:"Easy", notes:"Cheap cleanup crew. Will eat baby shrimp." },
  { name:"Nerite Snail", sci:"Neritina natalensis", minGal:5, tempLo:72, tempHi:78, phLo:7.0, phHi:8.5, diet:"Herbivore (algae)", temperament:"Peaceful", school:1, care:"Easy", notes:"Best algae-eating snail. Eggs are infertile in fresh." },
  { name:"Mystery Snail", sci:"Pomacea bridgesii", minGal:5, tempLo:68, tempHi:82, phLo:7.0, phHi:8.0, diet:"Omnivore", temperament:"Peaceful", school:1, care:"Easy", notes:"Large peaceful snail. Needs calcium for shell." },
  { name:"Assassin Snail", sci:"Clea helena", minGal:5, tempLo:70, tempHi:80, phLo:7.0, phHi:8.0, diet:"Carnivore (snails)", temperament:"Peaceful to fish", school:1, care:"Easy", notes:"Eats pest snails. Won't bother fish or shrimp adults." }
];

function fishSearch(query, limit){
  const q = (query || "").toLowerCase().trim();
  if (!q) return [];
  const out = [];
  for (const f of FISHDB){
    if (f.name.toLowerCase().includes(q) || f.sci.toLowerCase().includes(q)){
      out.push(f);
      if (out.length >= (limit || 6)) break;
    }
  }
  return out;
}

function fishByName(name){
  if (!name) return null;
  const norm = name.toLowerCase().trim();
  return FISHDB.find(f => f.name.toLowerCase() === norm || f.sci.toLowerCase() === norm) || null;
}

function fishCard(f){
  if (!f) return "";
  const idealTemp = `${f.tempLo}–${f.tempHi}°F`;
  const idealPh   = `${f.phLo}–${f.phHi}`;
  return `
    <div class="fishdb-card">
      <div class="fishdb-head">
        <div class="fishdb-name">${f.name}</div>
        <div class="fishdb-sci">${f.sci}</div>
      </div>
      <div class="fishdb-grid">
        <div><span class="muted small">Min tank</span><b>${f.minGal} gal</b></div>
        <div><span class="muted small">Temp</span><b>${idealTemp}</b></div>
        <div><span class="muted small">pH</span><b>${idealPh}</b></div>
        <div><span class="muted small">Diet</span><b>${f.diet}</b></div>
        <div><span class="muted small">Temperament</span><b>${f.temperament}</b></div>
        <div><span class="muted small">Group</span><b>${f.school > 1 ? f.school+"+" : "1"}</b></div>
        <div><span class="muted small">Care</span><b>${f.care}</b></div>
      </div>
      <div class="fishdb-notes">${f.notes}</div>
    </div>
  `;
}

window.FISHDB_API = { all: FISHDB, search: fishSearch, byName: fishByName, card: fishCard };
