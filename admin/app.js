document.addEventListener('DOMContentLoaded', () => {
  const loginOverlay = document.getElementById('admin-login-overlay');
  const passwordInput = document.getElementById('admin-password-input');
  const loginBtn = document.getElementById('admin-login-btn');
  const toast = document.getElementById('toast');
  const showToast = (msg, isErr=false) => { toast.textContent = msg; toast.className = 'toast-notification' + (isErr ? ' error' : ''); toast.classList.add('active'); setTimeout(()=>toast.classList.remove('active'), 3000); };

  loginBtn.onclick = async () => {
    const pwd = passwordInput.value;
    try {
      const res = await fetch('/api/auth/verify-admin', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({password:pwd}) });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('admin_auth', 'true');
        loginOverlay.style.display = 'none';
        initAdmin();
      } else { showToast('Clave incorrecta', true); }
    } catch(e) { showToast('Error de conexión', true); }
  };
  
  // Session check moved to bottom

  // STATE
  let stock = [];
  let masas = [];
  let waffles = [];
  let menu = [];
  let sales = [];
  
  // DOM Elements
  const menuItems = document.querySelectorAll('.admin-menu-item');
  const views = document.querySelectorAll('.admin-view-panel');

  const navTo = (viewId) => {
    menuItems.forEach(mi => mi.classList.toggle('active', mi.dataset.adminView === viewId));
    views.forEach(v => v.classList.toggle('active', v.id === `admin-view-${viewId}`));
  };
  menuItems.forEach(item => {
    if (item.dataset.adminView) {
      item.addEventListener('click', () => navTo(item.dataset.adminView));
    }
  });

  document.getElementById('admin-logout').onclick = () => { sessionStorage.removeItem('admin_auth'); location.reload(); };

  async function loadData() {
    try {
      const [stk, mas, waf, mnu, sles] = await Promise.all([
        fetch('/api/stock').then(r=>r.json()),
        fetch('/api/masas').then(r=>r.json()),
        fetch('/api/waffles').then(r=>r.json()),
        fetch('/api/menu').then(r=>r.json()),
        fetch('/api/sales').then(r=>r.json())
      ]);
      stock = stk; masas = mas; waffles = waf; menu = mnu; sales = sles;
      renderAll();
    } catch (e) { showToast('Error al cargar datos', true); }
  }

  function renderAll() {
    renderInventory();
    renderCrudStock();
    renderCrudMasas();
    renderCrudWaffles();
    renderCrudMenu();
    renderAnalytics();
  }

  const formatC = (val) => new Intl.NumberFormat('es-AR', {style:'currency',currency:'ARS',minimumFractionDigits:0}).format(val || 0);

  // === VISTA GENERAL ===
  function renderInventory() {
    const tbody = document.getElementById('inventory-table-body');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    // Render Stock
    stock.forEach(s => {
      const status = s.stock <= s.minStock ? '<span style="color:var(--neon-pink)">Bajo Stock</span>' : '<span style="color:var(--neon-cyan)">Óptimo</span>';
      tbody.innerHTML += `<tr>
        <td>${s.name}</td>
        <td>Materia Prima (${s.category})</td>
        <td>${s.stock} ${s.unit}</td>
        <td>${formatC(s.cost)}</td>
        <td>${status}</td>
        <td>-</td>
      </tr>`;
    });
    // Render Masas
    masas.forEach(m => {
      tbody.innerHTML += `<tr>
        <td>${m.name}</td>
        <td>Insumo Elaborado (Masa)</td>
        <td>${m.stock} porciones</td>
        <td>${formatC(m.cost)} / porción</td>
        <td><span style="color:var(--neon-cyan)">Elaborado</span></td>
        <td><button class="btn-primary" onclick="window.produceMasa('${m.id}')" style="padding:4px 8px; font-size:0.8rem;">Fabricar</button></td>
      </tr>`;
    });
  }

  window.produceMasa = async (id) => {
    const m = masas.find(x => x.id === id);
    if(!m) return;
    const qty = prompt(`¿Cuántos lotes de ${m.name} fabricaste? (1 Lote = ${m.yield_qty} porciones)`);
    if(qty && !isNaN(qty) && parseInt(qty) > 0) {
      try {
        await fetch(`/api/masas/${id}/produce`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({qty: parseInt(qty)}) });
        showToast('Inventario actualizado');
        loadData();
      } catch(e) { showToast('Error', true); }
    }
  };

  // === CRUD STOCK ===
  document.getElementById('stock-pack-cost').addEventListener('input', updateStockCost);
  document.getElementById('stock-pack-units').addEventListener('input', updateStockCost);
  function updateStockCost() {
    const cost = parseFloat(document.getElementById('stock-pack-cost').value||0);
    const units = parseFloat(document.getElementById('stock-pack-units').value||1);
    document.getElementById('stock-cost').value = (cost / units).toFixed(2);
  }

  const stockForm = document.getElementById('stock-crud-form');
  if(stockForm) {
    stockForm.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('stock-edit-id').value;
      const data = {
        name: document.getElementById('stock-name').value,
        category: document.getElementById('stock-category').value,
        stock: parseInt(document.getElementById('stock-qty').value),
        minStock: parseInt(document.getElementById('stock-min').value),
        unit: document.getElementById('stock-unit').value,
        cost: parseFloat(document.getElementById('stock-cost').value),
        portion_size: parseInt(document.getElementById('stock-portion-size').value||0),
        price_per_portion: parseInt(document.getElementById('stock-price-per-portion').value||0)
      };

      const url = id ? `/api/stock/${id}` : '/api/stock';
      const method = id ? 'PUT' : 'POST';
      await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
      showToast('Guardado'); stockForm.reset(); document.getElementById('stock-edit-id').value=''; loadData();
    };
  }

  function renderCrudStock() {
    const tbody = document.getElementById('crud-stock-list-body');
    if(!tbody) return;
    tbody.innerHTML = '';
    stock.forEach(s => {
      tbody.innerHTML += `<tr>
        <td>${s.name}</td>
        <td>${s.category}</td>
        <td>${s.price_per_portion > 0 ? formatC(s.price_per_portion) : 'N/A'}</td>
        <td>${formatC(s.cost)}</td>
        <td>
          <button class="btn-secondary" onclick="window.deleteStock('${s.id}')" style="padding:4px">X</button>
        </td>
      </tr>`;
    });
  }
  window.deleteStock = async (id) => {
    if(confirm('¿Eliminar?')) {
      await fetch(`/api/stock/${id}`, { method:'DELETE' });
      loadData();
    }
  };

  // === CRUD MASAS ===
  let masaIngredients = [];
  function renderMasaIngredients() {
    const list = document.getElementById('recipe-ingredients-list');
    list.innerHTML = '';
    let totalCost = 0;
    masaIngredients.forEach((ing, i) => {
      const s = stock.find(x => x.id === ing.stock_id);
      if(s) totalCost += s.cost * ing.qty;
      list.innerHTML += `<div style="display:flex; gap:10px; align-items:center;">
        <select class="form-control masa-ing-id" data-idx="${i}" style="flex:2">
          ${stock.map(st => `<option value="${st.id}" ${st.id===ing.stock_id?'selected':''}>${st.name} (${formatC(st.cost)}/${st.unit})</option>`).join('')}
        </select>
        <input type="number" class="form-control masa-ing-qty" data-idx="${i}" value="${ing.qty}" min="1" style="flex:1" placeholder="Cant.">
        <span style="color:var(--text-secondary); width:30px;">${s ? s.unit : ''}</span>
        <button type="button" class="btn-secondary" onclick="window.removeMasaIng(${i})">X</button>
      </div>`;
    });
    
    // Listeners
    document.querySelectorAll('.masa-ing-id').forEach(el => el.addEventListener('change', (e) => {
      masaIngredients[e.target.dataset.idx].stock_id = e.target.value; renderMasaIngredients();
    }));
    document.querySelectorAll('.masa-ing-qty').forEach(el => el.addEventListener('input', (e) => {
      masaIngredients[e.target.dataset.idx].qty = parseInt(e.target.value)||1; renderMasaIngredients();
    }));

    const yieldQty = parseInt(document.getElementById('recipe-yield').value||1);
    document.getElementById('recipe-cost-display').value = (totalCost / yieldQty).toFixed(2);
  }
  
  document.getElementById('recipe-yield')?.addEventListener('input', renderMasaIngredients);
  document.getElementById('recipe-add-ingredient-btn')?.addEventListener('click', () => {
    if(stock.length===0) return showToast('No hay insumos en stock', true);
    masaIngredients.push({stock_id: stock[0].id, qty: 1});
    renderMasaIngredients();
  });
  window.removeMasaIng = (i) => { masaIngredients.splice(i,1); renderMasaIngredients(); };

  const recipeForm = document.getElementById('recipe-crud-form');
  if(recipeForm) {
    recipeForm.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('recipe-edit-id').value;
      const data = {
        name: document.getElementById('recipe-name').value,
        yield_qty: parseInt(document.getElementById('recipe-yield').value),
        cost: parseFloat(document.getElementById('recipe-cost-display').value),
        ingredients: masaIngredients
      };
      const url = id ? `/api/masas/${id}` : '/api/masas';
      const method = id ? 'PUT' : 'POST';
      await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
      showToast('Guardado'); recipeForm.reset(); document.getElementById('recipe-edit-id').value=''; masaIngredients=[]; loadData();
    };
  }

  function renderCrudMasas() {
    const tbody = document.getElementById('crud-recipes-list-body');
    if(!tbody) return;
    tbody.innerHTML = '';
    masas.forEach(m => {
      tbody.innerHTML += `<tr>
        <td>${m.name}</td>
        <td>${m.yield_qty} porciones</td>
        <td>${formatC(m.cost)}</td>
        <td><button class="btn-secondary" onclick="window.deleteMasa('${m.id}')" style="padding:4px">X</button></td>
      </tr>`;
    });
  }
  window.deleteMasa = async (id) => {
    if(confirm('¿Eliminar Masa?')) { await fetch(`/api/masas/${id}`, { method:'DELETE' }); loadData(); }
  };

  // === CRUD WAFFLES (RECETAS) ===
  let waffleIngredients = [];
  function renderWaffleIngredients() {
    const list = document.getElementById('waffle-ingredients-list');
    if(!list) return;
    list.innerHTML = '';
    let cost = 0;
    
    // Masa base cost
    const baseId = document.getElementById('waffle-base').value;
    const m = masas.find(x => x.id === baseId);
    if(m) cost += m.cost;

    waffleIngredients.forEach((ing, i) => {
      const s = stock.find(x => x.id === ing.stock_id);
      if(s) {
        cost += (s.cost / (s.portion_size||1)) * ing.qty; // estimate
      }
      list.innerHTML += `<div style="display:flex; gap:10px; align-items:center;">
        <select class="form-control waf-ing-id" data-idx="${i}" style="flex:2">
          ${stock.map(st => `<option value="${st.id}" ${st.id===ing.stock_id?'selected':''}>${st.name}</option>`).join('')}
        </select>
        <input type="number" class="form-control waf-ing-qty" data-idx="${i}" value="${ing.qty}" min="1" style="flex:1" placeholder="Cant. (porciones)">
        <span style="color:var(--text-secondary); font-size:0.8rem; width:40px;">Porc.</span>
        <button type="button" class="btn-secondary" onclick="window.removeWaffleIng(${i})">X</button>
      </div>`;
    });
    
    // Listeners
    document.querySelectorAll('.waf-ing-id').forEach(el => el.addEventListener('change', (e) => {
      waffleIngredients[e.target.dataset.idx].stock_id = e.target.value; renderWaffleIngredients();
    }));
    document.querySelectorAll('.waf-ing-qty').forEach(el => el.addEventListener('input', (e) => {
      waffleIngredients[e.target.dataset.idx].qty = parseInt(e.target.value)||1; renderWaffleIngredients();
    }));

    document.getElementById('waffle-recipe-cost-display').textContent = formatC(cost);
  }

  document.getElementById('waffle-base')?.addEventListener('change', renderWaffleIngredients);
  document.getElementById('waffle-add-ingredient-btn')?.addEventListener('click', () => {
    if(stock.length===0) return;
    waffleIngredients.push({stock_id: stock[0].id, qty: 1});
    renderWaffleIngredients();
  });
  window.removeWaffleIng = (i) => { waffleIngredients.splice(i,1); renderWaffleIngredients(); };

  // Guardar WAFFLE (RECETA)
  const waffleForm = document.getElementById('waffle-crud-form');
  if(waffleForm) {
    waffleForm.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('waffle-edit-id').value;
      const baseId = document.getElementById('waffle-base').value;
      
      const ings = [{type: 'masa', id: baseId, qty: 1}];
      waffleIngredients.forEach(i => ings.push({type: 'stock', id: i.stock_id, qty: i.qty}));

      const data = {
        name: document.getElementById('waffle-name').value,
        description: document.getElementById('waffle-desc').value,
        cost: parseFloat(document.getElementById('waffle-recipe-cost-display').textContent.replace(/[^0-9.-]+/g,"")),
        ingredients: ings,
        image: ''
      };
      
      const url = id ? `/api/waffles/${id}` : '/api/waffles';
      const method = id ? 'PUT' : 'POST';

      await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
      showToast('Receta Guardada'); waffleForm.reset(); waffleIngredients=[]; loadData();
    };
  }

  function renderCrudWaffles() {
    const baseSel = document.getElementById('waffle-base');
    if(baseSel) baseSel.innerHTML = masas.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
    
    const grid = document.getElementById('admin-waffles-list-grid');
    if(grid) {
      grid.innerHTML = '';
      waffles.forEach(w => {
        grid.innerHTML += `<div class="pos-item-card" style="padding:10px;">
          <div style="font-weight:bold;">${w.name}</div>
          <div style="font-size:0.8rem; color:var(--text-secondary);">${w.description}</div>
          <div style="margin-top:5px; color:var(--neon-pink);">Costo: ${formatC(w.cost)}</div>
          <button class="btn-secondary" onclick="window.deleteWaffle('${w.id}')" style="padding:4px; margin-top:10px; width:100%;">Eliminar Receta</button>
        </div>`;
      });
    }
  }

  window.deleteWaffle = async (id) => {
    if(confirm('¿Eliminar Receta?')) { await fetch(`/api/waffles/${id}`, { method:'DELETE' }); loadData(); }
  };

  // === CRUD MENU (PUBLICO) ===
  document.getElementById('menu-type')?.addEventListener('change', (e) => {
    const type = e.target.value;
    const refSelect = document.getElementById('menu-reference');
    if(refSelect) {
      refSelect.innerHTML = '';
      if(type === 'waffle') {
        refSelect.innerHTML = waffles.map(w => `<option value="${w.id}">${w.name} (Costo: ${formatC(w.cost)})</option>`).join('');
      } else {
        refSelect.innerHTML = stock.map(s => `<option value="${s.id}">${s.name} (Costo: ${formatC(s.cost)})</option>`).join('');
      }
    }
  });

  const publicMenuForm = document.getElementById('menu-crud-form');
  if(publicMenuForm && document.getElementById('menu-reference')) {
    // Note: the previous block attached to menu-crud-form was for Waffles. Let's fix that.
    // In index.html, the Menu form has id="menu-crud-form" and the Waffle form has id="waffle-crud-form" ... Wait, I'll need to check if I renamed the ID in index.html.
    publicMenuForm.onsubmit = async (e) => {
      e.preventDefault();
      const data = {
        type: document.getElementById('menu-type').value,
        reference_id: document.getElementById('menu-reference').value,
        name: document.getElementById('menu-name').value,
        price: parseFloat(document.getElementById('menu-price').value),
        is_visible: document.getElementById('menu-is-visible').checked
      };
      
      const id = document.getElementById('menu-edit-id').value;
      const url = id ? `/api/menu/${id}` : '/api/menu';
      const method = id ? 'PUT' : 'POST';

      await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
      showToast('Agregado al Menú'); publicMenuForm.reset(); loadData();
    };
  }

  function renderCrudMenu() {
    const refSelect = document.getElementById('menu-reference');
    if(refSelect && !refSelect.innerHTML) {
      document.getElementById('menu-type').dispatchEvent(new Event('change'));
    }

    const grid = document.getElementById('admin-menu-list-grid');
    if(grid) {
      grid.innerHTML = '';
      menu.forEach(m => {
        grid.innerHTML += `<div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:bold; color:var(--neon-cyan);">${m.name}</div>
            <div style="font-size:0.8rem; color:var(--text-secondary);">Ref: ${m.type === 'waffle' ? 'Receta Waffle' : 'Stock'} | Estado: ${m.is_visible?'Visible':'Oculto'}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:bold; font-size:1.1rem;">${formatC(m.price)}</div>
            <button class="btn-secondary" onclick="window.deleteMenu('${m.id}')" style="padding:4px 8px; font-size:0.75rem; margin-top:5px;">Quitar del Menú</button>
          </div>
        </div>`;
      });
    }
  }

  window.deleteMenu = async (id) => {
    if(confirm('¿Quitar del Menú?')) { await fetch(`/api/menu/${id}`, { method:'DELETE' }); loadData(); }
  };
  
  // Analytics Mock
  function renderAnalytics() {
    document.getElementById('stat-orders').textContent = sales.length;
    const total = sales.reduce((sum, s) => sum + s.total, 0);
    document.getElementById('stat-earnings').textContent = formatC(total);
    if(sales.length) {
      document.getElementById('stat-avg-ticket').textContent = formatC(total / sales.length);
    }
  }

  function initAdmin() { loadData(); navTo('analytics'); }

  if (sessionStorage.getItem('admin_auth')) { 
    loginOverlay.style.display = 'none'; 
    initAdmin(); 
  }
});
