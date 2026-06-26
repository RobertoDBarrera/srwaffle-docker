const fs = require('fs');
let html = fs.readFileSync('admin/index.html', 'utf8');

const editModalHtml = `
  <!-- ================= MODAL DE EDICIÓN RÁPIDA DE TEMAS ================= -->
  <div class="modal-overlay" id="theme-edit-modal">
    <div class="modal" style="max-width: 600px;">
      <h2 style="color:var(--neon-cyan); margin-bottom:1rem;" id="theme-edit-title">Editar Tema</h2>
      <input type="hidden" id="theme-edit-id">
      
      <div class="form-group">
        <label>Nombre del Tema</label>
        <input type="text" id="theme-edit-name" class="form-control">
      </div>
      
      <h3 style="margin:1.5rem 0 1rem; color:#fff; font-size:1.1rem; border-bottom:1px solid #333; padding-bottom:0.5rem;">Diseño (Layout)</h3>
      <div class="form-group">
        <label>Posición del Menú</label>
        <select id="theme-edit-menu-pos" class="form-control">
          <option value="sidebar">Barra Lateral (Izquierda)</option>
          <option value="top">Barra Superior</option>
          <option value="hidden">Oculto (Botón Desplegable)</option>
        </select>
      </div>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
        <div class="form-group">
          <label>Forma de Botones</label>
          <select id="theme-edit-btn-shape" class="form-control">
            <option value="rounded">Redondeados</option>
            <option value="pill">Píldora</option>
            <option value="square">Cuadrados</option>
          </select>
        </div>
        <div class="form-group">
          <label>Estilo de Sombras</label>
          <select id="theme-edit-shadows" class="form-control">
            <option value="neon">Neón (Brillo)</option>
            <option value="soft">Suave (Elegante)</option>
            <option value="none">Sin sombras</option>
          </select>
        </div>
      </div>

      <h3 style="margin:1.5rem 0 1rem; color:#fff; font-size:1.1rem; border-bottom:1px solid #333; padding-bottom:0.5rem;">Colores Principales</h3>
      <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:15px;" id="theme-edit-colors-container">
        <!-- Los colores se inyectarán con JS -->
      </div>
      
      <h3 style="margin:1.5rem 0 1rem; color:#fff; font-size:1.1rem; border-bottom:1px solid #333; padding-bottom:0.5rem;">Textos (Portada)</h3>
      <div class="form-group">
        <label>Título (Slogan principal)</label>
        <input type="text" id="theme-edit-text-title" class="form-control">
      </div>
      <div class="form-group">
        <label>Banner Animado</label>
        <input type="text" id="theme-edit-text-banner" class="form-control">
      </div>
      
      <div style="display:flex; gap:15px; margin-top:25px;">
        <button class="btn-secondary" id="theme-edit-cancel-btn" style="flex:1; padding: 0.9rem 1rem;">Cancelar</button>
        <button class="btn-primary" id="theme-edit-save-btn" style="flex:1; padding: 0.9rem 1rem;">Guardar Cambios</button>
      </div>
    </div>
  </div>
`;

if (!html.includes('id="theme-edit-modal"')) {
  // Inyectar antes del cierre de body
  html = html.replace('</body>', editModalHtml + '\n</body>');
  fs.writeFileSync('admin/index.html', html);
  console.log('Injected Edit Theme Modal');
} else {
  console.log('Already injected modal');
}
