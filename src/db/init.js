const { pool, isPostgres } = require('./pool');
const { readJSON, writeJSON } = require('./jsonUtils');
const seeds = require('./seeds');

const initPostgresTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // stock
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        min_stock INTEGER NOT NULL DEFAULT 0,
        unit VARCHAR(50) NOT NULL DEFAULT 'g',
        cost INTEGER NOT NULL DEFAULT 0,
        portion_size INTEGER NOT NULL DEFAULT 0,
        price_per_portion INTEGER NOT NULL DEFAULT 0
      )
    `);

    // masas
    await client.query(`
      CREATE TABLE IF NOT EXISTS masas (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        min_stock INTEGER NOT NULL DEFAULT 0,
        yield_qty INTEGER NOT NULL DEFAULT 1,
        cost_per_portion INTEGER NOT NULL DEFAULT 0,
        ingredients JSONB NOT NULL DEFAULT '[]'
      )
    `);

    // waffles
    await client.query(`
      CREATE TABLE IF NOT EXISTS waffles (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        cost INTEGER NOT NULL DEFAULT 0,
        image VARCHAR(255),
        ingredients JSONB NOT NULL DEFAULT '[]'
      )
    `);

    // menu
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu (
        id VARCHAR(100) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        reference_id VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        price INTEGER NOT NULL DEFAULT 0,
        is_visible BOOLEAN DEFAULT TRUE
      )
    `);

    // settings, sales, etc
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        admin_password VARCHAR(255) NOT NULL,
        cashier_pin VARCHAR(4) NOT NULL DEFAULT '1234',
        data JSONB DEFAULT '{}'
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id VARCHAR(100) PRIMARY KEY,
        date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        items JSONB NOT NULL,
        total INTEGER NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'completed',
        cashier_name VARCHAR(255) DEFAULT 'Administrador'
      )
    `);

    // SEEDS
    const checkStock = await client.query('SELECT COUNT(*) FROM stock');
    if (parseInt(checkStock.rows[0].count) === 0) {
      for (const item of seeds.INITIAL_STOCK) {
        await client.query(
          'INSERT INTO stock (id, name, category, stock, min_stock, unit, cost, portion_size, price_per_portion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [item.id, item.name, item.category, item.stock, item.minStock, item.unit, item.cost, item.portion_size, item.price_per_portion]
        );
      }
      for (const m of seeds.INITIAL_MASAS) {
        await client.query(
          'INSERT INTO masas (id, name, stock, min_stock, yield_qty, cost_per_portion, ingredients) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [m.id, m.name, m.stock, m.minStock, m.yield_qty, m.cost_per_portion, JSON.stringify(m.ingredients)]
        );
      }
      for (const w of seeds.INITIAL_WAFFLES) {
        await client.query(
          'INSERT INTO waffles (id, name, description, cost, image, ingredients) VALUES ($1, $2, $3, $4, $5, $6)',
          [w.id, w.name, w.description, w.cost, w.image, JSON.stringify(w.ingredients)]
        );
      }
      for (const m of seeds.INITIAL_MENU) {
        await client.query(
          'INSERT INTO menu (id, type, reference_id, name, price, is_visible) VALUES ($1, $2, $3, $4, $5, $6)',
          [m.id, m.type, m.reference_id, m.name, m.price, m.is_visible]
        );
      }
      await client.query('INSERT INTO settings (admin_password) VALUES ($1)', [seeds.INITIAL_SETTINGS.adminPassword]);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error initPostgresTables:', err);
  } finally {
    client.release();
  }
};

const initJSON = () => {
  if (!readJSON('stock.json', null)) writeJSON('stock.json', seeds.INITIAL_STOCK);
  if (!readJSON('masas.json', null)) writeJSON('masas.json', seeds.INITIAL_MASAS);
  if (!readJSON('waffles.json', null)) writeJSON('waffles.json', seeds.INITIAL_WAFFLES);
  if (!readJSON('menu.json', null)) writeJSON('menu.json', seeds.INITIAL_MENU);
  if (!readJSON('settings.json', null)) writeJSON('settings.json', seeds.INITIAL_SETTINGS);
  if (!readJSON('sales.json', null)) writeJSON('sales.json', []);
};

const initDB = async () => {
  if (isPostgres()) {
    await initPostgresTables();
  } else {
    initJSON();
  }
};

module.exports = { initDB };
