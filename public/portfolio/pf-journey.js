/* ============================================================
   KS Portfolio — EXPERIENCE journey map
   A milestone reveals the moment its pin enters the reading zone
   (its info then appears one item at a time). The dotted connectors
   between steps are static (CSS), living only in the whitespace —
   no drawn trail, no curve, nothing overlapping content.
   ============================================================ */
(function () {
  'use strict';
  var map = document.querySelector('[data-journey]');
  if (!map) return;
  var steps = Array.prototype.slice.call(map.querySelectorAll('[data-step]'));
  var dots = Array.prototype.slice.call(map.querySelectorAll('.jrny__dots'));
  var more = map.querySelector('.jrny__more');

  function onScroll() {
    var mr = map.getBoundingClientRect();
    var L = window.innerHeight * 0.72;   // reading line — reveal as a pin enters view
    steps.forEach(function (s, i) {
      var pin = s.querySelector('.jstep__pin');
      if (!pin) return;
      var r = pin.getBoundingClientRect();
      if (r.top + r.height / 2 <= L) {
        s.classList.add('is-active');
        if (dots[i] && !dots[i].dataset.armed) {
          dots[i].dataset.armed = '1';
          // dots start their forward-moving reveal once this milestone's pills have appeared
          setTimeout(function (d) { return function () { d.classList.add('is-active'); }; }(dots[i]), 900);
        }
      }
    });
    if (more && !more.dataset.armed) {
      var last = steps[steps.length - 1].querySelector('.jstep__pin');
      if (last && last.getBoundingClientRect().top <= L - 30) {
        more.dataset.armed = '1';
        setTimeout(function () { more.classList.add('is-active'); }, 900);
      }
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  requestAnimationFrame(onScroll);
  setTimeout(onScroll, 500);
})();
