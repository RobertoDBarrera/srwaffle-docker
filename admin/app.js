// Lógica del Módulo de Administración - Sr. Waffle (Backoffice)

// --- INTERCEPTOR DE FETCH PARA JWT ---
const originalFetch = window.fetch;
window.fetch = async function() {
  let [resource, config] = arguments;
  if(config === undefined) { config = {}; }
  if(config.headers === undefined) { config.headers = {}; }
  const token = sessionStorage.getItem('admin_jwt_token');
  if(token) { config.headers['Authorization'] = 'Bearer ' + token; }
  
  const response = await originalFetch(resource, config);
  if (response.status === 401 && resource !== '/api/auth/verify-admin') {
    // Token expirado o inválido
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_jwt_token');
    document.getElementById('admin-login-overlay').style.display = 'flex';
    showToast('Sesión cerrada');
  }
  return response;
};

document.addEventListener('DOMContentLoaded', () => {
  // --- INICIALIZACIÓN DE ESTADO ---
  let stock = {};
  let flatStock = [];
  let masas = [];
  let waffles = [];
  let sales = [];
  let menu = [];
  let employees = [];
  let reviews = [];
  let currentAdminView = 'analytics';

  // --- ELEMENTOS DEL DOM ---
  const toast = document.getElementById('toast');
  const loginOverlay = document.getElementById('admin-login-overlay');
  const loginBtn = document.getElementById('admin-login-btn');
  const passwordInput = document.getElementById('admin-password-input');

  const adminViews = {
    analytics: document.getElementById('admin-view-analytics'),
    'crud-stock': document.getElementById('admin-view-crud-stock'),
    'crud-recipes': document.getElementById('admin-view-crud-recipes'),
    'crud-waffles': document.getElementById('admin-view-crud-waffles'),
    'crud-menu': document.getElementById('admin-view-crud-menu'),
    settings: document.getElementById('admin-view-settings'),
    themes: document.getElementById('admin-view-themes'),
    developer: document.getElementById('admin-view-developer'),
    company: document.getElementById('admin-view-company'),
    'settings-ui': document.getElementById('admin-view-settings-ui'),
    docs: document.getElementById('admin-view-docs'),
    empleados: document.getElementById('admin-view-empleados'),
    reviews: document.getElementById('admin-view-reviews')
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
  window.showToast = showToast;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(value);
  };

  const formatStockAmount = (amount, unit) => {
    let u = (unit || '').toLowerCase();
    if (u === 'g' || u === 'gr' || u === 'gramos') {
      if (amount >= 1000) return `${(amount / 1000).toFixed(2)} Kg`;
      return `${amount} g`;
    }
    if (u === 'ml' || u === 'mililitros') {
      if (amount >= 1000) return `${(amount / 1000).toFixed(2)} L`;
      return `${amount} ml`;
    }
    return `${amount} ${unit}`;
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
      flatStock = await stockRes.json();
      stock = {
         bases: flatStock.filter(s => ['raw_material', 'packaging', 'cleaning', 'Base'].includes(s.category)),
         spreads: flatStock.filter(s => ['spread', 'Relleno'].includes(s.category)),
         toppings: flatStock.filter(s => ['topping', 'Topping'].includes(s.category)),
         syrups: flatStock.filter(s => ['syrup', 'Sirope'].includes(s.category)),
         drinks: flatStock.filter(s => ['drink', 'Bebida'].includes(s.category)),
         icecreams: flatStock.filter(s => ['icecream', 'Helado'].includes(s.category))
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
      employees = await empRes.json();

      const revRes = await fetch('/api/reviews');
      reviews = await revRes.json();
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
        sessionStorage.setItem('admin_jwt_token', data.token);
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
    sessionStorage.removeItem('admin_jwt_token');
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
      if (adminViews[key]) {
        if (key === viewName) {
          adminViews[key].classList.add('active');
        } else {
          adminViews[key].classList.remove('active');
        }
      }
    }

    // Refrescar el estado desde el servidor
    await loadState();

    if (viewName === 'analytics') renderAnalytics();
    if (viewName === 'crud-stock') renderCrudStock();
    if (viewName === 'crud-recipes') renderCrudRecipes();
    if (viewName === 'crud-waffles') renderCrudWaffles();
    if (viewName === 'crud-menu') renderCrudMenu();
    if (viewName === 'settings') resetSettingsForm();
    if (viewName === 'docs') loadDocsView();
    if (viewName === 'themes') loadThemesGallery();
    if (viewName === 'developer') loadDeveloperSettingsPanel();
    if (viewName === 'company') loadCompanySettingsPanel();
    if (viewName === 'settings-ui') loadCompanySettingsPanel();
    if (viewName === 'empleados') renderCrudEmployees();
    if (viewName === 'reviews') renderReviews();
  };

  adminMenuItems.forEach(item => {
    item.addEventListener('click', () => {
      const view = item.getAttribute('data-admin-view');
      if (view) switchAdminView(view);
    });
  });

  // --- RESEÑAS ---
  const renderReviews = () => {
    const tbody = document.getElementById('reviews-table-body');
    if (!tbody) return;

    if (reviews.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">No hay reseñas aún.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    reviews.forEach(review => {
      const tr = document.createElement('tr');
      const dateStr = new Date(review.created_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
      const ratingIcon = review.rating === 'positive' ? '👍' : '👎';
      
      tr.innerHTML = `
        <td>${dateStr}</td>
        <td style="font-family: monospace; font-size: 1.1rem;">#${review.sale_id}</td>
        <td style="font-size: 1.5rem;">${ratingIcon}</td>
        <td>${review.comment || '-'}</td>
      `;
      tbody.appendChild(tr);
    });
  };

  // --- PANEL 1: ANALYTICS & HISTORIAL DE VENTAS ---
  const getFilteredSales = () => {
    const startInput = document.getElementById('filter-start-date');
    const endInput = document.getElementById('filter-end-date');

    // Por defecto hoy si están vacíos
    if (startInput && !startInput.value) {
      const today = new Date();
      const offset = today.getTimezoneOffset() * 60000;
      startInput.value = (new Date(today - offset)).toISOString().split('T')[0];
    }
    if (endInput && !endInput.value) {
      const today = new Date();
      const offset = today.getTimezoneOffset() * 60000;
      endInput.value = (new Date(today - offset)).toISOString().split('T')[0];
    }

    if (startInput && endInput && startInput.value && endInput.value) {
      const startParts = startInput.value.split('-');
      const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2], 0, 0, 0);

      const endParts = endInput.value.split('-');
      const endDate = new Date(endParts[0], endParts[1] - 1, endParts[2], 23, 59, 59, 999);

      return sales.filter(s => {
        const d = new Date(s.date);
        return d >= startDate && d <= endDate;
      });
    }
    return sales;
  };

  const renderAnalytics = () => {
    const filteredSales = getFilteredSales();
    const activeSales = filteredSales.filter(s => s.status === 'completed');
    const totalEarnings = activeSales.reduce((sum, s) => sum + s.total, 0);
    const totalOrders = activeSales.length;
    const avgTicket = totalOrders > 0 ? totalEarnings / totalOrders : 0;
    
    const toppingCounts = {};
    filteredSales.forEach(sale => {
      if (sale.status !== 'completed') return;
      sale.items.forEach(item => {
        let textToSearch = item.details || '';
        // If it's a menu_waffle, toppings are in item.config.toppings
        if (item.type === 'menu_waffle' && item.config && Array.isArray(item.config.toppings)) {
          textToSearch += ' ' + item.config.toppings.join(' ');
        }

        if (textToSearch) {
          stock.toppings.forEach(top => {
            if (textToSearch.includes(top.name)) {
              // Add quantity if item.quantity > 1
              const qty = item.quantity || item.qty || 1;
              toppingCounts[top.name] = (toppingCounts[top.name] || 0) + qty;
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

    let totalKitchenMins = 0;
    let completedKitchenTickets = 0;
    activeSales.forEach(sale => {
      if (sale.kdsCompletedAt && sale.date) {
        const diffMins = (new Date(sale.kdsCompletedAt) - new Date(sale.date)) / 60000;
        if (diffMins > 0) {
          totalKitchenMins += diffMins;
          completedKitchenTickets++;
        }
      }
    });
    const avgKitchenTime = completedKitchenTickets > 0 ? (totalKitchenMins / completedKitchenTickets) : 0;

    document.getElementById('stat-earnings').textContent = formatCurrency(totalEarnings);
    document.getElementById('stat-orders').textContent = totalOrders;
    
    const avgTicketEl = document.getElementById('stat-avg-ticket') || document.getElementById('stat-ticket');
    if (avgTicketEl) avgTicketEl.textContent = formatCurrency(avgTicket);
    
    const avgKitchenTimeEl = document.getElementById('stat-avg-kitchen-time');
    if (avgKitchenTimeEl) {
      avgKitchenTimeEl.textContent = avgKitchenTime > 0 ? `${Math.round(avgKitchenTime)} min` : '-- min';
    }
    
    document.getElementById('stat-topping').textContent = bestTopping === 'Ninguno' ? 'N/A' : `${bestTopping} (${maxToppingCount} u)`;

    // VENTAS POR CAJERO
    const cashierStats = {};
    activeSales.forEach(sale => {
      const cashier = sale.cashierName || 'Administrador';
      if (!cashierStats[cashier]) {
        cashierStats[cashier] = { ops: 0, total: 0 };
      }
      cashierStats[cashier].ops += 1;
      cashierStats[cashier].total += sale.total;
    });

    const tbodyCashiers = document.getElementById('sales-by-cashier-body');
    if (tbodyCashiers) {
      tbodyCashiers.innerHTML = '';
      Object.keys(cashierStats).forEach(cName => {
        const stats = cashierStats[cName];
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight: 600;">${cName}</td>
          <td>${stats.ops}</td>
          <td style="color: var(--neon-green); font-weight: bold;">${formatCurrency(stats.total)}</td>
        `;
        tbodyCashiers.appendChild(tr);
      });
      if (Object.keys(cashierStats).length === 0) {
        tbodyCashiers.innerHTML = '<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">No hay ventas registradas.</td></tr>';
      }
    }

    renderSalesChart(activeSales);
    renderToppingsRanking(toppingCounts);
    renderTransactionsTable(filteredSales);
  };

  const renderSalesChart = (activeSales) => {
    const chartContainer = document.getElementById('sales-bar-chart');
    if (!chartContainer) return;

    chartContainer.innerHTML = '';
    chartContainer.style.overflowX = 'auto';
    chartContainer.style.justifyContent = 'flex-start';

    const dailySales = {};
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    const startInput = document.getElementById('filter-start-date');
    const endInput = document.getElementById('filter-end-date');
    
    let startDate, endDate;
    if (startInput && endInput && startInput.value && endInput.value) {
      const sParts = startInput.value.split('-');
      startDate = new Date(sParts[0], sParts[1]-1, sParts[2]);
      const eParts = endInput.value.split('-');
      endDate = new Date(eParts[0], eParts[1]-1, eParts[2]);
    } else {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 6);
    }

    // Limitar a un rango máximo razonable si se seleccionan muchos días para no colgar el navegador
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 90) {
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 90);
    }

    const current = new Date(startDate);
    while (current <= endDate) {
      const dateString = current.toDateString();
      dailySales[dateString] = {
        label: `${dayNames[current.getDay()]} ${current.getDate()}`,
        amount: 0
      };
      current.setDate(current.getDate() + 1);
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

  const renderTransactionsTable = (salesData = sales) => {
    const container = document.getElementById('transactions-table-body');
    if (!container) return;

    container.innerHTML = '';

    salesData.forEach(sale => {
      const tr = document.createElement('tr');
      const dateFormatted = new Date(sale.date).toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
      const itemsList = sale.items.map(i => i.name).join(' + ');

      const trackingCode = sale.id || 'N/A';
      const cashier = sale.cashierName || 'Administrador';

      tr.innerHTML = `
        <td style="color:var(--text-muted); font-size:0.8rem;">${dateFormatted}</td>
        <td style="color:var(--neon-pink); font-family: 'Courier New', Courier, monospace; font-weight: bold;">#${trackingCode}</td>
        <td style="color:var(--text-secondary);">${cashier}</td>
        <td style="color:var(--neon-cyan); font-weight:700;">${formatCurrency(sale.total)}</td>
        <td>
          <button class="btn-primary btn-sm view-sale-detail-btn" data-sale-id="${sale.id}" style="padding: 0.3rem 0.8rem; font-size: 0.75rem;">Detalle</button>
        </td>
      `;

      container.appendChild(tr);
    });

    container.querySelectorAll('.view-sale-detail-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-sale-id');
        openSaleDetailModal(id);
      };
    });
  };

  const openSaleDetailModal = (saleId) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    document.getElementById('sale-detail-code').textContent = `#${sale.id}`;
    document.getElementById('sale-detail-date').textContent = new Date(sale.date).toLocaleString('es-AR');
    document.getElementById('sale-detail-cashier').textContent = sale.cashierName || 'Administrador';
    document.getElementById('sale-detail-customer').textContent = sale.customerName || 'No registrado';
    document.getElementById('sale-detail-payment').textContent = sale.paymentMethod;
    document.getElementById('sale-detail-total').textContent = formatCurrency(sale.total);

    const itemsContainer = document.getElementById('sale-detail-items');
    itemsContainer.innerHTML = sale.items.map(item => {
      let details = item.details || '';
      if (item.type === 'menu_waffle' && item.config && Array.isArray(item.config.toppings)) {
        details += (details ? ' + ' : '') + item.config.toppings.join(', ');
      }
      const qtyStr = (item.quantity && item.quantity > 1) ? `${item.quantity}x ` : '';
      return `<div style="margin-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px;">
                <strong>${qtyStr}${item.name}</strong>
                ${details ? `<br><span style="color:var(--text-muted); font-size: 0.8rem;">${details}</span>` : ''}
              </div>`;
    }).join('');

    const reviewContainer = document.getElementById('sale-detail-review');
    const review = reviews.find(r => r.sale_id === sale.id);
    if (review) {
      const emoji = review.rating === 'positive' ? '👍' : '👎';
      const color = review.rating === 'positive' ? 'var(--neon-green)' : 'var(--neon-pink)';
      reviewContainer.innerHTML = `<span style="font-size:1.2rem; color:${color};">${emoji}</span> <span style="margin-left:8px; color:var(--text-primary);">${review.comment || 'Sin comentario adicional'}</span>`;
    } else {
      reviewContainer.innerHTML = 'Sin reseña';
    }

    const refundContainer = document.getElementById('sale-detail-refund-container');
    if (sale.status === 'completed') {
      refundContainer.innerHTML = `<button class="refund-btn" style="padding: 0.5rem 1rem;" data-sale-id="${sale.id}">Devolver Venta</button>`;
      refundContainer.querySelector('.refund-btn').onclick = () => {
        if (confirm(`¿Está seguro de reembolsar la venta por ${formatCurrency(sale.total)}?`)) {
          refundSale(sale.id);
          document.getElementById('sale-detail-modal').style.display = 'none';
        }
      };
    } else {
      refundContainer.innerHTML = `<span class="badge-refunded">Reembolsado</span>`;
    }

    document.getElementById('sale-detail-modal').style.display = 'flex';
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
  document.getElementById('export-report-btn')?.addEventListener('click', () => {
    const filteredSales = typeof getFilteredSales === 'function' ? getFilteredSales() : sales;
    if (filteredSales.length === 0) {
      showToast('No hay transacciones para exportar', true);
      return;
    }

    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += 'ID Venta,Fecha,Productos,Total Venta,Metodo Pago,Estado\n';

    filteredSales.forEach(sale => {
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
  });

  // Filtros de fecha
  const btnApplyFilter = document.getElementById('btn-apply-date-filter');
  if (btnApplyFilter) {
    btnApplyFilter.onclick = () => {
      renderAnalytics();
    };
  }

  const btnClearFilter = document.getElementById('btn-clear-date-filter');
  if (btnClearFilter) {
    btnClearFilter.onclick = () => {
      const startInput = document.getElementById('filter-start-date');
      const endInput = document.getElementById('filter-end-date');
      if (startInput) startInput.value = '';
      if (endInput) endInput.value = '';
      renderAnalytics();
    };
  }

  // --- PANEL 2: CONTROL DE STOCK (TABLA PRINCIPAL) ---
  const translateCategory = (cat) => {
    const maps = { bases: 'masas', toppings: 'toppings', syrups: 'salsas', drinks: 'bebidas', icecreams: 'helados', raw_material: 'materia prima' };
    return maps[cat] || cat;
  };

  // Botón Nuevo Producto (Stock)
  const btnOpenStockModal = document.getElementById('btn-open-add-stock-modal');
  if (btnOpenStockModal) {
    btnOpenStockModal.addEventListener('click', () => {
      document.getElementById('stock-crud-form').reset();
      document.getElementById('stock-edit-id').value = '';
      if (document.getElementById('stock-total-cost')) document.getElementById('stock-total-cost').dataset.oldCost = '0';
      document.getElementById('stock-form-title').textContent = 'Crear Producto';
      if (document.getElementById('stock-form-cancel-btn')) document.getElementById('stock-form-cancel-btn').style.display = 'block';
      
      const modal = document.getElementById('stock-modal-overlay');
      if (modal) modal.style.display = 'flex';
      setTimeout(() => document.getElementById('stock-name').focus(), 100);
    });
  }

  const closeStockModalBtn = document.getElementById('close-stock-modal');
  if (closeStockModalBtn) {
    closeStockModalBtn.addEventListener('click', () => {
      document.getElementById('stock-modal-overlay').style.display = 'none';
    });
  }
  
  const cancelStockModalBtn = document.getElementById('stock-form-cancel-btn');
  if (cancelStockModalBtn) {
    cancelStockModalBtn.addEventListener('click', () => {
      document.getElementById('stock-modal-overlay').style.display = 'none';
    });
  }

  const closeHistoryModalBtn = document.getElementById('close-history-modal');
  if (closeHistoryModalBtn) {
    closeHistoryModalBtn.addEventListener('click', () => {
      document.getElementById('stock-history-modal').style.display = 'none';
    });
  }

  const closeRestockModalBtn = document.getElementById('close-restock-modal');
  if (closeRestockModalBtn) {
    closeRestockModalBtn.addEventListener('click', () => {
      document.getElementById('stock-restock-modal').style.display = 'none';
    });
  }

  // Enviar formulario Reabastecer
  const restockForm = document.getElementById('stock-restock-form');
  if (restockForm) {
    restockForm.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('restock-id').value;
      const qty = parseFloat(document.getElementById('restock-qty').value) || 0;
      const unit = document.getElementById('restock-unit').value;
      const cost = parseFloat(document.getElementById('restock-cost').value) || 0;
      
      const item = getStockItem(id);
      let factor = 1;
      if (item) {
        if (unit === 'kg' && item.unit === 'g') factor = 1000;
        if (unit === 'l' && item.unit === 'ml') factor = 1000;
      }
      
      const baseQty = qty * factor;
      
      try {
        const res = await fetch('/api/stock/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id, 
            stockToAdd: baseQty,
            purchase_quantity: qty,
            purchase_unit: unit,
            total_cost: cost
          })
        });
        if (res.ok) {
          showToast('Stock reabastecido con éxito');
          document.getElementById('stock-restock-modal').style.display = 'none';
          await loadState();
          renderCrudStock();
        } else {
          showToast('Error al reabastecer', true);
        }
      } catch (err) {
        showToast('Error de conexión', true);
      }
    };
  }

  // Botón Nuevo Insumo Elaborado
  const btnAddRecipe = document.getElementById('btn-add-recipe');
  if (btnAddRecipe) {
    btnAddRecipe.addEventListener('click', () => {
      if (typeof resetRecipeForm === 'function') resetRecipeForm();
      switchAdminView('crud-recipes');
      setTimeout(() => document.getElementById('recipe-name')?.focus(), 100);
    });
  }

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
        
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="form-group">
            <label style="font-size: 0.8rem;">Envases Comprados</label>
            <input type="number" step="any" id="restock-packs" class="form-control" placeholder="Ej: 5" min="0" value="1" required>
          </div>
          <div class="form-group">
            <label style="font-size: 0.8rem;">Rendimiento (${item.unit})</label>
            <input type="number" step="any" id="restock-yield" class="form-control" placeholder="Ej: 1000" min="0" value="1" required>
          </div>
        </div>
        
        <div class="form-group">
          <label style="font-size: 0.8rem;">Total a Sumar (${item.unit})</label>
          <input type="number" step="any" id="restock-qty" class="form-control" value="1" readonly style="border-color:var(--neon-cyan); color:var(--neon-cyan); font-weight:bold;">
        </div>
        
        <div class="modal-actions" style="margin-top: 15px;">
          <button class="btn-secondary" id="restock-cancel" style="padding: 0.6rem 1.2rem;">Cancelar</button>
          <button class="btn-primary" id="restock-confirm" style="padding: 0.6rem 1.2rem;">Guardar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const packsInput = document.getElementById('restock-packs');
    const yieldInput = document.getElementById('restock-yield');
    const qtyInput = document.getElementById('restock-qty');

    const updateRestockQty = () => {
      const p = parseFloat(packsInput.value) || 0;
      const y = parseFloat(yieldInput.value) || 0;
      qtyInput.value = (p * y).toFixed(2);
    };

    packsInput.addEventListener('input', updateRestockQty);
    yieldInput.addEventListener('input', updateRestockQty);

    document.getElementById('restock-cancel').onclick = () => modal.remove();
    document.getElementById('restock-confirm').onclick = async () => {
      const qtyVal = parseFloat(qtyInput.value);
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
          renderCrudStock();
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
          renderCrudStock();
        } else {
          showToast('Error en el servidor', true);
        }
      } catch (err) {
        console.error(err);
        showToast('Error de red', true);
      }
    };
  };


  if (document.getElementById('crud-stock-search')) {
    document.getElementById('crud-stock-search').oninput = () => {
      if (typeof renderCrudStock === 'function') renderCrudStock();
    };
  }

  const renderCrudStock = () => {
    const listBody = document.getElementById('crud-stock-list-body');
    if (!listBody) return;

    listBody.innerHTML = '';

    let flatStock = [];
    if (Array.isArray(stock)) {
      flatStock = [...stock];
    } else {
      for (const cat in stock) {
        flatStock = flatStock.concat(stock[cat]);
      }
    }
    flatStock = flatStock.filter(item => !item.recipe);

    // Calc KPIs
    let totalItems = flatStock.length;
    let inStock = flatStock.filter(i => i.stock > 0).length;
    let lowStock = flatStock.filter(i => i.stock <= i.minStock).length;
    
    if (document.getElementById('kpi-total-items')) document.getElementById('kpi-total-items').textContent = totalItems;
    if (document.getElementById('kpi-in-stock')) document.getElementById('kpi-in-stock').textContent = inStock;
    if (document.getElementById('kpi-low-stock')) document.getElementById('kpi-low-stock').textContent = lowStock;

    const searchInput = document.getElementById('crud-stock-search');
    if (searchInput && searchInput.value) {
      const query = searchInput.value.toLowerCase();
      flatStock = flatStock.filter(item => item.name.toLowerCase().includes(query) || item.category.toLowerCase().includes(query));
    }

    flatStock.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:600;">${item.name}</td>
        <td style="text-transform: capitalize; color:var(--text-secondary);">${translateCategory(item.category)}</td>
        <td style="font-weight:bold; color: ${item.stock <= item.minStock ? 'var(--status-critical)' : 'var(--neon-cyan)'};">${item.stock} ${item.unit}</td>
        <td style="color:var(--text-muted);">${item.purchase_quantity || 0} ${item.purchase_unit || ''}</td>
        <td>${formatCurrency(item.total_cost || 0)}</td>
        <td><span style="font-size:0.8rem; color:var(--text-secondary);">(${formatCurrency(item.cost || 0)}/${item.unit})</span></td>
        <td>${item.price > 0 ? formatCurrency(item.price) : '<span style="color:#666;">N/A</span>'}</td>
        <td>
          <div style="display:flex; gap: 8px;">
            <button class="refund-btn restock-stock-item-btn" data-id="${item.id}" style="background:var(--neon-green); color:#000;">+ Ingreso</button>
            <button class="refund-btn history-stock-item-btn" data-id="${item.id}" style="background:#0d6efd; color:#fff;">Historial</button>
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
          document.getElementById('stock-cost').value = item.cost || 0;
          
          if (document.getElementById('stock-portion-size')) document.getElementById('stock-portion-size').value = item.portion_size || 0;
          if (document.getElementById('stock-price-per-portion')) document.getElementById('stock-price-per-portion').value = item.price_per_portion || 0;
          
          if (document.getElementById('stock-purchase-qty')) document.getElementById('stock-purchase-qty').value = item.purchase_quantity || '';
          if (document.getElementById('stock-purchase-unit')) document.getElementById('stock-purchase-unit').value = item.purchase_unit || item.unit;
          if (document.getElementById('stock-total-cost')) document.getElementById('stock-total-cost').value = item.total_cost || '';
          
          if (document.getElementById('stock-qty')) document.getElementById('stock-qty').value = item.stock;
          if (document.getElementById('stock-unit')) document.getElementById('stock-unit').value = item.unit;
          
          document.getElementById('stock-form-title').textContent = 'Editar Producto';
          if (document.getElementById('stock-form-cancel-btn')) document.getElementById('stock-form-cancel-btn').style.display = 'block';
          
          const modal = document.getElementById('stock-modal-overlay');
          if (modal) modal.style.display = 'flex';
          setTimeout(() => document.getElementById('stock-name').focus(), 100);

          // Trigger change on category to show/hide margin calculator
          document.getElementById('stock-category').dispatchEvent(new Event('change'));
        }
      };
    });

    // Eventos Reabastecer
    listBody.querySelectorAll('.restock-stock-item-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const item = getStockItem(id);
        if (item) {
          document.getElementById('stock-restock-form').reset();
          document.getElementById('restock-id').value = id;
          document.getElementById('restock-unit').value = item.purchase_unit || item.unit;
          document.getElementById('stock-restock-modal').style.display = 'flex';
          setTimeout(() => document.getElementById('restock-qty').focus(), 100);
        }
      };
    });

    // Eventos Historial
    listBody.querySelectorAll('.history-stock-item-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.getAttribute('data-id');
        const item = getStockItem(id);
        if (item) {
          try {
            const res = await fetch('/api/stock/' + id + '/history');
            if (res.ok) {
              const data = await res.json();
              const historyBody = document.getElementById('stock-history-body');
              if (historyBody) {
                historyBody.innerHTML = '';
                data.forEach(mov => {
                  const tr = document.createElement('tr');
                  const d = new Date(mov.created_at).toLocaleString();
                  tr.innerHTML = `
                    <td>${d}</td>
                    <td><span class="${mov.type === 'IN' ? 'badge-ok' : 'badge-alert'}">${mov.type === 'IN' ? 'ENTRADA' : 'SALIDA'}</span></td>
                    <td style="color:var(--text-secondary);">${mov.reason}</td>
                    <td style="font-weight:bold;">${mov.type === 'IN' ? '+' : '-'}${parseFloat(mov.quantity)}</td>
                    <td>${formatCurrency(mov.unit_cost)}</td>
                  `;
                  historyBody.appendChild(tr);
                });
                document.getElementById('stock-history-modal').style.display = 'flex';
              }
            }
          } catch(err) {
            showToast('Error cargando historial', true);
          }
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
  document.getElementById('stock-form-cancel-btn')?.addEventListener('click', () => {
    resetStockForm();
  });

  // Calculadoras automáticas de Stock
  const setupStockCalculators = () => {
    const packCost = document.getElementById('stock-pack-cost');
    const packUnits = document.getElementById('stock-pack-units');
    const packPurchased = document.getElementById('stock-pack-purchased');
    const stockQty = document.getElementById('stock-qty');
    const unitPrice = document.getElementById('stock-cost');
    const category = document.getElementById('stock-category');
    const marginCalc = document.getElementById('stock-margin-calculator');
    const marginPercent = document.getElementById('stock-margin-percent');
    const sellingPrice = document.getElementById('stock-selling-price');

    const calculatePack = () => {
      const cost = parseFloat(packCost?.value) || 0;
      const units = parseFloat(packUnits?.value) || 1;
      const purchased = parseFloat(packPurchased?.value) || 0;
      
      if (unitPrice) unitPrice.value = (cost / units).toFixed(2);
      if (stockQty && purchased > 0) stockQty.value = (purchased * units).toFixed(2);
      
      calculateMargin();
    };

    const calculateMargin = () => {
      if (category?.value === 'drink' || category?.value === 'direct') {
        if (marginCalc) marginCalc.style.display = 'block';
        const cost = parseFloat(unitPrice?.value) || 0;
        const margin = parseFloat(marginPercent?.value) || 0;
        if (sellingPrice) sellingPrice.value = (cost + (cost * margin / 100)).toFixed(2);
      } else {
        if (marginCalc) marginCalc.style.display = 'none';
      }
    };

    const calculateReverseMargin = () => {
      const cost = parseFloat(unitPrice?.value) || 0;
      const sellPrice = parseFloat(sellingPrice?.value) || 0;
      if (cost > 0 && marginPercent) {
        const margin = ((sellPrice - cost) / cost) * 100;
        marginPercent.value = margin.toFixed(1);
      }
    };

    packCost?.addEventListener('input', calculatePack);
    packUnits?.addEventListener('input', calculatePack);
    packPurchased?.addEventListener('input', calculatePack);
    unitPrice?.addEventListener('input', calculateMargin);
    category?.addEventListener('change', calculateMargin);
    marginPercent?.addEventListener('input', calculateMargin);
    sellingPrice?.addEventListener('input', calculateReverseMargin);
  };

  setupStockCalculators();

  const resetStockForm = () => {
    document.getElementById('stock-crud-form').reset();
    document.getElementById('stock-edit-id').value = '';
    document.getElementById('stock-margin-percent') && (document.getElementById('stock-margin-percent').value = '0');
    document.getElementById('stock-selling-price') && (document.getElementById('stock-selling-price').value = '0');
    document.getElementById('stock-margin-calculator') && (document.getElementById('stock-margin-calculator').style.display = 'none');
    document.getElementById('stock-form-title').textContent = 'Crear Producto';
    if (document.getElementById('stock-form-cancel-btn')) document.getElementById('stock-form-cancel-btn').style.display = 'none';
    if (document.getElementById('stock-modal-overlay')) document.getElementById('stock-modal-overlay').style.display = 'none';
  };

  // Enviar formulario CRUD insumos (Crear / Editar)
  document.getElementById('stock-crud-form').onsubmit = async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('stock-edit-id').value;
    const name = document.getElementById('stock-name').value;
    const category = document.getElementById('stock-category').value;
    
    // Convert Purchase Unit to Base Unit
    const purchaseQty = parseFloat(document.getElementById('stock-purchase-qty').value) || 0;
    const purchaseUnit = document.getElementById('stock-purchase-unit').value;
    const baseUnit = document.getElementById('stock-base-unit').value;
    const totalCost = parseFloat(document.getElementById('stock-total-cost').value) || 0;
    
    let factor = 1;
    if (purchaseUnit === 'kg' && baseUnit === 'g') factor = 1000;
    if (purchaseUnit === 'l' && baseUnit === 'ml') factor = 1000;
    
    let finalStock = parseInt(document.getElementById('stock-qty').value) || 0;
    let finalCost = parseFloat(document.getElementById('stock-total-cost').dataset.oldCost) || 0;
    
    if (purchaseQty > 0) {
      finalStock = purchaseQty * factor;
      finalCost = finalStock > 0 ? (totalCost / finalStock) : 0;
    }
    
    const portionSizeInput = document.getElementById('stock-portion-size');
    const pricePerPortionInput = document.getElementById('stock-price-per-portion');
    const portion_size = portionSizeInput ? (parseInt(portionSizeInput.value) || 0) : 0;
    const price_per_portion = pricePerPortionInput ? (parseInt(pricePerPortionInput.value) || 0) : 0;
    
    const minStock = parseInt(document.getElementById('stock-min').value) || 0;

    const payload = { 
      name, 
      category, 
      cost: finalCost, 
      stock: finalStock, 
      minStock, 
      unit: baseUnit, 
      portion_size, 
      price_per_portion,
      purchase_quantity: purchaseQty,
      purchase_unit: purchaseUnit,
      total_cost: totalCost
    };

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


  // --- COST CALCULATOR ANALYZER ---
  const updateFormFinancialAnalysis = () => {
    const costSpan = document.getElementById('menu-recipe-cost-display');
    const marginPercentInput = document.getElementById('menu-margin-percent');
    const priceInput = document.getElementById('menu-price');
    const menuType = document.getElementById('menu-type')?.value;

    if (!costSpan || !marginPercentInput || !priceInput) return;

    let totalCost = 0;
    
    if (menuType === 'direct') {
      const stockId = document.getElementById('menu-stock-id').value;
      if (stockId) {
        totalCost = getStockItem(stockId)?.cost || 0;
      }
    } else {
      // Base
      const baseId = document.getElementById('menu-base').value;
      if (baseId) {
        totalCost += getStockItem(baseId)?.cost || 0;
      }

      // Toppings
      document.querySelectorAll('.menu-topping-checkbox:checked').forEach(chk => {
        totalCost += getStockItem(chk.value)?.cost || 0;
      });

      // Syrups
      document.querySelectorAll('.menu-syrup-checkbox:checked').forEach(chk => {
        totalCost += getStockItem(chk.value)?.cost || 0;
      });

      // Ice creams
      document.querySelectorAll('.menu-icecream-flavor-select').forEach(sel => {
        totalCost += getStockItem(sel.value)?.cost || 0;
      });
    }

    costSpan.textContent = formatCurrency(totalCost);

    // Si el usuario cambia el input de margen, actualizamos el precio
    const calculatePriceFromMargin = () => {
      const margin = parseFloat(marginPercentInput.value) || 0;
      const calculatedPrice = Math.ceil(totalCost * (1 + (margin / 100)));
      priceInput.value = calculatedPrice;
    };

    // Si el usuario cambia el precio, actualizamos el margen inverso
    const calculateMarginFromPrice = () => {
      const price = parseFloat(priceInput.value) || 0;
      if (totalCost > 0) {
        const margin = ((price - totalCost) / totalCost) * 100;
        marginPercentInput.value = margin.toFixed(1);
      }
    };

    // Store cost temporarily to be used by event listeners
    marginPercentInput.dataset.cost = totalCost;
  };

  const setupMenuCalculators = () => {
    const marginPercentInput = document.getElementById('menu-margin-percent');
    const priceInput = document.getElementById('menu-price');
    
    if (marginPercentInput) {
      marginPercentInput.addEventListener('input', () => {
        const totalCost = parseFloat(marginPercentInput.dataset.cost) || 0;
        const margin = parseFloat(marginPercentInput.value) || 0;
        const calculatedPrice = Math.ceil(totalCost * (1 + (margin / 100)));
        priceInput.value = calculatedPrice;
      });
    }

    if (priceInput) {
      priceInput.addEventListener('input', () => {
        const totalCost = parseFloat(marginPercentInput.dataset.cost) || 0;
        const price = parseFloat(priceInput.value) || 0;
        if (totalCost > 0) {
          const margin = ((price - totalCost) / totalCost) * 100;
          marginPercentInput.value = margin.toFixed(1);
        } else {
          marginPercentInput.value = '0';
        }
      });
    }
  };

  setupMenuCalculators();

  // --- PANEL RECETAS (INSUMOS ELABORADOS) ---
  let recipeIngredients = []; // [{ id: 'ing1', stockId: 'raw_1', qty: 1 }]

  const renderCrudRecipes = () => {
    const listBody = document.getElementById('crud-recipes-list-body');
    if (!listBody) return;
    listBody.innerHTML = '';

    if (!masas || masas.length === 0) {
      listBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:1rem; color:var(--text-secondary);">No hay insumos elaborados creados.</td></tr>';
      return;
    }

    masas.forEach(item => {
      const tr = document.createElement('tr');
      const yieldQty = item.yield_qty || 1;
      
      tr.innerHTML = `
        <td style="font-weight: 600;">${item.name}</td>
        <td>${yieldQty} porciones</td>
        <td style="font-weight:bold; color:var(--neon-cyan);">${item.stock} porciones</td>
        <td>
          <div style="display:flex; gap: 8px;">
            <button class="refund-btn" onclick="produceRecipe('${item.id}')" style="background:var(--neon-purple); color:#fff;">Fabricar Lote</button>
            <button class="refund-btn edit-recipe-btn" data-id="${item.id}" style="background:var(--neon-cyan); color:#000;">Editar</button>
            <button class="refund-btn delete-recipe-btn" data-id="${item.id}" style="background:#e63946; color:#fff;">Eliminar</button>
          </div>
        </td>
      `;
      listBody.appendChild(tr);
    });

    listBody.querySelectorAll('.delete-recipe-btn').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('¿Seguro que deseas eliminar este insumo elaborado?')) return;
        const id = btn.getAttribute('data-id');
        try {
          const res = await fetch('/api/masas/' + id, { method: 'DELETE' });
          if (res.ok) {
            showToast('Eliminado');
            await loadState();
            renderCrudRecipes();
          }
        } catch(err) { showToast('Error', true); }
      };
    });

    listBody.querySelectorAll('.edit-recipe-btn').forEach(btn => {
      btn.onclick = () => editRecipe(btn.getAttribute('data-id'));
    });
    
    renderRecipeIngredientsList();
  };

  const renderRecipeIngredientsList = () => {
    const container = document.getElementById('recipe-ingredients-list');
    if (!container) return;
    container.innerHTML = '';
    
    const allStock = [...stock.bases, ...stock.toppings, ...stock.syrups, ...stock.drinks, ...stock.icecreams].filter(item => !item.recipe); // Only raw ingredients
    
    let totalCost = 0;

    recipeIngredients.forEach((ing, index) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.gap = '10px';
      row.style.alignItems = 'center';
      
      let options = '<option value="">Seleccionar ingrediente...</option>';
      allStock.forEach(s => {
        options += '<option value="' + s.id + '" ' + (ing.stockId === s.id ? 'selected' : '') + '>' + s.name + ' (' + s.unit + ') - $' + (s.cost || s.price) + '</option>';
      });

      const selectedItem = allStock.find(s => s.id === ing.stockId);
      const itemCost = selectedItem ? (selectedItem.cost || selectedItem.price) * ing.qty : 0;
      totalCost += itemCost;

      row.innerHTML = `
        <select class="form-control" style="flex:2;" onchange="updateRecipeIngredient(${index}, 'stockId', this.value)">
          ${options}
        </select>
        <input type="number" class="form-control" style="flex:1;" value="${ing.qty}" min="0.01" step="0.01" onchange="updateRecipeIngredient(${index}, 'qty', this.value)">
        <button type="button" class="btn-danger" style="padding: 8px;" onclick="removeRecipeIngredient(${index})">X</button>
      `;
      container.appendChild(row);
    });

    const yieldQty = parseFloat(document.getElementById('recipe-yield')?.value) || 1;
    const costPerPortion = Math.ceil(totalCost / yieldQty);
    
    const costDisplay = document.getElementById('recipe-cost-display');
    if (costDisplay) costDisplay.value = costPerPortion;
    if (costDisplay) costDisplay.dataset.totalCost = totalCost; // Store total to update live when yield changes
  };

  window.updateRecipeIngredient = (index, field, value) => {
    if (field === 'qty') {
      recipeIngredients[index].qty = parseFloat(value) || 1;
    } else {
      recipeIngredients[index].stockId = value;
    }
    renderRecipeIngredientsList();
  };

  window.removeRecipeIngredient = (index) => {
    recipeIngredients.splice(index, 1);
    renderRecipeIngredientsList();
  };

  const addRecipeIngredientBtn = document.getElementById('recipe-add-ingredient-btn');
  if (addRecipeIngredientBtn) {
    addRecipeIngredientBtn.addEventListener('click', () => {
      recipeIngredients.push({ stockId: '', qty: 1 });
      renderRecipeIngredientsList();
    });
  }

  const recipeYieldInput = document.getElementById('recipe-yield');
  if (recipeYieldInput) {
    recipeYieldInput.addEventListener('input', () => {
      renderRecipeIngredientsList(); // Re-calculate cost per portion
    });
  }

  const recipeModal = document.getElementById('recipe-modal-overlay');
  
  const closeRecipeModal = () => {
    if(recipeModal) recipeModal.style.display = 'none';
    const form = document.getElementById('recipe-crud-form');
    if (form) form.reset();
    document.getElementById('recipe-edit-id').value = '';
    recipeIngredients = [];
    renderRecipeIngredientsList();
    const titleEl = document.getElementById('recipe-form-title');
    if(titleEl) titleEl.textContent = 'Crear Insumo Elaborado';
  };

  document.getElementById('btn-open-add-recipe-modal')?.addEventListener('click', () => {
    closeRecipeModal();
    if(recipeModal) recipeModal.style.display = 'flex';
  });

  document.getElementById('recipe-modal-close')?.addEventListener('click', closeRecipeModal);
  document.getElementById('recipe-form-cancel-btn')?.addEventListener('click', closeRecipeModal);

  window.editRecipe = (id) => {
    const item = masas.find(i => i.id === id);
    if (!item) return;

    document.getElementById('recipe-edit-id').value = item.id;
    document.getElementById('recipe-name').value = item.name;
    document.getElementById('recipe-category').value = 'bases'; // default for masas
    document.getElementById('recipe-yield').value = item.yield_qty || 1;
    
    recipeIngredients = JSON.parse(JSON.stringify(item.ingredients || [])).map(ing => ({
      ...ing,
      stockId: ing.stockId || ing.stock_id
    }));
    
    document.getElementById('recipe-form-title').textContent = 'Editar Insumo Elaborado';
    
    switchAdminView('crud-recipes');
    renderRecipeIngredientsList();
    if(recipeModal) recipeModal.style.display = 'flex';
  };

  window.produceRecipe = async (id) => {
    const item = masas.find(i => i.id === id);
    if (!item) return;

    const batches = prompt('¿Cuántos lotes de ' + item.name + ' deseas fabricar?\\n\\nCada lote rinde ' + item.yield_qty + ' porciones y descontará los ingredientes del inventario general.', "1");
    if (batches === null) return;
    
    const numBatches = parseInt(batches);
    if (isNaN(numBatches) || numBatches <= 0) {
      alert("Por favor, ingresa un número válido mayor a 0.");
      return;
    }

    try {
      const res = await fetch('/api/masas/' + id + '/produce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batches: numBatches })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Se fabricaron ' + data.produced + ' porciones de ' + item.name + ' correctamente.');
        await loadState();
        renderCrudRecipes();
      } else {
        alert("Error al fabricar: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    }
  };

  const recipeCrudForm = document.getElementById('recipe-crud-form');
  if (recipeCrudForm) {
    recipeCrudForm.onsubmit = async (e) => {
      e.preventDefault();
      
      const id = document.getElementById('recipe-edit-id').value;
      const name = document.getElementById('recipe-name').value;
      const yieldQty = parseInt(document.getElementById('recipe-yield').value) || 1;
      const category = document.getElementById('recipe-category').value;
      const costDisplay = parseInt(document.getElementById('recipe-cost-display').value) || 0;
      
      // Clean ingredients
      const cleanIngs = recipeIngredients.filter(ing => ing.stockId !== '');
      if (cleanIngs.length === 0) {
        alert("Debes agregar al menos un ingrediente válido para la receta.");
        return;
      }

      const payload = { 
        name, 
        stock: id ? undefined : 0,
        minStock: id ? undefined : 10,
        cost_per_portion: costDisplay, 
        yield_qty: yieldQty,
        ingredients: cleanIngs
      };

      try {
        let res;
        if (id) {
          res = await fetch('/api/masas/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } else {
          res = await fetch('/api/masas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }
        
        const data = await res.json();
        if (data.success) {
          showToast(id ? 'Insumo elaborado actualizado' : 'Insumo elaborado creado');
          closeRecipeModal();
          await loadState();
          renderCrudRecipes();
        } else {
          alert('Error: ' + data.error);
        }
      } catch (err) {
        console.error(err);
        alert('Error al guardar receta');
      }
    };
  }

  // --- PANEL 4: GESTIÓN DE CARTA / MENÚ (CRUD + CARGA DE IMÁGENES) ---
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
        opt.textContent = `${w.name} (Costo estimado: $${Math.round(w.cost||0)})`;
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
        opt.textContent = `${item.name} (${item.stock} ${item.unit})`;
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
      grid.innerHTML = '<tr><td colspan="7" style="color:var(--text-secondary); text-align:center;">El menú está vacío.</td></tr>';
    }

    menu.forEach(item => {
      const card = document.createElement('tr');

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

      card.innerHTML = `
        <td style="font-weight:bold; color:var(--neon-purple);">${item.name}</td>
        <td style="font-weight:bold; color:var(--neon-cyan);">${formatCurrency(item.price)}</td>
        <td><strong style="color:var(--text-muted);">${formatCurrency(recipeCost)}</strong></td>
        <td><strong style="color:var(--neon-yellow);">${marginPercent}%</strong></td>
        <td style="color:#fff;">${referenceName}</td>
        <td>${item.type === 'waffle' ? 'Receta Waffle' : 'Stock Directo'}</td>
        <td>
          <div style="display:flex; gap:10px;">
            <button class="btn-secondary edit-menu-item-btn" data-id="${item.id}" style="padding:4px; flex:1;">Editar</button>
            <button class="btn-secondary delete-menu-item-btn" data-id="${item.id}" style="padding:4px; flex:1; background:#e63946; color:#fff; border:none;">Eliminar</button>
          </div>
        </td>
      `;

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
        if (item && confirm(`¿Estás seguro de eliminar "${item.name}" del menú público?`)) {
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

  // === CRUD WAFFLES (RECETAS) ===
  let waffleIngredients = [];
  window.renderWaffleIngredients = () => {
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
      list.innerHTML += `<div style="display:flex; gap:10px; align-items:center;">
        <select class="form-control waf-ing-id" data-idx="${i}" style="flex:2">
          ${flatStock.map(st => `<option value="${st.id}" ${st.id===ing.stock_id?'selected':''}>${st.name}</option>`).join('')}
        </select>
        <input type="number" class="form-control waf-ing-qty" data-idx="${i}" value="${ing.qty}" min="1" style="flex:1" placeholder="Cant.">
        <span style="color:var(--text-secondary); font-size:0.8rem; width:40px;">Porc.</span>
        <button type="button" class="btn-secondary" onclick="window.removeWaffleIng(${i})">X</button>
      </div>`;
    });
    const costDisp = document.getElementById('waffle-recipe-cost-display');
    if(costDisp) costDisp.textContent = formatCurrency(cost);
  };

  document.getElementById('waffle-base')?.addEventListener('change', window.renderWaffleIngredients);
  document.getElementById('waffle-add-ingredient-btn')?.addEventListener('click', () => {
    if(flatStock.length===0) {
      showToast('No hay insumos en stock', true);
      return;
    }
    waffleIngredients.push({stock_id: flatStock[0].id, qty: 1});
    window.renderWaffleIngredients();
  });
  window.removeWaffleIng = (i) => { waffleIngredients.splice(i,1); window.renderWaffleIngredients(); };

  document.getElementById('waffle-ingredients-list')?.addEventListener('change', (e) => {
    if (e.target.classList.contains('waf-ing-id')) {
      const idx = e.target.getAttribute('data-idx');
      waffleIngredients[idx].stock_id = e.target.value;
      window.renderWaffleIngredients();
    }
  });

  document.getElementById('waffle-ingredients-list')?.addEventListener('input', (e) => {
    if (e.target.classList.contains('waf-ing-qty')) {
      const idx = e.target.getAttribute('data-idx');
      waffleIngredients[idx].qty = parseFloat(e.target.value) || 1;
      window.renderWaffleIngredients();
    }
  });

  let currentWaffleImage = '';
  document.getElementById('waffle-upload-btn')?.addEventListener('click', () => {
    document.getElementById('waffle-image-input')?.click();
  });
  document.getElementById('waffle-image-input')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        currentWaffleImage = evt.target.result;
        showToast('Imagen cargada');
      };
      reader.readAsDataURL(file);
    }
  });

  const waffleForm = document.getElementById('waffle-crud-form');
  const waffleModal = document.getElementById('waffle-modal-overlay');
  
  const closeWaffleModal = () => {
    if(waffleModal) waffleModal.style.display = 'none';
    if(waffleForm) waffleForm.reset();
    waffleIngredients = [];
    currentWaffleImage = '';
    const idEl = document.getElementById('waffle-edit-id');
    if(idEl) idEl.value = '';
    const titleEl = document.getElementById('waffle-form-title');
    if(titleEl) titleEl.textContent = 'Crear Waffle';
    window.renderWaffleIngredients();
  };
  
  document.getElementById('btn-open-add-waffle-modal')?.addEventListener('click', () => {
    closeWaffleModal();
    if(waffleModal) waffleModal.style.display = 'flex';
  });

  document.getElementById('waffle-modal-close')?.addEventListener('click', closeWaffleModal);
  document.getElementById('waffle-form-cancel-btn')?.addEventListener('click', closeWaffleModal);

  if(waffleForm) {
    waffleForm.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('waffle-edit-id')?.value;
      const baseId = document.getElementById('waffle-base').value;
      const ings = [{type: 'masa', id: baseId, qty: 1}];
      waffleIngredients.forEach(i => ings.push({type: 'stock', id: i.stock_id, qty: i.qty}));

      const costEl = document.getElementById('waffle-recipe-cost-display');
      let parsedCost = 0;
      if (costEl && costEl.textContent) {
        parsedCost = parseFloat(costEl.textContent.replace(/[^0-9.-]+/g,"")) || 0;
      }
      
      const data = {
        name: document.getElementById('waffle-name').value,
        description: document.getElementById('waffle-desc').value,
        cost: parsedCost,
        ingredients: ings,
        image: currentWaffleImage || ''
      };
      const url = id ? `/api/waffles/${id}` : '/api/waffles';
      const method = id ? 'PUT' : 'POST';
      await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
      showToast('Receta Guardada'); 
      closeWaffleModal();
      await loadState(); window.renderCrudWaffles();
    };
  }

  window.renderCrudWaffles = () => {
    const baseSel = document.getElementById('waffle-base');
    if(baseSel) {
      if (masas.length === 0) {
        baseSel.innerHTML = '<option value="">No hay masas creadas</option>';
      } else {
        baseSel.innerHTML = masas.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
      }
    }
    
    const grid = document.getElementById('admin-waffles-list-grid');
    if(grid) {
      grid.innerHTML = '';
      if (waffles.length === 0) {
        grid.innerHTML = '<div style="color:var(--text-secondary); text-align:center; grid-column: 1 / -1;">No hay recetas creadas.</div>';
      }
      waffles.forEach(w => {
        grid.innerHTML += `<div class="pos-item-card" style="padding:10px;">
          <div style="font-weight:bold;">${w.name}</div>
          <div style="font-size:0.8rem; color:var(--text-secondary);">${w.description}</div>
          <div style="margin-top:5px; color:var(--neon-pink);">Costo: ${formatCurrency(w.cost)}</div>
          <div style="display:flex; gap:10px; margin-top:10px;">
            <button class="btn-secondary" onclick="window.editWaffle('${w.id}')" style="padding:4px; flex:1;">Editar</button>
            <button class="btn-secondary" onclick="window.deleteWaffle('${w.id}')" style="padding:4px; flex:1;">Eliminar</button>
          </div>
        </div>`;
      });
    }
    window.renderWaffleIngredients();
  };

  window.editWaffle = (id) => {
    const w = waffles.find(x => x.id === id);
    if (!w) return;
    
    document.getElementById('waffle-edit-id').value = w.id;
    document.getElementById('waffle-name').value = w.name;
    document.getElementById('waffle-desc').value = w.description || '';
    
    currentWaffleImage = w.image || '';
    
    // Parse ingredients
    let masaId = '';
    waffleIngredients = [];
    
    if (Array.isArray(w.ingredients)) {
      w.ingredients.forEach(ing => {
        if (ing.type === 'masa') {
          masaId = ing.id;
        } else if (ing.type === 'stock') {
          waffleIngredients.push({ stock_id: ing.id, qty: ing.qty });
        }
      });
    }
    
    const baseSel = document.getElementById('waffle-base');
    if (baseSel) {
      baseSel.value = masaId;
    }
    
    window.renderWaffleIngredients();
    
    const titleEl = document.getElementById('waffle-form-title');
    if(titleEl) titleEl.textContent = 'Editar Waffle';
    if(waffleModal) waffleModal.style.display = 'flex';
  };

  window.deleteWaffle = async (id) => {
    if(confirm('¿Eliminar Receta?')) { await fetch(`/api/waffles/${id}`, { method:'DELETE' }); await loadState(); window.renderCrudWaffles(); }
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

    if (newAdminPassword && newAdminPassword !== confirmAdminPwd) {
      showToast('La nueva contraseña de administrador no coincide con la confirmación', true);
      return;
    }

    if (!newAdminPassword) {
      showToast('Debe ingresar una nueva contraseña de administrador', true);
      return;
    }

    const payload = { currentPassword, newAdminPassword };

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

  const saleDetailModal = document.getElementById('sale-detail-modal');
  const saleDetailClose = document.getElementById('sale-detail-close');
  if (saleDetailClose && saleDetailModal) {
    saleDetailClose.onclick = () => saleDetailModal.style.display = 'none';
    saleDetailModal.onclick = (e) => {
      if (e.target === saleDetailModal) saleDetailModal.style.display = 'none';
    };
  }

  // --- PANEL 6: CONFIGURACIÓN DE DESARROLLADOR ---
  const devToggle = document.getElementById('developer-toggle');
  const devStatusBadge = document.getElementById('developer-status-badge');

  const updateDevStatusUI = (enabled) => {
    if (!devStatusBadge || !devToggle) return;
    if (enabled) {
      devStatusBadge.textContent = 'MÓDULO ACTIVO: widget flotante 🎨 visible en las vistas';
      devStatusBadge.style.color = 'var(--neon-cyan)';
      devStatusBadge.style.backgroundColor = 'rgba(0, 245, 212, 0.05)';
      devStatusBadge.style.borderColor = 'rgba(0, 245, 212, 0.3)';
      devToggle.checked = true;
    } else {
      devStatusBadge.textContent = 'MÓDULO INACTIVO: widget flotante oculto';
      devStatusBadge.style.color = 'var(--text-muted)';
      devStatusBadge.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
      devStatusBadge.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      devToggle.checked = false;
    }
  };

  const loadDeveloperSettingsPanel = async () => {
    try {
      const res = await fetch('/api/developer/settings');
      const data = await res.json();
      updateDevStatusUI(data.developerMode);
    } catch (err) {
      console.error(err);
      showToast('Error al conectar con la API de desarrollador', true);
    }
  };

  if (devToggle) {
    devToggle.onchange = async () => {
      const isChecked = devToggle.checked;
      try {
        const res = await fetch('/api/developer/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ developerMode: isChecked })
        });
        if (res.ok) {
          updateDevStatusUI(isChecked);
          showToast(isChecked ? 'Módulo de personalización activado. Recargando...' : 'Módulo de personalización desactivado. Recargando...');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          showToast('Error al actualizar configuración', true);
          devToggle.checked = !isChecked;
        }
      } catch (err) {
        console.error(err);
        showToast('Error de conexión con el servidor', true);
        devToggle.checked = !isChecked;
      }
    };
  }

  // --- PANEL 7: CONFIGURACIÓN DE DATOS DE LA EMPRESA ---
  const companyForm = document.getElementById('admin-company-form');
  const companyNameInput = document.getElementById('company-name-input');
  const companyAddressInput = document.getElementById('company-address-input');
  const companyHoursInput = document.getElementById('company-hours-input');
  const companyInstagramInput = document.getElementById('company-instagram-input');
  const companyPhoneInput = document.getElementById('company-phone-input');
  const kdsAlertTimeInput = document.getElementById('kds-alert-time-input');
  const companyWhatsappEnabledInput = document.getElementById('company-whatsapp-enabled-input');

  const loadCompanySettingsPanel = async () => {
    try {
      const res = await fetch('/api/company/info');
      const data = await res.json();
      if (companyNameInput) companyNameInput.value = data.companyName || '';
      if (companyAddressInput) companyAddressInput.value = data.companyAddress || '';
      if (companyHoursInput) companyHoursInput.value = data.companyHours || '';
      if (companyInstagramInput) companyInstagramInput.value = data.companyInstagram || '';
      if (companyPhoneInput) companyPhoneInput.value = data.companyPhone || '';
      if (kdsAlertTimeInput) kdsAlertTimeInput.value = data.kdsAlertTime || 10;
      if (companyWhatsappEnabledInput) companyWhatsappEnabledInput.checked = data.whatsappOrdersEnabled !== false;

      // Cargar settings de Logo
      window.currentCompanyLogo = data.companyLogo || '';
      const logoPreview = document.getElementById('company-logo-preview');
      const logoPlaceholder = document.getElementById('company-logo-placeholder');
      if (logoPreview && logoPlaceholder) {
        if (window.currentCompanyLogo) {
          logoPreview.src = window.currentCompanyLogo;
          logoPreview.style.display = 'block';
          logoPlaceholder.style.display = 'none';
        } else {
          logoPreview.style.display = 'none';
          logoPlaceholder.style.display = 'block';
        }
      }
      
      const adminSidebarText = document.querySelector('.admin-sidebar .logo-text');
      if (adminSidebarText && window.currentCompanyLogo) {
        let adminLogoImg = document.getElementById('dynamic-admin-logo');
        if (!adminLogoImg) {
          adminLogoImg = document.createElement('img');
          adminLogoImg.id = 'dynamic-admin-logo';
          adminLogoImg.style.cssText = 'width:36px; height:36px; border-radius:50%; object-fit:cover; margin-right:10px;';
          adminSidebarText.parentNode.insertBefore(adminLogoImg, adminSidebarText);
        }
        adminLogoImg.src = window.currentCompanyLogo;
      }

      // Cargar settings de Hero
      window.currentHeroImages = data.heroImages || [];
      const carouselToggle = document.getElementById('admin-hero-carousel-toggle');
      if (carouselToggle) carouselToggle.checked = !!data.heroCarouselEnabled;
      const carouselInterval = document.getElementById('admin-hero-carousel-interval');
      if (carouselInterval) carouselInterval.value = data.heroCarouselInterval ? data.heroCarouselInterval / 1000 : 4;
      renderHeroPreviews();

      // Cargar settings de Mapa
      window.currentMapBgImage = data.mapBgImage || '';
      window.currentMapPinX = data.mapPinX !== undefined ? data.mapPinX : 50;
      window.currentMapPinY = data.mapPinY !== undefined ? data.mapPinY : 50;
      renderMapPreview();

      // Cargar settings del Programa de Fidelización
      await loadLoyaltySettings();
    } catch (err) {
      console.error(err);
      showToast('Error al cargar datos de la empresa', true);
    }
  };

  const loadLoyaltySettings = async () => {
    try {
      const settingsRes = await fetch('/api/loyalty/settings');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        const loyaltyToggle = document.getElementById('admin-loyalty-toggle');
        const thresholdInput = document.getElementById('admin-loyalty-threshold');
        if (loyaltyToggle) {
          loyaltyToggle.checked = !!settingsData.loyaltyEnabled;
        }
        if (thresholdInput) {
          thresholdInput.value = settingsData.loyaltyPointsThreshold || 100;
        }
      }

      const customersRes = await fetch('/api/loyalty/customers');
      if (customersRes.ok) {
        const list = await customersRes.json();
        const tbody = document.getElementById('admin-loyalty-customers-body');
        if (tbody) {
          tbody.innerHTML = '';
          if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:var(--text-secondary); padding: 10px;">Ningún cliente registrado aún</td></tr>';
          } else {
            list.forEach(cust => {
              const tr = document.createElement('tr');
              tr.innerHTML = `
                <td>${cust.phone}</td>
                <td>${cust.name}</td>
                <td style="font-weight:700; color:var(--neon-cyan);">${cust.points}</td>
              `;
              tbody.appendChild(tr);
            });
          }
        }
      }
    } catch (err) {
      console.error('Error al cargar datos de fidelización:', err);
    }
  };

  // Guardar configuración completa de Fidelización (Toggle + Threshold)
  const saveLoyaltySettings = async () => {
    const loyaltyToggle = document.getElementById('admin-loyalty-toggle');
    const thresholdInput = document.getElementById('admin-loyalty-threshold');
    
    try {
      const payload = {
        loyaltyEnabled: loyaltyToggle ? loyaltyToggle.checked : false,
        loyaltyPointsThreshold: thresholdInput ? parseInt(thresholdInput.value) : 100
      };
      
      const res = await fetch('/api/loyalty/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('Configuración de fidelización actualizada ⭐');
      } else {
        showToast('Error al actualizar fidelización', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Error al conectar con el servidor', true);
    }
  };

  const loyaltyToggle = document.getElementById('admin-loyalty-toggle');
  if (loyaltyToggle) {
    loyaltyToggle.onchange = saveLoyaltySettings;
  }
  
  const loyaltySaveBtn = document.getElementById('admin-loyalty-save-btn');
  if (loyaltySaveBtn) {
    loyaltySaveBtn.onclick = saveLoyaltySettings;
  }

  const kdsAlertSaveBtn = document.getElementById('kds-alert-save-btn');
  if (kdsAlertSaveBtn && kdsAlertTimeInput) {
    kdsAlertSaveBtn.onclick = async () => {
      try {
        const payload = { kdsAlertTime: parseInt(kdsAlertTimeInput.value) || 10 };
        const res = await fetch('/api/company/info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showToast('Tiempo de Alerta Inteligente guardado');
        } else {
          showToast('Error al guardar el tiempo de alerta', true);
        }
      } catch (err) {
        console.error(err);
        showToast('Error al conectar con el servidor', true);
      }
    };
  }

  if (companyForm) {
    companyForm.onsubmit = async (e) => {
      e.preventDefault();

      const payload = {
        companyName: companyNameInput.value.trim(),
        companyAddress: companyAddressInput.value.trim(),
        companyHours: companyHoursInput.value.trim(),
        companyInstagram: companyInstagramInput.value.trim(),
        companyPhone: companyPhoneInput.value.trim(),
        whatsappOrdersEnabled: companyWhatsappEnabledInput ? companyWhatsappEnabledInput.checked : true
      };

      try {
        const res = await fetch('/api/company/info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          showToast('¡Datos de la empresa guardados con éxito!');
        } else {
          const errData = await res.json();
          showToast(errData.error || 'Error al guardar datos', true);
        }
      } catch (err) {
        console.error(err);
        showToast('Error al conectar con el servidor', true);
      }
    };
  }

  // --- LÓGICA DE LOGO DE EMPRESA ---
  const companyLogoInput = document.getElementById('company-logo-file');
  const companyLogoSaveBtn = document.getElementById('company-logo-save-btn');
  const companyLogoPreview = document.getElementById('company-logo-preview');
  const companyLogoPlaceholder = document.getElementById('company-logo-placeholder');

  if (companyLogoInput) {
    companyLogoInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          window.currentCompanyLogo = ev.target.result;
          if (companyLogoPreview && companyLogoPlaceholder) {
            companyLogoPreview.src = window.currentCompanyLogo;
            companyLogoPreview.style.display = 'block';
            companyLogoPlaceholder.style.display = 'none';
          }
        };
        reader.readAsDataURL(file);
      }
      companyLogoInput.value = '';
    };
  }

  if (companyLogoSaveBtn) {
    companyLogoSaveBtn.onclick = async () => {
      try {
        const payload = {
          companyLogo: window.currentCompanyLogo || ''
        };
        const res = await fetch('/api/company/info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showToast('Logo guardado con éxito');
        } else {
          showToast('Error al guardar logo', true);
        }
      } catch (err) {
        showToast('Error de conexión', true);
      }
    };
  }

  // --- LÓGICA DE IMÁGENES HERO ---
  window.currentHeroImages = [];
  const heroUploadInput = document.getElementById('admin-hero-images-upload');
  const heroUploadBtn = document.getElementById('admin-hero-upload-btn');
  const heroPreviewContainer = document.getElementById('admin-hero-images-preview');
  const heroSaveBtn = document.getElementById('admin-hero-save-btn');
  const heroCarouselToggle = document.getElementById('admin-hero-carousel-toggle');
  const heroCarouselInterval = document.getElementById('admin-hero-carousel-interval');

  if (heroUploadBtn) {
    heroUploadBtn.onclick = () => heroUploadInput.click();
  }

  if (heroUploadInput) {
    heroUploadInput.onchange = (e) => {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          window.currentHeroImages.push(ev.target.result);
          renderHeroPreviews();
        };
        reader.readAsDataURL(file);
      });
      heroUploadInput.value = '';
    };
  }

  function renderHeroPreviews() {
    if (!heroPreviewContainer) return;
    heroPreviewContainer.innerHTML = '';
    window.currentHeroImages.forEach((imgSrc, idx) => {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:relative; width:80px; height:80px; border-radius:8px; overflow:hidden; border:2px solid rgba(255,255,255,0.1);';
      
      const img = document.createElement('img');
      img.src = imgSrc;
      img.style.cssText = 'width:100%; height:100%; object-fit:cover;';
      
      const delBtn = document.createElement('button');
      delBtn.innerHTML = '×';
      delBtn.style.cssText = 'position:absolute; top:2px; right:2px; background:rgba(255,0,0,0.8); color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer; font-size:12px; display:flex; align-items:center; justify-content:center;';
      delBtn.onclick = () => {
        window.currentHeroImages.splice(idx, 1);
        renderHeroPreviews();
      };
      
      wrap.appendChild(img);
      wrap.appendChild(delBtn);
      heroPreviewContainer.appendChild(wrap);
    });
  }

  if (heroSaveBtn) {
    heroSaveBtn.onclick = async () => {
      try {
        const payload = {
          heroImages: window.currentHeroImages,
          heroCarouselEnabled: heroCarouselToggle ? heroCarouselToggle.checked : false,
          heroCarouselInterval: heroCarouselInterval ? parseInt(heroCarouselInterval.value) * 1000 : 4000
        };
        const res = await fetch('/api/company/info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showToast('Imágenes de portada guardadas correctamente');
        } else {
          showToast('Error al guardar imágenes', true);
        }
      } catch (err) {
        showToast('Error de conexión', true);
      }
    };
  }

  // --- LÓGICA DEL MAPA ---
  window.currentMapBgImage = '';
  window.currentMapPinX = 50;
  window.currentMapPinY = 50;

  const mapUploadInput = document.getElementById('admin-map-upload');
  const mapUploadBtn = document.getElementById('admin-map-upload-btn');
  const mapPreviewContainer = document.getElementById('admin-map-preview-container');
  const mapPreviewImg = document.getElementById('admin-map-preview-img');
  const mapPin = document.getElementById('admin-map-pin');
  const mapSaveBtn = document.getElementById('admin-map-save-btn');

  if (mapUploadBtn) {
    mapUploadBtn.onclick = () => mapUploadInput.click();
  }

  if (mapUploadInput) {
    mapUploadInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          window.currentMapBgImage = ev.target.result;
          renderMapPreview();
        };
        reader.readAsDataURL(file);
      }
      mapUploadInput.value = '';
    };
  }

  function renderMapPreview() {
    if (!mapPreviewImg || !mapPin) return;
    if (window.currentMapBgImage) {
      mapPreviewImg.src = window.currentMapBgImage;
      mapPreviewImg.style.display = 'block';
      mapPin.style.display = 'block';
      mapPin.style.left = window.currentMapPinX + '%';
      mapPin.style.top = window.currentMapPinY + '%';
    } else {
      mapPreviewImg.style.display = 'none';
      mapPin.style.display = 'none';
    }
  }

  if (mapPreviewContainer) {
    mapPreviewContainer.onclick = (e) => {
      if (!window.currentMapBgImage) return; // Sólo mover pin si hay imagen
      const rect = mapPreviewContainer.getBoundingClientRect();
      const xPos = e.clientX - rect.left;
      const yPos = e.clientY - rect.top;
      
      window.currentMapPinX = (xPos / rect.width) * 100;
      window.currentMapPinY = (yPos / rect.height) * 100;
      
      renderMapPreview();
    };
  }

  if (mapSaveBtn) {
    mapSaveBtn.onclick = async () => {
      try {
        const payload = {
          mapBgImage: window.currentMapBgImage,
          mapPinX: window.currentMapPinX,
          mapPinY: window.currentMapPinY
        };
        const res = await fetch('/api/company/info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showToast('Mapa de ubicación guardado correctamente');
        } else {
          showToast('Error al guardar mapa', true);
        }
      } catch (err) {
        showToast('Error de conexión', true);
      }
    };
  }

  // --- PANEL 8: GESTIÓN DE EMPLEADOS / CAJEROS ---
  
  const renderCrudEmployees = () => {
    const tbody = document.getElementById('employees-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (employees.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No hay cajeros registrados.</td></tr>';
      return;
    }

    employees.forEach(emp => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${emp.name}</strong></td>
        <td><span style="font-family: monospace; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">****</span></td>
        <td><span style="color: var(--neon-cyan); font-weight: bold; text-transform: capitalize;">${emp.role === 'kitchen' ? 'Cocinero' : 'Cajero'}</span></td>
        <td><span class="status-badge ${emp.active ? 'status-completed' : 'status-cancelled'}">${emp.active ? 'Activo' : 'Inactivo'}</span></td>
        <td>

          <button class="action-btn text-warning" onclick="editEmployee('${emp.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2-2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="action-btn text-danger" onclick="deleteEmployee('${emp.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  };

  const showEmployeeForm = (employee = null) => {
    document.getElementById('employee-modal').style.display = 'flex';
    
    if (employee) {
      document.getElementById('employee-modal-title').textContent = 'Editar Empleado';
      document.getElementById('employee-id').value = employee.id;
      document.getElementById('employee-name').value = employee.name;
      document.getElementById('employee-pin').value = employee.pin;
      document.getElementById('employee-role').value = employee.role || 'cashier';
      document.getElementById('employee-active').value = employee.active ? 'true' : 'false';
    } else {
      document.getElementById('employee-modal-title').textContent = 'Crear Empleado';
      document.getElementById('employee-name').value = '';
      document.getElementById('employee-pin').value = '';
      document.getElementById('employee-id').value = '';
    }
  };

  document.getElementById('btn-add-employee')?.addEventListener('click', () => {
    showEmployeeForm();
  });

  document.getElementById('employee-cancel-btn')?.addEventListener('click', () => {
    document.getElementById('employee-modal').style.display = 'none';
  });

  window.editEmployee = (id) => {
    const emp = employees.find(e => e.id === id);
    if (emp) showEmployeeForm(emp);
  };

  window.deleteEmployee = async (id) => {
    if (confirm('¿Estás seguro de eliminar este empleado?')) {
      try {
        const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast('Empleado eliminado');
          await loadState();
          renderCrudEmployees();
        } else {
          showToast('Error al eliminar empleado', true);
        }
      } catch (err) {
        console.error(err);
        showToast('Error de red', true);
      }
    }
  };

  document.getElementById('employee-save-btn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const id = document.getElementById('employee-id').value;
    const name = document.getElementById('employee-name').value.trim();
    const pin = document.getElementById('employee-pin').value.trim();
    const role = document.getElementById('employee-role').value;
    const active = document.getElementById('employee-active').value === 'true';

    if (!name || !pin) {
      showToast('Nombre y PIN son obligatorios', true);
      return;
    }

    const payload = { name, pin, role, active };

    try {
      let res;
      if (id) {
        res = await fetch(`/api/employees/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        showToast(id ? 'Empleado actualizado' : 'Empleado creado');
        document.getElementById('employee-modal').style.display = 'none';
        await loadState();
        renderCrudEmployees();
      } else {
        const data = await res.json();
        showToast(data.error || 'Error al guardar empleado', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Error de red', true);
    }
  });

  // --- PANEL 9: DOCUMENTACION ---
  const loadDocsView = async () => {
    try {
      const res = await fetch('/api/docs');
      const files = await res.json();
      const docsList = document.getElementById('docs-list');
      const docsContent = document.getElementById('docs-content');
      
      docsList.innerHTML = '';
      
      if (files.length === 0) {
        docsList.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">No se encontraron manuales.</p>';
        return;
      }

      files.forEach(file => {
        const btn = document.createElement('button');
        btn.className = 'btn-secondary';
        btn.style.textAlign = 'center';
        btn.style.padding = '0.6rem 1rem';
        btn.style.fontSize = '0.85rem';
        btn.style.borderColor = 'rgba(255,255,255,0.1)';
        btn.style.flex = '1 1 auto';
        btn.textContent = file.replace('.md', '').replace(/_/g, ' ');
        
        btn.onclick = async () => {
          // Remover clase activa de los demás
          Array.from(docsList.children).forEach(c => c.style.borderColor = 'rgba(255,255,255,0.1)');
          btn.style.borderColor = 'var(--neon-cyan)';
          
          docsContent.innerHTML = '<p style="color:var(--text-muted); text-align:center; margin-top:50px;">Cargando documento...</p>';
          
          try {
            const docRes = await fetch(`/documentacion/${file}`);
            if (docRes.ok) {
              const markdown = await docRes.text();
              // Usar marked si está disponible
              if (typeof marked !== 'undefined') {
                docsContent.innerHTML = `<div class="markdown-body">${marked.parse(markdown)}</div>`;
              } else {
                docsContent.innerHTML = `<pre style="white-space:pre-wrap;">${markdown}</pre>`;
              }
            } else {
              docsContent.innerHTML = '<p style="color:var(--neon-pink); text-align:center;">Error al cargar el archivo.</p>';
            }
          } catch (e) {
            docsContent.innerHTML = '<p style="color:var(--neon-pink); text-align:center;">Error de red al cargar el archivo.</p>';
          }
        };
        
        docsList.appendChild(btn);
      });
      
    } catch (e) {
      console.error(e);
      showToast('Error al cargar lista de documentación', true);
    }
  };

  // --- INICIO APP ---
  loadState();


  // --- VISTA: GALERÍA DE TEMAS ---
  const loadThemesGallery = async () => {
    try {
      const res = await fetch('/api/developer/settings');
      const data = await res.json() || {};
      const customPresets = data.customPresets || [];
      
      const defaultPresets = [];
      if (window.SrWafflePresets) {
        for (const key in window.SrWafflePresets) {
          defaultPresets.push({
            id: 'default_' + key,
            name: window.SrWafflePresets[key].name,
            isDefault: true
          });
        }
      }
      
      const renderGrid = (containerId, items) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        items.forEach(preset => {
          const card = document.createElement('div');
          card.style.cssText = 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 1rem; display: flex; flex-direction: column; gap: 1rem;';
          card.innerHTML = `
            <div class="pos-waffle-card" style="display:flex; flex-direction:column;">
              <h4 style="margin: 0; color: #fff;">${preset.name}</h4>
              <div style="display:flex; gap: 8px; margin-top: auto;">
                <button class="btn-secondary" style="flex:1; padding: 0.5rem 0.2rem; font-size: 0.8rem;" onclick="window.editThemePreset('${preset.id}')">${preset.id.startsWith('default_') ? 'Clonar' : 'Editar'}</button>
                <button class="btn-primary" style="flex:1; padding: 0.5rem 0.2rem; font-size: 0.8rem;" onclick="window.applyThemePreset('${preset.id}')">Activar</button>
                ${!preset.id.startsWith('default_') ? `<button type="button" class="btn-secondary" style="flex: 0 0 60px; background:rgba(220,53,69,0.2); border-color:#dc3545; padding: 0.5rem; display:flex; justify-content:center; align-items:center;" onclick="event.preventDefault(); event.stopPropagation(); console.log('Botón borrar presionado'); window.deleteThemePreset('${preset.id}')"><span style="font-size:0.8rem; font-weight:bold; color:#ff4444;">BORRAR</span></button>` : ''}
              </div>
            </div>
          `;
          container.appendChild(card);
        });
      };
      
      renderGrid('themes-default-grid', defaultPresets);
      renderGrid('themes-custom-grid', customPresets);
      
    } catch (e) {
      console.error(e);
      showToast('Error al cargar temas', true);
    }
  };

  window.deleteThemePreset = async (presetId) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); z-index:99999; display:flex; justify-content:center; align-items:center;';
    const box = document.createElement('div');
    box.style.cssText = 'background:#1a1a1a; padding:2rem; border-radius:8px; text-align:center; border:1px solid rgba(255,255,255,0.1);';
    box.innerHTML = `
      <h3 style="color:#fff; margin-bottom:1rem;">¿Borrar tema personalizado?</h3>
      <p style="color:#ccc; margin-bottom:2rem;">Esta acción no se puede deshacer.</p>
      <div style="display:flex; gap:10px; justify-content:center;">
        <button id="btn-cancel-delete" class="btn-secondary">Cancelar</button>
        <button id="btn-confirm-delete" class="btn-primary" style="background:#dc3545; border-color:#dc3545;">Sí, Borrar</button>
      </div>
    `;
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    document.getElementById('btn-cancel-delete').onclick = () => overlay.remove();
    document.getElementById('btn-confirm-delete').onclick = async () => {
      overlay.remove();
      try {
        const res = await fetch(`/api/developer/preset/${presetId}`, { method: 'DELETE' });
        if (res.ok) {
          showToast('Tema borrado con éxito');
          loadThemesGallery();
        } else {
          showToast('Error al borrar', true);
        }
      } catch(e) {
        console.error(e);
        showToast('Error de red', true);
      }
    };
  };

  window.applyThemePreset = async (presetId) => {
    try {
      const res = await fetch('/api/developer/settings');
      const data = await res.json() || {};
      
      let stylesToApply = null;
      if (presetId.startsWith('default_')) {
        const key = presetId.replace('default_', '');
        if (window.SrWafflePresets && window.SrWafflePresets[key]) {
          stylesToApply = window.SrWafflePresets[key].styles;
        }
      } else {
        const customPresets = data.customPresets || [];
        const preset = customPresets.find(p => p.id === presetId);
        if (preset && preset.styles) stylesToApply = preset.styles;
      }
      
      if (!stylesToApply) return showToast('Tema no encontrado', true);
      
      const saveRes = await fetch('/api/developer/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeTheme: stylesToApply })
      });
      
      if (saveRes.ok) {
        showToast('Tema activado. Recargando...', false);
        setTimeout(() => location.reload(), 1000);
      } else {
        showToast('Error al guardar tema', true);
      }
    } catch (e) {
      console.error(e);
      showToast('Error de red', true);
    }
  };

});


  document.addEventListener("DOMContentLoaded", () => {
  // --- EDICIÓN DE TEMAS ---
  const COLOR_VARIABLES_ADMIN = [
    { varName: '--bg-primary', label: 'Fondo Principal' },
    { varName: '--bg-secondary', label: 'Fondo Secundario' },
    { varName: '--bg-card-raw', label: 'Fondo de Tarjetas' },
    { varName: '--bg-header-raw', label: 'Color de Cabecera' },
    { varName: '--neon-purple', label: 'Acento Principal (Púrpura)' },
    { varName: '--neon-pink', label: 'Acento Sec. (Rosa)' },
    { varName: '--neon-cyan', label: 'Acento (Cian)' },
    { varName: '--neon-yellow', label: 'Acento (Amarillo)' },
    { varName: '--text-primary', label: 'Texto Principal' },
    { varName: '--text-secondary', label: 'Texto Secundario' },
    { varName: '--btn-text-color', label: 'Texto de Botones' }
  ];

  let currentEditingThemeId = null;
  let isEditingDefaultTheme = false;
  let currentEditingThemeCustomCss = '';
  let currentEditingThemeBgImage = '';

  const editModal = document.getElementById('theme-edit-modal');
  const colorsContainer = document.getElementById('theme-edit-colors-container');

  if (colorsContainer) {
    COLOR_VARIABLES_ADMIN.forEach(color => {
      const div = document.createElement('div');
      div.className = 'form-group';
      div.innerHTML = `
        <label>${color.label}</label>
        <div style="display:flex; gap:10px; align-items:center;">
          <input type="color" id="theme-edit-color-${color.varName}" style="width:40px; height:40px; border:none; border-radius:4px; cursor:pointer; background:none;">
          <input type="text" id="theme-edit-hex-${color.varName}" class="form-control" style="flex:1;" placeholder="#000000">
        </div>
      `;
      colorsContainer.appendChild(div);

      // Sync color and hex inputs
      const colorInput = div.querySelector('input[type="color"]');
      const hexInput = div.querySelector('input[type="text"]');
      colorInput.addEventListener('input', (e) => hexInput.value = e.target.value);
      hexInput.addEventListener('input', (e) => {
        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) colorInput.value = e.target.value;
      });
    });
  }

  window.editThemePreset = async (presetId) => {
    try {
      const res = await fetch('/api/developer/settings');
      const data = await res.json() || {};
      
      let themeData = null;
      isEditingDefaultTheme = false;
      
      if (presetId.startsWith('default_')) {
        const key = presetId.replace('default_', '');
        if (window.SrWafflePresets && window.SrWafflePresets[key]) {
          themeData = JSON.parse(JSON.stringify(window.SrWafflePresets[key]));
          isEditingDefaultTheme = true;
        }
      } else {
        const customPresets = data.customPresets || [];
        themeData = customPresets.find(p => p.id === presetId);
      }
      
      if (!themeData) return showToast('Tema no encontrado para editar', true);

      currentEditingThemeId = presetId;
      currentEditingThemeCustomCss = themeData.styles?.customCss || '';
      currentEditingThemeBgImage = themeData.styles?.bgImage || '';
      
      document.getElementById('theme-edit-name').value = themeData.name + (isEditingDefaultTheme ? ' (Copia)' : '');
      document.getElementById('theme-edit-menu-pos').value = themeData.styles?.layout?.menuPos || 'sidebar';
      document.getElementById('theme-edit-btn-shape').value = themeData.styles?.layout?.buttonShape || 'rounded';
      document.getElementById('theme-edit-shadows').value = themeData.styles?.layout?.shadows || 'neon';
      
      document.getElementById('theme-edit-text-title').value = themeData.styles?.texts?.publicTitle || '';
      document.getElementById('theme-edit-text-banner').value = themeData.styles?.texts?.publicBanner || '';
      
      if (document.getElementById('theme-edit-bg-image')) {
        document.getElementById('theme-edit-bg-image').value = themeData.styles?.bgImage || '';
      }

      const colors = themeData.styles?.colors || {};
      COLOR_VARIABLES_ADMIN.forEach(color => {
        const val = colors[color.varName] || '#000000';
        document.getElementById(`theme-edit-color-${color.varName}`).value = val;
        document.getElementById(`theme-edit-hex-${color.varName}`).value = val;
      });

      editModal.style.display = 'flex';
    } catch (e) {
      console.error(e);
      showToast('Error al cargar datos del tema', true);
    }
  };

  if (document.getElementById('theme-edit-cancel-btn')) {
    document.getElementById('theme-edit-cancel-btn').addEventListener('click', () => {
      editModal.style.display = 'none';
    });
  }

  if (document.getElementById('theme-edit-save-btn')) {
    document.getElementById('theme-edit-save-btn').addEventListener('click', async () => {
      const name = document.getElementById('theme-edit-name').value;
      if (!name) return showToast('El nombre es obligatorio', true);

      // Collect styles
      const colors = {};
      COLOR_VARIABLES_ADMIN.forEach(color => {
        colors[color.varName] = document.getElementById(`theme-edit-hex-${color.varName}`).value;
      });

      const layout = {
        menuPos: document.getElementById('theme-edit-menu-pos').value,
        buttonShape: document.getElementById('theme-edit-btn-shape').value,
        shadows: document.getElementById('theme-edit-shadows').value
      };

      const texts = {
        publicTitle: document.getElementById('theme-edit-text-title').value,
        publicBanner: document.getElementById('theme-edit-text-banner').value
      };

      let bgImage = currentEditingThemeBgImage;
      const bgUploadInput = document.getElementById('theme-edit-bg-upload');
      if (bgUploadInput && bgUploadInput.files.length > 0) {
        const file = bgUploadInput.files[0];
        try {
          const uploadRes = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
              try {
                const res = await fetch('/api/developer/upload-file', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ fileName: file.name, data: e.target.result })
                });
                const resData = await res.json();
                if (resData.success) resolve(resData.fileName);
                else reject(resData.error || 'Error del servidor');
              } catch (err) { reject(err.message); }
            };
            reader.onerror = () => reject('Error al leer el archivo local');
            reader.readAsDataURL(file);
          });
          bgImage = '/' + uploadRes; // el servidor devuelve "uploads/archivo.ext"
        } catch (err) {
          showToast('Error subiendo imagen: ' + err, true);
          return;
        }
      } else if (document.getElementById('theme-edit-bg-image')) {
        bgImage = document.getElementById('theme-edit-bg-image').value.trim();
      }

      const styles = { 
        colors, 
        layout, 
        texts,
        customCss: currentEditingThemeCustomCss,
        bgImage: bgImage
      };

      try {
        let endpoint = '/api/developer/preset';
        let method = 'POST';
        
        if (!isEditingDefaultTheme) {
           endpoint = `/api/developer/preset/${currentEditingThemeId}`;
           method = 'PUT';
        }

        const res = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, styles })
        });

        let resData = {};
        try { resData = await res.json(); } catch(e){}

        if (res.ok) {
          const savedPresetId = resData.preset ? resData.preset.id : currentEditingThemeId;
          window.showToast('Tema guardado. Aplicando...', false);
          editModal.style.display = 'none';
          window.applyThemePreset(savedPresetId);
        } else {
          window.showToast('Error: ' + (resData.error || res.status), true);
          console.error('Save failed:', resData);
        }
      } catch(e) {
        console.error(e);
        window.showToast('Error de red: ' + e.message, true);
      }
    });
  }

});