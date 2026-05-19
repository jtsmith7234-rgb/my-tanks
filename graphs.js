/* ============================================================
   GRAPHS — Lightweight SVG sparklines for water-test trends
   No external libraries. Mobile-fast. Matches koi/sakura theme.
   ============================================================ */

const METRICS = [
  { key: "ph",      field: "ph",      label: "pH",       unit: "",     idealLo: 6.5, idealHi: 7.8, hardLo: 6.0, hardHi: 8.4 },
  { key: "ammonia", field: "ammonia", label: "Ammonia",  unit: "ppm",  idealLo: 0,   idealHi: 0,   hardLo: 0,   hardHi: 0.25 },
  { key: "nitrite", field: "nitrite", label: "Nitrite",  unit: "ppm",  idealLo: 0,   idealHi: 0,   hardLo: 0,   hardHi: 0.25 },
  { key: "nitrate", field: "nitrate", label: "Nitrate",  unit: "ppm",  idealLo: 0,   idealHi: 20,  hardLo: 0,   hardHi: 40 },
  { key: "temp",    field: "temp_f",  label: "Temp",     unit: "°F",   idealLo: 75,  idealHi: 80,  hardLo: 72,  hardHi: 82 }
];

function _gatherSeries(tankId, metric){
  if (typeof events === "undefined") return [];
  const list = (events[tankId] || []).filter(e => e.type === "water_test");
  // events are stored newest first — flip for chronological
  const chrono = [...list].reverse();
  const points = [];
  chrono.forEach(e => {
    const v = e.data && e.data[metric.field];
    if (v === "" || v == null || isNaN(parseFloat(v))) return;
    points.push({ ts: e.ts, value: parseFloat(v) });
  });
  return points;
}

function _renderSparkline(metric, points, width, height){
  const padX = 8, padY = 10;
  const w = width - padX*2;
  const h = height - padY*2;

  if (points.length === 0){
    return `<div class="graph-empty">No ${metric.label.toLowerCase()} readings yet.</div>`;
  }

  // Compute min/max with sensible padding around ideal range
  const values = points.map(p => p.value);
  let lo = Math.min(...values, metric.idealLo);
  let hi = Math.max(...values, metric.idealHi);
  // Ensure visible band even when constant
  if (hi - lo < 0.1) { hi = lo + 1; }
  // Add small padding
  const pad = (hi - lo) * 0.1;
  lo -= pad; hi += pad;

  const tsMin = points[0].ts;
  const tsMax = points[points.length - 1].ts;
  const tsSpan = Math.max(tsMax - tsMin, 1);

  function xAt(ts){ return padX + ((ts - tsMin) / tsSpan) * w; }
  function yAt(v){  return padY + h - ((v - lo) / (hi - lo)) * h; }

  // Build path
  const path = points.map((p, i) => {
    const x = xAt(p.ts).toFixed(1);
    const y = yAt(p.value).toFixed(1);
    return `${i === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ");

  // Ideal range band (only if it makes sense and band has height)
  let band = "";
  if (metric.idealLo !== metric.idealHi){
    const bandLo = Math.max(metric.idealLo, lo);
    const bandHi = Math.min(metric.idealHi, hi);
    if (bandHi > bandLo){
      const yTop = yAt(bandHi).toFixed(1);
      const yBot = yAt(bandLo).toFixed(1);
      band = `<rect x="${padX}" y="${yTop}" width="${w}" height="${(yBot - yTop).toFixed(1)}" fill="rgba(120,200,140,.10)" stroke="none"/>`;
    }
  } else if (metric.idealLo === 0 && metric.idealHi === 0){
    // Target line at 0
    const y0 = yAt(0).toFixed(1);
    band = `<line x1="${padX}" y1="${y0}" x2="${padX + w}" y2="${y0}" stroke="rgba(120,200,140,.30)" stroke-width="1" stroke-dasharray="3,3"/>`;
  }

  // Dots — color by zone
  const dots = points.map(p => {
    const x = xAt(p.ts).toFixed(1);
    const y = yAt(p.value).toFixed(1);
    let color = "var(--koi)";
    if (p.value < metric.hardLo || p.value > metric.hardHi){ color = "var(--bad)"; }
    else if (metric.idealLo !== metric.idealHi && (p.value < metric.idealLo || p.value > metric.idealHi)){ color = "var(--warn)"; }
    else if (metric.idealLo === metric.idealHi && p.value > metric.idealLo){ color = "var(--warn)"; }
    return `<circle cx="${x}" cy="${y}" r="3" fill="${color}" stroke="rgba(0,0,0,.4)" stroke-width="0.5"/>`;
  }).join("");

  // Latest value label
  const last = points[points.length - 1];
  const lastX = xAt(last.ts);
  const lastY = yAt(last.value);
  const labelX = Math.min(lastX + 6, width - 30);
  const labelY = Math.max(lastY - 4, 12);
  const valueText = `${last.value}${metric.unit ? " " + metric.unit : ""}`;

  return `
    <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      ${band}
      <path d="${path}" fill="none" stroke="var(--koi)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
      ${dots}
      <text x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}" font-size="10" font-weight="600" fill="var(--ink)" font-family="system-ui">${valueText}</text>
    </svg>
  `;
}

function renderGraphsSection(tank){
  const W = 320, H = 80;
  let totalPoints = 0;
  const cards = METRICS.map(m => {
    const pts = _gatherSeries(tank.id, m);
    totalPoints += pts.length;
    const last = pts.length ? pts[pts.length - 1] : null;
    const sub = pts.length === 0
      ? `<span class="muted">No data</span>`
      : pts.length === 1
        ? `<span class="muted">1 reading · need 2+ for a trend</span>`
        : `<span class="muted">${pts.length} readings</span>`;

    return `
      <div class="graph-card">
        <div class="graph-head">
          <div class="graph-label">${m.label}${m.unit?` <span class="muted small">(${m.unit})</span>`:""}</div>
          <div class="graph-sub">${sub}</div>
        </div>
        <div class="graph-svg">
          ${_renderSparkline(m, pts, W, H)}
        </div>
      </div>
    `;
  }).join("");

  if (totalPoints === 0){
    return `
      <div class="section">
        <h2>Trends</h2>
        <p class="muted" style="margin:0">Log water tests to see trends here. Two or more readings reveal patterns over time.</p>
      </div>
    `;
  }

  return `
    <div class="section">
      <h2>Trends</h2>
      <p class="muted small" style="margin:0 0 10px">Green band = ideal range. Orange dots = drifting. Red dots = unsafe. Each dot is one test.</p>
      <div class="graph-grid">
        ${cards}
      </div>
    </div>
  `;
}

window.GRAPHS = { renderGraphsSection };
