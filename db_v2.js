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
pool.connect()
  .then(client => {
    usePostgres = true;
    console.log('PostgreSQL Connected for v2 strict relational model.');
    client.release();
    initDB();
  })
  .catch(err => {
    console.log('PostgreSQL no disponible. Se usará emulación JSON para el modelo relacional.');
    initJSON();
  });

const DATA_DIR = path.join(__dirname, 'data');
const STOCK_FILE = path.join(DATA_DIR, 'stock.json');
const MASAS_FILE = path.join(DATA_DIR, 'masas.json');
const WAFFLES_FILE = path.join(DATA_DIR, 'waffles.json');
const SALES_FILE = path.join(DATA_DIR, 'sales.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const LOYALTY_CUSTOMERS_FILE = path.join(DATA_DIR, 'loyalty_customers.json');
const EMPLOYEES_FILE = path.join(DATA_DIR, 'employees.json');

const INITIAL_STOCK = [
  { id: 'stk_harina', name: 'Harina Trigo 0000', category: 'raw_material', stock: 10000, minStock: 2000, unit: 'g', cost: 1.5, portion_size: 0, price_per_portion: 0 },
  { id: 'stk_huevo', name: 'Huevos', category: 'raw_material', stock: 120, minStock: 30, unit: 'unidades', cost: 150, portion_size: 0, price_per_portion: 0 },
  { id: 'stk_leche', name: 'Leche Entera', category: 'raw_material', stock: 5000, minStock: 1000, unit: 'ml', cost: 1.2, portion_size: 0, price_per_portion: 0 },
  { id: 'stk_oreo', name: 'Galletitas Oreo', category: 'topping', stock: 2000, minStock: 500, unit: 'g', cost: 8, portion_size: 30, price_per_portion: 120 },
  { id: 'stk_frutilla', name: 'Frutillas Frescas', category: 'topping', stock: 1500, minStock: 300, unit: 'g', cost: 5, portion_size: 40, price_per_portion: 180 },
  { id: 'stk_syr_chocolate', name: 'Salsa de Chocolate', category: 'syrup', stock: 3000, minStock: 500, unit: 'ml', cost: 4, portion_size: 20, price_per_portion: 80 },
  { id: 'stk_coca', name: 'Coca Cola Lata', category: 'drink', stock: 50, minStock: 12, unit: 'unidades', cost: 500, portion_size: 1, price_per_portion: 1000 }
];

const INITIAL_MASAS = [
  { 
    id: 'masa_tradicional', 
    name: 'Masa Tradicional', 
    stock: 120, 
    minStock: 20, 
    yield_qty: 20, 
    cost_per_portion: 450,
    ingredients: [
      { stock_id: 'stk_harina', qty: 1000 },
      { stock_id: 'stk_huevo', qty: 5 },
      { stock_id: 'stk_leche', qty: 500 }
    ]
  }
];

const INITIAL_WAFFLES = [
  {
    id: 'waf_tentacion_oreo',
    name: 'Tentación Oreo',
    description: 'Waffle tradicional con Oreo y salsa chocolate',
    price: 880,
    cost: 500,
    is_visible: true,
    image: 'ima_loc534.jpeg',
    ingredients: [
      { type: 'masa', id: 'masa_tradicional', qty: 1 },
      { type: 'stock', id: 'stk_oreo', qty: 30 },
      { type: 'stock', id: 'stk_syr_chocolate', qty: 20 }
    ]
  }
];

const INITIAL_SETTINGS = { adminPassword: 'admin', currency: 'ARS', ticketFooter: '¡Gracias por su compra!' };

function readJSON(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch(e) { return fallback; }
}

function writeJSON(filePath, data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

const initJSON = () => {
  if (!fs.existsSync(STOCK_FILE)) writeJSON(STOCK_FILE, INITIAL_STOCK);
  if (!fs.existsSync(MASAS_FILE)) writeJSON(MASAS_FILE, INITIAL_MASAS);
  if (!fs.existsSync(WAFFLES_FILE)) writeJSON(WAFFLES_FILE, INITIAL_WAFFLES);
  if (!fs.existsSync(SETTINGS_FILE)) writeJSON(SETTINGS_FILE, INITIAL_SETTINGS);
  if (!fs.existsSync(SALES_FILE)) writeJSON(SALES_FILE, []);
};
