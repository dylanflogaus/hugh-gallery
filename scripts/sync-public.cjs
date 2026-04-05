/**
 * Copy static files into public/ for Worker [assets] (avoids uploading node_modules).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pub = path.join(root, 'public');

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

console.log('public/ synced for Worker assets');
