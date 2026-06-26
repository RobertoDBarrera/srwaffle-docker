const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./src/db/index');

const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const JWT_SECRET = process.env.JWT_SECRET || 'sr_waffle_secret_key_1234';

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiados intentos de inicio de sesión' }
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

const authenticateToken = (req, res, next) => {
  // Permitir todas las peticiones GET excepto ventas y empleados
  if (req.method === 'GET' && !req.path.startsWith('/api/sales') && !req.path.startsWith('/api/employees')) {
    return next();
  }
  // Permitir rutas de autenticación
  if (req.path.startsWith('/api/auth/')) {
    return next();
  }
  
  // Exigir token para todo lo demás
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

// Aplicar middleware a todas las rutas /api/
app.use('/api', authenticateToken);

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
app.post('/api/auth/verify-cashier', authLimiter, async (req, res) => {
  try {
    const { employeeId, pin } = req.body;
    const settings = await db.getSettings();
    if (settings && settings.cashierPin === pin) {
      const token = jwt.sign({ role: 'cashier', name: 'Caja Principal' }, JWT_SECRET, { expiresIn: '12h' });
      res.json({ success: true, cashierName: 'Caja Principal', token });
    } else res.json({ success: false });
  } catch (error) { res.status(500).json({ error: 'Error interno del servidor' }); }
});

app.post('/api/auth/verify-admin', authLimiter, async (req, res) => {
  try {
    const { password } = req.body;
    const settings = await db.getSettings();
    if (settings && settings.adminPassword === password) {
      const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });
      res.json({ success: true, token });
    } else res.json({ success: false });
  } catch (error) { res.status(500).json({ error: 'Error interno del servidor' }); }
});

app.get('/api/loyalty/settings', async (req, res) => {
  res.json({ loyaltyEnabled: false, loyaltyPointsThreshold: 100 });
});
app.get('/api/loyalty/customers', async (req, res) => {
  res.json(await db.getLoyaltyCustomers());
});

app.post('/api/menu/upload-image', (req, res) => {
  // Mock image upload
  res.json({ success: true, fileName: 'ima_mock.jpeg' });
});

// --- DEVELOPER UPLOADS ---
app.post('/api/developer/upload-file', (req, res) => {
  try {
    const { fileName, data } = req.body;
    if (!fileName || !data) return res.status(400).json({ error: 'Faltan datos' });
    
    // El payload data suele venir como "data:image/jpeg;base64,/9j/4AAQ..."
    const parts = data.split(';base64,');
    const ext = fileName.split('.').pop().toLowerCase();
    
    // Validación estricta de extensión
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      return res.status(400).json({ error: 'Formato de archivo no permitido. Use JPG, PNG o WEBP.' });
    }
    
    const safeName = `theme_file_${Date.now()}.${ext}`;
    
    const base64Data = parts.length > 1 ? parts[1] : parts[0];
    const buffer = Buffer.from(base64Data, 'base64');
    
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
    
    fs.writeFileSync(path.join(uploadsDir, safeName), buffer);
    res.json({ success: true, fileName: `uploads/${safeName}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
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
    const { activeTheme, activePresetId } = req.body;
    const current = await db.getSettings();
    
    if (activePresetId) {
      let stylesToApply = null;
      if (activePresetId.startsWith('default_')) {
        // We do not save default styles to DB directly to save space, the client will resolve it.
        await db.updateSettings({ ...current, activePresetId, activeTheme: null });
        return res.json({ success: true, activePresetId });
      } else {
        const customPresets = current.customPresets || [];
        const preset = customPresets.find(p => p.id === activePresetId);
        if (preset) {
          await db.updateSettings({ ...current, activePresetId, activeTheme: preset.styles });
          return res.json({ success: true, activePresetId, theme: preset.styles });
        }
      }
      return res.status(404).json({ error: 'Preset not found' });
    }

    await db.updateSettings({ ...current, activeTheme });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/developer/theme/reset', async (req, res) => {
  try {
    const current = await db.getSettings();
    await db.updateSettings({ ...current, activeTheme: null });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/developer/preset', async (req, res) => {
  try {
    const { name, styles } = req.body;
    console.log('--- SAVING NEW PRESET ---');
    console.log('Preset name:', name);
    console.log('Received styles:', JSON.stringify(styles).substring(0, 200) + '...');
    console.log('Contains customCss?', !!styles.customCss);
    const current = await db.getSettings();
    const presets = current.customPresets || [];
    const newPreset = { id: `preset_${Date.now()}`, name, styles };
    presets.push(newPreset);
    await db.updateSettings({ ...current, customPresets: presets });
    res.json({ success: true, preset: newPreset });
  } catch (e) { res.status(500).json({ error: e.message }); }
});


app.put('/api/developer/preset/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, styles } = req.body;
    const current = await db.getSettings();
    const presets = current.customPresets || [];
    
    const index = presets.findIndex(p => p.id === id);
    if (index !== -1) {
      if (name) presets[index].name = name;
      if (styles) presets[index].styles = styles;
      await db.updateSettings({ ...current, customPresets: presets });
      res.json({ success: true, preset: presets[index] });
    } else {
      res.status(404).json({ error: 'Preset not found' });
    }
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
