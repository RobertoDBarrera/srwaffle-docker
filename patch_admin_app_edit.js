const fs = require('fs');
let appJs = fs.readFileSync('admin/app.js', 'utf8');

const editLogic = `
  // --- EDICIÓN DE TEMAS ---
  const COLOR_VARIABLES_ADMIN = [
    { varName: '--bg-primary', label: 'Fondo Principal' },
    { varName: '--bg-secondary', label: 'Fondo Secundario' },
    { varName: '--neon-purple', label: 'Púrpura Neón (Acento Principal)' },
    { varName: '--neon-pink', label: 'Rosa Neón (Acento Secundario)' },
    { varName: '--text-primary', label: 'Texto Principal' }
  ];

  let currentEditingThemeId = null;
  let isEditingDefaultTheme = false;

  const editModal = document.getElementById('theme-edit-modal');
  const colorsContainer = document.getElementById('theme-edit-colors-container');

  if (colorsContainer) {
    COLOR_VARIABLES_ADMIN.forEach(color => {
      const div = document.createElement('div');
      div.className = 'form-group';
      div.innerHTML = \`
        <label>\${color.label}</label>
        <div style="display:flex; gap:10px; align-items:center;">
          <input type="color" id="theme-edit-color-\${color.varName}" style="width:40px; height:40px; border:none; border-radius:4px; cursor:pointer; background:none;">
          <input type="text" id="theme-edit-hex-\${color.varName}" class="form-control" style="flex:1;" placeholder="#000000">
        </div>
      \`;
      colorsContainer.appendChild(div);

      // Sync color and hex inputs
      const colorInput = div.querySelector('input[type="color"]');
      const hexInput = div.querySelector('input[type="text"]');
      colorInput.addEventListener('input', (e) => hexInput.value = e.target.value);
      hexInput.addEventListener('input', (e) => {
        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) colorInput.value = e.target.value;
      });
    });
  }

  window.editThemePreset = async (presetId) => {
    try {
      const res = await fetch('/api/developer/settings');
      const data = await res.json() || {};
      
      let themeData = null;
      isEditingDefaultTheme = false;
      
      if (presetId.startsWith('default_')) {
        const key = presetId.replace('default_', '');
        if (window.SrWafflePresets && window.SrWafflePresets[key]) {
          themeData = JSON.parse(JSON.stringify(window.SrWafflePresets[key]));
          isEditingDefaultTheme = true;
        }
      } else {
        const customPresets = data.customPresets || [];
        themeData = customPresets.find(p => p.id === presetId);
      }
      
      if (!themeData) return showToast('Tema no encontrado para editar', true);

      currentEditingThemeId = presetId;
      document.getElementById('theme-edit-name').value = themeData.name + (isEditingDefaultTheme ? ' (Copia)' : '');
      document.getElementById('theme-edit-menu-pos').value = themeData.styles?.layout?.menuPos || 'sidebar';
      document.getElementById('theme-edit-btn-shape').value = themeData.styles?.layout?.buttonShape || 'rounded';
      document.getElementById('theme-edit-shadows').value = themeData.styles?.layout?.shadows || 'neon';
      
      document.getElementById('theme-edit-text-title').value = themeData.styles?.texts?.publicTitle || '';
      document.getElementById('theme-edit-text-banner').value = themeData.styles?.texts?.publicBanner || '';

      const colors = themeData.styles?.colors || {};
      COLOR_VARIABLES_ADMIN.forEach(color => {
        const val = colors[color.varName] || '#000000';
        document.getElementById(\`theme-edit-color-\${color.varName}\`).value = val;
        document.getElementById(\`theme-edit-hex-\${color.varName}\`).value = val;
      });

      editModal.style.display = 'flex';
    } catch (e) {
      console.error(e);
      showToast('Error al cargar datos del tema', true);
    }
  };

  if (document.getElementById('theme-edit-cancel-btn')) {
    document.getElementById('theme-edit-cancel-btn').addEventListener('click', () => {
      editModal.style.display = 'none';
    });
  }

  if (document.getElementById('theme-edit-save-btn')) {
    document.getElementById('theme-edit-save-btn').addEventListener('click', async () => {
      const name = document.getElementById('theme-edit-name').value;
      if (!name) return showToast('El nombre es obligatorio', true);

      // Collect styles
      const colors = {};
      COLOR_VARIABLES_ADMIN.forEach(color => {
        colors[color.varName] = document.getElementById(\`theme-edit-hex-\${color.varName}\`).value;
      });

      const layout = {
        menuPos: document.getElementById('theme-edit-menu-pos').value,
        buttonShape: document.getElementById('theme-edit-btn-shape').value,
        shadows: document.getElementById('theme-edit-shadows').value
      };

      const texts = {
        publicTitle: document.getElementById('theme-edit-text-title').value,
        publicBanner: document.getElementById('theme-edit-text-banner').value
      };

      const styles = { colors, layout, texts };

      try {
        let endpoint = '/api/developer/preset';
        let method = 'POST';
        
        if (!isEditingDefaultTheme) {
           endpoint = \`/api/developer/preset/\${currentEditingThemeId}\`;
           method = 'PUT';
        }

        const res = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, styles })
        });

        if (res.ok) {
          showToast(isEditingDefaultTheme ? 'Tema clonado y guardado con éxito' : 'Tema actualizado con éxito');
          editModal.style.display = 'none';
          loadThemesGallery(); // reload gallery
        } else {
          showToast('Error al guardar tema', true);
        }
      } catch(e) {
        console.error(e);
        showToast('Error de red', true);
      }
    });
  }
`;

// Modify the renderGrid to add the Edit button
const oldRenderGrid = `
      const renderGrid = (containerId, items) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        items.forEach(preset => {
          const card = document.createElement('div');
          card.style.cssText = 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 1rem; display: flex; flex-direction: column; gap: 1rem;';
          card.innerHTML = \`
            <h4 style="margin: 0; color: #fff;">\${preset.name}</h4>
            <button class="btn-primary" style="margin-top: auto;" onclick="window.applyThemePreset('\${preset.id}')">Activar Tema</button>
          \`;
          container.appendChild(card);
        });
      };`;

const newRenderGrid = `
      const renderGrid = (containerId, items) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        items.forEach(preset => {
          const card = document.createElement('div');
          card.style.cssText = 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 1rem; display: flex; flex-direction: column; gap: 1rem;';
          card.innerHTML = \`
            <h4 style="margin: 0; color: #fff;">\${preset.name}</h4>
            <div style="display:flex; gap: 10px; margin-top: auto;">
              <button class="btn-secondary" style="flex:1;" onclick="window.editThemePreset('\${preset.id}')">Editar</button>
              <button class="btn-primary" style="flex:1;" onclick="window.applyThemePreset('\${preset.id}')">Activar</button>
            </div>
          \`;
          container.appendChild(card);
        });
      };`;

if (!appJs.includes('window.editThemePreset = async')) {
  appJs = appJs.replace(oldRenderGrid, newRenderGrid);
  appJs = appJs + '\n' + editLogic;
  fs.writeFileSync('admin/app.js', appJs);
  console.log('Patched app.js with edit logic');
} else {
  console.log('Already patched');
}
