/* ═══════════════════════════════════════════════════════════
   app.js — Initialisierung, Nav-Highlighting, Scroll-Reveal
═══════════════════════════════════════════════════════════ */

'use strict';

(function () {

  /* ── Alle Module initialisieren ── */
  function initModules() {
    if (window.ABC)        ABC.init();
    if (window.XYZ)        XYZ.init();
    if (window.MATRIX)     MATRIX.init();
    if (window.CALCULATOR) CALCULATOR.init();
    drawConflictCurve();
  }

  /* ── Statische Kurve in der Zielkonflikt-Intro-Section ── */
  function drawConflictCurve() {
    const canvas = document.getElementById('ci-curve-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const PAD = { top: 28, right: 24, bottom: 44, left: 60 };
    const iW = W - PAD.left - PAD.right;
    const iH = H - PAD.top - PAD.bottom;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);

    /* Kurvendaten: y = -ln(1-x) */
    const pts = [];
    for (let i = 0; i <= 100; i++) {
      const x = 0.5 + (i / 100) * 0.495;
      pts.push({ x, y: -Math.log(1 - x) });
    }
    const maxY = pts[pts.length - 1].y;
    const px = p => PAD.left + ((p.x - 0.5) / 0.495) * iW;
    const py = p => PAD.top  + iH - (p.y / (maxY * 1.05)) * iH;

    /* Gitternetz (horizontal) */
    ctx.strokeStyle = '#efefef';
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75, 1].forEach(frac => {
      const y = PAD.top + iH - frac * iH;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + iW, y);
      ctx.stroke();
    });

    /* Achsen */
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(PAD.left, PAD.top);
    ctx.lineTo(PAD.left, PAD.top + iH);
    ctx.lineTo(PAD.left + iW, PAD.top + iH);
    ctx.stroke();

    /* Füllung unter Kurve */
    const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + iH);
    grad.addColorStop(0, 'rgba(224,123,42,.4)');
    grad.addColorStop(1, 'rgba(224,123,42,.04)');
    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(px(p), py(p)) : ctx.lineTo(px(p), py(p)));
    ctx.lineTo(px(pts[pts.length - 1]), PAD.top + iH);
    ctx.lineTo(px(pts[0]), PAD.top + iH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    /* Kurve */
    ctx.beginPath();
    ctx.strokeStyle = '#e07b2a';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(px(p), py(p)) : ctx.lineTo(px(p), py(p)));
    ctx.stroke();

    /* X-Achse Beschriftungen */
    ctx.fillStyle = '#888';
    ctx.font = '12px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    [[0.5,'50%'],[0.6,'60%'],[0.7,'70%'],[0.8,'80%'],[0.9,'90%'],[0.99,'99%']].forEach(([xVal, label]) => {
      const xPos = PAD.left + ((xVal - 0.5) / 0.495) * iW;
      /* Tick */
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xPos, PAD.top + iH);
      ctx.lineTo(xPos, PAD.top + iH + 5);
      ctx.stroke();
      ctx.fillStyle = '#888';
      ctx.fillText(label, xPos, PAD.top + iH + 18);
    });

    /* X-Achsen-Label */
    ctx.fillStyle = '#666';
    ctx.font = '12px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Lieferfähigkeit →', PAD.left + iW / 2, H - 4);

    /* Y-Achsen-Label — direkt links neben der Achse, aufrecht */
    ctx.save();
    ctx.translate(14, PAD.top + iH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#666';
    ctx.font = '12px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Bestände ↑', 0, 0);
    ctx.restore();
  }

  /* ── Fortschrittsbalken ── */
  function initProgressBar() {
    const bar = document.getElementById('progress-bar');
    if (!bar) return;
    window.addEventListener('scroll', () => {
      const docH   = document.documentElement.scrollHeight - window.innerHeight;
      const pct    = docH > 0 ? (window.scrollY / docH) * 100 : 0;
      bar.style.width = Math.min(pct, 100) + '%';
    }, { passive: true });
  }

  /* ── Aktive Nav-Links ── */
  function initNavHighlight() {
    const sections   = document.querySelectorAll('.section[id]');
    const navLinks   = document.querySelectorAll('.nav-link');
    const navHeight  = 56;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.dataset.section === entry.target.id);
        });
      });
    }, {
      rootMargin: `-${navHeight}px 0px -60% 0px`,
      threshold: 0,
    });

    sections.forEach(s => observer.observe(s));
  }

  /* ── Scroll-Reveal (Fade-in beim Einblenden) ── */
  function initScrollReveal() {
    const targets = document.querySelectorAll(
      '.hero-card, .company-card, .theory-block, .step, .result-card, ' +
      '.xyz-pattern, .formula-card, .calc-result, .fazit-step, .summary-card, ' +
      '.conflict-spotlight, .decision-card, .calculator-section, ' +
      '.ci-direction, .ci-curve-wrap, .ci-teaser'
    );

    /* Bereits im Viewport liegende Elemente sofort zeigen */
    const viewH = window.innerHeight;
    targets.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < viewH && rect.bottom > 0) {
        /* schon sichtbar — kein Verstecken */
        return;
      }
      el.classList.add('reveal');
      el.style.transitionDelay = (i % 3) * 60 + 'ms';
    });

    /* Großzügige Schwelle: kein negativer rootMargin */
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          /* Canvas in der Conflict-Intro-Section neu zeichnen wenn sie eingeblendet wird */
          if (entry.target.classList.contains('ci-curve-wrap')) drawConflictCurve();
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -20px 0px' });

    targets.forEach(el => {
      if (el.classList.contains('reveal')) revealObserver.observe(el);
    });
  }

  /* ── Smooth-Scroll für Anker-Links ── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        const navH = 56;
        const y = target.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    });
  }

  /* ── Info-Button Toggle ── */
  function initInfoButton() {
    const btn     = document.getElementById('model-info-btn');
    const tooltip = document.getElementById('model-info-tooltip');
    if (!btn || !tooltip) return;
    btn.addEventListener('click', () => {
      const open = !tooltip.hidden;
      tooltip.hidden = open;
      btn.setAttribute('aria-expanded', String(!open));
      /* Kurve neu zeichnen falls Canvas durch Layout-Shift leer war */
      if (!open && window.CALCULATOR) CALCULATOR.redraw();
    });
  }

  /* ── DOM Ready ── */
  document.addEventListener('DOMContentLoaded', () => {
    initModules();
    initProgressBar();
    initNavHighlight();
    initScrollReveal();
    initSmoothScroll();
    initInfoButton();
  });

})();
