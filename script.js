/* =====================================================
   HVAX — BidEyes Landing Page  v2
   script.js
   ===================================================== */
'use strict';

/* ── Micro-utilities ──────────────────────────────── */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ── 1. Nav — scroll glass effect ─────────────────── */
(function initNav() {
  const nav = qs('#nav');
  if (!nav) return;

  let ticking = false;
  const update = () => {
    nav.classList.toggle('scrolled', window.scrollY > 24);
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });

  update(); // set correct state on initial load
})();

/* ── 2. Mobile hamburger ───────────────────────────── */
(function initHamburger() {
  const btn  = qs('#hamburger');
  const menu = qs('#mobile-menu');
  if (!btn || !menu) return;

  function setOpen(open) {
    btn.classList.toggle('open', open);
    menu.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    // lock body scroll when menu is open
    document.body.style.overflow = open ? 'hidden' : '';
  }

  btn.addEventListener('click', () => setOpen(!btn.classList.contains('open')));

  // Any link or button inside the menu closes it
  qsa('a, button', menu).forEach(el => el.addEventListener('click', () => setOpen(false)));

  // Click outside
  document.addEventListener('click', e => {
    if (!nav.contains(e.target)) setOpen(false);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') setOpen(false);
  });
})();

/* ── 3. Modal ──────────────────────────────────────── */
(function initModal() {
  const overlay    = qs('#modal-overlay');
  const closeBtn   = qs('#modal-close');
  const form       = qs('#sample-form');
  const formState  = qs('#modal-form-state');
  const successEl  = qs('#form-success');
  const submitBtn  = qs('#form-submit-btn');
  const emailField = qs('#f-email');

  if (!overlay) return;

  let lastFocus = null;
  let isOpen = false;

  // Every button that should open the modal
  const openers = qsa('#hero-cta, #nav-cta, #product-cta, #final-cta, .mobile-cta');

  function openModal() {
    lastFocus = document.activeElement;
    isOpen = true;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const first = qs('input:not([disabled]), button:not([disabled])', overlay);
      if (first) first.focus();
    }, 340);
  }

  function closeModal() {
    isOpen = false;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  openers.forEach(el => el.addEventListener('click', openModal));
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) closeModal(); });

  /* Focus trap */
  overlay.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || !isOpen) return;
    const focusable = qsa(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]',
      overlay
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (!first) return;
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* Form submit */
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validateForm()) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Sending…';

    const data   = Object.fromEntries(new FormData(form));
    const mailto = buildMailto(data);

    // Open mailto in background tab
    const a = Object.assign(document.createElement('a'), { href: mailto, target: '_blank' });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    await sleep(500);
    formState.style.display = 'none';
    successEl.style.display = 'flex';
  });

  // Clear errors on typing
  qsa('.form-input, .form-select, .form-textarea', form).forEach(f => {
    f.addEventListener('input', () => f.classList.remove('field-error'));
  });

  /* Helpers */
  function validateForm() {
    let ok = true;

    qsa('[required]', form).forEach(f => {
      f.classList.remove('field-error');
      if (!f.value.trim()) { f.classList.add('field-error'); ok = false; }
    });

    if (emailField?.value && !isEmail(emailField.value)) {
      emailField.classList.add('field-error');
      ok = false;
    }

    if (!ok) qs('.field-error', form)?.focus();
    return ok;
  }

  function buildMailto(d) {
    const subject = `BidEyes Sample Review Request — ${d.company || 'New Request'}`;
    const body =
      `Hello,\n\nI'd like to request a sample BidEyes review.\n\n` +
      `Name:    ${d.name    || ''}\n` +
      `Company: ${d.company || ''}\n` +
      `Email:   ${d.email   || ''}\n` +
      `Role:    ${d.role    || ''}\n` +
      (d.notes ? `\nNotes:\n${d.notes}\n` : '') +
      `\nPlease reach out to coordinate getting documents to you.\n\nThanks`;
    return `mailto:founder@hvax.dev?subject=${enc(subject)}&body=${enc(body)}`;
  }

  function enc(s)       { return encodeURIComponent(s); }
  function isEmail(s)   { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }
  function sleep(ms)    { return new Promise(r => setTimeout(r, ms)); }
})();

/* ── 4. Scroll-reveal with IntersectionObserver ────── */
(function initReveal() {
  // Hero elements animate via CSS keyframes (above-fold), skip them
  const els = qsa('.reveal').filter(el => !el.closest('.hero'));
  if (!els.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach(el => el.classList.add('in-view'));
    return;
  }

  const io = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        io.unobserve(e.target);
      }
    }),
    { threshold: 0.10, rootMargin: '0px 0px -48px 0px' }
  );

  els.forEach(el => io.observe(el));
})();

/* ── 5. Smooth scroll (anchor links) ──────────────── */
(function initSmoothScroll() {
  const NAV_H = 68;
  qsa('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = qs(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - NAV_H,
        behavior: 'smooth',
      });
    });
  });
})();

/* ── 6. Active nav link highlight on scroll ─────────── */
(function initActiveNav() {
  const sections = qsa('section[id]');
  const links    = qsa('.nav__links a');
  if (!sections.length || !links.length) return;

  const io = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      links.forEach(l => {
        const on = l.getAttribute('href') === `#${id}`;
        l.style.color      = on ? 'var(--ink)' : '';
        l.style.fontWeight = on ? '700' : '';
      });
    }),
    { threshold: 0.45 }
  );

  sections.forEach(s => io.observe(s));
})();

/* ── 7. Hero findings — staggered re-entry animation ── */
(function initHeroFindings() {
  const items = qsa('.fi');
  if (!items.length) return;

  // Replay the entrance animation once the hero card enters view
  const card = qs('.review-card');
  if (!card) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      items.forEach((item, i) => {
        item.style.animationDelay = `${0.25 + i * 0.2}s`;
        // Force reflow to restart keyframe
        item.style.animationName = 'none';
        void item.offsetHeight;
        item.style.animationName = '';
      });
      io.unobserve(e.target);
    });
  }, { threshold: 0.3 });

  io.observe(card);
})();

/* ── 8. Footer year ────────────────────────────────── */
(() => {
  const el = qs('#year');
  if (el) el.textContent = new Date().getFullYear();
})();
