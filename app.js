// Lógica del Cliente - Sr. Waffle (Página Pública)
document.addEventListener('DOMContentLoaded', () => {
  // --- INICIALIZACIÓN DE ESTADO ---
  let stock = [];
  let menu = [];

  // Carga stock y menú desde la API REST local
  const loadState = async () => {
    try {
      const stockRes = await fetch('/api/stock');
      stock = await stockRes.json();

      const menuRes = await fetch('/api/menu');
      menu = await menuRes.json();
    } catch (error) {
      console.error('Error al cargar datos de la API local:', error);
      // Fallback a data.js si no responde el servidor local
      if (window.SrWaffleData) {
        stock = window.SrWaffleData.INITIAL_STOCK;
        menu = window.SrWaffleData.INITIAL_MENU;
      }
    }
  };

  // --- VARIABLES DE INTERFAZ CLIENTE ---
  let currentView = 'inicio';

  // Configuración del Waffle Personalizado del Cliente
  let clientWaffle = {
    base: 'base_tradicional',
    toppings: [],
    syrups: [],
    icecreams: []
  };

  // --- ELEMENTOS DEL DOM ---
  const views = {
    inicio: document.getElementById('view-inicio'),
    menu: document.getElementById('view-menu'),
    builder: document.getElementById('view-builder')
  };

  const navLinks = document.querySelectorAll('.nav-link');
  const toast = document.getElementById('toast');

  // --- MÉTODOS DE UTILIDAD GENERAL ---
  const showToast = (message, isError = false) => {
    toast.textContent = message;
    toast.className = 'toast-notification';
    if (isError) toast.classList.add('error');
    toast.classList.add('active');
    setTimeout(() => {
      toast.classList.remove('active');
    }, 3000);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(value);
  };

  const getStockItem = (id) => {
    for (const category in stock) {
      const item = stock[category].find(i => i.id === id);
      if (item) return item;
    }
    return null;
  };

  const calculateWafflePrice = (waffleConfig) => {
    let price = getStockItem(waffleConfig.base)?.price || 0;
    waffleConfig.toppings.forEach(id => {
      price += getStockItem(id)?.price || 0;
    });
    waffleConfig.syrups.forEach(id => {
      price += getStockItem(id)?.price || 0;
    });
    if (waffleConfig.icecreams) {
      waffleConfig.icecreams.forEach(id => {
        price += getStockItem(id)?.price || 0;
      });
    }
    return price;
  };

  // --- SISTEMA DE NAVEGACIÓN ---
  const switchView = (viewName) => {
    currentView = viewName;
    
    // Actualizar barra de navegación
    navLinks.forEach(link => {
      if (link.getAttribute('data-view') === viewName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Activar sección DOM
    for (const key in views) {
      if (key === viewName) {
        views[key].classList.add('active');
      } else {
        views[key].classList.remove('active');
      }
    }

    // Inicializar o refrescar la vista específica
    if (viewName === 'menu') {
      loadState().then(() => renderClientMenu());
    }
    if (viewName === 'builder') {
      initClientBuilder();
    }
  };

  // Asignar listeners de navegación
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const view = link.getAttribute('data-view');
      switchView(view);
    });
  });

  // --- DIBUJAR EL WAFFLE DE BURBUJAS (VISUAL ENGINE) ---
  const renderWaffleVisual = (canvasContainerId, config) => {
    const wrapper = document.getElementById(canvasContainerId);
    if (!wrapper) return;

    const waffleElement = wrapper.querySelector('.waffle-visual');
    const toppingsContainer = wrapper.querySelector('.visual-toppings-container');
    const chocolateOverlay = wrapper.querySelector('.syrup-chocolate');
    const dulceOverlay = wrapper.querySelector('.syrup-dulce-leche');
    const caramelOverlay = wrapper.querySelector('.syrup-caramelo');

    waffleElement.className = 'waffle-visual';
    waffleElement.classList.add(`base-${config.base.replace('base_', '').replace('_', '-')}`);

    if (chocolateOverlay) {
      if (config.syrups.includes('syr_chocolate')) chocolateOverlay.classList.add('active');
      else chocolateOverlay.classList.remove('active');
    }
    if (dulceOverlay) {
      if (config.syrups.includes('syr_dulce_leche')) dulceOverlay.classList.add('active');
      else dulceOverlay.classList.remove('active');
    }
    if (caramelOverlay) {
      if (config.syrups.includes('syr_caramelo')) caramelOverlay.classList.add('active');
      else caramelOverlay.classList.remove('active');
    }

    if (toppingsContainer) {
      toppingsContainer.innerHTML = '';
      
      config.toppings.forEach(toppingId => {
        const itemStock = getStockItem(toppingId);
        if (!itemStock) return;

        for (let k = 0; k < 8; k++) {
          const toppingElement = document.createElement('div');
          toppingElement.className = `visual-topping-item vt-${toppingId}`;
          
          const radius = Math.random() * 115;
          const angle = Math.random() * Math.PI * 2;
          const x = 160 + radius * Math.cos(angle) - 10;
          const y = 160 + radius * Math.sin(angle) - 10;

          const randomRotation = Math.floor(Math.random() * 360);
          
          toppingElement.style.left = `${x}px`;
          toppingElement.style.top = `${y}px`;
          toppingElement.style.setProperty('--rot', `${randomRotation}deg`);
          
          if (toppingId === 'top_rocklets') {
            const rockletColors = ['#e63946', '#fee440', '#00f5d4', '#ff007f', '#a020f0', '#0077b6'];
            toppingElement.style.backgroundColor = rockletColors[Math.floor(Math.random() * rockletColors.length)];
          }

          toppingsContainer.appendChild(toppingElement);
        }
      });
    }

    const icecreamsContainer = wrapper.querySelector('.visual-icecreams-container');
    if (icecreamsContainer) {
      icecreamsContainer.innerHTML = '';
      if (config.icecreams) {
        config.icecreams.forEach((iceId, index) => {
          if (!iceId) return;
          const scoop = document.createElement('div');
          scoop.className = `visual-icecream-scoop scoop-${index} scoop-${iceId}`;
          if (iceId !== 'ice_vainilla' && iceId !== 'ice_chocolate' && iceId !== 'ice_dulce_leche') {
            scoop.classList.add('scoop-generic-ice');
          }
          icecreamsContainer.appendChild(scoop);
        });
      }
    }
  };

  // --- CLIENT SIDE: LANDING / INICIO ---
  document.getElementById('cta-ver-menu').addEventListener('click', () => switchView('menu'));
  document.getElementById('cta-armar-waffle').addEventListener('click', () => switchView('builder'));

  // --- CLIENT SIDE: MOSTRAR MENÚ DIGITAL ---
  const renderClientMenu = () => {
    const menuGrid = document.getElementById('client-menu-grid');
    if (!menuGrid) return;

    menuGrid.innerHTML = '';

    menu.forEach(item => {
      const card = document.createElement('div');
      card.className = 'menu-card';
      
      const baseObj = getStockItem(item.base);
      const toppingsText = item.toppings.map(t => getStockItem(t)?.name || '').filter(t => t !== '').join(', ');
      const syrupsText = item.syrups.map(s => getStockItem(s)?.name || '').filter(s => s !== '').join(', ');
      
      const tags = [];
      if (baseObj) tags.push(baseObj.name);
      if (syrupsText) tags.push(`Salsa: ${syrupsText}`);

      card.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="menu-card-img">
        <div class="menu-card-body">
          <div class="menu-card-title">
            <span>${item.name}</span>
            <span class="menu-card-price">${formatCurrency(item.price)}</span>
          </div>
          <p class="menu-card-desc">${item.description}</p>
          <div class="menu-card-tags">
            ${tags.map(t => `<span class="menu-tag">${t}</span>`).join('')}
            ${item.toppings.map(t => `<span class="menu-tag" style="border-color: rgba(255, 0, 127, 0.2); color: var(--neon-pink);">${getStockItem(t)?.name}</span>`).join('')}
          </div>
        </div>
      `;

      menuGrid.appendChild(card);
    });
  };

  // --- CLIENT SIDE: ARMADOR INTERACTIVO (CUSTOM BUILDER) ---
  const initClientBuilder = async () => {
    // Escuchar cambios de stock antes de renderizar
    await loadState();

    clientWaffle = {
      base: 'base_tradicional',
      toppings: [],
      syrups: [],
      icecreams: []
    };

    renderBuilderOptions('client-bases-options', 'bases', 'radio', (baseId) => {
      clientWaffle.base = baseId;
      updateClientBuilderUI();
    });

    renderBuilderOptions('client-toppings-options', 'toppings', 'checkbox', (toppingId, checked) => {
      if (checked) {
        if (clientWaffle.toppings.length >= 4) {
          showToast('Máximo 4 toppings por waffle', true);
          return false;
        }
        clientWaffle.toppings.push(toppingId);
      } else {
        clientWaffle.toppings = clientWaffle.toppings.filter(id => id !== toppingId);
      }
      updateClientBuilderUI();
      return true;
    });

    renderBuilderOptions('client-syrups-options', 'syrups', 'checkbox', (syrupId, checked) => {
      if (checked) {
        if (clientWaffle.syrups.length >= 2) {
          showToast('Máximo 2 salsas por waffle', true);
          return false;
        }
        clientWaffle.syrups.push(syrupId);
      } else {
        clientWaffle.syrups = clientWaffle.syrups.filter(id => id !== syrupId);
      }
      updateClientBuilderUI();
      return true;
    });

    // Control del Selector de Helados y Sabores
    const icecreamCountSelect = document.getElementById('client-icecream-count');
    const flavorSelectorsContainer = document.getElementById('client-icecreams-flavor-selectors');

    const updateFlavorSelectors = () => {
      const count = parseInt(icecreamCountSelect.value) || 0;
      flavorSelectorsContainer.innerHTML = '';
      
      while (clientWaffle.icecreams.length < count) {
        const firstAvailable = stock.icecreams.find(i => i.stock > 0);
        clientWaffle.icecreams.push(firstAvailable ? firstAvailable.id : '');
      }
      while (clientWaffle.icecreams.length > count) {
        clientWaffle.icecreams.pop();
      }

      for (let i = 0; i < count; i++) {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.gap = '4px';
        div.innerHTML = `
          <label style="font-size:0.75rem; color:var(--text-secondary);">Sabor de la Bocha ${i + 1}</label>
          <select class="client-icecream-flavor-select form-control" data-index="${i}" style="background:#181818; border:1px solid rgba(255,255,255,0.1); color:#fff; padding:0.5rem; border-radius:6px; font-size:0.85rem; width:100%; font-family:var(--font-sans);">
            ${stock.icecreams.map(ice => {
              const isOutOfStock = ice.stock <= 0;
              return `<option value="${ice.id}" ${clientWaffle.icecreams[i] === ice.id ? 'selected' : ''} ${isOutOfStock ? 'disabled style="color:gray;"' : ''}>
                ${ice.name} (${formatCurrency(ice.price)})${isOutOfStock ? ' [SIN STOCK]' : ''}
              </option>`;
            }).join('')}
          </select>
        `;
        flavorSelectorsContainer.appendChild(div);
      }

      flavorSelectorsContainer.querySelectorAll('.client-icecream-flavor-select').forEach(select => {
        select.onchange = () => {
          const index = parseInt(select.getAttribute('data-index'));
          clientWaffle.icecreams[index] = select.value;
          updateClientBuilderUI();
        };
      });
    };

    if (icecreamCountSelect) {
      icecreamCountSelect.value = "0";
      icecreamCountSelect.onchange = () => {
        updateFlavorSelectors();
        updateClientBuilderUI();
      };
      updateFlavorSelectors();
    }

    // Botón de enviar WhatsApp con validación de stock asíncrona
    const waBtn = document.getElementById('client-send-wa-btn');
    if (waBtn) {
      waBtn.onclick = async () => {
        // Refrescar stock consultando la API antes de mandar el WhatsApp
        await loadState();
        
        let stockOk = true;
        let outOfStockName = '';
        
        const baseItem = getStockItem(clientWaffle.base);
        if (!baseItem || baseItem.stock <= 0) {
          stockOk = false;
          outOfStockName = baseItem ? baseItem.name : 'Masa';
        }
        
        clientWaffle.toppings.forEach(tId => {
          const top = getStockItem(tId);
          if (!top || top.stock <= 0) {
            stockOk = false;
            outOfStockName = top ? top.name : 'Topping';
          }
        });

        clientWaffle.icecreams.forEach(iId => {
          const ice = getStockItem(iId);
          if (!ice || ice.stock <= 0) {
            stockOk = false;
            outOfStockName = ice ? ice.name : 'Helado';
          }
        });

        if (!stockOk) {
          showToast(`Lo sentimos, nos quedamos sin stock de: ${outOfStockName}. Elegí otra opción.`, true);
          initClientBuilder(); // Re-renderizar opciones con stock actualizado
          return;
        }

        const baseName = getStockItem(clientWaffle.base)?.name || '';
        const toppingsName = clientWaffle.toppings.map(id => getStockItem(id)?.name).join(', ') || 'Sin toppings';
        const syrupsName = clientWaffle.syrups.map(id => getStockItem(id)?.name).join(', ') || 'Sin salsas';
        const icecreamsName = clientWaffle.icecreams.map(id => getStockItem(id)?.name).join(', ') || 'Sin helado';
        const totalPrice = calculateWafflePrice(clientWaffle);

        const waMessage = `¡Hola! 👋 Quisiera encargar un *Sr. Waffle Armado a Gusto* 🧇\n\n` + 
                          `*Masa Base:* ${baseName}\n` + 
                          `*Toppings:* ${toppingsName}\n` + 
                          `*Salsas:* ${syrupsName}\n` +
                          `*Helado:* ${icecreamsName}\n\n` +
                          `*Total:* ${formatCurrency(totalPrice)}\n` +
                          `¿Me confirman para retirar por el local? ¡Gracias!`;

        const waUrl = `https://wa.me/5491123456789?text=${encodeURIComponent(waMessage)}`;
        window.open(waUrl, '_blank');
      };
    }

    updateClientBuilderUI();
  };

  const updateClientBuilderUI = () => {
    renderWaffleVisual('client-waffle-canvas-wrapper', clientWaffle);
    const totalPrice = calculateWafflePrice(clientWaffle);
    const priceValueEl = document.getElementById('client-waffle-price-value');
    if (priceValueEl) {
      priceValueEl.textContent = formatCurrency(totalPrice);
    }
  };

  const renderBuilderOptions = (containerId, category, selectionType, callback) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    const items = stock[category];

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'option-card';
      
      const isOutOfStock = item.stock <= 0;
      if (isOutOfStock) card.classList.add('out-of-stock');
      
      card.innerHTML = `
        <div class="option-name">${item.name}</div>
        <div class="option-price">+ ${formatCurrency(item.price)}</div>
        <div class="option-stock-warn">Sin Stock</div>
      `;

      if (!isOutOfStock) {
        card.addEventListener('click', () => {
          if (selectionType === 'radio') {
            container.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            callback(item.id);
          } else {
            const isSelected = card.classList.contains('selected');
            if (!isSelected) {
              const success = callback(item.id, true);
              if (success !== false) card.classList.add('selected');
            } else {
              callback(item.id, false);
              card.classList.remove('selected');
            }
          }
        });
        
        if (selectionType === 'radio' && item.id === clientWaffle.base) {
          card.classList.add('selected');
        }
      }

      container.appendChild(card);
    });
  };

  // --- ARRANQUE DE LA APP ---
  loadState().then(() => {
    switchView('inicio');
  });

  // --- CONTROL DEL MODAL DE AYUDA CLIENTE ---
  const helpBtn = document.getElementById('help-btn');
  const helpModal = document.getElementById('help-modal');
  const helpClose = document.getElementById('help-modal-close');

  if (helpBtn && helpModal && helpClose) {
    helpBtn.onclick = () => helpModal.style.display = 'flex';
    helpClose.onclick = () => helpModal.style.display = 'none';
    helpModal.onclick = (e) => {
      if (e.target === helpModal) helpModal.style.display = 'none';
    };
  }
});
