const { pool, isPostgres } = require('./pool');
const { readJSON, writeJSON } = require('./jsonUtils');
const seeds = require('./seeds');

const initPostgresTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // ERP Phase 1: Nuevas tablas de inventario avanzado
    await client.query(`
      CREATE TABLE IF NOT EXISTS units (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        base_unit_id VARCHAR(50),
        conversion_factor DECIMAL(18,6) NOT NULL DEFAULT 1
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS warehouses (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        base_unit_id VARCHAR(50) NOT NULL,
        min_stock DECIMAL(18,6) NOT NULL DEFAULT 0,
        cost_method VARCHAR(20) NOT NULL DEFAULT 'FIFO',
        portion_size DECIMAL(18,6) NOT NULL DEFAULT 0,
        price_per_portion DECIMAL(18,6) NOT NULL DEFAULT 0
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS product_presentations (
        id VARCHAR(100) PRIMARY KEY,
        product_id VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        quantity DECIMAL(18,6) NOT NULL,
        unit_id VARCHAR(50) NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_lots (
        id SERIAL PRIMARY KEY,
        product_id VARCHAR(100) NOT NULL,
        warehouse_id VARCHAR(50) NOT NULL,
        quantity_initial DECIMAL(18,6) NOT NULL,
        quantity_current DECIMAL(18,6) NOT NULL,
        unit_cost DECIMAL(18,6) NOT NULL,
        purchase_quantity DECIMAL(18,6) DEFAULT 0,
        purchase_unit VARCHAR(20),
        total_cost DECIMAL(18,6) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        product_id VARCHAR(100) NOT NULL,
        warehouse_id VARCHAR(50) NOT NULL,
        type VARCHAR(20) NOT NULL,
        reason VARCHAR(50) NOT NULL,
        quantity DECIMAL(18,6) NOT NULL,
        unit_cost DECIMAL(18,6) NOT NULL,
        lot_id INTEGER,
        reference_id VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
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
    const checkUnits = await client.query('SELECT COUNT(*) FROM units');
    if (parseInt(checkUnits.rows[0].count) === 0) {
      const basicUnits = [
        ['g', 'Gramos', 'mass', 'g', 1],
        ['kg', 'Kilogramos', 'mass', 'g', 1000],
        ['ml', 'Mililitros', 'volume', 'ml', 1],
        ['l', 'Litros', 'volume', 'ml', 1000],
        ['un', 'Unidades', 'item', 'un', 1]
      ];
      for (const u of basicUnits) {
        await client.query(
          'INSERT INTO units (id, name, type, base_unit_id, conversion_factor) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
          u
        );
      }
    }

    const checkWarehouses = await client.query('SELECT COUNT(*) FROM warehouses');
    if (parseInt(checkWarehouses.rows[0].count) === 0) {
      await client.query("INSERT INTO warehouses (id, name) VALUES ('dep_principal', 'Depósito Principal') ON CONFLICT (id) DO NOTHING");
    }

    const checkProducts = await client.query('SELECT COUNT(*) FROM products');
    if (parseInt(checkProducts.rows[0].count) === 0) {
      for (const item of seeds.INITIAL_STOCK) {
        await client.query(
          'INSERT INTO products (id, name, category, base_unit_id, min_stock, portion_size, price_per_portion) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING',
          [item.id, item.name, item.category, item.unit, item.minStock, item.portion_size, item.price_per_portion]
        );
        if (item.stock > 0) {
          const lotRes = await client.query(
            'INSERT INTO stock_lots (product_id, warehouse_id, quantity_initial, quantity_current, unit_cost, purchase_quantity, purchase_unit, total_cost) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
            [item.id, 'dep_principal', item.stock, item.stock, item.cost || 0, item.stock, item.unit, (item.stock * (item.cost || 0))]
          );
          await client.query(
            "INSERT INTO stock_movements (product_id, warehouse_id, type, reason, quantity, unit_cost, lot_id) VALUES ($1, $2, 'IN', 'INITIAL', $3, $4, $5)",
            [item.id, 'dep_principal', item.stock, item.cost || 0, lotRes.rows[0].id]
          );
        }
      }
      for (const m of seeds.INITIAL_MASAS) {
        await client.query(
          'INSERT INTO masas (id, name, stock, min_stock, yield_qty, cost_per_portion, ingredients) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING',
          [m.id, m.name, m.stock, m.minStock, m.yield_qty, m.cost_per_portion, JSON.stringify(m.ingredients)]
        );
      }
      for (const w of seeds.INITIAL_WAFFLES) {
        await client.query(
          'INSERT INTO waffles (id, name, description, cost, image, ingredients) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING',
          [w.id, w.name, w.description, w.cost, w.image, JSON.stringify(w.ingredients)]
        );
      }
      for (const m of seeds.INITIAL_MENU) {
        await client.query(
          'INSERT INTO menu (id, type, reference_id, name, price, is_visible) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING',
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
