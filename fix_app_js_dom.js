const fs = require('fs');
let appJs = fs.readFileSync('admin/app.js', 'utf8');

const target = '// --- EDICIÓN DE TEMAS ---';
if (appJs.includes(target) && !appJs.includes('document.addEventListener("DOMContentLoaded", () => {\\n  // --- EDICIÓN DE TEMAS ---')) {
  // Wrap everything from EDICIÓN DE TEMAS to the end in DOMContentLoaded
  const parts = appJs.split(target);
  const before = parts[0];
  const after = parts[1];
  
  const newAppJs = before + 'document.addEventListener("DOMContentLoaded", () => {\n  ' + target + after + '\n});';
  
  // Also we need `window.editThemePreset` to be accessible globally, so it's assigned to window, which is fine inside DOMContentLoaded.
  
  fs.writeFileSync('admin/app.js', newAppJs);
  console.log('Wrapped edit logic in DOMContentLoaded');
} else {
  console.log('Not found or already wrapped');
}
