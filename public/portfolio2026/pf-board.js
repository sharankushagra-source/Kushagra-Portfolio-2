/* Selected Work — drag to rotate the board (parallax tilt), spring back on release */
(function(){
  'use strict';
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  var board = document.querySelector('.pwork__board');
  if (!board) return;
  var stage = board.closest('.pwork__stage') || board.parentElement;
  var MAXX = 12, MAXY = 16;
  var rx = 0, ry = 0;         // current rotation
  var tx = 0, ty = 0;         // idle parallax target (tx→rotateY, ty→rotateX)
  var dragging = false, moved = false, sx = 0, sy = 0, brx = 0, bry = 0;
  function clamp(v, m){ return Math.max(-m, Math.min(m, v)); }

  board.addEventListener('pointerdown', function(e){
    dragging = true; moved = false; sx = e.clientX; sy = e.clientY; brx = rx; bry = ry;
    board.classList.add('is-dragging');
  });
  window.addEventListener('pointermove', function(e){
    if (dragging){
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      ry = clamp(bry + dx * 0.09, MAXY);
      rx = clamp(brx - dy * 0.09, MAXX);
      return;
    }
    var r = stage.getBoundingClientRect();
    var px = (e.clientX - r.left) / r.width - 0.5;
    var py = (e.clientY - r.top) / r.height - 0.5;
    tx = clamp(px * 9, MAXY);
    ty = clamp(-py * 6, MAXX);
  });
  function endDrag(){ dragging = false; board.classList.remove('is-dragging'); }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  stage.addEventListener('pointerleave', function(){ if (!dragging){ tx = 0; ty = 0; } });
  // suppress the click that ends a drag so cards don't navigate on release
  board.addEventListener('click', function(e){ if (moved){ e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

  function raf(){
    if (!dragging){ rx += (ty - rx) * 0.06; ry += (tx - ry) * 0.06; }
    board.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
})();
