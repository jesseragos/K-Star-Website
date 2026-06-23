/* ============================================================
   K-STAR — Landing v2 photo loader
   Fills every .ph placeholder with an image. Source priority:
     1. data-figma  (the original Figma-uploaded asset, if reachable)
     2. themed Unsplash photo (by data-theme)
     3. Picsum (final fallback)
   Each step has a timeout so a stalled request can't hang a slot.
   Swap in real K-Star photography by setting data-figma to a
   permanent URL, or drop files in assets/ and point data-src here.
   ============================================================ */
(function(){
  'use strict';

  var POOLS = {
    strike: ['1517438476312-10d79c077509','1549719386-74dfcbf7dbed','1607962837359-5e7e89f86776',
             '1555597673-b21d5c935865','1599058917212-d750089bc07e'],
    flex:   ['1544367567-0f2fcb009e0b','1506126613408-eca07ce68773','1545205597-3d9d02c29597',
             '1518611012118-696072aa579a'],
    gym:    ['1534438327276-14e5300c3a48','1571902943202-507ec2618e8f','1540497077202-7c8a3999166f',
             '1571019613454-1cb2f99b2d8b'],
    gear:   ['1583473848882-f9a5bc7fd2ee','1549719386-74dfcbf7dbed','1534438327276-14e5300c3a48',
             '1555597673-b21d5c935865'],
    kids:   ['1599058917212-d750089bc07e','1518611012118-696072aa579a','1571902943202-507ec2618e8f'],
    youth:  ['1607962837359-5e7e89f86776','1517438476312-10d79c077509','1571019613454-1cb2f99b2d8b'],
    contortion: ['1544367567-0f2fcb009e0b','1506126613408-eca07ce68773','1545205597-3d9d02c29597']
  };
  var counters = {};
  function pick(theme){
    var pool = POOLS[theme] || POOLS.strike;
    counters[theme] = (counters[theme]||0);
    return pool[counters[theme]++ % pool.length];
  }
  function unsplash(id,w,h){
    return 'https://images.unsplash.com/photo-'+id+'?w='+w+'&h='+h+'&fit=crop&crop=entropy&auto=format&q=72';
  }
  function picsum(seed,w,h){ return 'https://picsum.photos/seed/'+encodeURIComponent(seed)+'/'+w+'/'+h; }

  var pidx = 0, faceIdx = 0;

  document.querySelectorAll('.ph').forEach(function(ph){
    var theme = ph.getAttribute('data-theme') || 'strike';
    var figma = ph.getAttribute('data-figma');
    var r = ph.getBoundingClientRect();
    var isFace = theme === 'face';
    var landscape = r.width > r.height * 1.15;
    var w = isFace ? 160 : (landscape ? 1000 : 720);
    var h = isFace ? 160 : (landscape ? 680 : 900);

    // Build the ordered list of candidate sources.
    var sources = [];
    if(figma) sources.push(figma);
    if(isFace){
      sources.push('https://i.pravatar.cc/160?img=' + (((faceIdx++) % 70) + 1));
    } else {
      sources.push(unsplash(pick(theme), w, h));
    }
    sources.push(picsum(theme + (pidx++), w, h));

    var img = document.createElement('img');
    img.alt = ''; img.decoding = 'async'; img.loading = 'lazy';
    img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;opacity:0;transition:opacity .5s';

    var stage = -1, timer;
    function tryNext(){
      stage++;
      clearTimeout(timer);
      if(stage >= sources.length){ img.remove(); return; }
      img.src = sources[stage];
      // figma/proxied URLs can stall; give each candidate a short budget
      var budget = (stage === 0 && figma) ? 2600 : 4500;
      timer = setTimeout(function(){
        if(!img.complete || img.naturalWidth === 0) tryNext();
      }, budget);
    }
    img.onload = function(){
      if(img.naturalWidth > 0){ clearTimeout(timer); img.style.opacity = 1; }
    };
    img.onerror = tryNext;

    ph.appendChild(img);
    tryNext();
  });
})();
