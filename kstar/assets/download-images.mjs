#!/usr/bin/env node
/**
 * K-Star brand image downloader.
 * Run this in a session where images.unsplash.com is in the egress allowlist,
 * OR locally after cloning the repo.
 *
 *   node kstar/assets/download-images.mjs
 *
 * Saves files to kstar/assets/images/ and prints the src paths to wire
 * into kstar/index.html (replacing each data-figma attribute with data-src
 * pointing at the local file).
 */

import https from 'https';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dir  = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dir, 'images');
fs.mkdirSync(outDir, { recursive: true });

// Themed Unsplash IDs — same pool as photos-v2.js, pick the best per slot.
const SLOTS = [
  // Hero / section backgrounds
  { name: 'hero-bg',          theme: 'strike', id: '1517438476312-10d79c077509', w:1440, h:900  },
  { name: 'about-photo',      theme: 'gym',    id: '1534438327276-14e5300c3a48', w:800,  h:900  },
  // Programs
  { name: 'program-contortion', theme: 'contortion', id: '1544367567-0f2fcb009e0b', w:720, h:900 },
  { name: 'program-lil-stars',  theme: 'kids',       id: '1599058917212-d750089bc07e', w:720, h:900 },
  { name: 'program-youth',      theme: 'youth',      id: '1607962837359-5e7e89f86776', w:720, h:900 },
  { name: 'program-adult',      theme: 'strike',     id: '1555597673-b21d5c935865',   w:720, h:900 },
  // Stories
  { name: 'story-1',  theme: 'strike', id: '1549719386-74dfcbf7dbed', w:720, h:900 },
  { name: 'story-2',  theme: 'flex',   id: '1544367567-0f2fcb009e0b', w:720, h:900 },
  { name: 'story-3',  theme: 'gym',    id: '1571902943202-507ec2618e8f', w:720, h:900 },
  { name: 'story-4',  theme: 'strike', id: '1607962837359-5e7e89f86776', w:720, h:900 },
  // Avatars (story)
  { name: 'avatar-ryan',   face: true, faceN: 1 },
  { name: 'avatar-sarah',  face: true, faceN: 5 },
  { name: 'avatar-james',  face: true, faceN: 8 },
  { name: 'avatar-maya',   face: true, faceN: 12 },
  // Review avatars
  { name: 'avatar-don',    face: true, faceN: 15 },
  { name: 'avatar-alicia', face: true, faceN: 20 },
  { name: 'avatar-priya',  face: true, faceN: 25 },
  { name: 'avatar-marcus', face: true, faceN: 30 },
  // Products
  { name: 'product-gi',        theme: 'gear', id: '1583473848882-f9a5bc7fd2ee', w:600, h:600 },
  { name: 'product-mouthguard',theme: 'gear', id: '1549719386-74dfcbf7dbed',   w:600, h:600 },
  { name: 'product-nunchucks', theme: 'gear', id: '1534438327276-14e5300c3a48', w:600, h:600 },
  { name: 'product-gloves',    theme: 'gear', id: '1555597673-b21d5c935865',   w:600, h:600 },
  // Gallery
  { name: 'gallery-1', theme: 'strike', id: '1517438476312-10d79c077509', w:800, h:600 },
  { name: 'gallery-2', theme: 'flex',   id: '1506126613408-eca07ce68773', w:800, h:600 },
  { name: 'gallery-3', theme: 'gym',    id: '1534438327276-14e5300c3a48', w:800, h:600 },
  { name: 'gallery-4', theme: 'kids',   id: '1599058917212-d750089bc07e', w:800, h:600 },
  { name: 'gallery-5', theme: 'youth',  id: '1607962837359-5e7e89f86776', w:800, h:600 },
];

function unsplashUrl(id, w, h) {
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&crop=entropy&auto=format&q=80`;
}
function faceUrl(n) {
  return `https://i.pravatar.cc/160?img=${n}`;
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    function get(u) {
      https.get(u, res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close(); return get(res.headers.location);
        }
        if (res.statusCode !== 200) {
          file.close(); fs.unlink(dest, ()=>{});
          return reject(new Error(`HTTP ${res.statusCode} for ${u}`));
        }
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', e => { file.close(); fs.unlink(dest, ()=>{}); reject(e); });
    }
    get(url);
  });
}

(async () => {
  const manifest = [];
  for (const slot of SLOTS) {
    const ext  = slot.face ? 'jpg' : 'jpg';
    const dest = path.join(outDir, slot.name + '.' + ext);
    const url  = slot.face ? faceUrl(slot.faceN) : unsplashUrl(slot.id, slot.w, slot.h);
    process.stdout.write(`Downloading ${slot.name}… `);
    try {
      await download(url, dest);
      const relPath = 'assets/images/' + slot.name + '.' + ext;
      manifest.push({ name: slot.name, src: relPath });
      console.log('ok');
    } catch (e) {
      console.log('FAILED:', e.message);
    }
  }
  fs.writeFileSync(path.join(__dir, 'images-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('\nDone. Check kstar/assets/images/ and update data-figma attrs to data-src in index.html.');
})();
