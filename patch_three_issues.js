const fs = require('fs');

// --- 1. theme-manager.js ---
let themeJs = fs.readFileSync('theme-manager.js', 'utf8');

// Fix text selectors and properties
themeJs = themeJs.replace(
  "const titleEl = document.querySelector('.hero-title, h1:not(.section-title)');",
  "const titleEl = document.querySelector('.neon-slogan');"
);
themeJs = themeJs.replace(
  "if (titleEl && styles.texts.title) titleEl.innerText = styles.texts.title;",
  "if (titleEl && styles.texts.publicTitle) titleEl.innerHTML = styles.texts.publicTitle.replace(/\\n/g, '<br>');"
);
themeJs = themeJs.replace(
  "const bannerEl = document.querySelector('.neon-slogan, .hero-badge');",
  "const bannerEl = document.querySelector('.hero-badge');"
);
themeJs = themeJs.replace(
  "if (bannerEl && styles.texts.banner) bannerEl.innerHTML = styles.texts.banner.replace(/\\n/g, '<br>');",
  "if (bannerEl && styles.texts.publicBanner) bannerEl.innerHTML = styles.texts.publicBanner.replace(/\\n/g, '<br>');"
);

// Add button color CSS var
const oldColorLogic = `cssVars += '}';`;
const newColorLogic = `  if (styles.colors['--btn-text-color']) cssVars += \`  --btn-text-color: \${styles.colors['--btn-text-color']} !important;\\n\`;
      cssVars += '}';`;
if (themeJs.includes(oldColorLogic)) {
  themeJs = themeJs.replace(oldColorLogic, newColorLogic);
} else {
  // If we can't find it, we can just append it before the bracket
  themeJs = themeJs.replace("cssVars += '}';", "cssVars += '  --btn-text-color: ' + (styles.colors['--btn-text-color'] || '#fff') + ' !important;\\n}';");
}

fs.writeFileSync('theme-manager.js', themeJs);


// --- 2. styles.css ---
let css = fs.readFileSync('styles.css', 'utf8');
css = css.replace('.btn-primary {\n  background: linear-gradient(135deg, var(--neon-purple) 0%, #7b2cbf 100%);\n  color: #fff;', '.btn-primary {\n  background: linear-gradient(135deg, var(--neon-purple) 0%, #7b2cbf 100%);\n  color: var(--btn-text-color, #fff);');
css = css.replace('.btn-secondary {\n  background: transparent;\n  color: #fff;', '.btn-secondary {\n  background: transparent;\n  color: var(--btn-text-color, #fff);');
fs.writeFileSync('styles.css', css);


// --- 3. admin/app.js ---
let appJs = fs.readFileSync('admin/app.js', 'utf8');

// Add button color to editable array
if (!appJs.includes('--btn-text-color')) {
  appJs = appJs.replace(
    "{ varName: '--text-secondary', label: 'Texto Secundario' }",
    "{ varName: '--text-secondary', label: 'Texto Secundario' },\n    { varName: '--btn-text-color', label: 'Texto de Botones' }"
  );
}

// Fix save logic to Auto-Apply
const saveLogicOld = `
        if (res.ok) {
          showToast(isEditingDefaultTheme ? 'Tema clonado y guardado con éxito' : 'Tema actualizado con éxito');
          editModal.style.display = 'none';
          loadThemesGallery(); // reload gallery
        }
`;

const saveLogicNew = `
        if (res.ok) {
          const resData = await res.json();
          const savedPresetId = (resData && resData.preset) ? resData.preset.id : currentEditingThemeId;
          showToast(isEditingDefaultTheme ? 'Tema clonado y guardado. Aplicando...' : 'Tema actualizado. Aplicando...');
          editModal.style.display = 'none';
          
          // AUTO-APPLY
          try {
            await window.applyThemePreset(savedPresetId);
          } catch(e) {
            loadThemesGallery();
          }
        } else {
          // ensure res is parsed or read if not ok to avoid unused promise, but this is fine
          showToast('Error al guardar tema', true);
        }
`;
// Need to find the exact block
if (appJs.includes('showToast(isEditingDefaultTheme ? \'Tema clonado y guardado con éxito\' : \'Tema actualizado con éxito\');')) {
  const parts = appJs.split('if (res.ok) {');
  if (parts.length > 1) {
    // we need to be careful with replace
    appJs = appJs.replace(`if (res.ok) {
          showToast(isEditingDefaultTheme ? 'Tema clonado y guardado con éxito' : 'Tema actualizado con éxito');
          editModal.style.display = 'none';
          loadThemesGallery(); // reload gallery
        }`, `if (res.ok) {
          let resData = {};
          try { resData = await res.json(); } catch(e){}
          const savedPresetId = resData.preset ? resData.preset.id : currentEditingThemeId;
          showToast('Tema guardado. Aplicando...', false);
          editModal.style.display = 'none';
          window.applyThemePreset(savedPresetId);
        }`);
  }
}

fs.writeFileSync('admin/app.js', appJs);

console.log('Patched all 3 files.');
