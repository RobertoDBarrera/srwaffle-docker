const { pool, isPostgres } = require('./pool');
const { readJSON, writeJSON } = require('./jsonUtils');

const getStock = async () => {
  if (isPostgres()) {
    const res = await pool.query(`
      SELECT p.id, p.name, p.category, p.min_stock, p.base_unit_id as unit, 
             COALESCE(SUM(l.quantity_current), 0) as stock,
             (SELECT unit_cost FROM stock_lots WHERE product_id = p.id AND quantity_current > 0 ORDER BY created_at ASC LIMIT 1) as cost,
             (SELECT purchase_quantity FROM stock_lots WHERE product_id = p.id ORDER BY created_at DESC LIMIT 1) as purchase_quantity,
             (SELECT purchase_unit FROM stock_lots WHERE product_id = p.id ORDER BY created_at DESC LIMIT 1) as purchase_unit,
             (SELECT total_cost FROM stock_lots WHERE product_id = p.id ORDER BY created_at DESC LIMIT 1) as total_cost,
             p.portion_size, p.price_per_portion
      FROM products p
      LEFT JOIN stock_lots l ON p.id = l.product_id
      GROUP BY p.id
    `);
    return res.rows.map(r => ({
      id: r.id, name: r.name, category: r.category,
      stock: parseFloat(r.stock), minStock: parseFloat(r.min_stock), unit: r.unit,
      cost: parseFloat(r.cost || 0), 
      purchase_quantity: parseFloat(r.purchase_quantity || 0),
      purchase_unit: r.purchase_unit || '',
      total_cost: parseFloat(r.total_cost || 0),
      portion_size: parseFloat(r.portion_size), price_per_portion: parseFloat(r.price_per_portion)
    }));
  }
  return readJSON('stock.json', []);
};

const getStockItem = async (id) => {
  if (isPostgres()) {
    const res = await pool.query(`
      SELECT p.id, p.name, p.category, p.min_stock, p.base_unit_id as unit, 
             COALESCE(SUM(l.quantity_current), 0) as stock,
             (SELECT unit_cost FROM stock_lots WHERE product_id = p.id AND quantity_current > 0 ORDER BY created_at ASC LIMIT 1) as cost,
             p.portion_size, p.price_per_portion
      FROM products p
      LEFT JOIN stock_lots l ON p.id = l.product_id
      WHERE p.id = $1
      GROUP BY p.id
    `, [id]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id, name: r.name, category: r.category,
      stock: parseFloat(r.stock), minStock: parseFloat(r.min_stock), unit: r.unit,
      cost: parseFloat(r.cost || 0), portion_size: parseFloat(r.portion_size), price_per_portion: parseFloat(r.price_per_portion)
    };
  }
  const stock = readJSON('stock.json', []);
  return stock.find(i => i.id === id) || null;
};

const createStockItem = async (item) => {
  item.id = item.id || 'st_' + Date.now();
  if (isPostgres()) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'INSERT INTO products (id, name, category, base_unit_id, min_stock, cost_method, portion_size, price_per_portion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [item.id, item.name, item.category, item.unit || 'g', item.minStock || 0, 'FIFO', item.portion_size || 0, item.price_per_portion || 0]
      );
      if (item.stock > 0) {
        const lotRes = await client.query(
          "INSERT INTO stock_lots (product_id, warehouse_id, quantity_initial, quantity_current, unit_cost, purchase_quantity, purchase_unit, total_cost) VALUES ($1, 'dep_principal', $2, $3, $4, $5, $6, $7) RETURNING id",
          [item.id, item.stock, item.stock, item.cost || 0, item.purchase_quantity || item.stock, item.purchase_unit || item.unit, item.total_cost || (item.stock * (item.cost || 0))]
        );
        await client.query(
          "INSERT INTO stock_movements (product_id, warehouse_id, type, reason, quantity, unit_cost, lot_id) VALUES ($1, 'dep_principal', 'IN', 'INITIAL', $2, $3, $4)",
          [item.id, item.stock, item.cost || 0, lotRes.rows[0].id]
        );
      }
      await client.query('COMMIT');
    } catch(err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else {
    const stock = readJSON('stock.json', []);
    stock.push(item);
    writeJSON('stock.json', stock);
  }
  return item;
};

const updateStockItem = async (id, item) => {
  if (isPostgres()) {
    await pool.query(
      'UPDATE products SET name=$1, category=$2, min_stock=$3, base_unit_id=$4, portion_size=$5, price_per_portion=$6 WHERE id=$7',
      [item.name, item.category, item.minStock, item.unit, item.portion_size, item.price_per_portion, id]
    );
  } else {
    const stock = readJSON('stock.json', []);
    const idx = stock.findIndex(i => i.id === id);
    if (idx !== -1) {
      stock[idx] = { ...stock[idx], ...item };
      writeJSON('stock.json', stock);
    }
  }
  return item;
};

const deleteStockItem = async (id) => {
  if (isPostgres()) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM stock_movements WHERE product_id = $1', [id]);
      await client.query('DELETE FROM stock_lots WHERE product_id = $1', [id]);
      await client.query('DELETE FROM product_presentations WHERE product_id = $1', [id]);
      await client.query('DELETE FROM products WHERE id = $1', [id]);
      await client.query('COMMIT');
    } catch(e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } else {
    let stock = readJSON('stock.json', []);
    stock = stock.filter(i => i.id !== id);
    writeJSON('stock.json', stock);
  }
  return { id };
};

const updateStockQuantity = async (id, delta) => {
  if (isNaN(delta) || delta === null || delta === undefined) {
    throw new Error('Cantidad inválida para actualizar stock');
  }
  if (isPostgres()) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (delta > 0) {
        // Restock
        const lotRes = await client.query(
          "INSERT INTO stock_lots (product_id, warehouse_id, quantity_initial, quantity_current, unit_cost) VALUES ($1, 'dep_principal', $2, $3, 0) RETURNING id",
          [id, delta, delta]
        );
        await client.query(
          "INSERT INTO stock_movements (product_id, warehouse_id, type, reason, quantity, unit_cost, lot_id) VALUES ($1, 'dep_principal', 'IN', 'RESTOCK', $2, 0, $3)",
          [id, delta, lotRes.rows[0].id]
        );
      } else {
        // Consumption (FIFO Logic)
        let remaining = Math.abs(delta);
        const lots = await client.query('SELECT id, quantity_current, unit_cost FROM stock_lots WHERE product_id = $1 AND quantity_current > 0 ORDER BY created_at ASC FOR UPDATE', [id]);
        for (const lot of lots.rows) {
          if (remaining <= 0) break;
          const deduct = Math.min(parseFloat(lot.quantity_current), remaining);
          await client.query('UPDATE stock_lots SET quantity_current = quantity_current - $1 WHERE id = $2', [deduct, lot.id]);
          await client.query(
            "INSERT INTO stock_movements (product_id, warehouse_id, type, reason, quantity, unit_cost, lot_id) VALUES ($1, 'dep_principal', 'OUT', 'PRODUCTION', $2, $3, $4)",
            [id, deduct, lot.unit_cost, lot.id]
          );
          remaining -= deduct;
        }
        if (remaining > 0) {
           const lotRes = await client.query(
            "INSERT INTO stock_lots (product_id, warehouse_id, quantity_initial, quantity_current, unit_cost) VALUES ($1, 'dep_principal', 0, $2, 0) RETURNING id",
            [id, -remaining]
          );
          await client.query(
            "INSERT INTO stock_movements (product_id, warehouse_id, type, reason, quantity, unit_cost, lot_id) VALUES ($1, 'dep_principal', 'OUT', 'NEGATIVE_ADJ', $2, 0, $3)",
            [id, remaining, lotRes.rows[0].id]
          );
        }
      }
      await client.query('COMMIT');
    } catch(err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else {
    const stock = readJSON('stock.json', []);
    const idx = stock.findIndex(i => i.id === id);
    if (idx !== -1) {
      stock[idx].stock += delta;
      writeJSON('stock.json', stock);
    }
  }
};

const restockItem = async (id, stockToAdd, purchase_quantity, purchase_unit, total_cost) => {
  if (isPostgres()) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const unit_cost = total_cost / stockToAdd;
      const lotRes = await client.query(
        "INSERT INTO stock_lots (product_id, warehouse_id, quantity_initial, quantity_current, unit_cost, purchase_quantity, purchase_unit, total_cost) VALUES ($1, 'dep_principal', $2, $3, $4, $5, $6, $7) RETURNING id",
        [id, stockToAdd, stockToAdd, unit_cost, purchase_quantity, purchase_unit, total_cost]
      );
      await client.query(
        "INSERT INTO stock_movements (product_id, warehouse_id, type, reason, quantity, unit_cost, lot_id) VALUES ($1, 'dep_principal', 'IN', 'RESTOCK', $2, $3, $4)",
        [id, stockToAdd, unit_cost, lotRes.rows[0].id]
      );
      await client.query('COMMIT');
    } catch(err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};

const getHistory = async (id) => {
  if (isPostgres()) {
    const res = await pool.query(
      "SELECT type, reason, quantity, unit_cost, created_at FROM stock_movements WHERE product_id = $1 ORDER BY created_at DESC LIMIT 50",
      [id]
    );
    return res.rows;
  }
  return [];
};

module.exports = {
  getStock, getStockItem, createStockItem, updateStockItem, deleteStockItem, updateStockQuantity, restockItem, getHistory
};
