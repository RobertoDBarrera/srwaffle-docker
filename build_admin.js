const fs = require('fs');

let html = fs.readFileSync('admin/index.html', 'utf8');

// Insert sidebar button
const sidebarBtnStr = `
      <div class="admin-menu-item" data-admin-view="themes">
        <span class="icon">🎨</span>
        <span>Temas</span>
      </div>`;
if (!html.includes('data-admin-view="themes"')) {
  html = html.replace(
    '<div class="admin-menu-item" data-admin-view="developer">',
    `${sidebarBtnStr}\n      <div class="admin-menu-item" data-admin-view="developer">`
  );
}

// Insert view panel
const viewPanelStr = `
    <!-- VISTA: TEMAS (GALERIA) -->
    <div class="admin-view-panel" id="admin-view-themes" style="display: none;">
      <div class="header-actions">
        <h2>Galería de Temas 🎨</h2>
        <p style="color:var(--text-secondary); margin-top:5px; font-size:0.9rem;">Selecciona un tema para aplicarlo a toda la aplicación. Usa el Módulo Dev para crear nuevos temas.</p>
      </div>

      <div style="margin-top: 2rem;">
        <h3 style="margin-bottom: 1rem; color: var(--neon-cyan);">Temas Predeterminados</h3>
        <div id="themes-default-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem;">
          <!-- Tarjetas generadas por JS -->
        </div>
      </div>

      <div style="margin-top: 3rem;">
        <h3 style="margin-bottom: 1rem; color: var(--neon-purple);">Mis Temas Guardados</h3>
        <div id="themes-custom-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem;">
          <!-- Tarjetas generadas por JS -->
        </div>
      </div>
    </div>
`;

if (!html.includes('id="admin-view-themes"')) {
  html = html.replace(
    '<!-- VISTA: CONFIGURACION DE EMPRESA -->',
    `${viewPanelStr}\n    <!-- VISTA: CONFIGURACION DE EMPRESA -->`
  );
}

fs.writeFileSync('admin/index.html', html);
console.log('admin/index.html updated successfully');
