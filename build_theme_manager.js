const fs = require('fs');

const content = `// Gestor de Temas y Módulo de Desarrollo en Tiempo Real - Sr. Waffle
(function () {
  let customPresets = [];
  
  // --- ESTRUCTURA DEL TEMA ---
  let currentColors = {};
  let currentTypography = ''; // Puede ser url de google fonts o archivo local
  let currentBgImage = ''; // URL o archivo local
  let currentTexts = { title: '', banner: '' };
  let currentLayout = { buttonShape: 'rounded', shadows: 'soft' };
  let currentCustomCss = '';

  const COLOR_VARIABLES = [
    { varName: '--bg-primary', label: 'Fondo Principal' },
    { varName: '--bg-secondary', label: 'Fondo Secundario' },
    { varName: '--bg-tertiary', label: 'Fondo Terciario' },
    { varName: '--bg-card-raw', label: 'Fondo Tarjetas' },
    { varName: '--bg-header-raw', label: 'Fondo Banner' },
    { varName: '--bg-footer', label: 'Fondo Footer' },
    { varName: '--neon-purple', label: 'Púrpura Neón' },
    { varName: '--neon-pink', label: 'Rosa Neón' },
    { varName: '--neon-cyan', label: 'Cian Neón' },
    { varName: '--neon-yellow', label: 'Amarillo Neón' },
    { varName: '--neon-red', label: 'Rojo Neón' },
    { varName: '--text-primary', label: 'Texto Principal' },
    { varName: '--text-secondary', label: 'Texto Secundario' }
  ];

  const PRESETS = {
    cyberpunk: {
      name: 'Cyberpunk 🌐',
      styles: {
        colors: {
          '--bg-primary': '#121212',
          '--bg-secondary': '#1a1a1a',
          '--bg-tertiary': '#242424',
          '--bg-card-raw': '#1e1e1e',
          '--bg-header-raw': '#121212',
          '--bg-footer': '#0c0c0c',
          '--neon-purple': '#9d4edd',
          '--neon-pink': '#ff007f',
          '--neon-cyan': '#00f5d4',
          '--neon-yellow': '#fee440',
          '--neon-red': '#ff3333',
          '--text-primary': '#ffffff',
          '--text-secondary': '#cccccc'
        },
        layout: { buttonShape: 'rounded', shadows: 'neon' }
      }
    },
    sunset: {
      name: 'Retro Sunset 🌅',
      styles: {
        colors: {
          '--bg-primary': '#1a0826',
          '--bg-secondary': '#2e0f3d',
          '--bg-tertiary': '#441459',
          '--bg-card-raw': '#2e0f3d',
          '--bg-header-raw': '#1a0826',
          '--bg-footer': '#100518',
          '--neon-purple': '#f72585',
          '--neon-pink': '#b5179e',
          '--neon-cyan': '#4cc9f0',
          '--neon-yellow': '#ffbe0b',
          '--neon-red': '#ff006e',
          '--text-primary': '#ffffff',
          '--text-secondary': '#ffd0ec'
        },
        layout: { buttonShape: 'rounded', shadows: 'neon' }
      }
    }
  };

  function hexToRgba(hex, alpha) {
    if (!hex || hex[0] !== '#') return \`rgba(255, 255, 255, \${alpha})\`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return \`rgba(\${r}, \${g}, \${b}, \${alpha})\`;
  }

  function showToast(message, isError = false) {
    let toastEl = document.getElementById('toast');
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'toast';
      toastEl.className = 'toast-notification';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.className = 'toast-notification';
    if (isError) toastEl.classList.add('error');
    toastEl.classList.add('active');
    setTimeout(() => toastEl.classList.remove('active'), 3000);
  }

  function applyThemeStyles(styles) {
    if (!styles) return;
    
    // 1. Colores
    if (styles.colors) {
      currentColors = { ...styles.colors };
      Object.entries(styles.colors).forEach(([variable, value]) => {
        if (!value) return;
        document.documentElement.style.setProperty(variable, value);
        if (variable === '--neon-purple') document.documentElement.style.setProperty('--neon-purple-glow', hexToRgba(value, 0.5));
        if (variable === '--neon-pink') document.documentElement.style.setProperty('--neon-pink-glow', hexToRgba(value, 0.5));
        if (variable === '--neon-cyan') document.documentElement.style.setProperty('--neon-cyan-glow', hexToRgba(value, 0.4));
        if (variable === '--neon-yellow') document.documentElement.style.setProperty('--neon-yellow-glow', hexToRgba(value, 0.4));
        if (variable === '--neon-red') document.documentElement.style.setProperty('--neon-red-glow', hexToRgba(value, 0.4));
      });
    }

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

    // 3. Textos Públicos (solo aplica en la vista pública)
    if (styles.texts) {
      currentTexts = { ...styles.texts };
      if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        const titleEl = document.querySelector('h1'); // Assuming the main title
        if (titleEl && styles.texts.title) titleEl.innerText = styles.texts.title;
        // Handle banner if present
      }
    }

    // 4. Tipografía
    if (styles.typography !== undefined) {
      currentTypography = styles.typography;
      let fontStyleEl = document.getElementById('theme-font-style');
      if (!fontStyleEl) {
        fontStyleEl = document.createElement('style');
        fontStyleEl.id = 'theme-font-style';
        document.head.appendChild(fontStyleEl);
      }
      
      if (styles.typography) {
        // Asume archivo subido
        fontStyleEl.textContent = \`
          @font-face {
            font-family: 'ThemeCustomFont';
            src: url('\${styles.typography}');
          }
          :root { --font-family-primary: 'ThemeCustomFont', sans-serif; }
          body, input, select, button, textarea { font-family: var(--font-family-primary) !important; }
        \`;
      } else {
        fontStyleEl.textContent = \`
          :root { --font-family-primary: 'Outfit', sans-serif; }
          body, input, select, button, textarea { font-family: var(--font-family-primary) !important; }
        \`;
      }
    }

    // 5. Layout (Clases en el body)
    if (styles.layout) {
      currentLayout = { ...styles.layout };
      document.body.classList.remove('btn-shape-rounded', 'btn-shape-square', 'btn-shape-pill');
      document.body.classList.remove('shadows-neon', 'shadows-soft', 'shadows-none');
      
      if (styles.layout.buttonShape) document.body.classList.add(\`btn-shape-\${styles.layout.buttonShape}\`);
      if (styles.layout.shadows) document.body.classList.add(\`shadows-\${styles.layout.shadows}\`);
      
      let layoutStyleEl = document.getElementById('theme-layout-style');
      if (!layoutStyleEl) {
        layoutStyleEl = document.createElement('style');
        layoutStyleEl.id = 'theme-layout-style';
        document.head.appendChild(layoutStyleEl);
      }
      // Inject CSS para las clases de layout si es necesario
      layoutStyleEl.textContent = \`
        body.btn-shape-square button, body.btn-shape-square .btn-primary, body.btn-shape-square .btn-secondary, body.btn-shape-square .admin-menu-item { border-radius: 0 !important; }
        body.btn-shape-pill button, body.btn-shape-pill .btn-primary, body.btn-shape-pill .btn-secondary, body.btn-shape-pill .admin-menu-item { border-radius: 50px !important; }
        body.shadows-none * { box-shadow: none !important; text-shadow: none !important; }
        body.shadows-soft .btn-primary, body.shadows-soft .admin-view-panel { box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important; }
      \`;
    }

    // 6. CSS Personalizado
    if (styles.customCss !== undefined) {
      currentCustomCss = styles.customCss;
      let customStyleEl = document.getElementById('theme-custom-style');
      if (!customStyleEl) {
        customStyleEl = document.createElement('style');
        customStyleEl.id = 'theme-custom-style';
        document.head.appendChild(customStyleEl);
      }
      customStyleEl.textContent = styles.customCss;
    }
  }

  async function init() {
    const computedStyles = getComputedStyle(document.documentElement);
    COLOR_VARIABLES.forEach(v => {
      const computedValue = computedStyles.getPropertyValue(v.varName).trim();
      currentColors[v.varName] = computedValue || '#ffffff';
    });

    try {
      const res = await fetch('/api/developer/settings');
      if (!res.ok) throw new Error('API unreachable');
      const data = await res.json();

      if (data) customPresets = data.customPresets || [];

      // Aplicar estilos persistidos si existen (activeTheme vs themeColors)
      if (data && data.activeTheme) {
        applyThemeStyles(data.activeTheme);
      } else if (data && data.themeColors) {
        // Fallback for old configs
        applyThemeStyles({ colors: data.themeColors });
      }

      if (data && data.developerMode) injectDeveloperWidget();
    } catch (err) {
      console.warn('Advertencia: No se pudo cargar la configuración de tema desde el servidor.', err);
    }
  }

  function injectDeveloperWidget() {
    if (document.getElementById('dev-customizer-container')) return;

    const styleEl = document.createElement('style');
    styleEl.textContent = \`
      .dev-widget-fab { position: fixed; bottom: 25px; right: 25px; width: 55px; height: 55px; border-radius: 50%; background: rgba(18, 18, 18, 0.85); backdrop-filter: blur(10px); border: 1px solid var(--neon-purple, #9d4edd); box-shadow: 0 0 15px var(--neon-purple-glow, rgba(157, 78, 221, 0.5)); color: #fff; font-size: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 999999; transition: all 0.3s; }
      .dev-widget-fab:hover { transform: scale(1.1) rotate(15deg); box-shadow: 0 0 25px var(--neon-purple, #9d4edd); }
      .dev-widget-panel { position: fixed; bottom: 95px; right: 25px; width: 380px; max-height: calc(100vh - 140px); background: rgba(18, 18, 18, 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6); z-index: 999999; display: flex; flex-direction: column; overflow: hidden; transition: all 0.4s; transform: scale(0.9) translateY(20px); opacity: 0; pointer-events: none; }
      .dev-widget-panel.active { transform: scale(1) translateY(0); opacity: 1; pointer-events: auto; }
      .dev-panel-header { padding: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.2); }
      .dev-panel-header h3 { font-size: 1.15rem; color: var(--neon-purple, #9d4edd); margin: 0; }
      .dev-panel-close { background: transparent; border: none; color: #ccc; cursor: pointer; font-size: 18px; }
      .dev-panel-body { padding: 15px; overflow-y: auto; flex-grow: 1; display: flex; flex-direction: column; gap: 15px; }
      .dev-section-title { font-size: 0.85rem; font-weight: bold; color: var(--neon-cyan); border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px; margin-bottom: 5px; }
      .dev-color-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
      .dev-color-row label { font-size: 0.82rem; color: #ccc; font-weight: 600; }
      .dev-color-hex { font-family: monospace; font-size: 0.72rem; color: #ccc; background: rgba(255,255,255,0.03); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05); width: 65px; text-align: center; margin-right: 8px;}
      .dev-color-input { -webkit-appearance: none; width: 28px; height: 28px; background: transparent; border: none; cursor: pointer; }
      .dev-input { width: 100%; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; padding: 6px 10px; color: #fff; font-size: 0.82rem; margin-top: 5px; }
      .dev-textarea { width: 100%; height: 80px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; padding: 6px 10px; color: #fff; font-size: 0.82rem; font-family: monospace; margin-top: 5px; resize: vertical; }
      .dev-select { width: 100%; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; padding: 6px 10px; color: #fff; font-size: 0.82rem; margin-top: 5px; }
      .dev-select option { background: #121212; color: #fff; }
      .dev-file-upload { display: flex; gap: 10px; align-items: center; margin-top: 5px; }
      .dev-file-btn { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; }
      .dev-file-name { font-size: 0.75rem; color: #aaa; flex-grow: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dev-panel-footer { padding: 15px; border-top: 1px solid rgba(255, 255, 255, 0.05); display: flex; gap: 10px; background: rgba(0, 0, 0, 0.1); }
      .dev-btn-save { flex: 2; background: linear-gradient(135deg, var(--neon-purple, #9d4edd) 0%, #7b2cbf 100%); border: none; color: #fff; padding: 8px; border-radius: 6px; font-weight: 700; cursor: pointer; }
      .dev-btn-reset { flex: 1; background: transparent; border: 1px solid var(--neon-pink, #ff007f); color: var(--neon-pink, #ff007f); padding: 8px; border-radius: 6px; font-weight: 700; cursor: pointer; }
    \`;
    document.head.appendChild(styleEl);

    const container = document.createElement('div');
    container.id = 'dev-customizer-container';
    container.innerHTML = \`
      <button class="dev-widget-fab" title="Abrir Theme Builder">🎨</button>
      <div class="dev-widget-panel">
        <div class="dev-panel-header">
          <h3>Theme Builder</h3>
          <button class="dev-panel-close">&times;</button>
        </div>
        <div class="dev-panel-body">
          <div class="dev-section-title">Colores</div>
          <div id="dev-colors-container"></div>
          
          <div class="dev-section-title">Tipografía (Subir Fuente)</div>
          <div class="dev-file-upload">
            <input type="file" id="dev-font-file" accept=".ttf,.woff,.woff2" style="display:none;">
            <button class="dev-file-btn" onclick="document.getElementById('dev-font-file').click()">Elegir Fuente</button>
            <span class="dev-file-name" id="dev-font-name">Ninguna seleccionada</span>
          </div>

          <div class="dev-section-title">Fondo Global</div>
          <div class="dev-file-upload">
            <input type="file" id="dev-bg-file" accept="image/*" style="display:none;">
            <button class="dev-file-btn" onclick="document.getElementById('dev-bg-file').click()">Elegir Imagen</button>
            <span class="dev-file-name" id="dev-bg-name">Ninguna seleccionada</span>
          </div>

          <div class="dev-section-title">Estructura (Layout)</div>
          <label style="font-size: 0.8rem; color:#ccc;">Forma de Botones:</label>
          <select id="dev-layout-buttons" class="dev-select">
            <option value="rounded">Redondeados (Defecto)</option>
            <option value="square">Cuadrados</option>
            <option value="pill">Píldora</option>
          </select>
          <label style="font-size: 0.8rem; color:#ccc; margin-top:5px; display:block;">Estilo de Sombras:</label>
          <select id="dev-layout-shadows" class="dev-select">
            <option value="soft">Suaves</option>
            <option value="neon">Neón (Cyberpunk)</option>
            <option value="none">Sin Sombras (Plano)</option>
          </select>

          <div class="dev-section-title">Textos Públicos</div>
          <input type="text" id="dev-text-title" class="dev-input" placeholder="Título principal (Ej. Sr. Waffle)">
          <input type="text" id="dev-text-banner" class="dev-input" placeholder="Texto de Banner promocional">

          <div class="dev-section-title">CSS Personalizado Avanzado</div>
          <textarea id="dev-custom-css" class="dev-textarea" placeholder="body { ... }"></textarea>

          <div class="dev-section-title" style="margin-top:10px;">Guardar como Preset</div>
          <div style="display:flex; gap:10px;">
            <input type="text" id="dev-preset-name" class="dev-input" placeholder="Nombre del tema..." style="margin:0;">
            <button class="dev-file-btn" id="dev-save-preset-btn" style="border-color:var(--neon-cyan); color:var(--neon-cyan);">Guardar 💾</button>
          </div>
        </div>
        <div class="dev-panel-footer">
          <button class="dev-btn-reset" type="button">Reset</button>
          <button class="dev-btn-save" type="button">Aplicar Tema Global</button>
        </div>
      </div>
    \`;
    document.body.appendChild(container);

    // Poblar colores
    const colorsContainer = document.getElementById('dev-colors-container');
    COLOR_VARIABLES.forEach(v => {
      const curVal = currentColors[v.varName] || '#ffffff';
      const row = document.createElement('div');
      row.className = 'dev-color-row';
      row.innerHTML = \`
        <label>\${v.label}</label>
        <div style="display:flex; align-items:center;">
          <span class="dev-color-hex" id="hex-\${v.varName}">\${curVal}</span>
          <input type="color" class="dev-color-input" data-var="\${v.varName}" value="\${curVal}">
        </div>
      \`;
      colorsContainer.appendChild(row);
    });

    // Populate existing values
    if (currentLayout.buttonShape) document.getElementById('dev-layout-buttons').value = currentLayout.buttonShape;
    if (currentLayout.shadows) document.getElementById('dev-layout-shadows').value = currentLayout.shadows;
    document.getElementById('dev-text-title').value = currentTexts.title || '';
    document.getElementById('dev-text-banner').value = currentTexts.banner || '';
    document.getElementById('dev-custom-css').value = currentCustomCss || '';
    if (currentTypography) document.getElementById('dev-font-name').textContent = "Fuente cargada";
    if (currentBgImage) document.getElementById('dev-bg-name').textContent = "Imagen cargada";

    // Lógica de Eventos
    document.querySelector('.dev-widget-fab').onclick = () => document.querySelector('.dev-widget-panel').classList.add('active');
    document.querySelector('.dev-panel-close').onclick = () => document.querySelector('.dev-widget-panel').classList.remove('active');

    // Cambios de color en tiempo real
    document.querySelectorAll('.dev-color-input').forEach(inp => {
      inp.oninput = (e) => {
        const vName = e.target.getAttribute('data-var');
        document.getElementById(\`hex-\${vName}\`).textContent = e.target.value;
        currentColors[vName] = e.target.value;
        applyThemeStyles({ colors: currentColors });
      };
    });

    // Cambios de layout en tiempo real
    document.getElementById('dev-layout-buttons').onchange = (e) => {
      currentLayout.buttonShape = e.target.value;
      applyThemeStyles({ layout: currentLayout });
    };
    document.getElementById('dev-layout-shadows').onchange = (e) => {
      currentLayout.shadows = e.target.value;
      applyThemeStyles({ layout: currentLayout });
    };

    // Cambios de CSS en tiempo real
    document.getElementById('dev-custom-css').oninput = (e) => {
      currentCustomCss = e.target.value;
      applyThemeStyles({ customCss: currentCustomCss });
    };

    // Subida de Archivos
    const uploadFile = async (file) => {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const res = await fetch('/api/developer/upload-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fileName: file.name, data: e.target.result })
            });
            const data = await res.json();
            if (data.success) resolve('/' + data.fileName);
            else reject(data.error);
          } catch (err) { reject(err); }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    document.getElementById('dev-font-file').onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      document.getElementById('dev-font-name').textContent = 'Subiendo...';
      try {
        const path = await uploadFile(file);
        currentTypography = path;
        document.getElementById('dev-font-name').textContent = file.name;
        applyThemeStyles({ typography: currentTypography });
        showToast('Fuente aplicada');
      } catch (err) {
        showToast('Error al subir fuente', true);
        document.getElementById('dev-font-name').textContent = 'Error';
      }
    };

    document.getElementById('dev-bg-file').onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      document.getElementById('dev-bg-name').textContent = 'Subiendo...';
      try {
        const path = await uploadFile(file);
        currentBgImage = path;
        document.getElementById('dev-bg-name').textContent = file.name;
        applyThemeStyles({ bgImage: currentBgImage });
        showToast('Fondo aplicado');
      } catch (err) {
        showToast('Error al subir imagen', true);
        document.getElementById('dev-bg-name').textContent = 'Error';
      }
    };

    // Guardar Tema Activo
    document.querySelector('.dev-btn-save').onclick = async () => {
      currentTexts.title = document.getElementById('dev-text-title').value;
      currentTexts.banner = document.getElementById('dev-text-banner').value;
      
      const styles = {
        colors: currentColors,
        typography: currentTypography,
        bgImage: currentBgImage,
        texts: currentTexts,
        layout: currentLayout,
        customCss: currentCustomCss
      };

      try {
        const res = await fetch('/api/developer/theme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activeTheme: styles })
        });
        if (res.ok) {
          showToast('¡Tema global guardado!');
          document.querySelector('.dev-widget-panel').classList.remove('active');
        } else {
          showToast('Error al guardar', true);
        }
      } catch (err) { showToast('Error de red', true); }
    };

    // Guardar Preset
    document.getElementById('dev-save-preset-btn').onclick = async () => {
      const name = document.getElementById('dev-preset-name').value.trim();
      if (!name) {
        showToast('Ingrese un nombre de preset', true);
        return;
      }
      
      currentTexts.title = document.getElementById('dev-text-title').value;
      currentTexts.banner = document.getElementById('dev-text-banner').value;
      
      const styles = {
        colors: currentColors,
        typography: currentTypography,
        bgImage: currentBgImage,
        texts: currentTexts,
        layout: currentLayout,
        customCss: currentCustomCss
      };

      try {
        const res = await fetch('/api/developer/preset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, styles })
        });
        if (res.ok) {
          showToast(\`Preset "\${name}" guardado\`);
          document.getElementById('dev-preset-name').value = '';
        } else {
          showToast('Error al guardar preset', true);
        }
      } catch (err) { showToast('Error de red', true); }
    };

    // Reset
    document.querySelector('.dev-btn-reset').onclick = async () => {
      if (confirm('¿Restaurar valores predeterminados?')) {
        await fetch('/api/developer/theme/reset', { method: 'POST' });
        location.reload();
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`;

fs.writeFileSync('theme-manager.js', content);
console.log('theme-manager.js built successfully');
