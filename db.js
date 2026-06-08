const pg = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

const isProduction = process.env.NODE_ENV === 'production';
const pool = new pg.Pool({
  connectionString: connectionString,
  ssl: connectionString && (connectionString.includes('neon.tech') || connectionString.includes('supabase') || isProduction)
    ? { rejectUnauthorized: false }
    : false
});

let usePostgres = false;

// --- CONFIGURACIÓN DE EMULACIÓN JSON LOCAL ---
const DATA_DIR = path.join(__dirname, 'data');
const STOCK_FILE = path.join(DATA_DIR, 'stock.json');
const MENU_FILE = path.join(DATA_DIR, 'menu.json');
const SALES_FILE = path.join(DATA_DIR, 'sales.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// --- VALORES INICIALES DE SEMILLA ---
const INITIAL_STOCK = {
  bases: [
    { id: 'base_tradicional', name: 'Masa Tradicional', category: 'bases', stock: 120, minStock: 20, price: 450, unit: 'porciones' },
    { id: 'base_chocolate', name: 'Masa de Chocolate', category: 'bases', stock: 95, minStock: 20, price: 500, unit: 'porciones' },
    { id: 'base_red_velvet', name: 'Masa Red Velvet', category: 'bases', stock: 45, minStock: 15, price: 550, unit: 'porciones' }
  ],
  toppings: [
    { id: 'top_oreo', name: 'Galletitas Oreo', category: 'toppings', stock: 85, minStock: 15, price: 120, unit: 'porciones' },
    { id: 'top_kitkat', name: 'KitKat Troceado', category: 'toppings', stock: 60, minStock: 15, price: 160, unit: 'porciones' },
    { id: 'top_frutilla', name: 'Frutillas Frescas', category: 'toppings', stock: 8, minStock: 10, price: 180, unit: 'porciones' },
    { id: 'top_chips', name: 'Chips de Chocolate', category: 'toppings', stock: 150, minStock: 25, price: 90, unit: 'porciones' },
    { id: 'top_marshmallows', name: 'Marshmallows', category: 'toppings', stock: 75, minStock: 12, price: 100, unit: 'porciones' },
    { id: 'top_rocklets', name: 'Rocklets', category: 'toppings', stock: 90, minStock: 15, price: 110, unit: 'porciones' },
    { id: 'top_nuez', name: 'Nueces Picadas', category: 'toppings', stock: 40, minStock: 10, price: 140, unit: 'porciones' }
  ],
  syrups: [
    { id: 'syr_chocolate', name: 'Salsa de Chocolate', category: 'syrups', stock: 150, minStock: 30, price: 80, unit: 'porciones' },
    { id: 'syr_dulce_leche', name: 'Dulce de Leche', category: 'syrups', stock: 180, minStock: 40, price: 90, unit: 'porciones' },
    { id: 'syr_caramelo', name: 'Salsa de Caramelo', category: 'syrups', stock: 95, minStock: 20, price: 80, unit: 'porciones' }
  ],
  drinks: [
    { id: 'drink_agua', name: 'Agua Mineral (500ml)', category: 'drinks', stock: 45, minStock: 10, price: 250, unit: 'unidades' },
    { id: 'drink_cola', name: 'Gaseosa Cola (Lata)', category: 'drinks', stock: 50, minStock: 12, price: 300, unit: 'unidades' },
    { id: 'drink_jugo', name: 'Jugo Naranja (Exprimido)', category: 'drinks', stock: 18, minStock: 8, price: 380, unit: 'unidades' }
  ],
  icecreams: [
    { id: 'ice_vainilla', name: 'Helado de Vainilla', category: 'icecreams', stock: 60, minStock: 10, price: 150, unit: 'bochas' },
    { id: 'ice_chocolate', name: 'Helado de Chocolate', category: 'icecreams', stock: 50, minStock: 10, price: 150, unit: 'bochas' },
    { id: 'ice_dulce_leche', name: 'Helado de Dulce de Leche', category: 'icecreams', stock: 80, minStock: 15, price: 150, unit: 'bochas' }
  ]
};

const INITIAL_MENU = [
  {
    id: 'menu_choco_loco',
    name: 'Chocolate Loco',
    description: 'Waffle con masa de chocolate, cubierto con salsa de chocolate, trozos de KitKat y chips de chocolate blanco y negro.',
    price: 850,
    base: 'base_chocolate',
    toppings: ['top_kitkat', 'top_chips'],
    syrups: ['syr_chocolate'],
    icecreams: [],
    image: 'ima_loc533.jpeg'
  },
  {
    id: 'menu_patagonia_frutilla',
    name: 'Bosque Patagónico',
    description: 'Masa tradicional dorada, coronada con frutillas frescas de estación, crema batida y abundante salsa de dulce de leche.',
    price: 900,
    base: 'base_tradicional',
    toppings: ['top_frutilla'],
    syrups: ['syr_dulce_leche'],
    icecreams: [],
    image: 'ima_loc532.jpeg'
  },
  {
    id: 'menu_tentacion_oreo',
    name: 'Tentación Oreo',
    description: 'Waffle tradicional con galletitas Oreo trituradas, chips de chocolate, bañado en dulce de leche y salsa de chocolate.',
    price: 880,
    base: 'base_tradicional',
    toppings: ['top_oreo', 'top_chips'],
    syrups: ['syr_dulce_leche', 'syr_chocolate'],
    icecreams: [],
    image: 'ima_loc534.jpeg'
  }
];

const INITIAL_SETTINGS = {
  adminPassword: 'admin',
  cashierPin: '1234'
};

const generateMockSales = () => {
  const sales = [];
  const paymentMethods = ['Efectivo', 'Tarjeta de Débito', 'Mercado Pago'];
  const now = new Date();
  
  for (let i = 18; i > 0; i--) {
    const saleDate = new Date(now.getTime() - i * 4 * 60 * 60 * 1000);
    const isCustom = Math.random() > 0.4;
    let items = [];
    let total = 0;
    
    if (isCustom) {
      const basePrice = 450 + (Math.random() > 0.5 ? 50 : 0);
      const topCount = Math.floor(Math.random() * 3) + 1;
      const topPrices = topCount * 120;
      const syrCount = Math.floor(Math.random() * 2) + 1;
      const syrPrices = syrCount * 80;
      
      total = basePrice + topPrices + syrPrices;
      items.push({
        name: 'Waffle Personalizado',
        details: `${topCount} Toppings, ${syrCount} Salsas`,
        price: total
      });
    } else {
      const menuItem = INITIAL_MENU[Math.floor(Math.random() * INITIAL_MENU.length)];
      total = menuItem.price;
      items.push({
        name: menuItem.name,
        details: 'Waffle del Menú',
        price: total
      });
    }
    
    if (Math.random() > 0.5) {
      const drink = INITIAL_STOCK.drinks[Math.floor(Math.random() * INITIAL_STOCK.drinks.length)];
      total += drink.price;
      items.push({
        name: drink.name,
        details: 'Bebida',
        price: drink.price
      });
    }
    
    sales.push({
      id: `sale_${1000 + i}`,
      date: saleDate.toISOString(),
      items: items,
      total: total,
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      status: 'completed'
    });
  }
  return sales;
};

// --- MÉTODOS AUXILIARES JSON ---
function readJSON(filePath) {
  if (!fs.existsSync(filePath)) {
    if (filePath === STOCK_FILE) return INITIAL_STOCK;
    if (filePath === MENU_FILE) return INITIAL_MENU;
    if (filePath === SALES_FILE) return generateMockSales();
    if (filePath === SETTINGS_FILE) return INITIAL_SETTINGS;
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    if (filePath === STOCK_FILE) return INITIAL_STOCK;
    if (filePath === MENU_FILE) return INITIAL_MENU;
    if (filePath === SALES_FILE) return [];
    if (filePath === SETTINGS_FILE) return INITIAL_SETTINGS;
  }
}

function writeJSON(filePath, content) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
  }
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
}

const initializeDataFiles = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
  }
  if (!fs.existsSync(STOCK_FILE)) writeJSON(STOCK_FILE, INITIAL_STOCK);
  if (!fs.existsSync(MENU_FILE)) writeJSON(MENU_FILE, INITIAL_MENU);
  if (!fs.existsSync(SALES_FILE)) writeJSON(SALES_FILE, generateMockSales());
  if (!fs.existsSync(SETTINGS_FILE)) writeJSON(SETTINGS_FILE, INITIAL_SETTINGS);
};

// --- INICIALIZACIÓN DE BASE DE DATOS ---
const initDb = async () => {
  if (!connectionString) {
    console.log('============================================================');
    console.log('⚠️  AVISO: DATABASE_URL no configurado.');
    console.log('    Iniciando la aplicación en modo de EMULACIÓN LOCAL');
    console.log('    utilizando archivos JSON locales en la carpeta /data.');
    console.log('============================================================');
    usePostgres = false;
    initializeDataFiles();
    return;
  }

  try {
    const client = await pool.connect();
    client.release();
    usePostgres = true;
    console.log('Conexión a PostgreSQL establecida con éxito.');
    await initPostgresTables();
  } catch (err) {
    console.log('============================================================');
    console.log('⚠️  AVISO: No se pudo conectar a la base de datos PostgreSQL.');
    console.log(`    Detalle: ${err.message}`);
    console.log('    Iniciando la aplicación en modo de EMULACIÓN LOCAL');
    console.log('    utilizando archivos JSON locales en la carpeta /data.');
    console.log('============================================================');
    usePostgres = false;
    initializeDataFiles();
  }
};

const initPostgresTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        admin_password VARCHAR(255) NOT NULL,
        cashier_pin VARCHAR(4) NOT NULL
      )
    `);

    // stock
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        min_stock INTEGER NOT NULL DEFAULT 0,
        price INTEGER NOT NULL DEFAULT 0,
        unit VARCHAR(50) NOT NULL DEFAULT 'porciones'
      )
    `);

    // menu
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        base VARCHAR(100) REFERENCES stock(id) ON DELETE SET NULL,
        toppings VARCHAR(100)[] DEFAULT '{}',
        syrups VARCHAR(100)[] DEFAULT '{}',
        icecreams VARCHAR(100)[] DEFAULT '{}',
        image VARCHAR(255)
      )
    `);

    // sales
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id VARCHAR(100) PRIMARY KEY,
        date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        items JSONB NOT NULL,
        total INTEGER NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'completed'
      )
    `);

    // seeds
    const settingsCheck = await client.query('SELECT COUNT(*) FROM settings');
    if (parseInt(settingsCheck.rows[0].count) === 0) {
      await client.query('INSERT INTO settings (id, admin_password, cashier_pin) VALUES (1, $1, $2)', ['admin', '1234']);
    }

    const stockCheck = await client.query('SELECT COUNT(*) FROM stock');
    if (parseInt(stockCheck.rows[0].count) === 0) {
      const initialStock = [
        ['base_tradicional', 'Masa Tradicional', 'bases', 120, 20, 450, 'porciones'],
        ['base_chocolate', 'Masa de Chocolate', 'bases', 95, 20, 500, 'porciones'],
        ['base_red_velvet', 'Masa Red Velvet', 'bases', 45, 15, 550, 'porciones'],
        
        ['top_oreo', 'Galletitas Oreo', 'toppings', 85, 15, 120, 'porciones'],
        ['top_kitkat', 'KitKat Troceado', 'toppings', 60, 15, 160, 'porciones'],
        ['top_frutilla', 'Frutillas Frescas', 'toppings', 8, 10, 180, 'porciones'],
        ['top_chips', 'Chips de Chocolate', 'toppings', 150, 25, 90, 'porciones'],
        ['top_marshmallows', 'Marshmallows', 'toppings', 75, 12, 100, 'porciones'],
        ['top_rocklets', 'Rocklets', 'toppings', 90, 15, 110, 'porciones'],
        ['top_nuez', 'Nueces Picadas', 'toppings', 40, 10, 140, 'porciones'],
        
        ['syr_chocolate', 'Salsa de Chocolate', 'syrups', 150, 30, 80, 'porciones'],
        ['syr_dulce_leche', 'Dulce de Leche', 'syrups', 180, 40, 90, 'porciones'],
        ['syr_caramelo', 'Salsa de Caramelo', 'syrups', 95, 20, 80, 'porciones'],
        
        ['drink_agua', 'Agua Mineral (500ml)', 'drinks', 45, 10, 250, 'unidades'],
        ['drink_cola', 'Gaseosa Cola (Lata)', 'drinks', 50, 12, 300, 'unidades'],
        ['drink_jugo', 'Jugo Naranja (Exprimido)', 'drinks', 18, 8, 380, 'unidades'],
        
        ['ice_vainilla', 'Helado de Vainilla', 'icecreams', 60, 10, 150, 'bochas'],
        ['ice_chocolate', 'Helado de Chocolate', 'icecreams', 50, 10, 150, 'bochas'],
        ['ice_dulce_leche', 'Helado de Dulce de Leche', 'icecreams', 80, 15, 150, 'bochas']
      ];
      for (const item of initialStock) {
        await client.query('INSERT INTO stock (id, name, category, stock, min_stock, price, unit) VALUES ($1, $2, $3, $4, $5, $6, $7)', item);
      }
    }

    const menuCheck = await client.query('SELECT COUNT(*) FROM menu');
    if (parseInt(menuCheck.rows[0].count) === 0) {
      const initialMenu = [
        ['menu_choco_loco', 'Chocolate Loco', 'Waffle con masa de chocolate, cubierto con salsa de chocolate, trozos de KitKat y chips de chocolate blanco y negro.', 850, 'base_chocolate', ['top_kitkat', 'top_chips'], ['syr_chocolate'], [], 'ima_loc533.jpeg'],
        ['menu_patagonia_frutilla', 'Bosque Patagónico', 'Masa tradicional dorada, coronada con frutillas frescas de estación, crema batida y abundante salsa de dulce de leche.', 900, 'base_tradicional', ['top_frutilla'], ['syr_dulce_leche'], [], 'ima_loc532.jpeg'],
        ['menu_tentacion_oreo', 'Tentación Oreo', 'Waffle tradicional con galletitas Oreo trituradas, chips de chocolate, bañado en dulce de leche y salsa de chocolate.', 880, 'base_tradicional', ['top_oreo', 'top_chips'], ['syr_dulce_leche', 'syr_chocolate'], [], 'ima_loc534.jpeg']
      ];
      for (const item of initialMenu) {
        await client.query('INSERT INTO menu (id, name, description, price, base, toppings, syrups, icecreams, image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', item);
      }
    }

    await client.query('COMMIT');
    console.log('Tablas y datos iniciales de PostgreSQL listos.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al inicializar esquemas PostgreSQL:', error);
  } finally {
    client.release();
  }
};

// --- MÉTODOS DE CONSULTA ADAPTATIVOS ---

const getSettings = async () => {
  if (usePostgres) {
    const res = await pool.query('SELECT admin_password AS "adminPassword", cashier_pin AS "cashierPin" FROM settings LIMIT 1');
    return res.rows[0];
  } else {
    const settings = readJSON(SETTINGS_FILE);
    return { adminPassword: settings.adminPassword, cashierPin: settings.cashierPin };
  }
};

const updateSettings = async (newAdminPassword, newCashierPin) => {
  if (usePostgres) {
    if (newAdminPassword && newCashierPin) {
      await pool.query('UPDATE settings SET admin_password = $1, cashier_pin = $2 WHERE id = 1', [newAdminPassword, newCashierPin]);
    } else if (newAdminPassword) {
      await pool.query('UPDATE settings SET admin_password = $1 WHERE id = 1', [newAdminPassword]);
    } else if (newCashierPin) {
      await pool.query('UPDATE settings SET cashier_pin = $1 WHERE id = 1', [newCashierPin]);
    }
  } else {
    const settings = readJSON(SETTINGS_FILE);
    if (newAdminPassword) settings.adminPassword = newAdminPassword;
    if (newCashierPin) settings.cashierPin = newCashierPin;
    writeJSON(SETTINGS_FILE, settings);
  }
};

const getStock = async () => {
  if (usePostgres) {
    const res = await pool.query('SELECT * FROM stock');
    const stock = { bases: [], toppings: [], syrups: [], drinks: [], icecreams: [] };
    res.rows.forEach(row => {
      const cat = row.category;
      if (stock[cat]) {
        stock[cat].push({
          id: row.id,
          name: row.name,
          category: row.category,
          stock: row.stock,
          minStock: row.min_stock,
          price: row.price,
          unit: row.unit
        });
      }
    });
    return stock;
  } else {
    return readJSON(STOCK_FILE);
  }
};

const createStockItem = async (item) => {
  if (usePostgres) {
    const { id, name, category, stock, minStock, price, unit } = item;
    await pool.query(
      'INSERT INTO stock (id, name, category, stock, min_stock, price, unit) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, name, category, stock, minStock, price, unit]
    );
  } else {
    const stock = readJSON(STOCK_FILE);
    if (!stock[item.category]) stock[item.category] = [];
    stock[item.category].push(item);
    writeJSON(STOCK_FILE, stock);
  }
  return item;
};

const updateStockItem = async (id, item) => {
  if (usePostgres) {
    const { name, category, stock, minStock, price, unit } = item;
    await pool.query(
      'UPDATE stock SET name = $1, category = $2, stock = $3, min_stock = $4, price = $5, unit = $6 WHERE id = $7',
      [name, category, stock, minStock, price, unit, id]
    );
  } else {
    const stock = readJSON(STOCK_FILE);
    for (const cat in stock) {
      const idx = stock[cat].findIndex(i => i.id === id);
      if (idx !== -1) {
        if (item.category !== cat) {
          stock[cat].splice(idx, 1);
          if (!stock[item.category]) stock[item.category] = [];
          stock[item.category].push({ id, ...item });
        } else {
          stock[cat][idx] = { id, ...item };
        }
        break;
      }
    }
    writeJSON(STOCK_FILE, stock);
  }
  return { id, ...item };
};

const deleteStockItem = async (id) => {
  if (usePostgres) {
    await pool.query('DELETE FROM stock WHERE id = $1', [id]);
  } else {
    const stock = readJSON(STOCK_FILE);
    for (const cat in stock) {
      const idx = stock[cat].findIndex(i => i.id === id);
      if (idx !== -1) {
        stock[cat].splice(idx, 1);
        break;
      }
    }
    writeJSON(STOCK_FILE, stock);
  }
};

const updateStockItemFields = async (id, fields) => {
  if (usePostgres) {
    const { price, minStock, stockToAdd } = fields;
    if (price !== undefined && minStock !== undefined) {
      await pool.query('UPDATE stock SET price = $1, min_stock = $2 WHERE id = $3', [price, minStock, id]);
    } else if (price !== undefined) {
      await pool.query('UPDATE stock SET price = $1 WHERE id = $2', [price, id]);
    } else if (minStock !== undefined) {
      await pool.query('UPDATE stock SET min_stock = $1 WHERE id = $2', [minStock, id]);
    }
    if (stockToAdd !== undefined) {
      await pool.query('UPDATE stock SET stock = stock + $1 WHERE id = $2', [stockToAdd, id]);
    }
    const res = await pool.query('SELECT * FROM stock WHERE id = $1', [id]);
    const row = res.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      stock: row.stock,
      minStock: row.min_stock,
      price: row.price,
      unit: row.unit
    };
  } else {
    const stock = readJSON(STOCK_FILE);
    let foundItem = null;
    for (const cat in stock) {
      const item = stock[cat].find(i => i.id === id);
      if (item) {
        if (fields.price !== undefined) item.price = fields.price;
        if (fields.minStock !== undefined) item.minStock = fields.minStock;
        if (fields.stockToAdd !== undefined) item.stock += fields.stockToAdd;
        foundItem = item;
        break;
      }
    }
    if (foundItem) {
      writeJSON(STOCK_FILE, stock);
    }
    return foundItem;
  }
};

const getMenu = async () => {
  if (usePostgres) {
    const res = await pool.query('SELECT * FROM menu');
    return res.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      base: row.base,
      toppings: row.toppings || [],
      syrups: row.syrups || [],
      icecreams: row.icecreams || [],
      image: row.image
    }));
  } else {
    return readJSON(MENU_FILE);
  }
};

const createMenuItem = async (item) => {
  if (usePostgres) {
    const { id, name, description, price, base, toppings, syrups, icecreams, image } = item;
    await pool.query(
      'INSERT INTO menu (id, name, description, price, base, toppings, syrups, icecreams, image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [id, name, description, price, base, toppings || [], syrups || [], icecreams || [], image || '']
    );
  } else {
    const menu = readJSON(MENU_FILE);
    menu.push(item);
    writeJSON(MENU_FILE, menu);
  }
  return item;
};

const updateMenuItem = async (id, item) => {
  if (usePostgres) {
    const { name, description, price, base, toppings, syrups, icecreams, image } = item;
    await pool.query(
      'UPDATE menu SET name = $1, description = $2, price = $3, base = $4, toppings = $5, syrups = $6, icecreams = $7, image = $8 WHERE id = $9',
      [name, description, price, base, toppings || [], syrups || [], icecreams || [], image || '', id]
    );
  } else {
    const menu = readJSON(MENU_FILE);
    const idx = menu.findIndex(m => m.id === id);
    if (idx !== -1) {
      menu[idx] = { id, ...item };
      writeJSON(MENU_FILE, menu);
    }
  }
  return { id, ...item };
};

const deleteMenuItem = async (id) => {
  if (usePostgres) {
    await pool.query('DELETE FROM menu WHERE id = $1', [id]);
  } else {
    let menu = readJSON(MENU_FILE);
    menu = menu.filter(m => m.id !== id);
    writeJSON(MENU_FILE, menu);
  }
};

const getSales = async () => {
  if (usePostgres) {
    const res = await pool.query('SELECT * FROM sales ORDER BY date DESC');
    return res.rows.map(row => ({
      id: row.id,
      date: row.date.toISOString(),
      items: row.items,
      total: row.total,
      paymentMethod: row.payment_method,
      status: row.status
    }));
  } else {
    return readJSON(SALES_FILE);
  }
};

const getSaleById = async (saleId) => {
  if (usePostgres) {
    const res = await pool.query('SELECT * FROM sales WHERE id = $1', [saleId]);
    const row = res.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      date: row.date.toISOString(),
      items: row.items,
      total: row.total,
      paymentMethod: row.payment_method,
      status: row.status
    };
  } else {
    const sales = readJSON(SALES_FILE);
    return sales.find(s => s.id === saleId) || null;
  }
};

const executeSale = async (sale, deductions) => {
  if (usePostgres) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const itemId in deductions) {
        const reqQty = deductions[itemId];
        const res = await client.query('SELECT name, stock FROM stock WHERE id = $1 FOR UPDATE', [itemId]);
        const row = res.rows[0];
        if (!row) throw new Error(`Insumo no encontrado: ${itemId}`);
        if (row.stock < reqQty) throw new Error(`Stock insuficiente para: ${row.name} (Requerido: ${reqQty}, Disponible: ${row.stock})`);
        await client.query('UPDATE stock SET stock = stock - $1 WHERE id = $2', [reqQty, itemId]);
      }
      await client.query(
        'INSERT INTO sales (id, items, total, payment_method, status) VALUES ($1, $2, $3, $4, $5)',
        [sale.id, JSON.stringify(sale.items), sale.total, sale.paymentMethod, 'completed']
      );
      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } else {
    const stock = readJSON(STOCK_FILE);
    const sales = readJSON(SALES_FILE);

    const getLocalStockItem = (id) => {
      for (const cat in stock) {
        const item = stock[cat].find(i => i.id === id);
        if (item) return item;
      }
      return null;
    };

    for (const itemId in deductions) {
      const item = getLocalStockItem(itemId);
      const reqQty = deductions[itemId];
      if (!item || item.stock < reqQty) {
        throw new Error(`Stock insuficiente para: ${item ? item.name : itemId} (Requerido: ${reqQty}, Disponible: ${item ? item.stock : 0})`);
      }
    }

    for (const itemId in deductions) {
      const item = getLocalStockItem(itemId);
      item.stock -= deductions[itemId];
    }

    sales.unshift(sale);
    writeJSON(STOCK_FILE, stock);
    writeJSON(SALES_FILE, sales);
    return { success: true };
  }
};

const executeRefund = async (saleId, menu) => {
  if (usePostgres) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const saleRes = await client.query('SELECT status, items FROM sales WHERE id = $1 FOR UPDATE', [saleId]);
      const sale = saleRes.rows[0];
      if (!sale) throw new Error('Transacción no encontrada');
      if (sale.status === 'refunded') throw new Error('La venta ya fue reembolsada previamente');
      
      const stockRes = await client.query('SELECT id, name, category FROM stock');
      const flatStock = stockRes.rows;
      
      for (const soldItem of sale.items) {
        const drink = flatStock.find(d => d.category === 'drinks' && d.name === soldItem.name);
        if (drink) {
          await client.query('UPDATE stock SET stock = stock + 1 WHERE id = $1', [drink.id]);
        } else if (soldItem.name === 'Waffle Personalizado' || soldItem.name === 'Waffle Customizado') {
          await client.query('UPDATE stock SET stock = stock + 1 WHERE id = \'base_tradicional\'');
          if (soldItem.details) {
            const toppings = flatStock.filter(t => t.category === 'toppings');
            for (const top of toppings) {
              if (soldItem.details.includes(top.name)) {
                await client.query('UPDATE stock SET stock = stock + 1 WHERE id = $1', [top.id]);
              }
            }
            const syrups = flatStock.filter(s => s.category === 'syrups');
            for (const syr of syrups) {
              if (soldItem.details.includes(syr.name)) {
                await client.query('UPDATE stock SET stock = stock + 1 WHERE id = $1', [syr.id]);
              }
            }
            const icecreams = flatStock.filter(i => i.category === 'icecreams');
            for (const ice of icecreams) {
              const regex = new RegExp(ice.name, 'g');
              const count = (soldItem.details.match(regex) || []).length;
              if (count > 0) {
                await client.query('UPDATE stock SET stock = stock + $1 WHERE id = $2', [count, ice.id]);
              }
            }
          }
        } else {
          const menuItem = menu.find(m => m.name === soldItem.name);
          if (menuItem) {
            if (menuItem.base) await client.query('UPDATE stock SET stock = stock + 1 WHERE id = $1', [menuItem.base]);
            if (menuItem.toppings) {
              for (const tId of menuItem.toppings) {
                await client.query('UPDATE stock SET stock = stock + 1 WHERE id = $1', [tId]);
              }
            }
            if (menuItem.syrups) {
              for (const sId of menuItem.syrups) {
                await client.query('UPDATE stock SET stock = stock + 1 WHERE id = $1', [sId]);
              }
            }
            if (menuItem.icecreams) {
              for (const iId of menuItem.icecreams) {
                await client.query('UPDATE stock SET stock = stock + 1 WHERE id = $1', [iId]);
              }
            }
          }
        }
      }
      await client.query('UPDATE sales SET status = \'refunded\' WHERE id = $1', [saleId]);
      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } else {
    const stock = readJSON(STOCK_FILE);
    const sales = readJSON(SALES_FILE);
    
    const saleIndex = sales.findIndex(s => s.id === saleId);
    if (saleIndex === -1) throw new Error('Transacción no encontrada');
    
    const sale = sales[saleIndex];
    if (sale.status === 'refunded') throw new Error('La venta ya fue reembolsada previamente');

    const getLocalStockItem = (id) => {
      for (const cat in stock) {
        const item = stock[cat].find(i => i.id === id);
        if (item) return item;
      }
      return null;
    };

    sale.items.forEach(soldItem => {
      const drink = stock.drinks.find(d => d.name === soldItem.name);
      if (drink) {
        drink.stock += 1;
      } else if (soldItem.name === 'Waffle Personalizado' || soldItem.name === 'Waffle Customizado') {
        const base = stock.bases.find(b => b.id === 'base_tradicional');
        if (base) base.stock += 1;
        
        if (soldItem.details) {
          stock.toppings.forEach(top => {
            if (soldItem.details.includes(top.name)) top.stock += 1;
          });
          stock.syrups.forEach(syr => {
            if (soldItem.details.includes(syr.name)) syr.stock += 1;
          });
          if (stock.icecreams) {
            stock.icecreams.forEach(ice => {
              const regex = new RegExp(ice.name, 'g');
              const count = (soldItem.details.match(regex) || []).length;
              if (count > 0) ice.stock += count;
            });
          }
        }
      } else {
        const menuItem = menu.find(m => m.name === soldItem.name);
        if (menuItem) {
          const baseItem = getLocalStockItem(menuItem.base);
          if (baseItem) baseItem.stock += 1;
          if (menuItem.toppings) {
            menuItem.toppings.forEach(tId => {
              const top = getLocalStockItem(tId);
              if (top) top.stock += 1;
            });
          }
          if (menuItem.syrups) {
            menuItem.syrups.forEach(sId => {
              const syr = getLocalStockItem(sId);
              if (syr) syr.stock += 1;
            });
          }
          if (menuItem.icecreams) {
            menuItem.icecreams.forEach(iId => {
              const ice = getLocalStockItem(iId);
              if (ice) ice.stock += 1;
            });
          }
        }
      }
    });

    sale.status = 'refunded';
    writeJSON(STOCK_FILE, stock);
    writeJSON(SALES_FILE, sales);
    return { success: true };
  }
};

module.exports = {
  pool,
  initDb,
  getSettings,
  updateSettings,
  getStock,
  createStockItem,
  updateStockItem,
  deleteStockItem,
  updateStockItemFields,
  getMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getSales,
  getSaleById,
  executeSale,
  executeRefund
};
