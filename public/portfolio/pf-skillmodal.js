/* Strength stat overlay — reveals a facets-style card on hover, anchored to a screen edge so the skills stay visible */
(function(){
  'use strict';
  var DATA = {
    'UX Design':        { ey:'02', side:'right', brief:'For me, UX is about translating offline behaviour, habits and patterns into digital journeys, staying close to how people already act.', outcome:'Anchoring to a real behavioural pattern won’t hold 100% of the time, but it lets me judge problems and ideas fundamentally, not cosmetically.' },
    'Design Systems':   { ey:'03', side:'right', brief:'The moment you realise a small thing will need to scale, consistency only holds if there’s a system underneath it.', outcome:'So I start with rules and guidelines, then grow them into a system as the product does.' },
    'Problem Framing':  { ey:'01', side:'right', brief:'I ask why before how, then work back from the expected outcome, since that changes what form and function should be.', outcome:'A new-flow request is a symptom until proven otherwise, so I trace it upstream before sketching anything.' },
    'Rapid Execution':  { ey:'04', side:'right', brief:'I built a design system in Claude that lets me produce screens, flows and even nuanced feedback fast.', outcome:'It speeds up interactive ideas, and shipping them keeps making the system better in return.' },
    'Communication':    { ey:'05', side:'right', brief:'I’m more about why and how than what, why something needs doing, and how it’s planned.', outcome:'I want to understand the reasoning with the team before we commit to building anything.' }
  };
  var modal = document.getElementById('skmodal');
  if(!modal) return;
  var ey = document.getElementById('skmodal-ey');
  var title = document.getElementById('skmodal-title');
  var grid = document.getElementById('skmodal-grid');
  var card = modal.querySelector('.skmodal__card');

  function open(name, sk){
    var d = DATA[name]; if(!d) return;
    ey.textContent = d.ey;
    title.textContent = name;
    var briefEl = modal.querySelector('.skmodal__brief');
    if(briefEl) briefEl.textContent = d.brief || '';
    grid.innerHTML = '';
    if(d.outcome){
      var out = document.createElement('p');
      out.className = 'skmodal__outcome';
      out.textContent = d.outcome;
      grid.appendChild(out);
    } else if(d.stats){
      d.stats.forEach(function(s){
        var cell = document.createElement('div');
        cell.className = 'skstat' + (s.f.length > 12 ? ' skstat--wide' : '');
        var fig = document.createElement('span'); fig.className = 'skstat__fig'; fig.textContent = s.f;
        var lab = document.createElement('span'); lab.className = 'skstat__lab'; lab.textContent = s.l;
        cell.appendChild(fig); cell.appendChild(lab); grid.appendChild(cell);
      });
    }
    modal.className = 'skmodal open skmodal--' + d.side;
    modal.setAttribute('aria-hidden','false');
    if(sk && card){
      var r = sk.getBoundingClientRect();
      var top = Math.min(Math.max(r.top - 20, 12), window.innerHeight - card.offsetHeight - 12);
      card.style.top = top + 'px';
    }
  }
  function close(){
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
  }

  var activeName = null;
  function openSkill(name, sk, svc){
    open(name, sk); activeName = name;
    if(svc){ svc.classList.add('svc-dim'); document.querySelectorAll('.skill.is-active').forEach(function(s){ s.classList.remove('is-active'); }); sk.classList.add('is-active'); }
  }
  function closeSkill(svc){
    close(); activeName = null;
    if(svc){ svc.classList.remove('svc-dim'); document.querySelectorAll('.skill.is-active').forEach(function(s){ s.classList.remove('is-active'); }); }
  }
  var canHover = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var hasTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  document.querySelectorAll('.skill').forEach(function(sk){
    var t = sk.querySelector('.skill__t');
    if(!t) return;
    var name = t.textContent.trim();
    var svc = sk.closest('.svc');
    if(canHover){
      sk.addEventListener('mouseenter', function(){ openSkill(name, sk, svc); });
      sk.addEventListener('mouseleave', function(){ closeSkill(svc); });
    }
    function toggle(e){
      if(e){ e.preventDefault(); e.stopPropagation(); }
      if(activeName === name){ closeSkill(svc); } else { openSkill(name, sk, svc); }
    }
    if(hasTouch){ sk.addEventListener('touchend', toggle, {passive:false}); }
    sk.addEventListener('click', toggle);
  });
  function outside(e){
    if(!activeName) return;
    if(e.target.closest('.skill') || e.target.closest('.skmodal__card')){
      if(e.target.closest('.skmodal__x')){ closeSkill(document.querySelector('.svc')); }
      return;
    }
    closeSkill(document.querySelector('.svc'));
  }
  document.addEventListener('click', outside);
  document.addEventListener('touchend', outside);
  var xbtn = document.querySelector('#skmodal .skmodal__x');
  if(xbtn){
    var xclose = function(e){ e.preventDefault(); e.stopPropagation(); closeSkill(document.querySelector('.svc')); };
    xbtn.addEventListener('touchend', xclose, {passive:false});
    xbtn.addEventListener('click', xclose);
  }
})();
