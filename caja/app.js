// Lógica del Módulo de Caja POS - Sr. Waffle
document.addEventListener('DOMContentLoaded', () => {
  // --- INICIALIZACIÓN DE ESTADO ---
  let stock = {};
  let menu = [];
  let cart = [];
  let selectedPaymentMethod = 'Efectivo';
  let loyaltyEnabled = false;
  let loyaltyPointsThreshold = 100;
  let currentLoyaltyCustomer = null;
  let employees = [];
  
  let pinInput = '';

  // Configuración del Waffle Personalizado en la Caja
  let posWaffle = {
    base: 'base_tradicional',
    spread: 'none',
    toppings: [],
    whippedCream: false,
    syrups: [],
    icecreams: []
  };

  // --- ELEMENTOS DEL DOM ---
  const toast = document.getElementById('toast');
  const loginOverlay = document.getElementById('caja-login-overlay');
  const cartItemsContainer = document.getElementById('pos-cart-items');
  const checkoutBtn = document.getElementById('pos-checkout-btn');

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
    if (waffleConfig.spread && waffleConfig.spread !== 'none') {
      price += getStockItem(waffleConfig.spread)?.price || 0;
    }
    if (waffleConfig.whippedCream) {
      price += getStockItem('top_crema_batida')?.price || 0;
    }
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

  // Carga el estado inicial de inventario y menú desde la API REST local
  const loadState = async () => {
    try {
      const stockRes = await fetch('/api/stock');
      stock = await stockRes.json();

      const menuRes = await fetch('/api/menu');
      menu = await menuRes.json();

      try {
        const settingsRes = await fetch('/api/loyalty/settings');
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          loyaltyEnabled = !!settingsData.loyaltyEnabled;
          loyaltyPointsThreshold = settingsData.loyaltyPointsThreshold || 100;
        }
      } catch (err) {
        console.warn('Error al obtener configuracion de fidelizacion:', err);
      }
    } catch (error) {
      console.error('Error al cargar datos del servidor:', error);
      showToast('Error al conectar con el servidor', true);
    }
  };

  // --- DIBUJAR EL WAFFLE EN EL MODAL POS (VISUAL ENGINE) ---
  const renderWaffleVisual = (canvasContainerId, config) => {
    const wrapper = document.getElementById(canvasContainerId);
    if (!wrapper) return;

    const backElement = wrapper.querySelector('.waffle-back');
    const frontElement = wrapper.querySelector('.waffle-front');
    const toppingsContainer = wrapper.querySelector('.visual-toppings-container');
    const chocolateOverlay = wrapper.querySelector('.syrup-chocolate');
    const dulceOverlay = wrapper.querySelector('.syrup-dulce-leche');
    const caramelOverlay = wrapper.querySelector('.syrup-caramelo');
    const spreadOverlay = wrapper.querySelector('.spread-overlay');
    const whippedCreamOverlay = wrapper.querySelector('.visual-whipped-cream');

    const baseClass = `base-${config.base.replace('base_', '').replace('_', '-')}`;
    if (backElement) {
      backElement.className = 'waffle-back';
      backElement.classList.add(baseClass);
    }
    if (frontElement) {
      frontElement.className = 'waffle-front';
      frontElement.classList.add(baseClass);
    }

    if (spreadOverlay) {
      spreadOverlay.className = 'spread-overlay';
      if (config.spread === 'syr_nutella') {
        spreadOverlay.classList.add('active-nutella');
      } else if (config.spread === 'syr_dulce_leche_spread') {
        spreadOverlay.classList.add('active-dulce');
      }
    }

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

    if (whippedCreamOverlay) {
      if (config.whippedCream) whippedCreamOverlay.classList.add('active');
      else whippedCreamOverlay.classList.remove('active');
    }

    if (toppingsContainer) {
      toppingsContainer.innerHTML = '';
      
      config.toppings.forEach(toppingId => {
        const itemStock = getStockItem(toppingId);
        if (!itemStock) return;

        for (let k = 0; k < 8; k++) {
          const toppingElement = document.createElement('div');
          toppingElement.className = `visual-topping-item vt-${toppingId}`;
          
          // Toppings sit on top of the ice cream/cream at the mouth of the cone
          const x = 75 + Math.random() * 170 - 12;
          const y = 45 + Math.random() * 110 - 12;

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

  // --- AUTENTICACIÓN POR PIN (SERVIDOR) ---
  const updatePinDots = () => {
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById(`dot-${i}`);
      if (i < pinInput.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    }
  };

  const handlePinKey = async (num) => {
    if (pinInput.length < 4) {
      pinInput += num;
      updatePinDots();
    }

    if (pinInput.length === 4) {
      setTimeout(async () => {
        try {
          const empSelect = document.getElementById('caja-employee-select');
          const employeeId = empSelect ? empSelect.value : null;

          if (!employeeId) {
            showToast('Seleccioná un cajero primero', true);
            pinInput = '';
            updatePinDots();
            return;
          }

          const res = await fetch('/api/auth/verify-cashier', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: pinInput, employeeId })
          });
          const data = await res.json();

          if (data.success) {
            sessionStorage.setItem('caja_authenticated', 'true');
            sessionStorage.setItem('caja_cashier_name', data.cashierName || 'Cajero');
            loginOverlay.style.display = 'none';
            showToast('Caja abierta con éxito');
            pinInput = '';
            updatePinDots();
            await startCaja();
          } else {
            showToast('PIN de Caja Incorrecto', true);
            pinInput = '';
            updatePinDots();
          }
        } catch (err) {
          console.error(err);
          showToast('Error de conexión con el servidor', true);
          pinInput = '';
          updatePinDots();
        }
      }, 200);
    }
  };

  // Asignar eventos a la botonera del PIN
  document.querySelectorAll('.pin-btn[data-num]').forEach(btn => {
    btn.addEventListener('click', () => handlePinKey(btn.getAttribute('data-num')));
  });

  document.querySelector('.pin-clear').addEventListener('click', () => {
    if (pinInput.length > 0) {
      pinInput = pinInput.slice(0, -1);
      updatePinDots();
    }
  });

  document.querySelector('.pin-clear-all').addEventListener('click', () => {
    pinInput = '';
    updatePinDots();
  });

  // Cerrar Sesión / Bloquear Caja
  document.getElementById('caja-logout').addEventListener('click', () => {
    sessionStorage.removeItem('caja_authenticated');
    loginOverlay.style.display = 'flex';
    pinInput = '';
    updatePinDots();
  });

  // --- INICIAR MÓDULO DE CAJA ---
  const startCaja = async () => {
    await loadState();
    renderPOS();
  };

  // --- RENDERIZAR INTERFAZ POS ---
  const renderPOS = () => {
    renderPOSCatalog();
    renderCart();
    
    const loyaltySec = document.getElementById('loyalty-pos-section');
    if (loyaltySec) {
      loyaltySec.style.display = loyaltyEnabled ? 'block' : 'none';
    }
  };

  const renderPOSCatalog = () => {
    // 1. Waffles de la Carta
    const menuGrid = document.getElementById('pos-menu-grid');
    if (menuGrid) {
      menuGrid.innerHTML = '';
      menu.forEach(waffle => {
        let canSell = true;
        const baseItem = getStockItem(waffle.base);
        if (!baseItem || baseItem.stock <= 0) canSell = false;
        
        waffle.toppings.forEach(topId => {
          const topItem = getStockItem(topId);
          if (!topItem || topItem.stock <= 0) canSell = false;
        });

        const card = document.createElement('div');
        card.className = 'pos-item-card';
        if (!canSell) card.classList.add('out-of-stock');

        // Buscar si existe imagen local para renderizar
        const imgPath = waffle.image ? `/${waffle.image}` : '';
        const imgHTML = imgPath ? `<img src="${imgPath}" class="pos-item-img-thumbnail" alt="${waffle.name}">` : '';

        card.innerHTML = `
          ${imgHTML}
          <div class="pos-item-card-content">
            <div class="pos-item-name">${waffle.name}</div>
            <div class="pos-item-price">${formatCurrency(waffle.price)}</div>
            <div class="pos-item-stock">${canSell ? 'Disponible' : 'Sin Insumos'}</div>
          </div>
        `;

        if (canSell) {
          card.addEventListener('click', () => {
            addToCart({
              id: waffle.id,
              name: waffle.name,
              details: 'Waffle de Carta',
              price: waffle.price,
              type: 'menu_waffle',
              config: waffle
            });
          });
        }
        menuGrid.appendChild(card);
      });
    }

    // 2. Bebidas
    const drinksGrid = document.getElementById('pos-drinks-grid');
    if (drinksGrid) {
      drinksGrid.innerHTML = '';
      stock.drinks.forEach(drink => {
        const card = document.createElement('div');
        card.className = 'pos-item-card';
        const isOutOfStock = drink.stock <= 0;
        const isLowStock = drink.stock <= drink.minStock;

        if (isOutOfStock) card.classList.add('out-of-stock');
        else if (isLowStock) card.classList.add('low-stock');

        card.innerHTML = `
          <div class="pos-item-card-content">
            <div class="pos-item-name">${drink.name}</div>
            <div class="pos-item-price">${formatCurrency(drink.price)}</div>
            <div class="pos-item-stock">Stock: ${drink.stock} un</div>
          </div>
        `;

        if (!isOutOfStock) {
          card.addEventListener('click', () => {
            addToCart({
              id: drink.id,
              name: drink.name,
              details: 'Bebida',
              price: drink.price,
              type: 'drink'
            });
          });
        }
        drinksGrid.appendChild(card);
      });
    }

    const customWaffleBtn = document.getElementById('pos-custom-waffle-btn');
    if (customWaffleBtn) {
      customWaffleBtn.onclick = () => showPOSWaffleBuilderModal();
    }
  };

  // --- MODAL PERSONALIZADOR DE WAFFLE ---
  const showPOSWaffleBuilderModal = () => {
    posWaffle = {
      base: 'base_tradicional',
      spread: 'none',
      toppings: [],
      whippedCream: false,
      syrups: [],
      icecreams: []
    };

    const modal = document.createElement('div');
    modal.className = 'pos-modal-overlay';
    modal.innerHTML = `
      <div class="pos-waffle-modal">
        <div class="pos-waffle-modal-left" id="pos-waffle-canvas-wrapper">
          <div class="builder-neon-glow"></div>
          <div class="waffle-assembly-box" style="position: relative; width: 320px; height: 320px; z-index: 2;">
            <!-- Back Waffle (Peak pointing up) -->
            <div class="waffle-back">
              <div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div>
              <div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div>
            </div>
            <div class="spread-overlay"></div>
            <div class="syrup-overlay syrup-chocolate"></div>
            <div class="syrup-overlay syrup-dulce-leche"></div>
            <div class="syrup-overlay syrup-caramelo"></div>
            
            <div class="visual-whipped-cream"></div>
            <div class="visual-icecreams-container"></div>
            
            <!-- Front Waffle (Pocket pointing down) -->
            <div class="waffle-front">
              <div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div>
              <div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div>
              <div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div>
            </div>
            
            <div class="visual-toppings-container"></div>
          </div>
        </div>
        <div class="pos-waffle-modal-right" style="overflow-y: auto; max-height: 90vh; padding-right: 10px;">
          <h2 style="font-family: var(--font-cursive); font-size: 2rem;">Armador POS</h2>
          
          <div class="builder-step">
            <h3>Paso 1: Masa</h3>
            <div class="builder-options-grid" id="pos-bases-grid"></div>
          </div>
          <div class="builder-step">
            <h3>Paso 2: Relleno</h3>
            <div class="builder-options-grid" id="pos-spreads-grid"></div>
          </div>
          <div class="builder-step">
            <h3>Paso 3: Helado (Máx 3 bochas)</h3>
            <div style="margin-bottom: 0.5rem;">
              <select id="pos-icecream-count" style="background:#181818; border: 1px solid rgba(255,255,255,0.1); color:#fff; width:100%; border-radius:6px; padding:0.6rem; font-size:0.9rem; font-weight:600; font-family:var(--font-sans);">
                <option value="0">Sin helado</option>
                <option value="1">1 bocha</option>
                <option value="2">2 bochas</option>
                <option value="3">3 bochas</option>
              </select>
            </div>
            <div id="pos-icecreams-flavor-selectors" style="display:flex; flex-direction:column; gap:8px; margin-top:10px;"></div>
          </div>
          <div class="builder-step">
            <h3>Paso 4: Toppings (Máx 4)</h3>
            <div class="builder-options-grid" id="pos-toppings-grid"></div>
          </div>
          <div class="builder-step">
            <h3>Paso 5: Crema Batida</h3>
            <div class="builder-options-grid" id="pos-whipped-cream-grid"></div>
          </div>
          <div class="builder-step">
            <h3>Paso 6: Salsas (Máx 2)</h3>
            <div class="builder-options-grid" id="pos-syrups-grid"></div>
          </div>
          
          <div class="price-summary-box" style="margin-top:auto; margin-bottom: 15px;">
            <div class="price-summary-title">Total Waffle</div>
            <div class="price-summary-value" id="pos-modal-price-value">$0</div>
          </div>
          
          <div class="modal-actions">
            <button class="btn-secondary" id="pos-modal-cancel" style="padding: 0.6rem 1.2rem;">Cancelar</button>
            <button class="btn-primary" id="pos-modal-add" style="padding: 0.6rem 1.2rem;">Agregar al Pedido</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const updatePOSModalUI = () => {
      renderWaffleVisual('pos-waffle-canvas-wrapper', posWaffle);
      const subtotal = calculateWafflePrice(posWaffle);
      document.getElementById('pos-modal-price-value').textContent = formatCurrency(subtotal);
    };

    const renderModalGrid = (containerId, category, isRadio) => {
      const grid = document.getElementById(containerId);
      if (!grid) return;
      grid.innerHTML = '';
      
      let items = stock[category] ? [...stock[category]] : [];

      if (category === 'syrups') {
        if (containerId === 'pos-spreads-grid') {
          items = items.filter(item => item.id === 'syr_nutella' || item.id === 'syr_dulce_leche_spread');
          items.unshift({
            id: 'none',
            name: 'Sin Relleno',
            price: 0,
            stock: 9999
          });
        } else if (containerId === 'pos-syrups-grid') {
          items = items.filter(item => item.id !== 'syr_nutella' && item.id !== 'syr_dulce_leche_spread');
        }
      } else if (category === 'toppings') {
        if (containerId === 'pos-toppings-grid') {
          items = items.filter(item => item.id !== 'top_crema_batida');
        } else if (containerId === 'pos-whipped-cream-grid') {
          items = items.filter(item => item.id === 'top_crema_batida');
          items.unshift({
            id: 'none',
            name: 'Sin Crema',
            price: 0,
            stock: 9999
          });
        }
      }

      items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'option-card';
        if (item.stock <= 0) card.classList.add('out-of-stock');

        card.innerHTML = `
          <div class="option-name">${item.name}</div>
          <div class="option-price">${item.price > 0 ? '+ ' + formatCurrency(item.price) : 'Gratis'}</div>
          <div class="option-stock-warn">Sin Insumo</div>
        `;

        let isSelected = false;
        if (isRadio) {
          if (containerId === 'pos-bases-grid' && item.id === posWaffle.base) isSelected = true;
          if (containerId === 'pos-spreads-grid' && item.id === posWaffle.spread) isSelected = true;
          if (containerId === 'pos-whipped-cream-grid') {
            if (posWaffle.whippedCream && item.id === 'top_crema_batida') isSelected = true;
            if (!posWaffle.whippedCream && item.id === 'none') isSelected = true;
          }
        } else {
          if (category === 'toppings' && posWaffle.toppings.includes(item.id)) isSelected = true;
          if (category === 'syrups' && posWaffle.syrups.includes(item.id)) isSelected = true;
        }

        if (isSelected) {
          card.classList.add('selected');
        }

        if (item.stock > 0) {
          card.onclick = () => {
            if (isRadio) {
              grid.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
              card.classList.add('selected');
              if (containerId === 'pos-bases-grid') {
                posWaffle.base = item.id;
              } else if (containerId === 'pos-spreads-grid') {
                posWaffle.spread = item.id;
              } else if (containerId === 'pos-whipped-cream-grid') {
                posWaffle.whippedCream = (item.id === 'top_crema_batida');
              }
            } else {
              const selected = card.classList.contains('selected');
              if (selected) {
                card.classList.remove('selected');
                posWaffle[category] = posWaffle[category].filter(id => id !== item.id);
              } else {
                if (category === 'toppings' && posWaffle.toppings.length >= 4) {
                  showToast('Máximo 4 toppings', true);
                  return;
                }
                if (category === 'syrups' && posWaffle.syrups.length >= 2) {
                  showToast('Máximo 2 salsas', true);
                  return;
                }
                card.classList.add('selected');
                posWaffle[category].push(item.id);
              }
            }
            updatePOSModalUI();
          };
        }

        grid.appendChild(card);
      });
    };

    // Control de Helados en el modal POS
    const posIcecreamCountSelect = document.getElementById('pos-icecream-count');
    const posFlavorSelectorsContainer = document.getElementById('pos-icecreams-flavor-selectors');

    const updatePOSFlavorSelectors = () => {
      const count = parseInt(posIcecreamCountSelect.value) || 0;
      posFlavorSelectorsContainer.innerHTML = '';
      
      while (posWaffle.icecreams.length < count) {
        const firstAvailable = stock.icecreams.find(i => i.stock > 0);
        posWaffle.icecreams.push(firstAvailable ? firstAvailable.id : '');
      }
      while (posWaffle.icecreams.length > count) {
        posWaffle.icecreams.pop();
      }

      for (let i = 0; i < count; i++) {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.gap = '4px';
        div.innerHTML = `
          <label style="font-size:0.75rem; color:var(--text-secondary);">Sabor Bocha ${i + 1}</label>
          <select class="pos-icecream-flavor-select form-control" data-index="${i}" style="background:#181818; border:1px solid rgba(255,255,255,0.1); color:#fff; padding:0.5rem; border-radius:6px; font-size:0.85rem; width:100%; font-family:var(--font-sans);">
            ${stock.icecreams.map(ice => {
              const isOutOfStock = ice.stock <= 0;
              return `<option value="${ice.id}" ${posWaffle.icecreams[i] === ice.id ? 'selected' : ''} ${isOutOfStock ? 'disabled style="color:gray;"' : ''}>
                ${ice.name} (${formatCurrency(ice.price)})${isOutOfStock ? ' [SIN STOCK]' : ''}
              </option>`;
            }).join('')}
          </select>
        `;
        posFlavorSelectorsContainer.appendChild(div);
      }

      posFlavorSelectorsContainer.querySelectorAll('.pos-icecream-flavor-select').forEach(select => {
        select.onchange = () => {
          const index = parseInt(select.getAttribute('data-index'));
          posWaffle.icecreams[index] = select.value;
          updatePOSModalUI();
        };
      });
    };

    if (posIcecreamCountSelect) {
      posIcecreamCountSelect.value = "0";
      posIcecreamCountSelect.onchange = () => {
        updatePOSFlavorSelectors();
        updatePOSModalUI();
      };
      updatePOSFlavorSelectors();
    }

    renderModalGrid('pos-bases-grid', 'bases', true);
    renderModalGrid('pos-spreads-grid', 'syrups', true);
    renderModalGrid('pos-toppings-grid', 'toppings', false);
    renderModalGrid('pos-whipped-cream-grid', 'toppings', true);
    renderModalGrid('pos-syrups-grid', 'syrups', false);
    
    updatePOSModalUI();

    document.getElementById('pos-modal-cancel').onclick = () => modal.remove();
    document.getElementById('pos-modal-add').onclick = () => {
      const price = calculateWafflePrice(posWaffle);
      
      const baseName = getStockItem(posWaffle.base)?.name || '';
      const spreadName = posWaffle.spread && posWaffle.spread !== 'none' ? getStockItem(posWaffle.spread)?.name : '';
      const whippedCreamText = posWaffle.whippedCream ? 'Crema Batida' : '';
      const toppingsText = posWaffle.toppings.map(id => getStockItem(id)?.name).join(', ');
      const syrupsText = posWaffle.syrups.map(id => getStockItem(id)?.name).join(', ');
      const icecreamsText = posWaffle.icecreams.map(id => getStockItem(id)?.name).join(', ');
      
      let details = `Masa: ${baseName}`;
      if (spreadName) details += ` + Relleno: ${spreadName}`;
      if (icecreamsText) details += ` + Helado: ${icecreamsText}`;
      if (toppingsText) details += ` + Toppings: ${toppingsText}`;
      if (whippedCreamText) details += ` + ${whippedCreamText}`;
      if (syrupsText) details += ` + Salsas: ${syrupsText}`;

      // Compile config back into server-deductible format
      const compiledConfig = JSON.parse(JSON.stringify(posWaffle));
      if (compiledConfig.spread && compiledConfig.spread !== 'none') {
        compiledConfig.syrups.push(compiledConfig.spread);
      }
      if (compiledConfig.whippedCream) {
        compiledConfig.toppings.push('top_crema_batida');
      }

      addToCart({
        id: `custom_${Date.now()}`,
        name: 'Waffle Customizado',
        details: details,
        price: price,
        type: 'custom_waffle',
        config: compiledConfig
      });
      modal.remove();
    };
  };

  const addToCart = (item) => {
    cart.push(item);
    showToast(`${item.name} agregado al pedido`);
    renderCart();
  };

  const renderCart = () => {
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<div class="cart-empty-msg">El pedido está vacío</div>';
      checkoutBtn.disabled = true;
    } else {
      checkoutBtn.disabled = false;
      cart.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'cart-item-row';
        row.innerHTML = `
          <div class="cart-item-info">
            <span class="cart-item-name">${item.name}</span>
            <span class="cart-item-details">${item.details}</span>
          </div>
          <div class="cart-item-actions">
            <span class="cart-item-price">${formatCurrency(item.price)}</span>
            <button class="cart-remove-btn" data-index="${index}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            </button>
          </div>
        `;
        cartItemsContainer.appendChild(row);
      });

      cartItemsContainer.querySelectorAll('.cart-remove-btn').forEach(btn => {
        btn.onclick = () => {
          const index = parseInt(btn.getAttribute('data-index'));
          cart.splice(index, 1);
          renderCart();
        };
      });
    }

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    document.getElementById('pos-total').textContent = formatCurrency(total);

    if (loyaltyEnabled) {
      const pointsToAddSpan = document.getElementById('loyalty-points-to-add');
      if (pointsToAddSpan) {
        pointsToAddSpan.textContent = Math.floor(total / loyaltyPointsThreshold);
      }
    }

    const paymentButtons = document.querySelectorAll('.payment-btn');
    paymentButtons.forEach(btn => {
      const method = btn.getAttribute('data-method');
      if (method === selectedPaymentMethod) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }

      btn.onclick = () => {
        selectedPaymentMethod = method;
        paymentButtons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      };
    });
  };

  // Registrar venta
  checkoutBtn.onclick = async () => {
    if (cart.length === 0) return;

    try {
      const total = cart.reduce((sum, item) => sum + item.price, 0);
      const cashierName = sessionStorage.getItem('caja_cashier_name') || 'Administrador';
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          total: total,
          paymentMethod: selectedPaymentMethod,
          cashierName: cashierName
        })
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Error al procesar la venta', true);
        return;
      }

      // Si el programa está activo y hay un cliente identificado, registrar/acumular puntos
      if (loyaltyEnabled && currentLoyaltyCustomer) {
        const phoneInput = document.getElementById('loyalty-phone');
        const customerNameInput = document.getElementById('loyalty-name');
        const phone = phoneInput ? phoneInput.value.trim() : '';
        const name = customerNameInput ? (customerNameInput.value.trim() || 'Cliente Waffle Club') : 'Cliente Waffle Club';
        const pointsToSum = Math.floor(total / loyaltyPointsThreshold);

        if (phone && pointsToSum > 0) {
          try {
            await fetch('/api/loyalty/customer', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone,
                name,
                pointsToAdd: pointsToSum
              })
            });
          } catch (err) {
            console.error('Error al registrar puntos de fidelización:', err);
          }
        }
      }

      // Limpiar inputs de fidelización
      const phoneInput = document.getElementById('loyalty-phone');
      const customerNameInput = document.getElementById('loyalty-name');
      const searchStatus = document.getElementById('loyalty-search-status');
      const customerInfoDiv = document.getElementById('loyalty-customer-info');
      
      if (phoneInput) phoneInput.value = '';
      if (customerNameInput) customerNameInput.value = '';
      if (searchStatus) searchStatus.textContent = '';
      if (customerInfoDiv) customerInfoDiv.style.display = 'none';
      currentLoyaltyCustomer = null;

      showToast('¡Venta registrada con éxito!');
      cart = [];
      await loadState();
      renderPOS();
    } catch (error) {
      console.error(error);
      showToast('Error al conectar con el servidor', true);
    }
  };

  // --- LOGICA DE EVENTOS DE FIDELIZACIÓN EN CAJA ---
  const initLoyaltyEventListeners = () => {
    const findBtn = document.getElementById('loyalty-find-btn');
    const phoneInput = document.getElementById('loyalty-phone');
    const searchStatus = document.getElementById('loyalty-search-status');
    const customerInfoDiv = document.getElementById('loyalty-customer-info');
    const customerNameInput = document.getElementById('loyalty-name');
    const currentPointsSpan = document.getElementById('loyalty-points-current');
    const pointsToAddSpan = document.getElementById('loyalty-points-to-add');

    if (findBtn && phoneInput) {
      findBtn.onclick = async (e) => {
        if (e) e.preventDefault();
        const phone = phoneInput.value.trim();
        if (!phone) {
          showToast('Ingrese un número de teléfono', true);
          return;
        }
        searchStatus.textContent = 'Buscando...';
        customerInfoDiv.style.display = 'none';
        currentLoyaltyCustomer = null;

        try {
          const res = await fetch(`/api/loyalty/customer/${phone}`);
          if (res.ok) {
            const customer = await res.json();
            currentLoyaltyCustomer = customer;
            searchStatus.textContent = 'Club Waffle ⭐';
            if (customerNameInput) customerNameInput.value = customer.name;
            if (currentPointsSpan) currentPointsSpan.textContent = customer.points;
            if (pointsToAddSpan) {
              const total = cart.reduce((sum, item) => sum + item.price, 0);
              pointsToAddSpan.textContent = Math.floor(total / 100);
            }
            customerInfoDiv.style.display = 'flex';
          } else if (res.status === 404) {
            searchStatus.textContent = 'Cliente Nuevo';
            if (customerNameInput) customerNameInput.value = '';
            if (currentPointsSpan) currentPointsSpan.textContent = '0';
            if (pointsToAddSpan) {
              const total = cart.reduce((sum, item) => sum + item.price, 0);
              pointsToAddSpan.textContent = Math.floor(total / 100);
            }
            customerInfoDiv.style.display = 'flex';
            currentLoyaltyCustomer = { phone, name: '', points: 0, isNew: true };
          } else {
            searchStatus.textContent = 'No Encontrado';
          }
        } catch (e) {
          console.error(e);
          searchStatus.textContent = 'Error';
        }
      };
    }
  };

  initLoyaltyEventListeners();

  // --- VERIFICAR ESTADO DE AUTENTICACIÓN INICIAL ---
  const initApp = async () => {
    try {
      const empRes = await fetch('/api/employees');
      if (empRes.ok) {
        employees = await empRes.json();
        const empSelect = document.getElementById('caja-employee-select');
        if (empSelect) {
          empSelect.innerHTML = '<option value="">Selecciona tu usuario...</option>';
          const activeEmployees = employees.filter(e => e.active && e.role !== 'kitchen');
          activeEmployees.forEach(e => {
            empSelect.innerHTML += `<option value="${e.id}">${e.name}</option>`;
          });
        }
      }
    } catch (e) {
      console.error('Error al cargar empleados', e);
    }

    if (sessionStorage.getItem('caja_authenticated') === 'true') {
      loginOverlay.style.display = 'none';
      startCaja();
    } else {
      loginOverlay.style.display = 'flex';
    }

    // Cargar logo de empresa
    try {
      const compRes = await fetch('/api/company/info');
      if (compRes.ok) {
        const compData = await compRes.json();
        const sidebarText = document.querySelector('.caja-brand .logo-text');
        if (sidebarText && compData.companyLogo) {
          let logoImg = document.getElementById('dynamic-caja-logo');
          if (!logoImg) {
            logoImg = document.createElement('img');
            logoImg.id = 'dynamic-caja-logo';
            logoImg.style.cssText = 'width:40px; height:40px; border-radius:50%; object-fit:cover; margin-right:10px;';
            sidebarText.parentNode.insertBefore(logoImg, sidebarText);
          }
          logoImg.src = compData.companyLogo;
        }
      }
    } catch (e) {
      console.error('Error al cargar logo', e);
    }
  };

  initApp();

  // --- CONTROL DEL MODAL DE AYUDA POS ---
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
