const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- API ENDPOINTS ---

// GET: Obtener lista de documentacion
app.get('/api/docs', (req, res) => {
  const docsPath = path.join(__dirname, 'documentacion');
  if (fs.existsSync(docsPath)) {
    const files = fs.readdirSync(docsPath).filter(f => f.endsWith('.md'));
    res.json(files);
  } else {
    res.json([]);
  }
});

// GET: Obtener Inventario
app.get('/api/stock', async (req, res) => {
  try {
    const stock = await db.getStock();
    res.json(stock);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al leer el inventario desde la base de datos' });
  }
});

// POST: Actualizar Atributos o Reabastecer un Insumo
app.post('/api/stock/update', async (req, res) => {
  try {
    const { id, price, minStock, stockToAdd } = req.body;
    const fields = {};
    if (price !== undefined) fields.price = parseInt(price);
    if (minStock !== undefined) fields.minStock = parseInt(minStock);
    if (stockToAdd !== undefined) fields.stockToAdd = parseInt(stockToAdd);
    
    const item = await db.updateStockItemFields(id, fields);
    if (!item) {
      return res.status(404).json({ error: 'Insumo no encontrado' });
    }
    res.json({ success: true, item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el insumo' });
  }
});

// GET: Obtener Menú
app.get('/api/menu', async (req, res) => {
  try {
    const menu = await db.getMenu();
    res.json(menu);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al leer el menú' });
  }
});

// GET: Obtener Historial de Ventas
app.get('/api/sales', async (req, res) => {
  try {
    const sales = await db.getSales();
    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el historial de ventas' });
  }
});

// POST: Registrar una Nueva Venta (Y deducir stock de insumos transaccionalmente)
app.post('/api/sales', async (req, res) => {
  try {
    const { items, total, paymentMethod } = req.body;
    
    // 1. Consolidar deducciones para validar stock conjunto
    const deductions = {};
    const addDeduction = (itemId, qty = 1) => {
      if (!deductions[itemId]) deductions[itemId] = 0;
      deductions[itemId] += qty;
    };

    items.forEach(cartItem => {
      if (cartItem.type === 'drink') {
        addDeduction(cartItem.id, 1);
      } else if (cartItem.type === 'menu_waffle' || cartItem.type === 'custom_waffle') {
        const conf = cartItem.config;
        addDeduction(conf.base, 1);
        if (conf.toppings) conf.toppings.forEach(tId => addDeduction(tId, 1));
        if (conf.syrups) conf.syrups.forEach(sId => addDeduction(sId, 1));
        if (conf.icecreams) conf.icecreams.forEach(iId => addDeduction(iId, 1));
      }
    });

    const newSale = {
      id: `sale_${Date.now()}`,
      date: new Date().toISOString(),
      items: items.map(item => ({
        name: item.name,
        details: item.details,
        price: item.price
      })),
      total: parseInt(total),
      paymentMethod,
      status: 'pending',
      cashierName: req.body.cashierName || 'Administrador'
    };

    // Ejecutar checkout transaccional en Postgres
    await db.executeSale(newSale, deductions);
    
    res.json({ success: true, sale: newSale });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Error al registrar la venta' });
  }
});

// POST: Reembolsar / Devolver una Venta (Restituye el stock transaccionalmente)
app.post('/api/sales/refund', async (req, res) => {
  try {
    const { saleId } = req.body;
    const menu = await db.getMenu();
    
    // Ejecutar reembolso transaccional
    await db.executeRefund(saleId, menu);
    
    // Obtener la venta actualizada para responder
    const sale = await db.getSaleById(saleId);
    if (!sale) {
      return res.status(404).json({ error: 'Venta no encontrada después del reembolso' });
    }
    
    res.json({ success: true, sale });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Error al reembolsar la venta' });
  }
});

// --- ENDPOINTS DE AUTENTICACIÓN ---

// POST: Verificar PIN del cajero
app.post('/api/auth/verify-cashier', async (req, res) => {
  try {
    const { employeeId, pin } = req.body;
    
    // Si envían employeeId, buscamos en la tabla empleados
    if (employeeId) {
      const employees = await db.getEmployees();
      const emp = employees.find(e => e.id === employeeId && e.active);
      if (emp && emp.pin === pin) {
        return res.json({ success: true, cashierName: emp.name });
      } else {
        return res.json({ success: false });
      }
    }
    
    // Fallback: verificar PIN genérico de caja (legacy)
    const settings = await db.getSettings();
    if (settings && settings.cashierPin === pin) {
      res.json({ success: true, cashierName: 'Caja Principal' });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error de servidor en autenticación' });
  }
});

// POST: Verificar clave del administrador
app.post('/api/auth/verify-admin', async (req, res) => {
  try {
    const { password } = req.body;
    const settings = await db.getSettings();
    if (settings && settings.adminPassword === password) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error de servidor en autenticación' });
  }
});

// POST: Cambiar credenciales
app.post('/api/auth/change-credentials', async (req, res) => {
  try {
    const { currentPassword, newAdminPassword, newCashierPin } = req.body;
    const settings = await db.getSettings();
    if (!settings || settings.adminPassword !== currentPassword) {
      return res.status(401).json({ error: 'Contraseña actual de administrador incorrecta' });
    }
    await db.updateSettings(newAdminPassword, newCashierPin);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar credenciales' });
  }
});


// --- ENDPOINTS CONFIGURACIÓN DESARROLLADOR ---

// GET: Obtener configuración de desarrollador y tema
app.get('/api/developer/settings', async (req, res) => {
  try {
    const devSettings = await db.getDeveloperSettings();
    res.json(devSettings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener configuración de desarrollador' });
  }
});

// POST: Habilitar/Deshabilitar módulo desarrollador
app.post('/api/developer/settings', async (req, res) => {
  try {
    const { developerMode } = req.body;
    if (developerMode === undefined) {
      return res.status(400).json({ error: 'Falta el campo developerMode' });
    }
    await db.updateDeveloperSettings(developerMode, undefined);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar configuración de desarrollador' });
  }
});

// POST: Actualizar colores del tema
app.post('/api/developer/theme', async (req, res) => {
  try {
    const { themeColors } = req.body;
    if (themeColors === undefined) {
      return res.status(400).json({ error: 'Falta el campo themeColors' });
    }
    await db.updateDeveloperSettings(undefined, themeColors);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar colores del tema' });
  }
});

// POST: Resetear colores del tema
app.post('/api/developer/theme/reset', async (req, res) => {
  try {
    await db.updateDeveloperSettings(undefined, {});
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al resetear colores del tema' });
  }
});

// GET: Obtener información de la empresa
app.get('/api/company/info', async (req, res) => {
  try {
    const info = await db.getCompanyInfo();
    res.json(info);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener información de la empresa' });
  }
});

// POST: Actualizar información de la empresa
app.post('/api/company/info', async (req, res) => {
  try {
    const { companyName, companyAddress, companyHours, companyInstagram, companyPhone, whatsappOrdersEnabled, heroImages, heroCarouselEnabled, mapBgImage, mapPinX, mapPinY, companyLogo, kdsAlertTime } = req.body;
    
    // Si no viene alguno de los principales, intentamos no pisar si es posible, pero requerimos los básicos si se envía el formulario de empresa.
    // Como ahora puede ser una actualización parcial (sólo hero o sólo mapa), vamos a buscar los existentes y hacer merge.
    const currentInfo = await db.getCompanyInfo();
    
    await db.updateCompanyInfo({
      companyName: companyName !== undefined ? companyName : currentInfo.companyName,
      companyAddress: companyAddress !== undefined ? companyAddress : currentInfo.companyAddress,
      companyHours: companyHours !== undefined ? companyHours : currentInfo.companyHours,
      companyInstagram: companyInstagram !== undefined ? companyInstagram : currentInfo.companyInstagram,
      companyPhone: companyPhone !== undefined ? companyPhone : currentInfo.companyPhone,
      whatsappOrdersEnabled: whatsappOrdersEnabled !== undefined ? whatsappOrdersEnabled : currentInfo.whatsappOrdersEnabled,
      heroImages: heroImages !== undefined ? heroImages : currentInfo.heroImages,
      heroCarouselEnabled: heroCarouselEnabled !== undefined ? heroCarouselEnabled : currentInfo.heroCarouselEnabled,
      mapBgImage: mapBgImage !== undefined ? mapBgImage : currentInfo.mapBgImage,
      mapPinX: mapPinX !== undefined ? mapPinX : currentInfo.mapPinX,
      mapPinY: mapPinY !== undefined ? mapPinY : currentInfo.mapPinY,
      companyLogo: companyLogo !== undefined ? companyLogo : currentInfo.companyLogo,
      kdsAlertTime: kdsAlertTime !== undefined ? kdsAlertTime : currentInfo.kdsAlertTime
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar información de la empresa' });
  }
});

// POST: Guardar preset de desarrollador personalizado
app.post('/api/developer/preset', async (req, res) => {
  try {
    const { name, colors } = req.body;
    if (!name || !colors) {
      return res.status(400).json({ error: 'Nombre y colores son requeridos' });
    }
    const newPreset = await db.saveCustomPreset({ name, colors });
    res.json({ success: true, preset: newPreset });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar preset personalizado' });
  }
});

// DELETE: Eliminar preset de desarrollador personalizado
app.delete('/api/developer/preset/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteCustomPreset(id);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar preset personalizado' });
  }
});

// PUT: Actualizar estado de una venta (KDS)
app.put('/api/sales/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Falta el campo status' });
    }
    await db.updateSaleStatus(id, status);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el estado de la venta' });
  }
});

// GET: Obtener estado de fidelización
app.get('/api/loyalty/settings', async (req, res) => {
  try {
    const settings = await db.getLoyaltySettings();
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener configuración de fidelización' });
  }
});

// POST: Modificar estado de fidelización
app.post('/api/loyalty/settings', async (req, res) => {
  try {
    const { loyaltyEnabled, loyaltyPointsThreshold } = req.body;
    if (loyaltyEnabled === undefined) {
      return res.status(400).json({ error: 'Falta el campo loyaltyEnabled' });
    }
    await db.updateLoyaltySettings(loyaltyEnabled, loyaltyPointsThreshold);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar configuración de fidelización' });
  }
});

// GET: Buscar cliente de fidelización
app.get('/api/loyalty/customer/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const customer = await db.getLoyaltyCustomer(phone);
    if (!customer) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener cliente de fidelización' });
  }
});

// POST: Crear o acumular puntos a un cliente
app.post('/api/loyalty/customer', async (req, res) => {
  try {
    const { phone, name, pointsToAdd } = req.body;
    if (!phone || !name || pointsToAdd === undefined) {
      return res.status(400).json({ error: 'Teléfono, nombre y puntos a agregar son requeridos' });
    }
    const customer = await db.updateLoyaltyPoints(phone, name, parseInt(pointsToAdd));
    res.json({ success: true, customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar puntos de fidelización' });
  }
});

// GET: Obtener lista de clientes de fidelización
app.get('/api/loyalty/customers', async (req, res) => {
  try {
    const list = await db.getLoyaltyCustomers();
    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener lista de clientes' });
  }
});

// --- ENDPOINTS CRUD MENÚ ---

// POST: Crear un nuevo waffle en el menú
app.post('/api/menu', async (req, res) => {
  try {
    const { name, description, price, base, toppings, syrups, icecreams, image, isVisible, showPrice, type, stockId } = req.body;
    const newId = `menu_${Date.now()}`;
    const newItem = {
      id: newId,
      name,
      description,
      price: parseInt(price),
      base,
      toppings: toppings || [],
      syrups: syrups || [],
      icecreams: icecreams || [],
      image: image || '',
      isVisible: isVisible !== false,
      showPrice: showPrice !== false,
      type: type || 'waffle',
      stockId: stockId || null
    };
    await db.createMenuItem(newItem);
    res.json({ success: true, item: newItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al agregar item al menú' });
  }
});

// PUT: Actualizar un waffle del menú
app.put('/api/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, base, toppings, syrups, icecreams, image, isVisible, showPrice, type, stockId } = req.body;
    
    const menu = await db.getMenu();
    const existing = menu.find(m => m.id === id);
    if (!existing) {
      return res.status(404).json({ error: 'Item de menú no encontrado' });
    }

    const updated = {
      name,
      description,
      price: parseInt(price),
      base,
      toppings: toppings || [],
      syrups: syrups || [],
      icecreams: icecreams || [],
      image: image || existing.image,
      isVisible: isVisible !== false,
      showPrice: showPrice !== false,
      type: type || 'waffle',
      stockId: stockId || null
    };
    await db.updateMenuItem(id, updated);
    res.json({ success: true, item: { id, ...updated } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar item del menú' });
  }
});

// DELETE: Eliminar un waffle del menú
app.delete('/api/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteMenuItem(id);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar item del menú' });
  }
});

// --- ENDPOINTS CRUD EMPLEADOS ---

// GET: Lista de empleados
app.get('/api/employees', async (req, res) => {
  try {
    const list = await db.getEmployees();
    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener empleados' });
  }
});

// POST: Crear empleado
app.post('/api/employees', async (req, res) => {
  try {
    const { name, pin, role, active } = req.body;
    if (!name || !pin) {
      return res.status(400).json({ error: 'Nombre y PIN son requeridos' });
    }
    const newId = `emp_${Date.now()}`;
    const newEmp = { id: newId, name, pin, role, active };
    await db.createEmployee(newEmp);
    res.json({ success: true, employee: newEmp });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear empleado' });
  }
});

// PUT: Actualizar empleado
app.put('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, pin, active } = req.body;
    await db.updateEmployee(id, { name, pin, active });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar empleado' });
  }
});

// DELETE: Borrar empleado
app.delete('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteEmployee(id);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar empleado' });
  }
});

// --- ENDPOINTS CRUD STOCK / INGREDIENTES ---

// POST: Crear un nuevo ingrediente/insumo
app.post('/api/stock', async (req, res) => {
  try {
    const { name, category, stock, minStock, price, cost, unit, sellingPrice, recipe } = req.body;
    const shortCat = category === 'bases' ? 'base' : (category === 'toppings' ? 'top' : (category === 'syrups' ? 'syr' : (category === 'icecreams' ? 'ice' : 'drink')));
    const newId = `${shortCat}_${Date.now()}`;
    const newItem = {
      id: newId,
      name,
      category,
      stock: parseInt(stock) || 0,
      minStock: parseInt(minStock) || 0,
      price: parseInt(price) || 0,
      cost: cost !== undefined ? parseInt(cost) : parseInt(price) || 0,
      unit: unit || 'porciones'
    };
    if (recipe) {
      newItem.recipe = recipe;
    }
    await db.createStockItem(newItem);

    // Si es una bebida y tiene precio de venta, lo publicamos en el menú
    if (category === 'drinks' && sellingPrice > 0) {
      const newMenuId = `menu_${Date.now()}`;
      const newMenuItem = {
        id: newMenuId,
        name,
        description: 'Venta Directa',
        price: parseInt(sellingPrice),
        base: null,
        toppings: [],
        syrups: [],
        icecreams: [],
        image: null,
        isVisible: true,
        showPrice: true,
        type: 'direct',
        stockId: newId
      };
      await db.createMenuItem(newMenuItem);
    }

    res.json({ success: true, item: newItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el ingrediente' });
  }
});

// PUT: Actualizar todos los campos de un ingrediente
app.put('/api/stock/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, stock, minStock, price, cost, unit, sellingPrice, recipe } = req.body;
    
    const currentStock = await db.getStock();
    let existingItem = null;
    for (const cat in currentStock) {
      const found = currentStock[cat].find(i => i.id === id);
      if (found) {
        existingItem = found;
        break;
      }
    }
    if (!existingItem) {
      return res.status(404).json({ error: 'Ingrediente no encontrado' });
    }
    
    const updatedItem = {
      name: name || existingItem.name,
      category: category || existingItem.category,
      stock: stock !== undefined ? parseInt(stock) : existingItem.stock,
      minStock: minStock !== undefined ? parseInt(minStock) : existingItem.minStock,
      price: price !== undefined ? parseInt(price) : existingItem.price,
      cost: cost !== undefined ? parseInt(cost) : (price !== undefined ? parseInt(price) : existingItem.cost),
      unit: unit || existingItem.unit
    };
    if (recipe) {
      updatedItem.recipe = recipe;
    } else if (existingItem.recipe) {
      // Keep existing recipe if none provided in update, or maybe it should be explicitly cleared?
      // Usually PUT replaces the whole object, but to be safe we'll overwrite it if provided, or keep if not.
      // Actually, if they pass recipe: null, we should delete it.
      if (req.body.hasOwnProperty('recipe') && recipe === null) {
        // Do nothing, it will not have the recipe field.
      } else {
        updatedItem.recipe = existingItem.recipe;
      }
    }
    
    await db.updateStockItem(id, updatedItem);

    if (updatedItem.category === 'drinks' && sellingPrice > 0) {
      const menu = await db.getMenu();
      const existingMenu = menu.find(m => m.stockId === id);
      if (existingMenu) {
        existingMenu.price = parseInt(sellingPrice);
        existingMenu.name = updatedItem.name;
        await db.updateMenuItem(existingMenu.id, existingMenu);
      } else {
        const newMenuId = `menu_${Date.now()}`;
        const newMenuItem = {
          id: newMenuId,
          name: updatedItem.name,
          description: 'Venta Directa',
          price: parseInt(sellingPrice),
          base: null,
          toppings: [],
          syrups: [],
          icecreams: [],
          image: null,
          isVisible: true,
          showPrice: true,
          type: 'direct',
          stockId: id
        };
        await db.createMenuItem(newMenuItem);
      }
    }

    res.json({ success: true, item: { id, ...updatedItem } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar ingrediente' });
  }
});

// POST: Fabricar Lote de Insumo Elaborado
app.post('/api/stock/:id/produce', async (req, res) => {
  try {
    const { id } = req.params;
    const { batches } = req.body; // How many recipes to run
    
    // Fetch current stock to find the item and its recipe
    const allStockRaw = await db.getStock();
    const allStock = Array.isArray(allStockRaw) ? allStockRaw : 
      [...allStockRaw.bases, ...allStockRaw.toppings, ...allStockRaw.syrups, ...allStockRaw.drinks, ...allStockRaw.icecreams];
    
    const targetItem = allStock.find(item => item.id === id);
    if (!targetItem || !targetItem.recipe || !targetItem.recipe.ingredients) {
      return res.status(400).json({ error: 'El insumo no tiene una receta válida para fabricar' });
    }

    const multiplier = parseInt(batches) || 1;
    const yieldAmount = parseInt(targetItem.recipe.yield) || 1;
    const totalToProduce = yieldAmount * multiplier;

    // Deduct ingredients and add yield
    const deductions = {};
    for (const ing of targetItem.recipe.ingredients) {
      deductions[ing.id] = (ing.qty * multiplier);
    }

    // Since db.executeSale handles deductions gracefully, we can just use a similar custom transaction.
    // However, db.executeSale is for sales. Let's do it manually using updateStockItem.
    
    // 1. Deduct
    for (const [ingId, deductQty] of Object.entries(deductions)) {
      const ingItem = allStock.find(item => item.id === ingId);
      if (ingItem) {
        await db.updateStockItem(ingId, { stock: Math.max(0, ingItem.stock - deductQty) });
      }
    }
    
    // 2. Add
    await db.updateStockItem(id, { stock: targetItem.stock + totalToProduce });

    res.json({ success: true, produced: totalToProduce });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al fabricar lote' });
  }
});

// DELETE: Eliminar un ingrediente del inventario
app.delete('/api/stock/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteStockItem(id);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar ingrediente' });
  }
});

// POST: Guardar imagen recibida como Base64
app.post('/api/menu/upload-image', (req, res) => {
  try {
    const { fileName, data } = req.body;
    if (!fileName || !data) {
      return res.status(400).json({ error: 'Nombre de archivo e imagen en base64 son requeridos' });
    }
    
    const ext = path.extname(fileName) || '.jpeg';
    const baseName = path.basename(fileName, ext).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const uniqueFileName = `${baseName}_${Date.now()}${ext}`;
    
    const base64Regex = /^data:image\/\w+;base64,/;
    const cleanData = data.replace(base64Regex, '');
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }
    
    const filePath = path.join(uploadsDir, uniqueFileName);
    fs.writeFileSync(filePath, Buffer.from(cleanData, 'base64'));
    
    res.json({ success: true, fileName: `uploads/${uniqueFileName}` });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar la imagen en el servidor' });
  }
});

// --- ENDPOINTS EMPLEADOS ---
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await db.getEmployees();
    res.json(employees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener empleados' });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const { name, pin, role, active } = req.body;
    if (!name || !pin) return res.status(400).json({ error: 'Nombre y PIN son obligatorios' });
    
    const newEmployee = {
      id: 'emp_' + Date.now(),
      name,
      pin,
      role,
      active
    };
    
    await db.createEmployee(newEmployee);
    res.json({ success: true, employee: newEmployee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear empleado' });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, pin, role, active } = req.body;
    const employee = await db.updateEmployee(id, { name, pin, role, active });
    if (!employee) return res.status(404).json({ error: 'Empleado no encontrado' });
    res.json({ success: true, employee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar empleado' });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.deleteEmployee(id);
    if (!result) return res.status(404).json({ error: 'Empleado no encontrado' });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar empleado' });
  }
});

// --- ENDPOINTS KITCHEN DISPLAY SYSTEM (KDS) ---

// GET: Lista de pedidos pendientes en cocina
app.get('/api/kitchen/tickets', async (req, res) => {
  try {
    const tickets = await db.getKitchenTickets();
    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los tickets de cocina' });
  }
});

// PUT: Cambiar estado del ticket de cocina
app.put('/api/kitchen/tickets/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending', 'preparing', 'ready', 'delivered'].includes(status)) {
      return res.status(400).json({ error: 'Estado de KDS inválido' });
    }
    await db.updateKitchenTicketStatus(id, status);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el estado del ticket en cocina' });
  }
});
// --- ENDPOINTS ORDER TRACKING ---
app.get('/api/tracking/:ticket', async (req, res) => {
  try {
    const { ticket } = req.params;
    if (!ticket || ticket.length !== 4) {
      return res.status(400).json({ error: 'El número de ticket debe tener 4 dígitos' });
    }
    const status = await db.getTicketStatus(ticket);
    if (!status) {
      return res.status(404).json({ error: 'Ticket no encontrado o ya entregado hoy' });
    }
    res.json(status);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al rastrear ticket' });
  }
});

// --- SERVIR ARCHIVOS ESTÁTICOS ---
app.use(express.static(path.join(__dirname)));
app.use('/caja', express.static(path.join(__dirname, 'caja')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/cocina', express.static(path.join(__dirname, 'cocina')));

// Iniciar el servidor con la inicialización automática de la Base de Datos
db.initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`  SERVIDOR SR. WAFFLE INICIADO CON ÉXITO`);
    console.log(`  Persistencia: PostgreSQL`);
    console.log(`  Accede localmente en:`);
    console.log(`  - Cliente: http://localhost:${PORT}`);
    console.log(`  - Caja POS (Solo Ventas): http://localhost:${PORT}/caja`);
    console.log(`  - Cocina KDS: http://localhost:${PORT}/cocina`);
    console.log(`  - Panel de Administración: http://localhost:${PORT}/admin`);
    console.log(`=========================================`);
  });
}).catch(err => {
  console.error('Error crítico al inicializar la base de datos PostgreSQL:', err);
  process.exit(1);
});
