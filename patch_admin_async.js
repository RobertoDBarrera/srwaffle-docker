const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'admin', 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

// The replacements to ensure loadState is awaited
content = content.replace(/loadState\(\);\s*setTimeout\(window\.renderCrudStock, 200\);/g, 'await loadState(); window.renderCrudStock();');
content = content.replace(/loadState\(\);\s*setTimeout\(window\.renderCrudMasas, 200\);/g, 'await loadState(); window.renderCrudMasas();');
content = content.replace(/loadState\(\);\s*setTimeout\(window\.renderCrudWaffles, 200\);/g, 'await loadState(); window.renderCrudWaffles();');
content = content.replace(/loadState\(\);\s*setTimeout\(window\.renderCrudMenu, 200\);/g, 'await loadState(); window.renderCrudMenu();');

// Delete functions also need await
content = content.replace(/await fetch\([^)]+\);\s*loadState\(\);\s*setTimeout\(window\.renderCrudStock, 200\);/g, (match) => match.replace('loadState(); setTimeout(window.renderCrudStock, 200);', 'await loadState(); window.renderCrudStock();'));
content = content.replace(/await fetch\([^)]+\);\s*loadState\(\);\s*setTimeout\(window\.renderCrudMasas, 200\);/g, (match) => match.replace('loadState(); setTimeout(window.renderCrudMasas, 200);', 'await loadState(); window.renderCrudMasas();'));
content = content.replace(/await fetch\([^)]+\);\s*loadState\(\);\s*setTimeout\(window\.renderCrudWaffles, 200\);/g, (match) => match.replace('loadState(); setTimeout(window.renderCrudWaffles, 200);', 'await loadState(); window.renderCrudWaffles();'));
content = content.replace(/await fetch\([^)]+\);\s*loadState\(\);\s*setTimeout\(window\.renderCrudMenu, 200\);/g, (match) => match.replace('loadState(); setTimeout(window.renderCrudMenu, 200);', 'await loadState(); window.renderCrudMenu();'));

fs.writeFileSync(filePath, content, 'utf8');
console.log("Patched admin/app.js for async loadState");
