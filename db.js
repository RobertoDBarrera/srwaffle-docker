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
const LOYALTY_CUSTOMERS_FILE = path.join(DATA_DIR, 'loyalty_customers.json');
const EMPLOYEES_FILE = path.join(DATA_DIR, 'employees.json');

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
    { id: 'top_nuez', name: 'Nueces Picadas', category: 'toppings', stock: 40, minStock: 10, price: 140, unit: 'porciones' },
    { id: 'top_crema_batida', name: 'Crema Batida', category: 'toppings', stock: 80, minStock: 10, price: 120, unit: 'porciones' }
  ],
  syrups: [
    { id: 'syr_chocolate', name: 'Salsa de Chocolate', category: 'syrups', stock: 150, minStock: 30, price: 80, unit: 'porciones' },
    { id: 'syr_dulce_leche', name: 'Dulce de Leche', category: 'syrups', stock: 180, minStock: 40, price: 90, unit: 'porciones' },
    { id: 'syr_caramelo', name: 'Salsa de Caramelo', category: 'syrups', stock: 95, minStock: 20, price: 80, unit: 'porciones' },
    { id: 'syr_nutella', name: 'Nutella', category: 'syrups', stock: 100, minStock: 15, price: 150, unit: 'porciones' },
    { id: 'syr_dulce_leche_spread', name: 'Dulce de Leche (Relleno)', category: 'syrups', stock: 120, minStock: 20, price: 100, unit: 'porciones' }
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
  cashierPin: '1234',
  developerMode: false,
  themeColors: {},
  companyName: 'Sr. Waffle',
  companyAddress: 'Shopping Portal Patagonia, Bariloche, Río Negro (Kiosco PB)',
  companyHours: 'Lunes a Domingos: 10:00 hs a 22:00 hs',
  companyInstagram: '@srwaffle.patagonia',
  companyPhone: '5491123456789',
  whatsappOrdersEnabled: true,
  customPresets: [],
  heroImages: ['suit_1786.jpg'],
  heroCarouselEnabled: false,
  mapBgImage: '',
  mapPinX: 50,
  mapPinY: 50
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
      status: 'completed',
      cashierName: 'Administrador'
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
    if (filePath === LOYALTY_CUSTOMERS_FILE) return [];
    if (filePath === EMPLOYEES_FILE) return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    if (filePath === STOCK_FILE) return INITIAL_STOCK;
    if (filePath === MENU_FILE) return INITIAL_MENU;
    if (filePath === SALES_FILE) return [];
    if (filePath === SETTINGS_FILE) return INITIAL_SETTINGS;
    if (filePath === LOYALTY_CUSTOMERS_FILE) return [];
    if (filePath === EMPLOYEES_FILE) return [];
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
  if (!fs.existsSync(STOCK_FILE)) {
    writeJSON(STOCK_FILE, INITIAL_STOCK);
  } else {
    // Autocompletar insumos especiales si el archivo ya existe localmente
    const stock = readJSON(STOCK_FILE);
    let updated = false;
    const ensureItem = (cat, newItem) => {
      if (!stock[cat]) stock[cat] = [];
      if (!stock[cat].some(i => i.id === newItem.id)) {
        stock[cat].push(newItem);
        updated = true;
      }
    };
    ensureItem('syrups', { id: 'syr_nutella', name: 'Nutella', category: 'syrups', stock: 100, minStock: 15, price: 150, unit: 'porciones' });
    ensureItem('syrups', { id: 'syr_dulce_leche_spread', name: 'Dulce de Leche (Relleno)', category: 'syrups', stock: 120, minStock: 20, price: 100, unit: 'porciones' });
    ensureItem('toppings', { id: 'top_crema_batida', name: 'Crema Batida', category: 'toppings', stock: 80, minStock: 10, price: 120, unit: 'porciones' });
    if (updated) {
      writeJSON(STOCK_FILE, stock);
      console.log('Insumos de armado autocompletados en stock.json local.');
    }
  }
  if (!fs.existsSync(MENU_FILE)) writeJSON(MENU_FILE, INITIAL_MENU);
  if (!fs.existsSync(SALES_FILE)) writeJSON(SALES_FILE, generateMockSales());
  if (!fs.existsSync(SETTINGS_FILE)) writeJSON(SETTINGS_FILE, INITIAL_SETTINGS);
  if (!fs.existsSync(LOYALTY_CUSTOMERS_FILE)) writeJSON(LOYALTY_CUSTOMERS_FILE, []);
  if (!fs.existsSync(EMPLOYEES_FILE)) writeJSON(EMPLOYEES_FILE, []);
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
    await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS developer_mode BOOLEAN DEFAULT FALSE;');
    await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS theme_colors TEXT DEFAULT \'{}\';');
    await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_name VARCHAR(255) DEFAULT \'Sr. Waffle\';');
    await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_address VARCHAR(255) DEFAULT \'Shopping Portal Patagonia, Bariloche, Río Negro (Kiosco PB)\';');
    await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_hours VARCHAR(255) DEFAULT \'Lunes a Domingos: 10:00 hs a 22:00 hs\';');
    await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_instagram VARCHAR(255) DEFAULT \'@srwaffle.patagonia\';');
    await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_phone VARCHAR(255) DEFAULT \'5491123456789\';');
    await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_logo TEXT DEFAULT \'\';');
    await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS kds_alert_time INTEGER DEFAULT 10;');
    await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS whatsapp_orders_enabled BOOLEAN DEFAULT TRUE;');
    await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS loyalty_enabled BOOLEAN DEFAULT FALSE;');
    await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS loyalty_points_threshold INTEGER DEFAULT 100;');
    await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS custom_presets TEXT DEFAULT \'[]\';');
    await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS hero_images TEXT DEFAULT \'{}\';');
    await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS hero_carousel_enabled BOOLEAN DEFAULT FALSE;');
    await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS map_bg_image TEXT DEFAULT \'\';');
    await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS map_pin_x INTEGER DEFAULT 50;');
    await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS map_pin_y INTEGER DEFAULT 50;');

    // stock
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        min_stock INTEGER NOT NULL DEFAULT 0,
        price INTEGER NOT NULL DEFAULT 0,
        cost INTEGER NOT NULL DEFAULT 0,
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
    await client.query('ALTER TABLE sales ADD COLUMN IF NOT EXISTS cashier_name VARCHAR(255) DEFAULT \'Administrador\';');
    await client.query('ALTER TABLE sales ADD COLUMN IF NOT EXISTS kds_completed_at TIMESTAMPTZ;');

    // loyalty customers
    await client.query(`
      CREATE TABLE IF NOT EXISTS loyalty_customers (
        phone VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        points INTEGER NOT NULL DEFAULT 0
      )
    `);

    // employees
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        pin VARCHAR(4) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'cashier',
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
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
        ['syr_nutella', 'Nutella', 'syrups', 100, 15, 150, 'porciones'],
        ['syr_dulce_leche_spread', 'Dulce de Leche (Relleno)', 'syrups', 120, 20, 100, 'porciones'],
        ['top_crema_batida', 'Crema Batida', 'toppings', 80, 10, 120, 'porciones'],
        
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

    // Autosembrado de autocompletado para insumos nuevos en Postgres
    const newItems = [
      ['syr_nutella', 'Nutella', 'syrups', 100, 15, 150, 'porciones'],
      ['syr_dulce_leche_spread', 'Dulce de Leche (Relleno)', 'syrups', 120, 20, 100, 'porciones'],
      ['top_crema_batida', 'Crema Batida', 'toppings', 80, 10, 120, 'porciones']
    ];
    for (const item of newItems) {
      const check = await client.query('SELECT COUNT(*) FROM stock WHERE id = $1', [item[0]]);
      if (parseInt(check.rows[0].count) === 0) {
        await client.query('INSERT INTO stock (id, name, category, stock, min_stock, price, unit) VALUES ($1, $2, $3, $4, $5, $6, $7)', item);
        console.log(`Insumo especial Postgres autosembrado: ${item[1]}`);
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

const getDeveloperSettings = async () => {
  if (usePostgres) {
    const res = await pool.query('SELECT developer_mode AS "developerMode", theme_colors AS "themeColors", custom_presets AS "customPresets" FROM settings LIMIT 1');
    const row = res.rows[0] || { developerMode: false, themeColors: '{}', customPresets: '[]' };
    let themeColors = {};
    let customPresets = [];
    try {
      themeColors = typeof row.themeColors === 'string' ? JSON.parse(row.themeColors || '{}') : (row.themeColors || {});
    } catch (e) {
      console.error('Error parsing themeColors from database:', e);
    }
    try {
      customPresets = typeof row.customPresets === 'string' ? JSON.parse(row.customPresets || '[]') : (row.customPresets || []);
    } catch (e) {
      console.error('Error parsing customPresets from database:', e);
    }
    return {
      developerMode: !!row.developerMode,
      themeColors: themeColors,
      customPresets: customPresets
    };
  } else {
    const settings = readJSON(SETTINGS_FILE);
    return {
      developerMode: settings.developerMode !== undefined ? !!settings.developerMode : false,
      themeColors: settings.themeColors || {},
      customPresets: settings.customPresets || []
    };
  }
};

const updateDeveloperSettings = async (developerMode, themeColors) => {
  if (usePostgres) {
    const current = await getDeveloperSettings();
    const mode = developerMode !== undefined ? developerMode : current.developerMode;
    const colors = themeColors !== undefined ? JSON.stringify(themeColors) : JSON.stringify(current.themeColors);
    await pool.query('UPDATE settings SET developer_mode = $1, theme_colors = $2 WHERE id = 1', [mode, colors]);
  } else {
    const settings = readJSON(SETTINGS_FILE);
    if (developerMode !== undefined) settings.developerMode = developerMode;
    if (themeColors !== undefined) settings.themeColors = themeColors;
    writeJSON(SETTINGS_FILE, settings);
  }
};

const getCompanyInfo = async () => {
  if (usePostgres) {
    const res = await pool.query('SELECT company_name, company_address, company_hours, company_instagram, company_phone, whatsapp_orders_enabled, hero_images, hero_carousel_enabled, map_bg_image, map_pin_x, map_pin_y FROM settings LIMIT 1');
    const row = res.rows[0] || {};
    
    let parsedHeroImages = ['suit_1786.jpg'];
    if (row.hero_images) {
      try {
        parsedHeroImages = JSON.parse(row.hero_images);
      } catch (e) {
        console.error('Error parsing hero_images:', e);
      }
    }

    return {
      companyName: row.company_name || 'Sr. Waffle',
      companyAddress: row.company_address || 'Shopping Portal Patagonia, Bariloche, Río Negro (Kiosco PB)',
      companyHours: row.company_hours || 'Lunes a Domingos: 10:00 hs a 22:00 hs',
      companyInstagram: row.company_instagram || '@srwaffle.patagonia',
      companyPhone: row.company_phone || '5491123456789',
      whatsappOrdersEnabled: row.whatsapp_orders_enabled !== false,
      heroImages: parsedHeroImages,
      heroCarouselEnabled: !!row.hero_carousel_enabled,
      mapBgImage: row.map_bg_image || '',
      mapPinX: row.map_pin_x !== null && row.map_pin_x !== undefined ? row.map_pin_x : 50,
      mapPinY: row.map_pin_y !== null && row.map_pin_y !== undefined ? row.map_pin_y : 50,
      companyLogo: row.company_logo || '',
      kdsAlertTime: row.kds_alert_time !== null && row.kds_alert_time !== undefined ? row.kds_alert_time : 10
    };
  } else {
    const settings = readJSON(SETTINGS_FILE);
    return {
      companyName: settings.companyName || 'Sr. Waffle',
      companyAddress: settings.companyAddress || 'Shopping Portal Patagonia, Bariloche, Río Negro (Kiosco PB)',
      companyHours: settings.companyHours || 'Lunes a Domingos: 10:00 hs a 22:00 hs',
      companyInstagram: settings.companyInstagram || '@srwaffle.patagonia',
      companyPhone: settings.companyPhone || '5491123456789',
      whatsappOrdersEnabled: settings.whatsappOrdersEnabled !== false,
      heroImages: settings.heroImages || ['suit_1786.jpg'],
      heroCarouselEnabled: !!settings.heroCarouselEnabled,
      mapBgImage: settings.mapBgImage || '',
      mapPinX: settings.mapPinX !== undefined ? settings.mapPinX : 50,
      mapPinY: settings.mapPinY !== undefined ? settings.mapPinY : 50,
      companyLogo: settings.companyLogo || '',
      kdsAlertTime: settings.kdsAlertTime !== undefined ? settings.kdsAlertTime : 10
    };
  }
};

const updateCompanyInfo = async (info) => {
  const { companyName, companyAddress, companyHours, companyInstagram, companyPhone, whatsappOrdersEnabled, heroImages, heroCarouselEnabled, mapBgImage, mapPinX, mapPinY, companyLogo, kdsAlertTime } = info;
  
  if (usePostgres) {
    await pool.query(
      'UPDATE settings SET company_name = $1, company_address = $2, company_hours = $3, company_instagram = $4, company_phone = $5, whatsapp_orders_enabled = $6, hero_images = $7, hero_carousel_enabled = $8, map_bg_image = $9, map_pin_x = $10, map_pin_y = $11, company_logo = $12, kds_alert_time = $13 WHERE id = 1',
      [
        companyName, companyAddress, companyHours, companyInstagram, companyPhone, !!whatsappOrdersEnabled,
        heroImages ? JSON.stringify(heroImages) : '[]', !!heroCarouselEnabled, mapBgImage || '', 
        mapPinX !== undefined ? parseInt(mapPinX) : 50, mapPinY !== undefined ? parseInt(mapPinY) : 50,
        companyLogo || '',
        kdsAlertTime !== undefined ? parseInt(kdsAlertTime) : 10
      ]
    );
  } else {
    const settings = readJSON(SETTINGS_FILE);
    settings.companyName = companyName;
    settings.companyAddress = companyAddress;
    settings.companyHours = companyHours;
    settings.companyInstagram = companyInstagram;
    settings.companyPhone = companyPhone;
    settings.whatsappOrdersEnabled = !!whatsappOrdersEnabled;
    
    if (heroImages !== undefined) settings.heroImages = heroImages;
    if (heroCarouselEnabled !== undefined) settings.heroCarouselEnabled = !!heroCarouselEnabled;
    if (mapBgImage !== undefined) settings.mapBgImage = mapBgImage;
    if (mapPinX !== undefined) settings.mapPinX = parseInt(mapPinX);
    if (mapPinY !== undefined) settings.mapPinY = parseInt(mapPinY);
    if (companyLogo !== undefined) settings.companyLogo = companyLogo;
    if (kdsAlertTime !== undefined) settings.kdsAlertTime = parseInt(kdsAlertTime);
    
    writeJSON(SETTINGS_FILE, settings);
  }
};

const getCustomPresets = async () => {
  if (usePostgres) {
    const res = await pool.query('SELECT custom_presets AS "customPresets" FROM settings LIMIT 1');
    const row = res.rows[0] || { customPresets: '[]' };
    try {
      return typeof row.customPresets === 'string' ? JSON.parse(row.customPresets || '[]') : (row.customPresets || []);
    } catch (e) {
      console.error('Error parsing custom_presets:', e);
      return [];
    }
  } else {
    const settings = readJSON(SETTINGS_FILE);
    return settings.customPresets || [];
  }
};

const saveCustomPreset = async (preset) => {
  const presets = await getCustomPresets();
  const index = presets.findIndex(p => p.name === preset.name);
  const newPreset = {
    id: preset.id || `preset_${Date.now()}`,
    name: preset.name,
    colors: preset.colors
  };
  if (index !== -1) {
    presets[index] = newPreset;
  } else {
    presets.push(newPreset);
  }
  
  if (usePostgres) {
    await pool.query('UPDATE settings SET custom_presets = $1 WHERE id = 1', [JSON.stringify(presets)]);
  } else {
    const settings = readJSON(SETTINGS_FILE);
    settings.customPresets = presets;
    writeJSON(SETTINGS_FILE, settings);
  }
  return newPreset;
};

const deleteCustomPreset = async (id) => {
  let presets = await getCustomPresets();
  presets = presets.filter(p => p.id !== id);
  if (usePostgres) {
    await pool.query('UPDATE settings SET custom_presets = $1 WHERE id = 1', [JSON.stringify(presets)]);
  } else {
    const settings = readJSON(SETTINGS_FILE);
    settings.customPresets = presets;
    writeJSON(SETTINGS_FILE, settings);
  }
};

// --- CRUD EMPLEADOS ---

const getEmployees = async () => {
  if (usePostgres) {
    const res = await pool.query('SELECT * FROM employees ORDER BY created_at ASC');
    return res.rows;
  } else {
    return readJSON(EMPLOYEES_FILE);
  }
};

const createEmployee = async (employee) => {
  if (usePostgres) {
    await pool.query(
      'INSERT INTO employees (id, name, pin, role, active) VALUES ($1, $2, $3, $4, $5)',
      [employee.id, employee.name, employee.pin, employee.role || 'cashier', employee.active !== false]
    );
  } else {
    const employees = readJSON(EMPLOYEES_FILE);
    employees.push({
      ...employee,
      role: employee.role || 'cashier',
      active: employee.active !== false,
      created_at: new Date().toISOString()
    });
    writeJSON(EMPLOYEES_FILE, employees);
  }
};

const updateEmployee = async (id, data) => {
  if (usePostgres) {
    let query = 'UPDATE employees SET ';
    const params = [];
    let idx = 1;
    if (data.name !== undefined) {
      query += `name = $${idx}, `;
      params.push(data.name);
      idx++;
    }
    if (data.pin !== undefined) {
      query += `pin = $${idx}, `;
      params.push(data.pin);
      idx++;
    }
    if (data.active !== undefined) {
      query += `active = $${idx}, `;
      params.push(data.active);
      idx++;
    }
    if (data.role !== undefined) {
      query += `role = $${idx}, `;
      params.push(data.role);
      idx++;
    }
    query = query.slice(0, -2); // quitar última coma
    query += ` WHERE id = $${idx}`;
    params.push(id);
    await pool.query(query, params);
  } else {
    const employees = readJSON(EMPLOYEES_FILE);
    const index = employees.findIndex(e => e.id === id);
    if (index !== -1) {
      employees[index] = { ...employees[index], ...data };
      writeJSON(EMPLOYEES_FILE, employees);
    }
  }
};

const deleteEmployee = async (id) => {
  if (usePostgres) {
    await pool.query('DELETE FROM employees WHERE id = $1', [id]);
  } else {
    const employees = readJSON(EMPLOYEES_FILE);
    const filtered = employees.filter(e => e.id !== id);
    writeJSON(EMPLOYEES_FILE, filtered);
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
          cost: row.cost || 0,
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
    const { id, name, category, stock, minStock, price, cost, unit } = item;
    await pool.query(
      'INSERT INTO stock (id, name, category, stock, min_stock, price, cost, unit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [id, name, category, stock, minStock, price, cost || 0, unit]
    );
  } else {
    const stock = readJSON(STOCK_FILE);
    if (!stock[item.category]) stock[item.category] = [];
    stock[item.category].push({ cost: 0, ...item });
    writeJSON(STOCK_FILE, stock);
  }
  return item;
};

const updateStockItem = async (id, item) => {
  if (usePostgres) {
    const { name, category, stock, minStock, price, cost, unit } = item;
    await pool.query(
      'UPDATE stock SET name = $1, category = $2, stock = $3, min_stock = $4, price = $5, cost = $6, unit = $7 WHERE id = $8',
      [name, category, stock, minStock, price, cost || 0, unit, id]
    );
  } else {
    const stock = readJSON(STOCK_FILE);
    for (const cat in stock) {
      const idx = stock[cat].findIndex(i => i.id === id);
      if (idx !== -1) {
        if (item.category !== cat) {
          stock[cat].splice(idx, 1);
          if (!stock[item.category]) stock[item.category] = [];
          stock[item.category].push({ id, cost: 0, ...item });
        } else {
          stock[cat][idx] = { id, cost: 0, ...item };
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
    const { price, minStock, stockToAdd, cost } = fields;
    if (price !== undefined) {
      await pool.query('UPDATE stock SET price = $1 WHERE id = $2', [price, id]);
    }
    if (minStock !== undefined) {
      await pool.query('UPDATE stock SET min_stock = $1 WHERE id = $2', [minStock, id]);
    }
    if (cost !== undefined) {
      await pool.query('UPDATE stock SET cost = $1 WHERE id = $2', [cost, id]);
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
      cost: row.cost || 0,
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
        if (fields.cost !== undefined) item.cost = fields.cost;
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
      status: row.status,
      cashierName: row.cashier_name || 'Administrador',
      kdsCompletedAt: row.kds_completed_at ? row.kds_completed_at.toISOString() : null
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
      status: row.status,
      cashierName: row.cashier_name || 'Administrador'
    };
  } else {
    const sales = readJSON(SALES_FILE);
    return sales.find(s => s.id === saleId) || null;
  }
};

const createSale = async (sale) => {
  if (usePostgres) {
    await pool.query(
      'INSERT INTO sales (id, date, items, total, payment_method, status, cashier_name) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [sale.id, sale.date, JSON.stringify(sale.items), sale.total, sale.paymentMethod, sale.status || 'completed', sale.cashierName || 'Administrador']
    );
  } else {
    const sales = readJSON(SALES_FILE);
    sales.push({ ...sale, cashierName: sale.cashierName || 'Administrador', status: sale.status || 'completed' });
    writeJSON(SALES_FILE, sales);
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
        'INSERT INTO sales (id, date, items, total, payment_method, status, cashier_name) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [sale.id, sale.date, JSON.stringify(sale.items), sale.total, sale.paymentMethod, 'completed', sale.cashierName || 'Administrador']
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

    sales.unshift({ ...sale, cashierName: sale.cashierName || 'Administrador', status: 'completed', kdsStatus: 'pending' });
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

const getLoyaltySettings = async () => {
  if (usePostgres) {
    const res = await pool.query('SELECT loyalty_enabled AS "loyaltyEnabled", loyalty_points_threshold AS "loyaltyPointsThreshold" FROM settings LIMIT 1');
    const row = res.rows[0] || {};
    return {
      loyaltyEnabled: !!row.loyaltyEnabled,
      loyaltyPointsThreshold: row.loyaltyPointsThreshold || 100
    };
  } else {
    const settings = readJSON(SETTINGS_FILE);
    return {
      loyaltyEnabled: !!settings.loyaltyEnabled,
      loyaltyPointsThreshold: settings.loyaltyPointsThreshold || 100
    };
  }
};

const updateLoyaltySettings = async (enabled, threshold) => {
  if (usePostgres) {
    let query = 'UPDATE settings SET loyalty_enabled = $1';
    let params = [!!enabled];
    if (threshold !== undefined) {
      query += ', loyalty_points_threshold = $2';
      params.push(parseInt(threshold));
    }
    query += ' WHERE id = 1';
    await pool.query(query, params);
  } else {
    const settings = readJSON(SETTINGS_FILE);
    settings.loyaltyEnabled = !!enabled;
    if (threshold !== undefined) settings.loyaltyPointsThreshold = parseInt(threshold);
    writeJSON(SETTINGS_FILE, settings);
  }
};

const getLoyaltyCustomer = async (phone) => {
  if (usePostgres) {
    const res = await pool.query('SELECT phone, name, points FROM loyalty_customers WHERE phone = $1', [phone]);
    return res.rows[0] || null;
  } else {
    const customers = readJSON(LOYALTY_CUSTOMERS_FILE);
    return customers.find(c => c.phone === phone) || null;
  }
};

const updateLoyaltyPoints = async (phone, name, pointsToAdd) => {
  if (usePostgres) {
    const customer = await getLoyaltyCustomer(phone);
    if (customer) {
      const newPoints = customer.points + parseInt(pointsToAdd);
      await pool.query('UPDATE loyalty_customers SET name = $1, points = $2 WHERE phone = $3', [name, newPoints, phone]);
      return { phone, name, points: newPoints };
    } else {
      await pool.query('INSERT INTO loyalty_customers (phone, name, points) VALUES ($1, $2, $3)', [phone, name, parseInt(pointsToAdd)]);
      return { phone, name, points: parseInt(pointsToAdd) };
    }
  } else {
    const customers = readJSON(LOYALTY_CUSTOMERS_FILE);
    const customerIdx = customers.findIndex(c => c.phone === phone);
    if (customerIdx !== -1) {
      customers[customerIdx].name = name;
      customers[customerIdx].points += parseInt(pointsToAdd);
      writeJSON(LOYALTY_CUSTOMERS_FILE, customers);
      return customers[customerIdx];
    } else {
      const newCustomer = { phone, name, points: parseInt(pointsToAdd) };
      customers.push(newCustomer);
      writeJSON(LOYALTY_CUSTOMERS_FILE, customers);
      return newCustomer;
    }
  }
};

const getLoyaltyCustomers = async () => {
  if (usePostgres) {
    const res = await pool.query('SELECT phone, name, points FROM loyalty_customers ORDER BY points DESC');
    return res.rows;
  } else {
    const customers = readJSON(LOYALTY_CUSTOMERS_FILE);
    return customers.sort((a, b) => b.points - a.points);
  }
};

const updateSaleStatus = async (saleId, status) => {
  if (usePostgres) {
    await pool.query('UPDATE sales SET status = $1 WHERE id = $2', [status, saleId]);
  } else {
    const sales = readJSON(SALES_FILE);
    const saleIdx = sales.findIndex(s => s.id === saleId);
    if (saleIdx !== -1) {
      sales[saleIdx].status = status;
      writeJSON(SALES_FILE, sales);
    }
  }
  return { success: true };
};

const getKitchenTickets = async () => {
  if (usePostgres) {
    const res = await pool.query("SELECT * FROM sales WHERE kdsStatus IN ('pending', 'preparing', 'ready') ORDER BY created_at ASC");
    return res.rows;
  } else {
    const sales = readJSON(SALES_FILE);
    return sales.filter(s => s.kdsStatus === 'pending' || s.kdsStatus === 'preparing' || s.kdsStatus === 'ready').reverse(); // reverse for chronological if unshifted
  }
};

const updateKitchenTicketStatus = async (saleId, status) => {
  const isCompleted = status === 'ready' || status === 'delivered';
  
  if (usePostgres) {
    if (isCompleted) {
      await pool.query('UPDATE sales SET "kdsStatus" = $1, kds_completed_at = CURRENT_TIMESTAMP WHERE id = $2 AND kds_completed_at IS NULL', [status, saleId]);
      // If it was already completed (e.g., from ready to delivered), we just update the status so we don't overwrite the original ready time.
      await pool.query('UPDATE sales SET "kdsStatus" = $1 WHERE id = $2', [status, saleId]);
    } else {
      await pool.query('UPDATE sales SET "kdsStatus" = $1 WHERE id = $2', [status, saleId]);
    }
  } else {
    const sales = readJSON(SALES_FILE);
    const saleIdx = sales.findIndex(s => s.id === saleId);
    if (saleIdx !== -1) {
      sales[saleIdx].kdsStatus = status;
      if (isCompleted && !sales[saleIdx].kdsCompletedAt) {
        sales[saleIdx].kdsCompletedAt = new Date().toISOString();
      }
      writeJSON(SALES_FILE, sales);
    }
  }
  return { success: true };
};

// --- ORDER TRACKING ---
const getTicketStatus = async (ticketNum) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (usePostgres) {
    const res = await pool.query(
      "SELECT id, kds_status as \"kdsStatus\", items FROM sales WHERE date >= $1 AND id LIKE $2 ORDER BY date DESC LIMIT 1",
      [today, `%${ticketNum}`]
    );
    if (res.rows.length > 0) {
      return res.rows[0];
    }
    return null;
  } else {
    const sales = readJSON(SALES_FILE);
    const recentSale = sales.reverse().find(s => {
      const saleDate = new Date(s.date || s.created_at);
      return saleDate >= today && s.id.endsWith(ticketNum);
    });
    if (recentSale) {
      return {
        id: recentSale.id,
        kdsStatus: recentSale.kdsStatus || 'pending',
        items: recentSale.items
      };
    }
    return null;
  }
};

module.exports = {
  pool,
  initDb,
  getSettings,
  updateSettings,
  getDeveloperSettings,
  updateDeveloperSettings,
  getCompanyInfo,
  updateCompanyInfo,
  getCustomPresets,
  saveCustomPreset,
  deleteCustomPreset,
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
  createSale,
  executeSale,
  executeRefund,
  getLoyaltySettings,
  updateLoyaltySettings,
  getLoyaltyCustomer,
  updateLoyaltyPoints,
  getLoyaltyCustomers,
  updateSaleStatus,
  getKitchenTickets,
  updateKitchenTicketStatus,
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getTicketStatus
};
