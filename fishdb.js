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
  // Example skeleton (commented out so v1 ships placeholder-only and
  // every approval is a deliberate, reviewed addition):
  //
  // "Betta splendens": {
  //   imageThumbUrl: "https://.../betta_thumb.jpg",
  //   imageHeroUrl:  "https://.../betta_hero.jpg",
  //   imageStatus:   "approved",
  //   imageSourceName: "Wikimedia Commons",
  //   imageSourceUrl:  "https://commons.wikimedia.org/wiki/File:...",
  //   imageLicenseType: "CC-BY-SA 4.0",
  //   imageLicenseUrl:  "https://creativecommons.org/licenses/by-sa/4.0/",
  //   imageAttributionText: "Photo by ... / Wikimedia / CC-BY-SA 4.0"
  // },
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
const FISH_SILHOUETTE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 40" aria-hidden="true" focusable="false"><path fill="currentColor" d="M40 20c0-8-9-14-19-14-7 0-13 3-17 7 4 1 7 4 7 7s-3 6-7 7c4 4 10 7 17 7 10 0 19-6 19-14zm-25-2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm32-6 13-7c1-.5 2 .3 2 1.4v27.2c0 1.1-1.1 1.9-2 1.4l-13-7c-1-.5-1-2 0-2.5l4.5-2.4c.6-.3.6-1.2 0-1.5L47 14.5c-1-.5-1-2 0-2.5z"/></svg>`;

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
