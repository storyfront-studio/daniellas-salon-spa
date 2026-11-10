/* Daniella's Salon & Spa — Storyfront concept preview. Vanilla JS, no libraries. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WA = '254790411359';

  /* ---------------- shared helpers ---------------- */
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  window.GH = {
    wa: function (msg) {
      return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg);
    }
  };

  /* ---------------- preload splash ---------------- */
  var splash = $('#splash');
  if (splash) {
    var dismiss = function () {
      setTimeout(function () {
        splash.classList.add('gone');
        setTimeout(function () { splash.remove(); }, 800);
      }, reduce ? 0 : 480);
    };
    if (document.readyState === 'complete') dismiss();
    else window.addEventListener('load', dismiss);
    // never let a slow image trap the visitor behind the splash
    setTimeout(dismiss, 3200);
  }

  /* ---------------- smart sticky header ---------------- */
  var hdr = $('.hdr');
  if (hdr) {
    var lastY = window.scrollY, ticking = false;
    var apply = function () {
      var y = window.scrollY;
      hdr.dataset.top = y < 24 ? 'true' : 'false';
      // reappears on ANY upward scroll, from anywhere on the page
      if (y > lastY + 6 && y > 220) hdr.dataset.hidden = 'true';
      else if (y < lastY - 6) hdr.dataset.hidden = 'false';
      lastY = y;
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    }, { passive: true });
    apply();
  }

  /* ---------------- mobile nav ---------------- */
  var burger = $('.burger'), mnav = $('.mnav');
  if (burger && mnav) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      mnav.classList.toggle('open', !open);
      document.body.style.overflow = !open ? 'hidden' : '';
    });
    $$('a', mnav).forEach(function (a) {
      a.addEventListener('click', function () {
        burger.setAttribute('aria-expanded', 'false');
        mnav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------------- scroll reveal ---------------- */
  var rvs = $$('.rv');
  if (rvs.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      rvs.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var d = parseInt(e.target.dataset.delay || '0', 10);
          setTimeout(function () { e.target.classList.add('in'); }, d);
          io.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      rvs.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------------- count-up stats ---------------- */
  var stats = $$('[data-count]');
  if (stats.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, target = parseFloat(el.dataset.count), dec = (el.dataset.dec | 0);
        var suffix = el.dataset.suffix || '', t0 = null, dur = 1100;
        if (reduce) { el.textContent = target.toFixed(dec) + suffix; cio.unobserve(el); return; }
        var tick = function (ts) {
          if (!t0) t0 = ts;
          var p = Math.min(1, (ts - t0) / dur), e2 = 1 - Math.pow(1 - p, 3);
          el.textContent = (target * e2).toFixed(dec) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        cio.unobserve(el);
      });
    }, { threshold: 0.4 });
    stats.forEach(function (el) { cio.observe(el); });
  }

  /* ---------------- floating WhatsApp button ---------------- */
  var fab = $('.fab');
  if (fab) {
    var fabTick = false;
    var fabApply = function () {
      fab.classList.toggle('show', window.scrollY > 400);
      fabTick = false;
    };
    window.addEventListener('scroll', function () {
      if (!fabTick) { fabTick = true; requestAnimationFrame(fabApply); }
    }, { passive: true });
    setTimeout(fabApply, 1200);
  }

  /* ---------------- in-view video autoplay + sound toggle ---------------- */
  $$('.vwrap').forEach(function (wrap) {
    var v = $('video', wrap), btn = $('.vsound', wrap);
    if (!v) return;
    v.muted = true; v.playsInline = true; v.loop = true;
    if ('IntersectionObserver' in window) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
          else v.pause();
        });
      }, { threshold: 0.4 });
      vio.observe(v);
    }
    if (btn) {
      var on = $('.snd-on', btn), off = $('.snd-off', btn);
      btn.addEventListener('click', function () {
        v.muted = !v.muted;
        if (!v.muted) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        btn.setAttribute('aria-label', v.muted ? 'Turn sound on' : 'Turn sound off');
        if (on) on.style.display = v.muted ? 'none' : '';
        if (off) off.style.display = v.muted ? '' : 'none';
      });
    }
  });

  /* ---------------- gallery: filters + lightbox ---------------- */
  var gal = $('.gal');
  if (gal) {
    var figs = $$('figure', gal);

    $$('.filters button').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.filters button').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        var cat = b.dataset.cat;
        figs.forEach(function (f) {
          f.classList.toggle('hide', cat !== 'all' && f.dataset.cat !== cat);
        });
      });
    });

    var lb = $('.lb'), lbImg = $('.lb__fig img'), lbCap = $('.lb__cap'), lbCount = $('.lb__count');
    var idx = 0;
    var visible = function () { return figs.filter(function (f) { return !f.classList.contains('hide'); }); };
    var show = function (i) {
      var list = visible();
      if (!list.length) return;
      idx = (i + list.length) % list.length;
      var f = list[idx], img = $('img', f);
      lbImg.src = img.getAttribute('src');
      lbImg.alt = img.getAttribute('alt') || '';
      lbCap.textContent = (f.dataset.caption || img.getAttribute('alt') || '');
      lbCount.textContent = (idx + 1) + ' / ' + list.length;
    };
    var open = function (i) {
      show(i); lb.classList.add('open'); document.body.style.overflow = 'hidden';
      $('.lb__close').focus();
    };
    var close = function () { lb.classList.remove('open'); document.body.style.overflow = ''; };

    figs.forEach(function (f) {
      f.setAttribute('tabindex', '0');
      f.setAttribute('role', 'button');
      var go = function () { open(visible().indexOf(f)); };
      f.addEventListener('click', go);
      f.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
      });
    });
    $('.lb__close').addEventListener('click', close);
    $('.lb__prev').addEventListener('click', function () { show(idx - 1); });
    $('.lb__next').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });

    /* scroll-linked tilt — kept under 1 degree, rAF-throttled, reduced-motion aware */
    if (!reduce && window.matchMedia('(min-width: 861px)').matches) {
      var tTick = false;
      var tilt = function () {
        var mid = window.innerHeight / 2;
        figs.forEach(function (f) {
          if (f.classList.contains('hide')) return;
          var r = f.getBoundingClientRect();
          if (r.bottom < -80 || r.top > window.innerHeight + 80) return;
          var d = ((r.top + r.height / 2) - mid) / mid;   // -1 .. 1
          f.style.transform = 'rotate(' + (d * 0.85).toFixed(3) + 'deg)';
        });
        tTick = false;
      };
      window.addEventListener('scroll', function () {
        if (!tTick) { tTick = true; requestAnimationFrame(tilt); }
      }, { passive: true });
      tilt();
    }
  }

  /* ---------------- appointment request flow ---------------- */
  var book = $('#book');
  if (book) {
    var state = { branch: 'Lenana Road, Nairobi', service: '', addon: 'None', people: '1 person', date: '', time: '', name: '', phone: '', notes: '' };
    var step = 0;
    var steps = $$('.step', book);
    var bars = $$('.book__bar div', book);
    var errOf = function (n) { return $('.err', steps[n]); };

    var setStep = function (n) {
      step = Math.max(0, Math.min(steps.length - 1, n));
      steps.forEach(function (s, i) { s.classList.toggle('on', i === step); });
      bars.forEach(function (b, i) {
        b.dataset.on = String(i === step);
        b.dataset.done = String(i < step);
      });
      steps.forEach(function (s) { var e = $('.err', s); if (e) e.textContent = ''; });
      if (step === steps.length - 1) fillSummary();
      var top = book.getBoundingClientRect().top + window.scrollY - 100;
      if (window.scrollY > top) window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
    };

    // grouped selectors (branch / service / add-on / people / time)
    $$('[data-group]', book).forEach(function (el) {
      el.addEventListener('click', function () {
        var g = el.dataset.group;
        $$('[data-group="' + g + '"]', book).forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        el.setAttribute('aria-pressed', 'true');
        state[g] = el.dataset.value;
        var e = $('.err', steps[step]); if (e) e.textContent = '';
      });
    });

    var dateInput = $('#gh-date', book);
    if (dateInput) {
      var today = new Date();
      dateInput.min = today.toISOString().slice(0, 10);
      dateInput.addEventListener('change', function () { state.date = dateInput.value; var e = errOf(step); if (e) e.textContent = ''; });
    }
    ['name', 'phone', 'notes'].forEach(function (k) {
      var el = $('#gh-' + k, book);
      if (el) el.addEventListener('input', function () {
        state[k] = el.value.trim();
        if (step === steps.length - 1) fillSummary();
      });
    });

    var prettyDate = function (v) {
      if (!v) return '';
      var p = v.split('-');
      var d = new Date(+p[0], +p[1] - 1, +p[2]);
      if (isNaN(d)) return v;
      return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    };

    function fillSummary() {
      $('#s-branch').textContent = state.branch;
      $('#s-service').textContent = state.service + (state.addon !== 'None' ? '  +  ' + state.addon : '');
      $('#s-when').textContent = prettyDate(state.date) + ' · ' + state.time;
      $('#s-who').textContent = state.people + (state.name ? ' · ' + state.name : '');
    }

    function message() {
      var L = [];
      L.push('Hello Daniella\'s Salon & Spa 👋');
      L.push('');
      L.push('I would like to request an appointment.');
      L.push('');
      L.push('• Location: ' + state.branch);
      L.push('• Treatment: ' + state.service);
      if (state.addon && state.addon !== 'None') L.push('• Add-on: ' + state.addon);
      L.push('• For: ' + state.people);
      L.push('• Preferred date: ' + prettyDate(state.date));
      L.push('• Preferred time: ' + state.time);
      if (state.name) L.push('• Name: ' + state.name);
      if (state.phone) L.push('• Callback number: ' + state.phone);
      if (state.notes) L.push('• Notes: ' + state.notes);
      L.push('');
      L.push('Could you confirm availability? Thank you.');
      L.push('— sent from your website');
      return L.join('\n');
    }

    $$('[data-next]', book).forEach(function (b) {
      b.addEventListener('click', function () {
        
        if (step === 0 && !state.service) { errOf(0).textContent = 'Please choose a treatment.'; return; }
        if (step === 1 && !state.date) { errOf(1).textContent = 'Please pick a preferred date.'; return; }
        if (step === 1 && !state.time) { errOf(1).textContent = 'Please pick a preferred time.'; return; }
        setStep(step + 1);
      });
    });
    $$('[data-back]', book).forEach(function (b) {
      b.addEventListener('click', function () { setStep(step - 1); });
    });

    var send = $('#gh-send', book);
    if (send) {
      send.addEventListener('click', function () {
        window.open(window.GH.wa(message()), '_blank', 'noopener');
      });
    }
    setStep(0);
  }

  /* ---------------- prefilled WhatsApp links ---------------- */
  $$('[data-wa]').forEach(function (a) {
    a.setAttribute('href', window.GH.wa(a.dataset.wa));
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
  });

  /* ---------------- footer year ---------------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();

