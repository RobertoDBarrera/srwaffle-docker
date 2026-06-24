const fs = require('fs');
let code = fs.readFileSync('theme-manager.js', 'utf8');

const oldCss = `body.is-client-page.menu-pos-sidebar header { width: 250px !important; height: 100vh !important; position: fixed !important; flex-direction: column !important; top: 0 !important; left: 0 !important; align-items: center; padding-top: 2rem; border-right: 1px solid rgba(255,255,255,0.1); border-bottom: none !important; z-index: 1000; }`;

const newCss = `body.is-client-page.menu-pos-sidebar header { width: 250px !important; height: 100vh !important; position: fixed !important; flex-direction: column !important; top: 0 !important; left: 0 !important; align-items: center; justify-content: flex-start !important; padding-top: 2rem; border-right: 1px solid rgba(255,255,255,0.1); border-bottom: none !important; z-index: 1000; }`;

if (code.includes(oldCss)) {
  code = code.replace(oldCss, newCss);
  fs.writeFileSync('theme-manager.js', code);
  console.log('Fixed sidebar justify-content');
} else {
  console.log('CSS rule not found');
}
