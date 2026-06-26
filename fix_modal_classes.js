const fs = require('fs');
let html = fs.readFileSync('admin/index.html', 'utf8');

// Fix the classes
html = html.replace('<div class="modal-overlay" id="theme-edit-modal">', '<div class="pos-modal-overlay" id="theme-edit-modal" style="display: none; z-index: 99999;">');

// The inner div is probably `<div class="modal" style="max-width: 600px;">`
html = html.replace('<div class="modal" style="max-width: 600px;">', '<div class="inventory-modal" style="max-width: 600px; padding: 2rem;">');

// Bump cache
html = html.replace(/app\.js\?v=\d+/, 'app.js?v=' + Date.now());

fs.writeFileSync('admin/index.html', html);
console.log('Fixed modal classes');
