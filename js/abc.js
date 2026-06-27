/* ═══════════════════════════════════════════════════════════
   abc.js — ABC-Analyse: Tabelle + Pareto-Diagramm
═══════════════════════════════════════════════════════════ */

'use strict';

(function () {

  /* ── Tabelle befüllen ── */
  function renderTable() {
    const tbody = document.getElementById('abc-table-body');
    if (!tbody) return;

    tbody.innerHTML = ABC_DATA.map((item, i) => `
      <tr class="abc-row" data-index="${i}" tabindex="0" role="button" aria-label="${item.name} hervorheben">
        <td>${item.name}</td>
        <td class="num">${item.price.toLocaleString('de-DE')}</td>
        <td class="num">${item.qty.toLocaleString('de-DE')}</td>
        <td class="num">${item.value.toLocaleString('de-DE')}</td>
        <td class="num">${item.share.toFixed(1)} %</td>
        <td class="num">${item.cumShare.toFixed(1)} %</td>
        <td><span class="badge badge--${item.cls.toLowerCase()}">${item.cls}</span></td>
      </tr>
    `).join('');

    /* Click-Handler für Zeilen-Hervorhebung */
    tbody.querySelectorAll('.abc-row').forEach(row => {
      const activate = () => highlightRow(parseInt(row.dataset.index));
      row.addEventListener('click', activate);
      row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } });
    });
  }

  /* ── Result-Karten ── */
  function renderResultCards() {
    const container = document.getElementById('abc-result-cards');
    if (!container) return;

    const groups = { A: [], B: [], C: [] };
    ABC_DATA.forEach(item => groups[item.cls].push(item.name));

    const totalsByClass = { A: 0, B: 0, C: 0 };
    ABC_DATA.forEach(item => { totalsByClass[item.cls] += item.value; });

    container.innerHTML = ['A', 'B', 'C'].map(cls => `
      <div class="result-card result-card--${cls.toLowerCase()} reveal">
        <div class="result-card__class">${cls}</div>
        <div class="result-card__title">${cls === 'A' ? 'Hoher Wertanteil' : cls === 'B' ? 'Mittlerer Wertanteil' : 'Geringer Wertanteil'}</div>
        <div class="result-card__count">${groups[cls].length} Artikel · ${totalsByClass[cls].toLocaleString('de-DE')} €</div>
        <div class="result-card__items">${groups[cls].join(' · ')}</div>
      </div>
    `).join('');
  }

  /* ── Pareto-Diagramm (ohne externe Bibliothek) ── */
  let activeIndex = -1;
  let ctx = null;

  function renderChart() {
    const canvas = document.getElementById('abc-chart');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    drawChart();
  }

  function drawChart() {
    if (!ctx) return;
    const canvas = ctx.canvas;
    const W = canvas.width;
    const H = canvas.height;
    const PAD = { top: 20, right: 60, bottom: 50, left: 60 };
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    ctx.clearRect(0, 0, W, H);

    const n = ABC_DATA.length;
    const barW = innerW / n;

    /* Hintergrund */
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    /* Klassen-Trennlinien (Hintergrundstreifen) */
    const classBoundaries = { A: 3, B: 6 }; // A: 0-2, B: 3-5, C: 6-8
    const stripeColors = ['rgba(192,57,43,.04)', 'rgba(224,123,42,.04)', 'rgba(37,99,168,.04)'];
    [[0, 3], [3, 6], [6, 9]].forEach(([start, end], i) => {
      ctx.fillStyle = stripeColors[i];
      ctx.fillRect(PAD.left + start * barW, PAD.top, (end - start) * barW, innerH);
    });

    /* Gitternetz */
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 1;
    [0, 25, 50, 75, 100].forEach(pct => {
      const y = PAD.top + innerH - (pct / 100) * innerH;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + innerW, y);
      ctx.stroke();
      /* Y-Achse rechts (%) */
      ctx.fillStyle = '#999';
      ctx.font = '11px Segoe UI, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(pct + '%', PAD.left + innerW + 6, y + 4);
    });

    /* Balken */
    const barColors = { A: '#c0392b', B: '#e07b2a', C: '#2563a8' };
    const barColorsHover = { A: '#e84234', B: '#f0984a', C: '#3a7fd4' };

    ABC_DATA.forEach((item, i) => {
      const x = PAD.left + i * barW + 4;
      const bw = barW - 8;
      const barHeight = (item.share / 100) * innerH;
      const y = PAD.top + innerH - barHeight;

      const isActive = i === activeIndex;
      ctx.fillStyle = isActive ? barColorsHover[item.cls] : barColors[item.cls];
      if (isActive) {
        ctx.shadowColor = barColors[item.cls];
        ctx.shadowBlur = 10;
      }
      roundRect(ctx, x, y, bw, barHeight, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      /* Prozentwert über Balken */
      ctx.fillStyle = '#555';
      ctx.font = '10px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.share.toFixed(1) + '%', x + bw / 2, y - 4);

      /* X-Achse Label */
      ctx.fillStyle = '#666';
      ctx.font = '10px Segoe UI, sans-serif';
      ctx.save();
      ctx.translate(x + bw / 2, PAD.top + innerH + 8);
      ctx.rotate(-Math.PI / 4);
      const label = item.name.length > 14 ? item.name.substring(0, 13) + '…' : item.name;
      ctx.fillText(label, 0, 0);
      ctx.restore();
    });

    /* Kumulierte Linie */
    ctx.beginPath();
    ctx.strokeStyle = '#4a9c4a';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([]);
    ABC_DATA.forEach((item, i) => {
      const x = PAD.left + (i + 0.5) * barW;
      const y = PAD.top + innerH - (item.cumShare / 100) * innerH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    /* Punkte auf der Kurve */
    ABC_DATA.forEach((item, i) => {
      const x = PAD.left + (i + 0.5) * barW;
      const y = PAD.top + innerH - (item.cumShare / 100) * innerH;
      ctx.beginPath();
      ctx.arc(x, y, i === activeIndex ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = '#4a9c4a';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    /* Klassengrenzen (vertikale Linien) */
    [3, 6].forEach(boundary => {
      const x = PAD.left + boundary * barW;
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#bbb';
      ctx.lineWidth = 1;
      ctx.moveTo(x, PAD.top);
      ctx.lineTo(x, PAD.top + innerH);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    /* Klassen-Label */
    const classLabels = [
      { label: 'A', midBar: 1.5 },
      { label: 'B', midBar: 4.5 },
      { label: 'C', midBar: 7.5 },
    ];
    classLabels.forEach(({ label, midBar }) => {
      const x = PAD.left + midBar * barW;
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      ctx.font = 'bold 28px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, PAD.top + innerH / 2 + 12);
    });

    /* Y-Achse links */
    ctx.fillStyle = '#888';
    ctx.font = '11px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(15, PAD.top + innerH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Anteil am Gesamtwert', 0, 0);
    ctx.restore();
  }

  /* ── Hilfsfunktion: rounded Rectangle ── */
  function roundRect(ctx, x, y, w, h, r) {
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
    ctx.closePath();
  }

  /* ── Interaktion: Zeile / Balken hervorheben ── */
  function highlightRow(index) {
    /* Tabelle */
    document.querySelectorAll('.abc-row').forEach((row, i) => {
      row.classList.toggle('selected', i === index);
    });
    /* Chart neu zeichnen */
    activeIndex = activeIndex === index ? -1 : index;
    drawChart();
  }

  /* ── Klick auf Canvas ── */
  function initCanvasClick() {
    const canvas = document.getElementById('abc-chart');
    if (!canvas) return;
    canvas.addEventListener('click', e => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const clickX = (e.clientX - rect.left) * scaleX;
      const PAD_LEFT = 60;
      const innerW = canvas.width - PAD_LEFT - 60;
      const barW = innerW / ABC_DATA.length;
      const index = Math.floor((clickX - PAD_LEFT) / barW);
      if (index >= 0 && index < ABC_DATA.length) highlightRow(index);
    });
  }

  /* ── Init ── */
  function init() {
    renderTable();
    renderResultCards();
    renderChart();
    initCanvasClick();
  }

  /* Export für app.js */
  window.ABC = { init };

})();
