/* SecureGRC shared behaviour — analytics bootstrap, mobile nav, scroll reveal,
   lead-capture modal, back-to-top. Loaded with `defer` on every page. */
document.documentElement.classList.add('js');

/* --- Analytics (moved from inline <script> so a strict CSP works) --- */
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-DWRF8C5HWB');
window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };

function trackEvent(name, params) {
  try { gtag('event', name, params || {}); } catch (e) { /* analytics blocked */ }
}

document.addEventListener('DOMContentLoaded', function () {

  /* --- Mobile navigation --- */
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  if (header && toggle) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    header.querySelectorAll('.site-nav a').forEach(function (link) {
      link.addEventListener('click', function () {
        header.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        header.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* --- Scroll reveal: no JS / no IO support → everything stays visible --- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* --- Animated counters: <span data-count="36" data-suffix="+"> --- */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var run = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      var decimals = (el.getAttribute('data-count').split('.')[1] || '').length;
      if (reduced || isNaN(target)) { el.textContent = target + suffix; return; }
      var start = null, dur = 1400;
      var tick = function (t) {
        if (!start) start = t;
        var p = Math.min((t - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { run(e.target); cio.unobserve(e.target); }
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { cio.observe(el); });
    } else {
      counters.forEach(run);
    }
  }

  /* --- Lead capture modal --- */
  var dialog = document.createElement('dialog');
  dialog.className = 'lead-modal';
  dialog.setAttribute('aria-labelledby', 'lead-modal-title');
  dialog.innerHTML =
    '<div class="lead-modal-inner">' +
    '<button type="button" class="lead-close" aria-label="Close">&times;</button>' +
    '<h2 id="lead-modal-title">Get a free AI compliance assessment</h2>' +
    '<p class="lead-sub">Tell us where to send the assessment details. We reply within one working day.</p>' +
    '<form id="lead-form" novalidate>' +
    '<label for="lead-name">Name</label><input id="lead-name" name="name" type="text" autocomplete="name" required>' +
    '<label for="lead-email">Work email</label><input id="lead-email" name="email" type="email" autocomplete="email" required>' +
    '<label for="lead-company">Company</label><input id="lead-company" name="company" type="text" autocomplete="organization">' +
    '<label for="lead-interest">I&apos;m interested in</label>' +
    '<select id="lead-interest" name="interest">' +
    '<option>Free compliance assessment</option><option>Product demo</option><option>Something else</option>' +
    '</select>' +
    '<button type="submit" class="lead-submit">Send request</button>' +
    '</form>' +
    '<p class="lead-alt">Prefer email? <a href="mailto:hello@securegrc.io">hello@securegrc.io</a></p>' +
    '</div>';
  document.body.appendChild(dialog);

  dialog.querySelector('.lead-close').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog) dialog.close(); // backdrop click
  });

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('.lead-cta');
    if (!trigger) return;
    e.preventDefault();
    trackEvent('lead_modal_open', { source: trigger.getAttribute('data-source') || 'cta' });
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else window.location.href = trigger.href; // very old browsers: keep mailto
  });

  document.getElementById('lead-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.target;
    if (!form.reportValidity()) return;
    var name = form.name.value.trim();
    var email = form.email.value.trim();
    var company = form.company.value.trim();
    var interest = form.interest.value;
    trackEvent('generate_lead', { interest: interest });

    /* No backend yet: compose a prefilled email so the request still arrives.
       Point LEAD_ENDPOINT at a form service (Formspree/Resend) later and POST instead. */
    var subject = encodeURIComponent(interest + ' — ' + (company || name));
    var body = encodeURIComponent(
      'Name: ' + name + '\nEmail: ' + email + '\nCompany: ' + company +
      '\nInterested in: ' + interest + '\n\nSent from securegrc.io'
    );
    window.location.href = 'mailto:hello@securegrc.io?subject=' + subject + '&body=' + body;

    var inner = dialog.querySelector('.lead-modal-inner');
    inner.innerHTML =
      '<div class="lead-success">' +
      '<div class="lead-check" aria-hidden="true">&#10003;</div>' +
      '<h2>Almost done</h2>' +
      '<p class="lead-sub">Your email client should have opened with the request filled in — just hit send.</p>' +
      '<button type="button" class="lead-submit lead-close-2">Close</button>' +
      '</div>';
    inner.querySelector('.lead-close-2').addEventListener('click', function () { dialog.close(); });
  });

  /* --- Back to top --- */
  var btt = document.createElement('button');
  btt.className = 'back-to-top';
  btt.type = 'button';
  btt.setAttribute('aria-label', 'Back to top');
  btt.innerHTML = '&uarr;';
  document.body.appendChild(btt);
  var onScroll = function () { btt.classList.toggle('show', window.scrollY > 600); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  btt.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
