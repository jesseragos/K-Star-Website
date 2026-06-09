/* ============================================================
   K-STAR — preview photos  (verified-fast sources)
   Fills every .ph placeholder with a themed photo. Uses only
   Unsplash CDN IDs confirmed to load fast + parallel, Pravatar
   for headshots, and a TIMEOUT fallback to Picsum (a stalled
   request never fires onerror, so we time it out ourselves).
   Swap for real K-Star photography later by replacing each <img>.
   ============================================================ */
(function(){
  'use strict';
  var GRAY = document.body.getAttribute('data-variation') === 'discipline';

  // Verified Unsplash photo IDs, grouped by theme
  var POOLS = {
    strike: ['1517438476312-10d79c077509','1549719386-74dfcbf7dbed','1607962837359-5e7e89f86776',
             '1583473848882-f9a5bc7fd2ee','1555597673-b21d5c935865','1599058917212-d750089bc07e'],
    gym:    ['1534438327276-14e5300c3a48','1571902943202-507ec2618e8f','1540497077202-7c8a3999166f',
             '1571019613454-1cb2f99b2d8b','1518611012118-696072aa579a'],
    flex:   ['1544367567-0f2fcb009e0b','1506126613408-eca07ce68773','1545205597-3d9d02c29597'],
    gear:   ['1549719386-74dfcbf7dbed','1583473848882-f9a5bc7fd2ee','1534438327276-14e5300c3a48','1555597673-b21d5c935865']
  };
  var counters = {};
  function pick(pool){ counters[pool]=(counters[pool]||0); var a=POOLS[pool]; return a[counters[pool]++ % a.length]; }

  function poolFor(label){
    var s=(label||'').toLowerCase();
    if(/contortion|flex|yoga|mobility/.test(s)) return 'flex';
    if(/glove|mouthguard|nunchuck|gi |gear|product|uniform/.test(s)) return 'gear';
    if(/mat|floor|lobby|studio|tour|interior/.test(s)) return 'gym';
    return 'strike';
  }

  function unsplash(id,w,h){
    return 'https://images.unsplash.com/photo-'+id+'?w='+w+'&h='+h+'&fit=crop&crop=entropy&auto=format&q=70'+(GRAY?'&sat=-100':'');
  }
  function picsum(seed,w,h){ return 'https://picsum.photos/seed/'+encodeURIComponent(seed)+'/'+w+'/'+h+(GRAY?'?grayscale':''); }

  var pidx=0;
  document.querySelectorAll('.ph').forEach(function(ph){
    var r=ph.getBoundingClientRect();
    var lbl=ph.querySelector('.ph__label');
    var empty=!lbl||!lbl.textContent.trim();
    var avatar=empty && r.width && r.width<90;
    var landscape=r.width>r.height*1.15;
    var w=avatar?160:(landscape?900:680), h=avatar?160:(landscape?600:900);

    var img=document.createElement('img');
    img.alt=''; img.decoding='async';
    img.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;opacity:0;transition:opacity .5s';

    var primary, seed;
    if(avatar){ primary='https://i.pravatar.cc/160?img='+(((pidx++)%70)+1); seed='face'+pidx; }
    else { var p=poolFor(lbl&&lbl.textContent); primary=unsplash(pick(p),w,h); seed=p+pidx++; }

    var stage=0, timer;
    function fallback(){ if(stage===0){ stage=1; clearTimeout(timer); img.src=picsum(seed,w,h);
        timer=setTimeout(function(){ if(!img.complete||img.naturalWidth===0) img.remove(); },5000);
      } else { img.remove(); } }
    img.onload=function(){ if(img.naturalWidth>0){ clearTimeout(timer); img.style.opacity=1; } };
    img.onerror=fallback;
    img.src=primary;
    timer=setTimeout(function(){ if(!img.complete||img.naturalWidth===0) fallback(); },4500);

    ph.appendChild(img);
  });
})();
