const fs = require('fs');
let code = fs.readFileSync('theme-manager.js', 'utf8');

// Replace public text assignment
const oldTextLogic = `const titleEl = document.querySelector('.hero-title, h1'); // Target specific classes if any
        if (titleEl && styles.texts.title) titleEl.innerText = styles.texts.title;
        // Handle banner if present`;

const newTextLogic = `const titleEl = document.querySelector('.hero-title, h1:not(.section-title)'); // Evitar h1 del admin si lo hubiera
        if (titleEl && styles.texts.title) titleEl.innerText = styles.texts.title;
        const bannerEl = document.querySelector('.neon-slogan, .hero-badge');
        if (bannerEl && styles.texts.banner) bannerEl.innerHTML = styles.texts.banner.replace(/\\n/g, '<br>');`;

if (code.includes(oldTextLogic)) {
  code = code.replace(oldTextLogic, newTextLogic);
  fs.writeFileSync('theme-manager.js', code);
  console.log('theme-manager.js texts updated');
} else if (code.includes('bannerEl')) {
  console.log('theme-manager.js already has bannerEl logic');
} else {
  console.log('Could not find text logic to replace');
}
