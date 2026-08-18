/* ============================================================
   KS Portfolio — SOUND EFFECTS layer (opt-in, persisted)
   - grass  → grid-morph pointer movement (footstep, distance-gated)
   - birds  → hover over interactive / content elements (cooldown)
   - thud   → click / pointerdown on buttons & links
   Web Audio API: low-latency, overlapping playback, one master gain.
   Toggle wired by the page; state in localStorage 'pf-sfx'.
   ============================================================ */
(function () {
  'use strict';
  var KEY = 'pf-sfx';
  var SRC = {
    'tube-swoosh':   'portfolio2026/sfx/computer-ambience.wav',
    'birds':         'portfolio2026/sfx/birds.wav',
    'interface-zoom':'portfolio2026/sfx/interface-zoom.wav',
    'device-pulse':  'portfolio2026/sfx/device-pulse.wav',
    'click':         'portfolio2026/sfx/click.wav',
    'cta-click':     'portfolio2026/sfx/cta-click.wav'
  };
  var VOL = { 'tube-swoosh': 0.55, 'birds': 0.32, 'interface-zoom': 0.5, 'device-pulse': 0.5, 'click': 0.5, 'cta-click': 0.6 };

  var ctx = null, master = null, buffers = {}, ready = false, loading = false;
  var on = false;

  function enabled() { return on; }

  /* First-gesture unlock: a fresh page (e.g. returning from a case study, where the
     Enter gate is skipped) starts with a SUSPENDED AudioContext. pointermove (grass)
     is not a user gesture, so audio can't start until a real click/tap/key. Resume on
     the earliest such gesture so the SFX come back to life without re-showing the gate. */
  function primeAudio() {
    if (!on) return;
    boot();
    if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
  }
  ['pointerdown', 'touchstart', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, primeAudio, { passive: true });
  });

  function boot() {
    if (ctx || loading) return;
    loading = true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
    } catch (e) { loading = false; return; }
    Object.keys(SRC).forEach(function (name) {
      fetch(SRC[name]).then(function (r) { return r.arrayBuffer(); })
        .then(function (buf) { return ctx.decodeAudioData(buf); })
        .then(function (audio) { buffers[name] = audio; ready = true; })
        .catch(function () {});
    });
  }

  /* play a buffer, optional playbackRate jitter + gain, optional slice length (from a random offset —
     useful for ambient/texture clips whose start may be near-silent) */
  function play(name, gain, rateJit, maxDur, randomOffset) {
    if (!on || !ctx || !buffers[name]) return;
    if (ctx.state === 'suspended') ctx.resume();
    var src = ctx.createBufferSource();
    src.buffer = buffers[name];
    if (rateJit) src.playbackRate.value = 1 + (Math.random() * 2 - 1) * rateJit;
    var g = ctx.createGain();
    g.gain.value = (gain != null ? gain : 1) * (VOL[name] || 0.5);
    src.connect(g); g.connect(master);
    if (randomOffset && maxDur && src.buffer.duration > maxDur + 0.1) {
      var off = Math.random() * (src.buffer.duration - maxDur - 0.05);
      src.start(0, off, maxDur + 0.02);
    } else {
      src.start(0);
    }
    if (maxDur) {
      // quick fade-out so a long clip only contributes a short tactile hit
      var t = ctx.currentTime;
      g.gain.setValueAtTime(g.gain.value, t + maxDur * 0.7);
      g.gain.linearRampToValueAtTime(0.0001, t + maxDur);
      if (!randomOffset) src.stop(t + maxDur + 0.02);
    }
  }

  /* ---------- GRID SWOOSH: tube-swoosh tracks the morph mesh — every notable pointer
     movement across the grid gets a swoosh; faster movement shortens the gap so swooshes
     chain consecutively instead of gating on a fixed cooldown ---------- */
  var lastX = null, lastY = null, acc = 0, lastStep = 0;
  var STEP_DIST = 130;     // px of travel per swoosh (shorter = tighter sync to grid movement)
  var sketchEl = document.getElementById('sketchbook');
  function gateVisible() {
    // the Enter gate blocks grass ONLY while it's actually on screen. On a skip-intro
    // return the gate is display:none (but has no .hide class), so check real visibility.
    var g = document.querySelector('.enter');
    return g && g.offsetParent !== null;
  }
  function grassFactor(y) {
    // 30% volume while the pointer is within the sketchbook section (grass there is distracting)
    if (!sketchEl) return dimForNativeSfx() ? 0 : 1;
    var r = sketchEl.getBoundingClientRect();
    var base = (y >= r.top && y <= r.bottom) ? 0.3 : 1;
    return dimForNativeSfx() ? 0 : base;
  }
  /* any interactive UI element (buttons, cards, tabs, switches, links, nav items, toggles) —
     grid swoosh ducks fully over these, never just over whitespace */
  var NATIVE_SFX_SEL = 'a,button,[role="button"],[role="tab"],[role="switch"],input,select,textarea,label,summary,' +
    '.wcard,.workfeat,.workrow,.themebtn,.sfxbtn,.index__i,[data-skill],.svc .skill,.skill,.jstep,[data-journey],#soonMarquee,.soon,nav,nav *,footer,footer *,.foot,.foot *,.contact,.contact *';
  function dimForNativeSfx() {
    var el = document.elementFromPoint(lastX, lastY);
    return !!(el && el.closest && el.closest(NATIVE_SFX_SEL));
  }
  window.addEventListener('pointermove', function (e) {
    if (!on) { lastX = e.clientX; lastY = e.clientY; return; }
    if (gateVisible()) { lastX = e.clientX; lastY = e.clientY; return; }   // no swoosh while the Enter gate is on screen
    if (lastX != null) {
      var dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
      acc += dist;
      var now = performance.now();
      var speed = dist / Math.max(1, now - lastStep === 0 ? 16 : 16);   // px/frame proxy
      var gap = Math.max(40, 220 - dist * 3);   // faster movement → shorter gap → swooshes chain
      if (acc >= STEP_DIST && now - lastStep > gap) {
        acc = 0; lastStep = now;
        play('tube-swoosh', 0.85 * grassFactor(e.clientY), 0.1, 0.6, true);
      }
    }
    lastX = e.clientX; lastY = e.clientY;
  }, { passive: true });

  /* ---------- BIRDS: hover over INTERACTIVE elements (buttons, logo, nav, toggles) ---------- */
  var HOVER_SEL = 'a,button,[role="button"],.sfxbtn,.themebtn button,.index__i,.workrow,nav a,.nav a';
  /* ---------- LEAVES: dry-leaf rustle WHILE hovering a skill — loudness & speed track
     how hard the text is morphing (driven by pointer movement over the label) ---------- */
  var SKILL_SEL = '[data-skill],.svc .skill,.skill';
  var lastChirp = 0, CHIRP_GAP = 420;
  var leafEl = null, leafOn = false, leafTimer = 0;
  var morphAmt = 0;   // kept for hover-intensity dim tracking

  /* skill hover: one sci-fi interface zoom stinger, not a repeating leaf-crush loop */
  function leafGrain() {
    if (!on || !ctx || !buffers['interface-zoom']) return;
    var buf = buffers['interface-zoom'];
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var g = ctx.createGain();
    g.gain.value = VOL['interface-zoom'] * 0.9;
    src.connect(g); g.connect(master);
    src.start(0);
  }
  function startLeaf() {
    if (!on || leafOn) return;
    if (ctx && ctx.state === 'suspended') ctx.resume();
    leafOn = true;
    leafGrain();
  }
  function stopLeaf() {
    leafOn = false;
    if (leafTimer) { clearTimeout(leafTimer); leafTimer = 0; }
    morphAmt = 0;
  }

  document.addEventListener('pointerover', function (e) {
    if (!on || !e.target.closest) return;
    if (e.target.closest('.enter')) return;   // no SFX on the Enter gate
    var sk = e.target.closest(SKILL_SEL);
    if (sk) {
      if (sk !== leafEl) { leafEl = sk; morphAmt = Math.max(morphAmt, 0.35); startLeaf(); }
      return;
    }
    var now = performance.now();
    var t = e.target.closest(HOVER_SEL);
    if (!t) return;
    if (e.relatedTarget && t.contains(e.relatedTarget)) return;
    if (now - lastChirp < CHIRP_GAP) return;
    lastChirp = now; play('birds', 0.6, 0.08, 1.1);
  }, { passive: true });
  document.addEventListener('pointerout', function (e) {
    if (!leafEl || !e.target.closest) return;
    var sk = e.target.closest(SKILL_SEL);
    if (!sk) return;
    if (e.relatedTarget && sk.contains(e.relatedTarget)) return;
    leafEl = null; stopLeaf();
  }, { passive: true });
  /* pointer speed over a skill → morph intensity */
  var pmX = null, pmY = null;
  document.addEventListener('pointermove', function (e) {
    if (!leafEl) { pmX = e.clientX; pmY = e.clientY; return; }
    if (pmX != null) {
      var d = Math.hypot(e.clientX - pmX, e.clientY - pmY);
      morphAmt = Math.min(1, morphAmt + d / 90);   // faster movement = bigger warp = louder rustle
    }
    pmX = e.clientX; pmY = e.clientY;
  }, { passive: true });

  /* ---------- DEVICE-PULSE: one blip per dot as the journey connector/closing-line stagger reveals ---------- */
  (function () {
    var mapEl = document.querySelector('[data-journey]');
    if (!mapEl) return;
    var lines = [].slice.call(mapEl.querySelectorAll('.jrny__dots, .jrny__more'));
    var seen = lines.map(function (l) { return l.classList.contains('is-active'); });
    var mo = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        var i = lines.indexOf(m.target);
        if (i < 0) return;
        var active = m.target.classList.contains('is-active');
        if (active && !seen[i]) {
          seen[i] = true;
          if (!on) return;
          var dotCount = m.target.querySelectorAll('.jrny__dots-line i').length || 10;
          for (var d = 0; d < dotCount; d++) {
            setTimeout(function () { if (on) play('device-pulse', 0.55, 0.1, 0.3); }, d * 50);
          }
        }
        if (!active) seen[i] = false;
      });
    });
    lines.forEach(function (l) { mo.observe(l, { attributes: true, attributeFilter: ['class'] }); });
  })();

  /* ---------- CLICK: bird-flutter on press of interactive elements ---------- */
  document.addEventListener('pointerdown', function (e) {
    if (!on) return;
    if (e.target.closest && e.target.closest('.enter')) return;   // no click SFX on the Enter gate
    var t = e.target.closest && e.target.closest('a,button,[role="button"],.workrow,.index__i,.sfxbtn,.themebtn button');
    if (!t) return;
    play('click', 0.95, 0.08, 0.6);
  }, { passive: true });

  /* ---------- looping ambience (e.g. meadow wind while hovering) ---------- */
  var loopSrc = null, loopGain = null;
  function loopStart(name, gain) {
    if (!on || !ctx || !buffers[name] || loopSrc) return;
    if (ctx.state === 'suspended') ctx.resume();
    loopSrc = ctx.createBufferSource();
    loopSrc.buffer = buffers[name];
    loopSrc.loop = true;
    loopGain = ctx.createGain();
    loopGain.gain.value = 0.0001;
    loopSrc.connect(loopGain); loopGain.connect(master);
    loopSrc.start(0);
    var t = ctx.currentTime, target = (gain != null ? gain : 1) * (VOL[name] || 0.5);
    loopGain.gain.linearRampToValueAtTime(target, t + 0.35);
  }
  function loopStop() {
    if (!loopSrc) return;
    var s = loopSrc, g = loopGain; loopSrc = null; loopGain = null;
    try {
      var t = ctx.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0.0001, t + 0.4);
      s.stop(t + 0.45);
    } catch (e) { try { s.stop(); } catch (e2) {} }
  }

  /* ---------- public API for the page toggle ---------- */
  window.KSSound = {
    loopStart: function (name, gain) { loopStart(name, gain); },
    loopStop: function () { loopStop(); },
    playOnce: function (name, gain) { play(name, gain != null ? gain : 1); },
    set: function (v) {
      on = !!v;
      if (on) { boot(); if (ctx && ctx.state === 'suspended') ctx.resume(); }
      else { leafEl = null; stopLeaf(); loopStop(); }
      try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) {}
      document.documentElement.classList.toggle('sfx-on', on);
      return on;
    },
    toggle: function () { return this.set(!on); },
    isOn: function () { return on; },
    initial: function () {
      var v = 'off';
      try { v = localStorage.getItem(KEY) || 'off'; } catch (e) {}
      // don't auto-play audio; just reflect stored intent visually and boot lazily on first gesture
      on = (v === 'on');
      document.documentElement.classList.toggle('sfx-on', on);
      if (on) boot();
      return on;
    }
  };
})();
