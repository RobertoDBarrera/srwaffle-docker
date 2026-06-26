const fs = require('fs');

let appJs = fs.readFileSync('admin/app.js', 'utf8');

// 1. Add the delete button
const oldButtons = `<button class="btn-secondary" style="flex:1;" onclick="window.editThemePreset('\${preset.id}')">\${preset.id.startsWith('default_') ? 'Clonar' : 'Editar'}</button>
                <button class="btn-primary" style="flex:1;" onclick="window.applyThemePreset('\${preset.id}')">Activar</button>`;

const newButtons = `<button class="btn-secondary" style="flex:1;" onclick="window.editThemePreset('\${preset.id}')">\${preset.id.startsWith('default_') ? 'Clonar' : 'Editar'}</button>
                <button class="btn-primary" style="flex:1;" onclick="window.applyThemePreset('\${preset.id}')">Activar</button>
                \${!preset.id.startsWith('default_') ? \`<button class="btn-secondary" style="background:rgba(220,53,69,0.2); border-color:#dc3545; padding: 0.9rem 1rem;" onclick="window.deleteThemePreset('\${preset.id}')">🗑️</button>\` : ''}`;

if (appJs.includes(oldButtons)) {
  appJs = appJs.replace(oldButtons, newButtons);
}

// 2. Add window.deleteThemePreset
const deleteLogic = `
  window.deleteThemePreset = async (presetId) => {
    if (!confirm('¿Estás seguro de que quieres borrar este tema personalizado?')) return;
    try {
      const res = await fetch(\`/api/developer/preset/\${presetId}\`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Tema borrado con éxito');
        loadThemesGallery();
      } else {
        showToast('Error al borrar', true);
      }
    } catch(e) {
      console.error(e);
      showToast('Error de red', true);
    }
  };
`;

if (!appJs.includes('window.deleteThemePreset')) {
  // Append inside DOMContentLoaded, e.g. after applyThemePreset
  const target = `  window.applyThemePreset = async (presetId) => {`;
  appJs = appJs.replace(target, deleteLogic + '\n' + target);
}

fs.writeFileSync('admin/app.js', appJs);

// Bump cache
let adminHtml = fs.readFileSync('admin/index.html', 'utf8');
adminHtml = adminHtml.replace(/app\.js\?v=\d+/, 'app.js?v=' + Date.now());
fs.writeFileSync('admin/index.html', adminHtml);

console.log('Added delete button');
