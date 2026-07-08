const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

// The original loadState function
const originalLoadState = `  const loadState = async () => {
    try {
      const stockRes = await fetch('/api/stock');
      stock = await stockRes.json();

      const menuRes = await fetch('/api/menu');
      menu = await menuRes.json();`;

// The fixed loadState function
const replacementLoadState = `  const loadState = async () => {
    try {
      const stockRes = await fetch('/api/stock');
      const flatStock = await stockRes.json();
      stock = {
         bases: flatStock.filter(s => ['raw_material', 'packaging', 'cleaning', 'Base'].includes(s.category)),
         toppings: flatStock.filter(s => ['topping', 'Topping'].includes(s.category)),
         syrups: flatStock.filter(s => ['syrup', 'Sirope'].includes(s.category)),
         drinks: flatStock.filter(s => ['drink', 'Bebida'].includes(s.category)),
         icecreams: flatStock.filter(s => ['icecream', 'Helado'].includes(s.category))
      };

      const menuRes = await fetch('/api/menu');
      menu = await menuRes.json();`;

if (content.includes(originalLoadState)) {
    content = content.replace(originalLoadState, replacementLoadState);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Patched loadState successfully");
} else {
    console.log("Could not find loadState to patch");
}
