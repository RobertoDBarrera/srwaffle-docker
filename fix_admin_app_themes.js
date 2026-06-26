const fs = require('fs');

let adminJs = fs.readFileSync('admin/app.js', 'utf8');

const oldGalleryLogic = `  // --- VISTA: GALERÍA DE TEMAS ---
  const loadThemesGallery = async () => {
    try {
      const res = await fetch('/api/developer/settings');
      const data = await res.json() || {};
      
      const customPresets = data.customPresets || [];
      
      const defaultPresets = [
        { id: 'default_cyberpunk', name: 'Cyberpunk 🌐', isDefault: true },
        { id: 'default_sunset', name: 'Retro Sunset 🌅', isDefault: true }
      ];
      
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
      };
      
      renderGrid('themes-default-grid', defaultPresets);
      renderGrid('themes-custom-grid', customPresets);
      
    } catch (e) {
      console.error(e);
      showToast('Error al cargar temas', true);
    }
  };

  window.applyThemePreset = async (presetId) => {
    try {
      const res = await fetch('/api/developer/settings');
      const data = await res.json() || {};
      
      let stylesToApply = null;
      if (presetId.startsWith('default_')) {
        // Fallback for defaults
        if (presetId === 'default_cyberpunk') {
          stylesToApply = { colors: { '--bg-primary': '#121212', '--neon-purple': '#9d4edd', '--neon-pink': '#ff007f', '--neon-cyan': '#00f5d4', '--neon-yellow': '#fee440' }, layout: { buttonShape: 'rounded', shadows: 'neon' } };
        } else if (presetId === 'default_sunset') {
          stylesToApply = { colors: { '--bg-primary': '#1a0826', '--neon-purple': '#f72585', '--neon-pink': '#b5179e', '--neon-cyan': '#4cc9f0', '--neon-yellow': '#ffbe0b' }, layout: { buttonShape: 'rounded', shadows: 'neon' } };
        }
      } else {
        const customPresets = data.customPresets || [];
        const preset = customPresets.find(p => p.id === presetId);
        if (preset && preset.styles) stylesToApply = preset.styles;
      }
      
      if (!stylesToApply) return showToast('Tema no encontrado', true);
      
      // Save as active theme
      const saveRes = await fetch('/api/developer/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeTheme: stylesToApply })
      });
      
      if (saveRes.ok) {
        showToast('Tema activado. Recargando...', false);
        setTimeout(() => location.reload(), 1000);
      } else {
        showToast('Error al guardar tema', true);
      }
    } catch (e) {
      console.error(e);
      showToast('Error de red', true);
    }
  };`;

const newGalleryLogic = `  // --- VISTA: GALERÍA DE TEMAS ---
  const loadThemesGallery = async () => {
    try {
      const res = await fetch('/api/developer/settings');
      const data = await res.json() || {};
      const customPresets = data.customPresets || [];
      
      const defaultPresets = [];
      if (window.SrWafflePresets) {
        for (const key in window.SrWafflePresets) {
          defaultPresets.push({
            id: 'default_' + key,
            name: window.SrWafflePresets[key].name,
            isDefault: true
          });
        }
      }
      
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
      };
      
      renderGrid('themes-default-grid', defaultPresets);
      renderGrid('themes-custom-grid', customPresets);
      
    } catch (e) {
      console.error(e);
      showToast('Error al cargar temas', true);
    }
  };

  window.applyThemePreset = async (presetId) => {
    try {
      const res = await fetch('/api/developer/settings');
      const data = await res.json() || {};
      
      let stylesToApply = null;
      if (presetId.startsWith('default_')) {
        const key = presetId.replace('default_', '');
        if (window.SrWafflePresets && window.SrWafflePresets[key]) {
          stylesToApply = window.SrWafflePresets[key].styles;
        }
      } else {
        const customPresets = data.customPresets || [];
        const preset = customPresets.find(p => p.id === presetId);
        if (preset && preset.styles) stylesToApply = preset.styles;
      }
      
      if (!stylesToApply) return showToast('Tema no encontrado', true);
      
      const saveRes = await fetch('/api/developer/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeTheme: stylesToApply })
      });
      
      if (saveRes.ok) {
        showToast('Tema activado. Recargando...', false);
        setTimeout(() => location.reload(), 1000);
      } else {
        showToast('Error al guardar tema', true);
      }
    } catch (e) {
      console.error(e);
      showToast('Error de red', true);
    }
  };`;

if (adminJs.includes('if (presetId === \'default_cyberpunk\')')) {
  adminJs = adminJs.replace(oldGalleryLogic, newGalleryLogic);
  fs.writeFileSync('admin/app.js', adminJs);
  console.log('Successfully patched admin/app.js for dynamic presets');
} else {
  console.log('Target string not found in admin/app.js');
}
