/* ═══════════════════════════════════════════════════════════
   calculator.js — Meldebestand Live-Rechner
═══════════════════════════════════════════════════════════ */

'use strict';

(function () {

  let curveCtx = null;
  let currentPct = 90;

  /* ── Referenztabelle ── */
  function renderRefTable() {
    const tbody = document.getElementById('ref-table-body');
    if (!tbody) return;

    tbody.innerHTML = REF_VALUES.map(row => `
      <tr class="ref-row" data-pct="${row.pct}">
        <td>${row.pct.toFixed(1).replace('.', ',')} %</td>
        <td class="num">${row.sb} Stk</td>
        <td class="num">${row.capital.toLocaleString('de-DE')} €</td>
      </tr>
    `).join('');
  }

  function updateRefTableHighlight(pct) {
    document.querySelectorAll('.ref-row').forEach(row => {
      const rowPct = parseFloat(row.dataset.pct);
      row.classList.toggle('ref-row--active', Math.abs(rowPct - pct) < 0.1);
    });
  }

  /* ── Ergebnis-Ausgabe ── */
  function updateResults(pct) {
    const sb      = calcSicherheitsbestand(pct);
    const melde   = calcMeldebestand(sb);
    const capital = calcKapitalbindung(sb);

    const safetyEl  = document.getElementById('res-safety');
    const meldeEl   = document.getElementById('res-melde');
    const capitalEl = document.getElementById('res-capital');

    if (safetyEl)  { animateValue(safetyEl,  safetyEl._prev  || sb,  sb,  v => v + ' Stück'); safetyEl._prev  = sb; }
    if (meldeEl)   { animateValue(meldeEl,   meldeEl._prev   || melde, melde, v => v + ' Stück'); meldeEl._prev   = melde; }
    if (capitalEl) { animateValue(capitalEl, capitalEl._prev || capital, capital, v => v.toLocaleString('de-DE') + ' €'); capitalEl._prev = capital; }

    /* Slider-Anzeige */
    const display = document.getElementById('slider-value');
    if (display) display.textContent = pct.toFixed(1).replace('.', ',') + ' %';

    /* Hint-Text */
    const hint = document.getElementById('curve-hint');
    if (hint) {
      if (pct >= 98) {
        hint.textContent = '⚠ Die letzten Prozentpunkte kosten überproportional viel - 100 % sind wirtschaftlich kaum erreichbar.';
        hint.style.color = 'var(--clr-orange-light)';
      } else if (pct >= 90) {
        hint.textContent = 'Ein guter Kompromiss: VeloBerlin wählt 90 % als wirtschaftlich sinnvolle Grenze.';
        hint.style.color = 'rgba(255,255,255,.5)';
      } else {
        hint.textContent = 'Niedrige Lieferfähigkeit spart Kapital, aber Kunden warten länger.';
        hint.style.color = 'rgba(255,255,255,.5)';
      }
    }
  }

  /* ── Zahl-Animation ── */
  function animateValue(el, from, to, formatter) {
    if (from === to) { el.textContent = formatter(to); return; }
    const duration = 300;
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(from + (to - from) * eased);
      el.textContent = formatter(val);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ── Exponential-Kurven-Diagramm ── */
  function renderCurveChart() {
    const canvas = document.getElementById('curve-chart');
    if (!canvas) return;
    curveCtx = canvas.getContext('2d');
    drawCurve(currentPct);
  }

  function drawCurve(activePct) {
    if (!curveCtx) return;
    const ctx = curveCtx;
    const canvas = ctx.canvas;
    const W = canvas.width;
    const H = canvas.height;
    const PAD = { top: 20, right: 60, bottom: 48, left: 70 };
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    ctx.clearRect(0, 0, W, H);

    /* Hintergrund */
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, W, H);

    /* Kurven-Datenpunkte (50% → 99.5%) */
    const points = [];
    for (let p = 50; p <= 99.5; p += 0.5) {
      const sb = calcSicherheitsbestand(p);
      points.push({ pct: p, sb, capital: calcKapitalbindung(sb) });
    }

    const maxCapital = calcKapitalbindung(calcSicherheitsbestand(99.5));

    const px = (pct)     => PAD.left + ((pct - 50) / 49.5) * innerW;
    const py = (capital) => PAD.top  + innerH - (capital / (maxCapital * 1.05)) * innerH;

    /* Gitternetz */
    ctx.strokeStyle = 'rgba(255,255,255,.1)';
    ctx.lineWidth = 1;
    [0, 2000, 4000, 6000, 8000].forEach(val => {
      const y = py(val);
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + innerW, y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.45)';
      ctx.font = '10px Segoe UI, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val === 0 ? '0 €' : (val / 1000).toFixed(0) + 'k €', PAD.left - 5, y + 4);
    });

    [50, 60, 70, 80, 90, 95, 99].forEach(pct => {
      const x = px(pct);
      ctx.beginPath();
      ctx.moveTo(x, PAD.top);
      ctx.lineTo(x, PAD.top + innerH);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.45)';
      ctx.font = '10px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pct + '%', x, PAD.top + innerH + 16);
    });

    /* Achsenbeschriftung */
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.font = '11px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Lieferfähigkeit', PAD.left + innerW / 2, H - 4);
    ctx.save();
    ctx.translate(14, PAD.top + innerH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Kapitalbindung', 0, 0);
    ctx.restore();

    /* Gradient Füllbereich */
    const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + innerH);
    grad.addColorStop(0, 'rgba(224,123,42,.6)');
    grad.addColorStop(1, 'rgba(224,123,42,.05)');

    ctx.beginPath();
    points.forEach((pt, i) => {
      i === 0 ? ctx.moveTo(px(pt.pct), py(pt.capital)) : ctx.lineTo(px(pt.pct), py(pt.capital));
    });
    ctx.lineTo(px(99.5), PAD.top + innerH);
    ctx.lineTo(px(50),   PAD.top + innerH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    /* Linie */
    ctx.beginPath();
    ctx.strokeStyle = '#e07b2a';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    points.forEach((pt, i) => {
      i === 0 ? ctx.moveTo(px(pt.pct), py(pt.capital)) : ctx.lineTo(px(pt.pct), py(pt.capital));
    });
    ctx.stroke();

    /* Aktiver Punkt (Slider-Position) */
    const activeSB  = calcSicherheitsbestand(activePct);
    const activeCap = calcKapitalbindung(activeSB);
    const ax = px(activePct);
    const ay = py(activeCap);

    /* Vertikale Linie */
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(120,200,120,.7)';
    ctx.lineWidth = 1;
    ctx.moveTo(ax, PAD.top);
    ctx.lineTo(ax, PAD.top + innerH);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Punkt */
    ctx.beginPath();
    ctx.arc(ax, ay, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#4a9c4a';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Tooltip-Blase */
    const tipText = `${activePct.toFixed(1)}% → ${activeCap.toLocaleString('de-DE')} €`;
    ctx.font = 'bold 11px Segoe UI, sans-serif';
    const tipW = ctx.measureText(tipText).width + 16;
    const tipH = 22;
    let tipX = ax - tipW / 2;
    let tipY = ay - 30;
    tipX = Math.max(PAD.left, Math.min(tipX, PAD.left + innerW - tipW));
    tipY = Math.max(PAD.top, tipY);

    ctx.fillStyle = 'rgba(30,45,30,.9)';
    ctx.beginPath();
    roundRectFill(ctx, tipX, tipY, tipW, tipH, 5);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(tipText, tipX + tipW / 2, tipY + 15);
  }

  function roundRectFill(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.fill();
  }

  /* ── Slider Event ── */
  function initSlider() {
    const slider = document.getElementById('service-slider');
    if (!slider) return;

    slider.addEventListener('input', () => {
      currentPct = parseFloat(slider.value);
      updateResults(currentPct);
      drawCurve(currentPct);
      updateRefTableHighlight(currentPct);
    });

    /* Initialer Zustand */
    updateResults(currentPct);
    updateRefTableHighlight(currentPct);
  }

  /* ── Init ── */
  function init() {
    renderRefTable();
    renderCurveChart();
    initSlider();
  }

  window.CALCULATOR = { init, redraw: () => drawCurve(currentPct) };

})();
