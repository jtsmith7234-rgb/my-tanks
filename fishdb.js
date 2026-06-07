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
  { name:"Betta (Siamese Fighting Fish)", sci:"Betta splendens", minGal:5, adult:3, tempLo:76, tempHi:82, phLo:6.5, phHi:7.5, diet:"Carnivore", temperament:"Aggressive (males solo)", school:1, finNipper:false, shrimpRisk:true, care:"Easy", notes:"One male per tank. May eat shrimp. Dislikes other long-finned fish.", category:"Bettas / Anabantoids" },
  { name:"Dwarf Gourami", sci:"Trichogaster lalius", minGal:10, adult:3.5, tempLo:72, tempHi:82, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Peaceful (skittish)", school:1, finNipper:false, shrimpRisk:false, care:"Easy", notes:"One male per tank. Susceptible to Iridovirus.", category:"Bettas / Anabantoids" },
  { name:"Pearl Gourami", sci:"Trichopodus leerii", minGal:30, adult:4.5, tempLo:77, tempHi:82, phLo:6.5, phHi:8.0, diet:"Omnivore", temperament:"Peaceful", school:1, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Needs surface cover. Great community fish.", category:"Bettas / Anabantoids" },
  { name:"Honey Gourami", sci:"Trichogaster chuna", minGal:10, adult:2, tempLo:74, tempHi:82, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:1, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Calm alternative to dwarf gourami.", category:"Bettas / Anabantoids" },
  { name:"Paradise Fish", sci:"Macropodus opercularis", minGal:20, adult:4, tempLo:61, tempHi:80, phLo:6.0, phHi:8.0, diet:"Omnivore", temperament:"Semi-aggressive", school:1, finNipper:true, shrimpRisk:true, care:"Easy", notes:"Hardy but will nip slow fish.", category:"Bettas / Anabantoids" },

  // ----- Tetras -----
  { name:"Neon Tetra", sci:"Paracheirodon innesi", minGal:10, adult:1.5, tempLo:70, tempHi:81, phLo:6.0, phHi:7.0, diet:"Omnivore", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Group of 6+. Sensitive to nitrates. Eaten by angelfish.", category:"Tetras" },
  { name:"Cardinal Tetra", sci:"Paracheirodon axelrodi", minGal:20, adult:2, tempLo:73, tempHi:81, phLo:5.5, phHi:7.0, diet:"Omnivore", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Moderate", notes:"Prefers soft acidic water.", category:"Tetras" },
  { name:"Ember Tetra", sci:"Hyphessobrycon amandae", minGal:10, adult:0.8, tempLo:73, tempHi:84, phLo:5.5, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:8, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Tiny orange schooler. Loves planted tanks.", category:"Tetras" },
  { name:"Black Skirt Tetra", sci:"Gymnocorymbus ternetzi", minGal:15, adult:2.5, tempLo:70, tempHi:79, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Semi-peaceful (fin nipper)", school:6, finNipper:true, shrimpRisk:false, care:"Easy", notes:"Avoid with long-finned tankmates.", category:"Tetras" },
  { name:"Serpae Tetra", sci:"Hyphessobrycon eques", minGal:20, adult:1.75, tempLo:72, tempHi:79, phLo:5.0, phHi:7.5, diet:"Omnivore", temperament:"Semi-aggressive (fin nipper)", school:8, finNipper:true, shrimpRisk:false, care:"Easy", notes:"Larger groups reduce nipping.", category:"Tetras" },
  { name:"Rummy-nose Tetra", sci:"Hemigrammus rhodostomus", minGal:20, adult:2, tempLo:75, tempHi:84, phLo:5.5, phHi:6.8, diet:"Omnivore", temperament:"Peaceful", school:8, finNipper:false, shrimpRisk:false, care:"Moderate", notes:"Red nose pales when water quality drops.", category:"Tetras" },
  { name:"Black Neon Tetra", sci:"Hyphessobrycon herbertaxelrodi", minGal:10, adult:1.5, tempLo:73, tempHi:81, phLo:5.5, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Hardier than regular neons.", category:"Tetras" },
  { name:"Glowlight Tetra", sci:"Hemigrammus erythrozonus", minGal:10, adult:1.5, tempLo:72, tempHi:80, phLo:5.8, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Subtle orange stripe. Soft water preferred.", category:"Tetras" },
  { name:"Bloodfin Tetra", sci:"Aphyocharax anisitsi", minGal:15, adult:2, tempLo:64, tempHi:82, phLo:6.0, phHi:8.0, diet:"Omnivore", temperament:"Peaceful (active)", school:6, finNipper:true, shrimpRisk:false, care:"Easy", notes:"Tolerates cooler water. Can nip long fins if under-schooled.", category:"Tetras" },
  { name:"Diamond Tetra", sci:"Moenkhausia pittieri", minGal:20, adult:2.4, tempLo:73, tempHi:82, phLo:5.5, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Sparkly scales develop with age.", category:"Tetras" },
  { name:"Von Rio / Flame Tetra", sci:"Hyphessobrycon flammeus", minGal:15, adult:1.6, tempLo:72, tempHi:82, phLo:5.5, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Hardy red-orange schooler. Good beginner tetra.", category:"Tetras" },
  { name:"Lemon Tetra", sci:"Hyphessobrycon pulchripinnis", minGal:15, adult:2, tempLo:73, tempHi:82, phLo:5.5, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Yellow tint with age. Calm community schooler.", category:"Tetras" },
  { name:"Congo Tetra", sci:"Phenacogrammus interruptus", minGal:30, adult:3, tempLo:73, tempHi:82, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Moderate", notes:"Larger, shimmery tetra. Needs swimming room.", category:"Tetras" },

  // ----- Rasboras / Danios -----
  { name:"Harlequin Rasbora", sci:"Trigonostigma heteromorpha", minGal:10, adult:2, tempLo:72, tempHi:81, phLo:6.0, phHi:7.8, diet:"Omnivore", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Hardy. Excellent community fish.", category:"Rasboras / Danios" },
  { name:"Chili Rasbora", sci:"Boraras brigittae", minGal:5, adult:0.7, tempLo:68, tempHi:83, phLo:4.0, phHi:7.0, diet:"Omnivore", temperament:"Peaceful", school:8, finNipper:false, shrimpRisk:false, care:"Moderate", notes:"Nano fish. Safe with shrimp. Needs soft acidic water.", category:"Rasboras / Danios" },
  { name:"Celestial Pearl Danio", sci:"Danio margaritatus", minGal:10, adult:1, tempLo:73, tempHi:79, phLo:6.5, phHi:7.5, diet:"Omnivore", temperament:"Peaceful (shy)", school:6, finNipper:false, shrimpRisk:false, care:"Moderate", notes:"Heavily planted tank preferred. Shrimp-safe.", category:"Rasboras / Danios" },
  { name:"Zebra Danio", sci:"Danio rerio", minGal:10, adult:2, tempLo:64, tempHi:77, phLo:6.5, phHi:7.5, diet:"Omnivore", temperament:"Peaceful (active)", school:6, finNipper:true, shrimpRisk:false, care:"Easy", notes:"Very hardy beginner fish. Can nip long fins if under-schooled.", category:"Rasboras / Danios" },
  { name:"Pearl Danio", sci:"Danio albolineatus", minGal:20, adult:2.5, tempLo:68, tempHi:77, phLo:6.0, phHi:8.0, diet:"Omnivore", temperament:"Peaceful (active)", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Iridescent pearl sheen. Top-level swimmer.", category:"Rasboras / Danios" },
  { name:"Giant Danio", sci:"Devario aequipinnatus", minGal:30, adult:4, tempLo:72, tempHi:75, phLo:6.0, phHi:8.0, diet:"Omnivore", temperament:"Peaceful (very active)", school:6, finNipper:false, shrimpRisk:true, care:"Easy", notes:"Needs swimming room. Long tanks preferred.", category:"Rasboras / Danios" },

  // ----- Livebearers -----
  { name:"Guppy", sci:"Poecilia reticulata", minGal:5, adult:2.2, tempLo:72, tempHi:82, phLo:6.8, phHi:7.8, diet:"Omnivore", temperament:"Peaceful", school:3, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Breeds prolifically. Long fins — avoid known fin-nippers.", category:"Livebearers" },
  { name:"Endler's Livebearer", sci:"Poecilia wingei", minGal:5, adult:1.5, tempLo:72, tempHi:82, phLo:6.5, phHi:8.0, diet:"Omnivore", temperament:"Peaceful", school:3, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Smaller, hardier cousin of the guppy.", category:"Livebearers" },
  { name:"Platy", sci:"Xiphophorus maculatus", minGal:10, adult:2.5, tempLo:70, tempHi:80, phLo:7.0, phHi:8.2, diet:"Omnivore", temperament:"Peaceful", school:3, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Hardy livebearer. Prefers harder water.", category:"Livebearers" },
  { name:"Swordtail", sci:"Xiphophorus hellerii", minGal:20, adult:5.5, tempLo:72, tempHi:79, phLo:7.0, phHi:8.4, diet:"Omnivore", temperament:"Peaceful", school:3, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Males have signature tail extension. Can jump.", category:"Livebearers" },
  { name:"Molly", sci:"Poecilia sphenops", minGal:20, adult:4.5, tempLo:72, tempHi:78, phLo:7.5, phHi:8.5, diet:"Omnivore", temperament:"Peaceful", school:3, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Prefers hard alkaline water. Some keep in brackish.", category:"Livebearers" },
  { name:"Sailfin Molly", sci:"Poecilia latipinna", minGal:30, adult:5.5, tempLo:72, tempHi:82, phLo:7.5, phHi:8.5, diet:"Omnivore", temperament:"Peaceful", school:3, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Large showy dorsal fin. Hard alkaline water.", category:"Livebearers" },

  // ----- Catfish / Loaches -----
  { name:"Bronze Cory Catfish", sci:"Corydoras aeneus", minGal:15, adult:2.5, tempLo:72, tempHi:79, phLo:6.0, phHi:8.0, diet:"Omnivore (bottom)", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Sand or smooth gravel only. Group of 6+.", category:"Catfish / Loaches" },
  { name:"Albino Cory Catfish", sci:"Corydoras aeneus (albino)", minGal:15, adult:2.5, tempLo:72, tempHi:79, phLo:6.0, phHi:8.0, diet:"Omnivore (bottom)", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Albino form of bronze cory. Group of 6+.", category:"Catfish / Loaches" },
  { name:"Panda Cory Catfish", sci:"Corydoras panda", minGal:15, adult:2, tempLo:68, tempHi:77, phLo:6.0, phHi:7.5, diet:"Omnivore (bottom)", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Cooler water. Adorable panda markings.", category:"Catfish / Loaches" },
  { name:"Sterbai Cory Catfish", sci:"Corydoras sterbai", minGal:20, adult:2.75, tempLo:73, tempHi:82, phLo:6.0, phHi:7.6, diet:"Omnivore (bottom)", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Handles warmer water — pairs well with discus.", category:"Catfish / Loaches" },
  { name:"Pygmy Cory Catfish", sci:"Corydoras pygmaeus", minGal:10, adult:1, tempLo:72, tempHi:79, phLo:6.4, phHi:7.4, diet:"Omnivore (bottom)", temperament:"Peaceful", school:8, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Tiny — swims mid-water in groups. Shrimp-safe.", category:"Catfish / Loaches" },
  { name:"Otocinclus Catfish", sci:"Otocinclus vittatus", minGal:10, adult:1.6, tempLo:72, tempHi:79, phLo:6.0, phHi:7.5, diet:"Herbivore (algae)", temperament:"Peaceful", school:4, finNipper:false, shrimpRisk:false, care:"Moderate", notes:"Needs mature tank with biofilm/algae. Shrimp-safe.", category:"Catfish / Loaches" },
  { name:"Bristlenose Pleco", sci:"Ancistrus cirrhosus", minGal:25, adult:5, tempLo:73, tempHi:81, phLo:6.5, phHi:7.5, diet:"Omnivore (algae+wood)", temperament:"Peaceful", school:1, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Stays small (~5 in). Needs driftwood.", category:"Catfish / Loaches" },
  { name:"Common Pleco", sci:"Hypostomus plecostomus", minGal:75, adult:18, tempLo:72, tempHi:86, phLo:6.5, phHi:7.5, diet:"Omnivore", temperament:"Peaceful (large)", school:1, finNipper:false, shrimpRisk:false, care:"Moderate", notes:"Grows to 18+ inches. Massive waste producer.", category:"Catfish / Loaches" },
  { name:"Clown Pleco", sci:"Panaqolus maccus", minGal:20, adult:3.5, tempLo:73, tempHi:82, phLo:6.5, phHi:7.8, diet:"Herbivore (wood)", temperament:"Peaceful", school:1, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Small pleco. Needs driftwood to rasp.", category:"Catfish / Loaches" },
  { name:"Kuhli Loach", sci:"Pangio kuhlii", minGal:20, adult:4, tempLo:75, tempHi:86, phLo:5.5, phHi:6.5, diet:"Omnivore (bottom)", temperament:"Peaceful (nocturnal)", school:5, finNipper:false, shrimpRisk:false, care:"Moderate", notes:"Eel-like. Needs sand and hiding spots.", category:"Catfish / Loaches" },
  { name:"Yoyo Loach", sci:"Botia almorhae", minGal:30, adult:5, tempLo:75, tempHi:86, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Semi-peaceful", school:5, finNipper:false, shrimpRisk:true, care:"Easy", notes:"Active loach. Eats snails.", category:"Catfish / Loaches" },
  { name:"Clown Loach", sci:"Chromobotia macracanthus", minGal:75, adult:12, tempLo:75, tempHi:85, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:5, finNipper:false, shrimpRisk:true, care:"Moderate", notes:"Grows 12+ inches. Needs huge tank long-term.", category:"Catfish / Loaches" },
  { name:"Dojo / Weather Loach", sci:"Misgurnus anguillicaudatus", minGal:40, adult:8, tempLo:50, tempHi:77, phLo:6.5, phHi:8.0, diet:"Omnivore", temperament:"Peaceful", school:3, finNipper:false, shrimpRisk:true, care:"Easy", notes:"Coldwater loach. Pairs with goldfish, not tropicals.", category:"Catfish / Loaches" },

  // ----- Cichlids -----
  { name:"German Blue Ram", sci:"Mikrogeophagus ramirezi", minGal:20, adult:2.5, tempLo:78, tempHi:85, phLo:5.0, phHi:7.0, diet:"Omnivore", temperament:"Peaceful (sensitive)", school:2, finNipper:false, shrimpRisk:true, care:"Moderate", notes:"Warm soft water. Stable parameters critical.", category:"Cichlids" },
  { name:"Bolivian Ram", sci:"Mikrogeophagus altispinosus", minGal:20, adult:3, tempLo:72, tempHi:79, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:2, finNipper:false, shrimpRisk:true, care:"Easy", notes:"Hardier than German ram. Great dwarf cichlid.", category:"Cichlids" },
  { name:"Apistogramma Cacatuoides", sci:"Apistogramma cacatuoides", minGal:20, adult:3, tempLo:75, tempHi:82, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Semi-peaceful (territorial)", school:1, finNipper:false, shrimpRisk:true, care:"Moderate", notes:"One male with multiple females.", category:"Cichlids" },
  { name:"Angelfish", sci:"Pterophyllum scalare", minGal:30, adult:6, tempLo:75, tempHi:84, phLo:6.8, phHi:7.8, diet:"Omnivore", temperament:"Semi-aggressive when breeding", school:1, finNipper:false, shrimpRisk:true, care:"Moderate", notes:"Tall tank (18+ inches). Will eat neon tetras and shrimp.", category:"Cichlids" },
  { name:"Kribensis", sci:"Pelvicachromis pulcher", minGal:20, adult:4, tempLo:75, tempHi:81, phLo:6.5, phHi:7.5, diet:"Omnivore", temperament:"Semi-aggressive (breeding)", school:2, finNipper:false, shrimpRisk:true, care:"Easy", notes:"Cave spawner. Hardy dwarf cichlid.", category:"Cichlids" },
  { name:"Convict Cichlid", sci:"Amatitlania nigrofasciata", minGal:30, adult:5, tempLo:74, tempHi:82, phLo:6.6, phHi:7.8, diet:"Omnivore", temperament:"Aggressive", school:1, finNipper:false, shrimpRisk:true, care:"Easy", notes:"Will breed and defend territory fiercely.", category:"Cichlids" },
  { name:"Jack Dempsey", sci:"Rocio octofasciata", minGal:55, adult:8, tempLo:72, tempHi:86, phLo:6.5, phHi:7.5, diet:"Carnivore", temperament:"Aggressive", school:1, finNipper:false, shrimpRisk:true, care:"Moderate", notes:"Large aggressive cichlid. Needs big tank and tankmate care.", category:"Cichlids" },
  { name:"Firemouth Cichlid", sci:"Thorichthys meeki", minGal:30, adult:6, tempLo:75, tempHi:86, phLo:6.5, phHi:8.0, diet:"Omnivore", temperament:"Semi-aggressive", school:1, finNipper:false, shrimpRisk:true, care:"Easy", notes:"Flares red throat to bluff. Territorial when breeding.", category:"Cichlids" },
  { name:"Discus", sci:"Symphysodon aequifasciatus", minGal:55, adult:8, tempLo:82, tempHi:88, phLo:6.0, phHi:7.0, diet:"Carnivore", temperament:"Peaceful", school:5, finNipper:false, shrimpRisk:true, care:"Hard", notes:"Expert fish. Soft warm water, pristine conditions.", category:"Cichlids" },
  { name:"Oscar", sci:"Astronotus ocellatus", minGal:75, adult:12, tempLo:74, tempHi:81, phLo:6.0, phHi:7.5, diet:"Carnivore", temperament:"Aggressive", school:1, finNipper:false, shrimpRisk:true, care:"Moderate", notes:"Grows 12+ inches and very messy — needs a very big tank and strong filtration.", category:"Cichlids" },
  { name:"Yellow Lab Cichlid", sci:"Labidochromis caeruleus", minGal:40, adult:4, tempLo:75, tempHi:82, phLo:7.8, phHi:8.6, diet:"Omnivore", temperament:"Semi-aggressive", school:3, finNipper:false, shrimpRisk:true, care:"Easy", notes:"African Rift Lake. Hard alkaline water.", category:"Cichlids" },

  // ----- Other community -----
  { name:"White Cloud Mountain Minnow", sci:"Tanichthys albonubes", minGal:10, adult:1.5, tempLo:60, tempHi:72, phLo:6.0, phHi:8.0, diet:"Omnivore", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Coldwater-tolerant. Great for unheated tanks.", category:"Other community" },
  { name:"Cherry Barb", sci:"Puntius titteya", minGal:20, adult:2, tempLo:73, tempHi:81, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Less nippy than other barbs.", category:"Other community" },
  { name:"Tiger Barb", sci:"Puntigrus tetrazona", minGal:20, adult:3, tempLo:74, tempHi:79, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Semi-aggressive (fin nipper)", school:8, finNipper:true, shrimpRisk:true, care:"Easy", notes:"Notorious fin-nipper. Keep 8+ and avoid long-finned tankmates.", category:"Other community" },
  { name:"Rosy Barb", sci:"Pethia conchonius", minGal:30, adult:5, tempLo:64, tempHi:78, phLo:6.0, phHi:7.5, diet:"Omnivore", temperament:"Peaceful (active)", school:6, finNipper:true, shrimpRisk:false, care:"Easy", notes:"Active barb. Cooler water OK. Can nip if under-schooled.", category:"Other community" },
  { name:"Gold Barb", sci:"Barbodes semifasciolatus", minGal:20, adult:3, tempLo:64, tempHi:78, phLo:6.0, phHi:8.0, diet:"Omnivore", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Hardy golden barb. Calmer than tiger barbs.", category:"Other community" },
  { name:"Rainbow Shark", sci:"Epalzeorhynchos frenatum", minGal:50, adult:6, tempLo:72, tempHi:79, phLo:6.5, phHi:7.5, diet:"Omnivore", temperament:"Aggressive (territorial)", school:1, finNipper:false, shrimpRisk:true, care:"Moderate", notes:"One per tank. Not a true shark. Chases bottom-dwellers.", category:"Other community" },
  { name:"Red-tailed Black Shark", sci:"Epalzeorhynchos bicolor", minGal:55, adult:6, tempLo:72, tempHi:79, phLo:6.5, phHi:7.5, diet:"Omnivore", temperament:"Aggressive", school:1, finNipper:false, shrimpRisk:true, care:"Moderate", notes:"One per tank. Chases bottom-dwellers.", category:"Other community" },
  { name:"Siamese Algae Eater", sci:"Crossocheilus siamensis", minGal:30, adult:6, tempLo:75, tempHi:79, phLo:6.5, phHi:8.0, diet:"Omnivore (algae)", temperament:"Peaceful (active)", school:1, finNipper:false, shrimpRisk:false, care:"Easy", notes:"One of few fish that eats black beard algae.", category:"Other community" },
  { name:"Killifish (Golden Wonder)", sci:"Aplocheilus lineatus", minGal:20, adult:4, tempLo:72, tempHi:79, phLo:6.0, phHi:8.0, diet:"Carnivore", temperament:"Semi-aggressive", school:1, finNipper:false, shrimpRisk:true, care:"Moderate", notes:"Surface predator. Eats small fish and shrimp. Tight lid required.", category:"Other community" },
  { name:"Hatchetfish (Marble)", sci:"Carnegiella strigata", minGal:20, adult:1.5, tempLo:75, tempHi:82, phLo:5.5, phHi:6.5, diet:"Carnivore (surface)", temperament:"Peaceful", school:6, finNipper:false, shrimpRisk:false, care:"Moderate", notes:"Strong jumpers. Tight lid mandatory.", category:"Other community" },

  // ----- Goldfish -----
  { name:"Common Goldfish", sci:"Carassius auratus", minGal:75, adult:12, tempLo:65, tempHi:72, phLo:7.0, phHi:8.4, diet:"Omnivore", temperament:"Peaceful (messy)", school:2, finNipper:false, shrimpRisk:true, care:"Moderate", notes:"Grows 12+ inches. Coldwater — no tropical tankmates.", category:"Goldfish" },
  { name:"Fancy Goldfish", sci:"Carassius auratus (fancy)", minGal:30, adult:8, tempLo:65, tempHi:75, phLo:7.0, phHi:8.4, diet:"Omnivore", temperament:"Peaceful", school:2, finNipper:false, shrimpRisk:true, care:"Moderate", notes:"+10 gal per additional fancy. Coldwater. Strong filtration.", category:"Goldfish" },

  // ----- Invertebrates -----
  { name:"Cherry Shrimp", sci:"Neocaridina davidi", minGal:5, adult:1.5, tempLo:65, tempHi:80, phLo:6.5, phHi:8.0, diet:"Omnivore (algae/biofilm)", temperament:"Peaceful", school:10, finNipper:false, shrimpRisk:false, care:"Easy", notes:"No copper meds. Eaten by most cichlids and bettas.", category:"Invertebrates" },
  { name:"Amano Shrimp", sci:"Caridina multidentata", minGal:10, adult:2, tempLo:65, tempHi:80, phLo:6.0, phHi:7.5, diet:"Omnivore (algae)", temperament:"Peaceful", school:3, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Best algae-eating shrimp. Larger, harder for fish to eat.", category:"Invertebrates" },
  { name:"Crystal Red Shrimp", sci:"Caridina cantonensis", minGal:10, adult:1, tempLo:62, tempHi:76, phLo:5.8, phHi:6.8, diet:"Omnivore", temperament:"Peaceful", school:10, finNipper:false, shrimpRisk:false, care:"Hard", notes:"Sensitive. Needs RO water and stable params.", category:"Invertebrates" },
  { name:"Ghost Shrimp", sci:"Palaemonetes paludosus", minGal:5, adult:1.5, tempLo:65, tempHi:82, phLo:7.0, phHi:8.0, diet:"Omnivore", temperament:"Peaceful (mostly)", school:5, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Cheap cleanup crew. Will eat baby shrimp.", category:"Invertebrates" },
  { name:"Nerite Snail", sci:"Neritina natalensis", minGal:5, adult:1, tempLo:72, tempHi:78, phLo:7.0, phHi:8.5, diet:"Herbivore (algae)", temperament:"Peaceful", school:1, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Best algae-eating snail. Eggs are infertile in fresh.", category:"Invertebrates" },
  { name:"Mystery Snail", sci:"Pomacea bridgesii", minGal:5, adult:2, tempLo:68, tempHi:82, phLo:7.0, phHi:8.0, diet:"Omnivore", temperament:"Peaceful", school:1, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Large peaceful snail. Needs calcium for shell.", category:"Invertebrates" },
  { name:"Assassin Snail", sci:"Clea helena", minGal:5, adult:1, tempLo:70, tempHi:80, phLo:7.0, phHi:8.0, diet:"Carnivore (snails)", temperament:"Peaceful to fish", school:1, finNipper:false, shrimpRisk:false, care:"Easy", notes:"Eats pest snails. Won't bother fish or shrimp adults.", category:"Invertebrates" }
];

/* ============================================================
   SOURCE STACK — curated reference roles (Option 1).
   No live API / no runtime scraping. Each species carries source
   labels; URLs point at the source's own search/home so they can
   be refined to species-level links later without faking precision.
     label   display name
     role    what this source contributes
     url(f)  conservative link, usually a search for the sci name
   ============================================================ */
const FISH_SOURCES = {
  fishbase: {
    label: "FishBase",
    role: "Scientific naming & core species facts",
    url: f => `https://www.fishbase.se/search.php?q=${encodeURIComponent(f.sci || f.name)}`
  },
  cof: {
    label: "Catalog of Fishes",
    role: "Taxonomic authority for scientific names",
    url: () => "https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatmain.asp"
  },
  seriouslyfish: {
    label: "Seriously Fish",
    role: "Aquarium care & practical guidance",
    url: f => `https://www.seriouslyfish.com/?s=${encodeURIComponent(f.sci || f.name)}`
  },
  iucn: {
    label: "IUCN Red List",
    role: "Conservation status",
    url: f => `https://www.iucnredlist.org/search?query=${encodeURIComponent(f.sci || f.name)}`
  }
};

/* Which sources apply to a species. Naming/care/taxonomy apply to all;
   IUCN only when a conservation status is known (kept conservative). */
function fishSources(f){
  if (!f) return [];
  const out = [
    { ...FISH_SOURCES.fishbase, url: FISH_SOURCES.fishbase.url(f) },
    { ...FISH_SOURCES.cof,      url: FISH_SOURCES.cof.url(f) },
    { ...FISH_SOURCES.seriouslyfish, url: FISH_SOURCES.seriouslyfish.url(f) }
  ];
  if (fishConservation(f)){
    out.push({ ...FISH_SOURCES.iucn, url: FISH_SOURCES.iucn.url(f) });
  }
  return out.map(s => ({ label: s.label, role: s.role, url: s.url }));
}

/* Conservation status — only for species where it is well established.
   Conservative: omit (return null) rather than guess. */
const FISH_CONSERVATION = {
  "Symphysodon aequifasciatus": "Least Concern",
  "Paracheirodon innesi": "Least Concern",
  "Betta splendens": "Vulnerable",
  "Danio rerio": "Least Concern",
  "Poecilia reticulata": "Least Concern",
  "Pterophyllum scalare": "Least Concern"
};
function fishConservation(f){
  if (!f || !f.sci) return null;
  return FISH_CONSERVATION[f.sci] || null;
}

/* Group / schooling note in plain language. */
function fishGrouping(f){
  if (!f) return "";
  if (f.school >= 6) return `Keep a group of ${f.school}+`;
  if (f.school > 1)  return `Best in groups of ${f.school}+`;
  return "Fine kept singly";
}

/* Beginner-friendliness derived from care level. */
function fishCareLevel(f){
  const c = (f && f.care) || "";
  if (c === "Easy") return "Beginner-friendly";
  if (c === "Moderate") return "Some experience helpful";
  if (c === "Hard") return "Advanced";
  return c || "—";
}

/* Short one-line compatibility summary for the profile card.
   Built from existing practical fields — no invented claims. */
function fishProfileSummary(f){
  if (!f) return "";
  const tmp = (f.temperament || "").toLowerCase();
  if (f.adult >= 10) return "Needs a large tank — not for nano setups.";
  if (tmp.includes("aggressive") && !tmp.includes("semi")) return "Aggressive — choose tankmates carefully.";
  if (f.finNipper) return "Use caution with long-finned tankmates.";
  if (f.shrimpRisk && /shrimp|snail/i.test(f.name) === false) return "Use caution with shrimp or small inverts.";
  if (f.school >= 6) return `Peaceful schooler — needs a group of ${f.school}+.`;
  if (tmp.includes("peaceful")) return "Best for peaceful community tanks.";
  return "Check tank size and tankmates before adding.";
}

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

/* Alphabetized list for the Browse species mode. Optional query filters
   on common or scientific name. Returns the full set when query empty. */
function fishBrowse(query){
  const q = (query || "").toLowerCase().trim();
  const list = q
    ? FISHDB.filter(f => f.name.toLowerCase().includes(q) || f.sci.toLowerCase().includes(q))
    : FISHDB.slice();
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

/* Group species by category. Returns array of { name, species[] } preserving
   the order in which each category first appears in FISHDB (so the UI's
   collapsed list reads in a curated order, not alphabetical). Species inside
   each bucket are sorted alphabetically by common name. */
function fishCategories(query){
  const q = (query || "").toLowerCase().trim();
  const matches = q
    ? FISHDB.filter(f => f.name.toLowerCase().includes(q) || f.sci.toLowerCase().includes(q))
    : FISHDB.slice();
  const order = [];
  const groups = new Map();
  for (const f of matches){
    const cat = f.category || "Other";
    if (!groups.has(cat)){
      groups.set(cat, []);
      order.push(cat);
    }
    groups.get(cat).push(f);
  }
  // Re-order using the original FISHDB category order so unfiltered view is
  // consistent (Bettas, Tetras, ... Invertebrates) regardless of search hits.
  const canonicalOrder = [];
  for (const f of FISHDB){
    const c = f.category || "Other";
    if (!canonicalOrder.includes(c)) canonicalOrder.push(c);
  }
  const sortedNames = order.sort((a, b) => canonicalOrder.indexOf(a) - canonicalOrder.indexOf(b));
  return sortedNames.map(cat => ({
    name: cat,
    species: groups.get(cat).sort((a, b) => a.name.localeCompare(b.name))
  }));
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

/* HTML for the thumbnail slot used in the species card list.
   Always returns the same outer markup so card-list layout stays
   stable whether or not an approved image is available. */
function fishThumbHTML(f){
  // Reference fishImage lazily so callers without a sci field still work.
  const img = fishImage(f, "thumb");
  if (img.isPlaceholder){
    return `<span class="species-thumb species-thumb-placeholder" aria-hidden="true">${img.silhouette}</span>`;
  }
  // decoding=async + loading=lazy keep the card list fast on long scrolls.
  // onerror calls fishImageError() which swaps in the silhouette so a
  // broken URL never shows a native broken-image icon.
  const alt = (f && f.name) ? `${f.name} thumbnail` : "Species thumbnail";
  const safeSrc = String(img.src).replace(/"/g, "&quot;");
  const safeAlt = alt.replace(/"/g, "&quot;");
  return `<span class="species-thumb species-thumb-img">`
       + `<img src="${safeSrc}" alt="${safeAlt}" loading="lazy" decoding="async" onerror="window.fishImageError(this)" />`
       + `</span>`;
}

/* HTML for the larger hero slot used on the detail/profile card. */
function fishHeroHTML(f){
  const img = fishImage(f, "hero");
  if (img.isPlaceholder){
    return `<div class="species-hero species-hero-placeholder" aria-hidden="true">${img.silhouette}</div>`;
  }
  const alt = (f && f.name) ? `${f.name}` : "Species image";
  const safeSrc = String(img.src).replace(/"/g, "&quot;");
  const safeAlt = alt.replace(/"/g, "&quot;");
  // Attribution: escape HTML to avoid injection from source records.
  const attrText = (img.attribution || "").replace(/[&<>]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;"})[c]);
  const attribution = attrText ? `<div class="species-hero-attr">${attrText}</div>` : "";
  return `<div class="species-hero species-hero-img">`
       + `<img src="${safeSrc}" alt="${safeAlt}" loading="lazy" decoding="async" onerror="window.fishImageError(this)" />`
       + `${attribution}`
       + `</div>`;
}

/* Expert-style species profile for Browse mode. Compact rows, a short
   summary line, and a minimal trust section with an expandable Sources
   drawer (toggled in app.js). */
function fishProfileCard(f){
  if (!f) return "";
  const tempRange = `${f.tempLo}–${f.tempHi}°F`;
  const sci = f.sci ? `<div class="profile-sci">${f.sci}</div>` : "";
  const conservation = fishConservation(f);
  const sciVerified = f.sci ? `<span class="trust-chip">Scientific name verified</span>` : "";
  const hero = fishHeroHTML(f);

  const rows = [
    ["Adult size",   `${f.adult}"`],
    ["Temperament",  f.temperament],
    ["Temperature",  tempRange],
    ["Min tank",     `${f.minGal} gal`],
    ["Group",        fishGrouping(f)],
    ["Care level",   fishCareLevel(f)]
  ];
  if (conservation) rows.push(["Conservation", conservation]);

  const rowsHTML = rows.map(([k, v]) => `
    <div class="profile-row">
      <span class="profile-k">${k}</span>
      <span class="profile-v">${v}</span>
    </div>`).join("");

  const sources = fishSources(f).map(s => `
    <a class="source-item" href="${s.url}" target="_blank" rel="noopener noreferrer">
      <span class="source-label">${s.label}</span>
      <span class="source-role">${s.role}</span>
    </a>`).join("");

  return `
    <div class="profile-card" data-profile>
      ${hero}
      <div class="profile-head">
        <div class="profile-name">${f.name}</div>
        ${sci}
      </div>
      <div class="profile-summary">${fishProfileSummary(f)}</div>
      <div class="profile-rows">${rowsHTML}</div>
      <div class="profile-trust">
        <div class="trust-line">
          Profile built from curated aquarium &amp; species references.
          ${sciVerified}
        </div>
        <button type="button" class="sources-toggle" data-sources-toggle aria-expanded="false">
          Sources
          <span class="sources-chev">›</span>
        </button>
        <div class="sources-drawer" data-sources-drawer hidden>${sources}</div>
      </div>
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

/* ============================================================
   SPECIES IMAGE SYSTEM (v1 — conservative rollout)

   Image policy:
     - No auto-import of random web images. Curated, manually
       approved URLs only.
     - Coverage is partial in v1. Any species without an
       "approved" entry renders a silhouette placeholder.
     - Layout stays stable in both states; no broken-image icons.

   Per-species fields (all optional):
     imageThumbUrl       small image for the card list (~56–88px)
     imageHeroUrl        larger image for the detail screen
     imageStatus         "approved" | "needs_review" | "placeholder"
     imageSourceName     human-readable source (e.g. "Wikimedia Commons")
     imageSourceUrl      URL of the source file/page
     imageLicenseType    e.g. "CC-BY-SA 4.0", "Public Domain"
     imageLicenseUrl     URL of the license text
     imageAttributionText  attribution string to display under the hero

   Tier metadata drives the curator workflow (not the renderer):
     Tier 1 = prioritized for sourcing & approval
     Tier 2 = possible, placeholder until manually reviewed
     Tier 3 = placeholder first

   Renderer rule: image is shown ONLY when imageStatus === "approved"
   AND the matching URL is present. Anything else => silhouette.
   ============================================================ */

/* Keyed by scientific name (canonical) so renaming common names does
   not break image links. Empty by default — curators fill this in. */
const FISH_IMAGES = {
  /* NOTE: Thumb URLs use the pixel width returned by the Wikimedia API
     (iiurlwidth=320 → 330px for most files). Hero URLs use iiurlwidth=640
     → 960px. Never hand-craft 200px/640px — those sizes are often not
     pre-cached and return HTTP 400. Always use API-verified widths. */

  // Betta (Siamese Fighting Fish)
  "Betta splendens": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Betta_splendens_-_Flickr_-_Nippyfish.jpg/330px-Betta_splendens_-_Flickr_-_Nippyfish.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/9/9e/Betta_splendens_-_Flickr_-_Nippyfish.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:Betta_splendens_-_Flickr_-_Nippyfish.jpg",
    imageLicenseType: "CC BY 2.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by/2.0",
    imageAttributionText: "Photo by Nippyfish / Wikimedia Commons / CC BY 2.0"
  },
  // Dwarf Gourami
  "Trichogaster lalius": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Colisa_lalia_-_Trichogaster_lalius_%28aka%29.jpg/330px-Colisa_lalia_-_Trichogaster_lalius_%28aka%29.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Colisa_lalia_-_Trichogaster_lalius_%28aka%29.jpg/960px-Colisa_lalia_-_Trichogaster_lalius_%28aka%29.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:Colisa_lalia_-_Trichogaster_lalius_(aka).jpg",
    imageLicenseType: "CC BY-SA 2.5",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/2.5",
    imageAttributionText: "Photo by André Karwath / Wikimedia Commons / CC BY-SA 2.5"
  },
  // Neon Tetra
  "Paracheirodon innesi": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Paracheirodon_innesi_%28aka%29.jpg/330px-Paracheirodon_innesi_%28aka%29.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Paracheirodon_innesi_%28aka%29.jpg/960px-Paracheirodon_innesi_%28aka%29.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:Paracheirodon_innesi_(aka).jpg",
    imageLicenseType: "CC BY-SA 2.5",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/2.5",
    imageAttributionText: "Photo by André Karwath / Wikimedia Commons / CC BY-SA 2.5"
  },
  // Cardinal Tetra
  "Paracheirodon axelrodi": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Cardinal_Tetra_2.jpg/330px-Cardinal_Tetra_2.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/8/8f/Cardinal_Tetra_2.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:Cardinal_Tetra_2.jpg",
    imageLicenseType: "CC BY-SA 3.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/3.0",
    imageAttributionText: "Photo by Ltshears / Wikimedia Commons / CC BY-SA 3.0"
  },
  // Harlequin Rasbora
  "Trigonostigma heteromorpha": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Cyprinidae_Trigonostigma_heteromorpha_3.jpg/330px-Cyprinidae_Trigonostigma_heteromorpha_3.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Cyprinidae_Trigonostigma_heteromorpha_3.jpg/960px-Cyprinidae_Trigonostigma_heteromorpha_3.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:Cyprinidae_Trigonostigma_heteromorpha_3.jpg",
    imageLicenseType: "CC BY-SA 4.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/4.0",
    imageAttributionText: "Photo by NasserHalaweh / Wikimedia Commons / CC BY-SA 4.0"
  },
  // Zebra Danio
  "Danio rerio": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/201108_zebrafish.png/330px-201108_zebrafish.png",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/6/61/201108_zebrafish.png",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:201108_zebrafish.png",
    imageLicenseType: "CC BY 4.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by/4.0",
    imageAttributionText: "Photo by DBCLS / Wikimedia Commons / CC BY 4.0"
  },
  // Guppy
  "Poecilia reticulata": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Poecilia_reticulata_090510_0171_kdBdk.jpg/330px-Poecilia_reticulata_090510_0171_kdBdk.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Poecilia_reticulata_090510_0171_kdBdk.jpg/960px-Poecilia_reticulata_090510_0171_kdBdk.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:Poecilia_reticulata_090510_0171_kdBdk.jpg",
    imageLicenseType: "CC BY-SA 3.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/3.0",
    imageAttributionText: "Photo by Wibowo Djatmiko / Wikimedia Commons / CC BY-SA 3.0"
  },
  // Platy
  "Xiphophorus maculatus": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/24karat_platy.jpg/330px-24karat_platy.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/6/67/24karat_platy.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:24karat_platy.jpg",
    imageLicenseType: "CC BY-SA 3.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/3.0",
    imageAttributionText: "Photo by Sbane5001 / Wikimedia Commons / CC BY-SA 3.0"
  },
  // Swordtail
  "Xiphophorus hellerii": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Pair_of_Red_Wag_Swordtails.jpg/330px-Pair_of_Red_Wag_Swordtails.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Pair_of_Red_Wag_Swordtails.jpg/960px-Pair_of_Red_Wag_Swordtails.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:Pair_of_Red_Wag_Swordtails.jpg",
    imageLicenseType: "CC BY-SA 4.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/4.0",
    imageAttributionText: "Photo by Adam G. Stern / Wikimedia Commons / CC BY-SA 4.0"
  },
  // Molly
  "Poecilia sphenops": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Poecilia_sphenops_9830047.jpg/330px-Poecilia_sphenops_9830047.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Poecilia_sphenops_9830047.jpg/960px-Poecilia_sphenops_9830047.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:Poecilia_sphenops_9830047.jpg",
    imageLicenseType: "CC BY 4.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by/4.0",
    imageAttributionText: "Photo by Tereso Hernández Morales / Wikimedia Commons / CC BY 4.0"
  },
  // Bronze Cory
  "Corydoras aeneus": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Corydoras_aeneus_01.jpg/330px-Corydoras_aeneus_01.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Corydoras_aeneus_01.jpg/960px-Corydoras_aeneus_01.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:Corydoras_aeneus_01.jpg",
    imageLicenseType: "CC BY-SA 4.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/4.0",
    imageAttributionText: "Photo by Gabriel Resende Veiga / Wikimedia Commons / CC BY-SA 4.0"
  },
  // Common Pleco
  "Hypostomus plecostomus": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Hypostomus_plecostomus_-_Rapha%C3%ABl_Covain.png/330px-Hypostomus_plecostomus_-_Rapha%C3%ABl_Covain.png",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/c/c1/Hypostomus_plecostomus_-_Rapha%C3%ABl_Covain.png",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:Hypostomus_plecostomus_-_Rapha%C3%ABl_Covain.png",
    imageLicenseType: "CC BY-SA 4.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/4.0",
    imageAttributionText: "Photo by Raphaël Covain / NHM Geneva / Wikimedia Commons / CC BY-SA 4.0"
  },
  // Clown Loach
  "Chromobotia macracanthus": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Chromobotia_macracanthus_%28Bleeker%2C_1852%29_Clown_loach.jpg/330px-Chromobotia_macracanthus_%28Bleeker%2C_1852%29_Clown_loach.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Chromobotia_macracanthus_%28Bleeker%2C_1852%29_Clown_loach.jpg/960px-Chromobotia_macracanthus_%28Bleeker%2C_1852%29_Clown_loach.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:Chromobotia_macracanthus_(Bleeker,_1852)_Clown_loach.jpg",
    imageLicenseType: "CC BY-SA 4.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/4.0",
    imageAttributionText: "Photo by Andrej Jakubík / Wikimedia Commons / CC BY-SA 4.0"
  },
  // Angelfish
  "Pterophyllum scalare": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Angelfish_-_Marble_%28Pterophyllum_scalare%29.jpg/330px-Angelfish_-_Marble_%28Pterophyllum_scalare%29.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Angelfish_-_Marble_%28Pterophyllum_scalare%29.jpg/960px-Angelfish_-_Marble_%28Pterophyllum_scalare%29.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:Angelfish_-_Marble_(Pterophyllum_scalare).jpg",
    imageLicenseType: "CC BY-SA 3.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/3.0",
    imageAttributionText: "Photo by Fish-Hed / Wikimedia Commons / CC BY-SA 3.0"
  },
  // Jack Dempsey
  "Rocio octofasciata": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Jack_Dempsey_%28Rocio_octofasciata%29_-_Carwash_Cenote_QR.jpg/330px-Jack_Dempsey_%28Rocio_octofasciata%29_-_Carwash_Cenote_QR.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Jack_Dempsey_%28Rocio_octofasciata%29_-_Carwash_Cenote_QR.jpg/960px-Jack_Dempsey_%28Rocio_octofasciata%29_-_Carwash_Cenote_QR.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:Jack_Dempsey_(Rocio_octofasciata)_-_Carwash_Cenote_QR.jpg",
    imageLicenseType: "CC BY-SA 2.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/2.0",
    imageAttributionText: "Photo by Bernard DUPONT / Wikimedia Commons / CC BY-SA 2.0"
  },
  // Firemouth Cichlid
  "Thorichthys meeki": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Cichlasoma_meeki.jpg/330px-Cichlasoma_meeki.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Cichlasoma_meeki.jpg/960px-Cichlasoma_meeki.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:Cichlasoma_meeki.jpg",
    imageLicenseType: "CC BY 3.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by/3.0",
    imageAttributionText: "Photo by Doronenko / Wikimedia Commons / CC BY 3.0"
  },
  // Discus
  "Symphysodon aequifasciatus": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Symphysodon_aequifasciatus_-_Karlsruhe_Zoo_01.jpg/330px-Symphysodon_aequifasciatus_-_Karlsruhe_Zoo_01.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Symphysodon_aequifasciatus_-_Karlsruhe_Zoo_01.jpg/960px-Symphysodon_aequifasciatus_-_Karlsruhe_Zoo_01.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:Symphysodon_aequifasciatus_-_Karlsruhe_Zoo_01.jpg",
    imageLicenseType: "CC BY-SA 3.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/3.0",
    imageAttributionText: "Photo by H. Zell / Wikimedia Commons / CC BY-SA 3.0"
  },
  // Oscar
  "Astronotus ocellatus": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Oscar_fish_%28Astronotus_ocellatus%29.jpg/330px-Oscar_fish_%28Astronotus_ocellatus%29.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Oscar_fish_%28Astronotus_ocellatus%29.jpg/960px-Oscar_fish_%28Astronotus_ocellatus%29.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:Oscar_fish_(Astronotus_ocellatus).jpg",
    imageLicenseType: "CC BY-SA 4.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/4.0",
    imageAttributionText: "Photo by Clément Bardot / Wikimedia Commons / CC BY-SA 4.0"
  },
  // Cherry Barb
  "Puntius titteya": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Cherry_barb%2C_Puntius_titteya.jpg/330px-Cherry_barb%2C_Puntius_titteya.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Cherry_barb%2C_Puntius_titteya.jpg/960px-Cherry_barb%2C_Puntius_titteya.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:Cherry_barb,_Puntius_titteya.jpg",
    imageLicenseType: "CC BY 2.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by/2.0",
    imageAttributionText: "Photo by Brian Gratwicke / Wikimedia Commons / CC BY 2.0"
  },
  // Tiger Barb
  "Puntigrus tetrazona": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Tiger_Barb_700.jpg/330px-Tiger_Barb_700.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/1/12/Tiger_Barb_700.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:Tiger_Barb_700.jpg",
    imageLicenseType: "CC BY-SA 2.5",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/2.5",
    imageAttributionText: "Photo by Derek Ramsey / Wikimedia Commons / CC BY-SA 2.5"
  },
  // Rosy Barb
  "Pethia conchonius": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Puntius_conchonius.jpg/330px-Puntius_conchonius.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Puntius_conchonius.jpg/960px-Puntius_conchonius.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:Puntius_conchonius.jpg",
    imageLicenseType: "CC BY-SA 4.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/4.0",
    imageAttributionText: "Photo by Marrabbio2 / Wikimedia Commons / CC BY-SA 4.0"
  },
  // Rainbow Shark
  "Epalzeorhynchos frenatum": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Epalzeorhynchos_frenatum.jpg/330px-Epalzeorhynchos_frenatum.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Epalzeorhynchos_frenatum.jpg/960px-Epalzeorhynchos_frenatum.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:Epalzeorhynchos_frenatum.jpg",
    imageLicenseType: "CC BY-SA 2.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/2.0",
    imageAttributionText: "Photo by MerlinSenger / Wikimedia Commons / CC BY-SA 2.0"
  },
  // Red-tailed Black Shark
  "Epalzeorhynchos bicolor": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Epalzeorhynchos_bicolor.jpg/330px-Epalzeorhynchos_bicolor.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Epalzeorhynchos_bicolor.jpg/960px-Epalzeorhynchos_bicolor.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:Epalzeorhynchos_bicolor.jpg",
    imageLicenseType: "CC BY-SA 3.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/3.0",
    imageAttributionText: "Photo by Caveman99 / Wikimedia Commons / CC BY-SA 3.0"
  },
  // Common / Comet Goldfish
  "Carassius auratus": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Goldfish3.jpg/330px-Goldfish3.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/e/e9/Goldfish3.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:Goldfish3.jpg",
    imageLicenseType: "Public Domain",
    imageLicenseUrl:  "https://creativecommons.org/publicdomain/zero/1.0",
    imageAttributionText: "Duane Raver, U.S. Fish and Wildlife Service / Wikimedia Commons / Public Domain"
  },
  // Amano Shrimp
  "Caridina multidentata": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Amano_Shrimp.jpg/330px-Amano_Shrimp.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Amano_Shrimp.jpg/960px-Amano_Shrimp.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:Amano_Shrimp.jpg",
    imageLicenseType: "CC BY-SA 4.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/4.0",
    imageAttributionText: "Photo by Atulbhats / Wikimedia Commons / CC BY-SA 4.0"
  },
  // Mystery Snail
  "Pomacea bridgesii": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Pomacea_bridgesii.jpg/330px-Pomacea_bridgesii.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/d/d5/Pomacea_bridgesii.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:Pomacea_bridgesii.jpg",
    imageLicenseType: "CC BY-SA 4.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/4.0",
    imageAttributionText: "Photo by BrittanyU / Wikimedia Commons / CC BY-SA 4.0"
  },
  // Fancy Goldfish (shares image with Carassius auratus — different variety)
  "Carassius auratus (fancy)": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Goldfish_carassius_auratus.jpg/330px-Goldfish_carassius_auratus.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/6/62/Goldfish_carassius_auratus.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:Goldfish_carassius_auratus.jpg",
    imageLicenseType: "Public Domain",
    imageLicenseUrl:  "https://creativecommons.org/publicdomain/zero/1.0",
    imageAttributionText: "Duane Raver, U.S. Fish and Wildlife Service / Wikimedia Commons / Public Domain"
  },
  // ===== TIER 2 SPECIES IMAGES =====

  // Pearl Gourami
  "Trichopodus leerii": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Trichopodus_leerii.jpg/330px-Trichopodus_leerii.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/9/97/Trichopodus_leerii.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3ATrichopodus_leerii.jpg",
    imageLicenseType: "CC BY-SA 4.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/4.0",
    imageAttributionText: "Photo by BEDO (Thailand) / Wikimedia Commons / CC BY-SA 4.0"
  },
  // Honey Gourami
  "Trichogaster chuna": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Colisa_chuna_male.jpg/330px-Colisa_chuna_male.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Colisa_chuna_male.jpg/960px-Colisa_chuna_male.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3AColisa_chuna_male.jpg",
    imageLicenseType: "CC BY-SA 3.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/3.0",
    imageAttributionText: "Photo by Wilder (Wikimedia Commons) / Wikimedia Commons / CC BY-SA 3.0"
  },
  // Paradise Fish
  "Macropodus opercularis": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Macropodus_opercularis_-_front_%28aka%29.jpg/330px-Macropodus_opercularis_-_front_%28aka%29.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Macropodus_opercularis_-_front_%28aka%29.jpg/960px-Macropodus_opercularis_-_front_%28aka%29.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3AMacropodus_opercularis_-_front_%28aka%29.jpg",
    imageLicenseType: "CC BY-SA 2.5",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/2.5",
    imageAttributionText: "Photo by André Karwath aka Aka / Wikimedia Commons / CC BY-SA 2.5"
  },
  // Ember Tetra
  "Hyphessobrycon amandae": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Hyphessobrycon_amandae_%28Amber_tetra%29.jpg/330px-Hyphessobrycon_amandae_%28Amber_tetra%29.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Hyphessobrycon_amandae_%28Amber_tetra%29.jpg/960px-Hyphessobrycon_amandae_%28Amber_tetra%29.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3AHyphessobrycon_amandae_%28Amber_tetra%29.jpg",
    imageLicenseType: "CC BY-SA 3.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/3.0",
    imageAttributionText: "Photo by Pascal Wolterman / Wikimedia Commons / CC BY-SA 3.0"
  },
  // Black Skirt Tetra
  "Gymnocorymbus ternetzi": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Gymnocorymbus_ternetzi.JPG/330px-Gymnocorymbus_ternetzi.JPG",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Gymnocorymbus_ternetzi.JPG/960px-Gymnocorymbus_ternetzi.JPG",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3AGymnocorymbus_ternetzi.JPG",
    imageLicenseType: "CC BY-SA 3.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/3.0",
    imageAttributionText: "Photo by emptyvi / Wikimedia Commons / CC BY-SA 3.0"
  },
  // Serpae Tetra
  "Hyphessobrycon eques": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Hyphessobrycon_eques.jpg/330px-Hyphessobrycon_eques.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/4/4c/Hyphessobrycon_eques.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3AHyphessobrycon_eques.jpg",
    imageLicenseType: "Public domain",
    imageLicenseUrl:  "https://creativecommons.org/publicdomain/zero/1.0",
    imageAttributionText: "Photo by Dubrovsky Alexander (Aledubr) / Wikimedia Commons / Public domain"
  },
  // Rummy-nose Tetra
  "Hemigrammus rhodostomus": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Hemigrammus_rhodostomus.jpg/330px-Hemigrammus_rhodostomus.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Hemigrammus_rhodostomus.jpg/960px-Hemigrammus_rhodostomus.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3AHemigrammus_rhodostomus.jpg",
    imageLicenseType: "CC BY-SA 3.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/3.0",
    imageAttributionText: "Photo by Gavinevans / Wikimedia Commons / CC BY-SA 3.0"
  },
  // Black Neon Tetra
  "Hyphessobrycon herbertaxelrodi": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Black_neon_tetra.jpg/330px-Black_neon_tetra.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Black_neon_tetra.jpg/960px-Black_neon_tetra.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3ABlack_neon_tetra.jpg",
    imageLicenseType: "CC BY-SA 3.0",
    imageLicenseUrl:  "http://creativecommons.org/licenses/by-sa/3.0/",
    imageAttributionText: "Photo by Debivort / Wikimedia Commons / CC BY-SA 3.0"
  },
  // Glowlight Tetra
  "Hemigrammus erythrozonus": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Tetra_Glowlight_cropped.jpg/330px-Tetra_Glowlight_cropped.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/b/b4/Tetra_Glowlight_cropped.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3ATetra_Glowlight_cropped.jpg",
    imageLicenseType: "CC BY 2.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by/2.0",
    imageAttributionText: "Photo by gonzalovalenzuela (Flickr) / Wikimedia Commons / CC BY 2.0"
  },
  // Congo Tetra
  "Phenacogrammus interruptus": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Phenacogrammus_interruptus_%28aka%29.jpg/330px-Phenacogrammus_interruptus_%28aka%29.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Phenacogrammus_interruptus_%28aka%29.jpg/960px-Phenacogrammus_interruptus_%28aka%29.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3APhenacogrammus_interruptus_%28aka%29.jpg",
    imageLicenseType: "CC BY-SA 2.5",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/2.5",
    imageAttributionText: "Photo by André Karwath aka Aka / Wikimedia Commons / CC BY-SA 2.5"
  },
  // Pearl Danio
  "Danio albolineatus": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Danio_albolineatus.jpg/330px-Danio_albolineatus.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Danio_albolineatus.jpg/960px-Danio_albolineatus.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3ADanio_albolineatus.jpg",
    imageLicenseType: "Public domain",
    imageLicenseUrl:  "https://creativecommons.org/publicdomain/zero/1.0",
    imageAttributionText: "Photo by Sc99cs / Wikimedia Commons / Wikimedia Commons / Public domain"
  },
  // Giant Danio
  "Devario aequipinnatus": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Devario_aequipinnatus.JPG/330px-Devario_aequipinnatus.JPG",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Devario_aequipinnatus.JPG/960px-Devario_aequipinnatus.JPG",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3ADevario_aequipinnatus.JPG",
    imageLicenseType: "CC BY-SA 2.5",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/2.5",
    imageAttributionText: "Photo by Faucon / Wikimedia Commons / CC BY-SA 2.5"
  },
  // Endler's Livebearer
  "Poecilia wingei": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Poecilia_wingei_Tres_picos.jpg/330px-Poecilia_wingei_Tres_picos.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Poecilia_wingei_Tres_picos.jpg/960px-Poecilia_wingei_Tres_picos.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3APoecilia_wingei_Tres_picos.jpg",
    imageLicenseType: "CC BY 2.5",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by/2.5",
    imageAttributionText: "Photo by Fernando JMago / Wikimedia Commons / CC BY 2.5"
  },
  // Sailfin Molly
  "Poecilia latipinna": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Poecilia_latipinna.jpg/330px-Poecilia_latipinna.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/1/16/Poecilia_latipinna.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3APoecilia_latipinna.jpg",
    imageLicenseType: "Public domain",
    imageLicenseUrl:  "https://creativecommons.org/publicdomain/zero/1.0",
    imageAttributionText: "Photo by Wikimedia Commons contributor / Wikimedia Commons / Public domain"
  },
  // Panda Cory
  "Corydoras panda": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Corydoras_panda_01.jpg/330px-Corydoras_panda_01.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/9/97/Corydoras_panda_01.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3ACorydoras_panda_01.jpg",
    imageLicenseType: "Public domain",
    imageLicenseUrl:  "https://creativecommons.org/publicdomain/zero/1.0",
    imageAttributionText: "Photo by Calilasseia / Wikimedia Commons / Wikimedia Commons / Public domain"
  },
  // Bristlenose Pleco
  "Ancistrus cirrhosus": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Ancistrus_cirrhosus.jpg/330px-Ancistrus_cirrhosus.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Ancistrus_cirrhosus.jpg/960px-Ancistrus_cirrhosus.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3AAncistrus_cirrhosus.jpg",
    imageLicenseType: "CC BY-SA 3.0 de",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/3.0/de",
    imageAttributionText: "Photo by The Last 99 / Wikimedia Commons / CC BY-SA 3.0 de"
  },
  // Kuhli Loach
  "Pangio kuhlii": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Pangio_kuhlii.jpg/330px-Pangio_kuhlii.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/9/9e/Pangio_kuhlii.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3APangio_kuhlii.jpg",
    imageLicenseType: "CC BY-SA 3.0",
    imageLicenseUrl:  "http://creativecommons.org/licenses/by-sa/3.0/",
    imageAttributionText: "Photo by User:Louie / Wikimedia Commons / CC BY-SA 3.0"
  },
  // Weather Loach
  "Misgurnus anguillicaudatus": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Misgurnus_anguillicaudatus.jpg/330px-Misgurnus_anguillicaudatus.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/8/86/Misgurnus_anguillicaudatus.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3AMisgurnus_anguillicaudatus.jpg",
    imageLicenseType: "Public domain",
    imageLicenseUrl:  "https://creativecommons.org/publicdomain/zero/1.0",
    imageAttributionText: "Photo by Wikimedia Commons contributor / Wikimedia Commons / Public domain"
  },
  // German Blue Ram
  "Mikrogeophagus ramirezi": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Mikrogeophagus_ramirezi_%28cropped%29%2C_2017.jpg/330px-Mikrogeophagus_ramirezi_%28cropped%29%2C_2017.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Mikrogeophagus_ramirezi_%28cropped%29%2C_2017.jpg/960px-Mikrogeophagus_ramirezi_%28cropped%29%2C_2017.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3AMikrogeophagus_ramirezi_%28cropped%29%2C_2017.jpg",
    imageLicenseType: "Public domain",
    imageLicenseUrl:  "https://creativecommons.org/publicdomain/zero/1.0",
    imageAttributionText: "Photo by Eric Mengel / Wikimedia Commons / Public domain"
  },
  // Bolivian Ram
  "Mikrogeophagus altispinosus": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Mikrogeophagus_altispinosus_male.jpg/330px-Mikrogeophagus_altispinosus_male.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Mikrogeophagus_altispinosus_male.jpg/960px-Mikrogeophagus_altispinosus_male.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3AMikrogeophagus_altispinosus_male.jpg",
    imageLicenseType: "CC BY 2.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by/2.0",
    imageAttributionText: "Photo by úlfhams_víkingur / Wikimedia Commons / CC BY 2.0"
  },
  // Kribensis
  "Pelvicachromis pulcher": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Pelvicachromis_pulcher_%28aka%29.jpg/330px-Pelvicachromis_pulcher_%28aka%29.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Pelvicachromis_pulcher_%28aka%29.jpg/960px-Pelvicachromis_pulcher_%28aka%29.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3APelvicachromis_pulcher_%28aka%29.jpg",
    imageLicenseType: "CC BY-SA 2.5",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/2.5",
    imageAttributionText: "Photo by André Karwath aka Aka / Wikimedia Commons / CC BY-SA 2.5"
  },
  // Convict Cichlid
  "Amatitlania nigrofasciata": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Convict_cichlid_%28Amatitlania_nigrofasciata%29.jpg/330px-Convict_cichlid_%28Amatitlania_nigrofasciata%29.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Convict_cichlid_%28Amatitlania_nigrofasciata%29.jpg/960px-Convict_cichlid_%28Amatitlania_nigrofasciata%29.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3AConvict_cichlid_%28Amatitlania_nigrofasciata%29.jpg",
    imageLicenseType: "CC BY-SA 4.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/4.0",
    imageAttributionText: "Photo by JSutton93 / Wikimedia Commons / CC BY-SA 4.0"
  },
  // Yellow Lab Cichlid
  "Labidochromis caeruleus": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Labidochromis_caeruleus_%28male%29.jpg/330px-Labidochromis_caeruleus_%28male%29.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Labidochromis_caeruleus_%28male%29.jpg/960px-Labidochromis_caeruleus_%28male%29.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3ALabidochromis_caeruleus_%28male%29.jpg",
    imageLicenseType: "CC BY-SA 3.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/3.0",
    imageAttributionText: "Photo by Jmatz / Wikimedia Commons / CC BY-SA 3.0"
  },
  // White Cloud Mountain Minnow
  "Tanichthys albonubes": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/White_Cloud_Mountain_Minnow_1.jpg/330px-White_Cloud_Mountain_Minnow_1.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/c/c8/White_Cloud_Mountain_Minnow_1.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3AWhite_Cloud_Mountain_Minnow_1.jpg",
    imageLicenseType: "CC BY-SA 3.0",
    imageLicenseUrl:  "http://creativecommons.org/licenses/by-sa/3.0/",
    imageAttributionText: "Photo by Wikimedia Commons contributor / Wikimedia Commons / CC BY-SA 3.0"
  },
  // Green / Gold Barb
  "Puntius semifasciolatus": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Gold_Barb_Puntius_semifasciolatus_6.png/330px-Gold_Barb_Puntius_semifasciolatus_6.png",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/b/bf/Gold_Barb_Puntius_semifasciolatus_6.png",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3AGold_Barb_Puntius_semifasciolatus_6.png",
    imageLicenseType: "CC BY-SA 3.0",
    imageLicenseUrl:  "http://creativecommons.org/licenses/by-sa/3.0/",
    imageAttributionText: "Photo by Fred Hsu / Wikimedia Commons / CC BY-SA 3.0"
  },
  // Siamese Algae Eater
  "Crossocheilus oblongus": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Siamese_algae_eater_%28Crossocheilus_oblongus%29.jpg/330px-Siamese_algae_eater_%28Crossocheilus_oblongus%29.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Siamese_algae_eater_%28Crossocheilus_oblongus%29.jpg/960px-Siamese_algae_eater_%28Crossocheilus_oblongus%29.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3ASiamese_algae_eater_%28Crossocheilus_oblongus%29.jpg",
    imageLicenseType: "CC BY-SA 4.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/4.0",
    imageAttributionText: "Photo by aleander2137 / Wikimedia Commons / CC BY-SA 4.0"
  },
  // Cherry Shrimp
  "Neocaridina davidi": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Female_Neocaridina_davidi_shrimp_with_eggs.jpg/330px-Female_Neocaridina_davidi_shrimp_with_eggs.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Female_Neocaridina_davidi_shrimp_with_eggs.jpg/960px-Female_Neocaridina_davidi_shrimp_with_eggs.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3AFemale_Neocaridina_davidi_shrimp_with_eggs.jpg",
    imageLicenseType: "CC BY-SA 4.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/4.0",
    imageAttributionText: "Photo by TonyZimbinski / Wikimedia Commons / CC BY-SA 4.0"
  },
  // Ghost Shrimp
  "Palaemonetes paludosus": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Glass-shrimp-close.jpg/330px-Glass-shrimp-close.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/6/67/Glass-shrimp-close.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3AGlass-shrimp-close.jpg",
    imageLicenseType: "Public domain",
    imageLicenseUrl:  "https://creativecommons.org/publicdomain/zero/1.0",
    imageAttributionText: "Photo by Enziarro / Joseph Stansbury Rosin / Wikimedia Commons / Public domain"
  },
  // Zebra Nerite Snail
  "Neritina natalensis": {
    imageThumbUrl: "https://upload.wikimedia.org/wikipedia/commons/1/15/Neritina-natalensis_cropped.jpg",
    imageHeroUrl:  "https://upload.wikimedia.org/wikipedia/commons/1/15/Neritina-natalensis_cropped.jpg",
    imageStatus:   "approved",
    imageSourceName: "Wikimedia Commons",
    imageSourceUrl:  "https://commons.wikimedia.org/wiki/File%3ANeritina-natalensis_cropped.jpg",
    imageLicenseType: "CC BY-SA 4.0",
    imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/4.0",
    imageAttributionText: "Photo by Holger Krisp / Wikimedia Commons / CC BY-SA 4.0"
  },

};

/* Tier assignments — strings keyed by scientific name to keep FISHDB clean.
   These reflect the curator's prioritization, not the runtime behavior. */
const FISH_TIERS = {
  // Tier 1 — prioritize for free-use image sourcing & approval
  "Betta splendens": 1,
  "Trichogaster lalius": 1,
  "Paracheirodon innesi": 1,
  "Paracheirodon axelrodi": 1,
  "Trigonostigma heteromorpha": 1,
  "Danio rerio": 1,
  "Poecilia reticulata": 1,
  "Xiphophorus maculatus": 1,
  "Xiphophorus hellerii": 1,
  "Poecilia sphenops": 1,
  "Corydoras aeneus": 1,
  "Hypostomus plecostomus": 1,
  "Chromobotia macracanthus": 1,
  "Pterophyllum scalare": 1,
  "Rocio octofasciata": 1,
  "Thorichthys meeki": 1,
  "Symphysodon aequifasciatus": 1,
  "Astronotus ocellatus": 1,
  "Puntius titteya": 1,
  "Puntigrus tetrazona": 1,
  "Pethia conchonius": 1,
  "Epalzeorhynchos frenatum": 1,
  "Epalzeorhynchos bicolor": 1,
  "Carassius auratus": 1,
  "Carassius auratus (fancy)": 1,
  "Caridina multidentata": 1,
  "Pomacea bridgesii": 1,

  // Tier 2 — possible, placeholder until manually reviewed
  "Trichopodus leerii": 2,
  "Trichogaster chuna": 2,
  "Macropodus opercularis": 2,
  "Hyphessobrycon amandae": 2,
  "Gymnocorymbus ternetzi": 2,
  "Hyphessobrycon eques": 2,
  "Hemigrammus rhodostomus": 2,
  "Hyphessobrycon herbertaxelrodi": 2,
  "Hemigrammus erythrozonus": 2,
  "Phenacogrammus interruptus": 2,
  "Danio albolineatus": 2,
  "Devario aequipinnatus": 2,
  "Poecilia wingei": 2,
  "Poecilia latipinna": 2,
  "Corydoras panda": 2,
  "Ancistrus cirrhosus": 2,
  "Pangio kuhlii": 2,
  "Misgurnus anguillicaudatus": 2,
  "Mikrogeophagus ramirezi": 2,
  "Mikrogeophagus altispinosus": 2,
  "Pelvicachromis pulcher": 2,
  "Amatitlania nigrofasciata": 2,
  "Labidochromis caeruleus": 2,
  "Tanichthys albonubes": 2,
  "Puntius semifasciolatus": 2,
  "Crossocheilus oblongus": 2,
  "Neocaridina davidi": 2,
  "Palaemonetes paludosus": 2,
  "Neritina natalensis": 2
  // Everything else defaults to Tier 3 (placeholder first).
};

function fishTier(f){
  if (!f || !f.sci) return 3;
  return FISH_TIERS[f.sci] || 3;
}

/* Inline SVG silhouette — used both for the list thumbnail slot and the
   detail hero when no approved image is available. Inline (no network)
   so we never flash a broken-image icon. Currentcolor lets dark/light
   themes restyle without swapping the source. */
const FISH_SILHOUETTE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 56" width="80" height="56" aria-hidden="true" focusable="false"><g fill="currentColor" opacity="0.9"><!-- tail fin --><path d="M62 28 L76 16 L78 20 L70 28 L78 36 L76 40 Z"/><!-- body --><ellipse cx="36" cy="28" rx="22" ry="14"/><!-- dorsal fin --><path d="M26 14 Q34 6 46 10 L44 14 Z"/><!-- pectoral fin --><path d="M32 32 Q28 40 22 38 Q26 34 30 32 Z"/><!-- eye --><circle cx="20" cy="25" r="3"/><circle cx="19.5" cy="24.5" r="1.2" fill="white" opacity="0.7"/><!-- mouth --><path d="M12 28 Q14 30 12 32" stroke="currentColor" stroke-width="1.2" fill="none" opacity="0.6"/></g></svg>`;

/* Fallback fired when an approved image URL fails to load (404, blocked,
   offline). Swap the broken <img> for the inline silhouette, mark the
   parent as a placeholder, and ensure we never show a broken-image icon.
   Exposed on window so the simple onerror="" attribute can call it. */
function fishImageError(imgEl){
  if (!imgEl || imgEl.dataset.fallback) return;
  imgEl.dataset.fallback = "1";
  const parent = imgEl.parentNode;
  if (parent){
    parent.classList.add("species-thumb-placeholder", "species-hero-placeholder");
    parent.classList.remove("species-thumb-img", "species-hero-img");
    // Drop any sibling attribution if present.
    const attr = parent.querySelector(".species-hero-attr");
    if (attr) attr.remove();
  }
  // Replace the <img> with the inline silhouette markup.
  const tmp = document.createElement("div");
  tmp.innerHTML = FISH_SILHOUETTE_SVG;
  const svg = tmp.firstChild;
  if (svg && parent) parent.replaceChild(svg, imgEl);
}
window.fishImageError = fishImageError;

/* Image resolution. Returns a normalized record describing what to show.
   Used by both the card list (thumb) and the detail screen (hero). */
function fishImage(f, variant){
  // variant: "thumb" | "hero"
  const v = variant === "hero" ? "hero" : "thumb";
  const empty = {
    isPlaceholder: true,
    src: "",
    silhouette: FISH_SILHOUETTE_SVG,
    status: "placeholder",
    sourceName: "",
    sourceUrl: "",
    licenseType: "",
    licenseUrl: "",
    attribution: ""
  };
  if (!f) return empty;
  const rec = (f.sci && FISH_IMAGES[f.sci]) || null;
  if (!rec) return empty;
  if (rec.imageStatus !== "approved") return { ...empty, status: rec.imageStatus || "placeholder" };
  const src = v === "hero" ? rec.imageHeroUrl : rec.imageThumbUrl;
  if (!src) return { ...empty, status: rec.imageStatus };
  return {
    isPlaceholder: false,
    src,
    silhouette: FISH_SILHOUETTE_SVG,
    status: "approved",
    sourceName:  rec.imageSourceName  || "",
    sourceUrl:   rec.imageSourceUrl   || "",
    licenseType: rec.imageLicenseType || "",
    licenseUrl:  rec.imageLicenseUrl  || "",
    attribution: rec.imageAttributionText || ""
  };
}

window.FISHDB_API = {
  all: FISHDB,
  search: fishSearch,
  browse: fishBrowse,
  categories: fishCategories,
  byName: fishByName,
  match: fishMatch,
  card: fishCard,
  profileCard: fishProfileCard,
  sources: fishSources,
  conservation: fishConservation,
  profileSummary: fishProfileSummary,
  compatibility: fishCompatibility,
  image: fishImage,
  tier: fishTier,
  silhouette: FISH_SILHOUETTE_SVG,
  thumbHTML: fishThumbHTML,
  heroHTML: fishHeroHTML
};
