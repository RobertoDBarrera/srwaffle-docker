// Lógica Exclusiva del Sistema POS y Control de Stock - Sr. Waffle (Backoffice)
document.addEventListener('DOMContentLoaded', () => {
  // --- INICIALIZACIÓN DE ESTADO ---
  let stock = [];
  let sales = [];
  let menu = [];

  // Carga el estado inicial de inventario, ventas y menú desde la API REST local
  const loadState = async () => {
    try {
      const stockRes = await fetch('/api/stock');
      stock = await stockRes.json();

      const salesRes = await fetch('/api/sales');
      sales = await salesRes.json();

      const menuRes = await fetch('/api/menu');
      menu = await menuRes.json();
    } catch (error) {
      console.error('Error al cargar datos del servidor API:', error);
      showToast('Error al conectar con la base de datos local', true);
    }
  };

  // --- VARIABLES DE INTERFAZ POS ---
  let currentAdminView = 'pos';
  let cart = [];
  let selectedPaymentMethod = 'Efectivo';
  
  // PIN de seguridad para acceso al POS (Por defecto: 1234)
  const CORRECT_PIN = '1234';
  let pinInput = '';

  // Configuración del Waffle Personalizado en el POS
  let posWaffle = {
    base: 'base_tradicional',
    toppings: [],
    syrups: []
  };

  // --- ELEMENTOS DEL DOM ---
  const adminViews = {
    pos: document.getElementById('admin-view-pos'),
    inventory: document.getElementById('admin-view-inventory'),
    analytics: document.getElementById('admin-view-analytics')
  };

  const adminMenuItems = document.querySelectorAll('.admin-menu-item');
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
    return price;
  };

  // --- DIBUJAR EL WAFFLE EN EL MODAL POS (VISUAL ENGINE) ---
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
  };

  // --- NAVEGACIÓN INTERNA DEL PANEL (Con recarga de API) ---
  const switchAdminView = async (adminViewName) => {
    currentAdminView = adminViewName;

    adminMenuItems.forEach(item => {
      if (item.getAttribute('data-admin-view') === adminViewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    for (const key in adminViews) {
      if (key === adminViewName) {
        adminViews[key].classList.add('active');
      } else {
        adminViews[key].classList.remove('active');
      }
    }

    // Cargar datos actualizados antes de dibujar
    await loadState();

    if (adminViewName === 'pos') renderPOS();
    if (adminViewName === 'inventory') renderInventory();
    if (adminViewName === 'analytics') renderAnalytics();
  };

  adminMenuItems.forEach(item => {
    item.addEventListener('click', () => {
      const view = item.getAttribute('data-admin-view');
      if (view) switchAdminView(view);
    });
  });

  // Salir / Bloquear POS
  document.getElementById('admin-logout').addEventListener('click', () => {
    sessionStorage.removeItem('admin_authenticated');
    showPinModal();
  });

  // --- MODAL PIN DE SEGURIDAD (PANTALLA DE BLOQUEO) ---
  const showPinModal = () => {
    pinInput = '';
    
    const existingModal = document.querySelector('.admin-login-overlay');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'admin-login-overlay';
    modal.innerHTML = `
      <div class="login-card">
        <div class="login-header">
          <h2>Sr. Waffle POS</h2>
          <p>Ingresá el PIN de acceso de caja (1234)</p>
        </div>
        <div class="pin-display">
          <div class="pin-dot" id="dot-0"></div>
          <div class="pin-dot" id="dot-1"></div>
          <div class="pin-dot" id="dot-2"></div>
          <div class="pin-dot" id="dot-3"></div>
        </div>
        <div class="pin-keyboard">
          <button class="pin-btn" data-num="1">1</button>
          <button class="pin-btn" data-num="2">2</button>
          <button class="pin-btn" data-num="3">3</button>
          <button class="pin-btn" data-num="4">4</button>
          <button class="pin-btn" data-num="5">5</button>
          <button class="pin-btn" data-num="6">6</button>
          <button class="pin-btn" data-num="7">7</button>
          <button class="pin-btn" data-num="8">8</button>
          <button class="pin-btn" data-num="9">9</button>
          <button class="pin-btn pin-clear">C</button>
          <button class="pin-btn" data-num="0">0</button>
          <button class="pin-btn pin-clear-all" style="font-size: 0.8rem;">Limpiar</button>
        </div>
        <p style="color:var(--text-muted); font-size:0.75rem; text-align:center;">Acceso exclusivo para personal autorizado de Sr. Waffle</p>
      </div>
    `;

    document.body.appendChild(modal);

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

    const handleKey = (num) => {
      if (pinInput.length < 4) {
        pinInput += num;
        updatePinDots();
      }

      if (pinInput.length === 4) {
        setTimeout(async () => {
          if (pinInput === CORRECT_PIN) {
            sessionStorage.setItem('admin_authenticated', 'true');
            modal.remove();
            showToast('Caja abierta con éxito');
            await switchAdminView('pos');
          } else {
            showToast('PIN Incorrecto', true);
            pinInput = '';
            updatePinDots();
          }
        }, 200);
      }
    };

    modal.querySelectorAll('.pin-btn[data-num]').forEach(btn => {
      btn.addEventListener('click', () => handleKey(btn.getAttribute('data-num')));
    });

    modal.querySelector('.pin-clear').addEventListener('click', () => {
      if (pinInput.length > 0) {
        pinInput = pinInput.slice(0, -1);
        updatePinDots();
      }
    });

    modal.querySelector('.pin-clear-all').addEventListener('click', () => {
      pinInput = '';
      updatePinDots();
    });
  };

  // --- LOGICA POS: CAJERO Y COMPRAS ---
  const renderPOS = () => {
    renderPOSCatalog();
    renderCart();
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

        card.innerHTML = `
          <div class="pos-item-name">${waffle.name}</div>
          <div class="pos-item-price">${formatCurrency(waffle.price)}</div>
          <div class="pos-item-stock">${canSell ? 'Disponible' : 'Sin Insumos'}</div>
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
          <div class="pos-item-name">${drink.name}</div>
          <div class="pos-item-price">${formatCurrency(drink.price)}</div>
          <div class="pos-item-stock">Stock: ${drink.stock} un</div>
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

  const showPOSWaffleBuilderModal = () => {
    posWaffle = {
      base: 'base_tradicional',
      toppings: [],
      syrups: []
    };

    const modal = document.createElement('div');
    modal.className = 'pos-modal-overlay';
    modal.innerHTML = `
      <div class="pos-waffle-modal">
        <div class="pos-waffle-modal-left" id="pos-waffle-canvas-wrapper">
          <div class="builder-neon-glow"></div>
          <div class="waffle-visual">
            <div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div>
            <div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div>
            <div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div>
            <div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div>
            <div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div>
          </div>
          <div class="syrup-overlay syrup-chocolate"></div>
          <div class="syrup-overlay syrup-dulce-leche"></div>
          <div class="syrup-overlay syrup-caramelo"></div>
          
          <div class="visual-toppings-container"></div>
        </div>
        <div class="pos-waffle-modal-right">
          <h2 style="font-family: var(--font-cursive); font-size: 2rem;">Armador POS</h2>
          
          <div class="builder-step">
            <h3>Seleccionar Masa</h3>
            <div class="builder-options-grid" id="pos-bases-grid"></div>
          </div>
          <div class="builder-step">
            <h3>Toppings (Máx 4)</h3>
            <div class="builder-options-grid" id="pos-toppings-grid"></div>
          </div>
          <div class="builder-step">
            <h3>Salsas (Máx 2)</h3>
            <div class="builder-options-grid" id="pos-syrups-grid"></div>
          </div>
          
          <div class="price-summary-box" style="margin-top:auto;">
            <div class="price-summary-title">Subtotal Waffle</div>
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
      grid.innerHTML = '';
      
      stock[category].forEach(item => {
        const card = document.createElement('div');
        card.className = 'option-card';
        if (item.stock <= 0) card.classList.add('out-of-stock');

        card.innerHTML = `
          <div class="option-name">${item.name}</div>
          <div class="option-price">+ ${formatCurrency(item.price)}</div>
          <div class="option-stock-warn">Sin Insumo</div>
        `;

        if (isRadio && item.id === posWaffle.base) {
          card.classList.add('selected');
        } else if (!isRadio && category === 'toppings' && posWaffle.toppings.includes(item.id)) {
          card.classList.add('selected');
        } else if (!isRadio && category === 'syrups' && posWaffle.syrups.includes(item.id)) {
          card.classList.add('selected');
        }

        if (item.stock > 0) {
          card.onclick = () => {
            if (isRadio) {
              grid.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
              card.classList.add('selected');
              posWaffle.base = item.id;
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

    renderModalGrid('pos-bases-grid', 'bases', true);
    renderModalGrid('pos-toppings-grid', 'toppings', false);
    renderModalGrid('pos-syrups-grid', 'syrups', false);
    
    updatePOSModalUI();

    document.getElementById('pos-modal-cancel').onclick = () => modal.remove();
    document.getElementById('pos-modal-add').onclick = () => {
      const price = calculateWafflePrice(posWaffle);
      const toppingsText = posWaffle.toppings.map(id => getStockItem(id).name).join(', ');
      const syrupsText = posWaffle.syrups.map(id => getStockItem(id).name).join(', ');
      const details = `Masa: ${getStockItem(posWaffle.base).name}` + 
                      (toppingsText ? ` + Toppings: ${toppingsText}` : '') + 
                      (syrupsText ? ` + Salsas: ${syrupsText}` : '');

      addToCart({
        id: `custom_${Date.now()}`,
        name: 'Waffle Customizado',
        details: details,
        price: price,
        type: 'custom_waffle',
        config: JSON.parse(JSON.stringify(posWaffle))
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
    const cartItemsContainer = document.getElementById('pos-cart-items');
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<div class="cart-empty-msg">El pedido está vacío</div>';
      document.getElementById('pos-checkout-btn').disabled = true;
    } else {
      document.getElementById('pos-checkout-btn').disabled = false;
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
    const subtotal = total / 1.21;
    const iva = total - subtotal;

    document.getElementById('pos-subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('pos-iva').textContent = formatCurrency(iva);
    document.getElementById('pos-total').textContent = formatCurrency(total);

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

  // Registrar venta enviando petición POST al servidor Express
  document.getElementById('pos-checkout-btn').onclick = async () => {
    if (cart.length === 0) return;

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          total: cart.reduce((sum, item) => sum + item.price, 0),
          paymentMethod: selectedPaymentMethod
        })
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Error al procesar la venta', true);
        return;
      }

      showToast('¡Venta registrada con éxito!');
      cart = [];
      await loadState();
      renderPOS();
    } catch (error) {
      console.error(error);
      showToast('Error al conectar con el servidor', true);
    }
  };

  // --- LOGICA CONTROL DE STOCK (INVENTARIO) ---
  const renderInventory = () => {
    const tableBody = document.getElementById('inventory-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    const searchVal = document.getElementById('inventory-search').value.toLowerCase();

    let flatStock = [];
    for (const cat in stock) {
      flatStock = flatStock.concat(stock[cat]);
    }

    const filteredStock = flatStock.filter(item => item.name.toLowerCase().includes(searchVal));

    filteredStock.forEach(item => {
      const tr = document.createElement('tr');
      
      let statusClass = 'stock-level-ok';
      let statusText = 'Correcto';
      const pct = Math.min(100, Math.max(0, (item.stock / (item.minStock * 3)) * 100));

      if (item.stock <= 0) {
        statusClass = 'stock-level-critical';
        statusText = 'Sin Stock';
      } else if (item.stock <= item.minStock) {
        statusClass = 'stock-level-critical';
        statusText = 'Stock Crítico';
      } else if (item.stock <= item.minStock * 1.5) {
        statusClass = 'stock-level-warn';
        statusText = 'Stock Bajo';
      }

      tr.innerHTML = `
        <td style="font-weight:600;">${item.name}</td>
        <td style="text-transform: capitalize; color: var(--text-secondary);">${translateCategory(item.category)}</td>
        <td>
          <div class="stock-indicator">
            <span style="font-weight:700; width:60px;">${item.stock} ${item.unit.substring(0, 4)}</span>
            <div class="stock-bar-bg">
              <div class="stock-bar-fill ${statusClass}" style="width: ${pct}%;"></div>
            </div>
          </div>
        </td>
        <td>${formatCurrency(item.price)}</td>
        <td>
          ${item.stock <= item.minStock ? `<span class="badge-alert">${statusText}</span>` : `<span style="color: var(--neon-cyan); font-size: 0.8rem; font-weight:700;">OK</span>`}
        </td>
        <td>
          <div style="display:flex; gap: 8px;">
            <button class="action-icon-btn restock-btn" data-id="${item.id}" title="Reabastecer Stock">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-circle"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
            </button>
            <button class="action-icon-btn edit-price-btn" data-id="${item.id}" title="Editar Atributos">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </button>
          </div>
        </td>
      `;

      tableBody.appendChild(tr);
    });

    tableBody.querySelectorAll('.restock-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        showRestockModal(id);
      };
    });

    tableBody.querySelectorAll('.edit-price-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        showEditInventoryModal(id);
      };
    });
  };

  const translateCategory = (cat) => {
    const maps = { bases: 'masas', toppings: 'toppings', syrups: 'salsas', drinks: 'bebidas' };
    return maps[cat] || cat;
  };

  const invSearch = document.getElementById('inventory-search');
  if (invSearch) {
    invSearch.oninput = () => renderInventory();
  }

  // Modales de control de stock enviando POST a la API
  const showRestockModal = (id) => {
    const item = getStockItem(id);
    if (!item) return;

    const modal = document.createElement('div');
    modal.className = 'pos-modal-overlay';
    modal.innerHTML = `
      <div class="inventory-modal">
        <h2 style="font-family: var(--font-cursive); font-size: 1.8rem; margin-bottom: 5px;">Reabastecer</h2>
        <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom: 10px;">${item.name} (Stock Actual: ${item.stock} ${item.unit})</p>
        
        <div class="form-group">
          <label>Cantidad a Agregar (${item.unit})</label>
          <input type="number" id="restock-qty" class="form-control" placeholder="Ej: 50" min="1" required>
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" id="restock-cancel" style="padding: 0.6rem 1.2rem;">Cancelar</button>
          <button class="btn-primary" id="restock-confirm" style="padding: 0.6rem 1.2rem;">Guardar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('restock-cancel').onclick = () => modal.remove();
    document.getElementById('restock-confirm').onclick = async () => {
      const qtyInput = document.getElementById('restock-qty');
      const val = parseInt(qtyInput.value);
      if (isNaN(val) || val <= 0) {
        showToast('Ingrese un número válido mayor a 0', true);
        return;
      }

      try {
        const res = await fetch('/api/stock/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: item.id,
            stockToAdd: val
          })
        });

        if (!res.ok) {
          showToast('Error al reabastecer el stock en el servidor', true);
          return;
        }

        showToast(`${item.name} reabastecido con éxito`);
        modal.remove();
        await loadState();
        renderInventory();
      } catch (error) {
        console.error(error);
        showToast('Error al conectar con el servidor', true);
      }
    };
  };

  const showEditInventoryModal = (id) => {
    const item = getStockItem(id);
    if (!item) return;

    const modal = document.createElement('div');
    modal.className = 'pos-modal-overlay';
    modal.innerHTML = `
      <div class="inventory-modal">
        <h2 style="font-family: var(--font-cursive); font-size: 1.8rem;">Editar Insumo</h2>
        <p style="color:var(--text-secondary); font-size:0.9rem;">${item.name}</p>
        
        <div class="form-group">
          <label>Precio por Porción ($)</label>
          <input type="number" id="edit-price" class="form-control" value="${item.price}" min="0">
        </div>
        
        <div class="form-group">
          <label>Umbral Mínimo (Alerta de Stock)</label>
          <input type="number" id="edit-min" class="form-control" value="${item.minStock}" min="0">
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" id="edit-cancel" style="padding: 0.6rem 1.2rem;">Cancelar</button>
          <button class="btn-primary" id="edit-confirm" style="padding: 0.6rem 1.2rem;">Guardar Cambios</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('edit-cancel').onclick = () => modal.remove();
    document.getElementById('edit-confirm').onclick = async () => {
      const priceVal = parseInt(document.getElementById('edit-price').value);
      const minVal = parseInt(document.getElementById('edit-min').value);

      if (isNaN(priceVal) || priceVal < 0 || isNaN(minVal) || minVal < 0) {
        showToast('Ingrese valores válidos', true);
        return;
      }

      try {
        const res = await fetch('/api/stock/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: item.id,
            price: priceVal,
            minStock: minVal
          })
        });

        if (!res.ok) {
          showToast('Error al actualizar el insumo en el servidor', true);
          return;
        }

        showToast('Cambios guardados en base de datos');
        modal.remove();
        await loadState();
        renderInventory();
      } catch (error) {
        console.error(error);
        showToast('Error al conectar con el servidor', true);
      }
    };
  };

  // --- LOGICA DE ANALÍTICAS Y REPORTES ---
  const renderAnalytics = () => {
    const activeSales = sales.filter(s => s.status === 'completed');
    const totalEarnings = activeSales.reduce((sum, s) => sum + s.total, 0);
    const totalOrders = activeSales.length;
    const avgTicket = totalOrders > 0 ? totalEarnings / totalOrders : 0;
    
    const toppingCounts = {};
    sales.forEach(sale => {
      if (sale.status !== 'completed') return;
      sale.items.forEach(item => {
        if (item.details) {
          stock.toppings.forEach(top => {
            if (item.details.includes(top.name)) {
              toppingCounts[top.name] = (toppingCounts[top.name] || 0) + 1;
            }
          });
        }
      });
    });

    let bestTopping = 'Ninguno';
    let maxToppingCount = 0;
    for (const name in toppingCounts) {
      if (toppingCounts[name] > maxToppingCount) {
        maxToppingCount = toppingCounts[name];
        bestTopping = name;
      }
    }

    document.getElementById('stat-earnings').textContent = formatCurrency(totalEarnings);
    document.getElementById('stat-orders').textContent = totalOrders;
    document.getElementById('stat-ticket').textContent = formatCurrency(avgTicket);
    document.getElementById('stat-topping').textContent = bestTopping === 'Ninguno' ? 'N/A' : `${bestTopping} (${maxToppingCount} u)`;

    renderSalesChart(activeSales);
    renderToppingsRanking(toppingCounts);
    renderTransactionsTable();
  };

  const renderSalesChart = (activeSales) => {
    const chartContainer = document.getElementById('sales-bar-chart');
    if (!chartContainer) return;

    chartContainer.innerHTML = '';

    const dailySales = {};
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateString = d.toDateString();
      dailySales[dateString] = {
        label: `${dayNames[d.getDay()]} ${d.getDate()}`,
        amount: 0
      };
    }

    activeSales.forEach(sale => {
      const saleDate = new Date(sale.date).toDateString();
      if (dailySales[saleDate]) {
        dailySales[saleDate].amount += sale.total;
      }
    });

    const values = Object.values(dailySales).map(d => d.amount);
    const maxVal = Math.max(...values, 1000);

    for (const dateStr in dailySales) {
      const dayData = dailySales[dateStr];
      const heightPercent = (dayData.amount / maxVal) * 100;

      const barWrapper = document.createElement('div');
      barWrapper.className = 'chart-bar-wrapper';
      barWrapper.innerHTML = `
        <div class="chart-bar" style="height: ${heightPercent}%;">
          <span class="chart-bar-tooltip">${formatCurrency(dayData.amount)}</span>
        </div>
        <div class="chart-label">${dayData.label}</div>
      `;

      chartContainer.appendChild(barWrapper);
    }
  };

  const renderToppingsRanking = (toppingCounts) => {
    const rankingContainer = document.getElementById('topping-ranking-container');
    if (!rankingContainer) return;

    rankingContainer.innerHTML = '';

    const sortedToppings = Object.entries(toppingCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (sortedToppings.length === 0) {
      rankingContainer.innerHTML = '<div style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding: 20px 0;">No hay datos de ingredientes aún</div>';
      return;
    }

    const maxCount = sortedToppings[0][1];

    sortedToppings.forEach(([name, count]) => {
      const pct = (count / maxCount) * 100;
      const item = document.createElement('div');
      item.className = 'ranking-item';
      item.innerHTML = `
        <div class="ranking-item-header">
          <span>${name}</span>
          <span style="color:var(--neon-pink);">${count} porciones</span>
        </div>
        <div class="ranking-bar-bg">
          <div class="ranking-bar-fill" style="width: ${pct}%;"></div>
        </div>
      `;
      rankingContainer.appendChild(item);
    });
  };

  const renderTransactionsTable = () => {
    const container = document.getElementById('transactions-table-body');
    if (!container) return;

    container.innerHTML = '';

    sales.forEach(sale => {
      const tr = document.createElement('tr');
      const dateFormatted = new Date(sale.date).toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
      const itemsList = sale.items.map(i => i.name).join(' + ');

      tr.innerHTML = `
        <td style="color:var(--text-muted); font-size:0.8rem;">${dateFormatted}</td>
        <td style="font-weight:600; max-width:240px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${itemsList}">${itemsList}</td>
        <td style="color:var(--neon-cyan); font-weight:700;">${formatCurrency(sale.total)}</td>
        <td style="font-size:0.8rem; color:var(--text-secondary);">${sale.paymentMethod}</td>
        <td>
          ${sale.status === 'completed' 
            ? `<button class="refund-btn" data-sale-id="${sale.id}">Devolver</button>` 
            : `<span class="badge-refunded">Reembolsado</span>`}
        </td>
      `;

      container.appendChild(tr);
    });

    container.querySelectorAll('.refund-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-sale-id');
        refundSale(id);
      };
    });
  };

  // Reembolsar venta enviando POST a la API
  const refundSale = async (saleId) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    if (confirm(`¿Está seguro de reembolsar la venta por ${formatCurrency(sale.total)}? Los insumos volverán a sumarse al stock.`)) {
      try {
        const res = await fetch('/api/sales/refund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ saleId })
        });

        const data = await res.json();
        
        if (!res.ok) {
          showToast(data.error || 'Error al reembolsar la venta en el servidor', true);
          return;
        }

        showToast('Venta reembolsada y stock restituido');
        await loadState();
        renderAnalytics();
      } catch (error) {
        console.error(error);
        showToast('Error al conectar con el servidor', true);
      }
    }
  };

  // Exportar reporte CSV
  const exportBtn = document.getElementById('export-report-btn');
  if (exportBtn) {
    exportBtn.onclick = () => {
      if (sales.length === 0) {
        showToast('No hay transacciones para exportar', true);
        return;
      }

      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'ID Venta,Fecha,Productos,Total Venta,Metodo Pago,Estado\n';

      sales.forEach(sale => {
        const prodNames = sale.items.map(i => i.name).join(' | ');
        const dateStr = new Date(sale.date).toLocaleString('es-AR');
        csvContent += `"${sale.id}","${dateStr}","${prodNames}",${sale.total},"${sale.paymentMethod}","${sale.status}"\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `reporte_ventas_srwaffle_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Reporte CSV descargado con éxito');
    };
  }

  // --- COMPROBACIÓN DE AUTENTICACIÓN AL CARGAR ---
  if (sessionStorage.getItem('admin_authenticated')) {
    switchAdminView('pos');
  } else {
    showPinModal();
  }
});
