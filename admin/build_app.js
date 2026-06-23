const fs = require('fs');
const oldApp = fs.readFileSync('admin/app.js.bak', 'utf8');

let newApp = oldApp;

// --- STEP 1: Add masas and waffles to global state ---
newApp = newApp.replace('let stock = {};', 'let stock = {};\n  let flatStock = [];\n  let masas = [];\n  let waffles = [];');

// --- STEP 2: Update loadState ---
const oldLoadState = `  const loadState = async () => {
    try {
      const stockRes = await fetch('/api/stock');
      stock = await stockRes.json();

      const salesRes = await fetch('/api/sales');
      sales = await salesRes.json();

      const menuRes = await fetch('/api/menu');
      menu = await menuRes.json();

      const empRes = await fetch('/api/employees');
      employees = await empRes.json();`;

const newLoadState = `  const loadState = async () => {
    try {
      const stockRes = await fetch('/api/stock');
      flatStock = await stockRes.json();
      stock = {
         bases: flatStock.filter(s => s.category === 'Base'),
         toppings: flatStock.filter(s => s.category === 'Topping'),
         syrups: flatStock.filter(s => s.category === 'Sirope'),
         drinks: flatStock.filter(s => s.category === 'Bebida'),
         icecreams: flatStock.filter(s => s.category === 'Helado')
      };

      const masRes = await fetch('/api/masas');
      masas = await masRes.json();

      const wafRes = await fetch('/api/waffles');
      waffles = await wafRes.json();

      const salesRes = await fetch('/api/sales');
      sales = await salesRes.json();

      const menuRes = await fetch('/api/menu');
      menu = await menuRes.json();

      const empRes = await fetch('/api/employees');
      employees = await empRes.json();`;

newApp = newApp.replace(oldLoadState, newLoadState);

// --- STEP 3: Replace old monolithic CRUD MENU (WAFFLES) with new split logic ---
const monolithicRegex = /\/\/ === CRUD MENU \(WAFFLES\) ===[\s\S]*?(?=\/\/ --- PANEL 5: CONFIGURACIÓN DE SEGURIDAD)/;

const splitLogic = `// === CRUD MASAS ===
  let masaIngredients = [];
  function renderMasaIngredients() {
    const list = document.getElementById('recipe-ingredients-list');
    if(!list) return;
    list.innerHTML = '';
    let totalCost = 0;
    masaIngredients.forEach((ing, i) => {
      const s = flatStock.find(x => x.id === ing.stock_id);
      if(s) totalCost += s.cost * ing.qty;
      list.innerHTML += \`<div style="display:flex; gap:10px; align-items:center;">
        <select class="form-control masa-ing-id" data-idx="\${i}" style="flex:2">
          \${flatStock.map(st => \`<option value="\${st.id}" \${st.id===ing.stock_id?'selected':''}>\${st.name} (\${formatCurrency(st.cost)}/\${st.unit})</option>\`).join('')}
        </select>
        <input type="number" class="form-control masa-ing-qty" data-idx="\${i}" value="\${ing.qty}" min="1" style="flex:1" placeholder="Cant.">
        <span style="color:var(--text-secondary); width:30px;">\${s ? s.unit : ''}</span>
        <button type="button" class="btn-secondary" onclick="window.removeMasaIng(\${i})">X</button>
      </div>\`;
    });
    const yieldQty = parseInt(document.getElementById('recipe-yield')?.value||1);
    const costDisp = document.getElementById('recipe-cost-display');
    if(costDisp) costDisp.value = (totalCost / yieldQty).toFixed(2);
  }
  
  document.getElementById('recipe-yield')?.addEventListener('input', renderMasaIngredients);
  document.getElementById('recipe-add-ingredient-btn')?.addEventListener('click', () => {
    if(flatStock.length===0) return showToast('No hay insumos en stock', true);
    masaIngredients.push({stock_id: flatStock[0].id, qty: 1});
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
      const url = id ? \`/api/masas/\${id}\` : '/api/masas';
      const method = id ? 'PUT' : 'POST';
      await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
      showToast('Guardado'); recipeForm.reset(); document.getElementById('recipe-edit-id').value=''; masaIngredients=[]; loadState();
      setTimeout(renderCrudMasas, 200);
    };
  }

  function renderCrudMasas() {
    const tbody = document.getElementById('crud-recipes-list-body');
    if(!tbody) return;
    tbody.innerHTML = '';
    masas.forEach(m => {
      tbody.innerHTML += \`<tr>
        <td>\${m.name}</td>
        <td>\${m.yield_qty} porciones</td>
        <td>\${formatCurrency(m.cost)}</td>
        <td><button class="btn-secondary" onclick="window.deleteMasa('\${m.id}')" style="padding:4px">X</button></td>
      </tr>\`;
    });
  }
  window.deleteMasa = async (id) => {
    if(confirm('¿Eliminar Masa?')) { await fetch(\`/api/masas/\${id}\`, { method:'DELETE' }); loadState(); setTimeout(renderCrudMasas, 200); }
  };

  // === CRUD WAFFLES (RECETAS) ===
  let waffleIngredients = [];
  function renderWaffleIngredients() {
    const list = document.getElementById('waffle-ingredients-list');
    if(!list) return;
    list.innerHTML = '';
    let cost = 0;
    const baseId = document.getElementById('waffle-base')?.value;
    const m = masas.find(x => x.id === baseId);
    if(m) cost += m.cost;

    waffleIngredients.forEach((ing, i) => {
      const s = flatStock.find(x => x.id === ing.stock_id);
      if(s) cost += (s.cost / (s.portion_size||1)) * ing.qty;
      list.innerHTML += \`<div style="display:flex; gap:10px; align-items:center;">
        <select class="form-control waf-ing-id" data-idx="\${i}" style="flex:2">
          \${flatStock.map(st => \`<option value="\${st.id}" \${st.id===ing.stock_id?'selected':''}>\${st.name}</option>\`).join('')}
        </select>
        <input type="number" class="form-control waf-ing-qty" data-idx="\${i}" value="\${ing.qty}" min="1" style="flex:1" placeholder="Cant.">
        <span style="color:var(--text-secondary); font-size:0.8rem; width:40px;">Porc.</span>
        <button type="button" class="btn-secondary" onclick="window.removeWaffleIng(\${i})">X</button>
      </div>\`;
    });
    const costDisp = document.getElementById('waffle-recipe-cost-display');
    if(costDisp) costDisp.textContent = formatCurrency(cost);
  }

  document.getElementById('waffle-base')?.addEventListener('change', renderWaffleIngredients);
  document.getElementById('waffle-add-ingredient-btn')?.addEventListener('click', () => {
    if(flatStock.length===0) return;
    waffleIngredients.push({stock_id: flatStock[0].id, qty: 1});
    renderWaffleIngredients();
  });
  window.removeWaffleIng = (i) => { waffleIngredients.splice(i,1); renderWaffleIngredients(); };

  const waffleForm = document.getElementById('waffle-crud-form');
  if(waffleForm) {
    waffleForm.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('waffle-edit-id').value;
      const baseId = document.getElementById('waffle-base').value;
      const ings = [{type: 'masa', id: baseId, qty: 1}];
      waffleIngredients.forEach(i => ings.push({type: 'stock', id: i.stock_id, qty: i.qty}));

      const costEl = document.getElementById('waffle-recipe-cost-display');
      const data = {
        name: document.getElementById('waffle-name').value,
        description: document.getElementById('waffle-desc').value,
        cost: parseFloat(costEl.textContent.replace(/[^0-9.-]+/g,"")),
        ingredients: ings,
        image: ''
      };
      const url = id ? \`/api/waffles/\${id}\` : '/api/waffles';
      const method = id ? 'PUT' : 'POST';
      await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
      showToast('Receta Guardada'); waffleForm.reset(); waffleIngredients=[]; loadState(); setTimeout(renderCrudWaffles, 200);
    };
  }

  function renderCrudWaffles() {
    const baseSel = document.getElementById('waffle-base');
    if(baseSel) baseSel.innerHTML = masas.map(m => \`<option value="\${m.id}">\${m.name}</option>\`).join('');
    
    const grid = document.getElementById('admin-waffles-list-grid');
    if(grid) {
      grid.innerHTML = '';
      waffles.forEach(w => {
        grid.innerHTML += \`<div class="pos-item-card" style="padding:10px;">
          <div style="font-weight:bold;">\${w.name}</div>
          <div style="font-size:0.8rem; color:var(--text-secondary);">\${w.description}</div>
          <div style="margin-top:5px; color:var(--neon-pink);">Costo: \${formatCurrency(w.cost)}</div>
          <button class="btn-secondary" onclick="window.deleteWaffle('\${w.id}')" style="padding:4px; margin-top:10px; width:100%;">Eliminar Receta</button>
        </div>\`;
      });
    }
  }

  window.deleteWaffle = async (id) => {
    if(confirm('¿Eliminar Receta?')) { await fetch(\`/api/waffles/\${id}\`, { method:'DELETE' }); loadState(); setTimeout(renderCrudWaffles, 200); }
  };

  // === CRUD MENU (PUBLICO) ===
  document.getElementById('menu-type')?.addEventListener('change', (e) => {
    const type = e.target.value;
    const refSelect = document.getElementById('menu-reference');
    if(refSelect) {
      refSelect.innerHTML = '';
      if(type === 'waffle') {
        refSelect.innerHTML = waffles.map(w => \`<option value="\${w.id}">\${w.name} (Costo: \${formatCurrency(w.cost)})</option>\`).join('');
      } else {
        refSelect.innerHTML = flatStock.map(s => \`<option value="\${s.id}">\${s.name} (Costo: \${formatCurrency(s.cost)})</option>\`).join('');
      }
    }
  });

  const publicMenuForm = document.getElementById('menu-crud-form');
  if(publicMenuForm) {
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
      const url = id ? \`/api/menu/\${id}\` : '/api/menu';
      const method = id ? 'PUT' : 'POST';
      await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
      showToast('Agregado al Menú'); publicMenuForm.reset(); loadState(); setTimeout(renderCrudMenu, 200);
    };
  }

  function renderCrudMenu() {
    const refSelect = document.getElementById('menu-reference');
    if(refSelect && !refSelect.innerHTML) {
      document.getElementById('menu-type')?.dispatchEvent(new Event('change'));
    }
    const grid = document.getElementById('admin-menu-list-grid');
    if(grid) {
      grid.innerHTML = '';
      menu.forEach(m => {
        grid.innerHTML += \`<div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:bold; color:var(--neon-cyan);">\${m.name}</div>
            <div style="font-size:0.8rem; color:var(--text-secondary);">Ref: \${m.type === 'waffle' ? 'Receta Waffle' : 'Stock'} | Estado: \${m.is_visible?'Visible':'Oculto'}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:bold; font-size:1.1rem;">\${formatCurrency(m.price)}</div>
            <button class="btn-secondary" onclick="window.deleteMenu('\${m.id}')" style="padding:4px 8px; font-size:0.75rem; margin-top:5px;">Quitar del Menú</button>
          </div>
        </div>\`;
      });
    }
  }

  window.deleteMenu = async (id) => {
    if(confirm('¿Quitar del Menú?')) { await fetch(\`/api/menu/\${id}\`, { method:'DELETE' }); loadState(); setTimeout(renderCrudMenu, 200); }
  };
`;

newApp = newApp.replace(monolithicRegex, splitLogic + '\n  ');

// Fix render loop in switchAdminView
newApp = newApp.replace("if (viewName === 'menu') renderCrudMenu();", "if (viewName === 'menu') { renderCrudMasas(); renderCrudWaffles(); renderCrudMenu(); }");

fs.writeFileSync('admin/app.js', newApp);
console.log('Build completed successfully!');
