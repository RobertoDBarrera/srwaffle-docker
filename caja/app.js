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
  let stock = [];
  let masas = [];
  let waffles = [];
  let menu = [];
  
  let cart = [];
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
      if (s) price += s.price_per_portion || 0;
    });
    return price;
  };

  const loadState = async () => {
    try {
      const [stkRes, masRes, wafRes, menuRes] = await Promise.all([
        fetch('/api/stock'), fetch('/api/masas'), fetch('/api/waffles'), fetch('/api/menu')
      ]);
      stock = await stkRes.json();
      masas = await masRes.json();
      waffles = await wafRes.json();
      menu = await menuRes.json();
    } catch (e) {
      console.error(e);
      showToast('Error al cargar datos', true);
    }
  };

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
          const res = await fetch('/api/auth/verify-cashier', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: pinInput })
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

  const showPOSWaffleBuilderModal = () => {
    posWaffle = { base: masas.length ? masas[0].id : '', toppings: [], syrups: [], icecreams: [] };
    const modal = document.createElement('div');
    modal.className = 'pos-modal-overlay';
    modal.innerHTML = `
      <div class="pos-waffle-modal">
        <div class="pos-waffle-modal-left" style="background:#111; display:flex; align-items:center; justify-content:center;">
           <h3 style="color:var(--neon-cyan)">Personalizador Visual (BETA)</h3>
        </div>
        <div class="pos-waffle-modal-right" style="overflow-y: auto; max-height: 90vh; padding-right: 10px;">
          <h2 style="font-family: var(--font-cursive); font-size: 2rem;">Armador POS</h2>
          
          <div class="builder-step">
            <h3>Paso 1: Masa ($1500 base)</h3>
            <div class="builder-options-grid" id="pos-bases-grid"></div>
          </div>
          <div class="builder-step">
            <h3>Paso 2: Toppings Extras</h3>
            <div class="builder-options-grid" id="pos-toppings-grid"></div>
          </div>
          <div class="builder-step">
            <h3>Paso 3: Salsas</h3>
            <div class="builder-options-grid" id="pos-syrups-grid"></div>
          </div>
          <div class="builder-step">
            <h3>Paso 4: Helado (Opcional)</h3>
            <div class="builder-options-grid" id="pos-icecreams-grid"></div>
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
              else posWaffle[type].push(i.id);
            }
            renderGrid(id, items, type, multi);
            updateUI();
          };
        }
        grid.appendChild(c);
      });
    };

    renderGrid('pos-bases-grid', masas, 'masa', false);
    renderGrid('pos-toppings-grid', stock.filter(s => s.category === 'topping'), 'toppings', true);
    renderGrid('pos-syrups-grid', stock.filter(s => s.category === 'syrup'), 'syrups', true);
    renderGrid('pos-icecreams-grid', stock.filter(s => s.category === 'icecream'), 'icecreams', true);
    
    updateUI();

    document.getElementById('pos-modal-cancel').onclick = () => modal.remove();
    document.getElementById('pos-modal-add').onclick = () => {
      const price = calculateWafflePrice(posWaffle);
      const m = getMasa(posWaffle.base);
      let details = `Masa: ${m ? m.name : 'N/A'}`;
      if (posWaffle.toppings.length) details += ` + Toppings: ${posWaffle.toppings.map(id=>getStockItem(id)?.name).join(',')}`;
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

  checkoutBtn.onclick = async () => {
    if (cart.length === 0) return;
    try {
      const total = cart.reduce((s, i) => s + i.price, 0);
      const res = await fetch('/api/sales', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, total, paymentMethod: selectedPaymentMethod, cashierName: sessionStorage.getItem('caja_cashier_name') })
      });
      if (res.ok) {
        showToast('Venta Registrada Exitosamente!');
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
});
