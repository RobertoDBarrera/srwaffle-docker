const fs = require('fs');
let html = fs.readFileSync('admin/index.html', 'utf8');
const viewPanelStr = `
    <!-- ================= VISTA: TEMAS (GALERIA) ================= -->
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
  html = html.replace('<!-- ================= VISTA 7: COMPANY DETAILS ================= -->', viewPanelStr + '\n    <!-- ================= VISTA 7: COMPANY DETAILS ================= -->');
  fs.writeFileSync('admin/index.html', html);
  console.log('Fixed admin-view-themes missing panel.');
} else {
  console.log('Panel already exists.');
}
