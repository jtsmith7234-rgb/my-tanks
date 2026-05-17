/* ============================================================
   ADVISOR — Expert freshwater rules engine
   Produces a single top recommendation per tank, plus logs it to history.
   Severity: "urgent" (red) | "soon" (amber) | "fyi" (sakura)

   THRESHOLDS sourced from:
   • Aqueon — Freshwater water quality guide (ammonia must be 0; nitrate >50 ppm undesirable; pH 6.8–7.8 for tropicals)
     https://www.aqueon.com/articles/freshwater-aquarium-water-quality
   • AquariumScience.org — API ammonia/nitrite ≤0.25 = "undetectable"; >0.25 indicates poor biofiltration
     https://aquariumscience.org/5-ammonia-nitrite-nitrate-and-chlorine/
   • Seachem Prime (official) — 1 mL per 10 US gal; safe at 5x for emergency nitrite detox; dose every 24-48h
     https://seachem.zendesk.com/hc/en-us/articles/115000125454
   • Seachem Stability (official) — 1 cap (5 mL) per 10 gal day 1; then 1 cap per 20 gal daily for 7 days
     https://seachem.zendesk.com/hc/en-us/articles/115000127873
   • Aquarium Co-Op — Easy Green target ~50 ppm nitrate in planted tanks
     https://www.aquariumcoop.com/products/easy-green
   • PetMD / Buce Plant — Betta: 76-81°F, pH 6.5-7.8 (target ~7), ammonia 0, nitrate <20 ppm
     https://www.petmd.com/fish/betta-fish-care-sheet
     https://buceplant.com/blogs/aquascaping-guides-and-tips/keeping-bettas-how-to-care-for-a-betta-fish
   ============================================================ */

const DAY = 86400000;

function _daysAgo(ts){ return ts ? Math.round((Date.now() - ts) / DAY) : null; }
function _numOr(v, d){ const n = parseFloat(v); return isNaN(n) ? d : n; }

/* Severity rank for sorting; higher wins */
const SEV_RANK = { urgent: 3, soon: 2, fyi: 1 };

/* ---------- Core rule helpers ---------- */
function _tankAnimals(t){
  return (t.fish || []).reduce((s,f) => s + (parseInt(f.count,10) || 0), 0);
}

/* Aggressive water-change cadence: more stocked + more nitrate ⇒ shorter interval */
function _idealChangeIntervalDays(tank, lastTest){
  const animals = _tankAnimals(tank);
  const gallons = parseFloat(tank.gallons) || 10;
  const density = animals / gallons;   // animals per gallon
  let base = 9;                        // baseline 9 days
  if (density > 0.6) base = 7;         // heavily stocked
  if (density > 1.0) base = 5;         // overstocked
  // Tighten further if last nitrate was high
  if (lastTest){
    const n = _numOr(lastTest.data && lastTest.data.nitrate, NaN);
    if (!isNaN(n)){
      if (n > 40) base = Math.min(base, 4);
      else if (n > 20) base = Math.min(base, 7);
    }
  }
  return base;
}

/* ---------- The rules ---------- */
function computeAdvice(tank){
  const evs = (window.events && window.events[tank.id]) ? window.events[tank.id] : [];
  // Ignore advisor events themselves when looking at "real" activity
  const real = evs.filter(e => e.type !== "advisor");
  const lastChange = real.find(e => e.type === "water_change") || null;
  const lastTest   = real.find(e => e.type === "water_test")   || null;
  const recentTests= real.filter(e => e.type === "water_test").slice(0, 4);

  const out = [];

  /* RULE 1: Ammonia or nitrite detected ⇒ urgent */
  if (lastTest){
    const d = lastTest.data || {};
    const amm = _numOr(d.ammonia, NaN);
    const nit = _numOr(d.nitrite, NaN);
    if (!isNaN(amm) && amm > 0){
      out.push({
        sev: amm >= 0.25 ? "urgent" : "soon",
        title: amm >= 0.25
          ? "Ammonia is unsafe right now"
          : "Trace ammonia detected",
        body: `Your last test showed ammonia at ${amm} ppm. Even 0.25 ppm burns gills over time. ` +
              `Do a 50% water change today and dose Prime — it detoxifies ammonia for ~24-48 hours while your filter catches up. ` +
              `If your tank is under 6 weeks old, it isn't fully cycled; feed lightly.`,
        rule: `ammonia=${amm} ppm`
      });
    }
    if (!isNaN(nit) && nit > 0){
      out.push({
        sev: nit >= 0.25 ? "urgent" : "soon",
        title: nit >= 0.25 ? "Nitrite is unsafe" : "Trace nitrite detected",
        body: `Nitrite at ${nit} ppm means your bacterial colony hasn't fully caught up. ` +
              `Do a 30-50% water change, dose Prime, and add Stability for 7 days. ` +
              `Don't add new fish until ammonia and nitrite both stay at 0 for two consecutive tests.`,
        rule: `nitrite=${nit} ppm`
      });
    }
  }

  /* RULE 2: Nitrate over 40 ⇒ urgent. 20-40 ⇒ soon. Trending up ⇒ fyi. */
  if (lastTest){
    const n = _numOr(lastTest.data && lastTest.data.nitrate, NaN);
    if (!isNaN(n)){
      // Betta tanks have a tighter target (<20 ppm per PetMD / Buce Plant)
      const isBetta = (tank.fish || []).some(f => /betta/i.test(f.species || f.name || ""));
      if (n > 50){
        out.push({
          sev: "urgent",
          title: "Nitrate is dangerously high",
          body: `Last reading was ${n} ppm. Aqueon flags anything above 50 ppm as undesirable in freshwater tanks. ` +
                `Do a 40-50% water change today, then a second 25% change in 2-3 days to bring it down gradually (avoid pH shock).`,
          rule: `nitrate=${n} ppm`
        });
      } else if (n > 40){
        out.push({
          sev: "urgent",
          title: "Nitrate is high",
          body: `Last reading was ${n} ppm. Above 40 ppm stresses most community fish and stalls plant growth. ` +
                `Do a 40-50% water change this week and shorten your water-change interval going forward.`,
          rule: `nitrate=${n} ppm`
        });
      } else if (isBetta && n > 20){
        out.push({
          sev: "soon",
          title: "Nitrate above betta target",
          body: `Last reading was ${n} ppm. Bettas do best under 20 ppm (per PetMD & Buce Plant). ` +
                `A 25-30% water change in the next day or two brings you back to the target range.`,
          rule: `nitrate=${n} ppm (betta tank)`
        });
      } else if (n > 20){
        out.push({
          sev: "soon",
          title: "Nitrate creeping up",
          body: `Last reading was ${n} ppm. Long-term above 20 ppm stresses sensitive species (tetras, shrimp) and slows plant growth. ` +
                `A 25-30% change in the next day or two will bring it back down.`,
          rule: `nitrate=${n} ppm`
        });
      } else if (recentTests.length >= 3){
        const trend = recentTests
          .map(t => _numOr(t.data && t.data.nitrate, NaN))
          .filter(v => !isNaN(v));
        if (trend.length >= 3 && trend[0] - trend[trend.length-1] >= 10){
          out.push({
            sev: "fyi",
            title: "Nitrate is trending up",
            body: `Over your last few tests, nitrate climbed from ${trend[trend.length-1]} → ${trend[0]} ppm. ` +
                  `Not urgent, but a slightly larger or more frequent water change will keep it in check.`,
            rule: `nitrate trend ${trend.join(" → ")}`
          });
        }
      }
    }
  }

  /* RULE 3: pH (Aqueon: tropicals 6.8-7.8; ammonia toxicity rises sharply >7.0) */
  if (lastTest){
    const ph = _numOr(lastTest.data && lastTest.data.ph, NaN);
    if (!isNaN(ph)){
      if (ph < 6.0 || ph > 8.4){
        out.push({
          sev: "urgent",
          title: "pH is out of safe range",
          body: `pH read ${ph}. Most freshwater community fish do best between 6.8–7.8 (Aqueon). ` +
                `Don't try to correct it fast — change pH no more than 0.2 per 24 hours to avoid shock. ` +
                `Check your tap pH for baseline; aquasoil and driftwood lower it, crushed coral raises it.`,
          rule: `ph=${ph}`
        });
      } else if (ph < 6.5 || ph > 7.8){
        out.push({
          sev: "fyi",
          title: "pH is drifting",
          body: `pH read ${ph}. Still safe for hardy community fish, but the ideal sweet spot is 6.8–7.4 for tetras, rasboras, and bettas. ` +
                `Stability matters more than the exact number — match your tap water if you can.`,
          rule: `ph=${ph}`
        });
      }
    }
  }

  /* RULE 3b: Temperature (Aqueon tropical 75-80°F; PetMD betta 76-81°F) */
  if (lastTest){
    const temp = _numOr(lastTest.data && lastTest.data.temp, NaN);
    if (!isNaN(temp)){
      const isBetta = (tank.fish || []).some(f => /betta/i.test(f.species || f.name || ""));
      const lo = isBetta ? 76 : 72;
      const hi = isBetta ? 82 : 82;
      if (temp < lo - 4 || temp > hi + 4){
        out.push({
          sev: "urgent",
          title: "Water temperature is unsafe",
          body: `Last reading was ${temp}°F. ${isBetta ? "Bettas need 76–81°F (PetMD)" : "Most tropical fish do best 75–80°F (Aqueon)"}. ` +
                `Check your heater — a stuck or undersized heater is the usual cause. Aim for 3-5 watts per gallon.`,
          rule: `temp=${temp}°F`
        });
      } else if (temp < lo || temp > hi){
        out.push({
          sev: "soon",
          title: "Temperature is drifting",
          body: `Tank is at ${temp}°F. Target ${lo}–${hi}°F. Stability matters more than the exact number — avoid changes faster than 2°F per hour during water changes.`,
          rule: `temp=${temp}°F`
        });
      }
    }
  }

  /* RULE 4: Water-change cadence */
  if (lastChange){
    const days = _daysAgo(lastChange.ts);
    const ideal = _idealChangeIntervalDays(tank, lastTest);
    if (days >= ideal + 5){
      out.push({
        sev: "urgent",
        title: "Water change overdue",
        body: `It's been ${days} days since your last water change on ${tank.name}. ` +
              `For ${_tankAnimals(tank)} animals in ${tank.gallons} gal, aim for every ~${ideal} days. ` +
              `Plan a 30-40% change today or tomorrow.`,
        rule: `${days}d since last WC, ideal ~${ideal}d`
      });
    } else if (days >= ideal){
      out.push({
        sev: "soon",
        title: "Water change due",
        body: `${days} days since your last change — about right for this stocking. A 25-30% change in the next day or two keeps nitrates steady.`,
        rule: `${days}d since last WC, ideal ~${ideal}d`
      });
    } else if (days >= ideal - 2){
      out.push({
        sev: "fyi",
        title: "Water change coming up",
        body: `${days} days since last change. You're on track — plan to do one in ~${ideal - days} day(s).`,
        rule: `${days}d since last WC, ideal ~${ideal}d`
      });
    }
  } else if (real.length){
    // Tank has activity but no water change ever logged
    out.push({
      sev: "soon",
      title: "No water changes logged yet",
      body: `Heads up — once you log your first water change on the Clean & Dose tab, future recommendations will be timed to your specific schedule.`,
      rule: "no water_change events"
    });
  }

  /* RULE 5: Stocking density sanity */
  const animals = _tankAnimals(tank);
  const gallons = parseFloat(tank.gallons) || 0;
  if (gallons > 0){
    const ratio = animals / gallons;
    if (ratio > 1.3){
      out.push({
        sev: "soon",
        title: "Tank is heavily stocked",
        body: `You've got ${animals} animals in ${gallons} gal (${ratio.toFixed(2)}/gal). This is above community-tank guidance (~1 small fish per gallon). ` +
              `Keep filtration aggressive (2x rated turnover), test water weekly, and avoid adding more livestock until nitrate stays under 20 between changes.`,
        rule: `${animals} animals in ${gallons}g (${ratio.toFixed(2)}/gal)`
      });
    }
  }

  /* RULE 6: Dosing sanity — last water change's dose vs gallons */
  if (lastChange){
    const d = lastChange.data || {};
    const g = parseFloat(d.gallons) || 0;
    if (g > 0){
      // Seachem Prime: 1 mL per 10 gal NEW water (5 mL per 50 gal cap)
      // Seachem Stability: 1 cap (5 mL) per 10 gal day 1, then 1 cap per 20 gal daily — your maintenance rule of 1 mL/10 gal per change matches the 'with each water change' guidance
      const expectedPrime = g / 10;
      const expectedStab  = g / 10;
      const actualPrime = parseFloat(d.prime_mL);
      const actualStab  = parseFloat(d.stability_mL);
      if (!isNaN(actualPrime) && Math.abs(actualPrime - expectedPrime) >= Math.max(1, expectedPrime * 0.5)){
        out.push({
          sev: "fyi",
          title: "Prime dose looked off last time",
          body: `On the last water change (${g} gal), you logged ${actualPrime} mL of Prime. Your rule is 1 mL per 10 gal → ${expectedPrime} mL expected. ` +
                `Not dangerous — Prime has a wide safety margin — just worth keeping consistent.`,
          rule: `Prime ${actualPrime} vs expected ${expectedPrime} mL`
        });
      }
      if (!isNaN(actualStab) && Math.abs(actualStab - expectedStab) >= Math.max(1, expectedStab * 0.5)){
        out.push({
          sev: "fyi",
          title: "Stability dose looked off last time",
          body: `Stability was ${actualStab} mL on ${g} gal. Expected ~${expectedStab} mL (1 mL per 10 gal). Stability is harmless overdosed, but consistency keeps your colony predictable.`,
          rule: `Stability ${actualStab} vs expected ${expectedStab} mL`
        });
      }
    }
  }

  /* RULE 7: No test data ever */
  if (!lastTest && real.length >= 1){
    out.push({
      sev: "fyi",
      title: "Log a water test soon",
      body: `Recommendations get sharper once you log a test. Even one set of readings (pH, ammonia, nitrite, nitrate) tells me a lot about how your tank is doing.`,
      rule: "no water_test events"
    });
  }

  /* RULE 8: Test very stale */
  if (lastTest){
    const td = _daysAgo(lastTest.ts);
    if (td >= 21){
      out.push({
        sev: "fyi",
        title: "Time for a fresh water test",
        body: `Last test was ${td} days ago. Conditions drift between tests — a fresh reading would help me catch issues earlier.`,
        rule: `last test ${td}d ago`
      });
    }
  }

  /* Pick the most severe recommendation */
  out.sort((a,b) => (SEV_RANK[b.sev] || 0) - (SEV_RANK[a.sev] || 0));
  return out[0] || null;
}

/* ---------- History logging — once per (tank, rule) ---------- */
function _ruleSignature(adv){
  // Stable across re-renders of the same situation so we don't spam history.
  return adv ? (adv.title + " | " + adv.rule) : null;
}
function _hasRecentMatchingAdvice(tankId, sig){
  const evs = (window.events && window.events[tankId]) || [];
  // Look back 36h for the same signature — avoids duplicate logging across sessions
  const cutoff = Date.now() - 36 * 3600 * 1000;
  return evs.some(e => e.type === "advisor"
    && e.ts >= cutoff
    && e.data && e.data.sig === sig);
}

function logAdviceIfNew(tank, adv){
  if (!adv) return;
  const sig = _ruleSignature(adv);
  if (_hasRecentMatchingAdvice(tank.id, sig)) return;
  if (typeof logEvent === "function"){
    logEvent(tank.id, "advisor", {
      sev: adv.sev,
      title: adv.title,
      body: adv.body,
      rule: adv.rule,
      sig
    });
  }
}

/* expose */
window.ADVISOR = { computeAdvice, logAdviceIfNew };
