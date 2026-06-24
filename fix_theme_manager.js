const fs = require('fs');
let code = fs.readFileSync('theme-manager.js', 'utf8');

// 1. Update Layout definition
if (!code.includes("menuPos: 'sidebar'")) {
  code = code.replace(
    `let currentLayout = { buttonShape: 'rounded', shadows: 'soft' };`,
    `let currentLayout = { buttonShape: 'rounded', shadows: 'soft', menuPos: 'sidebar' };`
  );
}

// 2. Update Layout class applying
if (!code.includes("menu-pos-sidebar")) {
  code = code.replace(
    `document.body.classList.remove('btn-shape-rounded', 'btn-shape-square', 'btn-shape-pill');`,
    `document.body.classList.remove('btn-shape-rounded', 'btn-shape-square', 'btn-shape-pill');
      document.body.classList.remove('menu-pos-sidebar', 'menu-pos-top', 'menu-pos-hidden');`
  );
  code = code.replace(
    `if (styles.layout.shadows) document.body.classList.add(\`shadows-\${styles.layout.shadows}\`);`,
    `if (styles.layout.shadows) document.body.classList.add(\`shadows-\${styles.layout.shadows}\`);
      if (styles.layout.menuPos) document.body.classList.add(\`menu-pos-\${styles.layout.menuPos}\`);`
  );
  const menuCss = \`
        /* Opciones de Menu Layout */
        body.menu-pos-top .admin-container { flex-direction: column !important; }
        body.menu-pos-top .admin-sidebar { width: 100% !important; height: auto !important; flex-direction: row !important; flex-wrap: wrap !important; }
        body.menu-pos-top .admin-sidebar .admin-menu-item { padding: 10px 15px !important; margin-bottom: 0 !important; }
        body.menu-pos-hidden .admin-sidebar { display: none !important; }
        body.menu-pos-hidden .navbar { display: none !important; }
        body.menu-pos-hidden .desktop-menu { display: none !important; }
        body.menu-pos-top .desktop-menu { flex-direction: row !important; }
\`;
  code = code.replace(
    `body.shadows-soft .btn-primary, body.shadows-soft .admin-view-panel { box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important; }`,
    `body.shadows-soft .btn-primary, body.shadows-soft .admin-view-panel { box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important; }\${menuCss}`
  );
}

// 3. Update public text selector logic
if (!code.includes("const titleEl = document.querySelector('.hero-title, h1');")) {
  code = code.replace(
    `const titleEl = document.querySelector('h1'); // Assuming the main title`,
    `const titleEl = document.querySelector('.hero-title, h1'); // Target specific classes if any`
  );
}

// 4. Update the Dev panel HTML
// Replace CSS textarea with a button
if (!code.includes("id=\"dev-open-css-btn\"")) {
  code = code.replace(
    `<textarea id="dev-custom-css" class="dev-textarea" placeholder="body { ... }"></textarea>`,
    `<button id="dev-open-css-btn" class="dev-file-btn" style="width:100%; border-color:var(--neon-purple); color:var(--neon-purple);">Abrir Editor de CSS 📝</button>`
  );
  
  // Also inject the CSS modal HTML into the container
  code = code.replace(
    `<div class="dev-widget-panel">`,
    `
      <div id="dev-css-modal" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width:600px; height:450px; background:rgba(15,15,15,0.98); border:1px solid var(--neon-purple); border-radius:12px; z-index:9999999; flex-direction:column; box-shadow: 0 0 30px rgba(0,0,0,0.8);">
        <div style="padding:15px; border-bottom:1px solid rgba(255,255,255,0.1); display:flex; justify-content:space-between; align-items:center;">
          <h3 style="margin:0; color:var(--neon-purple);">Editor de CSS Avanzado</h3>
          <button id="dev-close-css-btn" style="background:none; border:none; color:#fff; cursor:pointer; font-size:20px;">&times;</button>
        </div>
        <textarea id="dev-custom-css" style="flex-grow:1; background:#1e1e1e; color:#d4d4d4; font-family:monospace; padding:15px; border:none; resize:none;" placeholder="/* Escribe tu CSS personalizado aquí */"></textarea>
      </div>
      <div class="dev-widget-panel">`
  );
}

// 5. Add menu select to Dev panel
if (!code.includes("id=\"dev-layout-menu\"")) {
  const menuSelectHtml = \`
          <label style="font-size: 0.8rem; color:#ccc; margin-top:5px; display:block;">Posición del Menú:</label>
          <select id="dev-layout-menu" class="dev-select">
            <option value="sidebar">Lateral Izquierdo (Por defecto)</option>
            <option value="top">Superior Horizontal</option>
            <option value="hidden">Oculto Desplegable</option>
          </select>\`;
  code = code.replace(
    `<option value="none">Sin Sombras (Plano)</option>
          </select>`,
    `<option value="none">Sin Sombras (Plano)</option>
          </select>\${menuSelectHtml}`
  );
}

// 6. Bind Dev panel logic
if (!code.includes("document.getElementById('dev-layout-menu').value")) {
  code = code.replace(
    `if (currentLayout.shadows) document.getElementById('dev-layout-shadows').value = currentLayout.shadows;`,
    `if (currentLayout.shadows) document.getElementById('dev-layout-shadows').value = currentLayout.shadows;
    if (currentLayout.menuPos) document.getElementById('dev-layout-menu').value = currentLayout.menuPos;`
  );
}

if (!code.includes("document.getElementById('dev-layout-menu').onchange")) {
  code = code.replace(
    `document.getElementById('dev-layout-shadows').onchange = (e) => {
      currentLayout.shadows = e.target.value;
      applyThemeStyles({ layout: currentLayout });
    };`,
    `document.getElementById('dev-layout-shadows').onchange = (e) => {
      currentLayout.shadows = e.target.value;
      applyThemeStyles({ layout: currentLayout });
    };
    document.getElementById('dev-layout-menu').onchange = (e) => {
      currentLayout.menuPos = e.target.value;
      applyThemeStyles({ layout: currentLayout });
    };`
  );
}

if (!code.includes("document.getElementById('dev-open-css-btn').onclick")) {
  code = code.replace(
    `document.getElementById('dev-custom-css').oninput = (e) => {`,
    `document.getElementById('dev-open-css-btn').onclick = () => document.getElementById('dev-css-modal').style.display = 'flex';
    document.getElementById('dev-close-css-btn').onclick = () => document.getElementById('dev-css-modal').style.display = 'none';
    
    document.getElementById('dev-custom-css').oninput = (e) => {`
  );
}

fs.writeFileSync('theme-manager.js', code);
console.log('theme-manager.js updated successfully');
