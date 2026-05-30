/* ============================================================
   FISH DATABASE — common freshwater fish-store species
   Sources: Aqueon care guides, SeriouslyFish, Tetra Aquarium,
   Petco care sheets, AquariumCoOp species profiles.
   Each entry is a starting point — always cross-check before stocking.

   Practical fields per entry:
     name        common name
     sci         scientific name
     minGal      minimum tank size (gallons)
     adult       adult size (inches, approximate)
     tempLo/Hi   temperature range (°F)
     phLo/Hi     pH range
     diet        feeding type
     temperament plain-language temperament
     school      group minimum (1 = fine solo)
     finNipper   true if it nips long fins
     shrimpRisk  true if it will hunt dwarf shrimp/snails
     care        care level
     notes       short practical note
   ============================================================ */

const FISHDB = [
  // ----- Bettas / Anabantoids -----
  { name:"Betta (Siamese Fighting Fish)", sci:"Betta splendens", minGal:5, adult:3, tempLo:76, tempHi:82, phLo:6.5, phHi:7.5, diet:"Carnivore", temperament:"Aggressive (males solo)", school:1, finNipper:false, shrimpRisk:true, care:"Easy", notes:"One male per tank. May eat shrimp. Dislikes other long-finned fish." },
  { name:"Dwarf Gourami", sci:"Trichogaster lalius", minGal:10, adult:3.5, tempLo:72, tempHi:82, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Peaceful (skittish)", school:1, finNipper:false, shrimpRisk:false, care:"Easy", notes:"One male per tank. Susceptible to Iridovirus." },
  { name:"Pearl Gourami", sci:"Trichopodus leerii", minGal:30, adult:4.5, tempLo:77, tempHi:82, phLo:6.5, phHi:8.0, diet:"Omnivore", temperament:"Peaceful", school:1, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Needs surface cover. Great community fish." },
  { name:"Honey Gourami", sci:"Trichogaster chuna", minGal:10, adult:2, tempLo:74, tempHi:82, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:1, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Calm alternative to dwarf gourami." },
  { name:"Paradise Fish", sci:"Macropodus opercularis", minGal:20, adult:4, tempLo:61, tempHi:80, phLo:6.0, phHi:8.0, diet:"Omnivore", temperament:"Semi-aggressive", school:1, finNipper:true, shrimpRisk:true, care:"Easy", notes:"Hardy but will nip slow fish." },

  // ----- Tetras -----
  { name:"Neon Tetra", sci:"Paracheirodon innesi", minGal:10, adult:1.5, tempLo:70, tempHi:81, phLo:6.0, phHi:7.0, diet:"Omnivore", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Group of 6+. Sensitive to nitrates. Eaten by angelfish." },
  { name:"Cardinal Tetra", sci:"Paracheirodon axelrodi", minGal:20, adult:2, tempLo:73, tempHi:81, phLo:5.5, phHi:7.0, diet:"Omnivore", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Moderate", notes:"Prefers soft acidic water." },
  { name:"Ember Tetra", sci:"Hyphessobrycon amandae", minGal:10, adult:0.8, tempLo:73, tempHi:84, phLo:5.5, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:8, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Tiny orange schooler. Loves planted tanks." },
  { name:"Black Skirt Tetra", sci:"Gymnocorymbus ternetzi", minGal:15, adult:2.5, tempLo:70, tempHi:79, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Semi-peaceful (fin nipper)", school:6, finNipper:true, shrimpRisk:false, care:"Easy", notes:"Avoid with long-finned tankmates." },
  { name:"Serpae Tetra", sci:"Hyphessobrycon eques", minGal:20, adult:1.75, tempLo:72, tempHi:79, phLo:5.0, phHi:7.5, diet:"Omnivore", temperament:"Semi-aggressive (fin nipper)", school:8, finNipper:true, shrimpRisk:false, care:"Easy", notes:"Larger groups reduce nipping." },
  { name:"Rummy-nose Tetra", sci:"Hemigrammus rhodostomus", minGal:20, adult:2, tempLo:75, tempHi:84, phLo:5.5, phHi:6.8, diet:"Omnivore", temperament:"Peaceful", school:8, finNipper:false, shrimpRisk:false, care:"Moderate", notes:"Red nose pales when water quality drops." },
  { name:"Black Neon Tetra", sci:"Hyphessobrycon herbertaxelrodi", minGal:10, adult:1.5, tempLo:73, tempHi:81, phLo:5.5, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Hardier than regular neons." },
  { name:"Glowlight Tetra", sci:"Hemigrammus erythrozonus", minGal:10, adult:1.5, tempLo:72, tempHi:80, phLo:5.8, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Subtle orange stripe. Soft water preferred." },
  { name:"Bloodfin Tetra", sci:"Aphyocharax anisitsi", minGal:15, adult:2, tempLo:64, tempHi:82, phLo:6.0, phHi:8.0, diet:"Omnivore", temperament:"Peaceful (active)", school:6, finNipper:true, shrimpRisk:false, care:"Easy", notes:"Tolerates cooler water. Can nip long fins if under-schooled." },
  { name:"Diamond Tetra", sci:"Moenkhausia pittieri", minGal:20, adult:2.4, tempLo:73, tempHi:82, phLo:5.5, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Sparkly scales develop with age." },
  { name:"Von Rio / Flame Tetra", sci:"Hyphessobrycon flammeus", minGal:15, adult:1.6, tempLo:72, tempHi:82, phLo:5.5, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Hardy red-orange schooler. Good beginner tetra." },
  { name:"Lemon Tetra", sci:"Hyphessobrycon pulchripinnis", minGal:15, adult:2, tempLo:73, tempHi:82, phLo:5.5, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Yellow tint with age. Calm community schooler." },
  { name:"Congo Tetra", sci:"Phenacogrammus interruptus", minGal:30, adult:3, tempLo:73, tempHi:82, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Moderate", notes:"Larger, shimmery tetra. Needs swimming room." },

  // ----- Rasboras / Danios -----
  { name:"Harlequin Rasbora", sci:"Trigonostigma heteromorpha", minGal:10, adult:2, tempLo:72, tempHi:81, phLo:6.0, phHi:7.8, diet:"Omnivore", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Hardy. Excellent community fish." },
  { name:"Chili Rasbora", sci:"Boraras brigittae", minGal:5, adult:0.7, tempLo:68, tempHi:83, phLo:4.0, phHi:7.0, diet:"Omnivore", temperament:"Peaceful", school:8, finNipper:false, shrimpRisk:false, care:"Moderate", notes:"Nano fish. Safe with shrimp. Needs soft acidic water." },
  { name:"Celestial Pearl Danio", sci:"Danio margaritatus", minGal:10, adult:1, tempLo:73, tempHi:79, phLo:6.5, phHi:7.5, diet:"Omnivore", temperament:"Peaceful (shy)", school:6, finNipper:false, shrimpRisk:false, care:"Moderate", notes:"Heavily planted tank preferred. Shrimp-safe." },
  { name:"Zebra Danio", sci:"Danio rerio", minGal:10, adult:2, tempLo:64, tempHi:77, phLo:6.5, phHi:7.5, diet:"Omnivore", temperament:"Peaceful (active)", school:6, finNipper:true, shrimpRisk:false, care:"Easy", notes:"Very hardy beginner fish. Can nip long fins if under-schooled." },
  { name:"Pearl Danio", sci:"Danio albolineatus", minGal:20, adult:2.5, tempLo:68, tempHi:77, phLo:6.0, phHi:8.0, diet:"Omnivore", temperament:"Peaceful (active)", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Iridescent pearl sheen. Top-level swimmer." },
  { name:"Giant Danio", sci:"Devario aequipinnatus", minGal:30, adult:4, tempLo:72, tempHi:75, phLo:6.0, phHi:8.0, diet:"Omnivore", temperament:"Peaceful (very active)", school:6, finNipper:false, shrimpRisk:true, care:"Easy", notes:"Needs swimming room. Long tanks preferred." },

  // ----- Livebearers -----
  { name:"Guppy", sci:"Poecilia reticulata", minGal:5, adult:2.2, tempLo:72, tempHi:82, phLo:6.8, phHi:7.8, diet:"Omnivore", temperament:"Peaceful", school:3, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Breeds prolifically. Long fins — avoid known fin-nippers." },
  { name:"Endler's Livebearer", sci:"Poecilia wingei", minGal:5, adult:1.5, tempLo:72, tempHi:82, phLo:6.5, phHi:8.0, diet:"Omnivore", temperament:"Peaceful", school:3, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Smaller, hardier cousin of the guppy." },
  { name:"Platy", sci:"Xiphophorus maculatus", minGal:10, adult:2.5, tempLo:70, tempHi:80, phLo:7.0, phHi:8.2, diet:"Omnivore", temperament:"Peaceful", school:3, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Hardy livebearer. Prefers harder water." },
  { name:"Swordtail", sci:"Xiphophorus hellerii", minGal:20, adult:5.5, tempLo:72, tempHi:79, phLo:7.0, phHi:8.4, diet:"Omnivore", temperament:"Peaceful", school:3, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Males have signature tail extension. Can jump." },
  { name:"Molly", sci:"Poecilia sphenops", minGal:20, adult:4.5, tempLo:72, tempHi:78, phLo:7.5, phHi:8.5, diet:"Omnivore", temperament:"Peaceful", school:3, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Prefers hard alkaline water. Some keep in brackish." },
  { name:"Sailfin Molly", sci:"Poecilia latipinna", minGal:30, adult:5.5, tempLo:72, tempHi:82, phLo:7.5, phHi:8.5, diet:"Omnivore", temperament:"Peaceful", school:3, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Large showy dorsal fin. Hard alkaline water." },

  // ----- Catfish / Loaches -----
  { name:"Bronze Cory Catfish", sci:"Corydoras aeneus", minGal:15, adult:2.5, tempLo:72, tempHi:79, phLo:6.0, phHi:8.0, diet:"Omnivore (bottom)", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Sand or smooth gravel only. Group of 6+." },
  { name:"Albino Cory Catfish", sci:"Corydoras aeneus (albino)", minGal:15, adult:2.5, tempLo:72, tempHi:79, phLo:6.0, phHi:8.0, diet:"Omnivore (bottom)", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Albino form of bronze cory. Group of 6+." },
  { name:"Panda Cory Catfish", sci:"Corydoras panda", minGal:15, adult:2, tempLo:68, tempHi:77, phLo:6.0, phHi:7.5, diet:"Omnivore (bottom)", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Cooler water. Adorable panda markings." },
  { name:"Sterbai Cory Catfish", sci:"Corydoras sterbai", minGal:20, adult:2.75, tempLo:73, tempHi:82, phLo:6.0, phHi:7.6, diet:"Omnivore (bottom)", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Handles warmer water — pairs well with discus." },
  { name:"Pygmy Cory Catfish", sci:"Corydoras pygmaeus", minGal:10, adult:1, tempLo:72, tempHi:79, phLo:6.4, phHi:7.4, diet:"Omnivore (bottom)", temperament:"Peaceful", school:8, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Tiny — swims mid-water in groups. Shrimp-safe." },
  { name:"Otocinclus Catfish", sci:"Otocinclus vittatus", minGal:10, adult:1.6, tempLo:72, tempHi:79, phLo:6.0, phHi:7.5, diet:"Herbivore (algae)", temperament:"Peaceful", school:4, finNipper:false, shrimpRisk:false, care:"Moderate", notes:"Needs mature tank with biofilm/algae. Shrimp-safe." },
  { name:"Bristlenose Pleco", sci:"Ancistrus cirrhosus", minGal:25, adult:5, tempLo:73, tempHi:81, phLo:6.5, phHi:7.5, diet:"Omnivore (algae+wood)", temperament:"Peaceful", school:1, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Stays small (~5 in). Needs driftwood." },
  { name:"Common Pleco", sci:"Hypostomus plecostomus", minGal:75, adult:18, tempLo:72, tempHi:86, phLo:6.5, phHi:7.5, diet:"Omnivore", temperament:"Peaceful (large)", school:1, finNipper:false, shrimpRisk:false, care:"Moderate", notes:"Grows to 18+ inches. Massive waste producer." },
  { name:"Clown Pleco", sci:"Panaqolus maccus", minGal:20, adult:3.5, tempLo:73, tempHi:82, phLo:6.5, phHi:7.8, diet:"Herbivore (wood)", temperament:"Peaceful", school:1, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Small pleco. Needs driftwood to rasp." },
  { name:"Kuhli Loach", sci:"Pangio kuhlii", minGal:20, adult:4, tempLo:75, tempHi:86, phLo:5.5, phHi:6.5, diet:"Omnivore (bottom)", temperament:"Peaceful (nocturnal)", school:5, finNipper:false, shrimpRisk:false, care:"Moderate", notes:"Eel-like. Needs sand and hiding spots." },
  { name:"Yoyo Loach", sci:"Botia almorhae", minGal:30, adult:5, tempLo:75, tempHi:86, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Semi-peaceful", school:5, finNipper:false, shrimpRisk:true, care:"Easy", notes:"Active loach. Eats snails." },
  { name:"Clown Loach", sci:"Chromobotia macracanthus", minGal:75, adult:12, tempLo:75, tempHi:85, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:5, finNipper:false, shrimpRisk:true, care:"Moderate", notes:"Grows 12+ inches. Needs huge tank long-term." },
  { name:"Dojo / Weather Loach", sci:"Misgurnus anguillicaudatus", minGal:40, adult:8, tempLo:50, tempHi:77, phLo:6.5, phHi:8.0, diet:"Omnivore", temperament:"Peaceful", school:3, finNipper:false, shrimpRisk:true, care:"Easy", notes:"Coldwater loach. Pairs with goldfish, not tropicals." },

  // ----- Cichlids -----
  { name:"German Blue Ram", sci:"Mikrogeophagus ramirezi", minGal:20, adult:2.5, tempLo:78, tempHi:85, phLo:5.0, phHi:7.0, diet:"Omnivore", temperament:"Peaceful (sensitive)", school:2, finNipper:false, shrimpRisk:true, care:"Moderate", notes:"Warm soft water. Stable parameters critical." },
  { name:"Bolivian Ram", sci:"Mikrogeophagus altispinosus", minGal:20, adult:3, tempLo:72, tempHi:79, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:2, finNipper:false, shrimpRisk:true, care:"Easy", notes:"Hardier than German ram. Great dwarf cichlid." },
  { name:"Apistogramma Cacatuoides", sci:"Apistogramma cacatuoides", minGal:20, adult:3, tempLo:75, tempHi:82, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Semi-peaceful (territorial)", school:1, finNipper:false, shrimpRisk:true, care:"Moderate", notes:"One male with multiple females." },
  { name:"Angelfish", sci:"Pterophyllum scalare", minGal:30, adult:6, tempLo:75, tempHi:84, phLo:6.8, phHi:7.8, diet:"Omnivore", temperament:"Semi-aggressive when breeding", school:1, finNipper:false, shrimpRisk:true, care:"Moderate", notes:"Tall tank (18+ inches). Will eat neon tetras and shrimp." },
  { name:"Kribensis", sci:"Pelvicachromis pulcher", minGal:20, adult:4, tempLo:75, tempHi:81, phLo:6.5, phHi:7.5, diet:"Omnivore", temperament:"Semi-aggressive (breeding)", school:2, finNipper:false, shrimpRisk:true, care:"Easy", notes:"Cave spawner. Hardy dwarf cichlid." },
  { name:"Convict Cichlid", sci:"Amatitlania nigrofasciata", minGal:30, adult:5, tempLo:74, tempHi:82, phLo:6.6, phHi:7.8, diet:"Omnivore", temperament:"Aggressive", school:1, finNipper:false, shrimpRisk:true, care:"Easy", notes:"Will breed and defend territory fiercely." },
  { name:"Jack Dempsey", sci:"Rocio octofasciata", minGal:55, adult:8, tempLo:72, tempHi:86, phLo:6.5, phHi:7.5, diet:"Carnivore", temperament:"Aggressive", school:1, finNipper:false, shrimpRisk:true, care:"Moderate", notes:"Large aggressive cichlid. Needs big tank and tankmate care." },
  { name:"Firemouth Cichlid", sci:"Thorichthys meeki", minGal:30, adult:6, tempLo:75, tempHi:86, phLo:6.5, phHi:8.0, diet:"Omnivore", temperament:"Semi-aggressive", school:1, finNipper:false, shrimpRisk:true, care:"Easy", notes:"Flares red throat to bluff. Territorial when breeding." },
  { name:"Discus", sci:"Symphysodon aequifasciatus", minGal:55, adult:8, tempLo:82, tempHi:88, phLo:6.0, phHi:7.0, diet:"Carnivore", temperament:"Peaceful", school:5, finNipper:false, shrimpRisk:true, care:"Hard", notes:"Expert fish. Soft warm water, pristine conditions." },
  { name:"Oscar", sci:"Astronotus ocellatus", minGal:75, adult:12, tempLo:74, tempHi:81, phLo:6.0, phHi:7.5, diet:"Carnivore", temperament:"Aggressive", school:1, finNipper:false, shrimpRisk:true, care:"Moderate", notes:"Grows 12+ inches and very messy — needs a very big tank and strong filtration." },
  { name:"Yellow Lab Cichlid", sci:"Labidochromis caeruleus", minGal:40, adult:4, tempLo:75, tempHi:82, phLo:7.8, phHi:8.6, diet:"Omnivore", temperament:"Semi-aggressive", school:3, finNipper:false, shrimpRisk:true, care:"Easy", notes:"African Rift Lake. Hard alkaline water." },

  // ----- Other community -----
  { name:"White Cloud Mountain Minnow", sci:"Tanichthys albonubes", minGal:10, adult:1.5, tempLo:60, tempHi:72, phLo:6.0, phHi:8.0, diet:"Omnivore", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Coldwater-tolerant. Great for unheated tanks." },
  { name:"Cherry Barb", sci:"Puntius titteya", minGal:20, adult:2, tempLo:73, tempHi:81, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Less nippy than other barbs." },
  { name:"Tiger Barb", sci:"Puntigrus tetrazona", minGal:20, adult:3, tempLo:74, tempHi:79, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Semi-aggressive (fin nipper)", school:8, finNipper:true, shrimpRisk:true, care:"Easy", notes:"Notorious fin-nipper. Keep 8+ and avoid long-finned tankmates." },
  { name:"Rosy Barb", sci:"Pethia conchonius", minGal:30, adult:5, tempLo:64, tempHi:78, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Peaceful (active)", school:6, finNipper:true, shrimpRisk:false, care:"Easy", notes:"Active barb. Cooler water OK. Can nip if under-schooled." },
  { name:"Gold Barb", sci:"Barbodes semifasciolatus", minGal:20, adult:3, tempLo:64, tempHi:78, phLo:6.0, phHi:8.0, diet:"Omnivore", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Hardy golden barb. Calmer than tiger barbs." },
  { name:"Rainbow Shark", sci:"Epalzeorhynchos frenatum", minGal:50, adult:6, tempLo:72, tempHi:79, phLo:6.5, phHi:7.5, diet:"Omnivore", temperament:"Aggressive (territorial)", school:1, finNipper:false, shrimpRisk:true, care:"Moderate", notes:"One per tank. Not a true shark. Chases bottom-dwellers." },
  { name:"Red-tailed Black Shark", sci:"Epalzeorhynchos bicolor", minGal:55, adult:6, tempLo:72, tempHi:79, phLo:6.5, phHi:7.5, diet:"Omnivore", temperament:"Aggressive", school:1, finNipper:false, shrimpRisk:true, care:"Moderate", notes:"One per tank. Chases bottom-dwellers." },
  { name:"Siamese Algae Eater", sci:"Crossocheilus siamensis", minGal:30, adult:6, tempLo:75, tempHi:79, phLo:6.5, phHi:8.0, diet:"Omnivore (algae)", temperament:"Peaceful (active)", school:1, finNipper:false, shrimpRisk:false, care:"Easy", notes:"One of few fish that eats black beard algae." },
  { name:"Killifish (Golden Wonder)", sci:"Aplocheilus lineatus", minGal:20, adult:4, tempLo:72, tempHi:79, phLo:6.0, phHi:8.0, diet:"Carnivore", temperament:"Semi-aggressive", school:1, finNipper:false, shrimpRisk:true, care:"Moderate", notes:"Surface predator. Eats small fish and shrimp. Tight lid required." },
  { name:"Hatchetfish (Marble)", sci:"Carnegiella strigata", minGal:20, adult:1.5, tempLo:75, tempHi:82, phLo:5.5, phHi:6.5, diet:"Carnivore (surface)", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Moderate", notes:"Strong jumpers. Tight lid mandatory." },

  // ----- Goldfish -----
  { name:"Common Goldfish", sci:"Carassius auratus", minGal:75, adult:12, tempLo:65, tempHi:72, phLo:7.0, phHi:8.4, diet:"Omnivore", temperament:"Peaceful (messy)", school:2, finNipper:false, shrimpRisk:true, care:"Moderate", notes:"Grows 12+ inches. Coldwater — no tropical tankmates." },
  { name:"Fancy Goldfish", sci:"Carassius auratus (fancy)", minGal:30, adult:8, tempLo:65, tempHi:75, phLo:7.0, phHi:8.4, diet:"Omnivore", temperament:"Peaceful", school:2, finNipper:false, shrimpRisk:true, care:"Moderate", notes:"+10 gal per additional fancy. Coldwater. Strong filtration." },

  // ----- Invertebrates -----
  { name:"Cherry Shrimp", sci:"Neocaridina davidi", minGal:5, adult:1.5, tempLo:65, tempHi:80, phLo:6.5, phHi:8.0, diet:"Omnivore (algae/biofilm)", temperament:"Peaceful", school:10, finNipper:false, shrimpRisk:false, care:"Easy", notes:"No copper meds. Eaten by most cichlids and bettas." },
  { name:"Amano Shrimp", sci:"Caridina multidentata", minGal:10, adult:2, tempLo:65, tempHi:80, phLo:6.0, phHi:7.5, diet:"Omnivore (algae)", temperament:"Peaceful", school:3, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Best algae-eating shrimp. Larger, harder for fish to eat." },
  { name:"Crystal Red Shrimp", sci:"Caridina cantonensis", minGal:10, adult:1, tempLo:62, tempHi:76, phLo:5.8, phHi:6.8, diet:"Omnivore", temperament:"Peaceful", school:10, finNipper:false, shrimpRisk:false, care:"Hard", notes:"Sensitive. Needs RO water and stable params." },
  { name:"Ghost Shrimp", sci:"Palaemonetes paludosus", minGal:5, adult:1.5, tempLo:65, tempHi:82, phLo:7.0, phHi:8.0, diet:"Omnivore", temperament:"Peaceful (mostly)", school:5, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Cheap cleanup crew. Will eat baby shrimp." },
  { name:"Nerite Snail", sci:"Neritina natalensis", minGal:5, adult:1, tempLo:72, tempHi:78, phLo:7.0, phHi:8.5, diet:"Herbivore (algae)", temperament:"Peaceful", school:1, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Best algae-eating snail. Eggs are infertile in fresh." },
  { name:"Mystery Snail", sci:"Pomacea bridgesii", minGal:5, adult:2, tempLo:68, tempHi:82, phLo:7.0, phHi:8.0, diet:"Omnivore", temperament:"Peaceful", school:1, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Large peaceful snail. Needs calcium for shell." },
  { name:"Assassin Snail", sci:"Clea helena", minGal:5, adult:1, tempLo:70, tempHi:80, phLo:7.0, phHi:8.0, diet:"Carnivore (snails)", temperament:"Peaceful to fish", school:1, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Eats pest snails. Won't bother fish or shrimp adults." }
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

/* Loose lookup that matches a stored inhabitant's free-text species string
   to a database entry (e.g. "Neon Tetra x8", "Betta", "neon tetras"). */
function fishMatch(text){
  if (!text) return null;
  const norm = text.toLowerCase().trim();
  // Exact first
  const exact = FISHDB.find(f => f.name.toLowerCase() === norm);
  if (exact) return exact;
  // Substring either direction
  return FISHDB.find(f => {
    const n = f.name.toLowerCase();
    return norm.includes(n) || n.includes(norm) || (f.sci && norm.includes(f.sci.toLowerCase()));
  }) || null;
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
        <div><span class="muted small">Adult size</span><b>${f.adult}"</b></div>
        <div><span class="muted small">Temp</span><b>${idealTemp}</b></div>
        <div><span class="muted small">pH</span><b>${idealPh}</b></div>
        <div><span class="muted small">Temperament</span><b>${f.temperament}</b></div>
        <div><span class="muted small">Group</span><b>${f.school > 1 ? f.school+"+" : "1"}</b></div>
      </div>
      <div class="fishdb-notes">${f.notes}</div>
    </div>
  `;
}

/* ============================================================
   COMPATIBILITY — "Can I buy this fish for this tank?"
   Simple, understandable scoring. Compares a candidate species
   against tank size and the tank's current inhabitants.
   Returns { level: "good"|"caution"|"bad", label, reasons:[...] }.
   ============================================================ */
function fishCompatibility(candidate, tank){
  const f = candidate;
  if (!f) return null;

  const gallons   = (tank && tank.gallons) || 0;
  const inhabitants = (tank && tank.fish) || [];
  // Resolve current inhabitants to DB entries we can reason about.
  const known = inhabitants
    .map(x => fishMatch(x.species))
    .filter(Boolean);

  // reasons[] collects { sev:"bad"|"caution", text }
  const reasons = [];
  const addBad     = (text) => reasons.push({ sev:"bad", text });
  const addCaution = (text) => reasons.push({ sev:"caution", text });

  // 1. Tank size vs minimum requirement
  if (gallons){
    if (gallons < f.minGal * 0.75){
      addBad(`tank too small — needs at least ${f.minGal} gal`);
    } else if (gallons < f.minGal){
      addCaution(`tight on space — ${f.minGal} gal recommended`);
    }
  }

  // 2. Adult size vs tank (big fish in small tanks)
  if (gallons && f.adult){
    if (f.adult >= 10 && gallons < 55){
      addBad("too large full grown for this tank");
    } else if (f.adult >= 6 && gallons < 30){
      addCaution("gets large full grown for this tank");
    }
  }

  // 3. Schooling needs (informational caution — depends on how many they buy)
  if (f.school >= 6){
    addCaution(`schooling fish — keep a group of ${f.school}+`);
  }

  // 4. Candidate aggression toward existing peaceful tankmates.
  //    Distinguish truly "aggressive" from milder "semi-aggressive".
  const tmp = (f.temperament || "").toLowerCase();
  const isAggressive     = (s) => s.includes("aggressive") && !s.includes("semi");
  const isSemiAggressive = (s) => s.includes("semi-aggressive") || s.includes("semi aggressive");
  const candidateAggressive = isAggressive(tmp);
  if (known.length){
    const peaceful = known.filter(k => (k.temperament||"").toLowerCase().includes("peaceful"));
    if (candidateAggressive && peaceful.length){
      addBad("aggressive with current tankmates");
    } else if ((candidateAggressive || isSemiAggressive(tmp)) && known.length){
      addCaution("can be aggressive — watch interactions with tankmates");
    }
  }

  // 5. Existing aggressive fish vs a peaceful/small candidate
  const candidatePeaceful = tmp.includes("peaceful");
  const existingAggressive = known.find(k => isAggressive((k.temperament||"").toLowerCase()));
  if (existingAggressive && (candidatePeaceful || f.adult <= 2.5)){
    addBad(`${existingAggressive.name} may bully or eat this fish`);
  }

  // 6. Fin-nipping risk against long-finned tankmates (and vice versa)
  const longFinned = (g) => /betta|guppy|angelfish|sailfin|gourami/i.test(g.name);
  if (f.finNipper && known.some(longFinned)){
    addCaution("fin-nipping risk with long-finned tankmates");
  }
  if (known.some(k => k.finNipper) && longFinned(f)){
    addCaution("fin-nipping risk from current tankmates");
  }

  // 7. Predation: a larger candidate eating much smaller tankmates
  if (known.length){
    const muchSmaller = known.find(k => f.adult >= 4 && f.adult >= k.adult * 2.5 && !candidatePeaceful);
    if (muchSmaller){
      addCaution(`may eat smaller fish like ${muchSmaller.name}`);
    }
  }

  // 8. Shrimp / snail risk
  const hasInverts = known.some(k => /shrimp|snail/i.test(k.name));
  if (f.shrimpRisk && hasInverts){
    addBad("shrimp/snail risk — likely to hunt your invertebrates");
  }
  // Candidate IS a shrimp/snail going into a tank with a known hunter
  if (/shrimp|snail/i.test(f.name)){
    const hunter = known.find(k => k.shrimpRisk);
    if (hunter){
      addBad(`${hunter.name} will likely eat this invertebrate`);
    }
  }

  // 9. Temperature overlap with existing inhabitants
  for (const k of known){
    const lo = Math.max(f.tempLo, k.tempLo);
    const hi = Math.min(f.tempHi, k.tempHi);
    if (lo > hi){
      addBad(`temperature mismatch with ${k.name}`);
      break;
    }
  }

  // Specific, friendly guppy callout people search for a lot.
  if (known.some(k => /guppy|endler/i.test(k.name)) && (f.finNipper || candidateAggressive)){
    addCaution("may not do well with guppies");
  }

  // ---- Roll up to one overall result ----
  const hasBad = reasons.some(r => r.sev === "bad");
  const cautionCount = reasons.filter(r => r.sev === "caution").length;

  let level, label;
  if (hasBad){
    level = "bad"; label = "Not recommended";
  } else if (cautionCount){
    level = "caution"; label = "Caution";
  } else {
    level = "good"; label = "Good fit";
  }

  // Order: bad reasons first, then cautions. Keep 1–3, plain language.
  const ordered = [
    ...reasons.filter(r => r.sev === "bad"),
    ...reasons.filter(r => r.sev === "caution")
  ].map(r => r.text);

  let shown = ordered.slice(0, 3);
  if (level === "good" && !shown.length){
    shown = gallons
      ? [`fits a ${gallons} gal tank`, "no obvious conflicts with current tankmates"]
      : ["no obvious conflicts"];
  }

  return { level, label, reasons: shown };
}

window.FISHDB_API = {
  all: FISHDB,
  search: fishSearch,
  byName: fishByName,
  match: fishMatch,
  card: fishCard,
  compatibility: fishCompatibility
};
