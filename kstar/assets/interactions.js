/* ============================================================
   K-STAR — shared interactions (vanilla, data-attribute driven)
   Works across all three variations.
   ============================================================ */
(function(){
  'use strict';

  /* ---- Scroll reveal (position-based; robust in sandboxed iframes) ---- */
  function initReveal(){
    var els = [].slice.call(document.querySelectorAll('[data-reveal]'));
    if(!els.length) return;
    function show(el){
      var d = el.getAttribute('data-reveal-delay');
      if(d) el.style.transitionDelay = d + 'ms';
      el.classList.add('is-in');
    }
    function check(){
      var vh = window.innerHeight || document.documentElement.clientHeight;
      for(var i = els.length - 1; i >= 0; i--){
        var r = els[i].getBoundingClientRect();
        if(r.top < vh * 0.94 && r.bottom > -40){ show(els[i]); els.splice(i,1); }
      }
    }
    check(); // reveal whatever is already in view on load
    var ticking = false;
    function onScroll(){
      if(ticking) return; ticking = true;
      window.requestAnimationFrame(function(){ check(); ticking = false; });
    }
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onScroll);
    window.addEventListener('load', check);
    if('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(en){ if(en.isIntersecting){ show(en.target); io.unobserve(en.target);
          var k = els.indexOf(en.target); if(k>-1) els.splice(k,1); } });
      },{rootMargin:'0px 0px -6% 0px',threshold:.1});
      els.forEach(function(e){ io.observe(e); });
    }
    // safety net: never leave content hidden
    setTimeout(function(){ els.slice().forEach(show); els.length = 0; }, 1500);
  }

  /* ---- Sticky header state ---- */
  function initHeader(){
    var h = document.querySelector('[data-header]');
    if(!h) return;
    var onScroll = function(){ h.classList.toggle('is-stuck', window.scrollY > 24); };
    onScroll(); window.addEventListener('scroll', onScroll, {passive:true});
  }

  /* ---- Tabs ([data-tabs] wrapping [data-tab] buttons + [data-panel]) ---- */
  function initTabs(){
    document.querySelectorAll('[data-tabs]').forEach(function(group){
      var tabs = group.querySelectorAll('[data-tab]');
      var host = document.querySelector(group.getAttribute('data-tabs-target')) || group;
      var panels = host.querySelectorAll('[data-panel]');
      tabs.forEach(function(tab){
        tab.addEventListener('click', function(){
          var key = tab.getAttribute('data-tab');
          tabs.forEach(function(t){t.classList.toggle('is-active', t===tab)});
          panels.forEach(function(p){p.hidden = p.getAttribute('data-panel')!==key;});
        });
      });
    });
  }

  /* ---- Carousel ([data-carousel] > [data-track] > items; [data-prev]/[data-next]/[data-dots]) ---- */
  function initCarousels(){
    document.querySelectorAll('[data-carousel]').forEach(function(car){
      var track = car.querySelector('[data-track]');
      if(!track) return;
      var prev = car.querySelector('[data-prev]');
      var next = car.querySelector('[data-next]');
      var dotsWrap = car.querySelector('[data-dots]');
      function step(){
        var first = track.children[0];
        if(!first) return track.clientWidth;
        var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 0) || 0;
        return first.getBoundingClientRect().width + gap;
      }
      if(prev) prev.addEventListener('click', function(){track.scrollBy({left:-step(),behavior:'smooth'})});
      if(next) next.addEventListener('click', function(){track.scrollBy({left:step(),behavior:'smooth'})});
      if(dotsWrap){
        var n = track.children.length, dots=[];
        for(var i=0;i<n;i++){(function(i){
          var b=document.createElement('button');b.className='kdot';b.setAttribute('aria-label','Slide '+(i+1));
          b.addEventListener('click',function(){track.scrollTo({left:i*step(),behavior:'smooth'})});
          dotsWrap.appendChild(b);dots.push(b);
        })(i);}
        var sync=function(){
          var idx=Math.round(track.scrollLeft/step());
          dots.forEach(function(d,i){d.classList.toggle('is-active',i===idx)});
        };
        track.addEventListener('scroll',function(){window.requestAnimationFrame(sync)},{passive:true});
        sync();
      }
    });
  }

  /* ---- Hero auto-rotating dots ([data-hero-dots]) ---- */
  function initHeroDots(){
    document.querySelectorAll('[data-hero]').forEach(function(hero){
      var slides = hero.querySelectorAll('[data-hero-slide]');
      var dotsWrap = hero.querySelector('[data-hero-dots]');
      if(!slides.length) return;
      var idx=0,dots=[],timer;
      function go(i){
        idx=(i+slides.length)%slides.length;
        slides.forEach(function(s,j){s.classList.toggle('is-active',j===idx)});
        dots.forEach(function(d,j){d.classList.toggle('is-active',j===idx)});
      }
      if(dotsWrap){slides.forEach(function(_,i){
        var b=document.createElement('button');b.className='hdot';b.setAttribute('aria-label','Slide '+(i+1));
        b.addEventListener('click',function(){go(i);restart()});dotsWrap.appendChild(b);dots.push(b);
      });}
      function restart(){clearInterval(timer);timer=setInterval(function(){go(idx+1)},5200);}
      go(0);restart();
    });
  }

  /* ---- Modal ([data-modal-open="id"] / [data-modal="id"] / [data-modal-close]) ---- */
  function initModals(){
    function open(id){var m=document.querySelector('[data-modal="'+id+'"]');if(m){m.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}}
    function close(m){m.setAttribute('aria-hidden','true');document.body.style.overflow='';}
    document.addEventListener('click',function(e){
      var o=e.target.closest('[data-modal-open]');
      if(o){e.preventDefault();open(o.getAttribute('data-modal-open'));return;}
      var c=e.target.closest('[data-modal-close]');
      if(c){var m=c.closest('[data-modal]');if(m)close(m);return;}
      if(e.target.matches('.kmodal__scrim')){var mm=e.target.closest('[data-modal]');if(mm)close(mm);}
    });
    document.addEventListener('keydown',function(e){
      if(e.key==='Escape'){document.querySelectorAll('[data-modal][aria-hidden="false"]').forEach(close);}
    });
  }

  /* ---- Schedule chips: clicking books a class ---- */
  function initSchedule(){
    document.querySelectorAll('[data-book-class]').forEach(function(chip){
      chip.addEventListener('click',function(){
        var label = chip.getAttribute('data-book-class');
        var target = document.querySelector('[data-modal="book"] [data-book-target]');
        if(target) target.textContent = label;
        var ev = document.createElement('a'); ev.setAttribute('data-modal-open','book');
        document.body.appendChild(ev); ev.click(); ev.remove();
      });
    });
  }

  /* ---- Simple form submit -> success state ---- */
  function initForms(){
    document.querySelectorAll('[data-mock-form]').forEach(function(f){
      f.addEventListener('submit',function(e){
        e.preventDefault();
        var done = f.querySelector('[data-form-done]');
        if(done){f.querySelectorAll('input,textarea,select,button,[data-form-fields]').forEach(function(el){
          if(!el.hasAttribute('data-form-done')) el.style.display='none';
        }); done.hidden=false;}
      });
    });
  }

  function boot(){
    initReveal();initHeader();initTabs();initCarousels();initHeroDots();
    initModals();initSchedule();initForms();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
