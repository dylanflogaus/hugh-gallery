/**
 * Copy static files into public/ for Worker [assets] (avoids uploading node_modules).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.join(__dirname, '..');
const pub = path.join(root, 'public');
const artworkDir = path.join(root, 'artwork');
const pubArtworkDir = path.join(pub, 'artwork');
let preservedArtworkTmp = '';

const rootFiles = [
  'index.html',
  'about.html',
  'contact.html',
  'cart.html',
  'gallery.html',
  'admin.html',
  'style.css',
  'main.js',
  'gallery-store.js',
  'gallery-page.js',
  'home-featured.js',
  'admin.js',
];

if (!fs.existsSync(artworkDir) && fs.existsSync(pubArtworkDir)) {
  preservedArtworkTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hugh-artwork-'));
  fs.cpSync(pubArtworkDir, path.join(preservedArtworkTmp, 'artwork'), { recursive: true });
}

if (fs.existsSync(pub)) {
  fs.rmSync(pub, { recursive: true });
}
fs.mkdirSync(pub, { recursive: true });

for (const f of rootFiles) {
  const from = path.join(root, f);
  if (!fs.existsSync(from)) continue;
  fs.copyFileSync(from, path.join(pub, f));
}

const iconsDir = path.join(root, 'icons');
if (fs.existsSync(iconsDir)) {
  fs.cpSync(iconsDir, path.join(pub, 'icons'), { recursive: true });
}

if (fs.existsSync(artworkDir)) {
  fs.cpSync(artworkDir, path.join(pub, 'artwork'), { recursive: true });
} else if (preservedArtworkTmp) {
  fs.cpSync(path.join(preservedArtworkTmp, 'artwork'), path.join(pub, 'artwork'), {
    recursive: true,
  });
  fs.rmSync(preservedArtworkTmp, { recursive: true, force: true });
}

console.log('public/ synced for Worker assets');
