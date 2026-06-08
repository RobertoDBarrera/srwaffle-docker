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
      status: 'completed'
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
    const { pin } = req.body;
    const settings = await db.getSettings();
    if (settings && settings.cashierPin === pin) {
      res.json({ success: true });
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

// --- ENDPOINTS CRUD MENÚ ---

// POST: Crear un nuevo waffle en el menú
app.post('/api/menu', async (req, res) => {
  try {
    const { name, description, price, base, toppings, syrups, icecreams, image } = req.body;
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
      image: image || ''
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
    const { name, description, price, base, toppings, syrups, icecreams, image } = req.body;
    
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
      image: image || existing.image
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

// --- ENDPOINTS CRUD STOCK / INGREDIENTES ---

// POST: Crear un nuevo ingrediente/insumo
app.post('/api/stock', async (req, res) => {
  try {
    const { name, category, stock, minStock, price, unit } = req.body;
    const shortCat = category === 'bases' ? 'base' : (category === 'toppings' ? 'top' : (category === 'syrups' ? 'syr' : (category === 'icecreams' ? 'ice' : 'drink')));
    const newId = `${shortCat}_${Date.now()}`;
    const newItem = {
      id: newId,
      name,
      category,
      stock: parseInt(stock) || 0,
      minStock: parseInt(minStock) || 0,
      price: parseInt(price) || 0,
      unit: unit || 'porciones'
    };
    await db.createStockItem(newItem);
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
    const { name, category, stock, minStock, price, unit } = req.body;
    
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
      unit: unit || existingItem.unit
    };
    
    await db.updateStockItem(id, updatedItem);
    res.json({ success: true, item: { id, ...updatedItem } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar ingrediente' });
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
    
    const filePath = path.join(__dirname, uniqueFileName);
    fs.writeFileSync(filePath, Buffer.from(cleanData, 'base64'));
    
    res.json({ success: true, fileName: uniqueFileName });
  } catch (error) {
    console.error('Error al subir imagen:', error);
    res.status(500).json({ error: 'Error al guardar la imagen en el servidor' });
  }
});

// --- SERVIR ARCHIVOS ESTÁTICOS ---
app.use(express.static(path.join(__dirname)));
app.use('/caja', express.static(path.join(__dirname, 'caja')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Iniciar el servidor con la inicialización automática de la Base de Datos
db.initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`  SERVIDOR SR. WAFFLE INICIADO CON ÉXITO`);
    console.log(`  Persistencia: PostgreSQL`);
    console.log(`  Accede localmente en:`);
    console.log(`  - Cliente: http://localhost:${PORT}`);
    console.log(`  - Caja POS (Solo Ventas): http://localhost:${PORT}/caja`);
    console.log(`  - Panel de Administración: http://localhost:${PORT}/admin`);
    console.log(`=========================================`);
  });
}).catch(err => {
  console.error('Error crítico al inicializar la base de datos PostgreSQL:', err);
  process.exit(1);
});
