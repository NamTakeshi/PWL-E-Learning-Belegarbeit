/* ═══════════════════════════════════════════════════════════
   xyz.js — XYZ-Analyse: Mini-Charts + Tabelle
═══════════════════════════════════════════════════════════ */

'use strict';

(function () {

  /* ── Mini-Liniendiagramm für X / Y / Z ── */
  function drawMiniChart(canvasId, data, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const PAD = { top: 12, right: 10, bottom: 12, left: 10 };
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    ctx.clearRect(0, 0, W, H);

    /* Hintergrund */
    ctx.fillStyle = 'rgba(255,255,255,.06)';
    ctx.fillRect(0, 0, W, H);

    const max = Math.max(...data);
    const n   = data.length;
    const stepX = innerW / (n - 1);

    const px = (i) => PAD.left + i * stepX;
    const py = (v) => PAD.top + innerH - (v / (max * 1.1)) * innerH;

    /* Füllbereich unter Linie */
    ctx.beginPath();
    data.forEach((v, i) => { i === 0 ? ctx.moveTo(px(i), py(v)) : ctx.lineTo(px(i), py(v)); });
    ctx.lineTo(px(n - 1), PAD.top + innerH);
    ctx.lineTo(PAD.left, PAD.top + innerH);
    ctx.closePath();
    ctx.fillStyle = color + '28';
    ctx.fill();

    /* Linie */
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    data.forEach((v, i) => { i === 0 ? ctx.moveTo(px(i), py(v)) : ctx.lineTo(px(i), py(v)); });
    ctx.stroke();

    /* Punkte */
    data.forEach((v, i) => {
      ctx.beginPath();
      ctx.arc(px(i), py(v), 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });

    /* Durchschnittslinie (gestrichelt) */
    const avg = data.reduce((a, b) => a + b, 0) / n;
    ctx.beginPath();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = 'rgba(255,255,255,.3)';
    ctx.lineWidth = 1;
    ctx.moveTo(PAD.left, py(avg));
    ctx.lineTo(PAD.left + innerW, py(avg));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /* ── XYZ-Tabelle ── */
  function renderTable() {
    const tbody = document.getElementById('xyz-table-body');
    if (!tbody) return;

    /* Farben für die XYZ-Zeilen */
    const rowColors = {
      X: 'rgba(45,106,45,.12)',
      Y: 'rgba(224,123,42,.12)',
      Z: 'rgba(192,57,43,.12)',
    };

    tbody.innerHTML = XYZ_DATA.map(item => `
      <tr style="background: ${rowColors[item.cls]}">
        <td>${item.name}</td>
        <td><span class="badge badge--${item.cls.toLowerCase()}">${item.cls}</span></td>
        <td>${item.reason}</td>
      </tr>
    `).join('');
  }

  /* ── Init ── */
  function init() {
    const colors = { X: '#4a9c4a', Y: '#e07b2a', Z: '#c0392b' };
    Object.entries(XYZ_PATTERNS).forEach(([cls, data]) => {
      drawMiniChart('chart-' + cls.toLowerCase(), data, colors[cls]);
    });
    renderTable();
  }

  window.XYZ = { init };

})();
