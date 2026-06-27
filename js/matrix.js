/* ═══════════════════════════════════════════════════════════
   matrix.js — Kombinierte ABC/XYZ-Matrix
═══════════════════════════════════════════════════════════ */

'use strict';

(function () {

  function renderMatrix() {
    const tbody = document.getElementById('matrix-body');
    if (!tbody) return;

    const xyzRows = ['X', 'Y', 'Z'];
    const abcCols = ['A', 'B', 'C'];

    /* Farbe der Chips je ABC-Klasse */
    const chipBg = { A: 'var(--clr-abc-a-pale)', B: 'var(--clr-abc-b-pale)', C: 'var(--clr-abc-c-pale)' };
    const chipColor = { A: 'var(--clr-abc-a)', B: 'var(--clr-abc-b)', C: 'var(--clr-abc-c)' };

    tbody.innerHTML = xyzRows.map(xyz => `
      <tr>
        <th class="matrix-head-xyz matrix-head-xyz--${xyz.toLowerCase()}">${xyz}</th>
        ${abcCols.map(abc => {
          const items = COMB_MATRIX[abc][xyz];
          const isHighlight = abc === 'A' && xyz === 'Z';
          const cellClass = isHighlight ? 'matrix-cell matrix-cell--highlight' : 'matrix-cell';

          const chips = items.map(name => {
            const isAkku = name === 'E-Bike-Akku';
            if (isAkku) {
              return `<span class="matrix-chip matrix-chip--az">⚡ ${name}</span>`;
            }
            return `<span class="matrix-chip" style="background:${chipBg[abc]};color:${chipColor[abc]};border:1px solid ${chipColor[abc]}40">${name}</span>`;
          }).join('');

          const emptyMsg = items.length === 0 ? '<span style="color:#bbb;font-size:.75rem;font-style:italic;">—</span>' : '';

          return `<td class="${cellClass}">${chips || emptyMsg}</td>`;
        }).join('')}
      </tr>
    `).join('');
  }

  function init() {
    renderMatrix();
  }

  window.MATRIX = { init };

})();
