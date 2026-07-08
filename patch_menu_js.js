const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'admin', 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = "// --- PANEL 4: GESTIÓN DE CARTA / MENÚ (CRUD + CARGA DE IMÁGENES) ---";
const endMarker = "// === CRUD WAFFLES (RECETAS) ===";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error("Markers not found");
    process.exit(1);
}

const replacement = `// --- PANEL 4: GESTIÓN DE CARTA / MENÚ (CRUD + CARGA DE IMÁGENES) ---
  const menuModal = document.getElementById('menu-modal-overlay');

  const closeMenuModal = () => {
    if (menuModal) menuModal.style.display = 'none';
    const form = document.getElementById('menu-crud-form');
    if (form) form.reset();
    document.getElementById('menu-edit-id').value = '';
    const title = document.getElementById('menu-form-title');
    if (title) title.textContent = 'Publicar Producto';
    populateMenuReferences();
  };

  document.getElementById('btn-open-add-menu-modal')?.addEventListener('click', () => {
    closeMenuModal();
    if(menuModal) menuModal.style.display = 'flex';
  });

  document.getElementById('menu-modal-close')?.addEventListener('click', closeMenuModal);
  document.getElementById('menu-form-cancel-btn')?.addEventListener('click', closeMenuModal);

  const populateMenuReferences = (selectedId = '') => {
    const typeSelect = document.getElementById('menu-type');
    const refSelect = document.getElementById('menu-reference');
    if (!typeSelect || !refSelect) return;

    refSelect.innerHTML = '';
    
    if (typeSelect.value === 'waffle') {
      if (waffles.length === 0) {
        refSelect.innerHTML = '<option value="">No hay recetas creadas</option>';
      }
      waffles.forEach(w => {
        const opt = document.createElement('option');
        opt.value = w.id;
        opt.textContent = \`\${w.name} (Costo estimado: $\${Math.round(w.cost||0)})\`;
        if (w.id === selectedId) opt.selected = true;
        refSelect.appendChild(opt);
      });
    } else {
      let flatStock = [];
      for (const cat in stock) { flatStock = flatStock.concat(stock[cat]); }
      const validStock = flatStock; 
      
      if (validStock.length === 0) {
        refSelect.innerHTML = '<option value="">No hay insumos en stock</option>';
      }
      validStock.sort((a,b) => a.name.localeCompare(b.name)).forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.textContent = \`\${item.name} (\${item.stock} \${item.unit})\`;
        if (item.id === selectedId) opt.selected = true;
        refSelect.appendChild(opt);
      });
    }
  };

  document.getElementById('menu-type')?.addEventListener('change', () => populateMenuReferences());

  const renderCrudMenu = () => {
    populateMenuReferences();
    renderMenuListGrid();
  };

  const renderMenuListGrid = () => {
    const grid = document.getElementById('admin-menu-list-grid');
    if (!grid) return;

    grid.innerHTML = '';
    if (menu.length === 0) {
      grid.innerHTML = '<div style="color:var(--text-secondary); text-align:center;">El menú está vacío.</div>';
    }

    menu.forEach(item => {
      const card = document.createElement('div');
      card.className = 'pos-item-card';

      let recipeCost = 0;
      let referenceName = '';
      
      if (item.type === 'direct') {
        const linkedStock = getStockItem(item.reference_id);
        recipeCost = linkedStock ? ((linkedStock.cost / (linkedStock.portion_size||1)) || 0) : 0;
        referenceName = linkedStock ? linkedStock.name : 'Stock Eliminado/Desconocido';
      } else {
        const linkedWaffle = waffles.find(w => w.id === item.reference_id);
        recipeCost = linkedWaffle ? (linkedWaffle.cost || 0) : 0;
        referenceName = linkedWaffle ? linkedWaffle.name : 'Receta Eliminada/Desconocida';
      }
      
      const marginPercent = item.price > 0 ? Math.round(((item.price - recipeCost) / item.price) * 100) : 0;

      card.innerHTML = \`
        <div style="padding:10px;">
          <div style="display:flex; justify-content:space-between; margin-bottom: 5px;">
            <div style="font-weight:bold; font-size:1.1rem; color:var(--neon-purple);">\${item.name}</div>
            <div style="font-weight:bold; color:var(--neon-cyan);">\${formatCurrency(item.price)}</div>
          </div>
          <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom: 10px;">Vinculado a: <span style="color:#fff;">\${referenceName}</span> (\${item.type === 'waffle' ? 'Receta Waffle' : 'Stock Directo'})</div>
          
          <div style="display:flex; justify-content:space-between; font-size:0.8rem; border-top:1px solid rgba(255,255,255,0.05); padding-top:6px;">
            <span>Costo base: <strong style="color:var(--text-muted);">\${formatCurrency(recipeCost)}</strong></span>
            <span>Margen: <strong style="color:var(--neon-yellow);">\${marginPercent}%</strong></span>
          </div>

          <div style="display:flex; gap:10px; margin-top:10px;">
            <button class="btn-secondary edit-menu-item-btn" data-id="\${item.id}" style="padding:4px; flex:1;">Editar</button>
            <button class="btn-secondary delete-menu-item-btn" data-id="\${item.id}" style="padding:4px; flex:1; background:#e63946; color:#fff; border:none;">Eliminar</button>
          </div>
        </div>
      \`;

      grid.appendChild(card);
    });

    // Vincular botones editar
    grid.querySelectorAll('.edit-menu-item-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const item = menu.find(w => w.id === id);
        if (item) {
          document.getElementById('menu-edit-id').value = item.id;
          document.getElementById('menu-type').value = item.type || 'waffle';
          
          populateMenuReferences(item.reference_id);
          
          document.getElementById('menu-name').value = item.name;
          document.getElementById('menu-price').value = item.price;
          document.getElementById('menu-is-visible').checked = item.is_visible !== false;
          
          const title = document.getElementById('menu-form-title');
          if (title) title.textContent = 'Editar Producto de Carta';
          
          if(menuModal) menuModal.style.display = 'flex';
        }
      };
    });

    // Vincular botones eliminar
    grid.querySelectorAll('.delete-menu-item-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const item = menu.find(w => w.id === id);
        if (item && confirm(\`¿Estás seguro de eliminar "\${item.name}" del menú público?\`)) {
          deleteMenuItem(id);
        }
      };
    });
  };

  const deleteMenuItem = async (id) => {
    try {
      const res = await fetch(\`/api/menu/\${id}\`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('Producto eliminado del menú');
        await loadState();
        renderCrudMenu();
      } else {
        const data = await res.json();
        showToast(data.error || 'Error al eliminar', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión', true);
    }
  };

  // Submit CRUD Menú
  const menuCrudForm = document.getElementById('menu-crud-form');
  if (menuCrudForm) {
    menuCrudForm.onsubmit = async (e) => {
      e.preventDefault();

      const id = document.getElementById('menu-edit-id').value;
      const type = document.getElementById('menu-type').value;
      const reference_id = document.getElementById('menu-reference').value;
      const name = document.getElementById('menu-name').value;
      const price = parseInt(document.getElementById('menu-price').value);
      const is_visible = document.getElementById('menu-is-visible').checked;

      if (!reference_id) {
        showToast("Debes vincular un producto de origen", true);
        return;
      }

      const payload = { type, reference_id, name, price, is_visible };

      try {
        let res;
        if (id) {
          res = await fetch(\`/api/menu/\${id}\`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } else {
          res = await fetch('/api/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }

        if (res.ok) {
          showToast(id ? 'Producto actualizado' : 'Nuevo producto publicado');
          closeMenuModal();
          await loadState();
          renderCrudMenu();
        } else {
          const data = await res.json();
          showToast(data.error || 'Error al guardar el producto', true);
        }
      } catch (err) {
        console.error(err);
        showToast('Error de red', true);
      }
    };
  }

  `;

content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync(filePath, content, 'utf8');
console.log("Patched successfully");
