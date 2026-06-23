/* ============================================================
   K-STAR — Landing v2 interactions
   Mobile nav, scroll-spy, carousels (stories + gallery),
   lead-form validation, back-to-top. Vanilla, no deps.
   (Reveal / sticky header / tabs / modal / mock-forms come
    from interactions.js — this file owns everything else.)
   ============================================================ */
(function(){
  'use strict';

  /* ---- Mobile menu ---- */
  function initMenu(){
    var burger = document.querySelector('[data-menu-toggle]');
    var menu   = document.querySelector('[data-mobile-menu]');
    var scrim  = document.querySelector('[data-menu-scrim]');
    if(!burger || !menu) return;
    function set(open){
      burger.classList.toggle('is-open', open);
      menu.classList.toggle('is-open', open);
      if(scrim) scrim.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    }
    burger.addEventListener('click', function(){ set(!menu.classList.contains('is-open')); });
    if(scrim) scrim.addEventListener('click', function(){ set(false); });
    menu.querySelectorAll('[data-menu-link]').forEach(function(a){
      a.addEventListener('click', function(){ set(false); });
    });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') set(false); });
  }

  /* ---- Scroll-spy: highlight active nav link ---- */
  function initScrollSpy(){
    var links = [].slice.call(document.querySelectorAll('.nav__links a[href^="#"]'));
    if(!links.length) return;
    var map = links.map(function(a){
      var id = a.getAttribute('href').slice(1);
      return { a:a, el: id ? document.getElementById(id) : null };
    }).filter(function(m){ return m.el; });
    function onScroll(){
      var y = window.scrollY + 140;
      var current = map[0];
      for(var i=0;i<map.length;i++){ if(map[i].el.offsetTop <= y) current = map[i]; }
      links.forEach(function(a){ a.classList.remove('is-active'); });
      if(current) current.a.classList.add('is-active');
    }
    onScroll();
    window.addEventListener('scroll', onScroll, {passive:true});
  }

  /* ---- Generic horizontal carousel ----
     root: container; track: scroll element; prev/next buttons; prog: segment wrap. */
  function wireCarousel(opts){
    var track = opts.track;
    if(!track) return null;
    var prev = opts.prev, next = opts.next, prog = opts.prog;
    function cardStep(){
      var first = track.children[0];
      if(!first) return track.clientWidth;
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 0) || 0;
      return first.getBoundingClientRect().width + gap;
    }
    function perView(){ return Math.max(1, Math.round(track.clientWidth / cardStep())); }
    function pages(){ return Math.max(1, track.children.length - perView() + 1); }
    // build progress segments
    function buildProg(){
      if(!prog) return;
      prog.innerHTML = '';
      var n = pages();
      for(var i=0;i<n;i++){ prog.appendChild(document.createElement('i')); }
    }
    function index(){ return Math.round(track.scrollLeft / cardStep()); }
    function sync(){
      var idx = index(), n = pages();
      if(prog){
        [].forEach.call(prog.children, function(seg,i){ seg.classList.toggle('is-active', i===idx); });
      }
      if(prev) prev.disabled = idx <= 0;
      if(next) next.disabled = idx >= n - 1;
    }
    if(prev) prev.addEventListener('click', function(){ track.scrollBy({left:-cardStep(), behavior:'smooth'}); });
    if(next) next.addEventListener('click', function(){ track.scrollBy({left: cardStep(), behavior:'smooth'}); });
    var ticking=false;
    track.addEventListener('scroll', function(){
      if(ticking) return; ticking=true;
      requestAnimationFrame(function(){ sync(); ticking=false; });
    }, {passive:true});
    window.addEventListener('resize', function(){ buildProg(); sync(); });
    buildProg(); sync();
    return { rebuild:function(){ buildProg(); sync(); }, sync:sync };
  }

  /* ---- Stories carousel ---- */
  function initStories(){
    var root = document.querySelector('[data-story-carousel]');
    if(!root) return;
    wireCarousel({
      track: root.querySelector('[data-track]'),
      prev:  root.querySelector('[data-prev]'),
      next:  root.querySelector('[data-next]'),
      prog:  root.querySelector('[data-prog]')
    });
  }

  /* ---- Gallery carousel: shared arrows + progress always drive the
         currently-visible panel track (tabs swap which track shows). ---- */
  function initGallery(){
    var root = document.querySelector('[data-gallery]');
    if(!root) return;
    var prev = root.querySelector('[data-gal-prev]');
    var next = root.querySelector('[data-gal-next]');
    var prog = root.querySelector('[data-gal-prog]');
    var tracks = [].slice.call(root.querySelectorAll('[data-gal-track]'));
    if(!tracks.length) return;

    function visible(){ return root.querySelector('[data-gal-track]:not([hidden])') || tracks[0]; }
    function stepOf(t){
      var first = t.children[0];
      if(!first) return t.clientWidth;
      var gap = parseFloat(getComputedStyle(t).columnGap || getComputedStyle(t).gap || 0) || 0;
      return first.getBoundingClientRect().width + gap;
    }
    function pagesOf(t){
      var per = Math.max(1, Math.round(t.clientWidth / stepOf(t)));
      return Math.max(1, t.children.length - per + 1);
    }
    function sync(){
      var t = visible(), step = stepOf(t), idx = Math.round(t.scrollLeft / step), n = pagesOf(t);
      if(prog){
        if(prog.children.length !== n){
          prog.innerHTML = '';
          for(var i=0;i<n;i++) prog.appendChild(document.createElement('i'));
        }
        [].forEach.call(prog.children, function(seg,i){ seg.classList.toggle('is-active', i===idx); });
      }
      if(prev) prev.disabled = idx <= 0;
      if(next) next.disabled = idx >= n - 1;
    }
    if(prev) prev.addEventListener('click', function(){ var t=visible(); t.scrollBy({left:-stepOf(t), behavior:'smooth'}); });
    if(next) next.addEventListener('click', function(){ var t=visible(); t.scrollBy({left: stepOf(t), behavior:'smooth'}); });
    tracks.forEach(function(t){
      var ticking=false;
      t.addEventListener('scroll', function(){
        if(ticking) return; ticking=true;
        requestAnimationFrame(function(){ if(!t.hidden) sync(); ticking=false; });
      }, {passive:true});
    });
    // tabs (handled by interactions.js) — resync after the panel swap
    root.querySelectorAll('[data-tab]').forEach(function(btn){
      btn.addEventListener('click', function(){ setTimeout(sync, 0); });
    });
    window.addEventListener('resize', sync);
    sync();
  }

  /* ---- Lead form (Book a Class) validation + success ---- */
  function initBookForm(){
    var form = document.querySelector('[data-book-form]');
    if(!form) return;
    var submit = form.querySelector('[data-book-submit]');
    var fields = form.querySelector('[data-form-fields]');
    var done   = form.querySelector('[data-form-done]');
    function validate(){
      var ok = true;
      form.querySelectorAll('input[required],select[required]').forEach(function(inp){
        var wrap = inp.closest('.field');
        var good = inp.value.trim() !== '' && (inp.type!=='email' || /.+@.+\..+/.test(inp.value));
        if(wrap) wrap.classList.toggle('invalid', !good);
        if(!good) ok = false;
      });
      return ok;
    }
    function go(){
      if(!validate()) return;
      if(fields) fields.style.display = 'none';
      if(done) done.hidden = false;
    }
    if(submit){
      submit.addEventListener('click', function(e){ e.preventDefault(); go(); });
      submit.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); go(); } });
    }
    form.addEventListener('submit', function(e){ e.preventDefault(); go(); });
    // clear invalid state on input
    form.querySelectorAll('input,select').forEach(function(inp){
      inp.addEventListener('input', function(){ var w=inp.closest('.field'); if(w) w.classList.remove('invalid'); });
    });
  }

  function boot(){
    initMenu(); initScrollSpy(); initStories(); initGallery(); initBookForm();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
