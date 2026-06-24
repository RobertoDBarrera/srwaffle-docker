const fs = require('fs');
let code = fs.readFileSync('theme-manager.js', 'utf8');

// Scoping bgImage
const oldBgLogic = `
    // 2. Imagen de Fondo
    if (styles.bgImage !== undefined) {
      currentBgImage = styles.bgImage;
      if (styles.bgImage) {
        document.body.style.backgroundImage = \`url('\${styles.bgImage}')\`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
      } else {
        document.body.style.backgroundImage = 'none';
      }
    }
`;
const newBgLogic = `
    // 2. Imagen de Fondo (solo en vista pública)
    if (styles.bgImage !== undefined) {
      currentBgImage = styles.bgImage;
      if (styles.bgImage && (window.location.pathname === '/' || window.location.pathname === '/index.html')) {
        document.body.style.backgroundImage = \`url('\${styles.bgImage}')\`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
      } else {
        document.body.style.backgroundImage = 'none';
      }
    }
`;
if (code.includes('if (styles.bgImage) {') && !code.includes('window.location.pathname === \'/\'')) {
    code = code.replace(oldBgLogic, newBgLogic);
} else {
    // try looser replace
    code = code.replace(
      `if (styles.bgImage) {\n        document.body.style.backgroundImage = \`url('\${styles.bgImage}')\`;`,
      `if (styles.bgImage && (window.location.pathname === '/' || window.location.pathname === '/index.html')) {\n        document.body.style.backgroundImage = \`url('\${styles.bgImage}')\`;`
    );
}

// Scoping menu layout CSS
const oldCss = `        /* Opciones de Menu Layout */
        body.menu-pos-top .admin-container { flex-direction: column !important; }
        body.menu-pos-top .admin-sidebar { width: 100% !important; height: auto !important; flex-direction: row !important; flex-wrap: wrap !important; }
        body.menu-pos-top .admin-sidebar .admin-menu-item { padding: 10px 15px !important; margin-bottom: 0 !important; }
        body.menu-pos-hidden .admin-sidebar { display: none !important; }
        body.menu-pos-hidden .navbar { display: none !important; }
        body.menu-pos-hidden .desktop-menu { display: none !important; }
        body.menu-pos-top .desktop-menu { flex-direction: row !important; }`;

const newCss = `        /* Opciones de Menu Layout para Cliente */
        body.is-client-page.menu-pos-sidebar header { width: 250px !important; height: 100vh !important; position: fixed !important; flex-direction: column !important; top: 0 !important; left: 0 !important; align-items: center; padding-top: 2rem; border-right: 1px solid rgba(255,255,255,0.1); border-bottom: none !important; z-index: 1000; }
        body.is-client-page.menu-pos-sidebar nav { flex-direction: column !important; margin-top: 2rem; width: 100%; align-items: center; gap: 1.5rem; }
        body.is-client-page.menu-pos-sidebar main, body.is-client-page.menu-pos-sidebar section.app-view { margin-left: 250px !important; width: calc(100% - 250px) !important; padding-left: 2rem; }
        body.is-client-page.menu-pos-hidden nav { display: none !important; }`;

if (code.includes(oldCss)) {
    code = code.replace(oldCss, newCss);
}

// Add is-client-page class
if (!code.includes("document.body.classList.add('is-client-page');")) {
  code = code.replace(
    "const init = () => {",
    "const init = () => {\n    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {\n      document.body.classList.add('is-client-page');\n    }"
  );
}

fs.writeFileSync('theme-manager.js', code);
console.log('theme-manager.js fixed for client scope');
