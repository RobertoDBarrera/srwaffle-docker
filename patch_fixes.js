const fs = require('fs');

// --- 1. Fix CSS Variable Bleeding in theme-manager.js ---
let themeJs = fs.readFileSync('theme-manager.js', 'utf8');

const oldColorLogic = `    // 1. Colores
    if (styles.colors) {
      currentColors = { ...styles.colors };
      Object.entries(styles.colors).forEach(([variable, value]) => {
        if (!value) return;
        document.documentElement.style.setProperty(variable, value);
        if (variable === '--neon-purple') document.documentElement.style.setProperty('--neon-purple-glow', hexToRgba(value, 0.5));
        if (variable === '--neon-pink') document.documentElement.style.setProperty('--neon-pink-glow', hexToRgba(value, 0.5));
        if (variable === '--neon-cyan') document.documentElement.style.setProperty('--neon-cyan-glow', hexToRgba(value, 0.4));
        if (variable === '--neon-yellow') document.documentElement.style.setProperty('--neon-yellow-glow', hexToRgba(value, 0.4));
        if (variable === '--neon-red') document.documentElement.style.setProperty('--neon-red-glow', hexToRgba(value, 0.4));
      });
    }`;

const newColorLogic = `    // 1. Colores
    if (styles.colors) {
      currentColors = { ...styles.colors };
      
      let varsStyleEl = document.getElementById('theme-vars-style');
      if (!varsStyleEl) {
        varsStyleEl = document.createElement('style');
        varsStyleEl.id = 'theme-vars-style';
        document.head.appendChild(varsStyleEl);
      }
      
      let cssVars = 'body.is-client-page {\\n';
      Object.entries(styles.colors).forEach(([variable, value]) => {
        if (!value) return;
        cssVars += \`  \${variable}: \${value} !important;\\n\`;
        if (variable === '--neon-purple') cssVars += \`  --neon-purple-glow: \${hexToRgba(value, 0.5)} !important;\\n\`;
        if (variable === '--neon-pink') cssVars += \`  --neon-pink-glow: \${hexToRgba(value, 0.5)} !important;\\n\`;
        if (variable === '--neon-cyan') cssVars += \`  --neon-cyan-glow: \${hexToRgba(value, 0.4)} !important;\\n\`;
        if (variable === '--neon-yellow') cssVars += \`  --neon-yellow-glow: \${hexToRgba(value, 0.4)} !important;\\n\`;
        if (variable === '--neon-red') cssVars += \`  --neon-red-glow: \${hexToRgba(value, 0.4)} !important;\\n\`;
      });
      cssVars += '}';
      varsStyleEl.textContent = cssVars;
    }`;

if (themeJs.includes('document.documentElement.style.setProperty(variable, value);')) {
  themeJs = themeJs.replace(oldColorLogic, newColorLogic);
  fs.writeFileSync('theme-manager.js', themeJs);
  console.log('Patched theme-manager.js colors scope');
}

// --- 2. Fix Grid Spacing in admin/index.html ---
let adminHtml = fs.readFileSync('admin/index.html', 'utf8');
if (adminHtml.includes('minmax(250px, 1fr)')) {
  adminHtml = adminHtml.replace(/minmax\(250px, 1fr\)/g, 'minmax(320px, 1fr)');
  // Also bump the theme-manager.js version cache
  adminHtml = adminHtml.replace(/theme-manager\.js\?v=\d+/, 'theme-manager.js?v=' + Date.now());
  fs.writeFileSync('admin/index.html', adminHtml);
  console.log('Patched admin/index.html grid and cache');
}

// Also bump index.html cache
let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(/theme-manager\.js\?v=\d+/, 'theme-manager.js?v=' + Date.now());
fs.writeFileSync('index.html', indexHtml);
console.log('Patched index.html cache');
