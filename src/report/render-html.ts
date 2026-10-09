import type { CompareResult } from '../core/types.js';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeJsonForScript(value: unknown): string {
  // Prevent </script> breakouts when embedding JSON.
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}

export function renderHtmlReport(result: CompareResult): string {
  const payload = {
    metrics: result.metrics,
    config: result.config,
    image: result.image,
    source: result.source,
    regions: result.regions,
    warnings: result.warnings,
    artifacts: result.artifacts,
    capture: result.capture ?? null,
    engineVersion: result.engineVersion,
  };

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PixelProof Report</title>
  <style>
    :root {
      --bg: #0f1419;
      --panel: #1a222c;
      --text: #e7eef7;
      --muted: #9aabbd;
      --accent: #3dd6c6;
      --line: #2b3643;
      --danger: #ff6b6b;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", "Helvetica Neue", sans-serif;
      background: radial-gradient(1200px 600px at 10% -10%, #1d2a38, var(--bg));
      color: var(--text);
      min-height: 100vh;
    }
    header, main { max-width: 1100px; margin: 0 auto; padding: 24px; }
    h1 { margin: 0 0 8px; font-size: 1.6rem; letter-spacing: 0.02em; }
    .sub { color: var(--muted); margin-bottom: 20px; }
    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .card {
      background: color-mix(in srgb, var(--panel) 92%, black);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 12px 14px;
    }
    .card .label { color: var(--muted); font-size: 0.8rem; }
    .card .value { font-size: 1.25rem; margin-top: 4px; font-variant-numeric: tabular-nums; }
    .toolbar {
      display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
      margin-bottom: 12px;
    }
    button, label.range {
      background: var(--panel);
      border: 1px solid var(--line);
      color: var(--text);
      border-radius: 999px;
      padding: 8px 14px;
      cursor: pointer;
    }
    button.active { border-color: var(--accent); color: var(--accent); }
    label.range { display: inline-flex; gap: 8px; align-items: center; }
    .stage {
      position: relative;
      width: 100%;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: #000;
      aspect-ratio: auto;
    }
    .stage img {
      display: block;
      width: 100%;
      height: auto;
      user-select: none;
      pointer-events: none;
    }
    .view { display: none; }
    .view.active { display: block; }
    .ba {
      position: relative;
      overflow: hidden;
    }
    .ba .after {
      position: absolute; inset: 0;
      clip-path: inset(0 0 0 50%);
    }
    .ba input[type="range"] {
      position: absolute; left: 0; right: 0; bottom: 12px;
      width: calc(100% - 24px); margin: 0 12px; z-index: 2;
    }
    .overlay-wrap { position: relative; }
    .overlay-wrap .top {
      position: absolute; inset: 0; opacity: 0.45;
    }
    .regions { margin-top: 18px; display: grid; gap: 8px; }
    .region {
      display: flex; justify-content: space-between; gap: 12px;
      border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px;
      background: var(--panel); cursor: pointer;
    }
    .region:hover { border-color: var(--accent); }
    .warn {
      margin-top: 16px; color: #ffd29a; font-size: 0.9rem;
      border-left: 3px solid #ffd29a; padding-left: 10px;
    }
    .marker {
      position: absolute; border: 2px solid var(--danger);
      box-shadow: 0 0 0 1px rgba(0,0,0,0.4);
      pointer-events: none;
    }
  </style>
</head>
<body>
  <header>
    <h1>PixelProof</h1>
    <div class="sub">Offline visual diff report · engine ${escapeHtml(result.engineVersion)}</div>
  </header>
  <main>
    <section class="metrics" id="metrics"></section>
    <section class="toolbar">
      <button type="button" data-view="ba" class="active">Before / After</button>
      <button type="button" data-view="overlay">Overlay</button>
      <button type="button" data-view="diff">Diff</button>
      <label class="range">Overlay <input id="opacity" type="range" min="0" max="100" value="45" /></label>
    </section>
    <section class="stage" id="stage">
      <div class="view ba active" id="view-ba">
        <div class="ba" id="ba">
          <img id="img-target" alt="target" />
          <div class="after"><img id="img-actual-ba" alt="actual" /></div>
          <input id="ba-range" type="range" min="0" max="100" value="50" />
        </div>
      </div>
      <div class="view overlay-wrap" id="view-overlay">
        <img id="img-target-ov" alt="target" />
        <img class="top" id="img-actual-ov" alt="actual overlay" />
      </div>
      <div class="view" id="view-diff">
        <img id="img-diff" alt="diff" />
      </div>
      <div id="markers"></div>
    </section>
    <section>
      <h2>Priority regions</h2>
      <div class="regions" id="regions"></div>
    </section>
    <section class="warn" id="warnings"></section>
  </main>
  <script>
    const data = ${escapeJsonForScript(payload)};
    const pct = (n) => (n * 100).toFixed(4) + '%';
    const metricsEl = document.getElementById('metrics');
    const cards = [
      ['Mismatch ratio', pct(data.metrics.mismatchRatio)],
      ['Mismatched px', String(data.metrics.mismatchedPixels)],
      ['Match ratio', pct(data.metrics.pixelMatchRatio)],
      ['Size', data.image.width + '×' + data.image.height],
      ['Source', data.source.kind + ': ' + data.source.displayValue],
      ['Threshold', String(data.config.threshold)],
    ];
    metricsEl.innerHTML = cards.map(([label, value]) =>
      '<div class="card"><div class="label">' + label + '</div><div class="value">' + value + '</div></div>'
    ).join('');

    const setSrc = (id, file) => { document.getElementById(id).src = file; };
    setSrc('img-target', data.artifacts.target);
    setSrc('img-actual-ba', data.artifacts.actual);
    setSrc('img-target-ov', data.artifacts.target);
    setSrc('img-actual-ov', data.artifacts.actual);
    setSrc('img-diff', data.artifacts.diff);

    const buttons = Array.from(document.querySelectorAll('button[data-view]'));
    const views = {
      ba: document.getElementById('view-ba'),
      overlay: document.getElementById('view-overlay'),
      diff: document.getElementById('view-diff'),
    };
    buttons.forEach((btn) => btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      Object.values(views).forEach((v) => v.classList.remove('active'));
      views[btn.dataset.view].classList.add('active');
    }));

    const baRange = document.getElementById('ba-range');
    const after = document.querySelector('#ba .after');
    baRange.addEventListener('input', () => {
      after.style.clipPath = 'inset(0 0 0 ' + baRange.value + '%)';
    });

    const opacity = document.getElementById('opacity');
    const ov = document.getElementById('img-actual-ov');
    opacity.addEventListener('input', () => {
      ov.style.opacity = String(Number(opacity.value) / 100);
    });

    const regionsEl = document.getElementById('regions');
    const markers = document.getElementById('markers');
    const stage = document.getElementById('stage');
    if (!data.regions.length) {
      regionsEl.innerHTML = '<div class="card">No mismatched regions.</div>';
    } else {
      regionsEl.innerHTML = data.regions.map((r) => {
        const b = r.bounds;
        return '<button type="button" class="region" data-x="' + b.x + '" data-y="' + b.y +
          '" data-w="' + b.width + '" data-h="' + b.height + '"><span>' + r.id +
          ' · (' + b.x + ',' + b.y + ') ' + b.width + '×' + b.height +
          '</span><span>' + r.mismatchedPixels + ' px</span></button>';
      }).join('');
    }

    function clearMarkers() { markers.innerHTML = ''; }
    function showMarker(x, y, w, h) {
      clearMarkers();
      const img = document.getElementById('img-target');
      const scale = img.clientWidth / data.image.width;
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.left = (x * scale) + 'px';
      el.style.top = (y * scale) + 'px';
      el.style.width = (w * scale) + 'px';
      el.style.height = (h * scale) + 'px';
      markers.appendChild(el);
    }
    regionsEl.addEventListener('click', (event) => {
      const btn = event.target.closest('.region');
      if (!btn) return;
      showMarker(+btn.dataset.x, +btn.dataset.y, +btn.dataset.w, +btn.dataset.h);
    });
    window.addEventListener('resize', clearMarkers);

    const warnings = document.getElementById('warnings');
    warnings.innerHTML = (data.warnings || []).map((w) => '<div>' + w + '</div>').join('');
  </script>
</body>
</html>
`;
}
