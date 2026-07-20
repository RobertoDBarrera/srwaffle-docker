// Lógica del Módulo de Caja POS - Sr. Waffle (Versión 2 - Modelo Relacional Estricto)

// --- INTERCEPTOR DE FETCH PARA JWT ---
const originalFetch = window.fetch;
window.fetch = async function() {
  let [resource, config] = arguments;
  if(config === undefined) { config = {}; }
  if(config.headers === undefined) { config.headers = {}; }
  const token = sessionStorage.getItem('caja_jwt_token');
  if(token) { config.headers['Authorization'] = 'Bearer ' + token; }
  
  const response = await originalFetch(resource, config);
  if (response.status === 401 && resource !== '/api/auth/verify-cashier') {
    // Token expirado o inválido
    sessionStorage.removeItem('caja_authenticated');
    sessionStorage.removeItem('caja_jwt_token');
    document.getElementById('caja-login-overlay').style.display = 'flex';
  }
  return response;
};

document.addEventListener('DOMContentLoaded', () => {
    
    // Check Demo Mode
    fetch('/api/demo/status').then(r=>r.json()).then(d=>{
      const banner = document.getElementById('demo-banner');
      if(banner) banner.style.display = d.isDemoMode ? 'block' : 'none';
    }).catch(e=>console.error(e));

    let stock = [];
  let masas = [];
  let waffles = [];
  let menu = [];
  
  let cart = [];
  let currentKioskOrderId = null;
  let selectedPaymentMethod = 'Efectivo';
  let loyaltyEnabled = false;
  let loyaltyPointsThreshold = 100;
  let currentLoyaltyCustomer = null;
  
  let pinInput = '';
  let posWaffle = {
    base: '', // masa_id
    toppings: [], // ids de stock
    syrups: [],
    icecreams: []
  };

  const toast = document.getElementById('toast');
  const loginOverlay = document.getElementById('caja-login-overlay');
  const cartItemsContainer = document.getElementById('pos-cart-items');
  const checkoutBtn = document.getElementById('pos-checkout-btn');

  const showToast = (msg, isError = false) => {
    toast.textContent = msg;
    toast.className = 'toast-notification' + (isError ? ' error' : '');
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 3000);
  };
  const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val);

  const getStockItem = (id) => stock.find(i => i.id === id);
  const getMasa = (id) => masas.find(m => m.id === id);

  const calculateWafflePrice = (config) => {
    // Las masas no tienen precio de venta, el precio lo define el POS o el waffle
    // Pero en Waffles Personalizados, cobramos $1500 de base (Masa)
    let price = 1500; 
    
    if (config.spread) {
      const s = getStockItem(config.spread);
      if (s) price += s.price_per_portion || 0;
    }
    if (config.whippedCream) {
      const s = getStockItem('top_crema_batida');
      if (s) price += s.price_per_portion || 0;
    }

    config.toppings.forEach(id => {
      const s = getStockItem(id);
      if (s) price += s.price_per_portion || 0;
    });
    config.syrups.forEach(id => {
      const s = getStockItem(id);
      if (s) price += s.price_per_portion || 0;
    });
    config.icecreams.forEach(id => {
      if (!id || id === 'none') return;
      const s = getStockItem(id);
      if (s) price += s.price_per_portion || s.price || 0;
    });
    return price;
  };

  const loadState = async () => {
    try {
      const [stkRes, masRes, wafRes, menuRes, compRes] = await Promise.all([
        fetch('/api/stock'), fetch('/api/masas'), fetch('/api/waffles'), fetch('/api/menu'), fetch('/api/company/info')
      ]);
      stock = await stkRes.json();
      masas = await masRes.json();
      waffles = await wafRes.json();
      menu = await menuRes.json();
      
      const companyInfo = await compRes.json();
      
      const pmContainer = document.getElementById('pos-payment-methods');
      if (pmContainer) {
        pmContainer.innerHTML = '';
        const methods = companyInfo.paymentMethods || [
          {name: 'Efectivo', enabled: true},
          {name: 'Tarjeta de Débito', enabled: true},
          {name: 'Tarjeta de Crédito', enabled: true}
        ];
        
        let firstSelected = false;
        methods.forEach(m => {
          if (m.enabled) {
            const btn = document.createElement('button');
            btn.className = 'payment-btn';
            btn.setAttribute('data-method', m.name);
            btn.textContent = m.name;
            
            if (!firstSelected) {
              btn.classList.add('selected');
              selectedPaymentMethod = m.name;
              firstSelected = true;
            }
            
            btn.onclick = (e) => {
              document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('selected'));
              e.target.classList.add('selected');
              selectedPaymentMethod = m.name;
            };
            
            pmContainer.appendChild(btn);
          }
        });
      }
    } catch (e) {
      console.error(e);
      showToast('Error al cargar datos', true);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      if (res.ok) {
        const emps = await res.json();
        const select = document.getElementById('caja-employee-select');
        if (select) {
          select.innerHTML = '<option value="">Caja Principal (Global)</option>';
          const cashiers = emps.filter(e => e.active && e.role !== 'kitchen');
          cashiers.forEach(e => {
            select.innerHTML += `<option value="${e.id}">${e.name}</option>`;
          });
        }
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };
  
  fetchEmployees();

  // Auth Logic
  const updatePinDots = () => {
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById(`dot-${i}`);
      if (i < pinInput.length) dot.classList.add('filled');
      else dot.classList.remove('filled');
    }
  };

  const handlePinKey = async (num) => {
    if (pinInput.length < 4) { pinInput += num; updatePinDots(); }
    if (pinInput.length === 4) {
      setTimeout(async () => {
        try {
          const select = document.getElementById('caja-employee-select');
          const empId = select ? select.value : undefined;
          const res = await fetch('/api/auth/verify-cashier', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employeeId: empId, pin: pinInput })
          });
          const data = await res.json();
          if (data.success) {
            sessionStorage.setItem('caja_authenticated', 'true');
            sessionStorage.setItem('caja_jwt_token', data.token);
            sessionStorage.setItem('caja_cashier_name', data.cashierName || 'Caja');
            loginOverlay.style.display = 'none';
            showToast('Caja abierta');
            pinInput = ''; updatePinDots();
            await startCaja();
          } else {
            showToast('PIN Incorrecto', true);
            pinInput = ''; updatePinDots();
          }
        } catch (e) { showToast('Error', true); pinInput = ''; updatePinDots(); }
      }, 200);
    }
  };

  document.querySelectorAll('.pin-btn[data-num]').forEach(btn => {
    btn.addEventListener('click', () => handlePinKey(btn.getAttribute('data-num')));
  });
  document.querySelector('.pin-clear').addEventListener('click', () => { if (pinInput.length>0) { pinInput=pinInput.slice(0,-1); updatePinDots(); }});
  document.querySelector('.pin-clear-all').addEventListener('click', () => { pinInput=''; updatePinDots(); });
  document.getElementById('caja-logout').addEventListener('click', () => { sessionStorage.removeItem('caja_authenticated'); sessionStorage.removeItem('caja_jwt_token'); loginOverlay.style.display='flex'; });

  // Soporte para teclado físico en el PIN
  document.addEventListener('keydown', (e) => {
    if (loginOverlay.style.display !== 'none') {
      if (e.key >= '0' && e.key <= '9') {
        handlePinKey(e.key);
      } else if (e.key === 'Backspace') {
        if (pinInput.length > 0) { pinInput = pinInput.slice(0, -1); updatePinDots(); }
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        pinInput = ''; updatePinDots();
      }
    }
  });

  const startCaja = async () => { await loadState(); renderPOS(); };

  const renderPOS = () => {
    renderPOSCatalog();
    renderCart();
  };

  const renderPOSCatalog = () => {
    const menuGrid = document.getElementById('pos-menu-grid');
    if (menuGrid) {
      menuGrid.innerHTML = '';
      menu.filter(m => m.type === 'waffle').forEach(m => {
        if (!m.is_visible) return;
        const w = waffles.find(x => x.id === m.reference_id);
        if (!w) return;
        
        // Check stock availability based on strict recipe
        let canSell = true;
        for (const ing of w.ingredients) {
          if (ing.type === 'masa') {
            const mas = getMasa(ing.id);
            if (!mas || mas.stock < ing.qty) canSell = false;
          } else if (ing.type === 'stock') {
            const s = getStockItem(ing.id);
            if (!s || s.stock < ing.qty) canSell = false; // assumes ing.qty is in standard unit (g/ml)
          }
        }

        const card = document.createElement('div');
        card.className = 'pos-item-card' + (!canSell ? ' out-of-stock' : '');
        card.innerHTML = `
          ${w.image ? `<img src="/${w.image}" class="pos-item-img-thumbnail">` : ''}
          <div class="pos-item-card-content">
            <div class="pos-item-name">${m.name}</div>
            <div class="pos-item-price">${formatCurrency(m.price)}</div>
            <div class="pos-item-stock">${canSell ? 'Disponible' : 'Sin Insumos'}</div>
          </div>
        `;
        if (canSell) {
          card.onclick = () => addToCart({ id: m.id, name: m.name, details: w.description, price: m.price, type: 'menu_waffle', config: w });
        }
        menuGrid.appendChild(card);
      });
    }

    const drinksGrid = document.getElementById('pos-drinks-grid');
    if (drinksGrid) {
      drinksGrid.innerHTML = '';
      menu.filter(m => m.type === 'direct').forEach(md => {
        if (!md.is_visible) return;
        const stk = getStockItem(md.reference_id);
        const card = document.createElement('div');
        card.className = 'pos-item-card' + (!stk || stk.stock <= 0 ? ' out-of-stock' : '');
        card.innerHTML = `
          ${md.image ? `<img src="/${md.image}" class="pos-item-img-thumbnail">` : ''}
          <div class="pos-item-card-content">
            <div class="pos-item-name">${md.name}</div>
            <div class="pos-item-price">${formatCurrency(md.price)}</div>
            <div class="pos-item-stock">${stk ? `Stock: ${Math.floor(stk.stock / (stk.portion_size||1))} un` : 'N/A'}</div>
          </div>
        `;
        if (stk && stk.stock > 0) {
          card.onclick = () => addToCart({ id: md.reference_id, name: md.name, details: 'Venta Directa', price: md.price, type: 'direct' });
        }
        drinksGrid.appendChild(card);
      });
    }

    const customBtn = document.getElementById('pos-custom-waffle-btn');
    if (customBtn) customBtn.onclick = showPOSWaffleBuilderModal;
  };
  // --- VISUALIZADOR DE WAFFLE EN POS ---
  const updatePOSVisualWaffle = (wrapperId, config) => {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;

    const backElement = wrapper.querySelector('.waffle-back');
    const frontElement = wrapper.querySelector('.waffle-front');
    const toppingsContainer = wrapper.querySelector('.visual-toppings-container');
    const chocolateOverlay = wrapper.querySelector('.syrup-chocolate');
    const dulceOverlay = wrapper.querySelector('.syrup-dulce-leche');
    const caramelOverlay = wrapper.querySelector('.syrup-caramelo');
    const redOverlay = wrapper.querySelector('.syrup-rojo');
    const spreadOverlay = wrapper.querySelector('.spread-overlay');
    const whippedCreamOverlay = wrapper.querySelector('.visual-whipped-cream');

    const baseId = config.base || 'base_tradicional';
    const baseClass = `base-${baseId.replace('base_', '').replace(/_/g, '-')}`;
    if (backElement) {
      backElement.className = `waffle-back ${baseClass}`;
    }
    if (frontElement) {
      frontElement.className = `waffle-front ${baseClass}`;
    }

    if (spreadOverlay) {
      spreadOverlay.className = 'spread-overlay';
      if (config.spread) {
        const spreadItem = getStockItem(config.spread);
        if (spreadItem) {
          const name = spreadItem.name.toLowerCase();
          if (name.includes('nutella') || name.includes('choc')) spreadOverlay.classList.add('active-nutella');
          else spreadOverlay.classList.add('active-dulce');
        }
      }
    }

    if (chocolateOverlay) chocolateOverlay.classList.remove('active');
    if (dulceOverlay) dulceOverlay.classList.remove('active');
    if (caramelOverlay) caramelOverlay.classList.remove('active');
    if (redOverlay) redOverlay.classList.remove('active');

    config.syrups.forEach(syrupId => {
       const sItem = getStockItem(syrupId);
       if (sItem) {
         const name = sItem.name.toLowerCase();
         if (name.includes('choc') && chocolateOverlay) chocolateOverlay.classList.add('active');
         else if (name.includes('dulce') && dulceOverlay) dulceOverlay.classList.add('active');
         else if ((name.includes('rojo') || name.includes('red') || name.includes('frut')) && redOverlay) redOverlay.classList.add('active');
         else if (caramelOverlay) caramelOverlay.classList.add('active');
       }
    });

    if (whippedCreamOverlay) {
      if (config.whippedCream) whippedCreamOverlay.classList.add('active');
      else whippedCreamOverlay.classList.remove('active');
    }

    if (toppingsContainer) {
      toppingsContainer.innerHTML = '';
      config.toppings.forEach(toppingId => {
        const itemStock = getStockItem(toppingId);
        if (!itemStock) return;
        const name = itemStock.name.toLowerCase();

        for (let k = 0; k < 8; k++) {
          const toppingElement = document.createElement('div');
          toppingElement.className = `visual-topping-item vt-${toppingId}`;
          const x = 100 + Math.random() * 120 - 12;
          const y = 60 + Math.random() * 110 - 12;
          const randomRotation = Math.floor(Math.random() * 360);
          
          toppingElement.style.left = `${x}px`;
          toppingElement.style.top = `${y}px`;
          toppingElement.style.setProperty('--rot', `${randomRotation}deg`);
          
          if (name.includes('rocklet') || name.includes('lentil') || name.includes('color')) {
            toppingElement.classList.add('topping-rocklet');
            const rockletColors = ['#e63946', '#fee440', '#00f5d4', '#ff007f', '#a020f0', '#0077b6'];
            toppingElement.style.setProperty('--rocklet-color', rockletColors[Math.floor(Math.random() * rockletColors.length)]);
          } else if (name.includes('oreo') || name.includes('gallet')) {
            toppingElement.classList.add('topping-oreo');
          } else if (name.includes('choc') || name.includes('ralladura')) {
            toppingElement.classList.add('topping-shaving');
          } else if (name.includes('frutil') || name.includes('mora') || name.includes('red') || name.includes('rojo')) {
            toppingElement.classList.add('topping-berry');
          } else {
            toppingElement.classList.add('topping-generic');
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
          const sItem = getStockItem(iceId);
          if (!sItem) return;

          const name = sItem.name.toLowerCase();
          const scoop = document.createElement('div');
          scoop.className = `visual-icecream-scoop scoop-${index}`;
          
          if (name.includes('vainilla') || name.includes('crema') || name.includes('blanco')) {
            scoop.style.backgroundColor = '#f3e5ab';
            scoop.style.borderColor = '#d4c58a';
          } else if (name.includes('choc')) {
            scoop.style.backgroundColor = '#4e342e';
            scoop.style.borderColor = '#3e2723';
          } else if (name.includes('dulce') || name.includes('caramel')) {
            scoop.style.backgroundColor = '#d2691e';
            scoop.style.borderColor = '#b87333';
          } else if (name.includes('frutil') || name.includes('red') || name.includes('rojo') || name.includes('cereza') || name.includes('rosa')) {
            scoop.style.backgroundColor = '#f1b6c8';
            scoop.style.borderColor = '#e294aa';
          } else {
            scoop.style.backgroundColor = '#e8d5f0';
            scoop.style.borderColor = '#cba3d8';
          }
          icecreamsContainer.appendChild(scoop);
        });
      }
    }
  };

  const showPOSWaffleBuilderModal = () => {
    posWaffle = { base: masas.length ? masas[0].id : '', toppings: [], syrups: [], icecreams: [] };
    const modal = document.createElement('div');
    modal.className = 'pos-modal-overlay';
    modal.innerHTML = `
      <div class="pos-waffle-modal">
        <div class="pos-waffle-modal-left" style="background:#111; display:flex; flex-direction:column; align-items:center; justify-content:center;">
           <h3 style="color:var(--neon-cyan); margin-bottom: 2rem;">Personalizador Visual (BETA)</h3>
           <div class="waffle-canvas-wrapper" id="pos-waffle-canvas-wrapper" style="width: 380px; height: 380px; transform: scale(0.9);">
             <div class="builder-neon-glow"></div>
             <div class="waffle-assembly-box" style="position: relative; width: 320px; height: 320px; z-index: 2;">
               <div class="waffle-back">
                 <div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div>
                 <div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div>
                 <div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div>
                 <div class="waffle-bubble"></div>
               </div>
               <div class="spread-overlay" id="pos-spread-overlay"></div>
               <div class="syrup-overlay syrup-chocolate"></div>
               <div class="syrup-overlay syrup-dulce-leche"></div>
               <div class="syrup-overlay syrup-caramelo"></div>
               <div class="syrup-overlay syrup-rojo"></div>
               <div class="visual-whipped-cream" id="pos-visual-whipped-cream"></div>
               <div class="visual-icecreams-container"></div>
               <div class="waffle-front">
                 <div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div>
                 <div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div>
                 <div class="waffle-bubble"></div><div class="waffle-bubble"></div><div class="waffle-bubble"></div>
                 <div class="waffle-bubble"></div><div class="waffle-bubble"></div>
               </div>
               <div class="visual-toppings-container"></div>
             </div>
           </div>
        </div>
        <div class="pos-waffle-modal-right" style="overflow-y: auto; max-height: 90vh; padding-right: 10px;">
          <h2 style="font-family: var(--font-cursive); font-size: 2rem;">Armador POS</h2>
          
          <div class="builder-step">
            <h3>Paso 1: Masa</h3>
            <div style="margin-bottom: 0.5rem;">
              <select id="pos-bases-select" class="form-control" style="background:#181818; border: 1px solid rgba(255,255,255,0.1); color:#fff; width:100%; border-radius:6px; padding:0.6rem; font-size:0.9rem; font-weight:600;">
              </select>
            </div>
          </div>

          <div class="builder-step">
            <h3>Paso 2: Relleno</h3>
            <div style="margin-bottom: 0.5rem;">
              <select id="pos-spreads-select" class="form-control" style="background:#181818; border: 1px solid rgba(255,255,255,0.1); color:#fff; width:100%; border-radius:6px; padding:0.6rem; font-size:0.9rem; font-weight:600;">
              </select>
            </div>
          </div>

          <div class="builder-step">
            <h3>Paso 3: Helado (Hasta 3 bochas)</h3>
            <div style="margin-bottom: 0.5rem;">
              <select id="pos-icecream-count" style="background:#181818; border: 1px solid rgba(255,255,255,0.1); color:#fff; width:100%; border-radius:6px; padding:0.6rem; font-size:0.9rem; font-weight:600;">
                <option value="0">Sin helado</option>
                <option value="1">1 bocha de helado</option>
                <option value="2">2 bochas de helado</option>
                <option value="3">3 bochas de helado</option>
              </select>
            </div>
            <div id="pos-icecreams-flavor-selectors" style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">
            </div>
          </div>

          <div class="builder-step">
            <h3>Paso 4: Toppings Extras (Hasta 4)</h3>
            <div class="builder-options-grid" id="pos-toppings-grid"></div>
          </div>

          <div class="builder-step">
            <h3>Paso 5: ¿Querés Crema Batida?</h3>
            <div style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
              <input type="checkbox" id="pos-whipped-cream-check" style="transform: scale(1.5);">
              <label for="pos-whipped-cream-check" style="margin: 0; font-size: 1rem; color: #fff; cursor: pointer;">Sí, agregar crema batida</label>
            </div>
          </div>

          <div class="builder-step">
            <h3>Paso 6: Salsas (Hasta 2)</h3>
            <div class="builder-options-grid" id="pos-syrups-grid"></div>
          </div>
          
          <div class="price-summary-box" style="margin-top:auto; margin-bottom: 15px;">
            <div class="price-summary-title">Total Waffle</div>
            <div class="price-summary-value" id="pos-modal-price-value">$0</div>
          </div>
          
          <div class="modal-actions">
            <button class="btn-secondary" id="pos-modal-cancel">Cancelar</button>
            <button class="btn-primary" id="pos-modal-add">Agregar al Pedido</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const updateUI = () => {
      document.getElementById('pos-modal-price-value').textContent = formatCurrency(calculateWafflePrice(posWaffle));
      updatePOSVisualWaffle('pos-waffle-canvas-wrapper', posWaffle);
    };

    const renderGrid = (id, items, type, multi) => {
      const grid = document.getElementById(id);
      if (!grid) return;
      grid.innerHTML = '';
      items.forEach(i => {
        const c = document.createElement('div');
        c.className = 'option-card' + (i.stock <= 0 ? ' out-of-stock' : '');
        c.innerHTML = `
          <div class="option-name">${i.name}</div>
          <div class="option-price">${i.price_per_portion > 0 ? '+ ' + formatCurrency(i.price_per_portion) : (type==='masa' ? 'Incluido' : 'Gratis')}</div>
        `;
        let sel = false;
        if (!multi) sel = posWaffle.base === i.id;
        else sel = posWaffle[type].includes(i.id);
        if (sel) c.classList.add('selected');

        if (i.stock > 0) {
          c.onclick = () => {
            if (!multi) posWaffle.base = i.id;
            else {
              if (sel) posWaffle[type] = posWaffle[type].filter(x => x !== i.id);
              else {
                 if (type === 'toppings' && posWaffle[type].length >= 4) { showToast('Máximo 4 toppings', true); return; }
                 if (type === 'syrups' && posWaffle[type].length >= 2) { showToast('Máximo 2 salsas', true); return; }
                 posWaffle[type].push(i.id);
              }
            }
            renderGrid(id, items, type, multi);
            updateUI();
          };
        }
        grid.appendChild(c);
      });
    };

    // Paso 1: Masa Select
    const basesSelect = document.getElementById('pos-bases-select');
    if (basesSelect) {
      basesSelect.innerHTML = `<option value="">-- Seleccionar Masa --</option>` + 
        masas.map(b => `<option value="${b.id}" ${b.stock <= 0 ? 'disabled style="color:gray;"' : ''}>${b.name} (${b.price_per_portion > 0 ? '+'+formatCurrency(b.price_per_portion) : 'Incluido'})${b.stock <= 0 ? ' [SIN STOCK]' : ''}</option>`).join('');
      basesSelect.onchange = () => { posWaffle.base = basesSelect.value; updateUI(); };
      posWaffle.base = basesSelect.value;
    }

    // Paso 2: Relleno Select
    const spreadsSelect = document.getElementById('pos-spreads-select');
    if (spreadsSelect) {
      const spreads = stock.filter(s => s.category === 'spread');
      spreadsSelect.innerHTML = `<option value="">Sin Relleno</option>` + 
        spreads.map(b => `<option value="${b.id}" ${b.stock <= 0 ? 'disabled style="color:gray;"' : ''}>${b.name} (${b.price_per_portion > 0 ? '+'+formatCurrency(b.price_per_portion) : 'Gratis'})${b.stock <= 0 ? ' [SIN STOCK]' : ''}</option>`).join('');
      spreadsSelect.onchange = () => { posWaffle.spread = spreadsSelect.value; updateUI(); };
      posWaffle.spread = spreadsSelect.value;
    }

    // Paso 3: Helados
    const icecreamCountSelect = document.getElementById('pos-icecream-count');
    const flavorSelectorsContainer = document.getElementById('pos-icecreams-flavor-selectors');
    const icecreamsStock = stock.filter(s => s.category === 'icecream');
    
    const updateFlavorSelectors = () => {
      const count = parseInt(icecreamCountSelect.value) || 0;
      flavorSelectorsContainer.innerHTML = '';
      while (posWaffle.icecreams.length < count) {
        const firstAvailable = icecreamsStock.find(i => i.stock > 0);
        posWaffle.icecreams.push(firstAvailable ? firstAvailable.id : '');
      }
      while (posWaffle.icecreams.length > count) { posWaffle.icecreams.pop(); }

      for (let i = 0; i < count; i++) {
        const div = document.createElement('div');
        div.style.display = 'flex'; div.style.flexDirection = 'column'; div.style.gap = '4px';
        div.innerHTML = `
          <label style="font-size:0.75rem; color:var(--text-secondary);">Sabor de la Bocha ${i + 1}</label>
          <select class="pos-icecream-flavor-select form-control" data-index="${i}" style="background:#181818; border:1px solid rgba(255,255,255,0.1); color:#fff; padding:0.5rem; border-radius:6px; font-size:0.85rem; width:100%;">
            ${icecreamsStock.map(ice => {
              const isOutOfStock = ice.stock <= 0;
              return `<option value="${ice.id}" ${posWaffle.icecreams[i] === ice.id ? 'selected' : ''} ${isOutOfStock ? 'disabled style="color:gray;"' : ''}>${ice.name} (${formatCurrency(ice.price_per_portion || ice.price || 0)})${isOutOfStock ? ' [SIN STOCK]' : ''}</option>`;
            }).join('')}
          </select>
        `;
        flavorSelectorsContainer.appendChild(div);
      }
      flavorSelectorsContainer.querySelectorAll('.pos-icecream-flavor-select').forEach(select => {
        select.onchange = () => { posWaffle.icecreams[parseInt(select.getAttribute('data-index'))] = select.value; updateUI(); };
      });
    };
    if (icecreamCountSelect) {
      icecreamCountSelect.value = "0";
      icecreamCountSelect.onchange = () => { updateFlavorSelectors(); updateUI(); };
      updateFlavorSelectors();
    }

    // Paso 4: Toppings Extras (Max 4)
    renderGrid('pos-toppings-grid', stock.filter(s => s.category === 'topping'), 'toppings', true);
    
    // Paso 5: Crema Batida
    const whippedCreamCheck = document.getElementById('pos-whipped-cream-check');
    if (whippedCreamCheck) {
      whippedCreamCheck.onchange = (e) => { posWaffle.whippedCream = e.target.checked; updateUI(); };
    }

    // Paso 6: Salsas (Max 2)
    renderGrid('pos-syrups-grid', stock.filter(s => s.category === 'syrup'), 'syrups', true);
    
    updateUI();

    document.getElementById('pos-modal-cancel').onclick = () => modal.remove();
    document.getElementById('pos-modal-add').onclick = () => {
      const price = calculateWafflePrice(posWaffle);
      const m = getMasa(posWaffle.base);
      let details = `Masa: ${m ? m.name : 'N/A'}`;
      if (posWaffle.spread) details += ` + Relleno: ${getStockItem(posWaffle.spread)?.name || 'N/A'}`;
      if (posWaffle.icecreams.length) details += ` + Helado: ${posWaffle.icecreams.map(id=>getStockItem(id)?.name).join(',')}`;
      if (posWaffle.toppings.length) details += ` + Toppings: ${posWaffle.toppings.map(id=>getStockItem(id)?.name).join(',')}`;
      if (posWaffle.whippedCream) details += ` + Crema`;
      if (posWaffle.syrups.length) details += ` + Salsas: ${posWaffle.syrups.map(id=>getStockItem(id)?.name).join(',')}`;
      
      addToCart({
        id: `custom_${Date.now()}`, name: 'Waffle Customizado', details, price, type: 'custom_waffle', config: posWaffle
      });
      modal.remove();
    };
  };

  const addToCart = (item) => {
    cart.push(item); showToast(`${item.name} agregado`); renderCart();
  };

  const renderCart = () => {
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = '';
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<div class="cart-empty-msg">Pedido vacío</div>';
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
            <button class="cart-remove-btn" data-index="${index}">X</button>
          </div>
        `;
        cartItemsContainer.appendChild(row);
      });
      cartItemsContainer.querySelectorAll('.cart-remove-btn').forEach(btn => {
        btn.onclick = () => { cart.splice(btn.getAttribute('data-index'), 1); renderCart(); };
      });
    }
    const total = cart.reduce((s, i) => s + i.price, 0);
    document.getElementById('pos-total').textContent = formatCurrency(total);
    
    document.querySelectorAll('.payment-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.getAttribute('data-method') === selectedPaymentMethod);
      btn.onclick = () => { selectedPaymentMethod = btn.getAttribute('data-method'); renderCart(); };
    });
  };

  const recoverOrderModal = document.getElementById('recover-order-modal');
  const recoverOrderInput = document.getElementById('recover-order-code-input');
  const recoverOrderSubmit = document.getElementById('recover-order-submit');
  const recoverOrderClose = document.getElementById('recover-order-close');

  const recoverKioskOrder = async () => {
    if (recoverOrderModal && recoverOrderInput) {
      recoverOrderInput.value = '';
      recoverOrderModal.style.display = 'flex';
      recoverOrderInput.focus();
    }
  };

  if (recoverOrderClose) {
    recoverOrderClose.onclick = () => {
      recoverOrderModal.style.display = 'none';
    };
  }

  if (recoverOrderSubmit && recoverOrderInput) {
    recoverOrderSubmit.onclick = async () => {
      const code = recoverOrderInput.value.trim();
      if (!code) return;
      
      try {
        const res = await fetch(`/api/kiosk-orders/${code}`);
        if (!res.ok) {
          showToast('Pedido no encontrado o ya cobrado', true);
          return;
        }
        const order = await res.json();
        
        // Load cart
        cart = [...cart, ...order.cart];
        currentKioskOrderId = code;
        
        // Update UI
        const badge = document.getElementById('kiosk-order-badge');
        const badgeId = document.getElementById('kiosk-order-badge-id');
        if (badge && badgeId) {
          badgeId.textContent = currentKioskOrderId;
          badge.style.display = 'block';
        }
        
        showToast(`Pedido #${currentKioskOrderId} recuperado`);
        recoverOrderModal.style.display = 'none';
        renderCart();
      } catch (e) {
        showToast('Error de conexión', true);
      }
    };
  }

  const kioskRecoverBtn = document.getElementById('pos-kiosk-recover-btn');
  if (kioskRecoverBtn) {
    kioskRecoverBtn.onclick = recoverKioskOrder;
  }

  const checkoutSuccessClose = document.getElementById('checkout-success-close');
  if (checkoutSuccessClose) {
    checkoutSuccessClose.onclick = () => {
      document.getElementById('checkout-success-modal').style.display = 'none';
    };
  }

  checkoutBtn.onclick = async () => {
    if (cart.length === 0) return;
    try {
      const total = cart.reduce((s, i) => s + i.price, 0);
      const res = await fetch('/api/sales', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: cart, 
          total, 
          paymentMethod: selectedPaymentMethod, 
          cashierName: sessionStorage.getItem('caja_cashier_name'),
          customerName: currentLoyaltyCustomer ? currentLoyaltyCustomer.name : null,
          id: currentKioskOrderId
        })
      });
      if (res.ok) {
        const sale = await res.json();
        showToast('Venta Registrada Exitosamente!');
        
        // Clean up kiosk order if it was linked
        if (currentKioskOrderId) {
          try {
            await fetch(`/api/kiosk-orders/${currentKioskOrderId}`, { method: 'DELETE' });
          } catch(e) {}
          currentKioskOrderId = null;
          const badge = document.getElementById('kiosk-order-badge');
          if (badge) badge.style.display = 'none';
        }

        // Populate and show the tracking code modal
        const trackingCodeEl = document.getElementById('checkout-tracking-code');
        const successModalEl = document.getElementById('checkout-success-modal');
        if (trackingCodeEl && successModalEl) {
          trackingCodeEl.innerText = sale.sale ? sale.sale.id : sale.id;
          successModalEl.style.display = 'flex';
        }
        
        cart = []; renderCart(); loadState(); // reload stock
      } else {
        const err = await res.json();
        showToast(err.error || 'Error en la venta', true);
      }
    } catch (e) {
      showToast('Error de conexión', true);
    }
  };

  if (sessionStorage.getItem('caja_authenticated')) {
    loginOverlay.style.display = 'none';
    startCaja();
  }

  // --- BOTONES DE HEADER (AYUDA Y ÚLTIMAS VENTAS) ---
  const helpBtn = document.getElementById('help-btn');
  const helpModal = document.getElementById('help-modal');
  const helpModalClose = document.getElementById('help-modal-close');
  if (helpBtn && helpModal) {
    helpBtn.onclick = () => helpModal.style.display = 'flex';
  }
  if (helpModalClose && helpModal) {
    helpModalClose.onclick = () => helpModal.style.display = 'none';
  }

  const recentSalesBtn = document.getElementById('recent-sales-btn');
  const recentSalesModal = document.getElementById('recent-sales-modal');
  const recentSalesClose = document.getElementById('recent-sales-close');
  const recentSalesTableBody = document.getElementById('recent-sales-table-body');
  
  if (recentSalesBtn && recentSalesModal) {
    recentSalesBtn.onclick = async () => {
      try {
        const res = await fetch('/api/sales');
        if (!res.ok) throw new Error('Error fetching sales');
        const allSales = await res.json();
        
        // Filtramos solo las ventas de hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaysSales = allSales.filter(s => new Date(s.date || s.created_at) >= today);
        
        recentSalesTableBody.innerHTML = '';
        todaysSales.reverse().forEach(sale => {
            const tr = document.createElement('tr');
            const time = new Date(sale.date || sale.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const s = sale.kdsStatus || sale.status;
            let statusBadge = '<span style="color:var(--text-secondary)">Desconocido</span>';
            
            if (s === 'pending') statusBadge = '<span style="color:var(--neon-yellow)">En Cocina</span>';
            else if (s === 'preparing') statusBadge = '<span style="color:var(--neon-yellow)">Preparando</span>';
            else if (s === 'ready') statusBadge = '<span style="color:var(--neon-cyan)">Listo para entregar</span>';
            else if (s === 'delivered' || s === 'completed') statusBadge = '<span style="color:var(--neon-cyan)">Entregado</span>';
            else if (s === 'cancelled') statusBadge = '<span style="color:var(--neon-pink)">Cancelado</span>';

            tr.innerHTML = `
              <td style="font-family: monospace; font-size: 1.1rem; color: var(--neon-yellow);">#${sale.id}</td>
              <td>${time}</td>
              <td>${sale.cashier_name || sale.cashierName || 'Caja Central'}</td>
              <td>${statusBadge}</td>
              <td style="color: var(--neon-cyan); font-weight: bold;">${formatCurrency(sale.total)}</td>
            `;
            recentSalesTableBody.appendChild(tr);
          });
          
          if (todaysSales.length === 0) {
            recentSalesTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay ventas hoy</td></tr>';
          }
        
        recentSalesModal.style.display = 'flex';
      } catch (e) {
        showToast('Error al cargar ventas recientes', true);
      }
    };
  }
  if (recentSalesClose && recentSalesModal) {
    recentSalesClose.onclick = () => recentSalesModal.style.display = 'none';
  }

});
