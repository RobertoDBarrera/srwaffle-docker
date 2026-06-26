const fs = require('fs');

let themeCode = fs.readFileSync('theme-manager.js', 'utf8');

const newPreset = `
    argentina: {
      name: 'Argentina Mundial ⭐⭐⭐',
      styles: {
        colors: {
          '--bg-primary': '#ffffff',
          '--bg-secondary': '#e6f2ff',
          '--bg-tertiary': '#cce6ff',
          '--bg-card-raw': '#ffffff',
          '--bg-header-raw': '#74acdf',
          '--bg-footer': '#ffffff',
          '--neon-purple': '#74acdf',
          '--neon-pink': '#f6b40e',
          '--neon-cyan': '#1a1a1a',
          '--neon-yellow': '#d4af37',
          '--neon-red': '#e63946',
          '--text-primary': '#1a1a1a',
          '--text-secondary': '#4a4a4a'
        },
        layout: { buttonShape: 'pill', shadows: 'soft', menuPos: 'top' },
        texts: {
          publicTitle: '¡Vamos Argentina! ⭐️⭐️⭐️',
          publicBanner: 'Disfrutá tu waffle como un Campeón del Mundo 🏆'
        },
        customCss: \`
body.is-client-page {
  background: linear-gradient(135deg, rgba(116, 172, 223, 0.1) 0%, #ffffff 50%, rgba(116, 172, 223, 0.1) 100%);
}
body.is-client-page header {
  border-bottom: 3px solid #f6b40e;
}
body.is-client-page .hero-title {
  color: #74acdf;
  text-shadow: 2px 2px 0px #1a1a1a, 4px 4px 0px #f6b40e;
  font-weight: 900;
  text-transform: uppercase;
}
body.is-client-page .neon-slogan {
  background-color: #f6b40e;
  color: #1a1a1a;
  border-radius: 20px;
  padding: 5px 15px;
  font-weight: bold;
}
body.is-client-page .waffle-card {
  border: 2px solid #74acdf;
}
        \`
      }
    },`;

if (!themeCode.includes('Argentina Mundial')) {
  themeCode = themeCode.replace(
    'const PRESETS = {',
    'const PRESETS = {' + newPreset
  );
  fs.writeFileSync('theme-manager.js', themeCode);
  console.log('Patched theme-manager.js with Argentina theme');
} else {
  console.log('Already patched');
}
