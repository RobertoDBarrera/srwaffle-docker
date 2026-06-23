const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./src/db/index');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- API DOCS ---
app.get('/api/docs', (req, res) => {
  const docsPath = path.join(__dirname, 'documentacion');
  if (fs.existsSync(docsPath)) {
    const files = fs.readdirSync(docsPath).filter(f => f.endsWith('.md'));
    res.json(files);
  } else res.json([]);
});

// --- API STOCK ---
app.get('/api/stock', async (req, res) => {
  try { res.json(await db.getStock()); }
  catch (e) { res.status(500).json({error: e.message}); }
});
app.post('/api/stock', async (req, res) => {
  try { res.json({ success: true, item: await db.createStockItem(req.body) }); }
  catch (e) { res.status(500).json({error: e.message}); }
});
app.put('/api/stock/:id', async (req, res) => {
  try { res.json({ success: true, item: await db.updateStockItem(req.params.id, req.body) }); }
  catch (e) { res.status(500).json({error: e.message}); }
});
app.delete('/api/stock/:id', async (req, res) => {
  try { res.json({ success: true, result: await db.deleteStockItem(req.params.id) }); }
  catch (e) { res.status(500).json({error: e.message}); }
});

// --- API MASAS ---
app.get('/api/masas', async (req, res) => {
  try { res.json(await db.getMasas()); }
  catch (e) { res.status(500).json({error: e.message}); }
});
app.post('/api/masas', async (req, res) => {
  try { res.json({ success: true, item: await db.createMasa(req.body) }); }
  catch (e) { res.status(500).json({error: e.message}); }
});
app.put('/api/masas/:id', async (req, res) => {
  try { res.json({ success: true, item: await db.updateMasa(req.params.id, req.body) }); }
  catch (e) { res.status(500).json({error: e.message}); }
});
app.delete('/api/masas/:id', async (req, res) => {
  try { res.json({ success: true, result: await db.deleteMasa(req.params.id) }); }
  catch (e) { res.status(500).json({error: e.message}); }
});
app.post('/api/masas/:id/produce', async (req, res) => {
  try {
    const { qty } = req.body;
    const masa = await db.getMasa(req.params.id);
    if (!masa) return res.status(404).json({error:'Masa no encontrada'});
    // Descontar inventario
    if (masa.ingredients && masa.ingredients.length > 0) {
      for (const ing of masa.ingredients) {
        await db.updateStockQuantity(ing.stock_id, -(ing.qty * qty));
      }
    }
    // Sumar masas
    await db.updateMasaQuantity(masa.id, masa.yield_qty * qty);
    res.json({ success: true });
  } catch (e) { res.status(500).json({error: e.message}); }
});

// --- API WAFFLES ---
app.get('/api/waffles', async (req, res) => {
  try { res.json(await db.getWaffles()); }
  catch (e) { res.status(500).json({error: e.message}); }
});
app.post('/api/waffles', async (req, res) => {
  try { res.json({ success: true, item: await db.createWaffle(req.body) }); }
  catch (e) { res.status(500).json({error: e.message}); }
});
app.put('/api/waffles/:id', async (req, res) => {
  try { res.json({ success: true, item: await db.updateWaffle(req.params.id, req.body) }); }
  catch (e) { res.status(500).json({error: e.message}); }
});
app.delete('/api/waffles/:id', async (req, res) => {
  try { res.json({ success: true, result: await db.deleteWaffle(req.params.id) }); }
  catch (e) { res.status(500).json({error: e.message}); }
});

// --- API MENU ---
app.get('/api/menu', async (req, res) => {
  try { res.json(await db.getMenu()); }
  catch (e) { res.status(500).json({error: e.message}); }
});
app.post('/api/menu', async (req, res) => {
  try { res.json({ success: true, item: await db.createMenuItem(req.body) }); }
  catch (e) { res.status(500).json({error: e.message}); }
});
app.put('/api/menu/:id/toggle', async (req, res) => {
  try { res.json({ success: true, item: await db.toggleMenuVisible(req.params.id, req.body.is_visible) }); }
  catch (e) { res.status(500).json({error: e.message}); }
});
app.delete('/api/menu/:id', async (req, res) => {
  try { res.json({ success: true, result: await db.deleteMenuItem(req.params.id) }); }
  catch (e) { res.status(500).json({error: e.message}); }
});

// --- API SALES ---
app.get('/api/sales', async (req, res) => {
  try { res.json(await db.getSales()); }
  catch (e) { res.status(500).json({error: e.message}); }
});

app.post('/api/sales', async (req, res) => {
  try {
    const { items, total, paymentMethod, cashierName } = req.body;
    
    // Descuento de stock en POS según la nueva lógica (Option 1)
    for (const item of items) {
      if (item.type === 'drink' || item.type === 'direct') {
        // Direct deduction from stock (1 unit = 1 portion)
        const stockItem = await db.getStockItem(item.id);
        if (stockItem) {
          await db.updateStockQuantity(item.id, -(stockItem.portion_size || 1));
        }
      } else if (item.type === 'menu_waffle') {
        const conf = item.config;
        if (conf.ingredients) {
          for (const ing of conf.ingredients) {
            if (ing.type === 'masa') {
              await db.updateMasaQuantity(ing.id, -ing.qty);
            } else if (ing.type === 'stock') {
              await db.updateStockQuantity(ing.id, -ing.qty);
            }
          }
        }
      } else if (item.type === 'custom_waffle') {
        const conf = item.config;
        // Masa
        if (conf.base) await db.updateMasaQuantity(conf.base, -1);
        
        // Stock extra (Toppings, Syrups, Icecreams)
        const extras = [...(conf.toppings || []), ...(conf.syrups || []), ...(conf.icecreams || [])];
        for (const extraId of extras) {
          if (!extraId || extraId === 'none') continue;
          const stockItem = await db.getStockItem(extraId);
          if (stockItem) {
            await db.updateStockQuantity(extraId, -(stockItem.portion_size || 1));
          }
        }
      }
    }

    const newSale = {
      id: `sale_${Date.now()}`,
      date: new Date().toISOString(),
      items, total, paymentMethod,
      cashierName: cashierName || 'Administrador',
      status: 'pending'
    };
    await db.createSale(newSale);
    res.json({ success: true, sale: newSale });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- API AUTH & SETTINGS ---
app.post('/api/auth/verify-cashier', async (req, res) => {
  try {
    const { employeeId, pin } = req.body;
    const settings = await db.getSettings();
    if (settings && settings.cashierPin === pin) res.json({ success: true, cashierName: 'Caja Principal' });
    else res.json({ success: false });
  } catch (error) { res.status(500).json({ error: 'Error de servidor' }); }
});

app.post('/api/auth/verify-admin', async (req, res) => {
  try {
    const { password } = req.body;
    const settings = await db.getSettings();
    if (settings && settings.adminPassword === password) res.json({ success: true });
    else res.json({ success: false });
  } catch (error) { res.status(500).json({ error: 'Error de servidor' }); }
});

app.get('/api/loyalty/settings', async (req, res) => {
  res.json({ loyaltyEnabled: false, loyaltyPointsThreshold: 100 });
});
app.get('/api/loyalty/customers', async (req, res) => {
  res.json(await db.getLoyaltyCustomers());
});

app.post('/api/menu/upload-image', (req, res) => {
  // Mock image upload
  res.json({ success: true, imagePath: 'ima_mock.jpeg' });
});

// --- EMPLEADOS ---
app.get('/api/employees', async (req, res) => {
  try {
    const list = await db.getEmployees();
    res.json(list);
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});

app.post('/api/employees', async (req, res) => {
  try {
    const { name, pin, role, active } = req.body;
    const newEmp = { id: 'emp_' + Date.now(), name, pin, role, active };
    await db.createEmployee(newEmp);
    res.json({ success: true, employee: newEmp });
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    await db.updateEmployee(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    await db.deleteEmployee(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});

// --- INFO COMPAÑIA ---
app.get('/api/company/info', async (req, res) => {
  try { res.json(await db.getCompanyInfo()); } catch (error) { res.status(500).json({ error: 'Error' }); }
});

app.post('/api/company/info', async (req, res) => {
  try { await db.updateCompanyInfo(req.body); res.json({ success: true }); } catch (error) { res.status(500).json({ error: 'Error' }); }
});

// --- API CONFIGURACION DESARROLLADOR ---
app.get('/api/developer/settings', async (req, res) => {
  try {
    const settings = await db.getSettings();
    res.json(settings);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/developer/settings', async (req, res) => {
  try {
    const { developerMode } = req.body;
    if (developerMode === undefined) {
      return res.status(400).json({ error: 'Falta el campo developerMode' });
    }
    const current = await db.getSettings();
    await db.updateSettings({ ...current, developerMode });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/developer/theme', async (req, res) => {
  try {
    const { themeColors } = req.body;
    const current = await db.getSettings();
    await db.updateSettings({ ...current, themeColors });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/developer/theme/reset', async (req, res) => {
  try {
    const current = await db.getSettings();
    await db.updateSettings({ ...current, themeColors: {} });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/developer/preset', async (req, res) => {
  try {
    const { name, colors } = req.body;
    const current = await db.getSettings();
    const presets = current.customPresets || [];
    const newPreset = { id: `preset_${Date.now()}`, name, colors };
    presets.push(newPreset);
    await db.updateSettings({ ...current, customPresets: presets });
    res.json({ success: true, preset: newPreset });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/developer/preset/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const current = await db.getSettings();
    const presets = (current.customPresets || []).filter(p => p.id !== id);
    await db.updateSettings({ ...current, customPresets: presets });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.use(express.static(path.join(__dirname)));
app.use('/caja', express.static(path.join(__dirname, 'caja')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/cocina', express.static(path.join(__dirname, 'cocina')));
app.use('/docs', express.static(path.join(__dirname, 'documentacion')));

app.listen(PORT, () => {
  console.log(`🚀 Servidor Sr. Waffle V2 corriendo en el puerto ${PORT}`);
});
