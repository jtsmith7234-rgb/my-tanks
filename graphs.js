/* ============================================================
   GRAPHS — Lightweight SVG sparklines for water-test trends
   No external libraries. Mobile-fast. Beginner-friendly summaries.
   Sources: Aqueon, AquariumScience.org, Seachem (see advisor.js).
   ============================================================ */

const METRICS = [
  { key: "ph",      field: "ph",      label: "pH",       unit: "",     idealLo: 6.5, idealHi: 7.8, hardLo: 6.0, hardHi: 8.4, decimals: 1 },
  { key: "ammonia", field: "ammonia", label: "Ammonia",  unit: "ppm",  idealLo: 0,   idealHi: 0,   hardLo: 0,   hardHi: 0.25, decimals: 2 },
  { key: "nitrite", field: "nitrite", label: "Nitrite",  unit: "ppm",  idealLo: 0,   idealHi: 0,   hardLo: 0,   hardHi: 0.25, decimals: 2 },
  { key: "nitrate", field: "nitrate", label: "Nitrate",  unit: "ppm",  idealLo: 0,   idealHi: 20,  hardLo: 0,   hardHi: 40, decimals: 0 },
  { key: "temp",    field: "temp_f",  label: "Temp",     unit: "°F",   idealLo: 75,  idealHi: 80,  hardLo: 72,  hardHi: 82, decimals: 1 }
];

function _gatherSeries(tankId, metric){
  if (typeof events === "undefined") return [];
  const list = (events[tankId] || []).filter(e => e.type === "water_test");
  // events stored newest first — flip for chronological
  const chrono = [...list].reverse();
  const points = [];
  chrono.forEach(e => {
    const v = e.data && e.data[metric.field];
    if (v === "" || v == null || isNaN(parseFloat(v))) return;
    points.push({ ts: e.ts, value: parseFloat(v) });
  });
  return points;
}

/* Zone for a single value: "good" | "warn" | "bad" */
function _zone(metric, v){
  if (v < metric.hardLo || v > metric.hardHi) return "bad";
  if (metric.idealLo === metric.idealHi){
    return v > metric.idealLo ? "warn" : "good";
  }
  if (v < metric.idealLo || v > metric.idealHi) return "warn";
  return "good";
}

/* Plain-language status for the LATEST value */
function _latestStatus(metric, v){
  const z = _zone(metric, v);
  if (z === "good") return { label: "Safe range",   tone: "good" };
  if (z === "warn") return { label: "Drifting",     tone: "warn" };
  return                  { label: "Out of range", tone: "bad"  };
}

/* Trend across recent points: "improving" | "stable" | "worsening" */
function _trendSummary(metric, points){
  if (points.length < 2) return null;
  const recent = points.slice(-5);  // last 5 readings
  const first = recent[0].value;
  const last  = recent[recent.length-1].value;
  const change = last - first;
  // Threshold: 10% of ideal-band height, or a sensible minimum
  const idealRange = Math.max(metric.idealHi - metric.idealLo, 1);
  const threshold = Math.max(idealRange * 0.1, metric.decimals === 2 ? 0.05 : 0.5);
  let direction;
  if (Math.abs(change) < threshold) direction = "stable";
  else direction = change > 0 ? "up" : "down";
  // Decide if up/down is good or bad
  // For ammonia/nitrite/nitrate: down = good, up = worse
  // For pH/temp: stable is the goal
  const downIsGood = (metric.key === "ammonia" || metric.key === "nitrite" || metric.key === "nitrate");
  let verdict;
  if (direction === "stable") verdict = "stable";
  else if (downIsGood) verdict = direction === "down" ? "improving" : "worsening";
  else                  verdict = "shifting";  // pH/temp drifting — neither good nor bad without context
  const verb = direction === "stable" ? "Holding steady" :
               direction === "up"     ? "Trending up"   : "Trending down";
  const lastZone = _zone(metric, last);
  let tone;
  if (verdict === "improving") tone = "good";
  else if (verdict === "worsening") tone = "bad";
  else if (verdict === "shifting") tone = lastZone === "good" ? "muted" : "warn";
  else tone = lastZone === "good" ? "good" : (lastZone === "warn" ? "warn" : "bad");
  return { verb, verdict, tone, points: recent.length };
}

function _renderSparkline(metric, points, width, height){
  const padX = 10, padY = 14;
  const w = width - padX*2;
  const h = height - padY*2;

  if (points.length === 0){
    return `<div class="graph-empty">No readings yet — log one in Water Tests.</div>`;
  }

  // Compute min/max with sensible padding around ideal range
  const values = points.map(p => p.value);
  let lo = Math.min(...values, metric.idealLo);
  let hi = Math.max(...values, metric.idealHi);
  if (hi - lo < 0.1) { hi = lo + 1; }
  const pad = (hi - lo) * 0.12;
  lo -= pad; hi += pad;

  const tsMin = points[0].ts;
  const tsMax = points[points.length - 1].ts;
  const tsSpan = Math.max(tsMax - tsMin, 1);

  const xAt = (ts) => padX + ((ts - tsMin) / tsSpan) * w;
  const yAt = (v)  => padY + h - ((v - lo) / (hi - lo)) * h;

  // Ideal range band
  let band = "";
  if (metric.idealLo !== metric.idealHi){
    const bandLo = Math.max(metric.idealLo, lo);
    const bandHi = Math.min(metric.idealHi, hi);
    if (bandHi > bandLo){
      const yTop = yAt(bandHi);
      const yBot = yAt(bandLo);
      band = `<rect x="${padX}" y="${yTop.toFixed(1)}" width="${w}" height="${(yBot - yTop).toFixed(1)}"
              fill="rgba(43,182,115,.12)" stroke="rgba(43,182,115,.30)" stroke-dasharray="3,3" stroke-width="1"/>`;
    }
  } else if (metric.idealLo === 0 && metric.idealHi === 0){
    // Target line at 0 (ammonia / nitrite)
    const y0 = yAt(0);
    band = `<line x1="${padX}" y1="${y0.toFixed(1)}" x2="${(padX+w).toFixed(1)}" y2="${y0.toFixed(1)}"
            stroke="rgba(43,182,115,.55)" stroke-width="1" stroke-dasharray="4,3"/>`;
  }
  // Danger-line marker for asymmetric metrics (the hardHi)
  let dangerLine = "";
  if (metric.hardHi > metric.idealHi && metric.hardHi >= lo && metric.hardHi <= hi){
    const yD = yAt(metric.hardHi);
    dangerLine = `<line x1="${padX}" y1="${yD.toFixed(1)}" x2="${(padX+w).toFixed(1)}" y2="${yD.toFixed(1)}"
                  stroke="rgba(224,69,92,.45)" stroke-width="1" stroke-dasharray="2,3"/>`;
  }

  // Build path
  const path = points.map((p, i) => {
    const x = xAt(p.ts).toFixed(1);
    const y = yAt(p.value).toFixed(1);
    return `${i === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ");

  // Dots — color by zone (only emphasize first, last, and out-of-range)
  const dots = points.map((p, i) => {
    const x = xAt(p.ts).toFixed(1);
    const y = yAt(p.value).toFixed(1);
    const z = _zone(metric, p.value);
    const isEdge = (i === 0 || i === points.length - 1);
    let r = isEdge ? 3.5 : 2;
    let color = "var(--ink-dim)";
    if (z === "bad")  { color = "var(--bad)"; r = 3.5; }
    else if (z === "warn") { color = "var(--warn)"; r = Math.max(r, 3); }
    else if (isEdge)  { color = "var(--sakura-deep, var(--sakura))"; }
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" stroke="rgba(255,255,255,.85)" stroke-width="1"/>`;
  }).join("");

  return `
    <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" aria-hidden="true">
      ${band}
      ${dangerLine}
      <path d="${path}" fill="none" stroke="var(--sakura-deep, var(--sakura))" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
      ${dots}
    </svg>
  `;
}

function _formatValue(metric, v){
  const d = metric.decimals == null ? 1 : metric.decimals;
  return Number(v).toFixed(d).replace(/\.0$/, "");
}

function renderGraphsSection(tank){
  const W = 320, H = 70;
  let totalPoints = 0;
  const cards = METRICS.map(m => {
    const pts = _gatherSeries(tank.id, m);
    totalPoints += pts.length;
    const last = pts.length ? pts[pts.length - 1] : null;

    let headRight = "";
    let trendLine = `<span class="graph-sub muted">No readings yet</span>`;
    if (last){
      const status = _latestStatus(m, last.value);
      headRight = `
        <div class="graph-latest">
          <span class="graph-num">${_formatValue(m, last.value)}</span>
          <span class="graph-unit">${m.unit}</span>
          <span class="graph-status graph-status-${status.tone}">${status.label}</span>
        </div>`;
      const trend = _trendSummary(m, pts);
      if (trend){
        trendLine = `<span class="graph-sub graph-sub-${trend.tone}">${trend.verb} \u00b7 last ${trend.points} readings</span>`;
      } else {
        trendLine = `<span class="graph-sub muted">1 reading \u2014 log another to see the trend</span>`;
      }
    }

    return `
      <div class="graph-card">
        <div class="graph-head">
          <div class="graph-label">${m.label}${m.unit?` <span class="muted small">(${m.unit})</span>`:""}</div>
          ${headRight}
        </div>
        <div class="graph-svg">
          ${_renderSparkline(m, pts, W, H)}
        </div>
        <div class="graph-foot">${trendLine}</div>
      </div>
    `;
  }).join("");

  if (totalPoints === 0){
    return `
      <div class="section">
        <h2>Trends</h2>
        <p class="muted" style="margin:0">Log your first water test and these charts will start showing trends. Two readings is enough to see direction.</p>
      </div>
    `;
  }

  return `
    <div class="section">
      <h2>Trends</h2>
      <p class="muted small" style="margin:0 0 10px">Green band = safe range. Red dashed line = danger. Each dot is one test \u2014 newest is on the right.</p>
      <div class="graph-grid">
        ${cards}
      </div>
    </div>
  `;
}

window.GRAPHS = { renderGraphsSection };
