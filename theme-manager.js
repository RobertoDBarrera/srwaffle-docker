// Gestor de Temas y Módulo de Desarrollo en Tiempo Real - Sr. Waffle
(function () {
  let customPresets = [];

  // --- VARIABLES Y CONFIGURACIÓN ---
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
      }
    },
    sunset: {
      name: 'Retro Sunset 🌅',
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
      }
    },
    acid: {
      name: 'Acid Lime 🧪',
      colors: {
        '--bg-primary': '#0d131a',
        '--bg-secondary': '#16202c',
        '--bg-tertiary': '#223042',
        '--bg-card-raw': '#16202c',
        '--bg-header-raw': '#0d131a',
        '--bg-footer': '#06090c',
        '--neon-purple': '#390099',
        '--neon-pink': '#ff0054',
        '--neon-cyan': '#70e000',
        '--neon-yellow': '#ffbd00',
        '--neon-red': '#ff5400',
        '--text-primary': '#f0f5fa',
        '--text-secondary': '#a0b2c6'
      }
    },
    ocean: {
      name: 'Cool Ocean ❄️',
      colors: {
        '--bg-primary': '#010c1e',
        '--bg-secondary': '#041735',
        '--bg-tertiary': '#092754',
        '--bg-card-raw': '#041735',
        '--bg-header-raw': '#010c1e',
        '--bg-footer': '#00050d',
        '--neon-purple': '#0077b6',
        '--neon-pink': '#00b4d8',
        '--neon-cyan': '#90e0ef',
        '--neon-yellow': '#ffd166',
        '--neon-red': '#ef476f',
        '--text-primary': '#f0faff',
        '--text-secondary': '#adcbe3'
      }
    }
  };

  // Mapear valores por defecto leídos del documento
  let currentColors = {};

  // --- MÉTODOS DE UTILIDAD ---
  function hexToRgba(hex, alpha) {
    if (!hex || hex[0] !== '#') return `rgba(255, 255, 255, ${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function applyThemeColors(colors) {
    Object.entries(colors).forEach(([variable, value]) => {
      if (!value) return;
      document.documentElement.style.setProperty(variable, value);
      currentColors[variable] = value;

      // Generar resplandores automáticamente
      if (variable === '--neon-purple') {
        document.documentElement.style.setProperty('--neon-purple-glow', hexToRgba(value, 0.5));
      } else if (variable === '--neon-pink') {
        document.documentElement.style.setProperty('--neon-pink-glow', hexToRgba(value, 0.5));
      } else if (variable === '--neon-cyan') {
        document.documentElement.style.setProperty('--neon-cyan-glow', hexToRgba(value, 0.4));
      } else if (variable === '--neon-yellow') {
        document.documentElement.style.setProperty('--neon-yellow-glow', hexToRgba(value, 0.4));
      } else if (variable === '--neon-red') {
        document.documentElement.style.setProperty('--neon-red-glow', hexToRgba(value, 0.4));
      }
    });
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
    setTimeout(() => {
      toastEl.classList.remove('active');
    }, 3000);
  }

  // --- LOGICA DE INICIALIZACION ---
  async function init() {
    // 1. Obtener valores actuales definidos en CSS para fallback
    const computedStyles = getComputedStyle(document.documentElement);
    COLOR_VARIABLES.forEach(v => {
      const computedValue = computedStyles.getPropertyValue(v.varName).trim();
      currentColors[v.varName] = computedValue || '#ffffff';
    });

    try {
      // 2. Cargar configuración desde el backend
      const res = await fetch('/api/developer/settings');
      if (!res.ok) throw new Error('API unreachable');
      const data = await res.json();

      // Guardar presets de usuario
      if (data) {
        customPresets = data.customPresets || [];
      }

      // Aplicar colores persistidos si existen
      if (data && data.themeColors && Object.keys(data.themeColors).length > 0) {
        applyThemeColors(data.themeColors);
      }

      // Si el modo desarrollador está habilitado, inyectar el Widget flotante
      if (data && data.developerMode) {
        injectDeveloperWidget();
      }
    } catch (err) {
      console.warn('Advertencia: No se pudo cargar la configuración de tema desde el servidor.', err);
    }
  }

  // --- INYECCIÓN DEL WIDGET FLOTANTE ---
  function injectDeveloperWidget() {
    // Inyectar estilos para el widget
    const styleId = 'dev-widget-styles';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = `
        .dev-widget-fab {
          position: fixed;
          bottom: 25px;
          right: 25px;
          width: 55px;
          height: 55px;
          border-radius: 50%;
          background: rgba(18, 18, 18, 0.85);
          backdrop-filter: blur(10px);
          border: 1px solid var(--neon-purple, #9d4edd);
          box-shadow: 0 0 15px var(--neon-purple-glow, rgba(157, 78, 221, 0.5));
          color: #fff;
          font-size: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 999999;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dev-widget-fab:hover {
          transform: scale(1.1) rotate(15deg);
          box-shadow: 0 0 25px var(--neon-purple, #9d4edd);
        }
        .dev-widget-panel {
          position: fixed;
          bottom: 95px;
          right: 25px;
          width: 330px;
          max-height: calc(100vh - 140px);
          background: rgba(18, 18, 18, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
          z-index: 999999;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          transform: scale(0.9) translateY(20px);
          opacity: 0;
          pointer-events: none;
        }
        .dev-widget-panel.active {
          transform: scale(1) translateY(0);
          opacity: 1;
          pointer-events: auto;
        }
        .dev-panel-header {
          padding: 15px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(0, 0, 0, 0.2);
        }
        .dev-panel-header h3 {
          font-family: 'Pacifico', cursive, sans-serif;
          font-size: 1.15rem;
          color: var(--neon-purple, #9d4edd);
          text-shadow: 0 0 5px var(--neon-purple-glow, rgba(157, 78, 221, 0.5));
          margin: 0;
        }
        .dev-panel-close {
          background: transparent;
          border: none;
          color: var(--text-secondary, #ccc);
          cursor: pointer;
          font-size: 18px;
          transition: color 0.3s;
        }
        .dev-panel-close:hover {
          color: #fff;
        }
        .dev-panel-body {
          padding: 15px;
          overflow-y: auto;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .dev-color-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .dev-color-row label {
          font-size: 0.82rem;
          color: var(--text-secondary, #ccc);
          font-weight: 600;
          font-family: sans-serif;
        }
        .dev-color-picker-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .dev-color-hex {
          font-family: monospace;
          font-size: 0.72rem;
          color: var(--text-secondary, #ccc);
          background: rgba(255, 255, 255, 0.03);
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          width: 65px;
          text-align: center;
        }
        .dev-color-input {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          width: 28px;
          height: 28px;
          background-color: transparent;
          border: none;
          cursor: pointer;
        }
        .dev-color-input::-webkit-color-swatch {
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
        }
        .dev-color-input::-moz-color-swatch {
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
        }
        .dev-presets-section {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 10px;
        }
        .dev-presets-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary, #ccc);
          text-transform: uppercase;
          margin-bottom: 8px;
          font-family: sans-serif;
        }
        .dev-preset-select-wrapper {
          position: relative;
          width: 100%;
          margin-bottom: 10px;
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .dev-preset-select {
          flex-grow: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 6px 10px;
          color: #fff;
          font-size: 0.82rem;
          font-family: sans-serif;
          outline: none;
          cursor: pointer;
          transition: all 0.3s;
        }
        .dev-preset-select:focus {
          border-color: var(--neon-purple, #9d4edd);
          box-shadow: 0 0 8px var(--neon-purple-glow, rgba(157, 78, 221, 0.3));
        }
        .dev-preset-select option {
          background: #121212;
          color: #fff;
        }
        .dev-btn-delete-preset {
          background: rgba(230, 57, 70, 0.1);
          border: 1px solid #e63946;
          color: #e63946;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          display: none;
          font-family: sans-serif;
        }
        .dev-btn-delete-preset:hover {
          background: rgba(230, 57, 70, 0.2);
          box-shadow: 0 0 10px rgba(230, 57, 70, 0.4);
        }
        .dev-save-preset-wrapper {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 10px;
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .dev-preset-name-input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 6px 10px;
          color: #fff;
          font-size: 0.82rem;
          font-family: sans-serif;
          outline: none;
          transition: all 0.3s;
        }
        .dev-preset-name-input:focus {
          border-color: var(--neon-purple, #9d4edd);
          box-shadow: 0 0 8px var(--neon-purple-glow, rgba(157, 78, 221, 0.3));
        }
        .dev-btn-save-preset {
          background: rgba(0, 245, 212, 0.1);
          border: 1px solid var(--neon-cyan, #00f5d4);
          color: var(--neon-cyan, #00f5d4);
          padding: 6px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          text-align: center;
          font-family: sans-serif;
        }
        .dev-btn-save-preset:hover {
          background: rgba(0, 245, 212, 0.2);
          box-shadow: 0 0 10px var(--neon-cyan-glow, rgba(0, 245, 212, 0.4));
        }
        .dev-panel-footer {
          padding: 15px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          gap: 10px;
          background: rgba(0, 0, 0, 0.1);
        }
        .dev-btn-save {
          flex: 2;
          background: linear-gradient(135deg, var(--neon-purple, #9d4edd) 0%, #7b2cbf 100%);
          border: none;
          color: #fff;
          padding: 8px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 0 10px var(--neon-purple-glow, rgba(157, 78, 221, 0.3));
          font-family: sans-serif;
        }
        .dev-btn-save:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 15px var(--neon-purple, #9d4edd);
        }
        .dev-btn-reset {
          flex: 1.1;
          background: transparent;
          border: 1px solid var(--neon-pink, #ff007f);
          color: var(--neon-pink, #ff007f);
          padding: 8px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          font-family: sans-serif;
        }
        .dev-btn-reset:hover {
          background: rgba(255, 0, 127, 0.05);
          box-shadow: 0 0 10px var(--neon-pink-glow, rgba(255, 0, 127, 0.3));
        }
      `;
      document.head.appendChild(styleEl);
    }

    // Inyectar HTML
    const container = document.createElement('div');
    container.id = 'dev-customizer-container';
    
    // Crear el FAB
    const fab = document.createElement('button');
    fab.className = 'dev-widget-fab';
    fab.innerHTML = '🎨';
    fab.title = 'Abrir Personalizador de Colores';
    
    // Crear el Panel
    const panel = document.createElement('div');
    panel.className = 'dev-widget-panel';
    
    // Header
    const header = document.createElement('div');
    header.className = 'dev-panel-header';
    header.innerHTML = `
      <h3>Estilo Waffle Dev</h3>
      <button class="dev-panel-close">&times;</button>
    `;
    
    // Body (Color selectors)
    const body = document.createElement('div');
    body.className = 'dev-panel-body';
    
    COLOR_VARIABLES.forEach(v => {
      const curVal = currentColors[v.varName] || '#ffffff';
      
      const row = document.createElement('div');
      row.className = 'dev-color-row';
      row.innerHTML = `
        <label>${v.label}</label>
        <div class="dev-color-picker-wrapper">
          <span class="dev-color-hex" id="hex-${v.varName}">${curVal}</span>
          <input type="color" class="dev-color-input" data-var="${v.varName}" value="${curVal}">
        </div>
      `;
      body.appendChild(row);
    });

    // Presets
    const presetsSection = document.createElement('div');
    presetsSection.className = 'dev-presets-section';
    presetsSection.innerHTML = `<div class="dev-presets-title">Presets de Diseños</div>`;
    
    const selectWrapper = document.createElement('div');
    selectWrapper.className = 'dev-preset-select-wrapper';
    
    const select = document.createElement('select');
    select.className = 'dev-preset-select';
    select.id = 'dev-preset-select';
    
    function populatePresetsSelect() {
      select.innerHTML = '';
      const optPlaceholder = document.createElement('option');
      optPlaceholder.value = '';
      optPlaceholder.textContent = '-- Seleccionar Preset --';
      select.appendChild(optPlaceholder);
      
      Object.entries(PRESETS).forEach(([key, preset]) => {
        const opt = document.createElement('option');
        opt.value = `default_${key}`;
        opt.textContent = preset.name;
        select.appendChild(opt);
      });
      
      customPresets.forEach(preset => {
        const opt = document.createElement('option');
        opt.value = `custom_${preset.id}`;
        opt.textContent = `${preset.name} ⭐`;
        select.appendChild(opt);
      });
    }

    populatePresetsSelect();
    
    const deletePresetBtn = document.createElement('button');
    deletePresetBtn.className = 'dev-btn-delete-preset';
    deletePresetBtn.id = 'dev-btn-delete-preset';
    deletePresetBtn.type = 'button';
    deletePresetBtn.textContent = 'Borrar';
    deletePresetBtn.title = 'Eliminar este preset personalizado';
    
    selectWrapper.appendChild(select);
    selectWrapper.appendChild(deletePresetBtn);
    presetsSection.appendChild(selectWrapper);

    // Guardar como Preset nuevo
    const savePresetWrapper = document.createElement('div');
    savePresetWrapper.className = 'dev-save-preset-wrapper';
    
    const presetNameInput = document.createElement('input');
    presetNameInput.type = 'text';
    presetNameInput.id = 'dev-preset-name-input';
    presetNameInput.className = 'dev-preset-name-input';
    presetNameInput.placeholder = 'Nombre de preset personalizado...';
    
    const savePresetBtn = document.createElement('button');
    savePresetBtn.className = 'dev-btn-save-preset';
    savePresetBtn.id = 'dev-btn-save-preset';
    savePresetBtn.type = 'button';
    savePresetBtn.textContent = 'Guardar como Preset 💾';
    
    savePresetWrapper.appendChild(presetNameInput);
    savePresetWrapper.appendChild(savePresetBtn);
    presetsSection.appendChild(savePresetWrapper);
    
    body.appendChild(presetsSection);

    // Footer (Save / Reset)
    const footer = document.createElement('div');
    footer.className = 'dev-panel-footer';
    footer.innerHTML = `
      <button class="dev-btn-reset" type="button">Reset</button>
      <button class="dev-btn-save" type="button">Guardar</button>
    `;

    panel.appendChild(header);
    panel.appendChild(body);
    panel.appendChild(footer);
    
    container.appendChild(fab);
    container.appendChild(panel);
    document.body.appendChild(container);

    // --- LOGICA DE EVENTOS DE PRESETS ---
    select.onchange = () => {
      const selectedValue = select.value;
      if (!selectedValue) {
        deletePresetBtn.style.display = 'none';
        return;
      }
      
      let targetColors = null;
      let isCustom = false;
      let presetName = '';
      
      if (selectedValue.startsWith('default_')) {
        const key = selectedValue.replace('default_', '');
        targetColors = PRESETS[key].colors;
        isCustom = false;
        presetName = PRESETS[key].name;
      } else if (selectedValue.startsWith('custom_')) {
        const id = selectedValue.replace('custom_', '');
        const preset = customPresets.find(p => p.id === id);
        if (preset) {
          targetColors = preset.colors;
          isCustom = true;
          presetName = preset.name;
        }
      }
      
      if (targetColors) {
        applyThemeColors(targetColors);
        Object.entries(targetColors).forEach(([vName, value]) => {
          const inp = body.querySelector(`[data-var="${vName}"]`);
          if (inp) inp.value = value;
          const hexSpan = body.querySelector(`#hex-${vName}`);
          if (hexSpan) hexSpan.textContent = value;
        });
        showToast(`Tema preset "${presetName}" aplicado temporalmente`);
      }
      
      if (isCustom) {
        deletePresetBtn.style.display = 'block';
      } else {
        deletePresetBtn.style.display = 'none';
      }
    };

    deletePresetBtn.onclick = async (e) => {
      if (e) e.preventDefault();
      console.log('Borrar preset presionado');
      const selectedValue = select.value;
      if (!selectedValue || !selectedValue.startsWith('custom_')) return;
      
      const id = selectedValue.replace('custom_', '');
      const preset = customPresets.find(p => p.id === id);
      if (!preset) return;
      
      if (window.confirm(`¿Estás seguro de eliminar el preset "${preset.name}"?`)) {
        try {
          const res = await fetch(`/api/developer/preset/${id}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            showToast(`Preset "${preset.name}" eliminado`);
            customPresets = customPresets.filter(p => p.id !== id);
            
            // Re-poblar select
            populatePresetsSelect();
            
            select.value = '';
            deletePresetBtn.style.display = 'none';
          } else {
            showToast('Error al eliminar preset', true);
          }
        } catch (err) {
          console.error(err);
          showToast('Error de red al eliminar preset', true);
        }
      }
    };

    savePresetBtn.onclick = async () => {
      const name = presetNameInput.value.trim();
      if (!name) {
        showToast('Por favor ingrese un nombre para el preset', true);
        return;
      }
      
      try {
        const res = await fetch('/api/developer/preset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, colors: currentColors })
        });
        
        if (res.ok) {
          const data = await res.json();
          const newPreset = data.preset;
          
          showToast(`Preset "${name}" guardado con éxito`);
          presetNameInput.value = '';
          
          const existingIdx = customPresets.findIndex(p => p.name === name);
          if (existingIdx !== -1) {
            customPresets[existingIdx] = newPreset;
          } else {
            customPresets.push(newPreset);
          }
          populatePresetsSelect();
          select.value = `custom_${newPreset.id}`;
          
          deletePresetBtn.style.display = 'block';
        } else {
          showToast('Error al guardar el preset', true);
        }
      } catch (err) {
        console.error(err);
        showToast('Error de red al guardar preset', true);
      }
    };

    // --- EVENTOS DEL PANEL WIDGET ---
    const closeBtn = header.querySelector('.dev-panel-close');
    
    fab.onclick = () => {
      panel.classList.toggle('active');
    };
    
    closeBtn.onclick = () => {
      panel.classList.remove('active');
    };

    // Eventos al deslizar color picker
    body.querySelectorAll('.dev-color-input').forEach(input => {
      input.oninput = (e) => {
        const variable = e.target.getAttribute('data-var');
        const val = e.target.value;
        const hexSpan = body.querySelector(`#hex-${variable}`);
        if (hexSpan) hexSpan.textContent = val;
        
        applyThemeColors({ [variable]: val });
      };
    });

    // Evento reset
    footer.querySelector('.dev-btn-reset').onclick = async (e) => {
      if (e) e.preventDefault();
      console.log('Reset presionado');
      if (window.confirm('¿Restaurar los colores por defecto del sistema (Cyberpunk original)?')) {
        try {
          const res = await fetch('/api/developer/theme/reset', { method: 'POST' });
          if (res.ok) {
            applyThemeColors(PRESETS.cyberpunk.colors);
            
             // Actualizar inputs
            Object.entries(PRESETS.cyberpunk.colors).forEach(([vName, value]) => {
              const inp = body.querySelector(`[data-var="${vName}"]`);
              if (inp) inp.value = value;
              const hexSpan = body.querySelector(`#hex-${vName}`);
              if (hexSpan) hexSpan.textContent = value;
            });
            select.value = '';
            deletePresetBtn.style.display = 'none';
            showToast('Colores restablecidos a valores por defecto');
          }
        } catch (err) {
          console.error(err);
          showToast('Error al resetear colores', true);
        }
      }
    };

    // Evento guardar
    footer.querySelector('.dev-btn-save').onclick = async () => {
      try {
        const res = await fetch('/api/developer/theme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ themeColors: currentColors })
        });
        if (res.ok) {
          showToast('¡Colores del tema guardados persistentemente!');
          panel.classList.remove('active');
        } else {
          showToast('Error al guardar configuración', true);
        }
      } catch (err) {
        console.error(err);
        showToast('Error al conectar con el servidor', true);
      }
    };
  }

  // Ejecutar al cargar el DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
