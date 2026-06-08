const fs = require('fs');
const path = require('path');
const db = require('./db');

const DATA_DIR = path.join(__dirname, 'data');
const STOCK_FILE = path.join(DATA_DIR, 'stock.json');
const MENU_FILE = path.join(DATA_DIR, 'menu.json');
const SALES_FILE = path.join(DATA_DIR, 'sales.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const readJSON = (filePath) => {
  if (!fs.existsSync(filePath)) return null;
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
};

const runMigration = async () => {
  console.log('--- INICIANDO MIGRACIÓN DE JSON A POSTGRESQL ---');
  
  // 1. Asegurar que las tablas estén inicializadas
  console.log('Inicializando tablas...');
  await db.initDb();

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 2. Migrar Configuración de Seguridad
    const settings = readJSON(SETTINGS_FILE);
    if (settings) {
      console.log('Migrando configuración de seguridad (settings.json)...');
      await client.query(
        'INSERT INTO settings (id, admin_password, cashier_pin) VALUES (1, $1, $2) ON CONFLICT (id) DO UPDATE SET admin_password = EXCLUDED.admin_password, cashier_pin = EXCLUDED.cashier_pin',
        [settings.adminPassword, settings.cashierPin]
      );
    } else {
      console.log('No se encontró settings.json. Saltando migración de seguridad.');
    }

    // 3. Migrar Stock (Insumos)
    const stock = readJSON(STOCK_FILE);
    if (stock) {
      console.log('Migrando insumos del inventario (stock.json)...');
      let count = 0;
      for (const category in stock) {
        for (const item of stock[category]) {
          await client.query(
            `INSERT INTO stock (id, name, category, stock, min_stock, price, unit) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             ON CONFLICT (id) DO UPDATE SET 
               name = EXCLUDED.name, 
               category = EXCLUDED.category, 
               stock = EXCLUDED.stock, 
               min_stock = EXCLUDED.min_stock, 
               price = EXCLUDED.price, 
               unit = EXCLUDED.unit`,
            [item.id, item.name, item.category, item.stock, item.minStock, item.price, item.unit]
          );
          count++;
        }
      }
      console.log(`Migrados ${count} insumos con éxito.`);
    } else {
      console.log('No se encontró stock.json. Saltando migración de stock.');
    }

    // 4. Migrar Menú (Waffles de Carta)
    const menu = readJSON(MENU_FILE);
    if (menu) {
      console.log('Migrando waffles del menú (menu.json)...');
      let count = 0;
      for (const waffle of menu) {
        await client.query(
          `INSERT INTO menu (id, name, description, price, base, toppings, syrups, icecreams, image) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
           ON CONFLICT (id) DO UPDATE SET 
             name = EXCLUDED.name, 
             description = EXCLUDED.description, 
             price = EXCLUDED.price, 
             base = EXCLUDED.base, 
             toppings = EXCLUDED.toppings, 
             syrups = EXCLUDED.syrups, 
             icecreams = EXCLUDED.icecreams, 
             image = EXCLUDED.image`,
          [
            waffle.id,
            waffle.name,
            waffle.description,
            waffle.price,
            waffle.base,
            waffle.toppings || [],
            waffle.syrups || [],
            waffle.icecreams || [],
            waffle.image
          ]
        );
        count++;
      }
      console.log(`Migrados ${count} waffles de carta con éxito.`);
    } else {
      console.log('No se encontró menu.json. Saltando migración de menú.');
    }

    // 5. Migrar Ventas (Historial)
    const sales = readJSON(SALES_FILE);
    if (sales) {
      console.log('Migrando historial de ventas (sales.json)...');
      let count = 0;
      for (const sale of sales) {
        await client.query(
          `INSERT INTO sales (id, date, items, total, payment_method, status) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           ON CONFLICT (id) DO UPDATE SET 
             date = EXCLUDED.date, 
             items = EXCLUDED.items, 
             total = EXCLUDED.total, 
             payment_method = EXCLUDED.payment_method, 
             status = EXCLUDED.status`,
          [
            sale.id,
            sale.date,
            JSON.stringify(sale.items),
            sale.total,
            sale.paymentMethod,
            sale.status || 'completed'
          ]
        );
        count++;
      }
      console.log(`Migradas ${count} transacciones de venta con éxito.`);
    } else {
      console.log('No se encontró sales.json. Saltando migración de ventas.');
    }

    await client.query('COMMIT');
    console.log('\n¡MIGRACIÓN FINALIZADA CON ÉXITO!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error durante la migración:', error);
  } finally {
    client.release();
    db.pool.end();
  }
};

runMigration();
