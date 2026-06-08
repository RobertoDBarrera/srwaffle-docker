// Lógica del Módulo de Administración - Sr. Waffle (Backoffice)
document.addEventListener('DOMContentLoaded', () => {
  // --- INICIALIZACIÓN DE ESTADO ---
  let stock = [];
  let sales = [];
  let menu = [];
  let currentAdminView = 'analytics';

  // --- ELEMENTOS DEL DOM ---
  const toast = document.getElementById('toast');
  const loginOverlay = document.getElementById('admin-login-overlay');
  const loginBtn = document.getElementById('admin-login-btn');
  const passwordInput = document.getElementById('admin-password-input');

  const adminViews = {
    analytics: document.getElementById('admin-view-analytics'),
    inventory: document.getElementById('admin-view-inventory'),
    'crud-stock': document.getElementById('admin-view-crud-stock'),
    'crud-menu': document.getElementById('admin-view-crud-menu'),
    settings: document.getElementById('admin-view-settings')
  };

  const adminMenuItems = document.querySelectorAll('.admin-menu-item');

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

  // Carga el estado completo desde el servidor
  const loadState = async () => {
    try {
      const stockRes = await fetch('/api/stock');
      stock = await stockRes.json();

      const salesRes = await fetch('/api/sales');
      sales = await salesRes.json();

      const menuRes = await fetch('/api/menu');
      menu = await menuRes.json();
    } catch (error) {
      console.error('Error al cargar datos del servidor:', error);
      showToast('Error al conectar con el servidor', true);
    }
  };

  // --- AUTENTICACIÓN ADMINISTRADOR (SERVIDOR) ---
  const handleLogin = async () => {
    const password = passwordInput.value;
    if (!password) {
      showToast('Ingresa la contraseña de administrador', true);
      return;
    }

    try {
      const res = await fetch('/api/auth/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();

      if (data.success) {
        sessionStorage.setItem('admin_authenticated', 'true');
        loginOverlay.style.display = 'none';
        showToast('Sesión administrativa iniciada');
        passwordInput.value = '';
        await switchAdminView('analytics');
      } else {
        showToast('Clave Incorrecta', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión con el servidor', true);
    }
  };

  loginBtn.addEventListener('click', handleLogin);
  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });

  // Cerrar Sesión
  document.getElementById('admin-logout').addEventListener('click', () => {
    sessionStorage.removeItem('admin_authenticated');
    loginOverlay.style.display = 'flex';
  });

  // --- NAVEGACIÓN ENTRE VISTAS ---
  const switchAdminView = async (viewName) => {
    currentAdminView = viewName;

    adminMenuItems.forEach(item => {
      if (item.getAttribute('data-admin-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    for (const key in adminViews) {
      if (key === viewName) {
        adminViews[key].classList.add('active');
      } else {
        adminViews[key].classList.remove('active');
      }
    }

    // Refrescar el estado desde el servidor
    await loadState();

    if (viewName === 'analytics') renderAnalytics();
    if (viewName === 'inventory') renderInventory();
    if (viewName === 'crud-stock') renderCrudStock();
    if (viewName === 'crud-menu') renderCrudMenu();
    if (viewName === 'settings') resetSettingsForm();
  };

  adminMenuItems.forEach(item => {
    item.addEventListener('click', () => {
      const view = item.getAttribute('data-admin-view');
      if (view) switchAdminView(view);
    });
  });

  // --- PANEL 1: ANALYTICS & HISTORIAL DE VENTAS ---
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
          showToast(data.error || 'Error al reembolsar la venta', true);
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
  document.getElementById('export-report-btn').onclick = () => {
    if (sales.length === 0) {
      showToast('No hay transacciones para exportar', true);
      return;
    }

    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += 'ID Venta,Fecha,Productos,Total Venta,Metodo Pago,Estado\n';

    sales.forEach(sale => {
      const prodNames = sale.items.map(i => i.name).join(' | ');
      const dateStr = new Date(sale.date).toLocaleString('es-AR');
      csvContent += `"${sale.id}","${dateStr}","${prodNames}",${sale.total},"${sale.paymentMethod}","${sale.status === 'refunded' ? 'Reembolsado' : 'Completado'}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_ventas_srwaffle_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Reporte CSV descargado');
  };

  // --- PANEL 2: CONTROL DE STOCK (TABLA PRINCIPAL) ---
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
            <button class="action-icon-btn edit-quick-btn" data-id="${item.id}" title="Edición Rápida">
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
        showQuickRestockModal(id);
      };
    });

    tableBody.querySelectorAll('.edit-quick-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        showQuickEditModal(id);
      };
    });
  };

  const translateCategory = (cat) => {
    const maps = { bases: 'masas', toppings: 'toppings', syrups: 'salsas', drinks: 'bebidas', icecreams: 'helados' };
    return maps[cat] || cat;
  };

  document.getElementById('inventory-search').oninput = () => renderInventory();

  // Modal rápido de reabastecimiento
  const showQuickRestockModal = (id) => {
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
      const qtyVal = parseInt(document.getElementById('restock-qty').value);
      if (isNaN(qtyVal) || qtyVal <= 0) {
        showToast('Ingrese un número válido mayor a 0', true);
        return;
      }

      try {
        const res = await fetch('/api/stock/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id, stockToAdd: qtyVal })
        });

        if (res.ok) {
          showToast(`${item.name} reabastecido`);
          modal.remove();
          await loadState();
          renderInventory();
        } else {
          showToast('Error en el servidor', true);
        }
      } catch (err) {
        console.error(err);
        showToast('Error de red', true);
      }
    };
  };

  // Modal rápido de edición (precio y umbral)
  const showQuickEditModal = (id) => {
    const item = getStockItem(id);
    if (!item) return;

    const modal = document.createElement('div');
    modal.className = 'pos-modal-overlay';
    modal.innerHTML = `
      <div class="inventory-modal">
        <h2 style="font-family: var(--font-cursive); font-size: 1.8rem;">Edición Rápida</h2>
        <p style="color:var(--text-secondary); font-size:0.9rem;">${item.name}</p>
        
        <div class="form-group">
          <label>Precio por Porción / Unidad ($)</label>
          <input type="number" id="quick-price" class="form-control" value="${item.price}" min="0">
        </div>
        
        <div class="form-group">
          <label>Umbral Mínimo (Alerta de Stock)</label>
          <input type="number" id="quick-min" class="form-control" value="${item.minStock}" min="0">
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" id="quick-cancel" style="padding: 0.6rem 1.2rem;">Cancelar</button>
          <button class="btn-primary" id="quick-confirm" style="padding: 0.6rem 1.2rem;">Guardar Cambios</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('quick-cancel').onclick = () => modal.remove();
    document.getElementById('quick-confirm').onclick = async () => {
      const priceVal = parseInt(document.getElementById('quick-price').value);
      const minVal = parseInt(document.getElementById('quick-min').value);

      if (isNaN(priceVal) || priceVal < 0 || isNaN(minVal) || minVal < 0) {
        showToast('Ingrese valores válidos', true);
        return;
      }

      try {
        const res = await fetch('/api/stock/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id, price: priceVal, minStock: minVal })
        });

        if (res.ok) {
          showToast('Insumo actualizado');
          modal.remove();
          await loadState();
          renderInventory();
        } else {
          showToast('Error en el servidor', true);
        }
      } catch (err) {
        console.error(err);
        showToast('Error de red', true);
      }
    };
  };


  // --- PANEL 3: GESTIÓN COMPLETA DE INSUMOS (CRUD) ---
  const renderCrudStock = () => {
    const listBody = document.getElementById('crud-stock-list-body');
    if (!listBody) return;

    listBody.innerHTML = '';

    let flatStock = [];
    for (const cat in stock) {
      flatStock = flatStock.concat(stock[cat]);
    }

    flatStock.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:600;">${item.name}</td>
        <td style="text-transform: capitalize; color:var(--text-secondary);">${translateCategory(item.category)}</td>
        <td>${formatCurrency(item.price)}</td>
        <td>
          <div style="display:flex; gap: 8px;">
            <button class="refund-btn edit-stock-item-btn" data-id="${item.id}" style="background:var(--neon-cyan); color:#000;">Editar</button>
            <button class="refund-btn delete-stock-item-btn" data-id="${item.id}" style="background:#e63946; color:#fff;">Eliminar</button>
          </div>
        </td>
      `;
      listBody.appendChild(tr);
    });

    // Eventos editar
    listBody.querySelectorAll('.edit-stock-item-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const item = getStockItem(id);
        if (item) {
          document.getElementById('stock-edit-id').value = item.id;
          document.getElementById('stock-name').value = item.name;
          document.getElementById('stock-category').value = item.category;
          document.getElementById('stock-price').value = item.price;
          document.getElementById('stock-qty').value = item.stock;
          document.getElementById('stock-min').value = item.minStock;
          document.getElementById('stock-unit').value = item.unit;
          
          document.getElementById('stock-form-title').textContent = 'Editar Insumo';
          document.getElementById('stock-form-cancel-btn').style.display = 'block';
          document.getElementById('stock-name').focus();
        }
      };
    });

    // Eventos eliminar
    listBody.querySelectorAll('.delete-stock-item-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const item = getStockItem(id);
        if (item && confirm(`¿Estás seguro de eliminar el insumo "${item.name}"? Esta acción podría afectar a los waffles que lo utilicen en el menú.`)) {
          deleteStockItem(id);
        }
      };
    });
  };

  const deleteStockItem = async (id) => {
    try {
      const res = await fetch(`/api/stock/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('Insumo eliminado con éxito');
        await loadState();
        renderCrudStock();
      } else {
        const data = await res.json();
        showToast(data.error || 'Error al eliminar insumo', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Error de red', true);
    }
  };

  // Botón cancelar en formulario insumos
  document.getElementById('stock-form-cancel-btn').onclick = () => {
    resetStockForm();
  };

  const resetStockForm = () => {
    document.getElementById('stock-crud-form').reset();
    document.getElementById('stock-edit-id').value = '';
    document.getElementById('stock-form-title').textContent = 'Crear Insumo';
    document.getElementById('stock-form-cancel-btn').style.display = 'none';
  };

  // Enviar formulario CRUD insumos (Crear / Editar)
  document.getElementById('stock-crud-form').onsubmit = async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('stock-edit-id').value;
    const name = document.getElementById('stock-name').value;
    const category = document.getElementById('stock-category').value;
    const price = parseInt(document.getElementById('stock-price').value);
    const qty = parseInt(document.getElementById('stock-qty').value);
    const minStock = parseInt(document.getElementById('stock-min').value);
    const unit = document.getElementById('stock-unit').value;

    const payload = { name, category, price, stock: qty, minStock, unit };

    try {
      let res;
      if (id) {
        // Editar
        res = await fetch(`/api/stock/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // Crear
        res = await fetch('/api/stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        showToast(id ? 'Insumo actualizado' : 'Insumo creado con éxito');
        resetStockForm();
        await loadState();
        renderCrudStock();
      } else {
        const data = await res.json();
        showToast(data.error || 'Error al guardar insumo', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión', true);
    }
  };


  const renderIceCreamFlavorSelectors = (count, selectedFlavors = []) => {
    const container = document.getElementById('menu-icecreams-flavor-selectors');
    if (!container) return;
    container.innerHTML = '';
    if (count <= 0) return;

    const flavorsList = stock.icecreams || [];
    if (flavorsList.length === 0) {
      container.innerHTML = '<p style="color:var(--neon-yellow); font-size:0.8rem;">No hay helados disponibles en stock.</p>';
      return;
    }

    for (let i = 0; i < count; i++) {
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.flexDirection = 'column';
      div.style.gap = '4px';

      const label = document.createElement('label');
      label.textContent = `Sabor de Bocha ${i + 1}`;
      label.style.fontSize = '0.75rem';
      label.style.color = 'var(--text-secondary)';

      const select = document.createElement('select');
      select.className = 'form-control menu-icecream-flavor-select';
      select.style.background = '#222';
      
      flavorsList.forEach(ice => {
        const opt = document.createElement('option');
        opt.value = ice.id;
        opt.textContent = `${ice.name} (${formatCurrency(ice.price)})`;
        select.appendChild(opt);
      });

      // Pre-select if we have a value
      if (selectedFlavors[i]) {
        select.value = selectedFlavors[i];
      }

      div.appendChild(label);
      div.appendChild(select);
      container.appendChild(div);
    }
  };


  // --- PANEL 4: GESTIÓN DE CARTA / MENÚ (CRUD + CARGA DE IMÁGENES) ---
  const renderCrudMenu = () => {
    renderBaseDropdown();
    renderToppingsChecklist();
    renderSyrupsChecklist();
    renderMenuListGrid();
  };

  const renderBaseDropdown = () => {
    const dropdown = document.getElementById('menu-base');
    if (!dropdown) return;

    dropdown.innerHTML = '';
    stock.bases.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.name;
      dropdown.appendChild(opt);
    });
  };

  const renderToppingsChecklist = () => {
    const container = document.getElementById('menu-toppings-checklist');
    if (!container) return;

    container.innerHTML = '';
    stock.toppings.forEach(top => {
      const label = document.createElement('label');
      label.className = 'checklist-item';
      label.innerHTML = `
        <input type="checkbox" class="menu-topping-checkbox" value="${top.id}">
        <span>${top.name}</span>
      `;
      container.appendChild(label);
    });
  };

  const renderSyrupsChecklist = () => {
    const container = document.getElementById('menu-syrups-checklist');
    if (!container) return;

    container.innerHTML = '';
    stock.syrups.forEach(syr => {
      const label = document.createElement('label');
      label.className = 'checklist-item';
      label.innerHTML = `
        <input type="checkbox" class="menu-syrup-checkbox" value="${syr.id}">
        <span>${syr.name}</span>
      `;
      container.appendChild(label);
    });
  };

  const renderMenuListGrid = () => {
    const grid = document.getElementById('admin-menu-list-grid');
    if (!grid) return;

    grid.innerHTML = '';

    menu.forEach(waffle => {
      const card = document.createElement('div');
      card.className = 'menu-item-admin-card';

      const imgPath = waffle.image ? `/${waffle.image}` : '';
      const imgHTML = imgPath ? `<img src="${imgPath}" class="menu-item-admin-img" alt="${waffle.name}">` : `<div class="menu-item-admin-img" style="display:flex; align-items:center; justify-content:center; color:var(--text-muted); font-size:0.8rem;">Sin Imagen</div>`;
      
      const baseName = getStockItem(waffle.base)?.name || 'Masa no definida';
      const toppingsText = waffle.toppings.map(id => getStockItem(id)?.name || '').filter(Boolean).join(', ');
      const syrupsText = waffle.syrups.map(id => getStockItem(id)?.name || '').filter(Boolean).join(', ');
      const icecreamsText = waffle.icecreams ? waffle.icecreams.map(id => getStockItem(id)?.name || '').filter(Boolean).join(', ') : '';

      card.innerHTML = `
        ${imgHTML}
        <div class="menu-item-admin-body">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 5px;">
            <span style="font-weight:700; font-size:1.1rem; color:var(--neon-purple);">${waffle.name}</span>
            <span style="font-weight:700; color:var(--neon-cyan);">${formatCurrency(waffle.price)}</span>
          </div>
          <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom: 8px; line-height:1.2; max-height:40px; overflow:hidden;">${waffle.description}</p>
          
          <div style="margin-bottom: 10px;">
            <span class="badge-tag" style="border-color:rgba(160,32,240,0.3); color:#b39ddb;">Base: ${baseName}</span>
            ${toppingsText ? `<span class="badge-tag">Tops: ${toppingsText}</span>` : ''}
            ${syrupsText ? `<span class="badge-tag">Salsas: ${syrupsText}</span>` : ''}
            ${icecreamsText ? `<span class="badge-tag" style="border-color:rgba(0, 245, 212, 0.3); color:var(--neon-cyan);">Helado: ${icecreamsText}</span>` : ''}
          </div>

          <div class="menu-item-admin-actions">
            <button class="refund-btn edit-menu-item-btn" data-id="${waffle.id}" style="background:var(--neon-cyan); color:#000; flex:1; font-size:0.8rem; padding:4px 8px;">Editar</button>
            <button class="refund-btn delete-menu-item-btn" data-id="${waffle.id}" style="background:#e63946; color:#fff; flex:1; font-size:0.8rem; padding:4px 8px;">Eliminar</button>
          </div>
        </div>
      `;

      grid.appendChild(card);
    });

    // Vincular botones editar
    grid.querySelectorAll('.edit-menu-item-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const waffle = menu.find(w => w.id === id);
        if (waffle) {
          document.getElementById('menu-edit-id').value = waffle.id;
          document.getElementById('menu-name').value = waffle.name;
          document.getElementById('menu-desc').value = waffle.description;
          document.getElementById('menu-price').value = waffle.price;
          document.getElementById('menu-base').value = waffle.base;
          
          // Pre-marcar checkboxes
          document.querySelectorAll('.menu-topping-checkbox').forEach(chk => {
            chk.checked = waffle.toppings.includes(chk.value);
          });
          document.querySelectorAll('.menu-syrup-checkbox').forEach(chk => {
            chk.checked = waffle.syrups.includes(chk.value);
          });

          // Pre-seleccionar helados por defecto
          const icecreamCountSelect = document.getElementById('menu-icecream-count');
          const selectedIcecreams = waffle.icecreams || [];
          if (icecreamCountSelect) {
            icecreamCountSelect.value = selectedIcecreams.length.toString();
          }
          renderIceCreamFlavorSelectors(selectedIcecreams.length, selectedIcecreams);

          // Imagen
          document.getElementById('menu-image-path').value = waffle.image || '';
          const preview = document.getElementById('menu-image-preview');
          if (waffle.image) {
            preview.style.backgroundImage = `url(/${waffle.image})`;
            preview.textContent = '';
          } else {
            preview.style.backgroundImage = 'none';
            preview.textContent = 'Sin vista previa de imagen';
          }

          document.getElementById('menu-form-title').textContent = 'Editar Waffle';
          document.getElementById('menu-form-cancel-btn').style.display = 'block';
          document.getElementById('menu-name').focus();
        }
      };
    });

    // Vincular botones eliminar
    grid.querySelectorAll('.delete-menu-item-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const waffle = menu.find(w => w.id === id);
        if (waffle && confirm(`¿Estás seguro de eliminar el waffle "${waffle.name}" del menú?`)) {
          deleteMenuItem(id);
        }
      };
    });
  };

  const deleteMenuItem = async (id) => {
    try {
      const res = await fetch(`/api/menu/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('Waffle eliminado de la carta');
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

  // Carga de Imagen
  const fileInput = document.getElementById('menu-image-file');
  const uploadBtn = document.getElementById('menu-upload-btn');
  const previewContainer = document.getElementById('menu-image-preview');
  const imagePathInput = document.getElementById('menu-image-path');

  uploadBtn.onclick = () => fileInput.click();

  const icecreamCountSelect = document.getElementById('menu-icecream-count');
  if (icecreamCountSelect) {
    icecreamCountSelect.onchange = () => {
      const count = parseInt(icecreamCountSelect.value) || 0;
      renderIceCreamFlavorSelectors(count);
    };
  }

  fileInput.onchange = async () => {
    const file = fileInput.files[0];
    if (!file) return;

    previewContainer.textContent = 'Procesando archivo...';
    previewContainer.style.backgroundImage = 'none';

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target.result;
      
      try {
        const uploadRes = await fetch('/api/menu/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            data: base64Data
          })
        });
        const uploadData = await uploadRes.json();

        if (uploadData.success) {
          imagePathInput.value = uploadData.fileName;
          previewContainer.style.backgroundImage = `url(/${uploadData.fileName})`;
          previewContainer.textContent = '';
          showToast('Imagen cargada con éxito');
        } else {
          showToast(uploadData.error || 'Error al cargar imagen en el servidor', true);
          previewContainer.textContent = 'Error al subir';
        }
      } catch (err) {
        console.error(err);
        showToast('Error de red al cargar imagen', true);
        previewContainer.textContent = 'Error de conexión';
      }
    };

    reader.onerror = () => {
      showToast('Error al leer el archivo local', true);
      previewContainer.textContent = 'Error de archivo';
    };

    reader.readAsDataURL(file);
  };

  // Cancelar edición de menú
  document.getElementById('menu-form-cancel-btn').onclick = () => {
    resetMenuForm();
  };

  const resetMenuForm = () => {
    document.getElementById('menu-crud-form').reset();
    document.getElementById('menu-edit-id').value = '';
    imagePathInput.value = '';
    previewContainer.style.backgroundImage = 'none';
    previewContainer.textContent = 'Sin vista previa de imagen';
    document.getElementById('menu-form-title').textContent = 'Crear Waffle de Carta';
    document.getElementById('menu-form-cancel-btn').style.display = 'none';

    // Limpiar helados
    const countSelect = document.getElementById('menu-icecream-count');
    if (countSelect) countSelect.value = '0';
    const flavorSelectors = document.getElementById('menu-icecreams-flavor-selectors');
    if (flavorSelectors) flavorSelectors.innerHTML = '';
  };

  // Submit CRUD Menú
  document.getElementById('menu-crud-form').onsubmit = async (e) => {
    e.preventDefault();

    const id = document.getElementById('menu-edit-id').value;
    const name = document.getElementById('menu-name').value;
    const description = document.getElementById('menu-desc').value;
    const price = parseInt(document.getElementById('menu-price').value);
    const base = document.getElementById('menu-base').value;
    const image = imagePathInput.value;

    const toppings = [];
    document.querySelectorAll('.menu-topping-checkbox:checked').forEach(chk => {
      toppings.push(chk.value);
    });

    const syrups = [];
    document.querySelectorAll('.menu-syrup-checkbox:checked').forEach(chk => {
      syrups.push(chk.value);
    });

    const icecreams = [];
    document.querySelectorAll('.menu-icecream-flavor-select').forEach(select => {
      if (select.value) {
        icecreams.push(select.value);
      }
    });

    const payload = { name, description, price, base, toppings, syrups, icecreams, image };

    try {
      let res;
      if (id) {
        res = await fetch(`/api/menu/${id}`, {
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
        showToast(id ? 'Waffle de menú actualizado' : 'Nuevo waffle creado');
        resetMenuForm();
        await loadState();
        renderCrudMenu();
      } else {
        const data = await res.json();
        showToast(data.error || 'Error al guardar el waffle', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Error de red', true);
    }
  };


  // --- PANEL 5: CONFIGURACIÓN DE SEGURIDAD (CAMBIO DE CLAVES) ---
  const resetSettingsForm = () => {
    document.getElementById('settings-credentials-form').reset();
  };

  document.getElementById('settings-credentials-form').onsubmit = async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('settings-current-pwd').value;
    const newAdminPassword = document.getElementById('settings-new-admin-pwd').value;
    const confirmAdminPwd = document.getElementById('settings-new-admin-pwd-confirm').value;
    const newCashierPin = document.getElementById('settings-new-cashier-pin').value;

    if (newAdminPassword && newAdminPassword !== confirmAdminPwd) {
      showToast('La nueva contraseña de administrador no coincide con la confirmación', true);
      return;
    }

    if (!newAdminPassword && !newCashierPin) {
      showToast('Debe ingresar al menos una nueva contraseña de administrador o PIN de caja', true);
      return;
    }

    const payload = { currentPassword };
    if (newAdminPassword) payload.newAdminPassword = newAdminPassword;
    if (newCashierPin) payload.newCashierPin = newCashierPin;

    try {
      const res = await fetch('/api/auth/change-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        showToast('¡Credenciales actualizadas con éxito!');
        resetSettingsForm();
      } else {
        showToast(data.error || 'Error al actualizar credenciales', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Error al conectar con el servidor', true);
    }
  };

  // --- VERIFICACIÓN DE SESIÓN INICIAL AL CARGAR ---
  if (sessionStorage.getItem('admin_authenticated') === 'true') {
    loginOverlay.style.display = 'none';
    switchAdminView('analytics');
  } else {
    loginOverlay.style.display = 'flex';
  }

  // --- CONTROL DEL MODAL DE AYUDA ADMIN ---
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
