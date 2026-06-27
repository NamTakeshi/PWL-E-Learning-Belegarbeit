/* ═══════════════════════════════════════════════════════════
   data.js - VeloBerlin Datenkonstanten
   Quelle: CLAUDE.md (exakt nach Professorenvorlage)
═══════════════════════════════════════════════════════════ */

'use strict';

/* ── ABC-Daten (bereits absteigend nach Wert sortiert) ── */
const ABC_DATA = [
  { name: 'E-Bike-Akku',        price: 450, qty:  80, value: 36000, share: 35.7, cumShare:  35.7, cls: 'A' },
  { name: 'Bremsbeläge',        price:   8, qty: 2500, value: 20000, share: 19.8, cumShare:  55.5, cls: 'A' },
  { name: 'Rahmen (Carbon)',     price: 380, qty:  52, value: 19760, share: 19.6, cumShare:  75.0, cls: 'A' },
  { name: 'Fahrradschlauch',     price:   4, qty: 2000, value:  8000, share:  7.9, cumShare:  83.0, cls: 'B' },
  { name: 'Schaltwerk',         price: 120, qty:  60, value:  7200, share:  7.1, cumShare:  90.1, cls: 'B' },
  { name: 'Schrauben-Set',      price:   2, qty: 2400, value:  4800, share:  4.8, cumShare:  94.8, cls: 'B' },
  { name: 'Kettenöl',           price:   6, qty:  350, value:  2100, share:  2.1, cumShare:  96.9, cls: 'C' },
  { name: 'Lenkergriffe',       price:  10, qty:  170, value:  1700, share:  1.7, cumShare:  98.6, cls: 'C' },
  { name: 'Speziallager (Imp.)',price:  35, qty:   40, value:  1400, share:  1.4, cumShare: 100.0, cls: 'C' },
];

const ABC_TOTAL_VALUE = 100960;

/* ── XYZ-Daten ── */
const XYZ_DATA = [
  { name: 'E-Bike-Akku',        cls: 'Z', reason: 'Unregelmäßig: schwankt stark je nach Wetter, Förderprogrammen und kurzfristigen Trends – kein festes Muster' },
  { name: 'Bremsbeläge',        cls: 'X', reason: 'Regelmäßig: Wartungsbedarf tritt saisonunabhängig kontinuierlich auf' },
  { name: 'Rahmen (Carbon)',     cls: 'Y', reason: 'Saisonal: erhöhte Nachfrage zum Modelljahr-Start, gut nach Verkaufskalender planbar' },
  { name: 'Fahrradschlauch',     cls: 'X', reason: 'Regelmäßig: Reifenpannen treten saisonunabhängig gleichmäßig auf' },
  { name: 'Schaltwerk',         cls: 'Y', reason: 'Saisonal: höherer Reparaturbedarf im Frühjahr/Sommer, gut vorhersagbar' },
  { name: 'Schrauben-Set',      cls: 'X', reason: 'Regelmäßig: gleichbleibender Werkstattbedarf' },
  { name: 'Kettenöl',           cls: 'X', reason: 'Regelmäßig: kontinuierliche Wartung' },
  { name: 'Lenkergriffe',       cls: 'Y', reason: 'Saisonal: leicht erhöhte Nachfrage im Frühjahr, sonst stabil und vorhersagbar' },
  { name: 'Speziallager (Imp.)',cls: 'Z', reason: 'Unregelmäßig: nur bei seltenen Sonderreparaturen benötigt, kein wiederkehrendes Muster' },
];

/* ── Kombinierte ABC/XYZ-Matrix ── */
// Lookup: kombClasses[abcClass][xyzClass] = [Artikelname, ...]
const COMB_MATRIX = (() => {
  const m = { A: { X: [], Y: [], Z: [] }, B: { X: [], Y: [], Z: [] }, C: { X: [], Y: [], Z: [] } };
  ABC_DATA.forEach((item, i) => {
    const xyz = XYZ_DATA[i].cls;
    m[item.cls][xyz].push(item.name);
  });
  return m;
})();

/* ── Meldebestand / Sicherheitsbestand Modell (E-Bike-Akku) ── */
const MELDE_PARAMS = {
  verbrauchProWoche: 2,   // Stück/Woche (80 Stk/Jahr ÷ 52 Wochen ≈ 1,5 → 2)
  wbzWochen:         4,   // Wochen (Import Asien)
  pricePerUnit:    450,   // € pro Stück
  k:              3.47,   // Kalibrierungskonstante für 90% → 8 Stück
};

// Formel: SB = k × (-ln(1 - p))
function calcSicherheitsbestand(lieferfaehigkeit) {
  const p = Math.min(lieferfaehigkeit / 100, 0.999);
  return Math.round(MELDE_PARAMS.k * (-Math.log(1 - p)));
}

function calcMeldebestand(sb) {
  return MELDE_PARAMS.verbrauchProWoche * MELDE_PARAMS.wbzWochen + sb;
}

function calcKapitalbindung(sb) {
  return sb * MELDE_PARAMS.pricePerUnit;
}

/* ── Referenzwerte für die Tabelle ── */
const REF_VALUES = [50, 70, 80, 90, 95, 98, 99.5].map(pct => ({
  pct,
  sb:      calcSicherheitsbestand(pct),
  melde:   calcMeldebestand(calcSicherheitsbestand(pct)),
  capital: calcKapitalbindung(calcSicherheitsbestand(pct)),
}));

/* ── XYZ Mini-Chart Beispieldaten (12 Zeitpunkte) ── */
const XYZ_PATTERNS = {
  X: [5, 6, 5, 5, 6, 5, 5, 6, 5, 5, 6, 5],          // gleichmäßig
  Y: [4, 7, 3, 8, 5, 9, 4, 7, 3, 8, 5, 9],           // schwankend
  Z: [2, 2, 14, 1, 0, 12, 3, 0, 11, 2, 1, 13],       // unregelmäßig/sporadisch
};
